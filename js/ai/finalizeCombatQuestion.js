import { composeCombatStemTextFromBlocks } from "./combatTextBlocks.js";
import { normalizeLatexCurrency } from "./latexPostprocess.js";
import { sanitizeLlmProseString } from "./llmProseSanitize.js";
import { combatQuestionRequiresDiagram, parsePlotlySpec, synthesizeQuantityStoryPlotlySpec } from "./plotlyQuestionHeuristics.js";
import { hasRenderableCombatGom, hasRenderableCombatVisual } from "./combatVisualSvg.js";

function extractNumericTokens(s) {
    const text = String(s ?? "");
    /** @type {Set<string>} */
    const out = new Set();
    // Integers/decimals with optional leading sign; ignore commas (1,000) by removing them first.
    const cleaned = text.replace(/,/g, "");
    const re = /(^|[^\w])(-?\d+(?:\.\d+)?)(?![\w])/g;
    let m;
    while ((m = re.exec(cleaned))) {
        const raw = m[2];
        // Canonicalize decimals so 3.50 === 3.5 and 0.30 === 0.3.
        // Keep as string tokens (no locale); avoid scientific notation by using Number -> String for typical sizes.
        const n = Number(raw);
        if (Number.isFinite(n)) out.add(String(n));
        else out.add(raw);
    }
    return out;
}

function extractMathSegmentsFromTextStem(stem) {
    const s = String(stem ?? "");
    /** @type {string[]} */
    const math = [];
    /** @type {string[]} */
    const prose = [];
    let last = 0;
    const re = /\\\(([\s\S]*?)\\\)/g;
    let m;
    while ((m = re.exec(s))) {
        const i = m.index;
        if (i > last) prose.push(s.slice(last, i));
        math.push(m[1] ?? "");
        last = i + m[0].length;
    }
    if (last < s.length) prose.push(s.slice(last));
    return { math: math.join("\n"), prose: prose.join("\n") };
}

function assertProseNumbersAppearInMath({ prose, math }) {
    const proseNums = extractNumericTokens(prose);
    if (proseNums.size === 0) return;
    const mathNums = extractNumericTokens(math);
    // Only enforce when the question actually presents formal math text (equation/expressions).
    // Some valid stems are pure prose (no inline equation shown) and should not be rejected here.
    if (mathNums.size === 0) return;

    /** @type {string[]} */
    const missing = [];
    for (const n of proseNums) {
        if (!mathNums.has(n)) missing.push(n);
    }
    if (missing.length) {
        throw new Error(
            "Numeric consistency: story prose contains numbers not present in the formal math (" +
                missing.slice(0, 8).join(", ") +
                (missing.length > 8 ? ", …" : "") +
                ")"
        );
    }
}

function parseNumericAnswer(s) {
    const t = String(s ?? "").trim();
    if (!t) return null;
    // Accept plain numeric answers like "38" or "38 cm" or "$38.00" (currency normalized elsewhere).
    const m = t.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
}

function tryEvalSimpleArithmeticFromLatex(latex) {
    const s0 = String(latex ?? "");
    if (!s0.trim()) return null;
    // Reject if it contains letters (variables, \pi, subscripts) — we only evaluate pure numeric arithmetic.
    if (/[a-zA-Z]/.test(s0.replace(/\\times/g, "").replace(/\\cdot/g, ""))) return null;

    let s = s0;
    // Basic LaTeX to JS-ish arithmetic.
    s = s.replace(/\\times|\\cdot/g, "*");
    s = s.replace(/\s+/g, "");
    // Convert simple \frac{a}{b} to (a)/(b)
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");
    // Only allow digits, operators, parentheses, decimal points, and minus.
    if (!/^[0-9+\-*/().]+$/.test(s)) return null;
    try {
        // eslint-disable-next-line no-new-func
        const v = Function(`"use strict"; return (${s});`)();
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    } catch (_) {
        return null;
    }
}

function assertInlineMathMatchesExpectedAnswerIfPureNumeric(q) {
    const expected = parseNumericAnswer(q.expected_answer);
    if (expected == null) return;

    let math = "";
    if (Array.isArray(q.text_blocks) && q.text_blocks.length > 0) {
        math = q.text_blocks
            .filter((b) => b && b.type === "inline_math")
            .map((b) => String(b.latex ?? ""))
            .join("\n");
    } else {
        math = extractMathSegmentsFromTextStem(q.text).math;
    }
    const v = tryEvalSimpleArithmeticFromLatex(math);
    if (v == null) return;
    // Tolerate tiny floating error.
    if (Math.abs(v - expected) > 1e-9) {
        throw new Error(
            `Numeric consistency: expected_answer ${String(expected)} does not match computed value ${String(v)} from inline math`
        );
    }
}

/** Apply LaTeX/prose sanitization after Zod parse. Diagrams: visual_type + visual_spec (GOM) or plotly_spec. */
export function finalizeCombatQuestion(q) {
    if (Array.isArray(q.text_blocks) && q.text_blocks.length > 0) {
        q.text = composeCombatStemTextFromBlocks(q.text_blocks);
    } else {
        q.text = sanitizeLlmProseString(normalizeLatexCurrency(String(q.text ?? "")));
    }
    q.ideal_explanation = sanitizeLlmProseString(normalizeLatexCurrency(q.ideal_explanation));
    q.expected_answer = sanitizeLlmProseString(normalizeLatexCurrency(q.expected_answer));
    q.success_criteria = sanitizeLlmProseString(String(q.success_criteria));
    if (/```/.test(q.text) || /```/.test(q.ideal_explanation)) {
        throw new Error("model output still contained ``` after sanitization");
    }
    if (q.visual_type === "plotly" && !parsePlotlySpec(q.plotly_spec)) {
        q.visual_type = "none";
        q.plotly_spec = "";
    }
    if (q.visual_type === "gom" && !hasRenderableCombatGom(q)) {
        q.visual_type = "none";
        q.visual_spec = null;
    }
    if (combatQuestionRequiresDiagram(q) && !hasRenderableCombatVisual(q)) {
        const syn = synthesizeQuantityStoryPlotlySpec(q);
        if (syn) {
            q.visual_type = "plotly";
            q.plotly_spec = syn;
            q.visual_spec = null;
        }
    }

    // Enforce that story prose numbers are grounded in the formal math presented to the student.
    // This intentionally rejects "flavor numbers" because they frequently drift from the equation.
    try {
        if (Array.isArray(q.text_blocks) && q.text_blocks.length > 0) {
            const prose = q.text_blocks
                .filter((b) => b && b.type === "prose")
                .map((b) => String(b.content ?? ""))
                .join("\n");
            const math = q.text_blocks
                .filter((b) => b && b.type === "inline_math")
                .map((b) => String(b.latex ?? ""))
                .join("\n");
            assertProseNumbersAppearInMath({ prose, math });
        } else {
            const seg = extractMathSegmentsFromTextStem(q.text);
            assertProseNumbersAppearInMath(seg);
        }
        assertInlineMathMatchesExpectedAnswerIfPureNumeric(q);
    } catch (e) {
        // Bubble as a validation-style error so the caller triggers a regenerate.
        throw e;
    }

    if ("_thought_process" in q) delete q._thought_process;
    return q;
}

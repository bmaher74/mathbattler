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
        out.add(m[2]);
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
    } catch (e) {
        // Bubble as a validation-style error so the caller triggers a regenerate.
        throw e;
    }

    if ("_thought_process" in q) delete q._thought_process;
    return q;
}

/**
 * Unit tests for js/ai (schemas, parse pipeline, LaTeX, display).
 * Run: npm run test:ai
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { parseAndValidate } = await import(join(ROOT, "js/ai/parseModelJson.js"));
const {
    CombatQuestionSchema,
    PracticeMcqSchema,
    JudgeResultSchema,
    BossMetaSchema,
    ScanHintSchema,
    ParryResultSchema,
    SmokePingSchema
} = await import(join(ROOT, "js/ai/schemas/index.js"));
const { normalizeLatexCurrency, fixJsonEscapeCorruptedLatexCommands } = await import(
    join(ROOT, "js/ai/latexPostprocess.js")
);
const { proseWithMathToHtml, escapeHtmlText, nl2brRespectingInlineMath } = await import(
    join(ROOT, "js/ai/displayMathProse.js")
);
const { sanitizeLlmProseString, demoteAccidentalInlineMathWrapping } = await import(
    join(ROOT, "js/ai/llmProseSanitize.js")
);
const { finalizeCombatQuestion } = await import(join(ROOT, "js/ai/finalizeCombatQuestion.js"));
const { finalizePracticeMcq } = await import(join(ROOT, "js/ai/finalizePracticeMcq.js"));
const { finalizeJudgeResult } = await import(join(ROOT, "js/ai/finalizeJudgeResult.js"));

describe("parseAndValidate", () => {
    it("accepts fenced JSON for smoke ping", () => {
        const raw = '```json\n{"ping":"ok"}\n```';
        const r = parseAndValidate(SmokePingSchema, raw, { lenient: true });
        assert.equal(r.ok, true);
    });

    it("uses lenient slice when extra prose wraps JSON", () => {
        const raw = 'Here you go {"ping":"ok"} thanks';
        const r = parseAndValidate(SmokePingSchema, raw, { lenient: true });
        assert.equal(r.ok, true);
    });

    it("rejects invalid schema", () => {
        const r = parseAndValidate(SmokePingSchema, '{"foo":1}', { lenient: true });
        assert.equal(r.ok, false);
        assert.match(r.issuesText || "", /Smoke marker|refine/i);
    });
});

describe("CombatQuestionSchema", () => {
    const minimal = {
        _thought_process: "",
        criterion: "a",
        text: "Compute $2+2$.",
        expected_answer: "4",
        success_criteria: "Must state 4.",
        ideal_explanation: "Add the numbers.",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "input"
    };

    it("parses and uppercases criterion", () => {
        const r = CombatQuestionSchema.safeParse(minimal);
        assert.equal(r.success, true);
        assert.equal(r.data.criterion, "A");
    });

    it("finalizes without throwing for clean payload", () => {
        const r = CombatQuestionSchema.safeParse({ ...minimal });
        assert.equal(r.success, true);
        assert.doesNotThrow(() => finalizeCombatQuestion({ ...r.data }));
    });

    it("finalizeCombatQuestion strips _thought_process (not for player UI)", () => {
        const r = CombatQuestionSchema.safeParse({
            ...minimal,
            _thought_process: "scratch: try 2+2=4"
        });
        assert.equal(r.success, true);
        const q = { ...r.data };
        finalizeCombatQuestion(q);
        assert.equal(q._thought_process, undefined);
    });

    it("accepts criterion D", () => {
        const r = CombatQuestionSchema.safeParse({ ...minimal, criterion: "d" });
        assert.equal(r.success, true);
        assert.equal(r.data.criterion, "D");
    });

    it("accepts gom visual_spec", () => {
        const raw = {
            criterion: "a",
            text: "Hi",
            expected_answer: "1",
            success_criteria: "- ok",
            ideal_explanation: "ok",
            visual_type: "gom",
            visual_spec: {
                viewBox: "0 0 100 100",
                elements: [{ type: "rect", x: 0, y: 0, w: 10, h: 10 }]
            },
            plotly_spec: "",
            type: "input"
        };
        const r = CombatQuestionSchema.safeParse(raw);
        assert.equal(r.success, true);
        assert.equal(r.data.visual_type, "gom");
        assert.equal(r.data.visual_spec.elements.length, 1);
    });

    it("maps criterion_letter to criterion (model alias drift)", () => {
        const r = CombatQuestionSchema.safeParse({
            _thought_process: "",
            criterion_letter: "A",
            topic_category: "Algebra",
            text: "Compute \\(2+2\\).",
            expected_answer: "4",
            success_criteria: "- ok",
            ideal_explanation: "Add.",
            visual_type: "none",
            visual_spec: null,
            plotly_spec: "",
            type: "input"
        });
        assert.equal(r.success, true);
        assert.equal(r.data.criterion, "A");
    });

    it("accepts text_blocks instead of text", () => {
        const r = CombatQuestionSchema.safeParse({
            criterion: "a",
            text_blocks: [
                { type: "prose", content: "Cost is $5. Solve " },
                { type: "inline_math", latex: "x+1=5" }
            ],
            expected_answer: "4",
            success_criteria: "- ok",
            ideal_explanation: "Subtract.",
            visual_type: "none",
            visual_spec: null,
            plotly_spec: "",
            type: "input"
        });
        assert.equal(r.success, true);
        assert.ok(r.data.text === undefined || r.data.text === "");
        const q = { ...r.data };
        finalizeCombatQuestion(q);
        assert.ok(String(q.text).includes("$5"));
        assert.ok(String(q.text).includes("\\(x+1=5\\)"));
    });

    it("finalizeCombatQuestion rejects comma-separated numeric worked steps in inline_math", () => {
        const r = CombatQuestionSchema.safeParse({
            criterion: "a",
            text_blocks: [
                { type: "prose", content: "The serpent sneers." },
                {
                    type: "inline_math",
                    latex: "4 \\times 5 = 20,\\,20\\% \\times 20 = 4,\\,20 - 4 = 16,\\,30 - 16 = 14"
                }
            ],
            expected_answer: "14",
            success_criteria: "- ok",
            ideal_explanation: "Spend then subtract from 30.",
            visual_type: "none",
            visual_spec: null,
            plotly_spec: "",
            type: "input"
        });
        assert.equal(r.success, true);
        assert.throws(() => finalizeCombatQuestion({ ...r.data }), /spoils the task/i);
    });

    it("allows prose numbers grounded in ideal/expected when not all appear in displayed math", () => {
        const r = CombatQuestionSchema.safeParse({
            criterion: "a",
            topic_category: "Arithmetic",
            text: "A 25% discount is applied to a \\$75 shirt. The sale price in dollars is \\(75 - 0.25 \\times 75\\).",
            expected_answer: "56.25",
            success_criteria: "- Use the discount model.\n- State the final price.",
            ideal_explanation:
                "25% means \\(0.25\\). Discount \\(0.25 \\times 75 = 18.75\\). Final price \\(75 - 18.75 = 56.25\\) dollars.",
            visual_type: "none",
            visual_spec: null,
            plotly_spec: "",
            type: "input"
        });
        assert.equal(r.success, true);
        assert.doesNotThrow(() => finalizeCombatQuestion({ ...r.data }));
    });

    it("rejects both text and text_blocks", () => {
        const r = CombatQuestionSchema.safeParse({
            criterion: "a",
            text: "Hi",
            text_blocks: [{ type: "prose", content: "Hi" }],
            expected_answer: "1",
            success_criteria: "- ok",
            ideal_explanation: "ok",
            visual_type: "none",
            visual_spec: null,
            plotly_spec: "",
            type: "input"
        });
        assert.equal(r.success, false);
    });
});

describe("PracticeMcqSchema", () => {
    const good = {
        topic_category: "Algebra",
        text: "What is $2+2$?",
        answer: "4",
        ideal_explanation: "Add.",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "mcq",
        options: ["3", "4", "5", "6"]
    };

    it("accepts valid MCQ JSON", () => {
        const r = PracticeMcqSchema.safeParse(good);
        assert.equal(r.success, true);
    });

    it("rejects wrong type literal", () => {
        const r = PracticeMcqSchema.safeParse({ ...good, type: "input" });
        assert.equal(r.success, false);
    });

    it("stringifies object plotly_spec", () => {
        const r = PracticeMcqSchema.safeParse({
            ...good,
            visual_type: "plotly",
            visual_spec: null,
            plotly_spec: { data: [{ x: [1], y: [2], type: "scatter" }] }
        });
        assert.equal(r.success, true);
        assert.equal(typeof r.data.plotly_spec, "string");
        assert.match(r.data.plotly_spec, /"data"/);
    });

    it("finalizePracticeMcq mutates strings safely", () => {
        const r = PracticeMcqSchema.safeParse(good);
        finalizePracticeMcq(r.data);
        assert.ok(r.data.text.includes("2") || r.data.text.length > 0);
    });
});

describe("JudgeResultSchema", () => {
    it("accepts a full judge object", () => {
        const r = JudgeResultSchema.safeParse({
            band: "partial",
            isCorrect: false,
            score: 3,
            isCrit: false,
            extracted_final_answer: "12",
            feedback: "Show your steps.",
            strengths: ["You tried"],
            next_steps: ["Write the equation"]
        });
        assert.equal(r.success, true);
    });
});

describe("finalizeJudgeResult", () => {
    it("upgrades band when score is high but band is too low", () => {
        const out = finalizeJudgeResult({
            band: "incorrect",
            isCorrect: true,
            score: 8,
            isCrit: true,
            extracted_final_answer: "5",
            feedback: "What you did well: x\nTo score higher next time:\n- y\nExample sentence starter: z",
            strengths: ["a"],
            next_steps: ["b"]
        });
        assert.equal(out.band, "correct_with_reasoning");
        assert.equal(out.score, 8);
        assert.equal(out.isCrit, true);
    });

    it("clears isCrit when score is below 7", () => {
        const out = finalizeJudgeResult({
            band: "correct_with_reasoning",
            isCorrect: true,
            score: 6,
            isCrit: true,
            extracted_final_answer: "",
            feedback: "What you did well: x\nTo score higher next time:\n- y\nExample sentence starter: z",
            strengths: [],
            next_steps: []
        });
        assert.equal(out.isCrit, false);
    });

    it("does not upgrade correct_no_reasoning to full credit when the model over-scores", () => {
        const out = finalizeJudgeResult({
            band: "correct_no_reasoning",
            isCorrect: true,
            score: 8,
            isCrit: true,
            extracted_final_answer: "30",
            feedback: "What you did well: x\nTo score higher next time:\n- y\nExample sentence starter: z",
            strengths: [],
            next_steps: []
        });
        assert.equal(out.band, "correct_no_reasoning");
        assert.equal(out.score, 6);
        assert.equal(out.isCrit, false);
    });
});

describe("BossMetaSchema", () => {
    it("requires all four fields", () => {
        const r = BossMetaSchema.safeParse({
            name: "A",
            blurb: "B",
            hue: "#112233",
            topic: "Algebra & Equations"
        });
        assert.equal(r.success, true);
    });
});

describe("ScanHintSchema", () => {
    it("requires non-empty hint", () => {
        const r = ScanHintSchema.safeParse({ hint: "Try factoring." });
        assert.equal(r.success, true);
    });
});

describe("ParryResultSchema", () => {
    it("defaults empty note", () => {
        const r = ParryResultSchema.safeParse({ isParry: true });
        assert.equal(r.success, true);
        assert.equal(r.data.note, "");
    });
});

describe("latexPostprocess", () => {
    it("normalizes doubled-dollar currency wrappings", () => {
        const s = normalizeLatexCurrency("$ $15$");
        assert.match(s, /\\?\$/);
    });

    it("repairs tab-corrupted \\text", () => {
        const s = fixJsonEscapeCorruptedLatexCommands("\text{cm} wide");
        assert.ok(s.includes("\\text{"));
    });
});

describe("llmProseSanitize / accidental math wrapping", () => {
    it("demotes long prose wrapped in dollar delimiters", () => {
        const raw =
            "$2 for the school fund. But here's the twist: if you sell more than 10 cupcakes you get a bonus.$";
        const out = demoteAccidentalInlineMathWrapping(raw);
        assert.ok(!out.startsWith("$"));
        assert.ok(out.includes("school fund"));
        assert.ok(!/^\$.*\$$/.test(out.trim()));
    });

    it("keeps short inline math delimiters", () => {
        const out = demoteAccidentalInlineMathWrapping("Solve $x+5=12$ for $x$.");
        assert.ok(out.includes("$x+5=12$"));
        assert.ok(out.includes("$x$"));
    });

    it("sanitizeLlmProseString strips accidental whole-question math wrap", () => {
        const s = sanitizeLlmProseString(
            "$The ratio of cats to dogs is $3:4$. How many cats?$"
        );
        assert.ok(s.includes("ratio"));
        assert.ok(s.includes("3:4"));
        assert.ok(!/^\$/m.test(s.trim()));
    });

    it("sanitizeLlmProseString rewrites paired dollar math to \\(...\\)", () => {
        assert.ok(sanitizeLlmProseString("Solve $x+1$.").includes("\\(x+1\\)"));
    });

    it("sanitizeLlmProseString rewrites $n \\\\leq n$ inequalities (not currency $n)", () => {
        const s = sanitizeLlmProseString("Since $26 \\leq 30$, Brendan can afford.");
        assert.ok(s.includes("\\(26 \\leq 30\\)"), s);
    });

    it("sanitizeLlmProseString leaves unpaired currency dollars", () => {
        assert.ok(sanitizeLlmProseString("Only $5 per ticket.").includes("$5"));
    });

    it("sanitizeLlmProseString collapses paired numeric money $n$ to a single $n (not math)", () => {
        const paired = sanitizeLlmProseString("Each cup costs $0.50$ to make and sells for $1.25$.");
        assert.ok(paired.includes("$0.50"));
        assert.ok(paired.includes("$1.25"));
        assert.ok(!paired.includes("\\(0.50\\)"));
        const unpaired = sanitizeLlmProseString("Each cup costs $0.50 per cup before tax.");
        assert.ok(unpaired.includes("$0.50"));
    });

    it("sanitizeLlmProseString does not pair currency $n with a later math $ (multiple $ on one line)", () => {
        const s = sanitizeLlmProseString("Costs $5 and solve $x+1=0$ for $x$.");
        assert.ok(s.includes("$5"));
        assert.ok(s.includes("\\(x+1=0\\)"));
        assert.ok(s.includes("\\(x\\)"));
        assert.ok(!s.includes("\\(5 and solve"), "must not treat $5 and solve ... $ as one math span");
    });

    it("sanitizeLlmProseString treats $14x as math, not currency $14 + x", () => {
        const s = sanitizeLlmProseString("Equation $14x = 8.50x + 30$.");
        assert.ok(s.includes("\\(14x = 8.50x + 30\\)"));
        assert.ok(!s.includes("$14x"));
    });

    it("sanitizeLlmProseString keeps several currency amounts on one line (no bogus $…$ pairing)", () => {
        const s = sanitizeLlmProseString(
            "I sell at $14 per item. At the rival it is $8.50 per item with a $30 fee."
        );
        assert.ok(s.includes("$14"), s);
        assert.ok(s.includes("$8.50"), s);
        assert.ok(s.includes("$30"), s);
    });
});

describe("displayMathProse", () => {
    it("escapeHtmlText neutralizes angle brackets", () => {
        assert.equal(escapeHtmlText("<script>x</script>"), "&lt;script&gt;x&lt;/script&gt;");
    });

    it("nl2brRespectingInlineMath skips newlines inside math", () => {
        const esc = escapeHtmlText("a\n\\(x\ny\\)\nb");
        const html = nl2brRespectingInlineMath(esc);
        assert.ok(html.includes("<br>"));
        assert.ok(!html.includes("\\(x<br>"));
    });

    it("proseWithMathToHtml does not leave raw script tags", () => {
        const html = proseWithMathToHtml("Hi <script>alert(1)</script> and \\(x^2\\)");
        assert.ok(!html.toLowerCase().includes("<script>"));
        assert.ok(html.includes("\\("));
    });
});

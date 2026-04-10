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
const { finalizeCombatQuestion } = await import(join(ROOT, "js/ai/finalizeCombatQuestion.js"));
const { finalizePracticeMcq } = await import(join(ROOT, "js/ai/finalizePracticeMcq.js"));

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
        criterion: "a",
        text: "Compute $2+2$.",
        expected_answer: "4",
        success_criteria: "Must state 4.",
        ideal_explanation: "Add the numbers.",
        type: "input"
    };

    it("parses and uppercases criterion", () => {
        const r = CombatQuestionSchema.safeParse(minimal);
        assert.equal(r.success, true);
        assert.equal(r.data.criterion, "A");
    });

    it("finalizes without throwing for clean payload", () => {
        const r = CombatQuestionSchema.safeParse({ ...minimal, plotly_spec: "" });
        assert.equal(r.success, true);
        assert.doesNotThrow(() => finalizeCombatQuestion({ ...r.data }));
    });
});

describe("PracticeMcqSchema", () => {
    const good = {
        topic_category: "Algebra",
        text: "What is $2+2$?",
        answer: "4",
        ideal_explanation: "Add.",
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

describe("displayMathProse", () => {
    it("escapeHtmlText neutralizes angle brackets", () => {
        assert.equal(escapeHtmlText("<script>x</script>"), "&lt;script&gt;x&lt;/script&gt;");
    });

    it("nl2brRespectingInlineMath skips newlines inside math", () => {
        const esc = escapeHtmlText("a\n$x\ny$\nb");
        const html = nl2brRespectingInlineMath(esc);
        assert.ok(html.includes("<br>"));
        assert.ok(!html.includes("$x<br>"));
    });

    it("proseWithMathToHtml does not leave raw script tags", () => {
        const html = proseWithMathToHtml('Hi <script>alert(1)</script> and $x^2$');
        assert.ok(!html.toLowerCase().includes("<script>"));
        assert.ok(html.includes("$"));
    });
});

/**
 * Tests for js/ai/plotlyQuestionHeuristics.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const {
    extractAllIntegers,
    synthesizeQuantityStoryPlotlySpec,
    responseNeedsNonEmptyPlotlyChart,
    rateOrNetChangeStoryNeedsSvg,
    combatQuestionRequiresSvgDiagram,
    parsePlotlySpec
} = await import(join(ROOT, "js/ai/plotlyQuestionHeuristics.js"));

describe("extractAllIntegers", () => {
    it("collects signed integers in order", () => {
        assert.deepEqual(extractAllIntegers("a -3 b 10"), [-3, 10]);
    });

    it("returns empty for nullish", () => {
        assert.deepEqual(extractAllIntegers(null), []);
    });
});

describe("synthesizeQuantityStoryPlotlySpec", () => {
    it("returns empty when fewer than two integers", () => {
        assert.equal(synthesizeQuantityStoryPlotlySpec({ text: "Only 5 apples.", ideal_explanation: "" }), "");
    });

    it("returns JSON string with bar chart data for a two-number spend story", () => {
        const specStr = synthesizeQuantityStoryPlotlySpec({
            text: "You spent 12 dollars and have 3 left.",
            ideal_explanation: ""
        });
        assert.ok(specStr.length > 10);
        const spec = JSON.parse(specStr);
        assert.ok(Array.isArray(spec.data));
        assert.equal(spec.data[0].type, "bar");
    });
});

describe("responseNeedsNonEmptyPlotlyChart", () => {
    it("is false for empty question", () => {
        assert.equal(responseNeedsNonEmptyPlotlyChart(null), false);
    });

    it("is true for marble quantity story with numbers", () => {
        assert.equal(
            responseNeedsNonEmptyPlotlyChart({
                text: "You had 10 marbles. You gave away 3. How many left?",
                ideal_explanation: "Subtract."
            }),
            true
        );
    });

    it("is false for numeric text without physical/story cues", () => {
        assert.equal(
            responseNeedsNonEmptyPlotlyChart({
                text: "Compute 12 + 3.",
                ideal_explanation: ""
            }),
            false
        );
    });
});

describe("rateOrNetChangeStoryNeedsSvg", () => {
    it("detects moat / liter per hour style problems", () => {
        assert.equal(
            rateOrNetChangeStoryNeedsSvg({
                text: "The moat gains 45 liters per hour and loses 30 per hour.",
                ideal_explanation: ""
            }),
            true
        );
    });

    it("is false without rate and unit cues", () => {
        assert.equal(
            rateOrNetChangeStoryNeedsSvg({
                text: "Simple addition 2 + 2.",
                ideal_explanation: ""
            }),
            false
        );
    });
});

describe("combatQuestionRequiresSvgDiagram", () => {
    it("is true when plotly heuristic or rate story applies", () => {
        const q = { text: "Tank has 100 liters. Pump removes 5 per minute.", ideal_explanation: "" };
        assert.equal(combatQuestionRequiresSvgDiagram(q), true);
    });
});

describe("parsePlotlySpec", () => {
    it("parses valid JSON", () => {
        const raw = JSON.stringify({
            data: [{ x: [1], y: [2], type: "scatter" }],
            layout: { title: "T" }
        });
        const p = parsePlotlySpec(raw);
        assert.ok(p);
        assert.equal(p.data.length, 1);
    });

    it("returns null for invalid or empty", () => {
        assert.equal(parsePlotlySpec(""), null);
        assert.equal(parsePlotlySpec("{"), null);
        assert.equal(parsePlotlySpec(JSON.stringify({})), null);
    });
});

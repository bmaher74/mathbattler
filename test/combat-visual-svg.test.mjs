/**
 * Tests for js/ai/combatVisualSvg.js (DOM-free helpers).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const {
    getDarkPlotlyLayoutBase,
    hasRenderableCombatGom,
    hasRenderableCombatPlotly,
    hasRenderableCombatVisual,
    hasRenderableCombatSvg
} = await import(join(ROOT, "js/ai/combatVisualSvg.js"));

const minimalGom = {
    viewBox: "0 0 100 100",
    elements: [{ type: "rect", x: 0, y: 0, w: 1, h: 1 }]
};

const minimalPlotly = JSON.stringify({
    data: [{ type: "bar", x: ["A"], y: [1] }],
    layout: {}
});

describe("hasRenderableCombatGom", () => {
    it("is true for gom visual_type with valid spec", () => {
        assert.equal(hasRenderableCombatGom({ visual_type: "gom", visual_spec: minimalGom }), true);
    });

    it("is false when not gom", () => {
        assert.equal(hasRenderableCombatGom({ visual_type: "none", visual_spec: minimalGom }), false);
    });
});

describe("hasRenderableCombatPlotly", () => {
    it("is true for plotly visual_type with valid JSON", () => {
        assert.equal(hasRenderableCombatPlotly({ visual_type: "plotly", plotly_spec: minimalPlotly }), true);
    });

    it("is false when plotly_spec invalid", () => {
        assert.equal(hasRenderableCombatPlotly({ visual_type: "plotly", plotly_spec: "{}" }), false);
    });
});

describe("hasRenderableCombatVisual", () => {
    it("accepts gom or plotly", () => {
        assert.equal(hasRenderableCombatVisual({ visual_type: "gom", visual_spec: minimalGom, plotly_spec: "" }), true);
        assert.equal(
            hasRenderableCombatVisual({ visual_type: "plotly", visual_spec: null, plotly_spec: minimalPlotly }),
            true
        );
    });
});

describe("hasRenderableCombatSvg (alias)", () => {
    it("delegates to combined visual check", () => {
        assert.equal(hasRenderableCombatSvg({ visual_type: "gom", visual_spec: minimalGom }), true);
    });
});

describe("getDarkPlotlyLayoutBase", () => {
    it("returns transparent dark-theme layout defaults for Plotly.merge", () => {
        const L = getDarkPlotlyLayoutBase();
        assert.equal(L.paper_bgcolor, "transparent");
        assert.match(String(L.plot_bgcolor), /rgba/);
        assert.equal(L.font.color, "#e5e7eb");
        assert.equal(L.autosize, true);
        assert.ok(L.margin && L.xaxis?.gridcolor && L.yaxis?.gridcolor);
    });
});

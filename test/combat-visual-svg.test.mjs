/**
 * Tests for js/ai/combatVisualSvg.js (DOM-free helpers).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { hasRenderableCombatSvg, synthesizeQuantityStorySvgSpec } = await import(
    join(ROOT, "js/ai/combatVisualSvg.js")
);

describe("hasRenderableCombatSvg", () => {
    const minimalSvg =
        "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect x='1' y='1' width='1' height='1'/></svg>";

    it("is true for svg visual_type with viewBox", () => {
        assert.equal(hasRenderableCombatSvg({ visual_type: "svg", svg_spec: minimalSvg }), true);
    });

    it("is false when not svg type", () => {
        assert.equal(hasRenderableCombatSvg({ visual_type: "none", svg_spec: minimalSvg }), false);
    });

    it("is false when svg_spec lacks viewBox", () => {
        assert.equal(hasRenderableCombatSvg({ visual_type: "svg", svg_spec: "<svg><circle/></svg>" }), false);
    });
});

describe("synthesizeQuantityStorySvgSpec", () => {
    it("returns empty when not enough integers", () => {
        assert.equal(synthesizeQuantityStorySvgSpec({ text: "One number 5.", ideal_explanation: "" }), "");
    });

    it("returns svg string with viewBox for two-number story", () => {
        const s = synthesizeQuantityStorySvgSpec({
            text: "Start with 10 apples. Spend 3. How many left?",
            ideal_explanation: ""
        });
        assert.ok(s.startsWith("<svg "));
        assert.ok(s.includes("viewBox='0 0 100 100'"));
        assert.ok(s.includes("<rect"));
    });
});

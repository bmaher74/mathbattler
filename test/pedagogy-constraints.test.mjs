/**
 * Prompt constraint helpers in combatQuestionPedagogy.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { strandShapeRequirement, buildMypConstraintsBlock, criterionFocusBlock } = await import(
    join(ROOT, "js/ai/prompts/combatQuestionPedagogy.js")
);

describe("strandShapeRequirement", () => {
    it("returns non-empty guidance for Algebra", () => {
        const s = strandShapeRequirement("Algebra");
        assert.ok(s.length > 40);
        assert.match(s, /variable|equation/i);
    });

    it("falls back for unknown topic", () => {
        const s = strandShapeRequirement("QuantumTopology");
        assert.ok(s.includes("Align"));
    });
});

describe("buildMypConstraintsBlock", () => {
    it("uses on-ramp band for map level 1", () => {
        const b = buildMypConstraintsBlock(1);
        assert.ok(b.includes("On-ramp"));
        assert.ok(b.includes("map level 1"));
        assert.ok(b.includes("CURRICULUM"));
    });

    it("includes band label for low levels", () => {
        const b = buildMypConstraintsBlock(2);
        assert.ok(b.includes("Foundations"));
        assert.ok(b.includes("CURRICULUM"));
    });

    it("uses Year 8 band for high levels", () => {
        const b = buildMypConstraintsBlock(10);
        assert.ok(b.includes("Year 8"));
    });
});

describe("criterionFocusBlock", () => {
    it("returns A block by default", () => {
        assert.ok(criterionFocusBlock("").includes("CRITERION A"));
    });

    it("returns D for applying in context", () => {
        assert.ok(criterionFocusBlock("d").includes("CRITERION D"));
    });
});

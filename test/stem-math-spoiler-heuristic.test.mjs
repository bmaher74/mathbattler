/**
 * js/ai/stemMathSpoilerHeuristic.js — block LLM “ledger” math in player-visible stems.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { latexHasCommaSeparatedNumericWorkedSteps } = await import(
    join(ROOT, "js/ai/stemMathSpoilerHeuristic.js")
);

describe("latexHasCommaSeparatedNumericWorkedSteps", () => {
    it("flags comma-separated discount-style chains", () => {
        const bad =
            "4 \\times 5 = 20,\\,20\\% \\times 20 = 4,\\,20 - 4 = 16,\\,30 - 16 = 14";
        assert.equal(latexHasCommaSeparatedNumericWorkedSteps(bad), true);
    });

    it("allows a single evaluated step", () => {
        assert.equal(latexHasCommaSeparatedNumericWorkedSteps("4 \\times 5 = 20"), false);
    });

    it("allows unevaluated expressions", () => {
        assert.equal(latexHasCommaSeparatedNumericWorkedSteps("4 \\times 5"), false);
        assert.equal(latexHasCommaSeparatedNumericWorkedSteps("0.20 \\times (4 \\times 5)"), false);
    });

    it("allows sequence notation with commas (letters on lhs)", () => {
        assert.equal(latexHasCommaSeparatedNumericWorkedSteps("a_1 = 3,\\,d = 2"), false);
    });

    it("allows coordinate-style lists without equals chains", () => {
        assert.equal(latexHasCommaSeparatedNumericWorkedSteps("1,\\,2,\\,3"), false);
    });
});

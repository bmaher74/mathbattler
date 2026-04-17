/**
 * Graduated per-level difficulty knobs (js/game/levelDifficulty.js).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { getLevelDifficultyKnobs, formatDifficultyKnobsPromptBlock } = await import(
    join(ROOT, "js/game/levelDifficulty.js")
);

describe("getLevelDifficultyKnobs", () => {
    it("ramps numeric ceiling and stem cap with level", () => {
        const a = getLevelDifficultyKnobs(1);
        const b = getLevelDifficultyKnobs(10);
        assert.ok(a.numericCeiling < b.numericCeiling);
        assert.ok(a.maxStemWords <= b.maxStemWords);
    });

    it("treats forceEasier like level 1", () => {
        const easy = getLevelDifficultyKnobs(99, { forceEasier: true });
        const one = getLevelDifficultyKnobs(1);
        assert.equal(easy.numericCeiling, one.numericCeiling);
        assert.equal(easy.maxConceptualSteps, one.maxConceptualSteps);
    });

    it("allows multi-step from level 4", () => {
        assert.equal(getLevelDifficultyKnobs(3).allowMultiStep, false);
        assert.equal(getLevelDifficultyKnobs(4).allowMultiStep, true);
    });
});

describe("formatDifficultyKnobsPromptBlock", () => {
    it("includes ceiling and DIFFICULTY SCAFFOLD header", () => {
        const b = formatDifficultyKnobsPromptBlock(getLevelDifficultyKnobs(5));
        assert.match(b, /DIFFICULTY SCAFFOLD/);
        assert.match(b, /≤ 70/);
        assert.match(b, /Anti-spoiler/);
    });
});

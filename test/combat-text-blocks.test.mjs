/**
 * Tests for js/ai/combatTextBlocks.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { composeCombatStemTextFromBlocks } = await import(join(ROOT, "js/ai/combatTextBlocks.js"));

describe("composeCombatStemTextFromBlocks", () => {
    it("joins prose and inline_math with blank lines between kinds", () => {
        const out = composeCombatStemTextFromBlocks([
            { type: "prose", content: "Find x when" },
            { type: "inline_math", latex: "x+1=2" }
        ]);
        assert.ok(out.includes("\\(x+1=2\\)"));
        assert.ok(out.includes("\n\n"));
    });

    it("strips dollar wrappers from latex", () => {
        const out = composeCombatStemTextFromBlocks([{ type: "inline_math", latex: "$x$" }]);
        assert.equal(out.trim(), "\\(x\\)");
    });

    it("throws on unknown block type", () => {
        assert.throws(
            () => composeCombatStemTextFromBlocks([{ type: "bad", content: "x" }]),
            /Unknown text_blocks/
        );
    });
});

/**
 * Tests for js/ai/prompts/mathBattleSeeds.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { pickSeededIndex } = await import(join(ROOT, "js/ai/prompts/mathBattleSeeds.js"));

describe("pickSeededIndex", () => {
    it("is deterministic for same nonce and salt", () => {
        assert.equal(pickSeededIndex("n1", "salt", 17), pickSeededIndex("n1", "salt", 17));
    });

    it("returns value in [0, modulo)", () => {
        const m = 13;
        for (let i = 0; i < 50; i++) {
            const v = pickSeededIndex(`x${i}`, "s", m);
            assert.ok(v >= 0 && v < m);
        }
    });

    it("changes when salt changes", () => {
        const a = pickSeededIndex("same", "a", 100);
        const b = pickSeededIndex("same", "b", 100);
        assert.notEqual(a, b);
    });
});

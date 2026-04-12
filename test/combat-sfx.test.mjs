/**
 * Tests for js/combatSfx.js pure helpers (no Web Audio playback).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { bossStrikeSoundIndex, setCombatSfxUserGain } = await import(join(ROOT, "js/combatSfx.js"));

describe("setCombatSfxUserGain", () => {
    it("accepts edge volumes without throwing", () => {
        assert.doesNotThrow(() => {
            setCombatSfxUserGain(0);
            setCombatSfxUserGain(1);
            setCombatSfxUserGain(0.5);
            setCombatSfxUserGain(-1);
            setCombatSfxUserGain(99);
            setCombatSfxUserGain(NaN);
        });
    });
});

describe("bossStrikeSoundIndex", () => {
    it("maps canonical levels 1..n to slot indices 0..n-1", () => {
        assert.equal(bossStrikeSoundIndex(1, "ignored", 10), 0);
        assert.equal(bossStrikeSoundIndex(10, "ignored", 10), 9);
    });

    it("uses hash path when level is outside 1..canonicalBossCount", () => {
        const idx = bossStrikeSoundIndex(11, "TestBoss", 10);
        assert.ok(idx >= 0 && idx < 16);
        assert.equal(bossStrikeSoundIndex(11, "TestBoss", 10), idx);
    });

    it("uses FNV-style hash for levels beyond canonical count", () => {
        const a = bossStrikeSoundIndex(25, "Dragon", 10);
        const b = bossStrikeSoundIndex(25, "Dragon", 10);
        assert.equal(a, b);
        assert.ok(a >= 0 && a < 16);
    });

    it("defaults canonicalBossCount to 10 when zero or negative", () => {
        assert.equal(bossStrikeSoundIndex(5, "x", 0), 4);
        assert.equal(bossStrikeSoundIndex(5, "x", -3), 4);
    });

    it("treats non-finite level as 1", () => {
        assert.equal(bossStrikeSoundIndex(NaN, "y", 10), 0);
    });
});

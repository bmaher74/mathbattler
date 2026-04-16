/**
 * Tests for js/ai/prompts/combatQuestionPedagogy.js (topic rotation & profile helpers).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const {
    CANONICAL_SKILL_TOPICS,
    SKILL_TOPIC_MIN_SAMPLES,
    enemyNameForMapLevel,
    normalizeSkillProfile,
    mergeSkillProfiles,
    canonicalizeReportedTopic,
    pickBattlePinnedTopic,
    pickRetentionTopic,
    buildCombatQuestionUserPrompt
} = await import(join(ROOT, "js/ai/prompts/combatQuestionPedagogy.js"));

describe("enemyNameForMapLevel", () => {
    it("wraps modulo quest enemy list", () => {
        assert.ok(typeof enemyNameForMapLevel(1) === "string");
        assert.equal(enemyNameForMapLevel(1), enemyNameForMapLevel(1 + 10 * CANONICAL_SKILL_TOPICS.length));
    });
});

describe("normalizeSkillProfile", () => {
    it("returns Algebra fallback for bad input", () => {
        const p = normalizeSkillProfile(null);
        assert.ok(p.Algebra);
    });

    it("accepts legacy a/c keys", () => {
        const p = normalizeSkillProfile({ Geometry: { a: 2, c: 1 } });
        assert.equal(p.Geometry.attempts, 2);
        assert.equal(p.Geometry.corrects, 1);
    });
});

describe("mergeSkillProfiles", () => {
    it("takes max attempts and corrects per topic", () => {
        const m = mergeSkillProfiles(
            { Algebra: { attempts: 1, corrects: 0 } },
            { Algebra: { attempts: 5, corrects: 3 } }
        );
        assert.equal(m.Algebra.attempts, 5);
        assert.equal(m.Algebra.corrects, 3);
    });
});

describe("canonicalizeReportedTopic", () => {
    it("maps synonyms to canonical labels", () => {
        assert.equal(canonicalizeReportedTopic("fractions"), "Fractions & Percent");
        assert.equal(canonicalizeReportedTopic("probability quiz"), "Data & Probability");
    });

    it("defaults empty to Arithmetic", () => {
        assert.equal(canonicalizeReportedTopic(""), "Arithmetic");
    });
});

describe("pickBattlePinnedTopic", () => {
    it("returns first under-sampled strand in canonical order on weak-focus turns (seq % 3 === 0)", () => {
        const topic = pickBattlePinnedTopic({}, 0);
        assert.equal(topic, "Algebra");
    });

    it("picks strand with lowest success ratio on weak-focus turns when all have min samples", () => {
        const profile = {};
        for (const t of CANONICAL_SKILL_TOPICS) {
            profile[t] = { attempts: SKILL_TOPIC_MIN_SAMPLES, corrects: SKILL_TOPIC_MIN_SAMPLES };
        }
        profile.Algebra = { attempts: 10, corrects: 2 };
        const topic = pickBattlePinnedTopic(profile, 0);
        assert.equal(topic, "Algebra");
    });

    it("breaks equal success ratios by canonical order (weak-focus turn)", () => {
        const profile = {};
        for (const t of CANONICAL_SKILL_TOPICS) {
            profile[t] = { attempts: 4, corrects: 4 };
        }
        assert.equal(pickBattlePinnedTopic(profile, 99), "Algebra");
    });

    it("ignores negative strandRotationSeq for seq (uses 0)", () => {
        const profile = {};
        for (const t of CANONICAL_SKILL_TOPICS) {
            profile[t] = { attempts: 4, corrects: 4 };
        }
        assert.equal(pickBattlePinnedTopic(profile, -1), pickBattlePinnedTopic(profile, 0));
    });

    it("uses rotation slot on variety turns (seq % 3 !== 0)", () => {
        const profile = {};
        for (const t of CANONICAL_SKILL_TOPICS) {
            profile[t] = { attempts: 10, corrects: 10 };
        }
        // seq=1 is a variety turn, so it should pick rotation slot 1.
        assert.equal(pickBattlePinnedTopic(profile, 1), CANONICAL_SKILL_TOPICS[1]);
    });
});

describe("pickRetentionTopic", () => {
    it("returns a canonical topic using rng", () => {
        const rng = () => 0.1;
        const t = pickRetentionTopic({}, rng);
        assert.ok(CANONICAL_SKILL_TOPICS.includes(t));
    });
});

describe("buildCombatQuestionUserPrompt", () => {
    it("passes hero evolution tier into the combat block for taunt tone", () => {
        const b = buildCombatQuestionUserPrompt({
            mapLevel: 4,
            turnIndex: 0,
            skillProfile: null,
            strandRotationSeq: 0,
            playerName: "Test",
            enemyName: "Goblin",
            cosmeticsTier: 4
        });
        assert.match(b.prompt, /Hero evolution tier[^\n]*: 4/);
    });
});

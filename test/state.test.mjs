/**
 * Tests for js/state.js (pure helpers + boss cache persistence with mocked localStorage).
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const {
    BOSS_CACHE_LS_KEY,
    BOSS_CACHE_SCHEMA_VERSION,
    loadBossCache,
    saveBossCache,
    svgInnerMarkup,
    normalizeQuestionStem,
    stemNumberMultisetKey,
    stemsShareHeavyNumberMultiset,
    rememberQuestionStem,
    state,
    MAX_RECENT_STEMS
} = await import(join(ROOT, "js/state.js"));

let lsStore = /** @type {Record<string, string>} */ ({});
let origLocalStorage = globalThis.localStorage;

beforeEach(() => {
    lsStore = {};
    globalThis.localStorage = {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(lsStore, k) ? lsStore[k] : null),
        setItem: (k, v) => {
            lsStore[k] = String(v);
        },
        removeItem: (k) => {
            delete lsStore[k];
        },
        clear: () => {
            lsStore = {};
        },
        key: () => null,
        get length() {
            return Object.keys(lsStore).length;
        }
    };
    state.recentQuestionStems = [];
});

afterEach(() => {
    globalThis.localStorage = origLocalStorage;
});

describe("normalizeQuestionStem", () => {
    it("trims, lowercases, collapses whitespace, strips zero-width chars", () => {
        assert.equal(normalizeQuestionStem("  Foo \u200b Bar\n\tbaz  "), "foo bar baz");
    });

    it("handles nullish", () => {
        assert.equal(normalizeQuestionStem(null), "");
        assert.equal(normalizeQuestionStem(undefined), "");
    });
});

describe("stemNumberMultisetKey", () => {
    it("returns sorted comma-separated integers from text", () => {
        assert.equal(stemNumberMultisetKey("30 moat 45 and 600"), "30,45,600");
    });

    it("returns empty when no digits", () => {
        assert.equal(stemNumberMultisetKey("no numbers"), "");
    });
});

describe("stemsShareHeavyNumberMultiset", () => {
    it("is true when same multiset and enough distinct numbers", () => {
        assert.equal(
            stemsShareHeavyNumberMultiset("a 1 2 3 4 story", "b 4 3 2 1 different words", 4),
            true
        );
    });

    it("is false when multiset differs", () => {
        assert.equal(stemsShareHeavyNumberMultiset("1 2 3 4", "1 2 3 5", 4), false);
    });

    it("is false when below minCount", () => {
        assert.equal(stemsShareHeavyNumberMultiset("1 2 3", "3 2 1", 4), false);
    });
});

describe("svgInnerMarkup", () => {
    it("extracts content between first > and </svg>", () => {
        const s = "<svg viewBox='0 0 10 10'><circle/></svg>";
        assert.equal(svgInnerMarkup(s), "<circle/>");
    });

    it("returns empty for invalid svg", () => {
        assert.equal(svgInnerMarkup(""), "");
        assert.equal(svgInnerMarkup("<svg>"), "");
    });
});

describe("loadBossCache / saveBossCache", () => {
    it("returns {} for missing key", () => {
        assert.deepEqual(loadBossCache(), {});
    });

    it("returns {} for wrong schema version", () => {
        localStorage.setItem(BOSS_CACHE_LS_KEY, JSON.stringify({ v: 0, levels: {} }));
        assert.deepEqual(loadBossCache(), {});
    });

    it("round-trips valid level ≥11 entries", () => {
        const svg = "<svg viewBox='0 0 1 1' xmlns='http://www.w3.org/2000/svg'></svg>";
        saveBossCache({
            11: {
                name: "Boss",
                blurb: "Hi",
                hue: "#000000",
                topic: "Algebra",
                battleSvg: svg,
                mapSvg: svg,
                createdAt: 1
            }
        });
        const raw = localStorage.getItem(BOSS_CACHE_LS_KEY);
        assert.ok(raw);
        const parsed = JSON.parse(raw);
        assert.equal(parsed.v, BOSS_CACHE_SCHEMA_VERSION);
        const loaded = loadBossCache();
        assert.equal(loaded[11].name, "Boss");
        assert.ok(loaded[11].battleSvg.startsWith("<svg"));
    });

    it("drops levels below 11 on load", () => {
        const svg = "<svg viewBox='0 0 1 1' xmlns='http://www.w3.org/2000/svg'></svg>";
        localStorage.setItem(
            BOSS_CACHE_LS_KEY,
            JSON.stringify({
                v: BOSS_CACHE_SCHEMA_VERSION,
                levels: {
                    "5": { name: "x", blurb: "x", hue: "#fff", topic: "A", battleSvg: svg, mapSvg: svg }
                }
            })
        );
        assert.deepEqual(loadBossCache(), {});
    });
});

describe("rememberQuestionStem", () => {
    it("dedupes and caps list length", () => {
        const prev = [...state.recentQuestionStems];
        try {
            for (let i = 0; i < MAX_RECENT_STEMS + 5; i++) {
                rememberQuestionStem(`Question number ${i} unique`);
            }
            assert.ok(state.recentQuestionStems.length <= MAX_RECENT_STEMS);
            const uniq = new Set(state.recentQuestionStems);
            assert.equal(uniq.size, state.recentQuestionStems.length);
        } finally {
            state.recentQuestionStems = prev;
        }
    });
});

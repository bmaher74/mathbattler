export const appId = typeof __app_id !== "undefined" ? __app_id : "math-adventure-global";

export const state = {
    playerName: null,
    unlockedLevels: 1,
    currentLevel: 1,
    playerHP: 100,
    enemyHP: 100,
    isAnimating: false,
    turnIndex: 0,
    skillProfile: null,
    nextQuestion: null,
    activeQuestion: null,
    /** Rolling recent stems to reduce repeated LLM questions across battles/sessions. */
    recentQuestionStems: [],
    /** Meta-progression */
    shards: 0,
    cosmeticsTier: 0,
    bestiary: [],
    /** Combat juice state */
    comboCount: 0,
    comboActive: false,
    potionUsedThisBattle: false,
    forceEasierNextQuestion: false,
    nextEnemyAttackZero: false,
    requireReflection: false,
    /** LLM-generated boss metadata + SVGs for levels > 10. Keyed by level number. */
    bossCacheByLevel: {},
    lastCloudSyncAt: null,
    cloudSyncError: null,
    /** Set when live AI prefetch fails — shown on map banner */
    aiOfflineHint: null,
    /** Short technical detail for tooltips / buffer line (e.g. HTTP 429) */
    lastPrefetchError: null
};

export function safeSet(id, val, prop = "innerText") {
    const el = document.getElementById(id);
    if (el) {
        if (prop.includes(".")) {
            const parts = prop.split(".");
            el[parts[0]][parts[1]] = val;
        } else {
            el[prop] = val;
        }
    }
    return el;
}

export const RECENT_STEMS_LS_KEY = "mb_recent_question_stems_v1";
export const MAX_RECENT_STEMS = 24;
export const BOSS_CACHE_LS_KEY = "mb_boss_cache_v1";
export const BOSS_CACHE_SCHEMA_VERSION = 1;

export function loadBossCache() {
    try {
        const raw = localStorage.getItem(BOSS_CACHE_LS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== "object") return {};
        if (parsed.v !== BOSS_CACHE_SCHEMA_VERSION) return {};
        const levels = parsed.levels && typeof parsed.levels === "object" ? parsed.levels : {};
        const out = {};
        for (const [k, v] of Object.entries(levels)) {
            const n = parseInt(k, 10);
            if (!Number.isFinite(n) || n < 11) continue;
            if (!v || typeof v !== "object") continue;
            if (typeof v.name !== "string" || typeof v.blurb !== "string" || typeof v.hue !== "string") continue;
            if (typeof v.topic !== "string") continue;
            if (typeof v.battleSvg !== "string" || !v.battleSvg.trim().startsWith("<svg")) continue;
            if (typeof v.mapSvg !== "string" || !v.mapSvg.trim().startsWith("<svg")) continue;
            out[n] = {
                name: v.name,
                blurb: v.blurb,
                hue: v.hue,
                topic: v.topic,
                battleSvg: v.battleSvg,
                mapSvg: v.mapSvg,
                createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now()
            };
        }
        return out;
    } catch (_) {
        return {};
    }
}

export function saveBossCache(cache) {
    try {
        const levels = {};
        for (const [k, v] of Object.entries(cache || {})) {
            const n = parseInt(k, 10);
            if (!Number.isFinite(n) || n < 11) continue;
            if (!v || typeof v !== "object") continue;
            levels[String(n)] = {
                name: String(v.name || ""),
                blurb: String(v.blurb || ""),
                hue: String(v.hue || ""),
                topic: String(v.topic || ""),
                battleSvg: String(v.battleSvg || ""),
                mapSvg: String(v.mapSvg || ""),
                createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now()
            };
        }
        localStorage.setItem(BOSS_CACHE_LS_KEY, JSON.stringify({ v: BOSS_CACHE_SCHEMA_VERSION, levels }));
    } catch (_) {}
}

export function svgInnerMarkup(svg) {
    const s = String(svg || "");
    const a = s.indexOf(">");
    const b = s.lastIndexOf("</svg>");
    if (a < 0 || b < 0 || b <= a) return "";
    return s.slice(a + 1, b);
}

export function loadRecentStems() {
    try {
        const raw = localStorage.getItem(RECENT_STEMS_LS_KEY);
        const arr = raw ? JSON.parse(raw) : null;
        if (Array.isArray(arr)) {
            state.recentQuestionStems = arr.filter((x) => typeof x === "string" && x.trim()).slice(0, MAX_RECENT_STEMS);
        }
    } catch (_) {
        state.recentQuestionStems = [];
    }
}

export function saveRecentStems() {
    try {
        localStorage.setItem(RECENT_STEMS_LS_KEY, JSON.stringify(state.recentQuestionStems.slice(0, MAX_RECENT_STEMS)));
    } catch (_) {}
}

export function normalizeQuestionStem(t) {
    return (t == null ? "" : String(t))
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

export function rememberQuestionStem(text) {
    const norm = normalizeQuestionStem(text);
    if (!norm) return;
    state.recentQuestionStems = [norm, ...state.recentQuestionStems.filter((s) => s !== norm)].slice(0, MAX_RECENT_STEMS);
    saveRecentStems();
}


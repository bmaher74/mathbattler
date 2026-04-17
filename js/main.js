import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
import { callGenerateCombatQuestionWithBackoff, callGenerateCombatQuestion } from "./ai/gemini.js";

import { ASSETS, BOSS_ASSETS } from "./assets.js";
import {
    MAX_COSMETIC_TIER,
    COSMETIC_EVOLUTION_OPTIONS,
    buildCosmeticEvolutionExtra,
    buildHeroWeaponOverlay,
    cosmeticEvolutionTitle,
    weaponDamageMultiplier
} from "./cosmeticEvolution.js";
import { pickEnemyTaunt } from "./enemyTaunts.js";
import { startMapBgmFromUserGesture, startCombatBgmFromUserGesture, wireBgmVisibility } from "./bgm.js";
import {
    playHeroSpellImpact,
    playEnemyStrike,
    bossStrikeSoundIndex,
    playVsEncounterSwoosh,
    playVsPortraitThud,
    playMagicChargeUp,
    playJudgeSpellFizzle,
    resumeCombatSfxContext
} from "./combatSfx.js";
import {
    mergeProfileAudio,
    applyAudioFromState,
    normalizeAudioSettings,
    patchAudioSettings
} from "./audioSettings.js";
import {
    appId,
    state,
    safeSet,
    loadBossCache,
    saveBossCache,
    svgInnerMarkup,
    loadRecentStems,
    saveRecentStems,
    rememberQuestionStem,
    MAX_RECENT_STEMS,
    normalizeQuestionStem,
    stemsShareHeavyNumberMultiset,
    RECENT_STEMS_LS_KEY,
    BOSS_CACHE_LS_KEY,
    BOSS_CACHE_SCHEMA_VERSION
} from "./state.js";
import {
    COMBAT_BOSS_HP,
    COMBAT_COMBO_MULT,
    QUEST_ROUTE,
    EP_SHARD_LOSS_BATTLE,
    EP_SHARD_FIRST_CAST,
    EP_SHARD_PRACTICE,
    EP_PRACTICE_DAILY_CAP,
    EP_SHARD_REFLECTION,
    EP_SHARD_DAILY_QUEST_BATTLE,
    EP_SHARD_LOGIN,
    EP_STREAK_MILESTONE_SHARDS
} from "./game/constants.js";

import { proseWithMathToHtml, escapeHtmlText } from "./ai/displayMathProse.js";
import { parseAndValidate, extractJsonFromModelText, parseJsonLenient } from "./ai/parseModelJson.js";
import {
    CombatQuestionSchema,
    PracticeMcqSchema,
    BossMetaSchema,
    ScanHintSchema,
    ParryResultSchema,
    SmokePingSchema
} from "./ai/schemas/index.js";
import { finalizeCombatQuestion } from "./ai/finalizeCombatQuestion.js";
import { finalizePracticeMcq } from "./ai/finalizePracticeMcq.js";
import { runDashScopeJudge } from "./ai/runDashScopeJudge.js";
import { localFallbackJudge } from "./ai/localFallbackJudge.js";
import { sanitizeLlmProseString } from "./ai/llmProseSanitize.js";
import { LLM_NO_MARKDOWN_IN_STRINGS } from "./ai/prompts/contract.js";
import { getCombatQuestionSystemPrompt } from "./ai/prompts/combatQuestionSystem.js";
import { combatQuestionJsonSchemaResponseFormat } from "./ai/prompts/combatQuestionJsonSchema.js";
import {
    MATH_BATTLE_CONTEXT_SEEDS,
    MATH_BATTLE_DM_DELIVERY_NUDGES,
    pickSeededIndex
} from "./ai/prompts/mathBattleSeeds.js";
import {
    CANONICAL_SKILL_TOPICS,
    normalizeSkillProfile,
    mergeSkillProfiles,
    ensureCanonicalSkillTopicsInPlace,
    canonicalizeReportedTopic,
    buildCombatQuestionUserPrompt,
    pickBattlePinnedTopic
} from "./ai/prompts/combatQuestionPedagogy.js";
import { combatQuestionRequiresDiagram } from "./ai/plotlyQuestionHeuristics.js";
import {
    hasRenderableCombatVisual,
    mountCombatVisual,
    clearCombatVisualMount
} from "./ai/combatVisualSvg.js";

let practiceActiveQuestion = null;
let practiceMcqFetchGeneration = 0;

/** Set in runtime-config.js (Netlify CONTEXT=production). Override with ?debug=1 for QA. */
function isProductionUi() {
    try {
        if (typeof URLSearchParams !== "undefined" && new URLSearchParams(location.search).get("debug") === "1") {
            return false;
        }
    } catch (_) {}
    return !!window.__mathbattler_production_ui__;
}

 // --- ACTIVE INVARIANTS (THE BLACK BOX) ---
// Assets are anchored with specific IDs for regression tests to monitor detail levels.
 function getQuestNode(level) {
    if (level <= QUEST_ROUTE.length) {
        const i = (level - 1) % QUEST_ROUTE.length;
        return QUEST_ROUTE[i];
    }
    const gen = state.bossCacheByLevel?.[level];
    if (gen) {
        return { x: 0, y: 0, name: gen.name, blurb: gen.blurb, hue: gen.hue, topic: gen.topic, _generated: true };
    }
    // Placeholder while generation runs.
    return {
        x: 0,
        y: 0,
        name: `??? (Lv ${level})`,
        blurb: "Summoning a new boss…",
        hue: "#94a3b8",
        topic: "Math",
        _generated: true,
        _missing: true
    };
}
 /** Compact SVG boss portrait for map nodes (viewBox 0 0 100 100). */
function mapBossPortrait(level) {
    if (level > QUEST_ROUTE.length) {
        const gen = state.bossCacheByLevel?.[level];
        if (gen && gen.mapSvg) return svgInnerMarkup(gen.mapSvg) || `<circle cx="50" cy="50" r="22" fill="#0b1024" stroke="#94a3b8" stroke-width="2"/><text x="50" y="56" font-size="16" font-weight="900" fill="#94a3b8" text-anchor="middle">?</text>`;
        return `<circle cx="50" cy="50" r="22" fill="#0b1024" stroke="#94a3b8" stroke-width="2"/><text x="50" y="56" font-size="16" font-weight="900" fill="#94a3b8" text-anchor="middle">…</text>`;
    }
    const i = (level - 1) % 10;
    /** Icon-sized silhouettes aligned with `BOSS_ASSETS` / `ASSETS` battle sprites (viewBox 0 0 100 100). */
    const portraits = [
        // 1 Algebra Slime — droplet base, variable “glasses”, lime eyes
        `<ellipse cx="50" cy="90" rx="34" ry="9" fill="#052e16" opacity="0.55"/><path d="M12 76 Q8 92 18 96 Q24 100 30 92" fill="#064e3b" opacity="0.9"/><path d="M88 76 Q92 92 82 96 Q76 100 70 92" fill="#064e3b" opacity="0.9"/><path d="M14 78 C6 28 30 3 50 3 C70 3 94 28 86 78 Z" fill="#16a34a" stroke="#4ade80" stroke-width="2"/><ellipse cx="50" cy="14" rx="16" ry="10" fill="#22c55e" opacity="0.38"/><polygon points="34,34 46,34 49,47 40,53 31,47" fill="#052e16"/><polygon points="66,34 54,34 51,47 60,53 69,47" fill="#052e16"/><circle cx="40" cy="41" r="4" fill="#bef264"/><circle cx="60" cy="41" r="4" fill="#bef264"/><path d="M40 60 Q50 68 60 60" fill="none" stroke="#052e16" stroke-width="2.6" stroke-linecap="round"/><text x="22" y="24" font-size="8" font-weight="900" fill="#86efac" opacity="0.75">x+y</text>`,
        // 2 Fraction Golem — chiseled head, furnace chest, paired tablets (solid fills — no ids; many nodes on one map)
        `<ellipse cx="50" cy="94" rx="28" ry="5" fill="#0c0a09" opacity="0.45"/><path d="M26 10 L74 10 L78 22 L74 34 L26 34 L22 22 Z" fill="#7c2d12" stroke="#ea580c" stroke-width="2"/><path d="M30 14 H70" stroke="#9a3412" stroke-width="1.2" opacity="0.55"/><rect x="22" y="40" width="56" height="32" rx="5" fill="#431407" stroke="#ea580c" stroke-width="2"/><circle cx="50" cy="54" r="11" fill="#f97316" opacity="0.85"/><rect x="24" y="48" width="18" height="20" rx="2" fill="#b45309" stroke="#fef3c7" stroke-width="1"/><text x="33" y="60" font-size="7" font-weight="900" fill="#fffbeb" text-anchor="middle">1</text><line x1="27" y1="63" x2="39" y2="63" stroke="#fffbeb" stroke-width="1.2"/><text x="33" y="70" font-size="7" font-weight="900" fill="#fffbeb" text-anchor="middle">4</text><text x="50" y="62" font-size="9" fill="#fffbeb" text-anchor="middle" font-weight="900">+</text><rect x="58" y="48" width="18" height="20" rx="2" fill="#9a3412" stroke="#fef3c7" stroke-width="1"/><text x="67" y="60" font-size="7" font-weight="900" fill="#fffbeb" text-anchor="middle">1</text><line x1="61" y1="63" x2="73" y2="63" stroke="#fffbeb" stroke-width="1.2"/><text x="67" y="70" font-size="7" font-weight="900" fill="#fffbeb" text-anchor="middle">4</text><circle cx="38" cy="22" r="2.2" fill="#fde047"/><circle cx="62" cy="22" r="2.2" fill="#fde047"/>`,
        // 3 Percentile Parasite — tick abdomen, radial legs, % core
        `<ellipse cx="50" cy="90" rx="20" ry="5" fill="#450a0a" opacity="0.5"/><ellipse cx="50" cy="66" rx="18" ry="12" fill="#4c0519" stroke="#9f1239" stroke-width="1.2"/><path d="M50 54 L12 18" stroke="#be123c" stroke-width="3.2" stroke-linecap="round"/><path d="M50 54 L88 18" stroke="#be123c" stroke-width="3.2" stroke-linecap="round"/><path d="M50 56 L16 74" stroke="#be123c" stroke-width="3.2" stroke-linecap="round"/><path d="M50 56 L84 74" stroke="#be123c" stroke-width="3.2" stroke-linecap="round"/><path d="M50 58 L32 94" stroke="#be123c" stroke-width="3.2" stroke-linecap="round"/><path d="M50 58 L68 94" stroke="#be123c" stroke-width="3.2" stroke-linecap="round"/><circle cx="50" cy="44" r="15" fill="#881337" stroke="#fecdd3" stroke-width="2"/><text x="50" y="50" font-size="13" font-weight="900" fill="#fff1f2" text-anchor="middle">%</text><circle cx="43" cy="40" r="2.4" fill="#0b1024"/><circle cx="57" cy="40" r="2.4" fill="#0b1024"/>`,
        // 4 Fibonacci Serpent — coil, spiral, triangular eye
        `<path d="M18 82 C22 48 38 28 52 26 C72 24 88 38 84 54 C80 70 58 76 44 70 C28 64 24 48 38 38 C52 28 72 32 78 48" fill="none" stroke="#065f46" stroke-width="9" stroke-linecap="round" opacity="0.92"/><path d="M50 50 Q70 30 80 60 T40 80 T20 40 T70 10" fill="none" stroke="#34d399" stroke-width="3.2" opacity="0.85"/><path d="M72 18 L88 24 L82 38 L70 34 Z" fill="#065f46" stroke="#10b981" stroke-width="1.2"/><polygon points="75,15 80,10 85,15" fill="#34d399"/><text x="22" y="22" font-family="monospace" font-size="7" font-weight="900" fill="#a7f3d0" opacity="0.8">1,1,2…</text>`,
        // 5 Geo-Dragon — crystal wings, hex core, horns
        `<path d="M78 88 Q88 78 92 88" fill="none" stroke="#6b21a8" stroke-width="5" stroke-linecap="round" opacity="0.8"/><polygon points="12,52 34,30 40,58 22,72" fill="#4c1d95" stroke="#c4b5fd" stroke-width="1.4" opacity="0.92"/><polygon points="88,52 66,30 60,58 78,72" fill="#4c1d95" stroke="#c4b5fd" stroke-width="1.4" opacity="0.92"/><path d="M40 18 L50 8 L60 18 L66 30 L50 26 L34 30 Z" fill="#4c1d95" stroke="#e9d5ff" stroke-width="1.2"/><polygon points="34,30 50,22 66,30 60,58 40,58" fill="#2e1065" stroke="#e9d5ff" stroke-width="1.6" opacity="0.95"/><polygon points="50,20 62,30 62,52 50,60 38,52 38,30" fill="#9333ea" stroke="#f3e8ff" stroke-width="1.6"/><circle cx="46" cy="40" r="2.6" fill="#0b1024"/><circle cx="54" cy="40" r="2.6" fill="#0b1024"/><text x="50" y="8" font-family="monospace" font-size="7" font-weight="900" fill="#ddd6fe" text-anchor="middle">x,y</text>`,
        // 6 Matrix Minotaur — brackets, bull head, hooves
        `<polyline points="30,22 20,22 20,78 30,78" fill="none" stroke="#9a3412" stroke-width="3.6"/><polyline points="70,22 80,22 80,78 70,78" fill="none" stroke="#9a3412" stroke-width="3.6"/><ellipse cx="50" cy="30" rx="20" ry="14" fill="#422006" stroke="#fdba74" stroke-width="1.8"/><path d="M32 24 Q38 8 50 14 Q62 8 68 24" fill="none" stroke="#fdba74" stroke-width="3"/><path d="M32 24 L28 10 L36 16 Z M68 24 L72 10 L64 16 Z" fill="#57534e"/><rect x="34" y="48" width="32" height="36" rx="6" fill="#451a03" stroke="#fdba74" stroke-width="1.8"/><circle cx="42" cy="30" r="3" fill="#fde047"/><circle cx="58" cy="30" r="3" fill="#fde047"/><text x="50" y="84" font-family="monospace" font-size="9" font-weight="900" fill="#fdba74" text-anchor="middle">[ ]</text>`,
        // 7 Probability Wraith — hood, bell curve, pip dice
        `<path d="M18 88 C14 52 28 22 50 20 C72 22 86 52 82 88 Q66 82 50 86 Q34 82 18 88 Z" fill="#0b1024" stroke="#93c5fd" stroke-width="1.8" opacity="0.92"/><path d="M10 90 Q50 14 90 90" fill="none" stroke="#60a5fa" stroke-width="2.8" opacity="0.55"/><rect x="40" y="38" width="20" height="20" rx="3" fill="#1e3a8a" stroke="#bfdbfe" stroke-width="1.8"/><circle cx="45" cy="44" r="1.5" fill="#e0f2fe"/><circle cx="55" cy="52" r="1.5" fill="#e0f2fe"/><circle cx="45" cy="56" r="1.5" fill="#e0f2fe"/><circle cx="55" cy="56" r="1.5" fill="#e0f2fe"/><circle cx="44" cy="50" r="2.6" fill="#0b1024"/><circle cx="56" cy="50" r="2.6" fill="#0b1024"/>`,
        // 8 Velocity Vanguard — kite shield, velocity spear, helm
        `<polygon points="30,40 50,30 70,40 50,80" fill="#374151" stroke="#9ca3af" stroke-width="2"/><line x1="10" y1="90" x2="90" y2="10" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/><path d="M32 28 H68 L66 20 Q50 12 34 20 Z" fill="#4b5563" stroke="#d1d5db" stroke-width="1.4"/><rect x="34" y="34" width="32" height="28" rx="5" fill="#0b1024" opacity="0.88" stroke="#9ca3af" stroke-width="1.6"/><circle cx="44" cy="46" r="2.6" fill="#fcd34d"/><circle cx="56" cy="46" r="2.6" fill="#fcd34d"/><text x="50" y="26" font-family="monospace" font-size="7" font-weight="900" fill="#fde68a" text-anchor="middle">v=d/t</text>`,
        // 9 Axiom Sentinel — obelisk, golden rings, central eye
        `<path d="M38 92 L42 32 L50 20 L58 32 L62 92 Z" fill="#1c1917" stroke="#a16207" stroke-width="1.8" opacity="0.94"/><circle cx="50" cy="50" r="34" fill="none" stroke="#eab308" stroke-width="1.6" opacity="0.65"/><circle cx="50" cy="50" r="22" fill="none" stroke="#facc15" stroke-width="1.3" opacity="0.55"/><circle cx="50" cy="50" r="12" fill="#0b1024" stroke="#fde68a" stroke-width="1.8"/><circle cx="50" cy="50" r="4.5" fill="#ffffff"/><text x="50" y="88" font-family="monospace" font-size="8" font-weight="900" fill="#fde68a" text-anchor="middle">x=x</text>`,
        // 10 Logic Leviathan — sea coils, void orb, logic glyphs
        `<path d="M6 88 C20 52 36 44 52 48 C72 52 88 68 94 88" fill="none" stroke="#312e81" stroke-width="7" stroke-linecap="round" opacity="0.55"/><path d="M8 72 C24 40 44 28 58 32" fill="none" stroke="#4338ca" stroke-width="4" stroke-linecap="round" opacity="0.45"/><circle cx="50" cy="52" r="38" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.8" opacity="0.98"/><circle cx="50" cy="52" r="26" fill="none" stroke="#6366f1" stroke-width="1.2" opacity="0.55"/><circle cx="50" cy="52" r="10" fill="#312e81"/><circle cx="46" cy="50" r="2.4" fill="#e0e7ff"/><circle cx="54" cy="50" r="2.4" fill="#e0e7ff"/><text x="26" y="28" font-family="monospace" font-size="7" font-weight="900" fill="#c7d2fe">01</text><text x="60" y="30" font-family="monospace" font-size="7" font-weight="900" fill="#c7d2fe">AND</text>`
    ];
    return portraits[i];
}
 /** Compact boss icon (same markup as map nodes) wrapped for bestiary list tiles. */
function bestiaryBossThumbSvg(level) {
    const lv = typeof level === "number" && level >= 1 ? level : 1;
    return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">${mapBossPortrait(lv)}</svg>`;
}
 /** Full battle sprite — high-detail (map nodes use compact portraits). */
function battleBossSvgMarkup(level) {
    if (level > QUEST_ROUTE.length) {
        const gen = state.bossCacheByLevel?.[level];
        if (gen && gen.battleSvg) return gen.battleSvg;
        return BOSS_ASSETS[BOSS_ASSETS.length - 1] || ASSETS.slime;
    }
    const i = (level - 1) % BOSS_ASSETS.length;
    return BOSS_ASSETS[i] || ASSETS.slime;
}
 function clearBattleDamageOverlay() {
    ["enemy-damage", "player-damage"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = "";
        el.classList.remove("animate-damage");
    });
}
 /** Set by runAiApiRegression (page load) before login; used by the Questions status chip. */
let lastAiConnectivityCheck = { ok: null, summary: "", detail: "" };
let cloudSyncManualInFlight = false;
function readConfigString(v) {
    if (v == null) return "";
    const s = typeof v === "string" ? v : String(v);
    return s.trim();
}
 /** Model id for prompts (default qwen-flash). The API key lives only on the server callable. */
 function getConfiguredAiKeys() {
    const dsModel = readConfigString(typeof window !== "undefined" ? window.__dashscope_model : "") || "qwen-flash";
    return { dsModel };
}
let functionsApi = null;
let callVaultHealthcheck = null;
let callGetPlayerProfile = null;
let callSetPlayerProfile = null;

let auth, currentUser, isFirebaseReady = false;
let loginGateResolved = false;
 function isPromptDebugEnabled() {
    try {
        const qs = new URLSearchParams(location.search);
        if (qs.get("debugPrompts") === "1") return true;
    } catch (_) {}
    try {
        if (typeof window !== "undefined" && window.__debug_ai_prompts === true) return true;
    } catch (_) {}
    try {
        return localStorage.getItem("mb_debug_ai_prompts") === "1";
    } catch (_) {
        return false;
    }
}
 function debugLogAiPrompt(label, prompt) {
    if (!isPromptDebugEnabled()) return;
    try {
        const p = String(prompt ?? "");
        console.groupCollapsed(`AI prompt (${label}) • ${p.length} chars`);
        console.log(p);
        console.groupEnd();
    } catch (_) {}
}
/** Full combat-question LLM I/O for DevTools (system + user + raw JSON string). */
function logCombatQuestionLlmExchange(systemText, userText, assistantText) {
    try {
        const sys = String(systemText ?? "");
        const usr = String(userText ?? "");
        const asst = String(assistantText ?? "");
        console.group(
            `[MathBattler] Combat question LLM • system ${sys.length} / user ${usr.length} / assistant ${asst.length} chars`
        );
        console.log("%cSystem message", "font-weight:700", "\n" + sys);
        console.log("%cUser message (full prompt)", "font-weight:700", "\n" + usr);
        console.log("%cAssistant (raw response)", "font-weight:700", "\n" + asst);
        console.groupEnd();
    } catch (_) {}
}
 function formatSyncAge(ts) {
    if (ts == null) return "";
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 8) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}
 function updateCloudSyncBadge() {
    const root = document.getElementById("cloud-sync-badge");
    const l1 = document.getElementById("cloud-sync-badge-line1");
    const l2 = document.getElementById("cloud-sync-badge-line2");
    const icon = document.getElementById("cloud-sync-badge-icon");
    if (!root || root.classList.contains("hidden") || !l1 || !l2 || !icon) return;
     if (cloudSyncManualInFlight) {
        icon.textContent = "↻";
        l1.textContent = "Syncing…";
        l2.textContent = "Runs in background";
        return;
    }
     if (!isFirebaseReady || !callGetPlayerProfile || !callSetPlayerProfile) {
        icon.textContent = "💾";
        l1.textContent = "Local save";
        l2.textContent = state.lastCloudSyncAt ? `Saved ${formatSyncAge(state.lastCloudSyncAt)}` : "This browser only";
        return;
    }
     if (state.cloudSyncError) {
        icon.textContent = "⚠";
        l1.textContent = "Sync issue";
        l2.textContent = "Tap to retry";
        return;
    }
     icon.textContent = "☁";
    l1.textContent = "Cloud";
    l2.textContent = state.lastCloudSyncAt
        ? `Synced ${formatSyncAge(state.lastCloudSyncAt)}`
        : "Tap to sync";
}
 let cloudSyncBadgeTimeIntervalId = null;
 function showCloudSyncBadge() {
    const root = document.getElementById("cloud-sync-badge");
    if (root) {
        root.classList.remove("hidden");
        updateCloudSyncBadge();
        if (!cloudSyncBadgeTimeIntervalId) {
            cloudSyncBadgeTimeIntervalId = setInterval(() => {
                const b = document.getElementById("cloud-sync-badge");
                if (b && !b.classList.contains("hidden")) updateCloudSyncBadge();
            }, 25000);
        }
    }
}
 /** Click handler: full reconcile; does not block the UI (async IIFE). */
function requestUserSync() {
    if (!state.playerName) return;
    if (cloudSyncManualInFlight) return;
    cloudSyncManualInFlight = true;
    state.cloudSyncError = null;
    updateCloudSyncBadge();
    void (async () => {
        try {
            if (isFirebaseReady && callGetPlayerProfile && callSetPlayerProfile) {
                await reconcileProfileWithCloud();
            } else {
                saveLocalProfile(state.playerName);
                state.lastCloudSyncAt = Date.now();
                state.cloudSyncError = null;
            }
        } catch (e) {
            console.warn("requestUserSync:", e);
            state.cloudSyncError = "failed";
        } finally {
            cloudSyncManualInFlight = false;
            updateCloudSyncBadge();
        }
    })();
}
 function profileStorageKey(name) {
    return "mathbattler_profile_" + encodeURIComponent(name || "default");
}
 /** Canonical strands only — stable shape for [topicRotation] console logs. */
function skillProfileCanonicalSnapshotForLog(sp) {
    const o = {};
    if (!sp || typeof sp !== "object") return o;
    for (const t of CANONICAL_SKILL_TOPICS) {
        const v = sp[t];
        if (v && typeof v === "object") {
            o[t] = {
                attempts: typeof v.attempts === "number" ? v.attempts : 0,
                corrects: typeof v.corrects === "number" ? v.corrects : 0
            };
        }
    }
    return o;
}
 function logTopicRotation(tag, detail) {
    console.log("[topicRotation]", tag, detail);
}
 /** Firestore document id cannot contain `/` (path separator). */
function safeProfileDocId(displayName) {
    return String(displayName || "player").replace(/\//g, "_");
}
 function loadLocalProfile(name) {
    try {
        const raw = localStorage.getItem(profileStorageKey(name));
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (!d || typeof d !== "object") return null;
        if (typeof d.unlockedLevels === "number" && d.unlockedLevels >= 1) return d;
        if (d.skillProfile != null && typeof d.skillProfile === "object" && Object.keys(d.skillProfile).length > 0) {
            return { ...d, unlockedLevels: Math.max(1, typeof d.unlockedLevels === "number" ? d.unlockedLevels : 1) };
        }
    } catch (e) { console.warn("loadLocalProfile", e); }
    return null;
}
 function saveLocalProfile(name) {
    try {
        if (typeof state.unlockedLevels !== "number" || state.unlockedLevels < 1) return;
        const sp = state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null);
        localStorage.setItem(profileStorageKey(name), JSON.stringify({
            unlockedLevels: state.unlockedLevels,
            skillProfile: sp,
            playerName: name,
            shards: typeof state.shards === "number" ? Math.max(0, Math.floor(state.shards)) : 0,
            cosmeticsTier: typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0,
            bestiary: Array.isArray(state.bestiary) ? state.bestiary.slice(0, 200) : [],
            bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {},
            engagement: engagementSnapshotFromState(),
            strandRotationSeq:
                typeof state.strandRotationSeq === "number" && state.strandRotationSeq >= 0
                    ? Math.floor(state.strandRotationSeq)
                    : 0,
            audio: normalizeAudioSettings(state.audio)
        }));
    } catch (e) { console.warn("saveLocalProfile", e); }
}
 function recordCombatSkillOutcome(question, judged) {
    if (!state.skillProfile || typeof state.skillProfile !== "object") state.skillProfile = normalizeSkillProfile(null);
    ensureCanonicalSkillTopicsInPlace(state.skillProfile);
    const topic = canonicalizeReportedTopic(question?.topic_category);
    if (!state.skillProfile[topic]) state.skillProfile[topic] = { attempts: 0, corrects: 0 };
    state.skillProfile[topic].attempts += 1;
    const good = judged?.band === "correct_with_reasoning" || judged?.band === "correct_no_reasoning";
    if (good) state.skillProfile[topic].corrects += 1;
    if (state.playerName) saveLocalProfile(state.playerName);
}

function localDateISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function parseLocalYMD(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
    if (!m) return null;
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}
function calendarDaysBetween(olderYmd, newerYmd) {
    const a = parseLocalYMD(olderYmd);
    const b = parseLocalYMD(newerYmd);
    if (!a || !b) return 999;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function mondayKeyFromYmd(ymd) {
    const d = parseLocalYMD(ymd) || new Date();
    const dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((dow + 6) % 7));
    const y = mon.getFullYear();
    const mo = String(mon.getMonth() + 1).padStart(2, "0");
    const da = String(mon.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
}
function normalizeEngagement(raw) {
    const e = raw && typeof raw === "object" ? raw : {};
    const claimed = Array.isArray(e.streakMilestonesClaimed)
        ? e.streakMilestonesClaimed.map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n))
        : [];
    const fromFlair = Array.isArray(e.earnedFlair)
        ? e.earnedFlair.map((s) => String(s).trim()).filter(Boolean)
        : [];
    const fromTitles = Array.isArray(e.earnedTitles)
        ? e.earnedTitles.map((s) => String(s).trim()).filter(Boolean)
        : [];
    const flair = [...new Set([...fromFlair, ...fromTitles])].slice(0, 24);
    let frz = typeof e.streakFreezeRemaining === "number" ? Math.floor(e.streakFreezeRemaining) : 1;
    frz = Math.max(0, Math.min(1, frz));
    return {
        streakCount: Math.max(0, Math.floor(typeof e.streakCount === "number" ? e.streakCount : 0)),
        longestStreak: Math.max(0, Math.floor(typeof e.longestStreak === "number" ? e.longestStreak : 0)),
        lastStreakAnchorDate: String(e.lastStreakAnchorDate || "").trim(),
        streakLastProcessedDate: String(e.streakLastProcessedDate || "").trim(),
        streakFreezeRemaining: frz,
        freezeWeekMonday: String(e.freezeWeekMonday || "").trim(),
        engagementDayKey: String(e.engagementDayKey || "").trim(),
        practiceGrantsToday: Math.max(0, Math.floor(typeof e.practiceGrantsToday === "number" ? e.practiceGrantsToday : 0)),
        dailyQuestBattleDone: !!e.dailyQuestBattleDone,
        streakMilestonesClaimed: [...new Set(claimed)].sort((a, b) => a - b),
        earnedFlair: [...new Set(flair)],
        lifetimePracticeGrants: Math.max(0, Math.floor(typeof e.lifetimePracticeGrants === "number" ? e.lifetimePracticeGrants : 0))
    };
}
function mergeEngagementRecords(cRaw, lRaw) {
    const a = normalizeEngagement(cRaw);
    const b = normalizeEngagement(lRaw);
    const anchorA = a.lastStreakAnchorDate || "";
    const anchorB = b.lastStreakAnchorDate || "";
    const winner = anchorA > anchorB ? a : anchorB > anchorA ? b : a.streakCount >= b.streakCount ? a : b;
    const lastAnchor = anchorA > anchorB ? anchorA : anchorB > anchorA ? anchorB : winner.lastStreakAnchorDate;
    const dkA = a.engagementDayKey || "";
    const dkB = b.engagementDayKey || "";
    const sameDayKey = dkA && dkA === dkB;
    const engagementDayKey = sameDayKey ? dkA : "";
    let practiceGrantsToday = 0;
    let dailyQuestBattleDone = false;
    if (sameDayKey) {
        practiceGrantsToday = Math.max(a.practiceGrantsToday, b.practiceGrantsToday);
        dailyQuestBattleDone = !!(a.dailyQuestBattleDone || b.dailyQuestBattleDone);
    }
    const milestones = [...new Set([...a.streakMilestonesClaimed, ...b.streakMilestonesClaimed])].sort((x, y) => x - y);
    const flair = [...new Set([...a.earnedFlair, ...b.earnedFlair])].slice(0, 24);
    return normalizeEngagement({
        streakCount: winner.streakCount,
        longestStreak: Math.max(a.longestStreak, b.longestStreak),
        lastStreakAnchorDate: lastAnchor,
        streakLastProcessedDate:
            a.streakLastProcessedDate > b.streakLastProcessedDate ? a.streakLastProcessedDate : b.streakLastProcessedDate,
        streakFreezeRemaining: Math.max(a.streakFreezeRemaining, b.streakFreezeRemaining),
        freezeWeekMonday: a.freezeWeekMonday > b.freezeWeekMonday ? a.freezeWeekMonday : b.freezeWeekMonday,
        engagementDayKey,
        practiceGrantsToday,
        dailyQuestBattleDone,
        streakMilestonesClaimed: milestones,
        earnedFlair: flair,
        lifetimePracticeGrants: Math.max(a.lifetimePracticeGrants, b.lifetimePracticeGrants)
    });
}
 /**
 * Combine Firestore + localStorage so neither source can wipe the other.
 * unlockedLevels = max(1, cloud, local); skills = per-topic max of stats.
 */
function mergeProfileRecords(cloudDoc, localDoc) {
    const c = cloudDoc && typeof cloudDoc === "object" ? cloudDoc : {};
    const l = localDoc && typeof localDoc === "object" ? localDoc : {};
    const ulCloud = typeof c.unlockedLevels === "number" && c.unlockedLevels >= 1 ? c.unlockedLevels : 0;
    const ulLocal = typeof l.unlockedLevels === "number" && l.unlockedLevels >= 1 ? l.unlockedLevels : 0;
    const unlockedLevels = Math.max(1, ulCloud, ulLocal);
    const skillProfile = mergeSkillProfiles(
        normalizeSkillProfile(c.skillProfile),
        normalizeSkillProfile(l.skillProfile)
    );
    const shards = Math.max(
        0,
        typeof c.shards === "number" ? Math.floor(c.shards) : 0,
        typeof l.shards === "number" ? Math.floor(l.shards) : 0
    );
    const cosmeticsTierRaw = Math.max(
        0,
        typeof c.cosmeticsTier === "number" ? Math.floor(c.cosmeticsTier) : 0,
        typeof l.cosmeticsTier === "number" ? Math.floor(l.cosmeticsTier) : 0
    );
    const cosmeticsTier = Math.min(MAX_COSMETIC_TIER, cosmeticsTierRaw);
    const bestiary = (() => {
        const arrC = Array.isArray(c.bestiary) ? c.bestiary : [];
        const arrL = Array.isArray(l.bestiary) ? l.bestiary : [];
        const out = [];
        const seen = new Set();
        for (const it of [...arrC, ...arrL]) {
            if (!it || typeof it !== "object") continue;
            const id = String(it.id || "").trim();
            if (!id || seen.has(id)) continue;
            seen.add(id);
            out.push({
                id,
                name: String(it.name || "").trim(),
                level: typeof it.level === "number" ? Math.floor(it.level) : null,
                topic: String(it.topic || "").trim(),
                hue: String(it.hue || "").trim(),
                defeatedAt: typeof it.defeatedAt === "number" ? it.defeatedAt : null,
                svg: typeof it.svg === "string" ? it.svg : ""
            });
        }
        return out.slice(0, 200);
    })();
    const bossCacheByLevel = (() => {
        const out = {};
        const mergeOne = (src) => {
            const levels = src && typeof src === "object" ? src : {};
            for (const [k, v] of Object.entries(levels)) {
                const n = parseInt(k, 10);
                if (!Number.isFinite(n) || n < 11) continue;
                if (!v || typeof v !== "object") continue;
                const rec = {
                    name: String(v.name || "").trim(),
                    blurb: String(v.blurb || "").trim(),
                    hue: String(v.hue || "").trim(),
                    topic: String(v.topic || "").trim(),
                    battleSvg: String(v.battleSvg || "").trim(),
                    mapSvg: String(v.mapSvg || "").trim(),
                    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now()
                };
                const prev = out[n];
                if (!prev) {
                    out[n] = rec;
                    continue;
                }
                // Prefer entries with both SVGs; then prefer newest.
                const prevOk = !!(prev.battleSvg && prev.mapSvg);
                const recOk = !!(rec.battleSvg && rec.mapSvg);
                if (recOk && !prevOk) out[n] = rec;
                else if (recOk === prevOk && (rec.createdAt || 0) > (prev.createdAt || 0)) out[n] = rec;
            }
        };
        mergeOne(c.bossCacheByLevel);
        mergeOne(l.bossCacheByLevel);
        return out;
    })();
    const engagement = mergeEngagementRecords(c.engagement, l.engagement);
    const srCloud =
        typeof c.strandRotationSeq === "number" && c.strandRotationSeq >= 0 ? Math.floor(c.strandRotationSeq) : 0;
    const srLocal =
        typeof l.strandRotationSeq === "number" && l.strandRotationSeq >= 0 ? Math.floor(l.strandRotationSeq) : 0;
    const strandRotationSeq = Math.max(srCloud, srLocal);
    const audio = mergeProfileAudio(c, l);
    return {
        unlockedLevels,
        skillProfile,
        shards,
        cosmeticsTier,
        bestiary,
        bossCacheByLevel,
        engagement,
        strandRotationSeq,
        audio
    };
}
function engagementSnapshotFromState() {
    return normalizeEngagement(state.engagement);
}
function applyEngagementToState(eg) {
    state.engagement = normalizeEngagement(eg);
}
function rollEngagementDayIfNeeded(todayYmd) {
    const eg = state.engagement;
    if (eg.engagementDayKey !== todayYmd) {
        eg.engagementDayKey = todayYmd;
        eg.practiceGrantsToday = 0;
        eg.dailyQuestBattleDone = false;
    }
}
function refillWeeklyStreakFreeze(todayYmd) {
    const eg = state.engagement;
    const mon = mondayKeyFromYmd(todayYmd);
    if (eg.freezeWeekMonday !== mon) {
        eg.freezeWeekMonday = mon;
        eg.streakFreezeRemaining = 1;
    }
}
function addFlairIfNew(code) {
    const id = String(code || "").trim();
    if (!id) return;
    const eg = state.engagement;
    if (!eg.earnedFlair.includes(id)) {
        eg.earnedFlair.push(id);
        eg.earnedFlair = [...new Set(eg.earnedFlair)].slice(0, 24);
    }
}
/** Grant titles from map progress so most players see badges (not only 3+ day streaks). Idempotent. */
const FLAIR_SVG_PATHS = {
    star: "M12 2l2.6 6.6h6.8l-5.5 4.2 2.1 6.7L12 16.2l-6 3.3 2.1-6.7-5.5-4.2h6.8L12 2z",
    shield: "M12 2.2L5 5v6.2c0 3.8 2.5 7.3 7 9.2 4.5-1.9 7-5.4 7-9.2V5l-7-2.8z",
    map: "M9 2 3 6v13l6-3.5 6 3.5 6-4V3l-6 3.5L9 2zm0 2.4 4 2.3v9.2l-4 2.3V4.4zm6 .1 4-2.3v10.6l-4 2.4V4.5z",
    flame: "M12 22S8 18 8 13c0-2.5 1.5-4.5 3.5-5.2-.3 2.2.8 4.2 2.5 5C12.5 8 14 10.2 14 13c0 5-2 9-2 9z",
    gem: "M12 2l7.5 9-7.5 9-7.5-9L12 2zm0 2.4L8.2 11h7.6L12 4.4z",
    book: "M4 4h16v15l-8-2.8L4 19V4zm2 2v10.5l6-2.1 6 2.1V6H6z",
    spark: "M13 2 4 14h6l-2 8 10-12h-6l1-8z"
};
function createFlairBadgeIcon(iconKey) {
    const d = FLAIR_SVG_PATHS[iconKey] || FLAIR_SVG_PATHS.star;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "flair-badge-icon");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", d);
    svg.appendChild(path);
    return svg;
}
function flairVisualForTitle(title) {
    const s = String(title).toLowerCase();
    if (/streak|week warrior|fortnight/.test(s)) return { mod: "flair-badge--ember", icon: "flame" };
    if (/shard/.test(s)) return { mod: "flair-badge--crystal", icon: "gem" };
    if (/gear|ritual|gleam/.test(s)) return { mod: "flair-badge--arcane", icon: "spark" };
    if (/training/.test(s)) return { mod: "flair-badge--mint", icon: "book" };
    if (/banish|cadet/.test(s)) return { mod: "flair-badge--steel", icon: "shield" };
    if (/path|deep run|quest|rookie/.test(s)) return { mod: "flair-badge--forest", icon: "map" };
    return { mod: "flair-badge--gold", icon: "star" };
}
function createFlairBadgeElement(rawTitle) {
    const title = String(rawTitle || "").trim();
    const { mod, icon } = flairVisualForTitle(title);
    const wrap = document.createElement("span");
    wrap.className = `flair-badge ${mod}`;
    wrap.appendChild(createFlairBadgeIcon(icon));
    const lab = document.createElement("span");
    lab.className = "flair-badge-label";
    lab.textContent = title;
    wrap.appendChild(lab);
    return wrap;
}
function grantProgressFlairsFromState() {
    const ul = Math.max(1, Math.floor(typeof state.unlockedLevels === "number" ? state.unlockedLevels : 1));
    const beast = Array.isArray(state.bestiary) ? state.bestiary.length : 0;
    const shards = Math.max(0, Math.floor(typeof state.shards === "number" ? state.shards : 0));
    const cos = Math.max(0, Math.floor(typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0));
    if (ul >= 1) addFlairIfNew("Math Cadet");
    if (ul >= 2) addFlairIfNew("Quest Rookie");
    if (beast >= 1) addFlairIfNew("First Banish");
    if (ul >= 5) addFlairIfNew("Pathfinder");
    if (ul >= 8) addFlairIfNew("Deep Run");
    if (shards >= 80) addFlairIfNew("Shard Saver");
    if (shards >= 400) addFlairIfNew("Shard Baron");
    if (cos >= 1) addFlairIfNew("Geared Up");
    if (cos >= 2) addFlairIfNew("Ritual Gleam");
}
function claimStreakMilestonesIfNeeded() {
    const eg = state.engagement;
    const n = Math.max(0, Math.floor(eg.streakCount || 0));
    let gained = 0;
    for (const t of [3, 7, 14]) {
        const shards = EP_STREAK_MILESTONE_SHARDS[t];
        if (shards == null || n < t) continue;
        if (eg.streakMilestonesClaimed.includes(t)) continue;
        eg.streakMilestonesClaimed.push(t);
        eg.streakMilestonesClaimed.sort((a, b) => a - b);
        gained += shards;
        if (t === 3) addFlairIfNew("Streak Starter");
        if (t === 7) addFlairIfNew("Week Warrior");
        if (t === 14) addFlairIfNew("Fortnight Scholar");
    }
    return gained;
}
let engagementToastTimer = null;
function showEngagementToast(message) {
    const el = document.getElementById("engagement-toast");
    if (!el) return;
    el.textContent = String(message || "");
    el.classList.remove("hidden", "opacity-0");
    el.classList.add("opacity-100");
    if (engagementToastTimer) clearTimeout(engagementToastTimer);
    engagementToastTimer = setTimeout(() => {
        el.classList.add("opacity-0");
        setTimeout(() => el.classList.add("hidden"), 400);
    }, 3200);
}
function grantParticipationShards(amount, toastMessage) {
    const n = Math.max(0, Math.floor(amount));
    if (n <= 0) return 0;
    state.shards = Math.max(0, Math.floor(state.shards || 0) + n);
    syncShardsUi();
    const us = document.getElementById("upgrades-shards");
    if (us) us.textContent = String(Math.max(0, Math.floor(state.shards || 0)));
    if (toastMessage) showEngagementToast(toastMessage);
    return n;
}
/**
 * Logic Shards for defeating the boss at this map level (1 = first boss).
 * Exponential in level: clearing deep levels is the primary way to maximize shard income.
 */
function victoryShardsForBossLevel(level) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    const base = 15;
    /** Per-level multiplier (~17% more shards each floor than the previous). */
    const perLevelMult = 1.17;
    const raw = base * Math.pow(perLevelMult, lv - 1);
    return Math.max(10, Math.floor(raw));
}
function processEngagementLoginSession() {
    const today = localDateISO();
    refillWeeklyStreakFreeze(today);
    rollEngagementDayIfNeeded(today);
    const eg = state.engagement;
    if (eg.streakLastProcessedDate === today) {
        refillWeeklyStreakFreeze(today);
        rollEngagementDayIfNeeded(today);
        grantProgressFlairsFromState();
        syncEngagementHud();
        return;
    }
    const anchor = eg.lastStreakAnchorDate || "";
    let grantLoginStipend = true;
    if (!anchor) {
        eg.streakCount = Math.max(1, eg.streakCount || 1);
    } else if (anchor === today) {
        grantLoginStipend = false;
    } else {
        const gap = calendarDaysBetween(anchor, today);
        if (gap === 1) {
            eg.streakCount = Math.max(1, (eg.streakCount || 0) + 1);
        } else if (gap === 2 && (eg.streakFreezeRemaining || 0) > 0) {
            eg.streakFreezeRemaining = 0;
            eg.streakCount = Math.max(1, (eg.streakCount || 0) + 1);
            showEngagementToast("Streak freeze used — you kept your streak!");
        } else if (gap >= 2) {
            eg.streakCount = 1;
        }
    }
    eg.lastStreakAnchorDate = today;
    eg.streakLastProcessedDate = today;
    eg.longestStreak = Math.max(eg.longestStreak || 0, eg.streakCount || 0);
    if (grantLoginStipend) {
        grantParticipationShards(EP_SHARD_LOGIN, `+${EP_SHARD_LOGIN} shards — daily check-in`);
    }
    const ms = claimStreakMilestonesIfNeeded();
    if (ms > 0) grantParticipationShards(ms, `+${ms} streak milestone bonus!`);
    grantProgressFlairsFromState();
    syncEngagementHud();
    if (state.playerName) saveLocalProfile(state.playerName);
}
function syncEngagementHud() {
    const eg = state.engagement;
    const streakEl = document.getElementById("map-streak-line");
    if (streakEl) {
        const n = Math.max(0, Math.floor(eg.streakCount || 0));
        const fz = eg.streakFreezeRemaining > 0 ? " · freeze ready" : "";
        streakEl.textContent = `Streak: ${n} day${n === 1 ? "" : "s"}${fz}`;
    }
    const qEl = document.getElementById("map-daily-quest-line");
    if (qEl) {
        const done = !!eg.dailyQuestBattleDone;
        qEl.textContent = done
            ? "Daily quest: complete a battle — done for today."
            : "Daily quest: complete any battle today for bonus shards.";
    }
    const flairWrap = document.getElementById("player-flair-badges");
    if (flairWrap) {
        flairWrap.replaceChildren();
        const titles = Array.isArray(eg.earnedFlair) ? eg.earnedFlair.filter(Boolean) : [];
        const maxShow = 8;
        const slice = titles.length > maxShow ? titles.slice(-maxShow) : titles;
        slice.forEach((raw) => {
            flairWrap.appendChild(createFlairBadgeElement(raw));
        });
    }
}
function tryGrantDailyQuestBattleBonus() {
    const today = localDateISO();
    rollEngagementDayIfNeeded(today);
    const eg = state.engagement;
    if (eg.dailyQuestBattleDone) return 0;
    eg.dailyQuestBattleDone = true;
    const n = EP_SHARD_DAILY_QUEST_BATTLE;
    return n;
}
function grantPracticeParticipationIfAllowed() {
    const today = localDateISO();
    rollEngagementDayIfNeeded(today);
    const eg = state.engagement;
    if ((eg.practiceGrantsToday || 0) >= EP_PRACTICE_DAILY_CAP) return 0;
    eg.practiceGrantsToday = (eg.practiceGrantsToday || 0) + 1;
    eg.lifetimePracticeGrants = (eg.lifetimePracticeGrants || 0) + 1;
    if (eg.lifetimePracticeGrants >= 20) addFlairIfNew("Training Regular");
    return EP_SHARD_PRACTICE;
}
 async function persistMergedProfileToCloud(name, merged) {
    if (!isFirebaseReady || !callSetPlayerProfile) return false;
    try {
        await callSetPlayerProfile({
            appId,
            profileId: safeProfileDocId(name),
            payload: {
            unlockedLevels: merged.unlockedLevels,
            skillProfile: merged.skillProfile,
            shards: merged.shards ?? 0,
            cosmeticsTier: merged.cosmeticsTier ?? 0,
            bestiary: Array.isArray(merged.bestiary) ? merged.bestiary : [],
            bossCacheByLevel: merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : {},
            engagement: normalizeEngagement(merged.engagement),
            strandRotationSeq:
                typeof merged.strandRotationSeq === "number" && merged.strandRotationSeq >= 0
                    ? Math.floor(merged.strandRotationSeq)
                    : 0,
            audio: normalizeAudioSettings(merged.audio),
            displayName: name,
            lastSyncedAt: Date.now()
            }
        });
        state.lastCloudSyncAt = Date.now();
        state.cloudSyncError = null;
        updateCloudSyncBadge();
        return true;
    } catch (e) {
        console.warn("persistMergedProfileToCloud:", e);
        state.cloudSyncError = "failed";
        updateCloudSyncBadge();
        return false;
    }
}
 /** Push current session state to Firestore (merge). Call after progress changes and on a timer. */
async function syncCurrentProfileToCloud() {
    if (!isFirebaseReady || !callSetPlayerProfile || !state.playerName) return;
    const name = state.playerName;
    const sp = state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null);
    if (typeof state.unlockedLevels !== "number" || state.unlockedLevels < 1) return;
    try {
        await callSetPlayerProfile({
            appId,
            profileId: safeProfileDocId(name),
            payload: {
            unlockedLevels: state.unlockedLevels,
            skillProfile: sp,
            shards: typeof state.shards === "number" ? Math.max(0, Math.floor(state.shards)) : 0,
            cosmeticsTier: typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0,
            bestiary: Array.isArray(state.bestiary) ? state.bestiary.slice(0, 200) : [],
            bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {},
            engagement: engagementSnapshotFromState(),
            strandRotationSeq:
                typeof state.strandRotationSeq === "number" && state.strandRotationSeq >= 0
                    ? Math.floor(state.strandRotationSeq)
                    : 0,
            audio: normalizeAudioSettings(state.audio),
            displayName: name,
            lastSyncedAt: Date.now()
            }
        });
        state.lastCloudSyncAt = Date.now();
        state.cloudSyncError = null;
        updateCloudSyncBadge();
    } catch (e) {
        console.warn("syncCurrentProfileToCloud:", e);
        state.cloudSyncError = "failed";
        updateCloudSyncBadge();
    }
}
 async function fetchCloudProfileDoc(name, retries = 2) {
    if (!isFirebaseReady || !callGetPlayerProfile) return null;
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await callGetPlayerProfile({ appId, profileId: safeProfileDocId(name) });
            const out = res && typeof res === "object" && "data" in res ? res.data : null;
            if (out && typeof out === "object" && out.exists && out.data && typeof out.data === "object") {
                return out.data;
            }
            if (out && typeof out === "object" && out.exists === false) return null;
            // Backward-compat: some callable wrappers may return {exists,data} directly.
            if (out && typeof out === "object" && ("unlockedLevels" in out || "skillProfile" in out)) return out;
            return null;
        } catch (e) {
            lastErr = e;
            if (attempt < retries) await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        }
    }
    console.warn("fetchCloudProfileDoc:", lastErr);
    return null;
}
 /**
 * Merge cloud + localStorage + in-memory state (max progress), save locally, upload.
 * Use when Firebase connects late or tab becomes visible again.
 */
async function reconcileProfileWithCloud() {
    if (!isFirebaseReady || !callGetPlayerProfile || !callSetPlayerProfile || !state.playerName) return;
    const name = state.playerName;
    const cloud = await fetchCloudProfileDoc(name, 1);
    const local = loadLocalProfile(name);
    const session = {
        unlockedLevels: state.unlockedLevels,
        skillProfile: state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null),
        shards: typeof state.shards === "number" ? state.shards : 0,
        cosmeticsTier: typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0,
        bestiary: Array.isArray(state.bestiary) ? state.bestiary : [],
        bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {},
        engagement: engagementSnapshotFromState(),
        strandRotationSeq:
            typeof state.strandRotationSeq === "number" && state.strandRotationSeq >= 0
                ? Math.floor(state.strandRotationSeq)
                : 0,
        audio: normalizeAudioSettings(state.audio)
    };
    const m1 = mergeProfileRecords(cloud, local);
    const merged = mergeProfileRecords(m1, session);
    state.unlockedLevels = merged.unlockedLevels;
    state.skillProfile = merged.skillProfile;
    ensureCanonicalSkillTopicsInPlace(state.skillProfile);
    state.shards = merged.shards ?? 0;
    state.cosmeticsTier = merged.cosmeticsTier ?? 0;
    state.bestiary = Array.isArray(merged.bestiary) ? merged.bestiary : [];
    state.bossCacheByLevel = merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : state.bossCacheByLevel;
    state.strandRotationSeq =
        typeof merged.strandRotationSeq === "number" && merged.strandRotationSeq >= 0
            ? Math.floor(merged.strandRotationSeq)
            : 0;
    applyEngagementToState(merged.engagement);
    state.audio = normalizeAudioSettings(merged.audio);
    applyAudioFromState();
    processEngagementLoginSession();
    ensureBestiaryMatchesUnlockedLevels();
    syncShardsUi();
    logTopicRotation("profile loaded (cloud reconcile)", {
        player: name,
        strandRotationSeq: state.strandRotationSeq,
        skillProfile: skillProfileCanonicalSnapshotForLog(state.skillProfile),
        sourcesMerged: "cloud + localStorage + in-memory session"
    });
    saveLocalProfile(name);
    await persistMergedProfileToCloud(name, {
        ...merged,
        skillProfile: state.skillProfile,
        bestiary: state.bestiary,
        bossCacheByLevel: state.bossCacheByLevel,
        engagement: engagementSnapshotFromState(),
        strandRotationSeq: state.strandRotationSeq,
        audio: normalizeAudioSettings(state.audio)
    });
    const ls = document.getElementById("level-screen");
    if (ls && !ls.classList.contains("hidden")) {
        syncMapAudioControlsFromState();
        renderLevelMenu();
        syncAiRouteNotice();
        syncMapQuestionBufferHint();
        syncShardsUi();
    }
}
 let cloudSyncIntervalId = null;
 function startCloudSyncHeartbeat() {
    if (cloudSyncIntervalId) clearInterval(cloudSyncIntervalId);
    cloudSyncIntervalId = setInterval(() => {
        syncCurrentProfileToCloud();
    }, 45000);
}
 /** One-time: enable Start button and show accurate cloud / local status. */
function resolveLoginGate(kind) {
    if (loginGateResolved) return;
    loginGateResolved = true;
    const msg = {
        firebase_ok: "Online save ready — your progress can sync to your account.",
        firebase_fail: "Can't reach online save — using progress stored on this device.",
        no_config: "Playing on this device only — progress stays in this browser until online save is set up.",
        timeout: "Online save is slow or blocked — using progress stored on this device."
    };
    const hideOkLineInProd = isProductionUi() && kind === "firebase_ok";
    const line = hideOkLineInProd ? "" : msg[kind] || msg.timeout;
    safeSet("cloud-status-msg", line, "innerText");
    const el = document.getElementById("cloud-status-msg");
    if (el) {
        if (hideOkLineInProd) {
            el.classList.add("hidden");
        } else {
            el.classList.remove("hidden");
            el.className = "mt-4 text-[10px] font-mono text-center uppercase " + (kind === "firebase_ok" ? "text-emerald-400" : "text-amber-400/90");
        }
    }
    const loginBtn = safeSet("login-btn", "START ADVENTURE");
    if (loginBtn) loginBtn.disabled = false;
}
 // --- REGRESSION MONITORING ---
function setRegressionVaultSkipped() {
    safeSet("t-vault", "VAULT: local OK");
    const el = document.getElementById("t-vault");
    if (el) {
        el.className = "text-emerald-400 font-bold";
        el.title = "No Firebase in this build — saves stay in this browser. Expected, not a failure.";
    }
    safeSet("t-brendan", "PROFILE: local OK");
    const b = document.getElementById("t-brendan");
    if (b) {
        b.className = "text-emerald-400 font-bold";
        b.title = "Cloud profile sync is not configured; data is local-only. Expected.";
    }
}
 function setRegressionVaultFailed() {
    safeSet("t-vault", "VAULT: FAIL");
    const el = document.getElementById("t-vault");
    if (el) el.className = "text-red-400 font-bold";
    safeSet("t-brendan", "PROFILE: FAIL");
    const br = document.getElementById("t-brendan");
    if (br) br.className = "text-red-400 font-bold";
}
 function setRegressionVaultStalled() {
    safeSet("t-vault", "VAULT: still connecting…");
    const el = document.getElementById("t-vault");
    if (el) {
        el.className = "text-amber-400 font-bold";
        el.title = "Firebase is taking longer than usual; you can still tap Start below.";
    }
    safeSet("t-brendan", "PROFILE: waiting on cloud…");
    const br = document.getElementById("t-brendan");
    if (br) {
        br.className = "text-amber-400 font-bold";
        br.title = "Waiting for cloud connection before profile seed check.";
    }
}
 async function runRegressions() {
    const visualsOk = ASSETS.slime.includes("SLIME_EYE_L") && ASSETS.wizard.includes("STAFF_WHEEL") && ASSETS.golem.includes("GOLEM_BODY");
    safeSet('t-visuals', visualsOk ? 'VISUALS: PASS' : 'VISUALS: FAIL');
    document.getElementById('t-visuals').className = visualsOk ? "text-green-400 font-bold" : "text-red-400 font-bold";
    
    if (window.MathJax) {
        safeSet('t-logic', 'MATHJAX: PASS');
        document.getElementById('t-logic').className = "text-green-400";
    }
     const panel = document.getElementById('interaction-panel');
    const scrollOk = panel && window.getComputedStyle(panel).flexShrink === '0';
    safeSet('t-scroll', scrollOk ? 'SCROLL: PASS' : 'SCROLL: FAIL');
    document.getElementById('t-scroll').className = scrollOk ? "text-green-400" : "text-red-400";
     const promptsOn = isPromptDebugEnabled();
    safeSet("t-prompts", promptsOn ? "PROMPTS: ON" : "PROMPTS: OFF");
    const pEl = document.getElementById("t-prompts");
    if (pEl) pEl.className = promptsOn ? "text-sky-300" : "text-slate-500";
     const bossCount = (() => {
        try {
            const keys = Object.keys(state.bossCacheByLevel || {}).filter((k) => parseInt(k, 10) >= 11);
            return keys.length;
        } catch (_) {
            return 0;
        }
    })();
    safeSet("t-bosses", bossCount > 0 ? `BOSSES: ${bossCount}` : "BOSSES: 0");
    const bEl = document.getElementById("t-bosses");
    if (bEl) bEl.className = bossCount > 0 ? "text-emerald-300" : "text-slate-500";
     await runAiApiRegression();
}
 async function connectFirebaseAndSeedRegression() {
    const app = initializeApp(JSON.parse(__firebase_config));
    auth = getAuth(app);
    functionsApi = getFunctions(app, "us-central1");
    callVaultHealthcheck = httpsCallable(functionsApi, "vaultHealthcheck");
    callGetPlayerProfile = httpsCallable(functionsApi, "getPlayerProfile");
    callSetPlayerProfile = httpsCallable(functionsApi, "setPlayerProfile");
    await (typeof __initial_auth_token !== "undefined" ? signInWithCustomToken(auth, __initial_auth_token) : signInAnonymously(auth));
    currentUser = auth.currentUser;
    await callVaultHealthcheck({ appId });
    isFirebaseReady = true;
    safeSet("t-vault", "VAULT: PASS");
    document.getElementById("t-vault").className = "text-green-400";
     try {
        const brendanId = "Student Brendan";
        const got = await callGetPlayerProfile({ appId, profileId: brendanId });
        const gd = got && got.data ? got.data : null;
        const exists = gd && typeof gd === "object" ? !!gd.exists : false;
        if (!exists) {
            await callSetPlayerProfile({
                appId,
                profileId: brendanId,
                payload: { unlockedLevels: 1, skillProfile: { Math: { attempts: 0, corrects: 0 } }, displayName: brendanId }
            });
        }
        safeSet("t-brendan", "BRENDAN: PASS");
        document.getElementById("t-brendan").className = "text-green-400";
    } catch (seedErr) {
        console.warn("Brendan seed handshake:", seedErr);
        safeSet("t-brendan", "BRENDAN: FAIL");
        const br = document.getElementById("t-brendan");
        if (br) br.className = "text-red-400 font-bold";
    }
     resolveLoginGate("firebase_ok");
    setTimeout(() => {
        if (state.playerName && isFirebaseReady) reconcileProfileWithCloud();
    }, 150);
}
 // --- AUTH & VAULT HANDSHAKE ---
async function initFirebase() {
    setTimeout(() => {
        if (!loginGateResolved) {
            setRegressionVaultStalled();
            resolveLoginGate("timeout");
        }
    }, 8000);
    if (typeof __firebase_config === "undefined") {
        setRegressionVaultSkipped();
        resolveLoginGate("no_config");
        return;
    }
    try {
        await connectFirebaseAndSeedRegression();
    } catch (e) {
        console.error(e);
        isFirebaseReady = false;
        setRegressionVaultFailed();
        resolveLoginGate("firebase_fail");
    }
}
 document.addEventListener("visibilitychange", () => {
    if (!state.playerName) return;
    if (document.visibilityState === "hidden") {
        syncCurrentProfileToCloud();
    } else if (document.visibilityState === "visible" && isFirebaseReady) {
        reconcileProfileWithCloud();
    }
});
 window.addEventListener("pagehide", () => {
    if (state.playerName) syncCurrentProfileToCloud();
});
 window.handleLogin = async () => {
    const name = document.getElementById('player-name-input').value.trim() || 'Student Brendan';
    state.playerName = name;
    const loginBtn = document.getElementById('login-btn');
    loginBtn.innerText = "ACCESSING...";
    loginBtn.disabled = true;
     state.bossCacheByLevel = loadBossCache();
    const localSnapshot = loadLocalProfile(name);
    const cloudRetries = localSnapshot ? 1 : 3;
    const cloudSnapshot = isFirebaseReady && callGetPlayerProfile ? await fetchCloudProfileDoc(name, cloudRetries) : null;
     const merged = mergeProfileRecords(cloudSnapshot, localSnapshot);
    state.unlockedLevels = merged.unlockedLevels;
    state.skillProfile = merged.skillProfile;
    ensureCanonicalSkillTopicsInPlace(state.skillProfile);
    state.shards = merged.shards ?? 0;
    state.cosmeticsTier = merged.cosmeticsTier ?? 0;
    state.bestiary = Array.isArray(merged.bestiary) ? merged.bestiary : [];
    state.bossCacheByLevel = merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : state.bossCacheByLevel;
    state.strandRotationSeq =
        typeof merged.strandRotationSeq === "number" && merged.strandRotationSeq >= 0
            ? Math.floor(merged.strandRotationSeq)
            : 0;
    applyEngagementToState(merged.engagement);
    state.audio = normalizeAudioSettings(merged.audio);
    applyAudioFromState();
    processEngagementLoginSession();
    ensureBestiaryMatchesUnlockedLevels();
    syncShardsUi();
    logTopicRotation("profile loaded (login)", {
        player: name,
        strandRotationSeq: state.strandRotationSeq,
        skillProfile: skillProfileCanonicalSnapshotForLog(state.skillProfile),
        sourcesMerged: "cloud (if any) + localStorage"
    });
    saveLocalProfile(name);
     if (isFirebaseReady && callSetPlayerProfile) {
        await persistMergedProfileToCloud(name, {
            ...merged,
            skillProfile: state.skillProfile,
            bestiary: state.bestiary,
            bossCacheByLevel: state.bossCacheByLevel,
            engagement: engagementSnapshotFromState(),
            strandRotationSeq: state.strandRotationSeq,
            audio: normalizeAudioSettings(state.audio)
        });
    } else {
        state.lastCloudSyncAt = Date.now();
        state.cloudSyncError = null;
    }
     safeSet('welcome-player-text', name);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('level-screen').classList.remove('hidden');
    syncMapAudioControlsFromState();
    void startMapBgmFromUserGesture();
    renderPlayerSprite();
    renderLevelMenu();
    syncAiRouteNotice();
    syncMapQuestionBufferHint();
    prefetchQuestion(Math.max(1, typeof state.unlockedLevels === "number" ? state.unlockedLevels : 1), {
        criterionTurnIndex: 0
    });
    showCloudSyncBadge();
    syncQuestionsApiBadge();
    startCloudSyncHeartbeat();
    void syncCurrentProfileToCloud();
};
 function renderPlayerSprite() {
    const tier = Math.min(
        MAX_COSMETIC_TIER,
        Math.max(0, Math.floor(typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0))
    );
    const base = ASSETS.wizard;
    if (tier <= 0) {
        safeSet("player-sprite", base, "innerHTML");
        return;
    }
    const inner = svgInnerMarkup(base);
    const weapon = buildHeroWeaponOverlay(tier);
    const extra = buildCosmeticEvolutionExtra(tier);
    const upgraded = `<svg viewBox="10 -12 100 106" class="w-full h-full drop-shadow-[0_10px_20px_rgba(59,130,246,0.6)]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${inner}${weapon}${extra}</svg>`;
    safeSet("player-sprite", upgraded, "innerHTML");
}
 function updateEnemyTauntLine() {
    const el = document.getElementById("enemy-taunt");
    if (!el) return;
    const meta = getQuestNode(state.currentLevel) || {};
    const bossName = String(meta.name || "Boss").trim() || "Boss";
    el.textContent = pickEnemyTaunt({
        level: state.currentLevel,
        cosmeticsTier: typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0,
        turnIndex: typeof state.turnIndex === "number" ? state.turnIndex : 0,
        bossName
    });
}
 function syncShardsUi() {
    safeSet("shards-count", String(Math.max(0, Math.floor(state.shards || 0))));
}
 function bestiaryIdForLevel(level) {
    return `boss:${level}`;
}
 function addBossToBestiary(level) {
    const meta = getQuestNode(level);
    const id = bestiaryIdForLevel(level);
    state.bestiary = Array.isArray(state.bestiary) ? state.bestiary : [];
    if (state.bestiary.some((b) => b && b.id === id)) return;
    state.bestiary.unshift({
        id,
        level,
        name: String(meta?.name || `Boss Lv ${level}`),
        topic: String(meta?.topic || ""),
        hue: String(meta?.hue || ""),
        defeatedAt: Date.now()
    });
    state.bestiary = state.bestiary.slice(0, 200);
}
/** Beating the frontier at level N is what raises unlockedLevels past N; fill any missing entries (legacy saves, missed syncs). */
function ensureBestiaryMatchesUnlockedLevels() {
    const ul = typeof state.unlockedLevels === "number" && state.unlockedLevels >= 1 ? state.unlockedLevels : 1;
    for (let lv = 1; lv < ul; lv++) {
        addBossToBestiary(lv);
    }
}
function closeOtherMapHudOverlays(except) {
    if (except !== "bestiary") document.getElementById("bestiary-overlay")?.classList.add("hidden");
    if (except !== "upgrades") document.getElementById("upgrades-overlay")?.classList.add("hidden");
    if (except !== "practice") {
        document.getElementById("practice-overlay")?.classList.add("hidden");
        practiceActiveQuestion = null;
    }
}
/** Close bestiary / upgrades / practice before battle or when leaving map. */
function closeAllMapHudOverlays() {
    closeOtherMapHudOverlays(null);
}
 window.openBestiary = () => {
    closeOtherMapHudOverlays("bestiary");
    document.getElementById("bestiary-overlay")?.classList.remove("hidden");
    renderBestiary();
};
window.closeBestiary = () => document.getElementById("bestiary-overlay")?.classList.add("hidden");
 function renderBestiary() {
    const grid = document.getElementById("bestiary-grid");
    if (!grid) return;
    const items = Array.isArray(state.bestiary) ? state.bestiary : [];
    if (!items.length) {
        grid.innerHTML = `<div class="sm:col-span-2 text-center text-slate-400 border border-slate-700 rounded-xl p-6">No monsters unlocked yet. Defeat a boss to add it here.</div>`;
        return;
    }
    grid.innerHTML = items
        .map((b) => {
            const name = String(b.name || "Unknown");
            const lvl = typeof b.level === "number" ? b.level : "?";
            const hue = String(b.hue || "#94a3b8");
            const topic = String(b.topic || "");
            const thumbLevel = typeof b.level === "number" && b.level >= 1 ? b.level : 1;
            return `
            <div class="border border-slate-700 rounded-xl bg-slate-900/40 p-3 flex gap-3">
                <div class="w-20 h-20 shrink-0 rounded-lg border border-slate-700 bg-slate-950/60 flex items-center justify-center overflow-hidden">
                    <div class="w-20 h-20">${bestiaryBossThumbSvg(thumbLevel)}</div>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                        <div class="font-black text-slate-100 truncate">${name}</div>
                        <div class="text-xs font-black uppercase text-slate-400">Lv ${lvl}</div>
                    </div>
                    <div class="mt-1 text-xs font-bold" style="color:${hue}">${topic || "Math"}</div>
                    <div class="mt-2 text-[11px] text-slate-400">Defeated: ${b.defeatedAt ? new Date(b.defeatedAt).toLocaleDateString() : ""}</div>
                </div>
            </div>`;
        })
        .join("");
}
 window.openUpgrades = () => {
    closeOtherMapHudOverlays("upgrades");
    document.getElementById("upgrades-overlay")?.classList.remove("hidden");
    renderUpgrades();
};
window.closeUpgrades = () => document.getElementById("upgrades-overlay")?.classList.add("hidden");
 function renderUpgrades() {
    safeSet("upgrades-shards", String(Math.max(0, Math.floor(state.shards || 0))));
    const list = document.getElementById("upgrades-list");
    if (!list) return;
    const curTier = Math.min(
        MAX_COSMETIC_TIER,
        Math.max(0, Math.floor(typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0))
    );
    const shards = Math.max(0, Math.floor(state.shards || 0));
    list.innerHTML = COSMETIC_EVOLUTION_OPTIONS.map((o) => {
        const evolved = curTier >= o.tier;
        const isNext = o.tier === curTier + 1;
        const locked = o.tier > curTier + 1;
        const canEvolve = isNext && !locked && shards >= o.cost;
        let btnLabel;
        let btnClass;
        let disabled = true;
        if (evolved) {
            btnLabel = "Evolved";
            btnClass = "border-slate-600 bg-slate-900/40 text-slate-400";
        } else if (locked) {
            btnLabel = "Locked";
            btnClass = "border-slate-700 bg-slate-900/30 text-slate-500";
        } else if (isNext) {
            disabled = !canEvolve;
            btnLabel = canEvolve ? "Evolve" : "Need shards";
            btnClass = canEvolve
                ? "border-emerald-600 bg-emerald-700/30 hover:bg-emerald-600/40 text-emerald-100"
                : "border-slate-700 bg-slate-900/30 text-slate-500";
        } else {
            btnLabel = "—";
            btnClass = "border-slate-700 bg-slate-900/30 text-slate-500";
        }
        return `
            <div class="border border-slate-700 rounded-xl bg-slate-900/40 p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-[10px] font-black uppercase tracking-wider text-indigo-300/90 border border-indigo-500/50 px-2 py-0.5 rounded-md">Stage ${o.stage}</span>
                            <div class="font-black text-slate-100">${o.title}</div>
                        </div>
                        <div class="text-[12px] text-slate-400 mt-1">${o.desc}</div>
                    </div>
                    <div class="shrink-0 text-right">
                        <div class="text-xs font-black uppercase text-amber-200">${evolved ? "Unlocked" : `${o.cost} shards`}</div>
                        <button type="button" ${disabled ? "disabled" : ""}
                            onclick="buyUpgrade(${o.tier}, ${o.cost})"
                            class="mt-2 px-3 py-2 rounded-lg text-xs font-black uppercase border ${btnClass}">
                            ${btnLabel}
                        </button>
                    </div>
                </div>
            </div>`;
    }).join("");
}
 window.buyUpgrade = (tier, cost) => {
    const t = Math.max(0, Math.floor(tier || 0));
    const c = Math.max(0, Math.floor(cost || 0));
    const curTier = Math.min(
        MAX_COSMETIC_TIER,
        Math.max(0, Math.floor(state.cosmeticsTier || 0))
    );
    if (t > MAX_COSMETIC_TIER || t < 1) return;
    if (t !== curTier + 1) return;
    const shards = Math.max(0, Math.floor(state.shards || 0));
    if (shards < c) return;
    state.shards = shards - c;
    state.cosmeticsTier = t;
    renderPlayerSprite();
    showUpgradeCelebration(t);
    syncShardsUi();
    renderUpgrades();
    if (state.playerName) saveLocalProfile(state.playerName);
    syncCurrentProfileToCloud();
};
 window.analyzeEnemy = async () => {
    const q = state.activeQuestion || {};
    const meta = getQuestNode(state.currentLevel) || {};
    try {
        if (!canUseSecureAiBridge()) throw new Error("Secure AI bridge unavailable (Firebase Auth required)");
        const { dsModel } = getConfiguredAiKeys();
        const systemMsg = {
            role: "system",
            content:
                "You output exactly one valid JSON object and nothing else. No markdown. No code fences. " +
                LLM_NO_MARKDOWN_IN_STRINGS
        };
        const user =
            `You are the game's tactical scan ability. Give a short, helpful, MYP-scope hint.\n` +
            `Boss: ${JSON.stringify(String(meta.name || ""))}\n` +
            `Level: ${state.currentLevel}\n` +
            `Criterion: ${JSON.stringify(String(q.criterion || ""))}\n` +
            `Topic: ${JSON.stringify(String(q.topic_category || meta.topic || ""))}\n` +
            `Question: ${JSON.stringify(String(q.text || ""))}\n\n` +
            `Return JSON keys:\n- hint: string (3-6 short sentences max; tactical tone; include an equation if helpful). ` +
            `Math only as \\(...\\) inline TeX (no single-dollar math delimiters; no $$, no tables, no # or **).\n`;
        debugLogAiPrompt("dashscope.scan", user);
        const data = await callGenerateCombatQuestionWithBackoff(
            {
                model: dsModel,
                messages: [systemMsg, { role: "user", content: user }],
                response_format: { type: "json_object" },
                temperature: 0.6,
                max_tokens: 260
            },
            { min429DelayMs: 3500, maxDelayMs: 20000, initialDelayMs: 900 }
        );
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const content = data?.choices?.[0]?.message?.content;
        const hintPv = parseAndValidate(ScanHintSchema, content, { lenient: true });
        if (!hintPv.ok) throw new Error(hintPv.issuesText || "scan hint schema invalid");
        const hint = sanitizeLlmProseString(String(hintPv.data.hint || "").trim());
        state.requireReflection = false;
        showDetailedFeedback(`Scan Report:\n\n${hint || "No hint available."}`);
    } catch (e) {
        state.requireReflection = false;
        showDetailedFeedback(
            "Scan failed — try again.\n\nFallback hint: Write what you know, define the variable, do one operation per line, and end with “Therefore, …”."
        );
        console.warn("analyzeEnemy:", e);
    }
};
 let upgradeCelebrationHideTimer = null;
 let fetchPromise = null;
/** Level the in-flight `fetchPromise` was built for; null if none. */
let prefetchPromiseForLevel = null;
let prefetchRunId = 0;
let prefetchInFlightCount = 0;
let prefetchInFlight = false;
/** Prevents concurrent loadQuestion runs from sharing one prefetch completion — only the first dequeue would get `nextQuestion`, the rest saw null and fell back to offline. */
let loadQuestionInFlight = null;

function invalidateCombatQuestionPrefetch() {
    // Cancels late writes from in-flight prefetch and drops any buffered question built under a stale battle pin.
    prefetchRunId += 1;
    fetchPromise = null;
    prefetchPromiseForLevel = null;
    state.nextQuestion = null;
    try {
        syncMapQuestionBufferHint();
        syncQuestionsApiBadge();
    } catch (_) {}
}
 function clearPrefetchFailureUi() {
    state.aiOfflineHint = null;
    state.lastPrefetchError = null;
}
 function setPrefetchFailureFromError(e) {
    const m = e && e.message ? String(e.message) : String(e);
    state.lastPrefetchError = m.slice(0, 280);
    const err = state.lastPrefetchError;
    const is429 =
        (e && e.isRateLimit === true) ||
        /\b429\b/.test(err) ||
        /\btoo many requests\b/i.test(err) ||
        /\brate limit exceeded\b/i.test(err);
    if (is429) {
        state.aiOfflineHint =
            "Live AI returned HTTP 429 (too many requests). Using the offline question pool. Technical detail: " + err;
    } else if (/Secure AI bridge unavailable|Firebase Auth required|unauthenticated/i.test(err)) {
        state.aiOfflineHint =
            "Live AI needs Firebase (anonymous sign-in is fine). Using the offline pool until the cloud session is ready. " +
            err;
    } else if (/PREFETCH_TIMEOUT|did not finish within|Live AI slow or stalled/i.test(err)) {
        state.aiOfflineHint =
            "Live AI hit the time limit before the question was ready (large prompt, slow API, or multiple retries in one run). Using the offline pool. Allow more time: ?aiTimeoutMs=90000 or window.__prefetch_ai_timeout_ms = 90000.";
    } else if (/HTTP 404|wrong endpoint|chat completions/i.test(err)) {
        state.aiOfflineHint = "Live AI proxy failed (404 or bad route). Check Cloud Function deploy and region. " + err;
    } else if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(err)) {
        state.aiOfflineHint =
            err + " Check Firebase callable CORS / Cloud Run invoker (public) and that you are signed in.";
    } else {
        state.aiOfflineHint = "Live AI request failed — using the offline question pool. " + err;
    }
}
 function syncAiRouteNotice() {
    if (isProductionUi()) return;
    const el = document.getElementById("ai-route-notice");
    if (!el) return;
    if (state.aiOfflineHint) {
        el.textContent = state.aiOfflineHint;
        el.classList.remove("hidden");
    } else {
        el.textContent = "";
        el.classList.add("hidden");
    }
}
 function syncMapQuestionBufferHint() {
    if (isProductionUi()) return;
    const el = document.getElementById("map-question-buffer-hint");
    if (!el) return;
    const parts = [];
    if (prefetchInFlight) parts.push("Fetching next question…");
    if (state.nextQuestion) {
        const src = state.nextQuestion._questionSource;
        if (src === "offline") {
            parts.push("Queued: offline pool.");
            if (state.lastPrefetchError) parts.push(state.lastPrefetchError.slice(0, 140));
        } else if (src === "dashscope") {
            parts.push("Queued: live AI (Alibaba DashScope / Qwen).");
        } else if (src === "openrouter") {
            parts.push("Queued: live AI (legacy source).");
        } else if (src === "gemini") {
            parts.push("Queued: legacy Gemini (removed in this build).");
        } else {
            parts.push("Queued: next battle question ready.");
        }
    } else if (!prefetchInFlight) {
        parts.push("No question prefetched yet.");
    }
    el.textContent = parts.join(" ");
    el.className =
        "text-[11px] mt-1 px-2 " +
        (state.nextQuestion && state.nextQuestion._questionSource === "offline"
            ? "text-amber-400/90"
            : "text-slate-500");
}
 function updateQuestionSourceBadge(q) {
    if (isProductionUi()) return;
    const el = document.getElementById("question-source-badge");
    if (!el) return;
    if (!q) {
        el.classList.add("hidden");
        el.textContent = "";
        el.title = "";
        return;
    }
    const base = "mb-2 text-center text-xs font-bold uppercase tracking-wide rounded-lg py-1.5 px-2 border";
    el.classList.remove("hidden");
    const src = q._questionSource;
    if (src === "offline") {
        el.className = `${base} text-amber-300 border-amber-600/60 bg-amber-950/40`;
        el.textContent = "This question · offline pool (not from live AI)";
        el.title = state.lastPrefetchError || state.aiOfflineHint || "Built-in fallback questions.";
    } else if (src === "dashscope") {
        el.className = `${base} text-emerald-200 border-emerald-600/60 bg-emerald-950/40`;
        const m = q._dashscopeModel ? String(q._dashscopeModel) : "Qwen";
        el.textContent = `This question · live AI · DashScope (${m})`;
        el.title = "This multiple-choice question was generated by DashScope for this battle.";
    } else if (src === "gemini") {
        el.className = `${base} text-slate-300 border-slate-500/60 bg-slate-900/80`;
        el.textContent = "This question · legacy Gemini (no longer supported here)";
        el.title = "Older session data; new questions use DashScope or offline only.";
    } else if (src === "openrouter") {
        el.className = `${base} text-slate-200 border-slate-500/60 bg-slate-900/80`;
        el.textContent = "This question · live AI (legacy provider)";
        el.title = "Older saved question source.";
    } else {
        el.classList.add("hidden");
        el.textContent = "";
        el.title = "";
    }
}
 function syncQuestionsApiBadge() {
    if (isProductionUi()) return;
    const root = document.getElementById("ai-questions-status");
    const l2 = document.getElementById("ai-status-line2");
    if (!root || !l2) return;
     const { dsModel } = getConfiguredAiKeys();
    const liveAiAvailable = canUseSecureAiBridge();
    const routeTitle = liveAiAvailable ? `DashScope: ${dsModel}` : "";
     const isLiveSource = (q) =>
        q && (q._questionSource === "dashscope" || q._questionSource === "openrouter" || q._questionSource === "gemini");
    const queuedLive = isLiveSource(state.nextQuestion);
    const activeLive = isLiveSource(state.activeQuestion);
    const battleEl = document.getElementById("battle-screen");
    const inBattle = !!(battleEl && !battleEl.classList.contains("hidden"));
     const setStyle = (borderHue, line2Class) => {
        root.className =
            `fixed right-2 sm:right-3 top-12 sm:top-14 z-[119] max-w-[min(100vw-1rem,15rem)] rounded-lg border px-2.5 py-1.5 shadow-lg backdrop-blur-sm ${borderHue}`;
        l2.className = `text-[10px] sm:text-xs font-bold truncate ${line2Class}`;
    };
     if (state.playerName) {
        if (inBattle && state.activeQuestion) {
            const aq = state.activeQuestion;
            const pf = prefetchInFlight ? " · prefetch next…" : "";
            if (aq._questionSource === "offline") {
                setStyle("border-amber-600/80 bg-amber-950/40", "text-amber-200");
                l2.textContent = "This question · offline" + pf;
                root.title =
                    (state.lastPrefetchError || state.aiOfflineHint || "Offline pool.") +
                    " System AI: PASS is only a connectivity smoke ping, not proof this MCQ is live.";
                return;
            }
            if (aq._questionSource === "dashscope") {
                setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
                l2.textContent = "This question · DashScope" + pf;
                root.title = aq._dashscopeModel
                    ? `Live MCQ · model ${aq._dashscopeModel}. Smoke test ≠ guarantee of every fetch.`
                    : "Live MCQ from DashScope.";
                return;
            }
            if (aq._questionSource === "gemini") {
                setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
                l2.textContent = "This question · legacy Gemini" + pf;
                root.title = "Legacy only; configure DashScope for live questions in HK.";
                return;
            }
            if (aq._questionSource === "openrouter") {
                setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
                l2.textContent = "This question · live (legacy)" + pf;
                root.title = "Legacy live source.";
                return;
            }
        }
        if (prefetchInFlight) {
            setStyle("border-sky-500/70 bg-slate-900/95", "text-sky-300");
            l2.textContent = "Fetching from API…";
            root.title = liveAiAvailable ? `Request in progress (${routeTitle})` : "";
            return;
        }
        if (queuedLive || activeLive) {
            setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
            l2.textContent = "Next / last · live AI";
            const m = state.nextQuestion && state.nextQuestion._dashscopeModel;
            root.title = m ? `${routeTitle} (queued model: ${m})` : routeTitle;
            return;
        }
        if (!liveAiAvailable) {
            setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
            l2.textContent = "Offline only (no Firebase session)";
            root.title = "Live combat questions require Firebase (anonymous sign-in). No DashScope key in the browser.";
            return;
        }
        if (state.aiOfflineHint) {
            setStyle("border-amber-600/80 bg-amber-950/40", "text-amber-200");
            l2.textContent = "Using offline pool";
            root.title = state.lastPrefetchError || state.aiOfflineHint;
            return;
        }
        setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-300");
        l2.textContent = lastAiConnectivityCheck.ok ? "Ready (no question queued)" : "Waiting for API…";
        root.title = lastAiConnectivityCheck.detail || routeTitle;
        return;
    }
     if (!liveAiAvailable) {
        setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
        l2.textContent = "No live AI session";
        root.title =
            lastAiConnectivityCheck.detail ||
            "Open the game with Firebase configured; combat uses the secure Cloud Function (no browser API key).";
        return;
    }
    if (lastAiConnectivityCheck.ok === true) {
        setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
        l2.textContent = "Smoke test: API OK";
        root.title = lastAiConnectivityCheck.detail || routeTitle;
        return;
    }
    if (lastAiConnectivityCheck.ok === false) {
        setStyle("border-amber-600/80 bg-amber-950/40", "text-amber-200");
        l2.textContent = lastAiConnectivityCheck.summary;
        root.title = lastAiConnectivityCheck.detail || "";
        return;
    }
    setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
    l2.textContent = "Checking API…";
    root.title = routeTitle;
}
 function renderLevelMenu() {
    const container = document.getElementById('levels-container');
    const total = Math.max(10, state.unlockedLevels + 1);
    const vbW = 360;
    const vbH = 1040;
    const pts = [];
    for (let i = 0; i < total; i++) {
        const q = QUEST_ROUTE[i % QUEST_ROUTE.length];
        const lap = Math.floor(i / QUEST_ROUTE.length);
        pts.push({ x: q.x + lap * 12, y: q.y + lap * 48 });
    }
    const curveBulge = 22;
    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i];
        const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + curveBulge;
        pathD += ` Q ${mx} ${my} ${p1.x} ${p1.y}`;
    }
    const unlocked = state.unlockedLevels;
    let pathProgress = "";
    if (unlocked >= 2) {
        pathProgress = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < unlocked && i < pts.length; i++) {
            const p0 = pts[i - 1], p1 = pts[i];
            const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + curveBulge;
            pathProgress += ` Q ${mx} ${my} ${p1.x} ${p1.y}`;
        }
    }
     const nodesHtml = pts.map((p, idx) => {
        const level = idx + 1;
        const open = level <= unlocked;
        const isCurrent = open && level === unlocked;
        const meta = getQuestNode(level);
        const ring = open ? (isCurrent ? "#facc15" : "#38bdf8") : "#475569";
        const fill = open ? "rgba(15,23,42,0.92)" : "rgba(30,41,59,0.75)";
        const cursor = open ? "pointer" : "not-allowed";
        const opacity = open ? 1 : 0.42;
        const glow = isCurrent ? ' class="quest-node-current"' : "";
        const lock = open ? "" : `<g opacity="0.92"><rect x="${p.x - 12}" y="${p.y - 92}" width="24" height="20" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="2"/><path d="M ${p.x - 8} ${p.y - 92} V${p.y - 102} Q ${p.x} ${p.y - 112} ${p.x + 8} ${p.y - 102} V${p.y - 92}" fill="none" stroke="#94a3b8" stroke-width="2"/><circle cx="${p.x}" cy="${p.y - 84}" r="3" fill="#475569"/></g>`;
        const nameFs = meta.name.length > 16 ? 7.5 : 9;
        return `
        <g${glow} data-level="${level}" style="cursor:${cursor};opacity:${opacity}">
            <title>${meta.name} — ${meta.blurb}</title>
            <circle cx="${p.x}" cy="${p.y}" r="46" fill="${fill}" stroke="${ring}" stroke-width="${open ? 4 : 3}"/>
            <g transform="translate(${p.x - 50},${p.y - 52}) scale(0.52)">${mapBossPortrait(level)}</g>
            <text x="${p.x}" y="${p.y + 58}" text-anchor="middle" fill="#e2e8f0" font-size="13" font-weight="bold" font-family="system-ui,sans-serif">${level}</text>
            <text x="${p.x}" y="${p.y + 74}" text-anchor="middle" fill="${meta.hue}" font-size="${nameFs}" font-weight="700" font-family="system-ui,sans-serif">${meta.name}</text>
            ${lock}
        </g>`;
    }).join("");
     container.innerHTML = `
    <svg viewBox="0 0 ${vbW} ${vbH}" class="w-full h-auto drop-shadow-2xl select-none" xmlns="http://www.w3.org/2000/svg" aria-label="Quest map">
        <defs>
            <linearGradient id="quest-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#0f172a"/><stop offset="45%" style="stop-color:#1e1b4b"/><stop offset="100%" style="stop-color:#312e81"/>
            </linearGradient>
            <linearGradient id="quest-ground" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#14532d"/><stop offset="100%" style="stop-color:#052e16"/>
            </linearGradient>
            <filter id="quest-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>
        <rect width="${vbW}" height="${vbH}" fill="url(#quest-sky)"/>
        <path d="M0 ${vbH - 120} Q90 ${vbH - 160} 180 ${vbH - 130} T360 ${vbH - 110} L360 ${vbH} L0 ${vbH} Z" fill="url(#quest-ground)" opacity="0.85"/>
        <path d="M0 ${vbH - 95} Q120 ${vbH - 125} 240 ${vbH - 85} L360 ${vbH - 75} L360 ${vbH} L0 ${vbH} Z" fill="#166534" opacity="0.35"/>
        <path d="${pathD}" fill="none" stroke="#334155" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
        <path d="${pathD}" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
        ${pathProgress ? `<path d="${pathProgress}" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#quest-soft-glow)"/>` : ""}
        ${unlocked >= 1 ? `<circle cx="${pts[Math.min(unlocked - 1, pts.length - 1)].x}" cy="${pts[Math.min(unlocked - 1, pts.length - 1)].y}" r="6" fill="#fbbf24" stroke="#fef3c7" stroke-width="2" opacity="0.95"/>` : ""}
        ${nodesHtml}
    </svg>`;
     container.querySelectorAll("g[data-level]").forEach((g) => {
        const lv = parseInt(g.getAttribute("data-level"), 10);
        const warmPrefetchForNode = () => {
            if (lv <= state.unlockedLevels) void prefetchQuestion(lv, { criterionTurnIndex: 0 });
        };
        g.addEventListener("focus", warmPrefetchForNode);
        g.addEventListener("click", () => {
            if (lv <= state.unlockedLevels) {
                void prefetchQuestion(lv, { criterionTurnIndex: 0 });
                void (async () => {
                    await resumeCombatSfxContext();
                    await startGame(lv);
                })();
            }
        });
        g.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === " ") && lv <= state.unlockedLevels) {
                e.preventDefault();
                void prefetchQuestion(lv, { criterionTurnIndex: 0 });
                void (async () => {
                    await resumeCombatSfxContext();
                    await startGame(lv);
                })();
            }
        });
        if (lv <= state.unlockedLevels) {
            g.setAttribute("tabindex", "0");
            g.setAttribute("role", "button");
        }
    });
    const mapScroll = document.querySelector(".quest-map-wrap");
    if (mapScroll) mapScroll.scrollTop = 0;
    syncAiRouteNotice();
    syncMapQuestionBufferHint();
    syncEngagementHud();
    syncQuestionsApiBadge();
     // Non-blocking: generate bosses for newly visible infinite levels (so map portraits/names fill in).
    const targets = [];
    for (let lv = Math.max(11, state.unlockedLevels); lv <= Math.max(11, state.unlockedLevels + 2); lv++) targets.push(lv);
    targets.forEach((lv) => {
        if (lv > QUEST_ROUTE.length && !state.bossCacheByLevel?.[lv]) {
            ensureGeneratedBossForLevel(lv)
                .then(() => {
                    const ls = document.getElementById("level-screen");
                    if (ls && !ls.classList.contains("hidden")) renderLevelMenu();
                })
                .catch((e) => console.warn("boss prefetch failed", e));
        }
    });
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Minimum time the VS intro stays up (masks fast prefetches). */
const VS_MIN_MS = 1600;
/** Minimum time the judge “charging” phase runs. */
const JUDGE_MIN_MS = 3000;

const JUDGE_CHARGE_FLAVOR_LINES = [
    "Focusing logic…",
    "Formulating proof…",
    "Channeling algebraic power…"
];

function runTypewriterText(el, text, msPerChar) {
    if (!el) return { promise: Promise.resolve(), cancel: () => {} };
    el.textContent = "";
    const chars = Array.from(text);
    let i = 0;
    let cancelled = false;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let tid = null;
    const promise = new Promise((resolve) => {
        const tick = () => {
            if (cancelled) {
                resolve();
                return;
            }
            if (i >= chars.length) {
                resolve();
                return;
            }
            el.textContent += chars[i];
            i++;
            tid = setTimeout(tick, msPerChar);
        };
        tick();
    });
    const cancel = () => {
        cancelled = true;
        if (tid) clearTimeout(tid);
    };
    return { promise, cancel };
}

let judgeChargeFlavorTimer = null;
function clearJudgeChargingUi() {
    if (judgeChargeFlavorTimer != null) {
        clearInterval(judgeChargeFlavorTimer);
        judgeChargeFlavorTimer = null;
    }
    document.getElementById("interaction-panel")?.classList.remove("interaction-panel--charging");
    document.getElementById("battle-arena")?.classList.remove("judge-duel-active");
    const jo = document.getElementById("judge-charging-overlay");
    if (jo) {
        jo.classList.add("hidden");
        jo.setAttribute("aria-hidden", "true");
    }
    const jf = document.getElementById("judge-charging-flavor");
    if (jf) jf.textContent = "";
    document.getElementById("player-sprite")?.classList.remove("combat-hero-charging");
    document.getElementById("enemy-sprite")?.classList.remove("combat-enemy-charging");
}

async function startJudgeChargingUi() {
    await resumeCombatSfxContext();
    const panel = document.getElementById("interaction-panel");
    const jo = document.getElementById("judge-charging-overlay");
    const jf = document.getElementById("judge-charging-flavor");
    const ps = document.getElementById("player-sprite");
    const es = document.getElementById("enemy-sprite");
    const arena = document.getElementById("battle-arena");
    panel?.classList.add("interaction-panel--charging");
    arena?.classList.add("judge-duel-active");
    if (jo) {
        jo.classList.remove("hidden");
        jo.setAttribute("aria-hidden", "false");
    }
    if (jf) jf.textContent = JUDGE_CHARGE_FLAVOR_LINES[0];
    let fi = 0;
    judgeChargeFlavorTimer = setInterval(() => {
        fi = (fi + 1) % JUDGE_CHARGE_FLAVOR_LINES.length;
        if (jf) jf.textContent = JUDGE_CHARGE_FLAVOR_LINES[fi];
    }, 900);
    ps?.classList.add("combat-hero-charging");
    es?.classList.add("combat-enemy-charging");
    void playMagicChargeUp(JUDGE_MIN_MS / 1000);
}

async function runVsEncounterThenLoadQuestion(qMeta) {
    await resumeCombatSfxContext();
    const overlay = document.getElementById("vs-encounter-overlay");
    const heroSlot = document.getElementById("vs-portrait-hero");
    const bossSlot = document.getElementById("vs-portrait-boss");
    const tauntEl = document.getElementById("vs-taunt-line");
    if (!overlay || !heroSlot || !bossSlot || !tauntEl) {
        if (!state.nextQuestion) {
            document.getElementById("question-text").innerText = "Summoning math magic...";
            document.getElementById("mcq-grid").innerHTML = "";
            updateQuestionSourceBadge(null);
        }
        await loadQuestion();
        return;
    }
    const heroEl = document.getElementById("player-sprite");
    const enemyEl = document.getElementById("enemy-sprite");
    heroSlot.innerHTML = heroEl ? heroEl.innerHTML : "";
    bossSlot.innerHTML = enemyEl ? enemyEl.innerHTML : "";
    const bossName = String(qMeta?.name || "Boss").trim() || "Boss";
    const tauntFull = `${bossName.toUpperCase()} BLOCKS YOUR PATH!`;
    tauntEl.textContent = "";
    overlay.classList.remove("hidden", "vs-encounter--exit");
    overlay.classList.add("vs-encounter--enter");
    overlay.setAttribute("aria-hidden", "false");
    void playVsEncounterSwoosh();
    requestAnimationFrame(() => {
        overlay.classList.add("vs-encounter--flash");
    });
    setTimeout(() => {
        overlay.classList.add("vs-encounter--portraits-in");
        void playVsPortraitThud();
        setTimeout(() => void playVsPortraitThud(), 130);
    }, 90);
    const tw = runTypewriterText(tauntEl, tauntFull, 26);
    if (!state.nextQuestion) {
        document.getElementById("question-text").innerText = "Summoning math magic...";
        document.getElementById("mcq-grid").innerHTML = "";
        updateQuestionSourceBadge(null);
    }
    try {
        // Keep the cinematic snappy: enforce a short minimum time, but don't block on the full typewriter.
        await Promise.all([loadQuestion(), delay(VS_MIN_MS)]);
    } catch (e) {
        console.error("loadQuestion during VS encounter:", e);
        throw e;
    } finally {
        try {
            if (tw && typeof tw.cancel === "function") tw.cancel();
        } catch (_) {}
        overlay.classList.add("vs-encounter--exit");
        await delay(520);
        overlay.classList.add("hidden");
        overlay.classList.remove(
            "vs-encounter--enter",
            "vs-encounter--flash",
            "vs-encounter--portraits-in",
            "vs-encounter--exit"
        );
        tauntEl.textContent = "";
        overlay.setAttribute("aria-hidden", "true");
    }
}

 /** Ensures battle screen never waits unbounded on live AI. */
async function raceWithPrefetchTimeout(promise, ms) {
    let tid;
    const timeout = new Promise((_, rej) => {
        tid = setTimeout(() => {
            const e = new Error(
                `Live AI did not finish within ${Math.round(ms / 1000)}s — using offline questions.`
            );
            e.code = "PREFETCH_TIMEOUT";
            rej(e);
        }, ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(tid);
    }
}
 /** Used when live AI fails — must vary so battles are not identical every turn. */
const FALLBACK_QUESTIONS = [
    {
        topic_category: "Algebra",
        criterion: "A",
        text: "Solve \\(x+5=12\\).",
        expected_answer: "7",
        success_criteria: "- Show the inverse operation.\n- Write the final value of \\(x\\).\n- Quick check by substituting back.",
        ideal_explanation: "Subtract \\(5\\) from both sides: \\(x = 12 - 5 = 7\\). Check: \\(7+5=12\\).",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate \\(2 + 3 \\times 4\\).",
        expected_answer: "14",
        success_criteria: "- Use correct order of operations.\n- Show the intermediate multiplication.",
        ideal_explanation: "Multiply first: \\(3 \\times 4 = 12\\), then \\(2 + 12 = 14\\).",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate \\(\\frac{1}{2} + \\frac{1}{4}\\).",
        expected_answer: "\\(\\frac{3}{4}\\)",
        success_criteria: "- Use a common denominator.\n- Combine numerators.\n- Simplify if needed.",
        ideal_explanation: "Use a common denominator: \\(\\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}\\).",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate \\(8 - 3\\).",
        expected_answer: "5",
        success_criteria: "- Correct subtraction.\n- Final statement.",
        ideal_explanation: "Subtract: \\(8 - 3 = 5\\).",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Geometry",
        criterion: "C",
        text: "A square has side length \\(4\\). Determine its perimeter.",
        expected_answer: "16",
        success_criteria: "- State the perimeter rule.\n- Show multiplication.\n- Include units if given.",
        ideal_explanation: "Perimeter of a square is \\(4 \\times \\text{side} = 4 \\times 4 = 16\\).",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate \\(9 \\div 3\\).",
        expected_answer: "3",
        success_criteria: "- Correct division.\n- Final statement.",
        ideal_explanation: "\\(9 \\div 3 = 3\\).",
        visual_type: "none",
        visual_spec: null,
        plotly_spec: "",
        type: "input"
    }
];
 function pickFallbackQuestion(excludeText) {
    const ex = normalizeQuestionStem(excludeText);
    const filtered = FALLBACK_QUESTIONS.filter((q) => normalizeQuestionStem(q.text) !== ex);
    const pool = filtered.length ? filtered : FALLBACK_QUESTIONS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { ...pick, _questionSource: "offline" };
}
 function buildMathQuestionPrompt(mapLevelOverride, opts = {}) {
    const mapLevel =
        Number.isFinite(mapLevelOverride) && mapLevelOverride >= 1
            ? Math.floor(mapLevelOverride)
            : state.currentLevel;
    const criterionTurn =
        typeof opts.criterionTurnIndex === "number" && Number.isFinite(opts.criterionTurnIndex)
            ? Math.floor(opts.criterionTurnIndex)
            : state.turnIndex;
    if (!state.skillProfile || typeof state.skillProfile !== "object") state.skillProfile = normalizeSkillProfile(null);
    ensureCanonicalSkillTopicsInPlace(state.skillProfile);
    const strandSeq =
        typeof state.strandRotationSeq === "number" && state.strandRotationSeq >= 0
            ? Math.floor(state.strandRotationSeq)
            : 0;
    const pinned =
        state.battlePinnedTopic != null && String(state.battlePinnedTopic).trim() !== ""
            ? String(state.battlePinnedTopic).trim()
            : null;
    const profileBefore = {
        strandRotationSeq: strandSeq,
        battlePinnedTopic: pinned,
        skillProfile: skillProfileCanonicalSnapshotForLog(state.skillProfile),
        turnIndex: criterionTurn,
        mapLevel,
        forceEasierNextQuestion: state.forceEasierNextQuestion === true
    };
    const bundle = buildCombatQuestionUserPrompt({
        mapLevel,
        forceEasierNextQuestion: state.forceEasierNextQuestion === true,
        turnIndex: criterionTurn,
        skillProfile: state.skillProfile,
        strandRotationSeq: strandSeq,
        playerName: state.playerName,
        enemyName: String(getQuestNode(mapLevel)?.name || "Enemy"),
        activeQuestionText: state.activeQuestion?.text ?? null,
        pinnedTopic: pinned,
        cosmeticsTier: Math.min(
            MAX_COSMETIC_TIER,
            Math.max(0, Math.floor(typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0))
        ),
        rng: Math.random
    });
    const m = bundle.meta || {};
    const nextSeq = bundle.nextStrandRotationSeq;
    const nextIdx = Number.isFinite(nextSeq) ? Math.floor(nextSeq) : 0;
    const nextRotationStrand = CANONICAL_SKILL_TOPICS[nextIdx % CANONICAL_SKILL_TOPICS.length];
    console.groupCollapsed("[topicRotation] combat prompt");
    console.log("1. From student profile (inputs to this prompt build)", profileBefore);
    console.log("2. Topic decision steps", {
        strandSeq: m.strandSeq,
        rotationTopic: m.rotationTopic,
        battlePinned: m.battlePinned,
        chosenTopic: bundle.chosenTopic,
        targetCriterion: bundle.targetCriterion,
        strandRotationSeqUnchanged: nextSeq
    });
    console.log(
        "3. Profile: strandRotationSeq advances only at battle start (not here); skill profile unchanged by prompt build"
    );
    console.log("4. Next rotation slot index (reference only)", {
        strandRotationSeq: state.strandRotationSeq,
        nextRotationStrand
    });
    console.groupEnd();
    return { prompt: bundle.prompt, chosenTopic: bundle.chosenTopic, targetCriterion: bundle.targetCriterion };
}
function applyPedagogyLabelsToCombatQuestion(q, pedagogy) {
    if (!q || !pedagogy || typeof pedagogy !== "object") return q;
    const topic = pedagogy.chosenTopic;
    const crit = pedagogy.targetCriterion;
    if (topic && typeof topic === "string") q.topic_category = topic;
    if (crit != null && String(crit).trim()) {
        const u = String(crit).trim().toUpperCase().slice(0, 1);
        if (u === "A" || u === "B" || u === "C" || u === "D") q.criterion = u;
    }
    return q;
}
 function canUseSecureAiBridge() {
    try {
        return !!(isFirebaseReady && auth && auth.currentUser);
    } catch (_) {
        return false;
    }
}
 /** Smoke test via HTTPS Callable (no browser API key). */
 async function smokePingSecureAi(modelId, signal) {
    const bodyBase = {
        model: modelId,
        messages: [{ role: "user", content: 'Output only JSON: {"ping":"ok"}' }],
        max_tokens: 48,
        response_format: { type: "json_object" }
    };
    const attemptOnce = async () => {
        const p = callGenerateCombatQuestion(bodyBase);
        if (!signal) return p;
        return Promise.race([
            p,
            new Promise((_, rej) => {
                if (signal.aborted) {
                    rej(new DOMException("Aborted", "AbortError"));
                    return;
                }
                signal.addEventListener(
                    "abort",
                    () => {
                        rej(new DOMException("Aborted", "AbortError"));
                    },
                    { once: true }
                );
            })
        ]);
    };
    let data = await attemptOnce();
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const tryPlain = async () => {
        const p = callGenerateCombatQuestion({
            model: modelId,
            messages: [{ role: "user", content: 'Output only JSON: {"ping":"ok"}' }],
            max_tokens: 48
        });
        if (!signal) return p;
        return Promise.race([
            p,
            new Promise((_, rej) => {
                signal.addEventListener("abort", () => rej(new DOMException("Aborted", "AbortError")), { once: true });
            })
        ]);
    };
    let content = data?.choices?.[0]?.message?.content;
    if (content == null || String(content).trim() === "") {
        data = await tryPlain();
        content = data?.choices?.[0]?.message?.content;
    }
    if (content == null || String(content).trim() === "") throw new Error("Secure AI: empty content");
    const ping = parseAndValidate(SmokePingSchema, content, { lenient: true });
    if (!ping.ok) throw new Error(ping.issuesText || "Smoke ping schema invalid");
}
 async function runAiApiRegression() {
    const el = document.getElementById("t-ai");
    const set = (label, cls, title) => {
        safeSet("t-ai", label);
        if (el) {
            el.className = cls;
            el.title = title || "";
        }
    };
    const { dsModel } = getConfiguredAiKeys();
    if (!canUseSecureAiBridge()) {
        lastAiConnectivityCheck = {
            ok: false,
            summary: "No secure AI bridge",
            detail:
                "Sign in with Firebase (anonymous is fine) so the app can call generateCombatQuestion. Offline pool only until then."
        };
        set(
            "AI: SKIP",
            "text-slate-400 font-bold",
            "No Firebase session — offline pool only. After the cloud connects, live MCQs use the secure Cloud Function (no browser API key)."
        );
        syncQuestionsApiBadge();
        return;
    }
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 22000);
    lastAiConnectivityCheck = { ok: null, summary: "", detail: "" };
    syncQuestionsApiBadge();
    try {
        await smokePingSecureAi(dsModel, ctrl.signal);
        clearTimeout(tid);
        const bridgeLabel = `Secure callable · ${dsModel}`;
        lastAiConnectivityCheck = {
            ok: true,
            summary: "API reachable",
            detail: bridgeLabel
        };
        set(
            "AI: PASS",
            "text-green-400 font-bold",
            `${lastAiConnectivityCheck.detail} — Smoke ping only (tiny JSON). The strip does not mean this battle’s MCQ is live; read the label above the question text.`
        );
    } catch (e) {
        clearTimeout(tid);
        if (e && e.isRateLimit) {
            lastAiConnectivityCheck = {
                ok: false,
                summary: "Rate limited (429)",
                detail: e.message || "Upstream busy — try again later"
            };
            set(
                "AI: 429",
                "text-amber-400 font-bold",
                (e.message || "Rate limited") +
                    " — Smoke failed; live MCQs may still work or fall back to offline (see banner above question)."
            );
            syncQuestionsApiBadge();
            return;
        }
        const msg = e && e.name === "AbortError" ? "Timeout (22s)" : e && e.message ? e.message : String(e);
        lastAiConnectivityCheck = { ok: false, summary: "API check failed", detail: msg };
        set(
            "AI: FAIL",
            "text-red-400 font-bold",
            msg + " — Smoke only; check the MCQ source banner and Questions chip on the battle screen."
        );
        console.warn("AI API regression:", e);
    }
    syncQuestionsApiBadge();
}
 function dashScopeQuestionUserSuffix() {
    return (
        "\n\nHARD REQUIREMENTS — return exactly one JSON object with keys IN THIS ORDER:\n" +
        "1) _thought_process — string: required plan before story (see system prompt): MATH TARGET → SOLUTION → STORY MAPPING → DRAFT; unlimited length.\n" +
        "2) topic_category\n" +
        "3) criterion\n" +
        "4) Exactly ONE of: text (string) OR text_blocks (array) — not both.\n" +
        "5) expected_answer\n" +
        "6) success_criteria\n" +
        "7) ideal_explanation — FINAL polished explanation for the student only; max 4 sentences; NO internal monologue.\n" +
        '8) visual_type — "none", "gom", or "plotly" (see system prompt §5).\n' +
        "9) visual_spec — null OR a GOM object { viewBox, elements } when visual_type is gom; null otherwise.\n" +
        '10) plotly_spec — "" OR a JSON string of a Plotly figure when visual_type is plotly; "" otherwise.\n' +
        '11) type — must be "input".\n' +
        "- Key names must match the schema exactly: use \"criterion\" (single letter A–D), never criterion_letter or criterionLetter. Do not add difficulty_band, combat_state, or stem — only text or text_blocks for the stem.\n" +
        "- No other keys. criterion must match this user prompt (A/B/C/D). If US dollars and algebra appear together, use text_blocks (omit text).\n" +
        "- expected_answer: short canonical answer (LaTeX OK); same units/ledger as the story. success_criteria: one string, 2–5 lines starting \"- \", for this criterion letter.\n" +
        "- Diagrams: see system prompt §5 (gom + visual_spec OR plotly + plotly_spec). If no diagram, visual_type \"none\", visual_spec null, plotly_spec \"\".\n" +
        "- Put scratchpad only in _thought_process — not in ideal_explanation.\n" +
        "- In prose strings, use single quotes for nested speech so JSON stays valid (avoid raw \" inside values).\n" +
        "- Scope: IB MYP Year 7–8 band from the prompt; no calculus/trig/logs/quadratic formula as the main skill.\n" +
        "- LaTeX in JSON strings: double each backslash (e.g. \\\\frac).\n" +
        "\nOutput only the JSON object — no markdown, no code fences, no commentary."
    );
}
 async function fetchQuestionViaDashScope(basePrompt, pedagogy = null) {
    if (!canUseSecureAiBridge()) {
        throw new Error("Secure AI bridge unavailable (Firebase Auth required for live combat questions)");
    }
    const { dsModel } = getConfiguredAiKeys();
    const systemMsg = {
        role: "system",
        content: getCombatQuestionSystemPrompt()
    };
    const questionBackoff = { min429DelayMs: 3500, maxDelayMs: 22000, initialDelayMs: 1000 };
    const fetchQuestionRaw = async (userContent) => {
        const messages = [systemMsg, { role: "user", content: userContent }];
        // Qwen: lower temperature reduces repetitive "Wait…" reasoning loops.
        const base = {
            model: dsModel,
            messages,
            temperature: 0.3,
            // Keep responses bounded: long scratchpads can cause slow generations/timeouts.
            max_tokens: 2200
        };
        const chain = [
            { ...base, response_format: combatQuestionJsonSchemaResponseFormat() },
            { ...base, response_format: { type: "json_object" } },
            base
        ];
        let data;
        let lastErr;
        for (let ci = 0; ci < chain.length; ci++) {
            try {
                data = await callGenerateCombatQuestionWithBackoff(chain[ci], questionBackoff);
                lastErr = null;
                break;
            } catch (e) {
                lastErr = e;
                const code = e && e.code ? String(e.code) : "";
                const m = e && e.message ? String(e.message) : "";
                const is400 =
                    code.includes("failed-precondition") ||
                    m.includes("400") ||
                    m.includes("DashScope 400");
                if (is400 && ci < chain.length - 1) continue;
                throw e;
            }
        }
        if (!data) throw lastErr || new Error("DashScope: request failed");
        if (data && data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }
        const content = data?.choices?.[0]?.message?.content;
        logCombatQuestionLlmExchange(systemMsg.content, userContent, content);
        return content;
    };
    const parseFinalizeCombat = (content) => {
        const pv = parseAndValidate(CombatQuestionSchema, content, { lenient: true });
        if (!pv.ok) return { err: pv.issuesText || "Zod schema failed" };
        try {
            finalizeCombatQuestion(pv.data);
            return { data: pv.data };
        } catch (e) {
            return { err: e && e.message ? e.message : String(e) };
        }
    };
    const callModel = async (userContent) => {
        const maxAttempts = 4;
        let lastErr = "";
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const content = await fetchQuestionRaw(
                attempt === 0
                    ? userContent
                    : userContent +
                          "\n\nYour previous output failed validation. Output one corrected JSON object only.\n" +
                          lastErr +
                          "\n\nCRITICAL FIXES:\n" +
                          '- Keep numbers consistent: Do NOT put any numbers in prose unless the SAME numbers also appear in the formal math (\\(...\\) or inline_math). Remove countdowns, ages, quantities, and "flavor numbers".\n' +
                          '- If you mention a number in the story (including currency), it must appear in the equation/expressions exactly.\n' +
                          '- Include every required key: expected_answer, success_criteria, ideal_explanation, visual_type, visual_spec, plotly_spec, type, criterion.\n' +
                          '- The field must be named "criterion" (A/B/C/D), not criterion_letter.\n'
            );
            const r = parseFinalizeCombat(content);
            if (!r.err) return r.data;
            lastErr = r.err;
        }
        throw new Error(`Combat question validation: ${lastErr || "unknown error"}`);
    };
     const recentSet = new Set((state.recentQuestionStems || []).slice(0, MAX_RECENT_STEMS));
    const isDup = (t) => {
        const n = normalizeQuestionStem(t);
        return !!n && recentSet.has(n);
    };
    const recentStemsAvoidBlock = () =>
        (state.recentQuestionStems || []).slice(0, 10).map((s) => `- ${s}`).join("\n");
    /** Regenerate when the stem matches persisted recent history (also call after diagram retries — those can reintroduce a duplicate). */
    const ensureStemNotInRecentHistory = async (p) => {
        if (!isDup(p.text)) return p;
        const avoid = recentStemsAvoidBlock();
        let next = await callModel(
            basePrompt +
                dashScopeQuestionUserSuffix() +
                "\n\nCritical: You repeated a recent question. Regenerate a clearly different problem (new numbers, different story, different structure). Avoid anything similar to these recent stems:\n" +
                avoid
        );
        if (isDup(next.text)) {
            next = await callModel(
                basePrompt +
                    dashScopeQuestionUserSuffix() +
                    "\n\nFinal warning: you repeated a recent question AGAIN. Output a brand-new problem with different numbers/context and a different structure. Do not reuse any prior stem patterns."
            );
        }
        if (isDup(next.text)) {
            throw new Error("DashScope returned a duplicate question stem (recent history)");
        }
        return next;
    };
    /** Same numbers + same equation “shape” as the question still on screen (model often ignores prose warnings). */
    const ensureStemNotNumericCloneOfActive = async (p) => {
        const active = state.activeQuestion?.text;
        if (!active || !stemsShareHeavyNumberMultiset(p.text, active, 4)) return p;
        let next = await callModel(
            basePrompt +
                dashScopeQuestionUserSuffix() +
                "\n\nCritical: Your JSON reused the SAME key numbers (and effectively the same problem) as the player's CURRENT on-screen stem. Change every significant quantity, the setting, and the equation — do not output another version of the same moat/pump/rate story with identical data."
        );
        next = await ensureStemNotInRecentHistory(next);
        if (state.activeQuestion?.text && stemsShareHeavyNumberMultiset(next.text, state.activeQuestion.text, 4)) {
            next = await callModel(
                basePrompt +
                    dashScopeQuestionUserSuffix() +
                    "\n\nFinal attempt: the stem still matches the current battle question's numeric pattern. Invent a totally different scenario and different numbers (no shared multiset of four or more story integers)."
            );
            next = await ensureStemNotInRecentHistory(next);
        }
        if (state.activeQuestion?.text && stemsShareHeavyNumberMultiset(next.text, state.activeQuestion.text, 4)) {
            throw new Error("DashScope returned a numeric clone of the active combat question");
        }
        return next;
    };
     let parsed = await callModel(basePrompt + dashScopeQuestionUserSuffix());
    parsed = await ensureStemNotInRecentHistory(parsed);
    parsed = await ensureStemNotNumericCloneOfActive(parsed);
    // Quantity tales, marbles, and rate/inflow stories require a chart (Plotly) or schematic (GOM).
    if (combatQuestionRequiresDiagram(parsed)) {
        const chartRetries = 3;
        for (let i = 0; i < chartRetries && !hasRenderableCombatVisual(parsed); i++) {
            parsed = await callModel(
                basePrompt +
                    dashScopeQuestionUserSuffix() +
                    "\n\nYour previous JSON was rejected: this stem needs a diagram (quantity story, marble/bag tale, OR inflow/outflow/rate problem).\n" +
                    'Prefer visual_type "plotly" with plotly_spec as a JSON **string** (escaped) containing a Plotly bar chart (e.g. Start/Change/End) with numeric y and category labels — OR use "gom" + visual_spec for a simple schematic per system prompt §5.\n' +
                    "plotly_spec must be a string value in the outer JSON, not a raw nested object."
            );
            parsed = await ensureStemNotInRecentHistory(parsed);
            parsed = await ensureStemNotNumericCloneOfActive(parsed);
        }
        if (!hasRenderableCombatVisual(parsed)) {
            throw new Error("DashScope returned no valid diagram (plotly_spec or gom visual_spec) for a story that requires one");
        }
    }
    parsed = await ensureStemNotInRecentHistory(parsed);
    parsed = await ensureStemNotNumericCloneOfActive(parsed);
    applyPedagogyLabelsToCombatQuestion(parsed, pedagogy);
    return Object.assign(parsed, { _questionSource: "dashscope", _dashscopeModel: dsModel });
}
 function getPrefetchTimeoutMs() {
    // One combat question can trigger several HTTP calls (validate retry, dup, chart); allow enough wall time.
    // - query: ?aiTimeoutMs=90000
    // - config: window.__prefetch_ai_timeout_ms = 90000
    let ms = 90000;
    try {
        const qs = new URLSearchParams(location.search);
        const v = qs.get("aiTimeoutMs");
        if (v) {
            const n = parseInt(v, 10);
            if (Number.isFinite(n) && n >= 5000 && n <= 180000) ms = n;
        }
    } catch (_) {}
    try {
        const cfg = typeof window !== "undefined" ? window.__prefetch_ai_timeout_ms : null;
        const n = typeof cfg === "number" ? cfg : parseInt(String(cfg || ""), 10);
        if (Number.isFinite(n) && n >= 5000 && n <= 180000) ms = n;
    } catch (_) {}
    return ms;
}
 async function prefetchQuestion(levelOverride, opts = {}) {
    const targetLevel =
        Number.isFinite(levelOverride) && levelOverride >= 1
            ? Math.floor(levelOverride)
            : state.currentLevel;
    if (fetchPromise && prefetchPromiseForLevel === targetLevel) return fetchPromise;
    const runId = ++prefetchRunId;
    const levelWhenScheduled = targetLevel;
    prefetchPromiseForLevel = levelWhenScheduled;
    fetchPromise = (async () => {
        prefetchInFlightCount += 1;
        prefetchInFlight = prefetchInFlightCount > 0;
        syncMapQuestionBufferHint();
        syncQuestionsApiBadge();
        const built = buildMathQuestionPrompt(levelWhenScheduled, opts);
        const cancelLateAi = { cancelled: false };
        const assignIfStillRelevant = (q, allowAfterCatch = false) => {
            if (!q) return;
            if (runId !== prefetchRunId) return;
            if (!allowAfterCatch && cancelLateAi.cancelled) return;
            q._prefetchForLevel = levelWhenScheduled;
            state.nextQuestion = q;
        };
        try {
            await raceWithPrefetchTimeout(
                (async () => {
                    if (!canUseSecureAiBridge()) throw new Error("Secure AI bridge unavailable (Firebase Auth required)");
                    const q = await fetchQuestionViaDashScope(built.prompt, {
                        chosenTopic: built.chosenTopic,
                        targetCriterion: built.targetCriterion
                    });
                    assignIfStillRelevant(q);
                })(),
                getPrefetchTimeoutMs()
            );
        } catch (e) {
            cancelLateAi.cancelled = true;
            console.error("prefetchQuestion (live AI failed, using offline pool):", e);
            setPrefetchFailureFromError(e);
            const fb = pickFallbackQuestion(state.activeQuestion?.text);
            assignIfStillRelevant(fb, true);
        } finally {
            prefetchInFlightCount = Math.max(0, prefetchInFlightCount - 1);
            prefetchInFlight = prefetchInFlightCount > 0;
            if (runId === prefetchRunId) {
                fetchPromise = null;
                prefetchPromiseForLevel = null;
            }
            syncAiRouteNotice();
            syncMapQuestionBufferHint();
            syncQuestionsApiBadge();
        }
    })();
    return fetchPromise;
}
 async function startGame(level) {
    await resumeCombatSfxContext();
    closeAllMapHudOverlays();
    state.currentLevel = level;
    if (state.nextQuestion) {
        const pl = state.nextQuestion._prefetchForLevel;
        if (pl !== undefined && pl !== level) state.nextQuestion = null;
        else if (pl === undefined && level !== 1) state.nextQuestion = null;
    }
    state.turnIndex = 0;
    if (!state.skillProfile || typeof state.skillProfile !== "object") state.skillProfile = normalizeSkillProfile(null);
    ensureCanonicalSkillTopicsInPlace(state.skillProfile);
    const battleTopic = pickBattlePinnedTopic(state.skillProfile, state.strandRotationSeq);
    state.battlePinnedTopic = battleTopic;
    state.strandRotationSeq =
        typeof state.strandRotationSeq === "number" && state.strandRotationSeq >= 0
            ? Math.floor(state.strandRotationSeq) + 1
            : 1;
    if (state.playerName) saveLocalProfile(state.playerName);
    state.playerHP = COMBAT_BOSS_HP;
    state.enemyHP = COMBAT_BOSS_HP;
    clearBattleDamageOverlay();
    state.comboCount = 0;
    state.comboActive = false;
    state.potionUsedThisBattle = false;
    state.forceEasierNextQuestion = false;
    state.nextEnemyAttackZero = false;
    state.requireReflection = false;
    state._battleParticipation = { firstCastDone: false, reflectionDone: false };
    const combo = document.getElementById("combo-badge");
    if (combo) combo.classList.add("hidden");
    let qMeta = getQuestNode(level);
    safeSet('enemy-name', qMeta.name);
    safeSet('enemy-lvl-display', level);
    const spriteEl = document.getElementById("enemy-sprite");
    if (spriteEl) spriteEl.innerHTML = battleBossSvgMarkup(level);
    updateHP();

    // Instantly transition the UI (before any await — keeps BGM audio.play() in user-gesture chain on all levels)
    document.getElementById('level-screen').classList.add('hidden');
    document.getElementById('battle-screen').classList.remove('hidden');
    void startCombatBgmFromUserGesture();
    if (level > QUEST_ROUTE.length) {
        try {
            await ensureGeneratedBossForLevel(level);
        } catch (e) {
            console.warn("Boss generation failed; using fallback art:", e);
        }
        qMeta = getQuestNode(level);
        safeSet('enemy-name', qMeta.name);
        safeSet('enemy-lvl-display', level);
        if (spriteEl) spriteEl.innerHTML = battleBossSvgMarkup(level);
        updateHP();
    }
    await runVsEncounterThenLoadQuestion(qMeta);
}
 async function loadQuestion() {
    if (loadQuestionInFlight) {
        return loadQuestionInFlight;
    }
    loadQuestionInFlight = (async () => {
        try {
            await loadQuestionOnce();
        } finally {
            loadQuestionInFlight = null;
        }
    })();
    return loadQuestionInFlight;
}
 async function loadQuestionOnce() {
    clearBattleDamageOverlay();
    if (!state.nextQuestion) {
        await prefetchQuestion(undefined, { criterionTurnIndex: state.turnIndex });
    }
    let q = state.nextQuestion;
    state.nextQuestion = null;
    if (!q) {
        q = pickFallbackQuestion(state.activeQuestion?.text);
    }
    const priorStem = state.activeQuestion?.text;
    if (
        priorStem != null &&
        String(priorStem).trim() &&
        (normalizeQuestionStem(q.text) === normalizeQuestionStem(priorStem) ||
            stemsShareHeavyNumberMultiset(q.text, priorStem, 4))
    ) {
        console.warn("[MathBattler] Consecutive duplicate / numeric-clone stem from buffer — swapping to offline pool.");
        q = pickFallbackQuestion(priorStem);
    }
    state.activeQuestion = q;
    rememberQuestionStem(q.text);
    updateEnemyTauntLine();
    state.forceEasierNextQuestion = false;
    if (q._questionSource === "dashscope" || q._questionSource === "openrouter" || q._questionSource === "gemini") {
        clearPrefetchFailureUi();
        syncAiRouteNotice();
        syncMapQuestionBufferHint();
    }
     prefetchQuestion(undefined, { criterionTurnIndex: state.turnIndex + 1 });

    const qEl = document.getElementById('question-text');
    qEl.innerHTML = proseWithMathToHtml(q.text);
    MathJax.typesetPromise([qEl]);
    mountCombatVisual(document.getElementById("question-visual-container"), q);
     const grid = document.getElementById('mcq-grid');
    if (grid) grid.classList.add("hidden");
    const form = document.getElementById("answer-form");
    if (form) form.classList.remove("hidden");
    const reasoningEl = document.getElementById("answer-input");
    if (reasoningEl) reasoningEl.value = "";
     updateQuestionSourceBadge(q);
    syncQuestionsApiBadge();
}
 function updateHP() {
    safeSet('player-hp-bar', `${state.playerHP}%`, 'style.width');
    safeSet('enemy-hp-bar', `${state.enemyHP}%`, 'style.width');
    const es = document.getElementById("enemy-sprite");
    if (es) {
        es.classList.remove("enemy-lowhp", "enemy-breathe");
        if (state.enemyHP > 0 && state.enemyHP < 20) es.classList.add("enemy-lowhp");
        else es.classList.add("enemy-breathe");
    }
}
 function showDamage(id, amt) {
    const el = document.getElementById(id);
    el.innerText = `-${amt}`;
    el.classList.remove("animate-damage");
    void el.offsetWidth;
    el.classList.add("animate-damage");
    setTimeout(() => el.classList.remove("animate-damage"), 1000);
}
 function clearCombatJuiceClasses() {
    document.getElementById("player-sprite")?.classList.remove("combat-player-lunge", "combat-player-hit");
    document.getElementById("enemy-sprite")?.classList.remove("combat-enemy-lunge", "combat-enemy-hit");
    document.getElementById("battle-impact-flash")?.classList.remove("battle-flash-on", "battle-flash-heavy");
}
 /**
 * Pokémon TCG–style strike: hero lunge → impact flash → HP + floating numbers → optional enemy counter lunge.
 * Resolves after the sequence so the solution overlay does not cover the hit moment.
 */
 function playCombatStrikeSequence(dmg, hitStop) {
    return new Promise((resolve) => {
        const bS = document.getElementById("battle-screen");
        const fb = document.getElementById("combat-feedback");
        const flash = document.getElementById("battle-impact-flash");
        const pSprite = document.getElementById("player-sprite");
        const eSprite = document.getElementById("enemy-sprite");
        const tHit = 260 + (hitStop || 0);

        const applyHpAndNumbers = () => {
            if (fb) fb.style.opacity = "0";
            if (dmg.enemy > 0) {
                if (bS) {
                    bS.classList.remove("animate-shake", "animate-shake-hard");
                    void bS.offsetWidth;
                    bS.classList.add("animate-shake-hard");
                }
                flash?.classList.add("battle-flash-on", "battle-flash-heavy");
                setTimeout(() => flash?.classList.remove("battle-flash-on", "battle-flash-heavy"), 260);
                state.enemyHP = Math.max(0, state.enemyHP - dmg.enemy);
                showDamage("enemy-damage", dmg.enemy);
                const heroTier = Math.min(
                    MAX_COSMETIC_TIER,
                    Math.max(0, Math.floor(typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0))
                );
                void playHeroSpellImpact(heroTier, { isCrit: dmg.isCrit === true });
            }
            if (dmg.player > 0) {
                if (dmg.enemy <= 0) {
                    if (bS) {
                        bS.classList.remove("animate-shake", "animate-shake-hard");
                        void bS.offsetWidth;
                        bS.classList.add("animate-shake-hard");
                    }
                    flash?.classList.add("battle-flash-on", "battle-flash-heavy");
                    setTimeout(() => flash?.classList.remove("battle-flash-on", "battle-flash-heavy"), 240);
                }
                state.playerHP = Math.max(0, state.playerHP - dmg.player);
                showDamage("player-damage", dmg.player);
                const meta = getQuestNode(state.currentLevel);
                const enemyKind = bossStrikeSoundIndex(state.currentLevel, meta.name, QUEST_ROUTE.length);
                void playEnemyStrike(enemyKind);
            }
            updateHP();
        };

        const finish = () => {
            clearCombatJuiceClasses();
            if (bS) bS.classList.remove("animate-shake", "animate-shake-hard");
            resolve();
        };

        if (dmg.enemy > 0) {
            pSprite?.classList.add("combat-player-lunge");
            setTimeout(() => {
                eSprite?.classList.add("combat-enemy-hit");
                applyHpAndNumbers();
                pSprite?.classList.remove("combat-player-lunge");
                if (dmg.player > 0) {
                    setTimeout(() => {
                        eSprite?.classList.remove("combat-enemy-hit");
                        eSprite?.classList.add("combat-enemy-lunge");
                        pSprite?.classList.add("combat-player-hit");
                        if (bS) {
                            bS.classList.remove("animate-shake", "animate-shake-hard");
                            void bS.offsetWidth;
                            bS.classList.add("animate-shake-hard");
                        }
                        setTimeout(finish, 520);
                    }, 140);
                } else {
                    setTimeout(finish, 480);
                }
            }, tHit);
        } else if (dmg.player > 0) {
            setTimeout(() => {
                eSprite?.classList.add("combat-enemy-lunge");
                pSprite?.classList.add("combat-player-hit");
                applyHpAndNumbers();
                setTimeout(finish, 560);
            }, 200);
        } else {
            if (fb) fb.style.opacity = "0";
            setTimeout(finish, 60);
        }
    });
}
 function showUpgradeCelebration(tier) {
    const root = document.getElementById("upgrade-celebration");
    const art = document.getElementById("upgrade-celebration-art");
    const titleEl = document.getElementById("upgrade-celebration-title");
    const ps = document.getElementById("player-sprite");
    if (!root || !art || !titleEl) return;
    if (ps) art.innerHTML = ps.innerHTML;
    const ti = Math.min(MAX_COSMETIC_TIER, Math.max(1, Math.floor(tier || 1)));
    const opt = COSMETIC_EVOLUTION_OPTIONS.find((x) => x.tier === ti);
    titleEl.textContent = opt ? `Stage ${opt.stage} — ${opt.title}` : cosmeticEvolutionTitle(ti);
    root.classList.remove("hidden");
    root.classList.remove("upgrade-celebration-visible");
    requestAnimationFrame(() => {
        requestAnimationFrame(() => root.classList.add("upgrade-celebration-visible"));
    });
    if (upgradeCelebrationHideTimer != null) clearTimeout(upgradeCelebrationHideTimer);
    upgradeCelebrationHideTimer = setTimeout(() => {
        upgradeCelebrationHideTimer = null;
        root.classList.remove("upgrade-celebration-visible");
        setTimeout(() => root.classList.add("hidden"), 420);
    }, 2600);
}
 function showDetailedFeedback(msg) {
    const pf = document.getElementById("personalized-feedback");
    if (pf) {
        pf.innerHTML = proseWithMathToHtml(msg);
        if (window.MathJax?.typesetPromise) {
            MathJax.typesetPromise([pf]).catch((e) => console.warn("MathJax personalized-feedback:", e));
        }
    } else {
        safeSet("personalized-feedback", msg);
    }
     const q = state.activeQuestion || {};
    const ideal = q.ideal_explanation || "";
    const explanationEl = document.getElementById("ideal-explanation");
    if (explanationEl) {
        explanationEl.innerHTML = proseWithMathToHtml(ideal);
        if (window.MathJax) MathJax.typesetPromise([explanationEl]);
    }
     const reflectWrap = document.getElementById("reflection-wrap");
    const reflectInput = document.getElementById("reflection-input");
    const contBtn = document.getElementById("solution-continue-btn");
    if (reflectWrap && reflectInput && contBtn) {
        if (state.requireReflection) {
            reflectWrap.classList.remove("hidden");
            reflectInput.value = "";
            contBtn.disabled = true;
            contBtn.classList.add("opacity-60", "cursor-not-allowed");
            reflectInput.oninput = () => {
                const ok = String(reflectInput.value || "").trim().length >= 10;
                contBtn.disabled = !ok;
                contBtn.classList.toggle("opacity-60", !ok);
                contBtn.classList.toggle("cursor-not-allowed", !ok);
            };
        } else {
            reflectWrap.classList.add("hidden");
            reflectInput.value = "";
            contBtn.disabled = false;
            contBtn.classList.remove("opacity-60", "cursor-not-allowed");
            reflectInput.oninput = null;
        }
    }
     const plotContainer = document.getElementById("plot-container");
    if (plotContainer) {
        clearCombatVisualMount(plotContainer);
        mountCombatVisual(plotContainer, q);
    }
     document.getElementById("detailed-feedback-overlay").classList.remove("hidden");
}
 async function gradeResponseViaDashScope({ question, studentResponse }) {
    const difficultyLabel =
        state.currentLevel <= 3 ? "Foundations" : state.currentLevel <= 6 ? "IB MYP Year 7" : "IB MYP Year 8";
    return runDashScopeJudge({
        question,
        studentResponse,
        difficultyLabel,
        canUseSecureAiBridge,
        getConfiguredAiKeys,
        debugLogAiPrompt
    });
}
 function damageForJudgement(judged) {
    const band = judged?.band;
    const isCrit = judged?.isCrit === true;
    if (band === "correct_with_reasoning") return { enemy: isCrit ? 40 : 25, player: 0, label: isCrit ? "CRITICAL HIT!" : "DIRECT HIT!", isCrit };
    if (band === "correct_no_reasoning") return { enemy: 10, player: 0, label: "WEAK HIT!", isCrit: false };
    if (band === "partial") return { enemy: 8, player: 10, label: "GLANCING HIT!", isCrit: false };
    return { enemy: 0, player: 20, label: "SPELL FIZZLED!", isCrit: false };
}
 // --- PRACTICE MODE (MCQ, non-combat) ---
 function dashScopePracticeMcqSuffix() {
    return (
        "\n\nHard requirements (Qwen-compatible JSON):\n" +
        '- type must be the string "mcq".\n' +
        "- options: exactly 4 non-empty strings, plausible distractors.\n" +
        "- answer: must exactly match one element of options.\n" +
        '- visual_type: "none", "gom", or "plotly" — same rules as combat §5: use "gom" + visual_spec for static geometric schematics (shapes, labels on a grid); use "plotly" + plotly_spec (JSON string) for charts, bars, scatter, data plots.\n' +
        '- visual_spec: null OR a GOM object { "viewBox", "elements" } when visual_type is gom; null otherwise.\n' +
        '- plotly_spec: "" OR a JSON-encoded Plotly figure string when visual_type is plotly; "" otherwise.\n' +
        "- ideal_explanation: 3–6 short sentences, clear steps.\n" +
        '- "text" and ideal_explanation: plain English only — no pipe tables, # headings, **, backticks, or ```; math as \\(...\\) only (no $$; no single-dollar math wraps). Lists: lines starting with "- ".\n' +
        "\n" +
        LLM_NO_MARKDOWN_IN_STRINGS +
        "\n\nReturn one JSON object with exactly these keys: topic_category, text, answer, ideal_explanation, visual_type, visual_spec, plotly_spec, type, options. No markdown, no code fences."
    );
}
 async function fetchPracticeMcqViaDashScope({ previousStem = "" } = {}) {
    if (!canUseSecureAiBridge()) throw new Error("Secure AI bridge unavailable (Firebase Auth required)");
    const { dsModel } = getConfiguredAiKeys();
    const systemMsg = {
        role: "system",
        content:
            "You output exactly one valid JSON object and nothing else. No markdown, no code fences, no commentary. Use double quotes for JSON strings. " +
            "For diagrams: visual_type gom + visual_spec for geometric schematics; visual_type plotly + plotly_spec (JSON string) for charts/bars/data; otherwise visual_type none with visual_spec null and plotly_spec empty. " +
            LLM_NO_MARKDOWN_IN_STRINGS
    };
    const diff = state.currentLevel <= 3 ? "Introductory" : (state.currentLevel <= 6 ? "Grade 7" : "Grade 8");
    const seed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ctxIdx = pickSeededIndex(seed, "practice_mcq_ctx", MATH_BATTLE_CONTEXT_SEEDS.length);
    const contextHook = MATH_BATTLE_CONTEXT_SEEDS[ctxIdx];
    const topicIdx = pickSeededIndex(seed, "practice_mcq_topic", GENERATED_BOSS_TOPICS.length);
    const topicHint = GENERATED_BOSS_TOPICS[topicIdx];
    const prev = String(previousStem || "").trim();
    const avoidRepeat =
        prev.length > 0
            ? `\n\nMANDATORY variety: The player just saw this stem — you must NOT repeat it.\nPrior stem (do not reuse scenario, numbers, or answer structure):\n${prev.length > 450 ? `${prev.slice(0, 450)}…` : prev}\nInvent a clearly different problem (new numbers, new context). Change topic if needed; suggested strand was ${topicHint} but any MYP Year 7–8 topic is fine.`
            : "";
    const basePrompt =
        `[SEED:${seed}] Generate one unique ${diff} IB MYP Year 7/8 practice MCQ (warm-up). ` +
        `Loose context inspiration: ${contextHook}. Suggested strand: ${topicHint}. ` +
        `Keep it short and solvable quickly. Return JSON only. Use LaTeX for math.` +
        avoidRepeat;
    const postPractice = async (suffix) => {
        const userContent = basePrompt + dashScopePracticeMcqSuffix() + suffix;
        debugLogAiPrompt("dashscope.practice", userContent);
        const data = await callGenerateCombatQuestionWithBackoff(
            {
                model: dsModel,
                messages: [systemMsg, { role: "user", content: userContent }],
                response_format: { type: "json_object" },
                temperature: 0.88,
                max_tokens: 800
            },
            { min429DelayMs: 3500, maxDelayMs: 20000, initialDelayMs: 900 }
        );
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
        return data?.choices?.[0]?.message?.content;
    };
    let content = await postPractice("");
    let pv = parseAndValidate(PracticeMcqSchema, content, { lenient: true });
    if (!pv.ok) {
        content = await postPractice(
            "\n\nCRITICAL: Your previous output failed schema validation.\n" +
                pv.issuesText +
                "\n\nOutput ONLY one JSON object with keys topic_category, text, answer, ideal_explanation, visual_type, visual_spec, plotly_spec, type, options. type must be \"mcq\". Escape newlines in strings as \\n."
        );
        pv = parseAndValidate(PracticeMcqSchema, content, { lenient: true });
    }
    if (!pv.ok) throw new Error(pv.issuesText || "practice MCQ schema invalid");
    finalizePracticeMcq(pv.data);
    return pv.data;
}
 // --- INFINITE LEVEL BOSSES (levels > 10) ---
const GENERATED_BOSS_TOPICS = [
    "Algebra & Equations",
    "Fractions, Percentages & Ratios",
    "Geometry & Measurement",
    "Patterns & Sequences",
    "Data & Probability",
    "Real-Life Modeling"
];
 function fallbackGeneratedTopic(level) {
    const idx = Math.max(0, level - (QUEST_ROUTE.length + 1));
    return GENERATED_BOSS_TOPICS[idx % GENERATED_BOSS_TOPICS.length];
}
 function sanitizeHexColor(s, fallback) {
    const t = String(s || "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
    return fallback || "#94a3b8";
}
 function validateBossSvg(svgText) {
    const svg = String(svgText || "").trim();
    if (!svg.startsWith("<svg")) throw new Error("boss svg must start with <svg");
    if (!svg.includes('viewBox="0 0 100 100"')) throw new Error("boss svg missing viewBox 0 0 100 100");
    if (!svg.includes('class="w-full h-full"')) throw new Error('boss svg root must include class="w-full h-full"');
    if (!svg.includes('id="BOSS_CORE"')) throw new Error('boss svg missing id="BOSS_CORE"');
    if (!svg.includes('id="BOSS_EYE"')) throw new Error('boss svg missing id="BOSS_EYE"');
    if (!svg.includes('id="BOSS_WEAPON"')) throw new Error('boss svg missing id="BOSS_WEAPON"');
    if (!svg.includes('id="BOSS_EYE"') || !svg.includes('class="animate-pulse"')) {
        // ensure at least one animate-pulse exists; prompt requires BOSS_EYE to have it
        if (!/id="BOSS_EYE"[^>]*class="[^"]*animate-pulse/.test(svg)) {
            throw new Error('boss svg BOSS_EYE must include class="animate-pulse"');
        }
    }
    if (/<style[\s>]/i.test(svg)) throw new Error("boss svg must not include <style> blocks");
    return svg;
}
 async function fetchRawSvgViaDashScope({ prompt, temperature = 0.9, max_tokens = 1800 }) {
    if (!canUseSecureAiBridge()) throw new Error("Secure AI bridge unavailable (Firebase Auth required)");
    const { dsModel } = getConfiguredAiKeys();
    const systemMsg = {
        role: "system",
        content:
            "Your entire response must be RAW SVG only. No markdown. No code fences. No extra text. The first character must be < and the last character must be >."
    };
    debugLogAiPrompt("dashscope.boss_svg", prompt);
    const data = await callGenerateCombatQuestionWithBackoff(
        {
            model: dsModel,
            messages: [systemMsg, { role: "user", content: prompt }],
            temperature,
            max_tokens
        },
        { min429DelayMs: 3500, maxDelayMs: 24000, initialDelayMs: 1000 }
    );
    if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const content = data?.choices?.[0]?.message?.content;
    if (content == null || String(content).trim() === "") throw new Error("DashScope returned empty SVG");
    const svg = String(content).trim();
    // Some models still wrap in fences; unwrap defensively.
    const fenced = svg.match(/```(?:svg|xml)?\s*([\s\S]*?)```/i);
    return fenced ? fenced[1].trim() : svg;
}
 async function fetchBossMetaViaDashScope(level) {
    if (!canUseSecureAiBridge()) throw new Error("Secure AI bridge unavailable (Firebase Auth required)");
    const { dsModel } = getConfiguredAiKeys();
    const systemMsg = {
        role: "system",
        content:
            "You output exactly one valid JSON object and nothing else. No markdown. No code fences. Use double quotes for JSON strings. " +
            "Fields name and blurb are short plain text (no **, #, pipe tables, or HTML). " +
            LLM_NO_MARKDOWN_IN_STRINGS
    };
    const defaultTopic = fallbackGeneratedTopic(level);
    const userBase = `Generate metadata for a new boss in a middle-school math RPG.\n` +
        `Constraints:\n` +
        `- Level: ${level}\n` +
        `- Math topic must be one of: ${GENERATED_BOSS_TOPICS.map((t) => JSON.stringify(t)).join(", ")}\n` +
        `- Tone: epic + slightly snarky (not mean).\n` +
        `Return JSON keys:\n` +
        `- name: string (2-3 words, intimidating)\n` +
        `- blurb: string (3-6 words)\n` +
        `- hue: string (hex color like #aabbcc)\n` +
        `- topic: string (one of the allowed topics)\n` +
        `Default topic to ${JSON.stringify(defaultTopic)} unless a better allowed pick fits level pacing.\n`;
    const postBossMeta = async (suffix) => {
        const user = userBase + suffix;
        debugLogAiPrompt("dashscope.boss_meta", user);
        const data = await callGenerateCombatQuestionWithBackoff(
            {
                model: dsModel,
                messages: [systemMsg, { role: "user", content: user }],
                response_format: { type: "json_object" },
                temperature: 0.8,
                max_tokens: 260
            },
            { min429DelayMs: 3500, maxDelayMs: 24000, initialDelayMs: 1000 }
        );
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
        return data?.choices?.[0]?.message?.content;
    };
    let content = await postBossMeta("");
    let metaPv = parseAndValidate(BossMetaSchema, content, { lenient: true });
    if (!metaPv.ok) {
        content = await postBossMeta(
            "\n\nCRITICAL: Your previous output failed schema validation.\n" +
                metaPv.issuesText +
                "\n\nOutput ONLY JSON with keys name, blurb, hue, topic. Escape newlines in strings as \\n."
        );
        metaPv = parseAndValidate(BossMetaSchema, content, { lenient: true });
    }
    if (!metaPv.ok) throw new Error(metaPv.issuesText || "boss meta schema invalid");
    const { name: n0, blurb: b0, hue: h0, topic: t0 } = metaPv.data;
    const name = sanitizeLlmProseString(String(n0 || `Boss Lv ${level}`).trim());
    const blurb = sanitizeLlmProseString(String(b0 || "Summoned horror").trim());
    const hue = sanitizeHexColor(h0, "#94a3b8");
    const topic = GENERATED_BOSS_TOPICS.includes(String(t0 || "").trim()) ? String(t0).trim() : fallbackGeneratedTopic(level);
    return { name, blurb, hue, topic };
}
 const bossGenInFlight = new Map();
 async function ensureGeneratedBossForLevel(level) {
    if (level <= QUEST_ROUTE.length) return null;
    if (state.bossCacheByLevel && state.bossCacheByLevel[level]) return state.bossCacheByLevel[level];
    if (bossGenInFlight.has(level)) return bossGenInFlight.get(level);
     const job = (async () => {
        let meta;
        try {
            meta = await fetchBossMetaViaDashScope(level);
        } catch (e) {
            meta = { name: `Boss Lv ${level}`, blurb: "Summoned horror", hue: "#94a3b8", topic: fallbackGeneratedTopic(level) };
        }
        const theme = meta.topic;
        const battlePrompt =
            `Role: You are an expert SVG artist and technical game designer generating a dynamic boss monster for a Middle School math RPG.\n\n` +
            `Current Parameters:\n` +
            `- Level: ${level}\n` +
            `- Math Theme: ${theme}\n\n` +
            `Art Direction:\n` +
            `The boss must look genuinely terrifying, aggressive, and formidable (appealing to an 11-13-year-old demographic). It should be a dark-energy fusion of the math theme. Use intricate geometric patterns, fractured paths, dynamic glowing effects, and a dark, menacing color palette. Weaponize the math concepts.\n\n` +
            `Technical Constraints (CRITICAL):\n` +
            `1. RAW OUTPUT ONLY: Your entire response MUST consist of pure, raw SVG code.\n` +
            `2. The very first character must be < and the very last character must be >.\n` +
            `3. Root element must be exactly: <svg viewBox="0 0 100 100" class="w-full h-full">\n` +
            `4. No external images, fonts, or <style> blocks. Use only inline attributes.\n` +
            `5. Regression anchors: include these exact IDs:\n` +
            `   - id="BOSS_CORE" (main body/chest)\n` +
            `   - id="BOSS_EYE" (glowing eye) and add class="animate-pulse"\n` +
            `   - id="BOSS_WEAPON" (most aggressive weapon-like part)\n`;
         const mapPrompt =
            battlePrompt +
            `\nAdditional requirement for this render:\n` +
            `- Make it a simplified MAP PORTRAIT icon version (readable at small size). Keep the same anchors/IDs.\n`;
         let battleSvg = "";
        let mapSvg = "";
        try {
            battleSvg = validateBossSvg(await fetchRawSvgViaDashScope({ prompt: battlePrompt, temperature: 0.95, max_tokens: 2000 }));
            mapSvg = validateBossSvg(await fetchRawSvgViaDashScope({ prompt: mapPrompt, temperature: 0.9, max_tokens: 1600 }));
        } catch (e) {
            // If generation fails, do not poison cache; fall back to existing Leviathan art for now.
            throw e;
        }
         const record = {
            name: meta.name,
            blurb: meta.blurb,
            hue: meta.hue,
            topic: meta.topic,
            battleSvg,
            mapSvg,
            createdAt: Date.now()
        };
        state.bossCacheByLevel = state.bossCacheByLevel || {};
        state.bossCacheByLevel[level] = record;
        saveBossCache(state.bossCacheByLevel);
        return record;
    })();
     bossGenInFlight.set(level, job);
    try {
        return await job;
    } finally {
        bossGenInFlight.delete(level);
    }
}
window.openPracticeMode = async () => {
    closeOtherMapHudOverlays("practice");
    document.getElementById("practice-overlay")?.classList.remove("hidden");
    await nextPracticeQuestion();
};
window.closePracticeMode = () => {
    document.getElementById("practice-overlay")?.classList.add("hidden");
    practiceActiveQuestion = null;
};
window.nextPracticeQuestion = async () => {
    const myGen = ++practiceMcqFetchGeneration;
    const prevStem = practiceActiveQuestion?.text ? String(practiceActiveQuestion.text) : "";
    const qEl = document.getElementById("practice-question-text");
    const grid = document.getElementById("practice-mcq-grid");
    const visEl = document.getElementById("practice-visual-container");
    const fb = document.getElementById("practice-feedback");
    const nextBtn = document.getElementById("practice-next-btn");
    if (fb) fb.innerText = "";
    if (grid) grid.innerHTML = "";
    if (visEl) clearCombatVisualMount(visEl);
    if (qEl) {
        if (window.MathJax?.typesetClear) MathJax.typesetClear([qEl]);
        qEl.innerText = "Summoning a practice question...";
    }
    if (nextBtn) nextBtn.disabled = true;
    try {
        const q = await fetchPracticeMcqViaDashScope({ previousStem: prevStem });
        if (myGen !== practiceMcqFetchGeneration) return;
        practiceActiveQuestion = q;
        const pAmt = grantPracticeParticipationIfAllowed();
        if (pAmt > 0) {
            grantParticipationShards(pAmt, `+${pAmt} shard${pAmt === 1 ? "" : "s"} — practice stipend`);
            if (state.playerName) saveLocalProfile(state.playerName);
            void syncCurrentProfileToCloud();
        }
        if (qEl) qEl.innerHTML = proseWithMathToHtml(q.text);
        if (window.MathJax) MathJax.typesetPromise([qEl]);
        if (visEl) {
            clearCombatVisualMount(visEl);
            mountCombatVisual(visEl, q);
        }
        if (grid) {
            q.options.forEach((opt) => {
                const b = document.createElement("button");
                const oStr = opt.toString();
                const isMath = oStr.includes("^") || oStr.includes("\\");
                const esc = escapeHtmlText(oStr);
                b.innerHTML = `<span>${isMath ? `\\(${esc}\\)` : esc}</span>`;
                b.className =
                    "bg-slate-800 hover:bg-slate-700 p-4 rounded-lg font-bold border-2 border-slate-600 transition-all text-sm min-h-[3rem]";
                b.onclick = () => {
                    const correct = opt.toString().trim() === q.answer.toString().trim();
                    if (fb) fb.innerText = correct ? "Correct." : `Not quite. Correct answer: ${q.answer}`;
                    if (fb && window.MathJax) MathJax.typesetPromise([fb]);
                };
                grid.appendChild(b);
            });
            if (window.MathJax) MathJax.typesetPromise([grid]);
        }
    } catch (e) {
        if (myGen !== practiceMcqFetchGeneration) return;
        if (qEl) qEl.innerText = "Practice AI failed — try again.";
        console.error("practice MCQ failed:", e);
    } finally {
        if (myGen === practiceMcqFetchGeneration && nextBtn) nextBtn.disabled = false;
    }
};
 window.handleInputAttack = async (e) => {
    e.preventDefault();
    if (state.isAnimating) return;
    state.isAnimating = true;
    await resumeCombatSfxContext();
    const q = state.activeQuestion || {};
    const studentResponse = String(document.getElementById("answer-input")?.value || "").trim();
    const castBtn = document.getElementById("cast-spell-btn");
    if (castBtn) castBtn.disabled = true;
     // Require some reasoning to proceed (encourages criterion-aligned work).
    if (!studentResponse) {
        if (castBtn) castBtn.disabled = false;
        state.isAnimating = false;
        showDetailedFeedback("To score higher, you must write your reasoning (2–5 steps). Try again.");
        return;
    }
    if (!state._battleParticipation) state._battleParticipation = { firstCastDone: false, reflectionDone: false };
    if (!state._battleParticipation.firstCastDone) {
        state._battleParticipation.firstCastDone = true;
        grantParticipationShards(EP_SHARD_FIRST_CAST, `+${EP_SHARD_FIRST_CAST} shards — nice, you showed your work!`);
        if (state.playerName) saveLocalProfile(state.playerName);
        void syncCurrentProfileToCloud();
    }
     const bS = document.getElementById("battle-screen");
    const fb = document.getElementById("combat-feedback");
    const applyComboUpdate = (band) => {
        const good = band === "correct_with_reasoning" || band === "correct_no_reasoning";
        if (good) state.comboCount = Math.max(0, (state.comboCount || 0) + 1);
        else state.comboCount = 0;
        state.comboActive = state.comboCount >= 3;
        const badge = document.getElementById("combo-badge");
        if (badge) {
            if (state.comboActive) badge.classList.remove("hidden");
            else badge.classList.add("hidden");
        }
    };
    try {
        // If the active question is missing required judge fields, avoid punishing the student.
        if (!q || !q.expected_answer || !q.criterion) {
            showDetailedFeedback(
                "Judge setup error: this question is missing expected answer/criterion, so it can't be graded fairly. Generating a new question…"
            );
            await loadQuestion();
            return;
        }
        await startJudgeChargingUi();
        let judged;
        let usedFallbackFromApiFailure = false;
        try {
            [judged] = await Promise.all([
                gradeResponseViaDashScope({ question: q, studentResponse }),
                delay(JUDGE_MIN_MS)
            ]);
        } catch (err) {
            console.error("grading failed:", err);
            usedFallbackFromApiFailure = true;
            [judged] = await Promise.all([
                Promise.resolve(localFallbackJudge({ question: q, studentResponse })),
                delay(JUDGE_MIN_MS)
            ]);
        }
        clearJudgeChargingUi();
        recordCombatSkillOutcome(q, judged);
        applyComboUpdate(judged.band);
        const dmg0 = damageForJudgement(judged);
        const comboMult = state.comboActive ? COMBAT_COMBO_MULT : 1.0;
        const weaponMult = weaponDamageMultiplier(state.cosmeticsTier);
        let enemyDmg = dmg0.enemy > 0 ? Math.round(dmg0.enemy * comboMult * weaponMult) : 0;
        let playerDmg = dmg0.player;
        if (state.nextEnemyAttackZero && playerDmg > 0) {
            playerDmg = 0;
            state.nextEnemyAttackZero = false;
        }
        if (playerDmg > 0 && (state.playerHP - playerDmg) <= 0 && !state.potionUsedThisBattle) {
            state.potionUsedThisBattle = true;
            state.forceEasierNextQuestion = true;
            state.playerHP = Math.max(state.playerHP, 30);
            playerDmg = 0;
        }
        const dmg = { ...dmg0, enemy: enemyDmg, player: playerDmg };
        fb.innerText = dmg.label;
        fb.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 bg-gray-900 border-2 ${
            dmg.enemy > 0 ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
        } p-4 rounded-xl text-center z-40 opacity-100 font-black text-2xl`;
        fb.style.opacity = "1";
        if (dmg.enemy <= 0) void playJudgeSpellFizzle();
        const hitStop =
            !usedFallbackFromApiFailure && state.currentLevel >= 7 && (judged.band === "correct_with_reasoning" || dmg.isCrit === true)
                ? 100
                : 0;
        await playCombatStrikeSequence(dmg, hitStop);
        state.turnIndex++;
        state.requireReflection = judged.band === "incorrect" || judged.band === "partial";
        const potionNote =
            state.potionUsedThisBattle && dmg0.player > 0 && dmg.player === 0
                ? "\n\nHealth Potion: You were saved from defeat — next question will be easier."
                : "";
        if (usedFallbackFromApiFailure) {
            showDetailedFeedback(
                `Judge spell fizzled (AI grading failed), so I used a safe fallback grade.\n\n${judged.feedback}${potionNote}`
            );
        } else {
            const header =
                judged.band === "correct_with_reasoning"
                    ? "Great structure — full credit."
                    : judged.band === "correct_no_reasoning"
                      ? "Answer is right, but you need better reasoning."
                      : judged.band === "partial"
                        ? "Some progress — tighten your steps."
                        : "Not yet — let’s fix the method.";
            showDetailedFeedback(`${header}\n\n${judged.feedback}${potionNote}`);
        }
        if (state.enemyHP <= 0 || state.playerHP <= 0) {
            finishBattle(state.enemyHP <= 0);
        }
    } finally {
        clearJudgeChargingUi();
        if (castBtn) castBtn.disabled = false;
        if (bS) bS.classList.remove("animate-shake", "animate-shake-hard");
        state.isAnimating = false;
        syncCurrentProfileToCloud();
    }
};
 function finishBattle(win) {
    state.battlePinnedTopic = null;
    invalidateCombatQuestionPrefetch();
    const victoryGain = victoryShardsForBossLevel(state.currentLevel);
    const extraLines = [];
    let participationExtra = 0;
    if (!win) {
        participationExtra += EP_SHARD_LOSS_BATTLE;
        extraLines.push(`Training stipend +${EP_SHARD_LOSS_BATTLE} Logic Shards — finishing counts as practice.`);
    }
    const dqShards = tryGrantDailyQuestBattleBonus();
    if (dqShards > 0) {
        participationExtra += dqShards;
        extraLines.push(`Daily quest complete — +${dqShards} bonus shards for battling today.`);
    }
    if (participationExtra > 0) {
        state.shards = Math.max(0, Math.floor(state.shards || 0) + participationExtra);
        syncShardsUi();
    }
    if (win) {
        state.shards = Math.max(0, Math.floor(state.shards || 0) + victoryGain);
        addBossToBestiary(state.currentLevel);
        if (state.currentLevel === state.unlockedLevels) {
            state.unlockedLevels++;
        }
        ensureBestiaryMatchesUnlockedLevels();
        grantProgressFlairsFromState();
        syncShardsUi();
        if (state.playerName) {
            saveLocalProfile(state.playerName);
            syncCurrentProfileToCloud();
        }
    } else if (participationExtra > 0 && state.playerName) {
        saveLocalProfile(state.playerName);
        syncCurrentProfileToCloud();
    }
    document.getElementById('result-overlay').classList.remove('hidden');
    safeSet('result-title', win ? 'VICTORY' : 'KEEP TRAINING');
    let desc = win
        ? `The creature has been banished. +${victoryGain} Logic Shards.`
        : "Every champion studies after a tough fight. Mistakes are data — read the solution, then try again.";
    if (extraLines.length) desc += `\n\n${extraLines.join("\n")}`;
    safeSet('result-desc', desc);
}
 window.returnToMenu = () => {
    document.getElementById('result-overlay').classList.add('hidden');
    closeAllMapHudOverlays();
    document.getElementById('battle-screen').classList.add('hidden');
    document.getElementById('level-screen').classList.remove('hidden');
    syncMapAudioControlsFromState();
    void startMapBgmFromUserGesture();
    state.battlePinnedTopic = null;
    invalidateCombatQuestionPrefetch();
    state.turnIndex = 0;
    state.isAnimating = false;
    syncShardsUi();
    syncEngagementHud();
    renderLevelMenu();
    syncCurrentProfileToCloud();
};
window.closeDetailedFeedback = async () => {
    const plotEl = document.getElementById("plot-container");
    if (plotEl) {
        if (typeof Plotly !== "undefined") Plotly.purge(plotEl);
        clearCombatVisualMount(plotEl);
        plotEl.classList.add("hidden");
    }
    const neededReflection = state.requireReflection;
    if (state.requireReflection) {
        if (!state._battleParticipation) state._battleParticipation = { firstCastDone: false, reflectionDone: false };
        const reflect = String(document.getElementById("reflection-input")?.value || "").trim();
        if (reflect.length >= 10 && neededReflection && !state._battleParticipation.reflectionDone) {
            state._battleParticipation.reflectionDone = true;
            grantParticipationShards(EP_SHARD_REFLECTION, `+${EP_SHARD_REFLECTION} shards — strong reflection!`);
            if (state.playerName) saveLocalProfile(state.playerName);
            void syncCurrentProfileToCloud();
        }
        if (reflect.length >= 10) {
            try {
                const parry = await (async () => {
                    if (!canUseSecureAiBridge()) return { isParry: false, note: "" };
                    const { dsModel } = getConfiguredAiKeys();
                    const systemMsg = {
                        role: "system",
                        content:
                            "You output exactly one valid JSON object and nothing else. No markdown, no code fences. Use double quotes for JSON strings. " +
                            "note must be one plain sentence; math only as \\(...\\) if needed. " +
                            LLM_NO_MARKDOWN_IN_STRINGS
                    };
                    const q = state.activeQuestion || {};
                    const userBase =
                        `You are a quick MYP teacher judging a student's reflection.\n` +
                        `The student just got a question wrong or partial.\n` +
                        `QUESTION: ${JSON.stringify(String(q.text || ""))}\n` +
                        `EXPECTED_ANSWER: ${JSON.stringify(String(q.expected_answer || ""))}\n` +
                        `IDEAL_EXPLANATION: ${JSON.stringify(String(q.ideal_explanation || ""))}\n` +
                        `STUDENT_REFLECTION: ${JSON.stringify(reflect)}\n\n` +
                        `Return JSON with keys:\n` +
                        `- isParry: boolean (true if the reflection correctly identifies the key mistake or missing step)\n` +
                        `- note: string (1 short sentence)\n`;
                    const postParry = async (userContent) => {
                        debugLogAiPrompt("dashscope.parry_reflection", userContent);
                        const data = await callGenerateCombatQuestionWithBackoff(
                            {
                                model: dsModel,
                                messages: [systemMsg, { role: "user", content: userContent }],
                                response_format: { type: "json_object" },
                                temperature: 0.2,
                                max_tokens: 180
                            },
                            { min429DelayMs: 3500, maxDelayMs: 20000, initialDelayMs: 900 }
                        );
                        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
                        return data?.choices?.[0]?.message?.content;
                    };
                    let content = await postParry(userBase);
                    let pv = parseAndValidate(ParryResultSchema, content, { lenient: true });
                    if (!pv.ok) {
                        content = await postParry(
                            userBase +
                                "\n\nCRITICAL: Your previous output failed schema validation.\n" +
                                pv.issuesText +
                                "\n\nOutput ONLY JSON with keys isParry (boolean) and note (string). Escape newlines in strings as \\n."
                        );
                        pv = parseAndValidate(ParryResultSchema, content, { lenient: true });
                    }
                    if (!pv.ok) return { isParry: false, note: "" };
                    return {
                        isParry: !!pv.data.isParry,
                        note: sanitizeLlmProseString(String(pv.data.note || "").trim())
                    };
                })();
                if (parry.isParry) state.nextEnemyAttackZero = true;
            } catch (e) {
                console.warn("reflection judge failed:", e);
            }
        }
        state.requireReflection = false;
    }
    document.getElementById("detailed-feedback-overlay").classList.add("hidden");
    await loadQuestion();
    state.isAnimating = false;
    syncCurrentProfileToCloud();
};
 document.getElementById("cloud-sync-badge")?.addEventListener("click", () => requestUserSync());

function syncMapAudioControlsFromState() {
    const a = normalizeAudioSettings(state.audio);
    const mSlider = document.getElementById("map-audio-music-slider");
    const sSlider = document.getElementById("map-audio-sfx-slider");
    const mBtn = document.getElementById("map-audio-music-mute");
    const sBtn = document.getElementById("map-audio-sfx-mute");
    if (mSlider) mSlider.value = String(Math.round(a.musicVolume * 100));
    if (sSlider) sSlider.value = String(Math.round(a.sfxVolume * 100));
    if (mBtn) {
        mBtn.textContent = a.musicMuted ? "🔇" : "🔊";
        mBtn.setAttribute("aria-pressed", a.musicMuted ? "true" : "false");
        mBtn.setAttribute("aria-label", a.musicMuted ? "Unmute music" : "Mute music");
    }
    if (sBtn) {
        sBtn.textContent = a.sfxMuted ? "🔇" : "🔊";
        sBtn.setAttribute("aria-pressed", a.sfxMuted ? "true" : "false");
        sBtn.setAttribute("aria-label", a.sfxMuted ? "Unmute sound effects" : "Mute sound effects");
    }
}

function commitAudioSettingsPersist() {
    if (state.playerName) saveLocalProfile(state.playerName);
    void syncCurrentProfileToCloud();
}

function wireMapAudioControls() {
    const mSlider = document.getElementById("map-audio-music-slider");
    const sSlider = document.getElementById("map-audio-sfx-slider");
    const mBtn = document.getElementById("map-audio-music-mute");
    const sBtn = document.getElementById("map-audio-sfx-mute");
    mSlider?.addEventListener("input", () => {
        const v = Math.min(1, Math.max(0, parseInt(String(mSlider.value), 10) / 100));
        patchAudioSettings({ musicVolume: v, musicMuted: false });
        syncMapAudioControlsFromState();
        commitAudioSettingsPersist();
    });
    sSlider?.addEventListener("input", () => {
        const v = Math.min(1, Math.max(0, parseInt(String(sSlider.value), 10) / 100));
        patchAudioSettings({ sfxVolume: v, sfxMuted: false });
        syncMapAudioControlsFromState();
        commitAudioSettingsPersist();
    });
    mBtn?.addEventListener("click", () => {
        const cur = normalizeAudioSettings(state.audio);
        patchAudioSettings({ musicMuted: !cur.musicMuted });
        syncMapAudioControlsFromState();
        commitAudioSettingsPersist();
    });
    sBtn?.addEventListener("click", () => {
        const cur = normalizeAudioSettings(state.audio);
        patchAudioSettings({ sfxMuted: !cur.sfxMuted });
        syncMapAudioControlsFromState();
        commitAudioSettingsPersist();
    });
}

/** Map screen: wire HUD buttons here so clicks work without relying on inline handlers (CSP / scope). */
function wireMapHudButtons() {
    document.getElementById("map-btn-bestiary")?.addEventListener("click", () => {
        window.openBestiary();
    });
    document.getElementById("map-btn-upgrades")?.addEventListener("click", () => {
        window.openUpgrades();
    });
    document.getElementById("map-btn-practice")?.addEventListener("click", () => {
        void window.openPracticeMode();
    });
    document.getElementById("map-btn-logout")?.addEventListener("click", () => {
        location.reload();
    });
}
wireMapHudButtons();
wireMapAudioControls();
wireBgmVisibility();
applyAudioFromState();
 loadRecentStems();
state.bossCacheByLevel = loadBossCache();
if (!isProductionUi()) runRegressions();
initFirebase();
    
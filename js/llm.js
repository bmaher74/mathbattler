import { state, safeSet, MAX_RECENT_STEMS, normalizeQuestionStem, rememberQuestionStem } from "./state.js";

function readConfigString(v) {
    if (v == null) return "";
    const s = typeof v === "string" ? v : String(v);
    return s.trim();
}
 function getConfiguredAiKeys() {
    const dsKey = readConfigString(typeof window !== "undefined" ? window.__dashscope_api_key : "");
    const dsBase =
        readConfigString(typeof window !== "undefined" ? window.__dashscope_base_url : "") ||
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    const dsModel = readConfigString(typeof window !== "undefined" ? window.__dashscope_model : "") || "qwen-flash";
    const dsChatUrl = readConfigString(typeof window !== "undefined" ? window.__dashscope_chat_completions_url : "");
    return { dsKey, dsBase, dsModel, dsChatUrl };
}
 function dashscopeChatCompletionsUrl() {
    const { dsBase, dsChatUrl } = getConfiguredAiKeys();
    if (dsChatUrl) return dsChatUrl;
    return dsBase.replace(/\/$/, "") + "/chat/completions";
}

let lastAiConnectivityCheck = { ok: null, summary: "", detail: "" };
let cloudSyncManualInFlight = false;
function readConfigString(v) {
    if (v == null) return "";
    const s = typeof v === "string" ? v : String(v);
    return s.trim();
}
 function getConfiguredAiKeys() {
    const dsKey = readConfigString(typeof window !== "undefined" ? window.__dashscope_api_key : "");
    const dsBase =
        readConfigString(typeof window !== "undefined" ? window.__dashscope_base_url : "") ||
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    const dsModel = readConfigString(typeof window !== "undefined" ? window.__dashscope_model : "") || "qwen-flash";
    const dsChatUrl = readConfigString(typeof window !== "undefined" ? window.__dashscope_chat_completions_url : "");
    return { dsKey, dsBase, dsModel, dsChatUrl };
}
 function dashscopeChatCompletionsUrl() {
    const { dsBase, dsChatUrl } = getConfiguredAiKeys();
    if (dsChatUrl) return dsChatUrl;
    return dsBase.replace(/\/$/, "") + "/chat/completions";
}
 function safeSet(id, val, prop = 'innerText') { const el = document.getElementById(id); if (el) { if (prop.includes('.')) { const parts = prop.split('.'); el[parts[0]][parts[1]] = val; } else { el[prop] = val; } } return el; }
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
     if (!isFirebaseReady || !db) {
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
            if (isFirebaseReady && db) {
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
            bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {}
        }));
    } catch (e) { console.warn("saveLocalProfile", e); }
}
 function normalizeSkillProfile(raw) {
    const fallback = { "Algebra": { attempts: 0, corrects: 0 } };
    if (!raw || typeof raw !== "object") return fallback;
    const out = {};
    for (const [topic, v] of Object.entries(raw)) {
        if (v && typeof v === "object") {
            out[topic] = {
                attempts: typeof v.attempts === "number" ? v.attempts : (typeof v.a === "number" ? v.a : 0),
                corrects: typeof v.corrects === "number" ? v.corrects : (typeof v.c === "number" ? v.c : 0)
            };
        }
    }
    return Object.keys(out).length ? out : fallback;
}
 function mergeSkillProfiles(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const out = {};
    for (const k of keys) {
        const va = a[k] || { attempts: 0, corrects: 0 };
        const vb = b[k] || { attempts: 0, corrects: 0 };
        out[k] = {
            attempts: Math.max(va.attempts ?? 0, vb.attempts ?? 0),
            corrects: Math.max(va.corrects ?? 0, vb.corrects ?? 0)
        };
    }
    return Object.keys(out).length ? out : { "Algebra": { attempts: 0, corrects: 0 } };
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
    const cosmeticsTier = Math.max(
        0,
        typeof c.cosmeticsTier === "number" ? Math.floor(c.cosmeticsTier) : 0,
        typeof l.cosmeticsTier === "number" ? Math.floor(l.cosmeticsTier) : 0
    );
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
    return { unlockedLevels, skillProfile, shards, cosmeticsTier, bestiary, bossCacheByLevel };
}
 async function persistMergedProfileToCloud(name, merged) {
    if (!isFirebaseReady || !db) return false;
    try {
        const pRef = doc(db, "artifacts", appId, "public", "data", "playerProfiles", safeProfileDocId(name));
        await setDoc(pRef, {
            unlockedLevels: merged.unlockedLevels,
            skillProfile: merged.skillProfile,
            shards: merged.shards ?? 0,
            cosmeticsTier: merged.cosmeticsTier ?? 0,
            bestiary: Array.isArray(merged.bestiary) ? merged.bestiary : [],
            bossCacheByLevel: merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : {},
            displayName: name,
            lastSyncedAt: Date.now()
        }, { merge: true });
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
    if (!isFirebaseReady || !db || !state.playerName) return;
    const name = state.playerName;
    const sp = state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null);
    if (typeof state.unlockedLevels !== "number" || state.unlockedLevels < 1) return;
    try {
        await setDoc(doc(db, "artifacts", appId, "public", "data", "playerProfiles", safeProfileDocId(name)), {
            unlockedLevels: state.unlockedLevels,
            skillProfile: sp,
            shards: typeof state.shards === "number" ? Math.max(0, Math.floor(state.shards)) : 0,
            cosmeticsTier: typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0,
            bestiary: Array.isArray(state.bestiary) ? state.bestiary.slice(0, 200) : [],
            bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {},
            displayName: name,
            lastSyncedAt: Date.now()
        }, { merge: true });
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
    if (!isFirebaseReady || !db) return null;
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const pRef = doc(db, "artifacts", appId, "public", "data", "playerProfiles", safeProfileDocId(name));
            const snap = await getDoc(pRef);
            return snap.exists() ? snap.data() : null;
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
    if (!isFirebaseReady || !db || !state.playerName) return;
    const name = state.playerName;
    const cloud = await fetchCloudProfileDoc(name, 1);
    const local = loadLocalProfile(name);
    const session = {
        unlockedLevels: state.unlockedLevels,
        skillProfile: state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null),
        shards: typeof state.shards === "number" ? state.shards : 0,
        cosmeticsTier: typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0,
        bestiary: Array.isArray(state.bestiary) ? state.bestiary : [],
        bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {}
    };
    const m1 = mergeProfileRecords(cloud, local);
    const merged = mergeProfileRecords(m1, session);
    state.unlockedLevels = merged.unlockedLevels;
    state.skillProfile = merged.skillProfile;
    state.shards = merged.shards ?? 0;
    state.cosmeticsTier = merged.cosmeticsTier ?? 0;
    state.bestiary = Array.isArray(merged.bestiary) ? merged.bestiary : [];
    state.bossCacheByLevel = merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : state.bossCacheByLevel;
    saveLocalProfile(name);
    await persistMergedProfileToCloud(name, merged);
    const ls = document.getElementById("level-screen");
    if (ls && !ls.classList.contains("hidden")) {
        renderLevelMenu();
        syncAiRouteNotice();
        syncMapQuestionBufferHint();
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
    safeSet("cloud-status-msg", msg[kind] || msg.timeout, "innerText");
    const el = document.getElementById("cloud-status-msg");
    if (el) el.className = "mt-4 text-[10px] font-mono text-center uppercase " + (kind === "firebase_ok" ? "text-emerald-400" : "text-amber-400/90");
    safeSet("login-btn", "START ADVENTURE").disabled = false;
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
    db = getFirestore(app);
    await (typeof __initial_auth_token !== "undefined" ? signInWithCustomToken(auth, __initial_auth_token) : signInAnonymously(auth));
    currentUser = auth.currentUser;
     const testRef = doc(db, "artifacts", appId, "public", "data", "healthcheck", "status");
    await setDoc(testRef, { ts: Date.now() }, { merge: true });
    isFirebaseReady = true;
    safeSet("t-vault", "VAULT: PASS");
    document.getElementById("t-vault").className = "text-green-400";
     try {
        const brendanRef = doc(db, "artifacts", appId, "public", "data", "playerProfiles", "Student Brendan");
        let bSnap = await getDoc(brendanRef);
        if (!bSnap.exists()) {
            await setDoc(brendanRef, { unlockedLevels: 1, skillProfile: { "Math": { attempts: 0, corrects: 0 } } });
            bSnap = await getDoc(brendanRef);
        }
        if (bSnap.exists()) {
            safeSet("t-brendan", "BRENDAN: PASS");
            document.getElementById("t-brendan").className = "text-green-400";
        } else {
            safeSet("t-brendan", "BRENDAN: FAIL");
            document.getElementById("t-brendan").className = "text-red-400 font-bold";
        }
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
    const cloudSnapshot = isFirebaseReady && db ? await fetchCloudProfileDoc(name, cloudRetries) : null;
     const merged = mergeProfileRecords(cloudSnapshot, localSnapshot);
    state.unlockedLevels = merged.unlockedLevels;
    state.skillProfile = merged.skillProfile;
    state.shards = merged.shards ?? 0;
    state.cosmeticsTier = merged.cosmeticsTier ?? 0;
    state.bestiary = Array.isArray(merged.bestiary) ? merged.bestiary : [];
    state.bossCacheByLevel = merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : state.bossCacheByLevel;
    saveLocalProfile(name);
     if (isFirebaseReady && db) {
        await persistMergedProfileToCloud(name, merged);
    } else {
        state.lastCloudSyncAt = Date.now();
        state.cloudSyncError = null;
    }
     safeSet('welcome-player-text', name);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('level-screen').classList.remove('hidden');
    renderPlayerSprite();
    renderLevelMenu();
    syncAiRouteNotice();
    syncMapQuestionBufferHint();
    prefetchQuestion(); // Non-blocking: Fetches in the background while the user views the map
    showCloudSyncBadge();
    syncQuestionsApiBadge();
    startCloudSyncHeartbeat();
    void syncCurrentProfileToCloud();
};
 function renderPlayerSprite() {
    const tier = typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0;
    const base = ASSETS.wizard;
    if (tier <= 0) {
        safeSet("player-sprite", base, "innerHTML");
        return;
    }
    // Cosmetic layering: add extra glyphs/aura around the existing wizard SVG.
    const inner = svgInnerMarkup(base);
    const extra =
        tier === 1
            ? `<g opacity="0.85">
                   <circle cx="50" cy="54" r="36" fill="none" stroke="#a5b4fc" stroke-width="2" opacity="0.55"/>
                   <polygon points="50,12 56,26 72,28 60,38 64,54 50,46 36,54 40,38 28,28 44,26" fill="#7c3aed" opacity="0.25"/>
               </g>`
            : `<g opacity="0.9">
                   <circle cx="50" cy="54" r="38" fill="none" stroke="#facc15" stroke-width="2" opacity="0.35"/>
                   <circle cx="50" cy="54" r="30" fill="none" stroke="#a78bfa" stroke-width="2" opacity="0.35"/>
                   <path d="M20 76 Q50 52 80 76" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.35"/>
               </g>`;
    const upgraded = `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_10px_20px_rgba(59,130,246,0.6)]" xmlns="http://www.w3.org/2000/svg">${inner}${extra}</svg>`;
    safeSet("player-sprite", upgraded, "innerHTML");
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
    const svg = battleBossSvgMarkup(level);
    state.bestiary.unshift({
        id,
        level,
        name: String(meta?.name || `Boss Lv ${level}`),
        topic: String(meta?.topic || ""),
        hue: String(meta?.hue || ""),
        defeatedAt: Date.now(),
        svg
    });
    state.bestiary = state.bestiary.slice(0, 200);
}
 window.openBestiary = () => {
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
            return `
            <div class="border border-slate-700 rounded-xl bg-slate-900/40 p-3 flex gap-3">
                <div class="w-20 h-20 shrink-0 rounded-lg border border-slate-700 bg-slate-950/60 flex items-center justify-center overflow-hidden">
                    <div class="w-20 h-20">${String(b.svg || "").trim() || ""}</div>
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
    document.getElementById("upgrades-overlay")?.classList.remove("hidden");
    renderUpgrades();
};
window.closeUpgrades = () => document.getElementById("upgrades-overlay")?.classList.add("hidden");
 function renderUpgrades() {
    safeSet("upgrades-shards", String(Math.max(0, Math.floor(state.shards || 0))));
    const list = document.getElementById("upgrades-list");
    if (!list) return;
    const tier = typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0;
    const options = [
        { tier: 1, cost: 100, title: "Staff of Geometry", desc: "A sharper aura around your cloak." },
        { tier: 2, cost: 250, title: "Axiom Halo", desc: "Golden rings of logic orbit you." }
    ];
    list.innerHTML = options
        .map((o) => {
            const owned = tier >= o.tier;
            const canBuy = !owned && (state.shards || 0) >= o.cost;
            return `
            <div class="border border-slate-700 rounded-xl bg-slate-900/40 p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="font-black text-slate-100">${o.title}</div>
                        <div class="text-[12px] text-slate-400 mt-1">${o.desc}</div>
                    </div>
                    <div class="shrink-0 text-right">
                        <div class="text-xs font-black uppercase text-amber-200">${owned ? "Owned" : `${o.cost} shards`}</div>
                        <button type="button" ${canBuy ? "" : "disabled"}
                            onclick="buyUpgrade(${o.tier}, ${o.cost})"
                            class="mt-2 px-3 py-2 rounded-lg text-xs font-black uppercase border ${canBuy ? "border-emerald-600 bg-emerald-700/30 hover:bg-emerald-600/40" : owned ? "border-slate-700 bg-slate-900/30 text-slate-400" : "border-slate-700 bg-slate-900/30 text-slate-500"}">
                            ${owned ? "Equipped" : canBuy ? "Buy" : "Need more"}
                        </button>
                    </div>
                </div>
            </div>`;
        })
        .join("");
}
 window.buyUpgrade = (tier, cost) => {
    const t = Math.max(0, Math.floor(tier || 0));
    const c = Math.max(0, Math.floor(cost || 0));
    const curTier = Math.max(0, Math.floor(state.cosmeticsTier || 0));
    if (t <= curTier) return;
    const shards = Math.max(0, Math.floor(state.shards || 0));
    if (shards < c) return;
    state.shards = shards - c;
    state.cosmeticsTier = t;
    renderPlayerSprite();
    syncShardsUi();
    renderUpgrades();
    if (state.playerName) saveLocalProfile(state.playerName);
    syncCurrentProfileToCloud();
};
 window.analyzeEnemy = async () => {
    const q = state.activeQuestion || {};
    const meta = getQuestNode(state.currentLevel) || {};
    try {
        const { dsKey, dsModel } = getConfiguredAiKeys();
        if (!dsKey) throw new Error("no DashScope API key configured");
        const url = dashscopeChatCompletionsUrl();
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` };
        const systemMsg = {
            role: "system",
            content: "You output exactly one valid JSON object and nothing else. No markdown. No code fences."
        };
        const user =
            `You are the game's tactical scan ability. Give a short, helpful, MYP-scope hint.\n` +
            `Boss: ${JSON.stringify(String(meta.name || ""))}\n` +
            `Level: ${state.currentLevel}\n` +
            `Criterion: ${JSON.stringify(String(q.criterion || ""))}\n` +
            `Topic: ${JSON.stringify(String(q.topic_category || meta.topic || ""))}\n` +
            `Question: ${JSON.stringify(String(q.text || ""))}\n\n` +
            `Return JSON keys:\n- hint: string (3-6 short sentences max; tactical tone; include 1 equation/template if helpful)\n`;
        debugLogAiPrompt("dashscope.scan", user);
        const body = JSON.stringify({
            model: dsModel,
            messages: [systemMsg, { role: "user", content: user }],
            response_format: { type: "json_object" },
            temperature: 0.6,
            max_tokens: 260
        });
        const res = await fetchWithBackoff(url, { method: "POST", headers, body }, 3, {
            min429DelayMs: 3500,
            maxDelayMs: 20000,
            initialDelayMs: 900
        });
        const data = await res.json();
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const content = data?.choices?.[0]?.message?.content;
        const parsed = parseModelJsonContentLenient(content);
        const hint = String(parsed?.hint || "").trim();
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
 let fetchPromise = null;
let prefetchInFlight = false;
 function clearPrefetchFailureUi() {
    state.aiOfflineHint = null;
    state.lastPrefetchError = null;
}
 function setPrefetchFailureFromError(e) {
    const m = e && e.message ? String(e.message) : String(e);
    state.lastPrefetchError = m.slice(0, 280);
    const is429 = (e && e.isRateLimit) || /(^|\D)429(\D|$)|rate limit/i.test(state.lastPrefetchError);
    if (is429) {
        state.aiOfflineHint =
            "Live AI hit HTTP 429 (rate limit). Free models are often busy; this battle uses the offline pool until a request succeeds. " +
            state.lastPrefetchError;
    } else if (/no AI API key|no DashScope API key/i.test(state.lastPrefetchError)) {
        state.aiOfflineHint =
            "No DashScope key in ai-config.js — questions come from the built-in offline pool only.";
    } else if (/PREFETCH_TIMEOUT|did not finish within|Live AI slow or stalled/i.test(state.lastPrefetchError)) {
        state.aiOfflineHint =
            "Live AI took too long (rate limits or slow network). This battle uses the offline pool — check DashScope in ai-config.js or try again.";
    } else if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(state.lastPrefetchError)) {
        state.aiOfflineHint =
            (state.lastPrefetchError || "") +
            " If you use Alibaba DashScope from a static web page, the API often blocks browser CORS — use a small same-origin proxy and set window.__dashscope_chat_completions_url to your proxy URL.";
    } else {
        state.aiOfflineHint = "Live AI request failed — using the offline question pool. " + state.lastPrefetchError;
    }
}
 function syncAiRouteNotice() {
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
    const root = document.getElementById("ai-questions-status");
    const l2 = document.getElementById("ai-status-line2");
    if (!root || !l2) return;
     const { dsKey, dsModel } = getConfiguredAiKeys();
    const hasKey = !!dsKey;
    const routeTitle = dsKey ? `DashScope: ${dsModel}` : "";
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
            root.title = hasKey ? `Request in progress (${routeTitle})` : "";
            return;
        }
        if (queuedLive || activeLive) {
            setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
            l2.textContent = "Next / last · live AI";
            const m = state.nextQuestion && state.nextQuestion._dashscopeModel;
            root.title = m ? `${routeTitle} (queued model: ${m})` : routeTitle;
            return;
        }
        if (!hasKey) {
            setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
            l2.textContent = "Offline only (no key)";
            root.title = "Add a key in ai-config.js to enable live questions.";
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
     if (!hasKey) {
        setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
        l2.textContent = "No API key";
        root.title = lastAiConnectivityCheck.detail || "Configure ai-config.js";
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
        g.addEventListener("click", () => {
            if (lv <= state.unlockedLevels) startGame(lv);
        });
        g.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === " ") && lv <= state.unlockedLevels) { e.preventDefault(); startGame(lv); }
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
 /** Ensures battle screen never waits unbounded on live AI (rate limits / slow API). */
async function raceWithPrefetchTimeout(promise, ms) {
    let tid;
    const timeout = new Promise((_, rej) => {
        tid = setTimeout(() => {
            const e = new Error(
                `Live AI did not finish within ${Math.round(ms / 1000)}s (often rate limits or a long model chain). Using offline questions.`
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
 async function fetchWithBackoff(url, options, retries = 5, backoffOpts = {}) {
    const min429 = backoffOpts.min429DelayMs != null ? backoffOpts.min429DelayMs : 5000;
    const maxDelay = backoffOpts.maxDelayMs != null ? backoffOpts.maxDelayMs : 20000;
    let delay = backoffOpts.initialDelayMs != null ? backoffOpts.initialDelayMs : 1000;
    for (let i = 0; i < retries; i++) {
        let response;
        try {
            response = await fetch(url, options);
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise((res) => setTimeout(res, delay));
            delay = Math.min(delay * 2, maxDelay);
            continue;
        }
        if (response.ok) return response;
        if (response.status === 429 && i < retries - 1) {
            const raHeader = response.headers.get("Retry-After");
            let raMs = 0;
            if (raHeader) {
                const n = parseInt(raHeader, 10);
                if (!Number.isNaN(n)) raMs = Math.min(Math.max(0, n) * 1000, 120000);
            }
            const wait = Math.max(delay, min429, raMs);
            await new Promise((res) => setTimeout(res, wait));
            delay = Math.min(delay * 2, maxDelay);
            continue;
        }
        if (response.status >= 500 && i < retries - 1) {
            await new Promise((res) => setTimeout(res, delay));
            delay = Math.min(delay * 2, maxDelay);
            continue;
        }
        throw new Error(`HTTP error ${response.status}`);
    }
}
 /** Used when the API key is missing or the model request fails — must vary so battles are not identical every turn. */
const FALLBACK_QUESTIONS = [
    {
        topic_category: "Algebra",
        criterion: "A",
        text: "Solve $x+5=12$.",
        expected_answer: "7",
        success_criteria: "- Show the inverse operation.\n- Write the final value of $x$.\n- Quick check by substituting back.",
        ideal_explanation: "Subtract $5$ from both sides: $x = 12 - 5 = 7$. Check: $7+5=12$.",
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate $2 + 3 \\times 4$.",
        expected_answer: "14",
        success_criteria: "- Use correct order of operations.\n- Show the intermediate multiplication.",
        ideal_explanation: "Multiply first: $3 \\times 4 = 12$, then $2 + 12 = 14$.",
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate $\\frac{1}{2} + \\frac{1}{4}$.",
        expected_answer: "$\\frac{3}{4}$",
        success_criteria: "- Use a common denominator.\n- Combine numerators.\n- Simplify if needed.",
        ideal_explanation: "Use a common denominator: $\\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}$.",
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate $8 - 3$.",
        expected_answer: "5",
        success_criteria: "- Correct subtraction.\n- Final statement.",
        ideal_explanation: "Subtract: $8 - 3 = 5$.",
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Geometry",
        criterion: "C",
        text: "A square has side length $4$. Determine its perimeter.",
        expected_answer: "16",
        success_criteria: "- State the perimeter rule.\n- Show multiplication.\n- Include units if given.",
        ideal_explanation: "Perimeter of a square is $4 \\times \\text{side} = 4 \\times 4 = 16$.",
        plotly_spec: "",
        type: "input"
    },
    {
        topic_category: "Arithmetic",
        criterion: "A",
        text: "Calculate $9 \\div 3$.",
        expected_answer: "3",
        success_criteria: "- Correct division.\n- Final statement.",
        ideal_explanation: "$9 \\div 3 = 3$.",
        plotly_spec: "",
        type: "input"
    }
];
 function pickFallbackQuestion(excludeText) {
    const norm = (t) => (t == null ? "" : String(t)).trim();
    const ex = norm(excludeText);
    const filtered = FALLBACK_QUESTIONS.filter((q) => norm(q.text) !== ex);
    const pool = filtered.length ? filtered : FALLBACK_QUESTIONS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { ...pick, _questionSource: "offline" };
}
 function normalizeQuestionStem(t) {
    return (t == null ? "" : String(t))
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
 /**
 * Normalize common LLM LaTeX currency glitches like `$\$15$` or `$ \$ 15 $`.
 * MathJax can render these, but we keep dollars out of math mode to avoid edge-case parsing bugs.
 */
function normalizeLatexCurrency(s) {
    if (s == null) return s;
    let out = String(s);
    // Replace currency wrapped in inline math mode with plain escaped dollars.
    // `$\$15$` => `\$15`
    out = out.replace(/\$\s*\\\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, amt) => `\\$${amt}`);
    // Some models emit `$15` inside math mode without escaping: `$ $15 $` etc. Try to fix that too.
    out = out.replace(/\$\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, amt) => `\\$${amt}`);
    return out;
}
 function extractAllIntegers(s) {
    const out = [];
    if (s == null) return out;
    const text = String(s);
    const re = /-?\d+/g;
    let m;
    while ((m = re.exec(text))) {
        const n = parseInt(m[0], 10);
        if (!Number.isNaN(n)) out.push(n);
    }
    return out;
}
 function synthesizeQuantityStoryPlotlySpec(q) {
    const blob = `${String(q?.text || "")} ${String(q?.ideal_explanation || "")}`.toLowerCase();
    const ints = extractAllIntegers(blob);
    if (ints.length < 2) return "";
     // Heuristic: use the last two numbers as (change, end) or (end, change) depending on verbs.
    const a = ints[ints.length - 2];
    const b = ints[ints.length - 1];
    let change = a;
    let end = b;
     // If story implies subtraction (spent/gave away/lost), treat 'a' as change and compute start = end + change.
    const isSubtractStory = /\b(spend|spent|gave away|give away|lost|take away|take out|removed|minus|left)\b/.test(blob);
    const isAddStory = /\b(add|added|got|received|plus|more)\b/.test(blob);
     // Prefer end to be the larger number if add story; prefer end to be the smaller if subtract story.
    if (isAddStory && a > b) {
        change = b;
        end = a;
    } else if (isSubtractStory && a < b) {
        change = b;
        end = a;
    }
     const absChange = Math.abs(change);
    let start = isSubtractStory ? end + absChange : end - absChange;
    if (!Number.isFinite(start)) start = end - Math.abs(change);
     const signedChange = isSubtractStory ? -absChange : absChange;
    const labels = ["Start", "Change", "End"];
    const values = [start, signedChange, end];
    const barColors = ["#60a5fa", signedChange < 0 ? "#f87171" : "#34d399", "#fbbf24"];
     const spec = {
        data: [
            {
                type: "bar",
                x: labels,
                y: values,
                marker: { color: barColors }
            }
        ],
        layout: {
            title: "Start → Change → End",
            xaxis: { title: "" },
            yaxis: { title: "Amount", zeroline: true }
        }
    };
    return JSON.stringify(spec);
}
 /** True when text + explanation use concrete quantities / stories that should always get a Plotly chart. */
function responseNeedsNonEmptyPlotlyChart(q) {
    if (!q || typeof q !== "object") return false;
    const blob = `${String(q.text || "")} ${String(q.ideal_explanation || "")}`.toLowerCase();
    const hasNumeric =
        /\d/.test(blob) ||
        /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/.test(
            blob
        );
    if (!hasNumeric) return false;
    if (/\bmarbles?\b/.test(blob)) return true;
    const physical =
        /\b(apples?|cand(y|ies)|cookies?|toys?|oranges?|stickers?|balloons?|pencils?|eggs?)\b/.test(blob) ||
        /\b(bag|box|jar|basket)\b/.test(blob);
    const story =
        /\b(gave|give|gave away|received|got|lost|take out|take away|put in|started with|began with|had some|now has|now have|how many .{0,16}left|remaining|in all|altogether|more than|fewer|difference|total|sum|combined|plus|minus)\b/.test(
            blob
        );
    const analogy =
        /\b(think of (it|this) like|picture|imagine|like a (bag|jar|box)|number line)\b/.test(blob);
    return physical && (story || analogy);
}
 function buildMypConstraintsBlock(level) {
    const band =
        level <= 3 ? "Foundations (early Year 7 readiness)" : level <= 6 ? "IB MYP Year 7" : "IB MYP Year 8";
    const allowedByBand =
        level <= 3
            ? [
                  "integer operations, order of operations, simple fractions/decimals/percent basics",
                  "one-step and simple two-step linear equations in one variable",
                  "simple patterns and substitution (evaluate an expression for a given value)",
                  "simple perimeter/area with whole-number dimensions"
              ]
            : level <= 6
              ? [
                    "linear expressions and equations; solving and checking solutions",
                    "fractions/decimals/percent conversions and problems in context",
                    "ratio and rates (unit rate) with straightforward numbers",
                    "basic geometry: perimeter/area; angle facts; simple coordinates"
                ]
              : [
                    "multi-step linear equations; distributive property; combining like terms",
                    "proportional relationships and percent change (increase/decrease) in context",
                    "intro to functions as input/output; reading simple graphs (no advanced curve fitting)",
                    "basic statistics: mean/median/mode; simple data displays and interpretation"
                ];
     const outOfScope = [
        "calculus (derivatives/integrals/limits)",
        "trigonometry (sin/cos/tan)",
        "quadratic formula / completing the square as a main skill",
        "simultaneous equations beyond very simple intuition",
        "logarithms"
    ];
     return (
        `\n\nCURRICULUM CONSTRAINTS (must follow):\n` +
        `- Target band: ${band}. Use this level to set difficulty.\n` +
        `- Keep the problem within IB MYP Year 7–8 scope. No “surprise” senior topics.\n` +
        `- Allowed focus areas for this band: ${allowedByBand.join("; ")}.\n` +
        `- Explicitly avoid: ${outOfScope.join(", ")}.\n` +
        `- Use MYP-friendly command terms in the stem when natural (e.g., "solve", "calculate", "determine", "simplify").\n` +
        `- Explanation quality (Rubicon-style): show the method clearly, include 1 quick check when possible, and keep the reading level ~age 12–14.\n` +
        `- Make distractors realistic: common student mistakes for this band (sign error, order of operations, wrong percent base, etc.).\n`
    );
}
 function buildMathQuestionPrompt() {
    const easier = state.forceEasierNextQuestion === true;
    const diff = easier ? "Introductory" : (state.currentLevel <= 3 ? "Introductory" : (state.currentLevel <= 6 ? "Grade 7" : "Grade 8"));
    const criterionCycle = ["A", "B", "C"];
    const targetCriterion = criterionCycle[state.turnIndex % criterionCycle.length];
    const enemyName = String(getQuestNode(state.currentLevel)?.name || "Enemy");
    const contextSeeds = [
        "sports practice (scores, laps, training plan)",
        "shopping/budget (discounts, tax, unit price)",
        "school timetable (minutes, periods, totals)",
        "science lab (measurement, rates, density-style ratios)",
        "music (beats per minute, patterns, repeats)",
        "video games (XP, levels, upgrades, probability drops)",
        "travel (distance-time-speed with simple numbers)",
        "geometry in a room (perimeter/area, tiles, fencing)",
        "data display (table/bar chart/line chart interpretation)",
        "patterns & sequences (nth term, rule, justification)"
    ];
    const pickSeed = (nonce) => {
        const s = String(nonce || "");
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return contextSeeds[h % contextSeeds.length];
    };
    let weakestTopic = "Algebra";
    if (state.skillProfile) {
        let lowestRatio = 1.1;
        Object.entries(state.skillProfile).forEach(([topic, data]) => {
            const ratio = data.attempts === 0 ? 0 : data.corrects / data.attempts;
            if (ratio < lowestRatio) {
                lowestRatio = ratio;
                weakestTopic = topic;
            }
        });
    }
    // 70/30 interleaving: 70% weakest-topic retention, 30% alternative topic progression.
    let chosenTopic = weakestTopic;
    try {
        const topics = state.skillProfile ? Object.keys(state.skillProfile) : [];
        const others = topics.filter((t) => t && t !== weakestTopic);
        if (others.length && Math.random() < 0.3) {
            chosenTopic = others[Math.floor(Math.random() * others.length)];
        }
    } catch (_) {}
    const nonce =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    const contextSeed = pickSeed(nonce);
    let avoidPrior = "";
    const prevStem = state.activeQuestion?.text;
    if (prevStem && String(prevStem).trim()) {
        const snippet = String(prevStem).trim().slice(0, 320);
        avoidPrior = `\n\nThe player was just shown this stem — you must NOT repeat it, reuse the same numbers with different wording, or mirror its structure. Produce a clearly different problem:\n${JSON.stringify(snippet)}`;
    }
    return `[SEED: ${Date.now()}] [NONCE: ${nonce}]

Role: You are an expert IB Middle Years Programme (MYP) Math Examiner acting as a slightly snarky Dungeon Master for a middle school RPG.

Current Combat Parameters:
- Difficulty: ${diff}
- Topic: ${chosenTopic}
- Enemy Name: ${enemyName}

Task: Generate 1 unique, rigorous MYP-aligned math question based on the topic and difficulty.

Tone & Narrative (CRITICAL):
- The question "text" MUST be formatted in two parts:
  1) The Taunt: a short, slightly arrogant, math-themed insult/challenge spoken by the enemy (appeal to ages 11–13).
  2) The Equation/Problem: the actual math question immediately after, stated clearly. Do NOT hide the math in a confusing word problem unless the topic is Real-Life Modeling.

Technical & Formatting Constraints:
- All math notation MUST use LaTeX (e.g., $x^2 + 5 = 14$).
- IMPORTANT: When using units like cm, m, or percent, ALWAYS wrap them in \\text{} (e.g., $25 \\text{ cm}$).
- Combat questions MUST be open-ended typed response: type MUST be "input" and there MUST NOT be MCQ options in the combat schema.
- Return JSON ONLY (no markdown, no code fences).
${avoidPrior}
${buildMypConstraintsBlock(state.forceEasierNextQuestion === true ? 1 : state.currentLevel)}

CREATIVITY & VARIATION (must follow):
- Use this scenario seed to keep things fresh: ${contextSeed}.
- Do NOT reuse the same story template repeatedly. Avoid the cliché “bag of marbles / gave away / found more / now has” structure unless the prompt explicitly demands it.
- Vary the surface form: sometimes ask to simplify, solve, determine, represent with an equation, interpret a small table/graph, or justify a pattern (especially for Criterion B).
- Vary names, objects, and settings. Prefer realistic MYP contexts (school, sports, shopping, science, games) over marbles unless needed.
- For Criterion B, prioritize patterns/sequences/generalization and justification (not just a word-problem equation solve).

For ideal_explanation: write as if explaining to a smart 10-year-old — short sentences, everyday words, friendly tone, optional one simple analogy; still be mathematically correct and use LaTeX for formulas. Do not sound like a dry textbook abstract.

For charts vs words: If plotly_spec is "", you must NOT say there is a graph, picture, chart, plot, or "visual" in "text" or "ideal_explanation". If you want a chart, set plotly_spec to a non-empty JSON STRING (escaped in the outer JSON) with valid Plotly content: at least one trace with numeric coordinates (e.g. scatter with "x" and "y" arrays of numbers, or bars). The app renders only plotly_spec — promising a visual in prose without filling plotly_spec is wrong.

Default toward a chart when the math has a clear picture: linear or simple equations, inequalities on a number line, proportional relationships, "y vs x", comparing two quantities, or geometry with lengths/angles. Use a minimal Plotly chart (e.g. scatter mode lines+markers through two points, or a bar chart for two numbers). Reserve plotly_spec "" only when a graph would truly add nothing (e.g. "which expression is prime?", pure symbol push with no numeric story).

STRICT (addition/subtraction & stories): If the question OR ideal_explanation involves marbles, apples, cookies, toys, a bag/jar/box, "gave away", "started with", "take out", "how many left", "in all", or any similar real-world quantity story, plotly_spec MUST be a non-empty valid Plotly string — this is required, not optional.

Preferred chart for these: a bar chart with x = ["Start","Change","End"] and y = [start, change, end], where change is NEGATIVE for take-away/spent/gave-away and POSITIVE for added/received. This directly shows the math step.

Avoid an unlabeled line graph that doesn’t connect to the story steps.`;
}
 function parseModelJsonContent(content) {
    if (content == null) throw new Error("empty model content");
    let s = typeof content === "string" ? content.trim() : JSON.stringify(content);
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) s = fenced[1].trim();
    return JSON.parse(s);
}
 function parseModelJsonContentLenient(content) {
    if (content == null) throw new Error("empty model content");
    let s = typeof content === "string" ? content.trim() : JSON.stringify(content);
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) s = fenced[1].trim();
    try {
        return JSON.parse(s);
    } catch (_) {
        // Try to salvage the first JSON object in the output.
        const start = s.indexOf("{");
        const end = s.lastIndexOf("}");
        if (start >= 0 && end > start) {
            const candidate = s.slice(start, end + 1);
            return JSON.parse(candidate);
        }
        throw _;
    }
}
 function validateQuestionPayload(q) {
    if (!q || typeof q !== "object") throw new Error("invalid question");
    const need = ["text", "ideal_explanation", "type", "expected_answer", "criterion", "success_criteria"];
    for (const k of need) {
        if (q[k] == null || q[k] === "") throw new Error("missing " + k);
    }
    // Sanitize currency patterns before rendering and before answer/option comparisons.
    q.text = normalizeLatexCurrency(q.text);
    q.ideal_explanation = normalizeLatexCurrency(q.ideal_explanation);
    q.expected_answer = normalizeLatexCurrency(q.expected_answer);
    q.criterion = String(q.criterion).trim().toUpperCase();
    if (!["A", "B", "C"].includes(q.criterion)) throw new Error("criterion must be A, B, or C");
    if (q.type !== "input") throw new Error('type must be "input"');
    if (q.plotly_spec != null && typeof q.plotly_spec === "object") {
        try {
            q.plotly_spec = JSON.stringify(q.plotly_spec);
        } catch (_) {
            q.plotly_spec = "";
        }
    }
    if (q.plotly_spec == null) q.plotly_spec = "";
    if (q.topic_category == null) q.topic_category = "Math";
     // If this is a quantity story and the model didn't give a valid chart, synthesize a minimal number line.
    // This prevents "imagine a number line" with no actual plot.
    if (responseNeedsNonEmptyPlotlyChart(q) && parsePlotlySpec(q.plotly_spec) == null) {
        const synthesized = synthesizeQuantityStoryPlotlySpec(q);
        if (synthesized) q.plotly_spec = synthesized;
    }
}
 function assertSmokePingJson(parsed) {
    if (parsed && (parsed.ping === "ok" || parsed.ok === true)) return;
    throw new Error("Smoke marker missing");
}
 async function smokePingDashScope(dashscopeKey, modelId, signal) {
    const url = dashscopeChatCompletionsUrl();
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dashscopeKey}`
    };
    const bodyBase = {
        model: modelId,
        messages: [{ role: "user", content: 'Output only JSON: {"ping":"ok"}' }],
        max_tokens: 48
    };
    const attemptOnce = async () => {
        let r = await fetch(url, {
            method: "POST",
            headers,
            signal,
            body: JSON.stringify({ ...bodyBase, response_format: { type: "json_object" } })
        });
        if (r.status === 400) {
            r = await fetch(url, {
                method: "POST",
                headers,
                signal,
                body: JSON.stringify(bodyBase)
            });
        }
        return r;
    };
    let res = await attemptOnce();
    if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 6000));
        res = await attemptOnce();
    }
    if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 12000));
        res = await attemptOnce();
    }
    if (res.status === 429) {
        const e = new Error("DashScope rate limited (429) after retries");
        e.isRateLimit = true;
        throw e;
    }
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`DashScope HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const content = data?.choices?.[0]?.message?.content;
    if (content == null || String(content).trim() === "") throw new Error("DashScope: empty content");
    assertSmokePingJson(parseModelJsonContent(content));
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
    const { dsKey, dsModel } = getConfiguredAiKeys();
    if (!dsKey) {
        lastAiConnectivityCheck = {
            ok: false,
            summary: "No API key",
            detail: "Set __dashscope_api_key in ai-config.js (Gemini is not used — unavailable in HK)."
        };
        set(
            "AI: SKIP",
            "text-slate-400 font-bold",
            "No AI key — offline pool only. When you have a key, the banner above each MCQ shows live vs offline for that question."
        );
        syncQuestionsApiBadge();
        return;
    }
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 22000);
    lastAiConnectivityCheck = { ok: null, summary: "", detail: "" };
    syncQuestionsApiBadge();
    try {
        await smokePingDashScope(dsKey, dsModel, ctrl.signal);
        clearTimeout(tid);
        lastAiConnectivityCheck = {
            ok: true,
            summary: "API reachable",
            detail: `DashScope · ${dsModel}`
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
        "\n\nHard requirements (Qwen-compatible JSON):\n" +
        '- type must be the string "input".\n' +
        '- criterion must be one of "A", "B", "C" (targeted by the prompt).\n' +
        "- expected_answer: the canonical final answer as a short string (may include LaTeX).\n" +
        "- success_criteria: 2–5 bullet points (as a single string) describing what earns full credit for the targeted criterion.\n" +
        '- plotly_spec: string only — "" OR one JSON-encoded Plotly spec with escaped inner quotes; never a raw object at this key. If "", do not mention any graph/chart/visual in text or ideal_explanation. If not "", include real numeric trace data so a chart can render (e.g. scatter with numeric "x" and "y").\n' +
        "- Curriculum: keep within IB MYP Year 7–8 scope and obey the band indicated in the prompt; avoid calculus/trig/logs/quadratic formula.\n" +
        '- REQUIRED: If text or ideal_explanation mentions marbles, apples, cookies, toys, a bag/box/jar, "gave"/"take away"/"started with"/"how many left"/"in all" or similar quantity stories, plotly_spec MUST NOT be "". Use a number-line scatter (y all 0) or a bar chart with numeric heights.\n' +
        '- Prefer non-empty plotly_spec when the math has a natural picture (equations, lines, rates, two quantities to compare, number-line ideas); a minimal scatter or bar chart is enough. Use "" only when a graph would not help.\n' +
        "- ideal_explanation: short teacher-style solution steps and a quick check; LaTeX for math; keep it readable for Year 7/8.\n" +
        '\nReturn one JSON object with exactly these keys: topic_category, criterion, text, expected_answer, success_criteria, ideal_explanation, plotly_spec, type. No markdown, no code fences.'
    );
}
 async function fetchQuestionViaDashScope(dashscopeKey, basePrompt) {
    const url = dashscopeChatCompletionsUrl();
    const { dsModel } = getConfiguredAiKeys();
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dashscopeKey}`
    };
    const systemMsg = {
        role: "system",
        content:
            "You output exactly one valid JSON object and nothing else. No markdown code fences, no commentary. Use double quotes for JSON strings. For word problems with objects (marbles, apples, bags) or addition/subtraction stories, always include a non-empty plotly_spec with numeric Plotly data (number line or bars) — never leave plotly_spec empty for those."
    };
    const questionBackoff = { min429DelayMs: 3500, maxDelayMs: 22000, initialDelayMs: 1000 };
     const callModel = async (userContent) => {
        debugLogAiPrompt("dashscope.user", userContent);
        const messages = [systemMsg, { role: "user", content: userContent }];
        const bodyWithJson = JSON.stringify({
            model: dsModel,
            messages,
            response_format: { type: "json_object" },
            temperature: 0.65,
            max_tokens: 1100
        });
        const bodyPlain = JSON.stringify({
            model: dsModel,
            messages,
            temperature: 0.65,
            max_tokens: 1100
        });
        let res;
        try {
            res = await fetchWithBackoff(url, { method: "POST", headers, body: bodyWithJson }, 4, questionBackoff);
        } catch (e) {
            const m = e && e.message ? String(e.message) : "";
            if (m.includes("400")) {
                res = await fetchWithBackoff(url, { method: "POST", headers, body: bodyPlain }, 4, questionBackoff);
            } else {
                throw e;
            }
        }
        const data = await res.json();
        if (data && data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }
        const content = data?.choices?.[0]?.message?.content;
        const parsed = parseModelJsonContent(content);
        validateQuestionPayload(parsed);
        return parsed;
    };
     const recentSet = new Set((state.recentQuestionStems || []).slice(0, MAX_RECENT_STEMS));
    const isDup = (t) => {
        const n = normalizeQuestionStem(t);
        return !!n && recentSet.has(n);
    };
     let parsed = await callModel(basePrompt + dashScopeQuestionUserSuffix());
    if (isDup(parsed.text)) {
        const avoid = (state.recentQuestionStems || []).slice(0, 10).map((s) => `- ${s}`).join("\n");
        parsed = await callModel(
            basePrompt +
                dashScopeQuestionUserSuffix() +
                "\n\nCritical: You repeated a recent question. Regenerate a clearly different problem (new numbers, different story, different structure). Avoid anything similar to these recent stems:\n" +
                avoid
        );
        validateQuestionPayload(parsed);
        if (isDup(parsed.text)) {
            parsed = await callModel(
                basePrompt +
                    dashScopeQuestionUserSuffix() +
                    "\n\nFinal warning: you repeated a recent question AGAIN. Output a brand-new problem with different numbers/context and a different structure. Do not reuse any prior stem patterns."
            );
            validateQuestionPayload(parsed);
            if (isDup(parsed.text)) {
                throw new Error("DashScope returned a duplicate question stem (recent history)");
            }
        }
    }
    // Enforce charts for quantity stories (especially marbles). Retry a few times if the model ignores it.
    if (responseNeedsNonEmptyPlotlyChart(parsed)) {
        const chartRetries = 3;
        for (let i = 0; i < chartRetries && !parsePlotlySpec(parsed.plotly_spec); i++) {
            parsed = await callModel(
                basePrompt +
                    dashScopeQuestionUserSuffix() +
                    '\n\nYour previous JSON was rejected: it used a marble/bag/object quantity story, so plotly_spec MUST be a non-empty valid Plotly JSON string.\n' +
                    'You MUST include a chart. Use one of these minimal templates:\n' +
                    '1) Bars (preferred): {"data":[{"type":"bar","x":["Start","Change","End"],"y":[23,12,35]}],"layout":{"title":"Start → Change → End"}}\n' +
                    '   For take-away stories, make Change negative, e.g. {"y":[17,-5,12]}.\n' +
                    '2) Number line (ok): {"data":[{"type":"scatter","mode":"lines+markers","x":[23,35],"y":[0,0]}],"layout":{"title":"Number line"}}\n' +
                    'Pick numbers that match your story (use the exact quantities from the problem). plotly_spec must be a JSON-ENCODED STRING at that key.\n' +
                    'Do not leave plotly_spec empty.'
            );
            validateQuestionPayload(parsed);
        }
        if (!parsePlotlySpec(parsed.plotly_spec)) {
            throw new Error("DashScope returned empty/invalid plotly_spec for a quantity story (chart required)");
        }
    }
    return Object.assign(parsed, { _questionSource: "dashscope", _dashscopeModel: dsModel });
}
 function getPrefetchTimeoutMs() {
    // Debug/testing: allow bumping timeout without editing code.
    // - query: ?aiTimeoutMs=45000
    // - config: window.__prefetch_ai_timeout_ms = 45000
    let ms = 28000;
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
 async function prefetchQuestion() {
    if (fetchPromise) return fetchPromise;
     fetchPromise = (async () => {
        prefetchInFlight = true;
        syncMapQuestionBufferHint();
        syncQuestionsApiBadge();
        const prompt = buildMathQuestionPrompt();
        const { dsKey } = getConfiguredAiKeys();
        const cancelLateAi = { cancelled: false };
         try {
            await raceWithPrefetchTimeout(
                (async () => {
                    if (!dsKey) throw new Error("no DashScope API key configured");
                    const q = await fetchQuestionViaDashScope(dsKey, prompt);
                    if (!cancelLateAi.cancelled) state.nextQuestion = q;
                })(),
                getPrefetchTimeoutMs()
            );
        } catch (e) {
            cancelLateAi.cancelled = true;
            console.error("prefetchQuestion (live AI failed, using offline pool):", e);
            setPrefetchFailureFromError(e);
            state.nextQuestion = pickFallbackQuestion(state.activeQuestion?.text);
        } finally {
            prefetchInFlight = false;
            fetchPromise = null;
            syncAiRouteNotice();
            syncMapQuestionBufferHint();
            syncQuestionsApiBadge();
        }
    })();
    return fetchPromise;
}

export async function evaluateTextAnswer({ question, studentResponse }) {
    try {
        return await gradeResponseViaDashScope({ question, studentResponse });
    } catch (e) {
        console.warn("evaluateTextAnswer: falling back to local judge", e);
        return localFallbackJudge({ question, studentResponse });
    }
}

export { fetchWithBackoff, prefetchQuestion };

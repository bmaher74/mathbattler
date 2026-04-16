const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Admin SDK: server-side Firestore (not blocked by client ad blockers).
try {
  admin.initializeApp();
} catch (_) {
  // Ignore double-init in some emulators / warm starts.
}
const db = admin.firestore();

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The Dungeon Master refuses to speak to unauthenticated mortals."
    );
  }
}

function readString(v, maxLen = 180) {
  const s = typeof v === "string" ? v : String(v ?? "");
  const t = s.trim();
  if (!t) return "";
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

function assertNoSlash(label, s) {
  if (s.includes("/")) throw new HttpsError("invalid-argument", `${label} must not contain '/'`);
}

function assertSafeId(label, s, maxLen = 120) {
  if (!s || typeof s !== "string") throw new HttpsError("invalid-argument", `${label} required`);
  if (s.length > maxLen) throw new HttpsError("invalid-argument", `${label} too long`);
  assertNoSlash(label, s);
}

function profileDocPath(appId, profileId) {
  return `artifacts/${appId}/public/data/playerProfiles/${profileId}`;
}

exports.vaultHealthcheck = onCall(
  { region: "us-central1", invoker: "public", cors: true },
  async (request) => {
    requireAuth(request);
    const d = request.data || {};
    const appId = readString(d.appId || "", 120);
    assertSafeId("appId", appId, 120);
    const ref = db.doc(`artifacts/${appId}/public/data/healthcheck/status`);
    await ref.set({ ts: Date.now(), uid: request.auth.uid }, { merge: true });
    return { ok: true, ts: Date.now() };
  }
);

exports.getPlayerProfile = onCall(
  { region: "us-central1", invoker: "public", cors: true },
  async (request) => {
    requireAuth(request);
    const d = request.data || {};
    const appId = readString(d.appId || "", 120);
    const profileId = readString(d.profileId || "", 120);
    assertSafeId("appId", appId, 120);
    assertSafeId("profileId", profileId, 120);
    const ref = db.doc(profileDocPath(appId, profileId));
    const snap = await ref.get();
    return { exists: snap.exists, data: snap.exists ? snap.data() : null };
  }
);

exports.setPlayerProfile = onCall(
  { region: "us-central1", invoker: "public", cors: true },
  async (request) => {
    requireAuth(request);
    const d = request.data || {};
    const appId = readString(d.appId || "", 120);
    const profileId = readString(d.profileId || "", 120);
    assertSafeId("appId", appId, 120);
    assertSafeId("profileId", profileId, 120);
    const payload = d.payload && typeof d.payload === "object" && !Array.isArray(d.payload) ? d.payload : null;
    if (!payload) throw new HttpsError("invalid-argument", "payload object required");

    // Minimal guardrails: prevent extremely large writes.
    const jsonSize = Buffer.byteLength(JSON.stringify(payload), "utf8");
    if (jsonSize > 250_000) throw new HttpsError("invalid-argument", "payload too large");

    const ref = db.doc(profileDocPath(appId, profileId));
    await ref.set(
      {
        ...payload,
        lastSyncedAt: Date.now(),
        lastSyncedUid: request.auth.uid
      },
      { merge: true }
    );
    return { ok: true, ts: Date.now() };
  }
);

// Gen 2 runs on Cloud Run. Without a public invoker, the browser's CORS preflight (OPTIONS)
// can be rejected before the callable responds — Chrome reports "No Access-Control-Allow-Origin".
// Auth is still enforced below via request.auth (anonymous Firebase users are fine).
exports.generateCombatQuestion = onCall(
  {
    secrets: ["DASH_SCOPE_API_KEY"],
    region: "us-central1",
    invoker: "public",
    cors: true
  },
  async (request) => {
    // 1. Security Check: In v2, auth is accessed via request.auth
    requireAuth(request);

    // 2. Load the secret API key
    const DASH_SCOPE_KEY = process.env.DASH_SCOPE_API_KEY; 

    const d = request.data || {};
    if (!d.messages || !Array.isArray(d.messages)) {
        throw new HttpsError("invalid-argument", "messages array required");
    }

    const body = {
        model: d.model || "qwen-flash",
        messages: d.messages
    };
    if (d.temperature !== undefined) body.temperature = d.temperature;
    if (d.max_tokens !== undefined) body.max_tokens = d.max_tokens;
    if (d.response_format !== undefined) body.response_format = d.response_format;

    // 3. Make the fetch call to Alibaba
    try {
        const response = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DASH_SCOPE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DashScope API Error:", errorText);
            if (response.status === 400) {
                throw new HttpsError(
                    "failed-precondition",
                    `DashScope 400: ${errorText.slice(0, 900)}`
                );
            }
            throw new Error(`API returned ${response.status}`);
        }

        const json = await response.json();
        return json;

    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        console.error("LLM Generation Failed:", error);
        throw new HttpsError(
            'internal', 
            'The dungeon master is sleeping.'
        );
    }
});
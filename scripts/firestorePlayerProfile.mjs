/**
 * Read Math Battler player profile documents from Firestore (Admin SDK).
 * Path matches the web app: artifacts/{appId}/public/data/playerProfiles/{docId}
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appId } from "../js/state.js";
import { loadRootDotEnvIntoProcessEnv } from "./loadRootDotEnv.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Relative paths in FIREBASE_SERVICE_ACCOUNT_PATH are resolved from the repo root. */
function resolveServiceAccountPath(p) {
    const s = String(p ?? "").trim();
    if (!s) return s;
    return isAbsolute(s) ? s : resolve(ROOT, s);
}

function safeProfileDocId(displayName) {
    return String(displayName || "player").replace(/\//g, "_");
}

let cachedAdmin = null;

async function getFirebaseAdmin() {
    if (cachedAdmin) return cachedAdmin;
    loadRootDotEnvIntoProcessEnv(ROOT);
    const mod = await import("firebase-admin");
    const admin = mod.default;
    if (admin.apps.length) {
        cachedAdmin = admin;
        return admin;
    }
    const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    const pathRaw = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
    const hasWebConfigOnly = Boolean(process.env.FIREBASE_CONFIG_JSON?.trim());
    const adminConfigHint =
        " The Admin SDK needs a separate credential: Firebase Console → Project settings → Service accounts → Generate new private key. " +
        'That JSON has "type":"service_account" and a private_key — not the same as FIREBASE_CONFIG_JSON (web apiKey). ' +
        "Paste it as one line in FIREBASE_SERVICE_ACCOUNT_JSON=... or save the file and set FIREBASE_SERVICE_ACCOUNT_PATH.";
    if (jsonRaw) {
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(jsonRaw)) });
    } else if (pathRaw) {
        const resolvedPath = resolveServiceAccountPath(pathRaw);
        if (!existsSync(resolvedPath)) {
            let hint =
                pathRaw.includes("path/to") || pathRaw.includes("your-service-account")
                    ? " That path was an example — use a real downloaded service account JSON."
                    : " Check the path (relative paths are from the repo root), or set FIREBASE_SERVICE_ACCOUNT_JSON.";
            if (hasWebConfigOnly) {
                hint += adminConfigHint;
            }
            throw new Error(`Firestore: service account file not found: ${resolvedPath}.${hint}`);
        }
        let raw;
        try {
            raw = readFileSync(resolvedPath, "utf8");
        } catch (e) {
            const msg = e && e.code === "ENOENT" ? "file not found" : e.message || String(e);
            throw new Error(`Firestore: cannot read FIREBASE_SERVICE_ACCOUNT_PATH (${resolvedPath}): ${msg}`);
        }
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    } else {
        let msg =
            "Firestore: set FIREBASE_SERVICE_ACCOUNT_JSON (service account JSON, one line) or FIREBASE_SERVICE_ACCOUNT_PATH (path to that .json file). " +
            "Firebase Console → Project settings → Service accounts → Generate new private key.";
        if (hasWebConfigOnly) {
            msg += adminConfigHint;
        }
        throw new Error(msg);
    }
    cachedAdmin = admin;
    return admin;
}

/**
 * @param {string} displayName Player display name at login (e.g. "Brendan") — must match Firestore doc id
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function fetchPlayerProfileDocFromFirestore(displayName) {
    const admin = await getFirebaseAdmin();
    const db = admin.firestore();
    const docId = safeProfileDocId(displayName);
    const ref = db.doc(`artifacts/${appId}/public/data/playerProfiles/${docId}`);
    const snap = await ref.get();
    if (!snap.exists) return null;
    return snap.data() || null;
}

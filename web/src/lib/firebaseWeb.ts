import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    linkWithPopup,
    signInAnonymously,
    signInWithPopup,
    signOut,
    type Auth,
    type User
} from "firebase/auth";

export type FirebaseWebConfigStatus = "missing" | "placeholder" | "ok";

export function readFirebaseWebConfigStatus(): FirebaseWebConfigStatus {
    try {
        const raw = typeof window !== "undefined" ? (window as Window & { __firebase_config?: unknown }).__firebase_config : undefined;
        const s = typeof raw === "string" ? raw : "";
        if (!s.trim()) return "missing";
        const o = JSON.parse(s) as { apiKey?: string; projectId?: string };
        const k = String(o.apiKey || "");
        const p = String(o.projectId || "");
        if (!k || k.includes("PASTE") || !p || p === "YOUR_PROJECT_ID") return "placeholder";
        return "ok";
    } catch {
        return "missing";
    }
}

function parseFirebaseConfigObject(): Record<string, unknown> | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = (window as Window & { __firebase_config?: unknown }).__firebase_config;
        const s = typeof raw === "string" ? raw : "";
        if (!s.trim()) return null;
        const o = JSON.parse(s) as Record<string, unknown>;
        return o && typeof o === "object" ? o : null;
    } catch {
        return null;
    }
}

/**
 * Single Firebase app for the React shell — same `window.__firebase_config` project as the classic client.
 */
export function getOrInitFirebaseWebApp(): FirebaseApp | null {
    if (typeof window === "undefined") return null;
    if (readFirebaseWebConfigStatus() !== "ok") return null;
    if (getApps().length > 0) return getApp();
    const cfg = parseFirebaseConfigObject();
    if (!cfg) return null;
    return initializeApp(cfg);
}

export function getFirebaseWebAuth(): Auth | null {
    const app = getOrInitFirebaseWebApp();
    if (!app) return null;
    return getAuth(app);
}

let shellAuthBootstrapPromise: Promise<User | null> | null = null;

/** Testing: reset singleton so a later bootstrap can run again. */
export function resetShellAuthBootstrapForTests(): void {
    shellAuthBootstrapPromise = null;
}

/**
 * Before the `/game` iframe loads: ensure Firebase Auth persistence has a user.
 * The classic iframe is same-origin (srcdoc); Auth uses shared IndexedDB so the iframe
 * can call `auth.authStateReady()` and reuse this session instead of signing in again.
 */
export function ensureShellAuthBootstrap(): Promise<User | null> {
    if (!shellAuthBootstrapPromise) {
        shellAuthBootstrapPromise = runShellAuthBootstrap();
    }
    return shellAuthBootstrapPromise;
}

async function runShellAuthBootstrap(): Promise<User | null> {
    const authInstance = getFirebaseWebAuth();
    if (!authInstance) return null;
    try {
        await authInstance.authStateReady();
        if (!authInstance.currentUser) {
            await signInAnonymously(authInstance);
        }
        return authInstance.currentUser;
    } catch (e) {
        console.warn("[mathbattler] Shell Firebase auth bootstrap failed:", e);
        return null;
    }
}

/**
 * Google sign-in in the shell. If the current user is anonymous (default after bootstrap), links Google to
 * that account so the UID is preserved for Firestore rules and cloud profile continuity.
 */
export async function signInOrLinkGoogleInShell(): Promise<User> {
    const authInstance = getFirebaseWebAuth();
    if (!authInstance) throw new Error("Firebase is not configured");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await authInstance.authStateReady();
    const u = authInstance.currentUser;
    if (u && u.isAnonymous) {
        const { user } = await linkWithPopup(u, provider);
        return user;
    }
    const { user } = await signInWithPopup(authInstance, provider);
    return user;
}

/** Clears shell + persisted Auth state for this origin (iframe picks up empty session on next load). */
export async function signOutShellFirebase(): Promise<void> {
    const authInstance = getFirebaseWebAuth();
    if (authInstance) {
        try {
            await signOut(authInstance);
        } catch (e) {
            console.warn("[mathbattler] Shell Firebase signOut failed:", e);
        }
    }
    shellAuthBootstrapPromise = null;
}

/**
 * Shared Firebase config checks for the React shell (legacy `main.js` still initializes
 * Firebase inside the `/game` iframe). Next step: one auth flow + token bridge into the iframe.
 */
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

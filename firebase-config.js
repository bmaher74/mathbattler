/**
 * Cloud saves — sets window.__firebase_config (JSON string) only when nothing valid is set yet.
 * With `npm run serve`, runtime-config.js runs after this file and overwrites from .env.
 * If script order were wrong, this would still avoid clobbering an existing valid config.
 */
(function () {
    function firebaseConfigLooksPlaceholder(cfg) {
        try {
            const o = typeof cfg === "string" ? JSON.parse(cfg) : null;
            if (!o || typeof o !== "object") return true;
            const key = String(o.apiKey || "");
            const pid = String(o.projectId || "");
            if (!key || key.includes("PASTE")) return true;
            if (!pid || pid === "YOUR_PROJECT_ID") return true;
            return false;
        } catch (_) {
            return true;
        }
    }

    const existing = typeof window.__firebase_config === "string" ? window.__firebase_config.trim() : "";
    if (existing && !firebaseConfigLooksPlaceholder(existing)) return;

    window.__firebase_config = JSON.stringify({
        apiKey: "PASTE_FROM_FIREBASE_CONSOLE",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "PASTE",
        appId: "PASTE_WEB_APP_ID"
    });
})();

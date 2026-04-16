/**
 * Shared runtime-config.js body for local dev (serve-static) and Netlify build (generate-runtime-config).
 * Reads FIREBASE_* from the provided env object (defaults to process.env).
 */

export function jsStringLiteral(s) {
    return JSON.stringify(String(s ?? ""));
}

/** Netlify sets CONTEXT=production for production deploys; optional MATHBATTLER_PRODUCTION_UI=0/1 to override. */
export function productionUiFromEnv(env) {
    const raw = String(env.MATHBATTLER_PRODUCTION_UI ?? "").trim().toLowerCase();
    if (raw === "1" || raw === "true" || raw === "yes") return true;
    if (raw === "0" || raw === "false" || raw === "no") return false;
    return env.CONTEXT === "production";
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @param {{ bannerLines?: string[] }} [opts]
 */
export function runtimeConfigJs(env = process.env, opts = {}) {
    const fbJson = env.FIREBASE_CONFIG_JSON || "";
    const fbApiKey = env.FIREBASE_API_KEY || "";
    const fbAuthDomain = env.FIREBASE_AUTH_DOMAIN || "";
    const fbProjectId = env.FIREBASE_PROJECT_ID || "";
    const fbStorageBucket = env.FIREBASE_STORAGE_BUCKET || "";
    const fbMessagingSenderId = env.FIREBASE_MESSAGING_SENDER_ID || "";
    const fbAppId = env.FIREBASE_APP_ID || "";
    const fbMeasurementId = env.FIREBASE_MEASUREMENT_ID || "";

    const defaultBanner = [
        "// Generated — do not commit secrets; use .env (local) or CI env (Netlify)."
    ];
    const banner = (opts.bannerLines && opts.bannerLines.length ? opts.bannerLines : defaultBanner).join("\n") + "\n";

    return (
        `${banner}` +
        `(function(){\n` +
        `  // DashScope API keys are not injected here — combat LLM calls go through generateCombatQuestion (HTTPS Callable).\n` +
        `\n` +
        `  // Firebase config must be a JSON string in window.__firebase_config.\n` +
        `  var fbJson = ${jsStringLiteral(fbJson)};\n` +
        `  if (fbJson.trim()) {\n` +
        `    window.__firebase_config = fbJson;\n` +
        `  } else if (${jsStringLiteral(fbApiKey)}.trim() && ${jsStringLiteral(fbProjectId)}.trim()) {\n` +
        `    window.__firebase_config = JSON.stringify({\n` +
        `      apiKey: ${jsStringLiteral(fbApiKey)},\n` +
        `      authDomain: ${jsStringLiteral(fbAuthDomain)},\n` +
        `      projectId: ${jsStringLiteral(fbProjectId)},\n` +
        `      storageBucket: ${jsStringLiteral(fbStorageBucket)},\n` +
        `      messagingSenderId: ${jsStringLiteral(fbMessagingSenderId)},\n` +
        `      appId: ${jsStringLiteral(fbAppId)},\n` +
        `      measurementId: ${jsStringLiteral(fbMeasurementId)}\n` +
        `    });\n` +
        `  }\n` +
        `  window.__mathbattler_production_ui__ = ${productionUiFromEnv(env) ? "true" : "false"};\n` +
        `})();\n`
    );
}

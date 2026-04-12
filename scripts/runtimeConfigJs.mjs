/**
 * Shared runtime-config.js body for local dev (serve-static) and Netlify build (generate-runtime-config).
 * Reads DASHSCOPE_* and FIREBASE_* from the provided env object (defaults to process.env).
 */

export function jsStringLiteral(s) {
    return JSON.stringify(String(s ?? ""));
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @param {{ bannerLines?: string[] }} [opts]
 */
export function runtimeConfigJs(env = process.env, opts = {}) {
    const dsKey = env.DASHSCOPE_API_KEY || "";
    const dsBase = env.DASHSCOPE_BASE_URL || "";
    const dsModel = env.DASHSCOPE_MODEL || "";
    const dsChatUrl = env.DASHSCOPE_CHAT_COMPLETIONS_URL || "";

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
        `  window.__dashscope_api_key = ${jsStringLiteral(dsKey)};\n` +
        `  if (${jsStringLiteral(dsBase)}.trim()) window.__dashscope_base_url = ${jsStringLiteral(dsBase)};\n` +
        `  if (${jsStringLiteral(dsModel)}.trim()) window.__dashscope_model = ${jsStringLiteral(dsModel)};\n` +
        `  if (${jsStringLiteral(dsChatUrl)}.trim()) window.__dashscope_chat_completions_url = ${jsStringLiteral(dsChatUrl)};\n` +
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
        `})();\n`
    );
}

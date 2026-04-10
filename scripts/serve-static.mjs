#!/usr/bin/env node
/**
 * Minimal static file server for local testing (no Python).
 * The game runs entirely in the browser; this only serves files over http:// so you avoid file:// quirks.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8765;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".webp": "image/webp"
};

/**
 * Merge repo-root `.env` into process.env.
 * - Fills missing keys.
 * - Also fills when process.env has an empty string (common gotcha: `export DASHSCOPE_API_KEY=`
 *   blocks .env forever if we skip "defined" keys — breaks after refresh vs first load).
 * Re-read on each call so `npm run serve` picks up .env edits without restart and stays
 * consistent for every `/runtime-config.js` request (hard refresh).
 */
function loadRootDotEnvIntoProcessEnv() {
    try {
        const p = path.join(ROOT, ".env");
        if (!fs.existsSync(p)) return;
        const text = fs.readFileSync(p, "utf8");
        for (const line of text.split("\n")) {
            const t = line.trim();
            if (!t || t.startsWith("#")) continue;
            const m = t.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
            if (!m) continue;
            const key = m[1];
            const cur = process.env[key];
            const curEmpty = cur === undefined || String(cur).trim() === "";
            if (!curEmpty) continue;
            let v = m[2].trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
            }
            process.env[key] = v;
        }
    } catch (e) {
        console.warn("WARN: failed to load .env:", e?.message || e);
    }
}

function jsStringLiteral(s) {
    return JSON.stringify(String(s ?? ""));
}

function runtimeConfigJs() {
    const dsKey = process.env.DASHSCOPE_API_KEY || "";
    const dsBase = process.env.DASHSCOPE_BASE_URL || "";
    const dsModel = process.env.DASHSCOPE_MODEL || "";
    const dsChatUrl = process.env.DASHSCOPE_CHAT_COMPLETIONS_URL || "";

    // Firebase: allow either a single JSON string or individual fields.
    const fbJson = process.env.FIREBASE_CONFIG_JSON || "";
    const fbApiKey = process.env.FIREBASE_API_KEY || "";
    const fbAuthDomain = process.env.FIREBASE_AUTH_DOMAIN || "";
    const fbProjectId = process.env.FIREBASE_PROJECT_ID || "";
    const fbStorageBucket = process.env.FIREBASE_STORAGE_BUCKET || "";
    const fbMessagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || "";
    const fbAppId = process.env.FIREBASE_APP_ID || "";
    const fbMeasurementId = process.env.FIREBASE_MEASUREMENT_ID || "";

    return (
        `// Generated at request time by scripts/serve-static.mjs\n` +
        `// Values are sourced from process.env (and repo-root .env for local dev).\n` +
        `// Do NOT commit secrets into JS files; use .env + this endpoint.\n` +
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

function resolvePath(urlPath) {
    let rel = urlPath === "/" || urlPath === "" ? "index.html" : urlPath.replace(/^\/+/, "");
    if (rel.endsWith("/")) rel += "index.html";
    const full = path.resolve(ROOT, rel);
    const rootResolved = path.resolve(ROOT);
    if (!full.startsWith(rootResolved + path.sep) && full !== rootResolved) return null;
    return full;
}

const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405).end();
        return;
    }
    let pathname;
    try {
        pathname = new URL(req.url || "/", `http://${HOST}`).pathname;
    } catch {
        res.writeHead(400).end();
        return;
    }
    if (pathname === "/runtime-config.js") {
        loadRootDotEnvIntoProcessEnv();
        res.setHeader("Content-Type", MIME[".js"]);
        res.setHeader("Cache-Control", "no-store");
        if (req.method === "HEAD") {
            res.writeHead(200).end();
            return;
        }
        res.writeHead(200);
        res.end(runtimeConfigJs());
        return;
    }

    const filePath = resolvePath(pathname);
    if (!filePath) {
        res.writeHead(403).end("Forbidden");
        return;
    }
    fs.stat(filePath, (err, st) => {
        if (err || !st.isFile()) {
            res.writeHead(404).end("Not found");
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
        if (ext === ".html") {
            res.setHeader("Cache-Control", "no-store, must-revalidate");
        }
        if (req.method === "HEAD") {
            res.writeHead(200).end();
            return;
        }
        const stream = fs.createReadStream(filePath);
        stream.on("error", () => {
            if (!res.headersSent) res.writeHead(500).end();
        });
        res.writeHead(200);
        stream.pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Math Battler static server  http://${HOST}:${PORT}/`);
    console.log("(Open index.html in the browser — app logic is client-side only.)");
});

#!/usr/bin/env node
/**
 * Minimal static file server for local testing (no Python).
 * The game runs entirely in the browser; this only serves files over http:// so you avoid file:// quirks.
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRootDotEnvIntoProcessEnv } from "./loadRootDotEnv.mjs";
import { runtimeConfigJs } from "./runtimeConfigJs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8765;
/** Bind all interfaces so other devices on the LAN can reach the dev server. Use HOST=127.0.0.1 for localhost only. */
const HOST = process.env.HOST || "0.0.0.0";

function lanIPv4Addresses() {
    const out = [];
    for (const nets of Object.values(os.networkInterfaces())) {
        for (const net of nets || []) {
            const fam = net.family;
            if ((fam === "IPv4" || fam === 4) && !net.internal) out.push(net.address);
        }
    }
    return out;
}

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
        pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
    } catch {
        res.writeHead(400).end();
        return;
    }
    if (pathname === "/runtime-config.js") {
        loadRootDotEnvIntoProcessEnv(ROOT);
        res.setHeader("Content-Type", MIME[".js"]);
        res.setHeader("Cache-Control", "no-store");
        if (req.method === "HEAD") {
            res.writeHead(200).end();
            return;
        }
        res.writeHead(200);
        res.end(
            runtimeConfigJs(process.env, {
                bannerLines: [
                    "// Generated at request time by scripts/serve-static.mjs",
                    "// Values are sourced from process.env (and repo-root .env for local dev).",
                    "// Do NOT commit secrets into JS files; use .env + this endpoint."
                ]
            })
        );
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
    console.log("Math Battler static server");
    console.log(`  Local:   http://127.0.0.1:${PORT}/`);
    if (HOST === "0.0.0.0" || HOST === "::") {
        for (const ip of lanIPv4Addresses()) {
            console.log(`  Network: http://${ip}:${PORT}/`);
        }
    } else {
        console.log(`  Bound:   http://${HOST}:${PORT}/`);
    }
    console.log("(Open index.html in the browser — app logic is client-side only.)");
});

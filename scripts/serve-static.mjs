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

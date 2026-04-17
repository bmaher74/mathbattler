import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { loadRootDotEnvIntoProcessEnv } from "../scripts/loadRootDotEnv.mjs";
import { runtimeConfigJs } from "../scripts/runtimeConfigJs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function contentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".png": "image/png",
        ".ogg": "audio/ogg",
        ".html": "text/html; charset=utf-8"
    };
    return map[ext] || "application/octet-stream";
}

function sendFile(res: { statusCode?: number; setHeader: (k: string, v: string) => void; end: (b?: Buffer) => void }, filePath: string) {
    if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.end();
        return;
    }
    res.setHeader("Content-Type", contentType(filePath));
    res.end(fs.readFileSync(filePath));
}

function repoStaticPlugin(): Plugin {
    return {
        name: "mathbattler-repo-static",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                try {
                    const url = req.url?.split("?")[0] || "";
                    if (url === "/runtime-config.js") {
                        loadRootDotEnvIntoProcessEnv(REPO_ROOT);
                        const body = runtimeConfigJs(process.env, {
                            bannerLines: [
                                "// Generated at request time by web/vite (dev)",
                                "// Values from process.env and repo-root .env"
                            ]
                        });
                        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                        res.setHeader("Cache-Control", "no-store");
                        res.end(body);
                        return;
                    }
                    if (url.startsWith("/js/")) {
                        const filePath = path.join(REPO_ROOT, url.slice(1));
                        if (filePath.startsWith(path.join(REPO_ROOT, "js")) && fs.existsSync(filePath)) {
                            sendFile(res as Parameters<typeof sendFile>[0], filePath);
                            return;
                        }
                    }
                    if (url.startsWith("/audio/")) {
                        const filePath = path.join(REPO_ROOT, url.slice(1));
                        if (filePath.startsWith(path.join(REPO_ROOT, "audio")) && fs.existsSync(filePath)) {
                            sendFile(res as Parameters<typeof sendFile>[0], filePath);
                            return;
                        }
                    }
                    const rootFiles = [
                        "/firebase-config.js",
                        "/ai-config.js",
                        "/tailwind.css",
                        "/style.css",
                        "/favicon.svg",
                        "/runtime-config.js"
                    ];
                    if (rootFiles.includes(url) && url !== "/runtime-config.js") {
                        const name = url.slice(1);
                        const filePath = path.join(REPO_ROOT, name);
                        if (fs.existsSync(filePath)) {
                            sendFile(res as Parameters<typeof sendFile>[0], filePath);
                            return;
                        }
                    }
                } catch {
                    /* fall through */
                }
                next();
            });
        }
    };
}

export default defineConfig({
    plugins: [react(), repoStaticPlugin()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src")
        }
    },
    server: {
        port: 5173,
        fs: { allow: [REPO_ROOT] }
    },
    preview: {
        port: 4173
    },
    build: {
        outDir: "dist",
        emptyOutDir: true
    }
});

#!/usr/bin/env node
/**
 * After Vite emits web/dist, copy game assets the legacy bundle expects at absolute paths (/js/, /audio/, …).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(__dirname, "..");
const ROOT = path.resolve(WEB, "..");
const DIST = path.join(WEB, "dist");

function copyFile(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`copy-legacy-assets: skip missing ${path.relative(ROOT, src)}`);
        return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`copied ${path.relative(DIST, dest)}`);
}

function copyDir(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
        console.warn(`copy-legacy-assets: skip missing dir ${srcDir}`);
        return;
    }
    fs.mkdirSync(destDir, { recursive: true });
    for (const name of fs.readdirSync(srcDir)) {
        const s = path.join(srcDir, name);
        const d = path.join(destDir, name);
        const st = fs.statSync(s);
        if (st.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
    console.log(`copied dir ${path.relative(DIST, destDir)}`);
}

copyDir(path.join(ROOT, "js"), path.join(DIST, "js"));
copyDir(path.join(ROOT, "audio"), path.join(DIST, "audio"));

for (const f of ["tailwind.css", "style.css", "firebase-config.js", "favicon.svg"]) {
    copyFile(path.join(ROOT, f), path.join(DIST, f));
}
const aiConfig = path.join(ROOT, "ai-config.js");
if (fs.existsSync(aiConfig)) {
    copyFile(aiConfig, path.join(DIST, "ai-config.js"));
}
const runtimeConfig = path.join(ROOT, "runtime-config.js");
if (fs.existsSync(runtimeConfig)) {
    copyFile(runtimeConfig, path.join(DIST, "runtime-config.js"));
} else {
    console.warn("copy-legacy-assets: runtime-config.js missing — run `node scripts/generate-runtime-config.mjs` from repo root before web build for production config.");
}

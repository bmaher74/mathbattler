/**
 * Repo-root `.env` → `process.env`.
 *
 * A `.env` file at the project root is the conventional place to define environment variables for
 * local development (same idea as `dotenv` / twelve-factor config). This loader does not add a
 * dependency; it parses standard `KEY=value` lines and merges them into `process.env`.
 *
 * Lines use the usual `NAME=value` form (optional `export` prefix; optional double/single quotes
 * around the value).
 *
 * Merge rule: existing non-blank values in `process.env` win (e.g. CI or `export VAR=...`).
 * Missing keys, or keys whose value is undefined or only whitespace, are filled from `.env`.
 * This matches local dev expectations: a blank `export DASHSCOPE_API_KEY=` still lets `.env` supply it.
 *
 * @param {string} [rootDir] Repository root (directory containing `.env`). Defaults to parent of `scripts/`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, "..");

export function loadRootDotEnvIntoProcessEnv(rootDir = DEFAULT_ROOT) {
    try {
        const envPath = path.join(rootDir, ".env");
        if (!fs.existsSync(envPath)) return;
        const text = fs.readFileSync(envPath, "utf8");
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

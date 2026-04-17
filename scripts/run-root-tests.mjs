#!/usr/bin/env node
/**
 * Runs root `node --test` suite without treating stray npm args as test paths
 * (e.g. `npm test web typecheck` would otherwise pass `web` and `typecheck` to node --test).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaScript = join(root, "scripts", "test-ai-schemas.mjs");

const argv = process.argv.slice(2);
const resolvedExtra = argv
    .map((p) => (isAbsolute(p) ? p : join(root, p)))
    .filter((abs) => abs.startsWith(root) && existsSync(abs) && abs.endsWith(".mjs"));

const defaultTests = readdirSync(join(root, "test"), { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".test.mjs"))
    .map((d) => join(root, "test", d.name));

const testFiles =
    resolvedExtra.length > 0
        ? [schemaScript, ...resolvedExtra.filter((p) => p !== schemaScript)]
        : [schemaScript, ...defaultTests];

const r = spawnSync(process.execPath, ["--test", ...testFiles], {
    stdio: "inherit",
    cwd: root
});
process.exit(r.status === null ? 1 : r.status);

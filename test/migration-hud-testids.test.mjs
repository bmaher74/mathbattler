import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hudPath = join(root, "web", "src", "features", "migration", "HudPreviewPage.tsx");
const src = readFileSync(hudPath, "utf8");

test("HudPreviewPage keeps RTL-oriented data-testid markers", () => {
    for (const id of ["cloud-sync-badge-preview", "ai-questions-status-preview", "engagement-toast-preview"]) {
        assert.match(src, new RegExp(`data-testid="${id}"`));
    }
});

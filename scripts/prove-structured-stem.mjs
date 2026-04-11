#!/usr/bin/env node
/**
 * Prove structured stem composition on the command line (no app wiring).
 *
 *   node scripts/prove-structured-stem.mjs scripts/examples/structured-stem-money.sample.json
 *
 * JSON: either { "text_blocks": [ ... ] } or a raw array of blocks.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { composeStructuredStem } = await import(join(ROOT, "scripts/structured-stem-lab/composeStem.mjs"));
const { proseWithMathToHtml } = await import(join(ROOT, "js/ai/displayMathProse.js"));

const path = process.argv[2] || join(ROOT, "scripts/examples/structured-stem-money.sample.json");
const raw = readFileSync(resolve(path), "utf8");
const parsed = JSON.parse(raw);
const blocks = Array.isArray(parsed) ? parsed : parsed.text_blocks;
if (!Array.isArray(blocks) || blocks.length === 0) {
    console.error("Expected text_blocks array or top-level array of blocks");
    process.exit(1);
}

const composed = composeStructuredStem(blocks);
const html = proseWithMathToHtml(composed);

console.log("=== BLOCKS (input) ===");
console.log(JSON.stringify(blocks, null, 2));
console.log("\n=== COMPOSED STEM (player-visible text from composeStructuredStem) ===");
console.log(composed);
console.log("\n=== CHECKS ===");
console.log("Contains $14 (currency):", /\$14\b/.test(composed));
console.log("Contains $8.50:", /\$8\.50/.test(composed));
console.log("Contains $30:", /\$30\b/.test(composed));
console.log("Equation as \\(...\\):", /\\\(14x = 8\.50x \+ 30\\\)/.test(composed));
console.log("\n=== HTML (proseWithMathToHtml — same path as the app; first 500 chars) ===");
console.log(html.slice(0, 500) + (html.length > 500 ? "…" : ""));

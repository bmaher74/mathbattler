/**
 * Structured combat stem: alternating prose (currency + English) and inline_math (LaTeX only, no $).
 * Composes to a single `text` for MathJax and legacy callers.
 */

import { fixJsonEscapeCorruptedLatexCommands, normalizeLatexCurrency } from "./latexPostprocess.js";
import { sanitizeLlmProseString } from "./llmProseSanitize.js";

function stripInlineMathWrappers(latex) {
    let t = String(latex ?? "").trim();
    t = t.replace(/^\$+/, "").replace(/\$+$/, "");
    if (t.startsWith("\\(") && t.endsWith("\\)")) {
        t = t.slice(2, -2).trim();
    }
    return t;
}

/**
 * @param {Array<{ type: 'prose', content: string } | { type: 'inline_math', latex: string }>} blocks
 * @returns {string}
 */
export function composeCombatStemTextFromBlocks(blocks) {
    let out = "";
    let prev = /** @type {string | null} */ (null);
    for (const b of blocks) {
        if (prev === "prose" && b.type === "inline_math") out += "\n\n";
        else if (prev === "inline_math" && b.type === "prose") out += "\n\n";
        if (b.type === "prose") {
            out += sanitizeLlmProseString(normalizeLatexCurrency(String(b.content ?? "")));
            prev = "prose";
        } else if (b.type === "inline_math") {
            out += "\\(" + stripInlineMathWrappers(b.latex) + "\\)";
            prev = "inline_math";
        } else {
            throw new Error(`Unknown text_blocks entry: ${JSON.stringify(b)}`);
        }
    }
    return fixJsonEscapeCorruptedLatexCommands(out);
}

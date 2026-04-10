/**
 * Safe HTML for prose that may contain MathJax inline delimiters $...$.
 */

import { sanitizeLlmProseString } from "./llmProseSanitize.js";

export function escapeHtmlText(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/** Newlines to <br> only outside $...$ (input must already be HTML-escaped). */
export function nl2brRespectingInlineMath(escaped) {
    const s = String(escaped);
    let out = "";
    let i = 0;
    let inMath = false;
    let buf = "";
    const flush = () => {
        if (!buf) return;
        out += inMath ? buf : buf.replace(/\n/g, "<br>");
        buf = "";
    };
    while (i < s.length) {
        if (s[i] === "\\" && s[i + 1] === "$") {
            buf += "\\$";
            i += 2;
            continue;
        }
        if (s[i] === "$") {
            flush();
            inMath = !inMath;
            out += "$";
            i++;
            continue;
        }
        buf += s[i++];
    }
    flush();
    return out;
}

/** Player-visible LLM prose: sanitize, escape, math-safe line breaks. */
export function proseWithMathToHtml(raw) {
    const t = sanitizeLlmProseString(String(raw ?? ""));
    return nl2brRespectingInlineMath(escapeHtmlText(t));
}

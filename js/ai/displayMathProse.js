/**
 * Safe HTML for prose that may contain MathJax inline delimiters \\(...\\) (and stray $...$ toggles for legacy text).
 */

import { sanitizeLlmProseString } from "./llmProseSanitize.js";

export function escapeHtmlText(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/** Newlines to <br> only outside inline math (\\(...\\) or legacy $...$); input must already be HTML-escaped. */
export function nl2brRespectingInlineMath(escaped) {
    const s = String(escaped);
    let out = "";
    let i = 0;
    let inMath = false;
    /** "paren" | "dollar" when inMath — $ inside \\(...\\) stays literal */
    let mathMode = null;
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
        if (!inMath && s[i] === "\\" && s[i + 1] === "(") {
            flush();
            out += "\\(";
            i += 2;
            inMath = true;
            mathMode = "paren";
            continue;
        }
        if (inMath && mathMode === "paren" && s[i] === "\\" && s[i + 1] === ")") {
            flush();
            out += "\\)";
            i += 2;
            inMath = false;
            mathMode = null;
            continue;
        }
        if (s[i] === "$") {
            if (inMath && mathMode === "paren") {
                buf += "$";
                i++;
                continue;
            }
            flush();
            inMath = !inMath;
            out += "$";
            i++;
            mathMode = inMath ? "dollar" : null;
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

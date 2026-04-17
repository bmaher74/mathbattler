/**
 * Detect player-visible LaTeX that spells out a multi-step numeric solution
 * (common model failure: "4\\times 5=20,\\,20-4=16,\\ldots").
 */

/**
 * @param {string} latex
 * @returns {boolean}
 */
export function latexHasCommaSeparatedNumericWorkedSteps(latex) {
    const s = String(latex ?? "").trim();
    if (!s) return false;
    if (!/[;,]/.test(s)) return false;

    const parts = s.split(/\s*[,;]\s*/).filter(Boolean);
    if (parts.length < 2) return false;

    let arithmeticSteps = 0;
    for (const part of parts) {
        const eqIdx = part.indexOf("=");
        if (eqIdx < 0) continue;
        const lhs = part.slice(0, eqIdx).trim();
        const rhs = part.slice(eqIdx + 1).trim();
        if (!lhs || !rhs) continue;
        if (!rhsIsNumericReveal(rhs)) continue;
        if (!lhsLooksLikeArithmeticExpression(lhs)) continue;
        arithmeticSteps++;
        if (arithmeticSteps >= 2) return true;
    }
    return false;
}

/**
 * @param {string} rhs
 */
function rhsIsNumericReveal(rhs) {
    const r0 = String(rhs).trim();
    if (!r0) return false;
    const r = r0.replace(/\\\%/g, "").replace(/%/g, "").replace(/\s+/g, "");
    if (/^-?\d+(\.\d+)?$/.test(r)) return true;
    const fr = r0.replace(/\s+/g, "");
    if (/^\\frac\{\d+\}\{\d+\}$/.test(fr)) return true;
    return false;
}

/**
 * True when lhs is a numeric / percent expression (not a single named variable).
 * @param {string} lhs
 */
function lhsLooksLikeArithmeticExpression(lhs) {
    const t = String(lhs).trim();
    if (!t) return false;
    const noText = t.replace(/\\text\{[^}]*\}/g, "").replace(/\\mathrm\{[^}]*\}/g, "");
    if (/[a-zA-Z]/.test(noText)) return false;
    if (!/[0-9]/.test(noText)) return false;
    return true;
}

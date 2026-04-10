/**
 * LaTeX-oriented fixes after JSON.parse (JSON \\t vs TeX \\text, currency in math mode).
 */

export function normalizeLatexCurrency(s) {
    if (s == null) return s;
    let out = String(s);
    out = out.replace(/\$\s*\\\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, amt) => `\\$${amt}`);
    out = out.replace(/\$\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, amt) => `\\$${amt}`);
    return out;
}

/**
 * JSON treats \\t / \\f as tab / form-feed. A single "\\text{cm}" in JSON becomes TAB + "ext{cm}".
 */
export function fixJsonEscapeCorruptedLatexCommands(s) {
    if (s == null || typeof s !== "string") return s;
    return s
        .replace(/\t(ext\{)/g, "\\text{")
        .replace(/\t(imes)(?=\s|[\d\}\],$^]|[+*=/]|$)/g, "\\times")
        .replace(/\f(rac\{)/g, "\\frac{");
}

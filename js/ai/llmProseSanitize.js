/**
 * Strip markdown-ish noise from model prose. The UI’s MathJax uses \\(...\\) for inline math only—never $—because $ is
 * ubiquitous in ordinary text. Legacy paired $...$ from models is repaired where safe (rewriteDollarInlineMathToParen).
 * Runs after JSON.parse (includes fixJsonEscapeCorruptedLatexCommands).
 */

import { fixJsonEscapeCorruptedLatexCommands } from "./latexPostprocess.js";

function stripTripleBacktickFences(s) {
    return String(s ?? "").replace(/```(?:[a-zA-Z0-9_-]*\s*\n?)?([\s\S]*?)```/g, (_, inner) => "\n" + String(inner).trim() + "\n");
}

function demoteMarkdownHeadingLines(s) {
    return String(s ?? "")
        .split(/\r?\n/)
        .map((line) => line.replace(/^#{1,6}\s+/, ""))
        .join("\n");
}

function rowCellsFromPossibleTableLine(line) {
    const t = String(line).trim();
    if (!t.includes("|")) return null;
    let inner = t;
    if (t.startsWith("|")) {
        inner = t.endsWith("|") && t.length > 1 ? t.slice(1, -1) : t.slice(1);
    }
    const cells = inner.split("|").map((c) => c.trim());
    if (cells.length < 2) return null;
    return cells;
}

function isMarkdownTableSeparatorRow(cells) {
    if (!cells || cells.length === 0) return false;
    return cells.every((c) => /^[\s\-:|]+$/.test(c) && /-{2,}/.test(c));
}

function flattenMarkdownTablesToPlainText(s) {
    const lines = String(s).split(/\r?\n/);
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const row0 = rowCellsFromPossibleTableLine(lines[i]);
        const row1 = i + 1 < lines.length ? rowCellsFromPossibleTableLine(lines[i + 1]) : null;
        const gfmTable =
            row0 &&
            row1 &&
            isMarkdownTableSeparatorRow(row1) &&
            !isMarkdownTableSeparatorRow(row0);
        const pipeBlock = lines[i].trim().startsWith("|");

        if (gfmTable || pipeBlock) {
            const start = i;
            let j = i;
            if (gfmTable) {
                j += 2;
                while (j < lines.length) {
                    const rc = rowCellsFromPossibleTableLine(lines[j]);
                    if (!rc || isMarkdownTableSeparatorRow(rc)) break;
                    j++;
                }
            } else {
                while (j < lines.length && lines[j].trim().startsWith("|")) j++;
            }
            const block = lines.slice(start, j);
            const rows = block.map(rowCellsFromPossibleTableLine).filter((r) => r && r.length > 0);
            let replaced = false;
            if (rows.length >= 2) {
                let header = rows[0];
                let bodyRows;
                if (isMarkdownTableSeparatorRow(rows[1])) {
                    bodyRows = rows.slice(2);
                } else {
                    header = null;
                    bodyRows = rows;
                }
                if (header && bodyRows.length > 0) {
                    for (const br of bodyRows) {
                        const parts = br.map((cell, idx) => {
                            const h = header[idx] != null ? String(header[idx]) : "";
                            return h ? `${h}: ${cell}` : String(cell);
                        });
                        out.push(parts.join("; "));
                    }
                    replaced = true;
                } else if (!header && bodyRows.length > 0) {
                    for (const r of bodyRows) {
                        if (isMarkdownTableSeparatorRow(r)) continue;
                        out.push(r.join("; "));
                    }
                    replaced = true;
                }
            }
            if (!replaced) out.push(...block);
            i = j;
        } else {
            out.push(lines[i]);
            i++;
        }
    }
    return out.join("\n");
}

function stripMarkdownEmphasisMarkers(s) {
    let t = String(s);
    t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
    t = t.replace(/\*([A-Za-z][A-Za-z0-9\s,'-]{0,78}[A-Za-z0-9])\*/g, "$1");
    t = t.replace(/__([^_\n]+)__/g, "$1");
    t = t.replace(/`([^`\n]+)`/g, "$1");
    return t;
}

function collapseDisplayMathToInline(s) {
    return String(s).replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => {
        const oneLine = String(inner).trim().replace(/\s+/g, " ");
        return "\\(" + oneLine + "\\)";
    });
}

/**
 * After $ and a numeric run, decide if unpaired text is money ($14 per) vs prose that starts with a number ($2 for the school…$).
 * Paired $n$ is handled by the caller before this (immediate closing $).
 */
function looksLikeUnpairedCurrencyAfterDollarNumber(str, indexAfterNumericRun) {
    const nextCh = indexAfterNumericRun < str.length ? str[indexAfterNumericRun] : "";
    if (nextCh === "$") return true;
    if (/[A-Za-z:]/.test(nextCh)) return false;
    const w = str.slice(indexAfterNumericRun).match(/^\s*([a-z]{2,})/i);
    if (!w) return true;
    const word = w[1].toLowerCase();
    /** Keep small: "and"/"or" often follow a price ("$5 and solve…"). Prefer only clear sentence-starters after a leading numeral. */
    if (/^(for|the|a|an|if)$/i.test(word)) {
        return false;
    }
    return true;
}

/**
 * Heuristic: models sometimes wrap a whole word problem in $...$. MathJax then treats it as math and
 * swallows spaces (every letter looks italic). Real inline math is usually short or TeX-heavy.
 */
function shouldDemoteMathAsProse(inner) {
    const t = String(inner).trim();
    if (!t) return false;
    if (/^\\(text|mathrm|mbox)\{/.test(t) && t.length < 520) return false;
    if (t.length >= 72) return true;
    if (/\.\s+[A-Za-z]/.test(t)) return true;
    const proseHit =
        /\b(the|and|but|for|you|your|they|what|when|here|there|school|fund|sell|twist|more|than|each|every|has|have|was|were|this|that|with|from|into|about|cookie|marble|apple|bag|gave|left|started)\b/i.test(
            t
        );
    if (t.length >= 28 && proseHit) return true;
    const wordish = t.split(/\s+/).filter((w) => /[a-zA-Z]{3,}/.test(w)).length;
    if (t.length >= 22 && wordish >= 4) return true;
    return false;
}

/**
 * Strip $ delimiters from spans that are almost certainly English prose, so MathJax leaves them as text.
 */
export function demoteAccidentalInlineMathWrapping(s) {
    const str = String(s);
    let out = "";
    let i = 0;
    while (i < str.length) {
        if (str[i] === "\\" && str[i + 1] === "$") {
            out += "\\$";
            i += 2;
            continue;
        }
        if (str[i] !== "$") {
            out += str[i++];
            continue;
        }
        i++;
        const restDem = str.slice(i);
        const curDem = restDem.match(/^\s*(\d+(?:\.\d+)?)/);
        if (curDem) {
            const lenDem = curDem[0].length;
            const afterNumDem = i + lenDem;
            const nextChDem = afterNumDem < str.length ? str[afterNumDem] : "";
            /** Same rule as rewriteDollarInlineMathToParen: $3:4 is a ratio, not currency $3. */
            if (!/[A-Za-z:]/.test(nextChDem)) {
                if (afterNumDem < str.length && str[afterNumDem] === "$") {
                    out += "$" + String(curDem[1]).trim();
                    i = afterNumDem + 1;
                    continue;
                }
                if (looksLikeUnpairedCurrencyAfterDollarNumber(str, afterNumDem)) {
                    out += "$" + curDem[0];
                    i += lenDem;
                    continue;
                }
            }
        }
        let inner = "";
        while (i < str.length) {
            if (str[i] === "\\" && str[i + 1] === "$") {
                inner += "\\$";
                i += 2;
                continue;
            }
            if (str[i] === "$") break;
            inner += str[i++];
        }
        if (i < str.length && str[i] === "$") {
            if (shouldDemoteMathAsProse(inner)) {
                out += inner.replace(/\\\$/g, "$");
            } else {
                out += "$" + inner + "$";
            }
            i++;
        } else {
            out += "$" + inner;
        }
    }
    return out;
}

/**
 * Best-effort repair when models still emit TeX-style $...$ math. Product rule: inline math must be \\(...\\) only—$ is too
 * common in prose (money, etc.) to be a reliable delimiter. This does not “bless” $ math; it migrates legacy pairs to \\( \\)
 * and treats numeric $…$ as currency. Prefer fixing prompts so the model never emits paired $ for math.
 */
export function rewriteDollarInlineMathToParen(s) {
    const str = String(s);
    let out = "";
    let i = 0;
    while (i < str.length) {
        if (str[i] === "\\" && str[i + 1] === "$") {
            out += "\\$";
            i += 2;
            continue;
        }
        if (str[i] !== "$") {
            out += str[i++];
            continue;
        }
        i++;
        const rest = str.slice(i);
        const cur = rest.match(/^\s*(\d+(?:\.\d+)?)/);
        if (cur) {
            const len = cur[0].length;
            const afterNum = i + len;
            const nextCh = afterNum < str.length ? str[afterNum] : "";
            /** $14 per — currency. $14x — math. $3:4 — ratio, not currency $3. */
            if (!/[A-Za-z:]/.test(nextCh)) {
                if (afterNum < str.length && str[afterNum] === "$") {
                    out += "$" + String(cur[1]).trim();
                    i = afterNum + 1;
                    continue;
                }
                if (looksLikeUnpairedCurrencyAfterDollarNumber(str, afterNum)) {
                    out += "$" + cur[0];
                    i += len;
                    continue;
                }
            }
        }
        let inner = "";
        while (i < str.length) {
            if (str[i] === "\\" && str[i + 1] === "$") {
                inner += "\\$";
                i += 2;
                continue;
            }
            if (str[i] === "$") break;
            inner += str[i++];
        }
        if (i < str.length && str[i] === "$") {
            out += "\\(" + inner + "\\)";
            i++;
        } else {
            out += "$" + inner;
        }
    }
    return out;
}

export function sanitizeLlmProseString(s) {
    if (s == null) return s;
    let t = fixJsonEscapeCorruptedLatexCommands(String(s));
    t = stripTripleBacktickFences(t);
    t = demoteMarkdownHeadingLines(t);
    t = flattenMarkdownTablesToPlainText(t);
    t = stripMarkdownEmphasisMarkers(t);
    t = collapseDisplayMathToInline(t);
    t = demoteAccidentalInlineMathWrapping(t);
    t = rewriteDollarInlineMathToParen(t);
    return t;
}

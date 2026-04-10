/**
 * Strip markdown-ish noise from model prose; keep $...$ for MathJax.
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
        return "$" + oneLine + "$";
    });
}

function fixUnpairedMathDelimiters(s) {
    const t = String(s);
    let out = "";
    let i = 0;
    let inMath = false;
    while (i < t.length) {
        if (t[i] === "\\" && t[i + 1] === "$") {
            out += "\\$";
            i += 2;
            continue;
        }
        if (t[i] === "$") {
            inMath = !inMath;
            out += "$";
            i++;
            continue;
        }
        out += t[i++];
    }
    if (inMath) out += "$";
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
    t = fixUnpairedMathDelimiters(t);
    return t;
}

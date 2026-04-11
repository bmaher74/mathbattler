/**
 * Single copy of the “no markdown in JSON strings” contract for prompts and docs.
 * Import from here only — do not duplicate in main.js.
 */

export const LLM_NO_MARKDOWN_IN_STRINGS =
    "All human-readable strings in your JSON: plain UTF-8 sentences; math ONLY inside paired LaTeX inline delimiters \\(...\\) (one line inside each pair when possible). " +
    "Do not use the dollar sign as a math delimiter: $ appears constantly in real text (prices, shorthand, typos), so paired $...$ is ambiguous and forbidden. The app’s renderer does not use $ for inline math—only \\(...\\). For US dollars write a single $ before the amount only (e.g. $5 or $5.00), never $5$ or $0.50$. " +
    "Forbidden: Markdown pipe tables (| col |, ---|---), # headings, ** or __ emphasis, backticks or ``` fences, raw HTML tags, $$...$$ display blocks, bare LaTeX without \\(...\\). " +
    "For small data grids use labeled lines like 'Day 1: 5 laps', not a table.";

export const PROMPT_VERSION = "2026-04-11-no-dollar-math-delimiter";

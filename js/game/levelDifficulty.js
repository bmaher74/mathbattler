/**
 * Per-level scalar knobs for combat prompts (graduated difficulty; see docs/Difficulty Levels.md).
 * Curriculum bands stay in buildMypConstraintsBlock — these tune numbers, stem length, and pacing.
 */

/**
 * @param {number} mapLevel
 * @param {{ forceEasier?: boolean }} [opts]
 * @returns {{
 *   numericCeiling: number,
 *   maxStemWords: number,
 *   maxConceptualSteps: number,
 *   readingAgeShort: string,
 *   allowMultiStep: boolean
 * }}
 */
export function getLevelDifficultyKnobs(mapLevel, opts = {}) {
    const easier = opts.forceEasier === true;
    const lv = easier ? 1 : Number.isFinite(mapLevel) && mapLevel >= 1 ? Math.floor(mapLevel) : 1;

    let numericCeiling = 30;
    if (lv <= 1) numericCeiling = 30;
    else if (lv <= 3) numericCeiling = 45;
    else if (lv <= 6) numericCeiling = 70;
    else if (lv <= 10) numericCeiling = 100;
    else numericCeiling = Math.min(200, 100 + (lv - 10) * 10);

    const maxStemWords = lv <= 1 ? 90 : lv <= 3 ? 100 : lv <= 6 ? 120 : lv <= 10 ? 145 : 170;

    const maxConceptualSteps = lv <= 1 ? 1 : lv <= 3 ? 2 : lv <= 6 ? 2 : lv <= 10 ? 3 : 4;

    const readingAgeShort = lv <= 1 ? "10–11" : lv <= 3 ? "11–12" : lv <= 6 ? "12–13" : lv <= 10 ? "12–14" : "13–14";

    const allowMultiStep = lv >= 4;

    return {
        numericCeiling,
        maxStemWords,
        maxConceptualSteps,
        readingAgeShort,
        allowMultiStep
    };
}

/**
 * Short block appended to the combat user prompt (after strand snapshot, before curriculum block).
 * @param {{ numericCeiling: number, maxStemWords: number, maxConceptualSteps: number, readingAgeShort: string, allowMultiStep: boolean }} knobs
 */
export function formatDifficultyKnobsPromptBlock(knobs) {
    const multi = knobs.allowMultiStep
        ? "- Multi-step reasoning is allowed when it serves the criterion — keep every number meaningful and avoid decorative complexity.\n"
        : "- Prefer one dominant solution path; avoid stacked “first find A, then B, then C” chains unless criterion B/C explicitly requires investigation.\n";
    return (
        `\n\nDIFFICULTY SCAFFOLD (machine-derived — follow in addition to map band):\n` +
        `- Prefer story coefficients and displayed numbers ≤ ${knobs.numericCeiling} unless a slightly larger value is essential for realism (then say why in the stem).\n` +
        `- Aim stem length ≲ ${knobs.maxStemWords} words; at most ${knobs.maxConceptualSteps} major conceptual moves in the stem.\n` +
        `- Prose reading band for the player: ~ages ${knobs.readingAgeShort}.\n` +
        `- Anti-spoiler: Never chain several evaluated ` + "`= ...`" + ` steps in player-visible math. On easier bands you may show **one** unevaluated expression (e.g. unit price × quantity) as a hint; full numeric steps stay in "_thought_process" only.\n` +
        multi
    );
}

import { sanitizeLlmProseString } from "./llmProseSanitize.js";

/**
 * Fix obvious score/band mismatches after model output.
 * @param {string} band
 * @param {number|null|undefined} score
 * @returns {string}
 */
function harmonizeBandWithScore(band, score) {
    if (score == null || !Number.isFinite(score)) return band;
    const s = Math.max(0, Math.min(8, Math.trunc(score)));
    let b = band;
    if (s >= 7) {
        if (b === "incorrect" || b === "partial" || b === "correct_no_reasoning") b = "correct_with_reasoning";
    } else if (s >= 5) {
        if (b === "incorrect") b = "partial";
        if (b === "correct_with_reasoning") b = "correct_no_reasoning";
    } else if (s >= 3) {
        if (b === "incorrect" || b === "correct_no_reasoning" || b === "correct_with_reasoning") b = "partial";
    } else {
        if (b === "correct_with_reasoning" || b === "correct_no_reasoning") b = "partial";
    }
    return b;
}

export function finalizeJudgeResult(j) {
    const feedback = sanitizeLlmProseString(String(j.feedback || "").trim());
    const strengths = Array.isArray(j.strengths)
        ? j.strengths.map((s) => sanitizeLlmProseString(String(s || "").trim())).filter(Boolean).slice(0, 3)
        : [];
    const next_steps = Array.isArray(j.next_steps)
        ? j.next_steps.map((s) => sanitizeLlmProseString(String(s || "").trim())).filter(Boolean).slice(0, 3)
        : [];
    const scoreRaw = j.score;
    const score =
        scoreRaw == null || !Number.isFinite(scoreRaw) ? null : Math.max(0, Math.min(8, Math.trunc(Number(scoreRaw))));
    let band = j.band;
    band = harmonizeBandWithScore(band, score);

    const isCorrect = !!j.isCorrect;
    let isCrit = !!j.isCrit;
    if (!isCorrect || score == null || score < 7) isCrit = false;
    else if (score === 7 || score === 8) isCrit = !!j.isCrit;
    else isCrit = false;

    return {
        band,
        isCorrect,
        score,
        isCrit,
        feedback,
        strengths,
        next_steps
    };
}

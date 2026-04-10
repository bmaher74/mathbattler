import { sanitizeLlmProseString } from "./llmProseSanitize.js";

export function finalizeJudgeResult(j) {
    const feedback = sanitizeLlmProseString(String(j.feedback || "").trim());
    const strengths = Array.isArray(j.strengths)
        ? j.strengths.map((s) => sanitizeLlmProseString(String(s || "").trim())).filter(Boolean).slice(0, 3)
        : [];
    const next_steps = Array.isArray(j.next_steps)
        ? j.next_steps.map((s) => sanitizeLlmProseString(String(s || "").trim())).filter(Boolean).slice(0, 3)
        : [];
    return {
        band: j.band,
        isCorrect: !!j.isCorrect,
        score: j.score,
        isCrit: !!j.isCrit,
        feedback,
        strengths,
        next_steps
    };
}

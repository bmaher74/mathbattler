function normalizeForCompare(s) {
    return (s == null ? "" : String(s))
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

/** Heuristic when the judge API is unavailable — not MYP examiner-faithful. */
export function localFallbackJudge({ question, studentResponse }) {
    const crit = String(question?.criterion || "A").toUpperCase();
    const explanationHeavy = crit === "B" || crit === "C" || crit === "D";
    const minLen = explanationHeavy ? 48 : 25;
    const expected = normalizeForCompare(question?.expected_answer);
    const resp = normalizeForCompare(studentResponse);
    const hasSteps =
        /(\n|\.|;|therefore|so|because|then)/i.test(studentResponse) && studentResponse.length >= minLen;
    const looksCorrect = expected && (resp.includes(expected) || resp === expected);
    const band = looksCorrect
        ? hasSteps
            ? "correct_with_reasoning"
            : "correct_no_reasoning"
        : studentResponse.length >= 25
          ? "partial"
          : "incorrect";
    const feedback =
        band === "correct_with_reasoning"
            ? "What you did well: You included a clear method and a conclusion.\nTo score higher next time:\n- Keep your steps in order.\n- Add a quick check (substitute back or estimate).\nExample sentence starter: “First I…, then I…, so…, therefore ….”"
            : band === "correct_no_reasoning"
              ? "What you did well: Your final answer looks correct.\nTo score higher next time:\n- Show 2–5 steps (what you did and why).\n- End with a conclusion sentence.\nExample sentence starter: “First I…, then I…, so…, therefore ….”"
              : band === "partial"
                ? "What you did well: You started explaining.\nTo score higher next time:\n- Write the equation/operation you are using.\n- Show the key step that gets you to the final answer.\nExample sentence starter: “I start with…, then I…, so….”"
                : "What you did well: You tried.\nTo score higher next time:\n- Write the equation or rule you’re using.\n- Show at least 2 steps.\nExample sentence starter: “First I…, then I….”";
    return { band, isCorrect: looksCorrect, isCrit: false, score: null, strengths: [], next_steps: [], feedback };
}

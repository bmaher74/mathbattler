/**
 * Concise paraphrases aligned to IB MYP Mathematics criteria A–D achievement levels.
 * Not official IB text — adjust to match your subject guide.
 */

export const CRITERION_TITLES = {
    A: "Criterion A — Knowing and understanding",
    B: "Criterion B — Investigating patterns",
    C: "Criterion C — Communicating",
    D: "Criterion D — Applying mathematics in real-life contexts"
};

/** Plain keyboard text only: no uploads; describing visuals in words is valid. */
export const PLAIN_TEXT_RESPONSE_RULES =
    "The student can only type plain text (no drawings, uploads, or handwritten work). " +
    "Do not require graphs, number lines, or tables as images. " +
    "If a representation matters, accept a clear verbal description (e.g. how they would plot points, read a scale, or lay out a table in words). " +
    "Keyboard notation such as x, *, parentheses, and words for fractions is fine.";

const LEVEL_ANCHORS =
    "Use achievement level 0–8 for the TARGET CRITERION ONLY (not an average across criteria). " +
    "0 = no evidence; 1–2 = limited; 3–4 = basic; 5–6 = substantial; 7–8 = excellent for that criterion.";

const RUBRIC_A = `${LEVEL_ANCHORS}
- 0: No relevant mathematics or off-task.
- 1–2: Minimal recall; major errors selecting or using facts, procedures, or terminology.
- 3–4: Some correct recall or steps; gaps or mistakes limit consistency.
- 5–6: Generally correct selection and application of mathematics to the task; minor slips.
- 7–8: Accurate, appropriate use of mathematics; clear command of ideas and procedures for the task.`;

const RUBRIC_B = `${LEVEL_ANCHORS}
- 0: No pattern work or irrelevant.
- 1–2: Little testing of cases or wrong direction; weak link between examples and claim.
- 3–4: Notices some pattern or tests a few cases; justification or generalisation incomplete.
- 5–6: Sound pattern description, testing, or rule with reasonable justification.
- 7–8: Thorough investigation; coherent generalisation or rule with clear evidence and reasoning.`;

const RUBRIC_C = `${LEVEL_ANCHORS}
- 0: Unclear or unrelated to the task.
- 1–2: Hard to follow; vocabulary or structure weak; math meaning often obscured.
- 3–4: Partially organised; some appropriate terms; gaps in logical flow.
- 5–6: Mostly clear steps and language; logical structure fits the task.
- 7–8: Precise, well-organised communication; appropriate mathematical language and representations described in text.`;

const RUBRIC_D = `${LEVEL_ANCHORS}
- 0: No real-life link or not about the scenario.
- 1–2: Superficial use of context; wrong model or ignores reasonableness.
- 3–4: Some modelling or interpretation; assumptions or evaluation of results thin.
- 5–6: Appropriate model for the context; interprets answer with partial reflection on sense or limits.
- 7–8: Strong transfer to the situation; states/reasons about assumptions, constraints, or whether the answer is plausible.`;

const BY_LETTER = { A: RUBRIC_A, B: RUBRIC_B, C: RUBRIC_C, D: RUBRIC_D };

/**
 * @param {string} criterion - "A" | "B" | "C" | "D"
 * @returns {string} Block to inject into the judge prompt
 */
export function getRubricBlockForCriterion(criterion) {
    const c = String(criterion || "A").toUpperCase();
    const letter = ["A", "B", "C", "D"].includes(c) ? c : "A";
    const title = CRITERION_TITLES[letter] || CRITERION_TITLES.A;
    const body = BY_LETTER[letter] || RUBRIC_A;
    return `${title}\n${PLAIN_TEXT_RESPONSE_RULES}\n\n${body}`;
}

export const SCORE_TO_BAND_RULES = `Map achievement level (score) to game band consistently:
- score 0–2: band must be "incorrect" OR "partial" (use "partial" only if there is relevant but flawed mathematical work toward the task).
- score 3–4: band must be "partial".
- score 5–6: band is "correct_no_reasoning" if the mathematics meets SUCCESS_CRITERIA but explanation is thin or mostly absent; use "partial" instead if SUCCESS_CRITERIA require reasoning, interpretation, pattern justification, or real-life commentary that is missing or too weak.
- score 7–8: band must be "correct_with_reasoning" (solid evidence for the target criterion, not only a naked final number).

The score you assign must match this table: do not output score 8 with band "partial", or score 1 with band "correct_with_reasoning".`;

export const IS_CORRECT_RULES = `isCorrect means the response earns credit for the TASK, not only string-matching EXPECTED_ANSWER.
- Use SUCCESS_CRITERIA as the primary checklist; EXPECTED_ANSWER is a guide for canonical results.
- For Criterion B, credit may require a justified pattern or rule even if a single "answer" line matches.
- For Criterion C, credit may require clear explanation or organised reasoning even when the final value is right.
- For Criterion D, credit may require interpretation, an assumption, or a comment on reasonableness in context, not only a calculation.
Set isCorrect true when the work substantially satisfies SUCCESS_CRITERIA for the question; otherwise false.`;

export const IS_CRIT_RULES = `isCrit is a game flag (not an IB category): true only if isCorrect is true AND score is 8, OR isCorrect is true AND score is 7 with clearly excellent, criterion-specific evidence (not just a correct number). Otherwise false.`;

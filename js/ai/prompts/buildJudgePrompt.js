import { LLM_NO_MARKDOWN_IN_STRINGS } from "./contract.js";
import {
    getRubricBlockForCriterion,
    IS_CORRECT_RULES,
    IS_CRIT_RULES,
    SCORE_TO_BAND_RULES
} from "./mypMathRubric.js";

/**
 * @param {{ question?: object, studentResponse: string, difficultyLabel: string }} p
 */
export function buildJudgePrompt({ question, studentResponse, difficultyLabel }) {
    const q = question || {};
    const criterion = String(q.criterion || "A").toUpperCase();
    const expected = String(q.expected_answer || "");
    const stem = String(q.text || "");
    const success = String(q.success_criteria || "");
    const diff = String(difficultyLabel || "IB MYP Year 7").trim();
    const rubricBlock = getRubricBlockForCriterion(criterion);

    return (
        `You are an IB MYP mathematics examiner-style assessor. Band: ${diff}. Target criterion: ${criterion} (mark ONLY this criterion's achievement level; do not blend other criteria into the score).\n\n` +
        `${rubricBlock}\n\n` +
        `QUESTION: ${JSON.stringify(stem)}\n` +
        `EXPECTED_ANSWER (canonical guide): ${JSON.stringify(expected)}\n` +
        `SUCCESS_CRITERIA (full credit / what to look for): ${JSON.stringify(success)}\n` +
        `STUDENT_RESPONSE: ${JSON.stringify(studentResponse)}\n\n` +
        `Answer-only responses: If the student gives only a final value (or a single word/number) with no visible reasoning, steps, or explanation of method, use band "correct_no_reasoning" and score at most 6 — never "correct_with_reasoning" and never score 7 or 8. A bare correct answer is not "excellent communication" or "thorough investigation."\n\n` +
        `Marking procedure (examiner order):\n` +
        `1) Understand the task and SUCCESS_CRITERIA.\n` +
        `2) Evaluate mathematics and reasoning against SUCCESS_CRITERIA and EXPECTED_ANSWER.\n` +
        `3) Assign score: integer 0–8 = MYP achievement level for criterion ${criterion} ONLY.\n` +
        `4) Set isCorrect using the rules below.\n` +
        `5) Set band using the score→band table below (must be consistent with score).\n` +
        `6) Set isCrit using the rules below.\n\n` +
        `${IS_CORRECT_RULES}\n\n` +
        `${SCORE_TO_BAND_RULES}\n\n` +
        `${IS_CRIT_RULES}\n\n` +
        `General fairness: Reward clear informal reasoning—do not require stock phrases. ` +
        `Multiple valid approaches count—clear arithmetic with units, timelines in words, or informal step lists can show solid work. ` +
        `Do NOT require formal lettered formulas (e.g. $d=60t$, $d=rt$) unless the question explicitly asks for an equation or named variables. ` +
        `If the student is correct but informal, still use score and band that reflect criterion ${criterion}; use next_steps to suggest optional formal polish without implying failure.\n\n` +
        `Math in your JSON strings (feedback, strengths, next_steps): MathJax INLINE TeX inside \\(...\\) ONLY, e.g. \\(t\\), \\(2.5\\), \\(d=60t\\), \\(60\\times 2.5=150\\). ` +
        `Never use $$...$$. No Markdown (no **, backticks, pipe tables, # headings, or bare LaTeX without delimiters). Do not use single-dollar $...$ for math (currency may use bare $).\n\n` +
        `${LLM_NO_MARKDOWN_IN_STRINGS}\n\n` +
        `Output one JSON object only, with keys:\n` +
        `- band: "incorrect" | "partial" | "correct_no_reasoning" | "correct_with_reasoning"\n` +
        `- score: integer 0–8 (MYP achievement level for criterion ${criterion} only)\n` +
        `- isCorrect: boolean\n` +
        `- isCrit: boolean\n` +
        `- extracted_final_answer: string\n` +
        `- strengths: array of 1–3 short strings\n` +
        `- next_steps: array of 1–3 short strings\n` +
        `- feedback: string in exactly this shape:\n` +
        `  What you did well: ...\n` +
        `  To score higher next time:\n` +
        `  - ...\n` +
        `  - ...\n` +
        `  Example sentence starter: ...\n\n` +
        `Grouping / order: If the student states the correct order of operations and their expression uses parentheses or brackets consistent with that story, treat that as adequate explanation of grouping. Do not downgrade for lacking an extra sentence like "parentheses ensure…".\n\n` +
        `next_steps: Use for optional polish (e.g. map each verbal step to a part of the expression; suggest terms like order of operations, grouping)—not to imply they failed when the core idea is already correct.\n\n` +
        `Notation: Answers are plain keyboard text. Never penalize band or score for using x, *, "times", or parentheses for multiplication; never tell them to use × instead of x.\n` +
        `Typos: A clear misspelling (e.g. "mulitply") may lower score by at most 1 point; do not change band on a minor typo alone if math and reasoning are sound. You may note it briefly in next_steps.\n\n` +
        `Ignore filler; judge whether the mathematics fits the task and the explanation supports the criterion.\n` +
        `The feedback string must stay plain prose with "-" bullet lines only — no tables or markdown.\n\n` +
        `If the final band is incorrect or partial, include at least one concrete strategy the student can try next ` +
        `(for example re-read the question, check order of operations, estimate to see if the size makes sense, or line up steps) ` +
        `in feedback or next_steps — supportive tone, no shame.\n`
    );
}

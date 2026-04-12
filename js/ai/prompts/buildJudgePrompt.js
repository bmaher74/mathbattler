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
        `### Assessment contract (primary)\n` +
        `SUCCESS_CRITERIA (below) is the authoritative checklist for this question: it was written for criterion ${criterion} and this stem. Treat each line that starts with "- " as one requirement for full credit.\n` +
        `1) Parse SUCCESS_CRITERIA into separate requirements. For each, decide if the student’s work satisfies it using the QUESTION stem and STUDENT_RESPONSE.\n` +
        `2) Use EXPECTED_ANSWER as a canonical guide for the mathematics; if it conflicts with the stem or SUCCESS_CRITERIA, the stem + SUCCESS_CRITERIA win.\n` +
        `3) Map how fully the student met SUCCESS_CRITERIA onto the 0–8 scale for criterion ${criterion} using the generic rubric block below (what “substantial” vs “excellent” means for this letter).\n` +
        `4) If a required bullet in SUCCESS_CRITERIA is missing or clearly wrong, cap the score accordingly before choosing band.\n\n` +
        `${rubricBlock}\n\n` +
        `QUESTION: ${JSON.stringify(stem)}\n` +
        `EXPECTED_ANSWER (canonical guide): ${JSON.stringify(expected)}\n` +
        `SUCCESS_CRITERIA (full credit / what to look for): ${JSON.stringify(success)}\n` +
        `STUDENT_RESPONSE: ${JSON.stringify(studentResponse)}\n\n` +
        `Answer-only responses: If the student gives only a final value (or a single word/number) with no visible reasoning, steps, or explanation of method, use band "correct_no_reasoning" and score at most 6 — never "correct_with_reasoning" and never score 7 or 8. A bare correct answer is not "excellent communication" or "thorough investigation."\n\n` +
        `Marking procedure (examiner order):\n` +
        `1) Apply the Assessment contract above (SUCCESS_CRITERIA first).\n` +
        `2) Cross-check mathematics against EXPECTED_ANSWER where relevant.\n` +
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
        `Lower-secondary examiner leniency (band ${diff}): Mark like a human MYP examiner for Year 7–8—give benefit of the doubt when mathematical intent is reasonably clear. ` +
        `Informal steps, everyday language, minor spelling slips, or non-standard but unambiguous notation should not cost credit if the idea and working fit the task. ` +
        `When phrasing is ambiguous, interpret it in the student’s favour if a correct reading is plausible. ` +
        `If you are torn between two adjacent achievement levels and SUCCESS_CRITERIA are largely satisfied, prefer the higher score. ` +
        `Reserve lower bands for clear wrong mathematics, missing required ideas, or work that does not address the task—not for polish, rigid template wording, or examiner pedantry.\n\n` +
        `No false “missing step” feedback: When a SUCCESS_CRITERIA bullet asks to define or name what a variable represents, treat it as satisfied if the student gave any clear equivalent—` +
        `e.g. “let \\(x\\) be…”, “\\(x\\) = number of…”, “where \\(x\\) is…”, or a sentence that ties \\(x\\) to the correct quantity before or while setting up the equation. ` +
        `Do not tell them to “state explicitly what \\(x\\) represents” in strengths, next_steps, or feedback if they already did so in any of those forms.\n\n` +
        `Checks and substitution: If a bullet asks for substitution or a quick check, treat it as satisfied when the student shows any correct verification tied to the problem ` +
        `(e.g. plugging the value back, or arithmetic like \\(5 \\times 6 = 30\\) that matches the story). Do not ask them to substitute again in next_steps if that check is already present.\n\n` +
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
        `Grouping / order of operations: Parentheses and brackets come first—work inside them before applying “multiplication/division before addition/subtraction” to the rest. ` +
        `If the student correctly evaluates an inner bracket or parenthesis step first (e.g. \\((8-10)\\) before any multiplication that applies to that group), that is correct; do not criticize it or imply they should have multiplied earlier. ` +
        `Never accuse them of ignoring order of operations when their steps follow valid grouping. ` +
        `If the student states the correct order of operations and their expression uses parentheses or brackets consistent with that story, treat that as adequate explanation of grouping. Do not downgrade for lacking an extra sentence like "parentheses ensure…".\n\n` +
        `Mathematically sound feedback only: Every numeric claim, equality chain, or worked step you write in feedback, strengths, or next_steps must be correct and coherent. ` +
        `Verify mentally against EXPECTED_ANSWER and the student’s response; do not invent long strings of “=” that mix unrelated expressions or contradict the stem. ` +
        `If you are not completely sure of the arithmetic, give brief qualitative advice (e.g. re-check grouping, re-check signs) instead of fake worked lines.\n\n` +
        `next_steps: Use for optional polish (e.g. map each verbal step to a part of the expression; suggest terms like order of operations, grouping)—not to imply they failed when the core idea is already correct.\n\n` +
        `Notation: Answers are plain keyboard text. Never penalize band or score for using x, *, "times", or parentheses for multiplication; never tell them to use × instead of x.\n` +
        `Typos: A clear misspelling (e.g. "mulitply") may lower score by at most 1 point; do not change band on a minor typo alone if math and reasoning are sound. You may note it briefly in next_steps.\n\n` +
        `Ignore filler; judge whether the mathematics fits the task and the explanation supports the criterion.\n` +
        `The feedback string must stay plain prose with "-" bullet lines only — no tables or markdown.\n\n` +
        `If the final band is incorrect or partial, include at least one concrete strategy the student can try next ` +
        `(for example re-read the question, verify bracket/grouping before applying PEMDAS to the rest, estimate to see if the size makes sense, or line up steps) ` +
        `in feedback or next_steps — supportive tone, no shame.\n`
    );
}

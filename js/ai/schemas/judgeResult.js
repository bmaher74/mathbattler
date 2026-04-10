import { z } from "zod";

const bandEnum = z.enum(["incorrect", "partial", "correct_no_reasoning", "correct_with_reasoning"]);

export const JudgeResultSchema = z.object({
    band: bandEnum,
    score: z
        .union([z.number(), z.null(), z.undefined()])
        .transform((v) => (v == null || !Number.isFinite(v) ? null : Math.max(0, Math.min(8, Math.trunc(v))))),
    isCorrect: z.boolean(),
    isCrit: z.boolean(),
    extracted_final_answer: z.preprocess((v) => (v == null ? "" : String(v)), z.string()),
    strengths: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.string())),
    next_steps: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.string())),
    feedback: z.preprocess((v) => (v == null ? "" : String(v)), z.string())
});

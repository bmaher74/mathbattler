import { z } from "zod";

const plotlySpecField = z.union([z.string(), z.record(z.any())]).transform((v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    try {
        return JSON.stringify(v);
    } catch (_) {
        return "";
    }
});

export const CombatQuestionSchema = z
    .object({
        topic_category: z.string().optional().nullable(),
        criterion: z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.enum(["A", "B", "C"])),
        text: z.string().min(1),
        expected_answer: z.string().min(1),
        success_criteria: z.string().min(1),
        ideal_explanation: z.string().min(1),
        plotly_spec: plotlySpecField.optional().default(""),
        type: z.literal("input")
    })
    .transform((o) => ({
        ...o,
        topic_category:
            o.topic_category != null && String(o.topic_category).trim() ? String(o.topic_category).trim() : "Math"
    }));

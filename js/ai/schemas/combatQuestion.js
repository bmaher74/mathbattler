import { z } from "zod";

/**
 * Map common Qwen json_schema drift to the shape CombatQuestionSchema expects.
 * Does not invent missing required fields.
 */
export function normalizeCombatQuestionInput(raw) {
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return raw;
    const o = { ...raw };
    if (typeof o.expected_answer === "number" && Number.isFinite(o.expected_answer)) {
        o.expected_answer = String(o.expected_answer);
    }
    // Legacy aliases → svg_spec
    if ((o.svg_spec == null || String(o.svg_spec).trim() === "") && o.visual_spec != null && String(o.visual_spec).trim()) {
        o.svg_spec = o.visual_spec;
    }
    if (o.svg_spec == null) o.svg_spec = "";
    delete o.visual_spec;
    delete o.plotly_spec;

    const specStr = String(o.svg_spec).trim();
    const looksLikeSvg = specStr.length >= 12 && /<svg[\s>]/i.test(specStr);
    if (o.visual_type == null || String(o.visual_type).trim() === "") {
        o.visual_type = looksLikeSvg ? "svg" : "none";
    }
    if (o.visual_type === "none" && looksLikeSvg) o.visual_type = "svg";
    if (String(o.visual_type).toLowerCase() === "none") o.svg_spec = "";

    const critEmpty = o.criterion == null || String(o.criterion).trim() === "";
    if (critEmpty && o.criterion_letter != null) {
        o.criterion = o.criterion_letter;
    }
    if (critEmpty && o.criterionLetter != null) {
        o.criterion = o.criterionLetter;
    }
    delete o.criterion_letter;
    delete o.criterionLetter;
    const textEmpty = o.text == null || String(o.text).trim() === "";
    const blocksEmpty = !Array.isArray(o.text_blocks) || o.text_blocks.length === 0;
    if (textEmpty && blocksEmpty && o.stem != null && typeof o.stem === "object") {
        const st = o.stem;
        if (typeof st.text === "string" && st.text.trim()) o.text = st.text;
        if (Array.isArray(st.text_blocks) && st.text_blocks.length) o.text_blocks = st.text_blocks;
    }
    delete o.stem;
    delete o.difficulty_band;
    delete o.combat_state;
    return o;
}

/** Stem as alternating prose + math so currency `$` and `\\(...\\)` are never ambiguous in one string. */
export const CombatTextBlockSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("prose"), content: z.string() }),
    z.object({ type: z.literal("inline_math"), latex: z.string() })
]);

const combatQuestionBase = z
    .object({
        /** Model scratchpad only; stripped before the player sees the question. */
        _thought_process: z.string().optional().default(""),
        topic_category: z.string().optional().nullable(),
        criterion: z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.enum(["A", "B", "C", "D"])),
        /** Legacy: one string. Prefer `text_blocks` when story mixes US dollars and algebra. */
        text: z.string().optional(),
        text_blocks: z.array(CombatTextBlockSchema).optional(),
        expected_answer: z.string().min(1),
        success_criteria: z.string().min(1),
        ideal_explanation: z.string().min(1),
        visual_type: z.enum(["none", "svg"]),
        /** Raw SVG markup (single-quoted attributes); empty string when visual_type is "none". */
        svg_spec: z.string().optional().default(""),
        type: z.literal("input")
    })
    .superRefine((data, ctx) => {
        const hasText = data.text != null && String(data.text).trim().length > 0;
        const hasBlocks = Array.isArray(data.text_blocks) && data.text_blocks.length > 0;
        if (!hasText && !hasBlocks) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Provide non-empty text or non-empty text_blocks"
            });
        }
        if (hasText && hasBlocks) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Use either text or text_blocks, not both"
            });
        }
        if (data.visual_type === "svg" && !String(data.svg_spec ?? "").trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'visual_type "svg" requires non-empty svg_spec'
            });
        }
    })
    .transform((o) => ({
        ...o,
        topic_category:
            o.topic_category != null && String(o.topic_category).trim() ? String(o.topic_category).trim() : "Math"
    }));

/** Applies {@link normalizeCombatQuestionInput} before parsing (aliases like criterion_letter → criterion). */
export const CombatQuestionSchema = z.preprocess(normalizeCombatQuestionInput, combatQuestionBase);

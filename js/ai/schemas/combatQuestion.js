import { z } from "zod";
import { parsePlotlySpec } from "../plotlyQuestionHeuristics.js";

/** @typedef {{ viewBox: string, elements: unknown[] }} GomSpec */

const GomElementSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("rect"),
        x: z.coerce.number(),
        y: z.coerce.number(),
        w: z.coerce.number(),
        h: z.coerce.number()
    }),
    z.object({
        type: z.literal("polygon"),
        points: z.string().min(1)
    }),
    z.object({
        type: z.literal("line"),
        x1: z.coerce.number(),
        y1: z.coerce.number(),
        x2: z.coerce.number(),
        y2: z.coerce.number()
    }),
    z.object({
        type: z.literal("label"),
        text: z.string(),
        x: z.coerce.number(),
        y: z.coerce.number()
    })
]);

export const GomSpecSchema = z.object({
    viewBox: z.string().min(1),
    elements: z.array(GomElementSchema).min(1)
});

/**
 * Map common Qwen json_schema drift to the shape CombatQuestionSchema expects.
 * Strips legacy svg_spec (raw SVG no longer supported).
 */
export function normalizeCombatQuestionInput(raw) {
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return raw;
    const o = { ...raw };
    if (typeof o.expected_answer === "number" && Number.isFinite(o.expected_answer)) {
        o.expected_answer = String(o.expected_answer);
    }

    if (o.plotly_spec != null && typeof o.plotly_spec === "object") {
        try {
            o.plotly_spec = JSON.stringify(o.plotly_spec);
        } catch {
            o.plotly_spec = "";
        }
    }
    if (o.plotly_spec == null) o.plotly_spec = "";

    /** @type {unknown} */
    let vs = o.visual_spec;
    if (vs != null && typeof vs === "string") {
        const t = vs.trim();
        if (t.startsWith("{")) {
            try {
                vs = JSON.parse(t);
            } catch {
                vs = null;
            }
        } else {
            vs = null;
        }
    }
    if (vs != null && typeof vs === "object" && !Array.isArray(vs)) {
        o.visual_spec = vs;
    } else {
        o.visual_spec = null;
    }

    delete o.svg_spec;

    let vt = o.visual_type == null ? "" : String(o.visual_type).trim().toLowerCase();
    if (vt === "svg") vt = "none";
    if (vt === "geometry_data") vt = "gom";
    o.visual_type = vt || undefined;

    if (!o.visual_type || o.visual_type === "") {
        if (o.visual_spec && typeof o.visual_spec === "object") {
            const spec = /** @type {Record<string, unknown>} */ (o.visual_spec);
            if (typeof spec.viewBox === "string" && Array.isArray(spec.elements)) o.visual_type = "gom";
        }
        if (!o.visual_type && parsePlotlySpec(o.plotly_spec)) o.visual_type = "plotly";
        if (!o.visual_type) o.visual_type = "none";
    }

    if (o.visual_type === "none") {
        o.plotly_spec = "";
        o.visual_spec = null;
    }

    if (o.visual_spec === undefined) o.visual_spec = null;

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
        visual_type: z.enum(["none", "gom", "plotly"]),
        /** Schematic diagram (GOM). Null when visual_type is not gom. */
        visual_spec: GomSpecSchema.nullable(),
        /** Plotly JSON string for charts / bars / data plots. Empty when not plotly. */
        plotly_spec: z.string().optional().default(""),
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
        if (data.visual_type === "gom") {
            if (data.visual_spec == null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'visual_type "gom" requires non-null visual_spec'
                });
            }
            if (String(data.plotly_spec ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'visual_type "gom" requires empty plotly_spec'
                });
            }
        }
        if (data.visual_type === "plotly") {
            if (!parsePlotlySpec(data.plotly_spec)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'visual_type "plotly" requires valid plotly_spec JSON with a non-empty data array'
                });
            }
            if (data.visual_spec != null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'visual_type "plotly" requires visual_spec to be null'
                });
            }
        }
        if (data.visual_type === "none") {
            if (data.visual_spec != null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'visual_type "none" requires visual_spec null'
                });
            }
            if (String(data.plotly_spec ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'visual_type "none" requires empty plotly_spec'
                });
            }
        }
    })
    .transform((o) => ({
        ...o,
        topic_category:
            o.topic_category != null && String(o.topic_category).trim() ? String(o.topic_category).trim() : "Math"
    }));

/** Applies {@link normalizeCombatQuestionInput} before parsing (aliases like criterion_letter → criterion). */
export const CombatQuestionSchema = z.preprocess(normalizeCombatQuestionInput, combatQuestionBase);

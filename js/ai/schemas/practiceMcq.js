import { z } from "zod";
import { parsePlotlySpec } from "../plotlyQuestionHeuristics.js";
import { GomSpecSchema } from "./combatQuestion.js";

const plotlySpecField = z.union([z.string(), z.record(z.any())]).transform((v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    try {
        return JSON.stringify(v);
    } catch (_) {
        return "";
    }
});

/**
 * Normalize practice MCQ payloads (plotly object → string, GOM JSON string → object, infer visual_type).
 */
export function normalizePracticeMcqInput(raw) {
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return raw;
    const o = { ...raw };

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

    let vt = o.visual_type == null ? "" : String(o.visual_type).trim().toLowerCase();
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

    return o;
}

const practiceMcqBase = z
    .object({
        topic_category: z.string().optional().nullable(),
        text: z.string().min(1),
        answer: z.string().min(1),
        ideal_explanation: z.string().min(1),
        visual_type: z.enum(["none", "gom", "plotly"]),
        visual_spec: GomSpecSchema.nullable(),
        plotly_spec: plotlySpecField.optional().default(""),
        type: z.literal("mcq"),
        options: z.array(z.string()).length(4)
    })
    .superRefine((data, ctx) => {
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
    });

export const PracticeMcqSchema = z.preprocess(normalizePracticeMcqInput, practiceMcqBase);

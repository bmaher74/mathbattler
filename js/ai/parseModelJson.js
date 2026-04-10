/**
 * Extract JSON from model message content, parse, and validate with Zod.
 */

import { z } from "zod";

export function extractJsonFromModelText(content) {
    if (content == null) throw new Error("empty model content");
    let s = typeof content === "string" ? content.trim() : JSON.stringify(content);
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) s = fenced[1].trim();
    return s;
}

export function parseJsonLenient(s) {
    try {
        return JSON.parse(s);
    } catch (_) {
        const start = s.indexOf("{");
        const end = s.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return JSON.parse(s.slice(start, end + 1));
        }
        throw _;
    }
}

export function parseJsonStrict(s) {
    return JSON.parse(s);
}

/**
 * @param {import("zod").ZodTypeAny} schema
 * @returns {{ ok: true, data: unknown } | { ok: false, stage: "json"|"schema", error: unknown, issuesText?: string, raw?: unknown }}
 */
export function parseAndValidate(schema, content, { lenient = true } = {}) {
    let extracted;
    try {
        extracted = extractJsonFromModelText(content);
    } catch (e) {
        return { ok: false, stage: "json", error: e, issuesText: String(e && e.message ? e.message : e) };
    }
    let raw;
    try {
        raw = lenient ? parseJsonLenient(extracted) : parseJsonStrict(extracted);
    } catch (e) {
        return { ok: false, stage: "json", error: e, issuesText: String(e && e.message ? e.message : e) };
    }
    const result = schema.safeParse(raw);
    if (result.success) return { ok: true, data: result.data };
    const issuesText = result.error.issues.map((i) => `${i.path.length ? i.path.join(".") : "root"}: ${i.message}`).join("\n");
    return { ok: false, stage: "schema", error: result.error, issuesText, raw };
}

export function formatZodIssuesForRetry(zodError) {
    if (zodError instanceof z.ZodError) {
        return zodError.issues.map((i) => `- ${i.path.length ? i.path.join(".") : "root"}: ${i.message}`).join("\n");
    }
    return String(zodError);
}

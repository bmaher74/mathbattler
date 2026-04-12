/**
 * Extra tests for js/ai/parseModelJson.js (beyond scripts/test-ai-schemas.mjs).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const {
    extractJsonFromModelText,
    parseJsonLenient,
    parseJsonStrict,
    formatZodIssuesForRetry
} = await import(join(ROOT, "js/ai/parseModelJson.js"));

describe("extractJsonFromModelText", () => {
    it("unwraps fenced json blocks", () => {
        assert.equal(extractJsonFromModelText("```json\n{\"a\":1}\n```").trim(), '{"a":1}');
    });

    it("throws on null", () => {
        assert.throws(() => extractJsonFromModelText(null), /empty/);
    });
});

describe("parseJsonLenient", () => {
    it("parses object slice when extra prose wraps braces", () => {
        const obj = parseJsonLenient('prefix {"x":1} suffix');
        assert.deepEqual(obj, { x: 1 });
    });
});

describe("parseJsonStrict", () => {
    it("rejects trailing content", () => {
        assert.throws(() => parseJsonStrict('{"a":1} trailing'));
    });
});

describe("formatZodIssuesForRetry", () => {
    it("formats ZodError as bullet list", () => {
        const err = z.object({ n: z.number() }).safeParse({ n: "bad" });
        assert.equal(err.success, false);
        const text = formatZodIssuesForRetry(err.error);
        assert.match(text, /^- n:/m);
    });

    it("stringifies non-Zod errors", () => {
        assert.equal(formatZodIssuesForRetry("oops"), "oops");
    });
});

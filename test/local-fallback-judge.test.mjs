/**
 * Tests for js/ai/localFallbackJudge.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { localFallbackJudge } = await import(join(ROOT, "js/ai/localFallbackJudge.js"));

describe("localFallbackJudge", () => {
    it("marks correct short answer as correct_no_reasoning for criterion A", () => {
        const r = localFallbackJudge({
            question: { criterion: "A", expected_answer: "42" },
            studentResponse: "42"
        });
        assert.equal(r.band, "correct_no_reasoning");
        assert.equal(r.isCorrect, true);
    });

    it("requires longer response for criterion B when answer matches", () => {
        const r = localFallbackJudge({
            question: { criterion: "B", expected_answer: "42" },
            studentResponse: "42"
        });
        assert.equal(r.isCorrect, true);
        assert.equal(r.band, "correct_no_reasoning");
    });

    it("upgrades to correct_with_reasoning when steps present and long enough", () => {
        const resp =
            "First I isolate x.\nThen I divide both sides.\nTherefore the answer is 42; so I get 42.";
        const r = localFallbackJudge({
            question: { criterion: "A", expected_answer: "42" },
            studentResponse: resp
        });
        assert.equal(r.band, "correct_with_reasoning");
        assert.equal(r.isCorrect, true);
    });

    it("returns partial when wrong but substantial", () => {
        const r = localFallbackJudge({
            question: { criterion: "A", expected_answer: "99" },
            studentResponse: "I tried subtracting and got something around twelve maybe."
        });
        assert.equal(r.band, "partial");
        assert.equal(r.isCorrect, false);
    });

    it("returns incorrect for short wrong answer", () => {
        const r = localFallbackJudge({
            question: { criterion: "A", expected_answer: "0" },
            studentResponse: "no"
        });
        assert.equal(r.band, "incorrect");
    });
});

import test from "node:test";
import assert from "node:assert/strict";
import { getCombatQuestionSystemPrompt } from "../js/ai/prompts/combatQuestionSystem.js";

test("getCombatQuestionSystemPrompt parses and returns a substantial string", () => {
    const s = getCombatQuestionSystemPrompt();
    assert.equal(typeof s, "string");
    assert.ok(s.length > 500, "prompt should be large");
    assert.match(s, /inline_math/);
    assert.match(s, /STRICT OUTPUT SCHEMA/);
});

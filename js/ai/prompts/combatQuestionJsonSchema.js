/**
 * OpenAI-compatible JSON Schema for DashScope response_format json_schema (combat question).
 * Keep in sync with CombatQuestionSchema (Zod) and scripts/combat-question-json-schema.json.
 *
 * Property order matches the prompt: _thought_process first, then student-facing fields.
 */

/** @type {Record<string, unknown>} */
export const COMBAT_QUESTION_JSON_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        _thought_process: { type: "string" },
        topic_category: { type: "string" },
        criterion: { type: "string" },
        text: { type: "string" },
        text_blocks: {
            type: "array",
            minItems: 1,
            items: {
                oneOf: [
                    {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            type: { const: "prose" },
                            content: { type: "string" }
                        },
                        required: ["type", "content"]
                    },
                    {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            type: { const: "inline_math" },
                            latex: { type: "string" }
                        },
                        required: ["type", "latex"]
                    }
                ]
            }
        },
        expected_answer: { type: "string" },
        success_criteria: { type: "string" },
        ideal_explanation: { type: "string" },
        visual_type: { type: "string", enum: ["none", "svg"] },
        svg_spec: { type: "string" },
        type: { type: "string", enum: ["input"] }
    },
    required: [
        "_thought_process",
        "topic_category",
        "criterion",
        "expected_answer",
        "success_criteria",
        "ideal_explanation",
        "visual_type",
        "svg_spec",
        "type"
    ],
    allOf: [
        {
            anyOf: [{ required: ["text"] }, { required: ["text_blocks"] }]
        }
    ]
};

/** DashScope / OpenAI-compatible wrapper for chat completions body.response_format */
export function combatQuestionJsonSchemaResponseFormat() {
    return {
        type: "json_schema",
        json_schema: {
            name: "CombatQuestion",
            strict: true,
            schema: COMBAT_QUESTION_JSON_SCHEMA
        }
    };
}

import { parseAndValidate } from "./parseModelJson.js";
import { JudgeResultSchema } from "./schemas/index.js";
import { finalizeJudgeResult } from "./finalizeJudgeResult.js";
import { LLM_NO_MARKDOWN_IN_STRINGS } from "./prompts/contract.js";
import { buildJudgePrompt } from "./prompts/buildJudgePrompt.js";
import { callGenerateCombatQuestionWithBackoff } from "./gemini.js";

/**
 * @param {object} deps
 * @param {object} deps.question
 * @param {string} deps.studentResponse
 * @param {string} deps.difficultyLabel
 * @param {() => boolean} deps.canUseSecureAiBridge
 * @param {() => { dsModel: string }} deps.getConfiguredAiKeys
 * @param {(label: string, prompt: string) => void} [deps.debugLogAiPrompt]
 */
export async function runDashScopeJudge(deps) {
    const { question, studentResponse, difficultyLabel, canUseSecureAiBridge, getConfiguredAiKeys, debugLogAiPrompt } =
        deps;
    if (typeof canUseSecureAiBridge !== "function" || !canUseSecureAiBridge()) {
        throw new Error("Secure AI bridge unavailable (Firebase Auth required)");
    }
    const { dsModel } = getConfiguredAiKeys();
    const systemMsg = {
        role: "system",
        content:
            "You output exactly one valid JSON object and nothing else. No markdown, no code fences, no commentary. Use double quotes for JSON strings. Escape any newlines inside strings with \\n and escape quotes inside strings. " +
            LLM_NO_MARKDOWN_IN_STRINGS
    };
    const userContent = buildJudgePrompt({ question, studentResponse, difficultyLabel });
    if (typeof debugLogAiPrompt === "function") debugLogAiPrompt("dashscope.judge", userContent);
    const backoff = { min429DelayMs: 3500, maxDelayMs: 20000, initialDelayMs: 900 };
    const doCall = async (extraUserNudge) => {
        const payload = {
            model: dsModel,
            messages: [systemMsg, { role: "user", content: userContent + (extraUserNudge || "") }],
            response_format: { type: "json_object" },
            temperature: 0.0,
            max_tokens: 750
        };
        const data = await callGenerateCombatQuestionWithBackoff(payload, backoff);
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
        return data?.choices?.[0]?.message?.content;
    };
    let content = await doCall("");
    let jv = parseAndValidate(JudgeResultSchema, content, { lenient: true });
    if (!jv.ok) {
        content = await doCall(
            "\n\nCRITICAL: Your previous output failed schema validation.\n" +
                jv.issuesText +
                "\n\nOutput ONLY one JSON object. Escape newlines in strings as \\n."
        );
        jv = parseAndValidate(JudgeResultSchema, content, { lenient: true });
    }
    if (!jv.ok) throw new Error("judge schema: " + jv.issuesText);
    return finalizeJudgeResult(jv.data);
}

// Compatibility wrapper: secure combat LLM (`./ai/gemini.js`) + legacy `llm.js` re-exports.
export {
    callGenerateCombatQuestion,
    callGenerateCombatQuestionWithBackoff,
    callLlmProxy,
    callLlmProxyWithBackoff
} from "./ai/gemini.js";
export * from "./llm.js";

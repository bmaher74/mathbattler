/**
 * Optional overrides for legacy tooling (e.g. validate-llm). Combat MCQs do not use a browser-side
 * DashScope key — they call the generateCombatQuestion HTTPS Callable after Firebase Auth.
 * See ai-config.sample.js for field meanings.
 */
if (typeof window !== "undefined") {
    if (typeof window.__dashscope_api_key === "undefined") window.__dashscope_api_key = "";
    if (typeof window.__dashscope_base_url === "undefined") window.__dashscope_base_url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    if (typeof window.__dashscope_model === "undefined") window.__dashscope_model = "qwen-flash";
    if (typeof window.__dashscope_chat_completions_url === "undefined") window.__dashscope_chat_completions_url = "";
}

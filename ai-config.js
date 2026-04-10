/**
 * AI keys for Math Battler (browser + validate-llm). See ai-config.sample.js.
 * Live questions use Alibaba DashScope only (Gemini / AI Studio is not wired in — unusable in HK).
 * Do not commit real keys to a public repo.
 */
// Defaults only. For local dev, prefer `/runtime-config.js` served by `npm run serve`,
// which loads `.env` and exposes it as window.__dashscope_* values.
if (typeof window !== "undefined") {
    if (typeof window.__dashscope_api_key === "undefined") window.__dashscope_api_key = "";
    if (typeof window.__dashscope_base_url === "undefined") window.__dashscope_base_url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    if (typeof window.__dashscope_model === "undefined") window.__dashscope_model = "qwen-flash";
    if (typeof window.__dashscope_chat_completions_url === "undefined") window.__dashscope_chat_completions_url = "";
}

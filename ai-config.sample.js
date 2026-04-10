/**
 * Math Battler — optional live AI (browser)
 *
 * Copy to `ai-config.js` and fill in. Add `ai-config.js` to .gitignore if the repo is public.
 * This project uses Alibaba DashScope (Qwen) only. Google Gemini is not integrated (AI Studio is
 * unavailable in Hong Kong and similar regions).
 *
 * ALIBABA DASHSCOPE
 * - Console: https://dashscope.console.aliyun.com/
 * - Default base: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
 * - Browser CORS: if "Failed to fetch", use a same-origin proxy and set __dashscope_chat_completions_url.
 *
 * Without __dashscope_api_key, the game uses the built-in offline question pool.
 */
window.__dashscope_api_key = "";
window.__dashscope_base_url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
window.__dashscope_model = "qwen-flash";
window.__dashscope_chat_completions_url = "";

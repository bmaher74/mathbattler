/**
 * All DashScope traffic goes through the `generateCombatQuestion` HTTPS Callable (server-side key).
 * Callable accepts any OpenAI-compatible chat payload (model, messages, temperature, max_tokens, response_format).
 * Uses the same Firebase JS CDN version as main.js.
 */
import { getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

const FUNCTIONS_REGION = "us-central1";

let _callable = null;
function getGenerateCombatQuestionCallable() {
    if (!_callable) {
        _callable = httpsCallable(getFunctions(getApp(), FUNCTIONS_REGION), "generateCombatQuestion");
    }
    return _callable;
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {object} payload OpenAI-compatible body fields: model, messages, temperature?, max_tokens?, response_format?
 * @param {{ min429DelayMs?: number, maxDelayMs?: number, initialDelayMs?: number }} [backoffOpts]
 * @returns {Promise<object>} Alibaba-compatible chat completions JSON
 */
export async function callGenerateCombatQuestionWithBackoff(payload, backoffOpts = {}) {
    const min429 = backoffOpts.min429DelayMs != null ? backoffOpts.min429DelayMs : 3500;
    const maxDelay = backoffOpts.maxDelayMs != null ? backoffOpts.maxDelayMs : 22000;
    let delay = backoffOpts.initialDelayMs != null ? backoffOpts.initialDelayMs : 1000;
    const retries = 4;
    const fn = getGenerateCombatQuestionCallable();
    let lastErr;
    for (let i = 0; i < retries; i++) {
        try {
            const result = await fn(payload);
            return result.data;
        } catch (err) {
            lastErr = err;
            const code = err && err.code ? String(err.code) : "";
            const msg = err && err.message ? String(err.message) : String(err);
            const is429 =
                code.includes("resource-exhausted") ||
                /(^|\s)429(\s|$)/.test(msg) ||
                /rate|too many|quota/i.test(msg);
            const is5xx = code === "functions/internal" && /50\d/.test(msg);
            if ((is429 || is5xx) && i < retries - 1) {
                const wait = Math.max(delay, is429 ? min429 : 0);
                await sleep(wait);
                delay = Math.min(delay * 2, maxDelay);
                continue;
            }
            throw err;
        }
    }
    throw lastErr || new Error("generateCombatQuestion failed");
}

/** Single attempt (e.g. smoke ping with outer timeout). */
export async function callGenerateCombatQuestion(payload) {
    const fn = getGenerateCombatQuestionCallable();
    const result = await fn(payload);
    return result.data;
}

/** Alias: same callable, any LLM use case (judge, practice, bosses, scan, …). */
export const callLlmProxyWithBackoff = callGenerateCombatQuestionWithBackoff;
export const callLlmProxy = callGenerateCombatQuestion;

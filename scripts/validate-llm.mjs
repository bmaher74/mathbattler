#!/usr/bin/env node
/**
 * Validate Alibaba DashScope LLM flow used by Math Battler (mirrors index.html).
 *
 * Usage:
 *   node scripts/validate-llm.mjs
 *   node scripts/validate-llm.mjs --config ./ai-config.js
 *   node scripts/validate-llm.mjs --smoke
 *   node scripts/validate-llm.mjs --question
 *
 * If a `.env` file exists at the repo root, it is loaded first (KEY=value lines; does not override
 * variables already set in the shell).
 *
 * Env vars override values from --config when set and non-empty.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Load repo-root `.env` into `process.env` (same rules as dotenv: never override existing env). */
function loadRootDotEnv() {
    const p = join(ROOT, ".env");
    if (!existsSync(p)) return;
    const text = readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const m = t.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!m) continue;
        const key = m[1];
        if (process.env[key] !== undefined) continue;
        let v = m[2].trim();
        if (
            (v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))
        ) {
            v = v.slice(1, -1);
        }
        process.env[key] = v;
    }
}

function parseArgs(argv) {
    const out = { smoke: true, question: false, config: null, help: false };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--help" || a === "-h") out.help = true;
        else if (a === "--smoke") {
            out.smoke = true;
            out.question = false;
        } else if (a === "--question") {
            out.question = true;
            out.smoke = false;
        } else if (a === "--config" && argv[i + 1]) {
            out.config = resolve(argv[++i]);
        } else if (a === "--both") {
            out.smoke = true;
            out.question = true;
        }
    }
    return out;
}

function loadConfigFile(absPath) {
    if (!existsSync(absPath)) return null;
    const src = readFileSync(absPath, "utf8");
    const window = {};
    const ctx = vm.createContext({ window, console });
    try {
        vm.runInContext(src, ctx, { filename: absPath, timeout: 2000 });
    } catch (e) {
        throw new Error(`Failed to execute config file ${absPath}: ${e.message}`);
    }
    return window;
}

function readConfig(argvConfig) {
    const path = argvConfig || join(ROOT, "ai-config.js");
    const w = existsSync(path) ? loadConfigFile(path) : {};
    let dsKey = String(w.__dashscope_api_key ?? "").trim();
    let dsBase =
        String(w.__dashscope_base_url ?? "").trim() ||
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    let dsModel = String(w.__dashscope_model ?? "").trim() || "qwen-flash";
    let dsChatUrl = String(w.__dashscope_chat_completions_url ?? "").trim();

    if (process.env.DASHSCOPE_API_KEY?.trim()) dsKey = process.env.DASHSCOPE_API_KEY.trim();
    if (process.env.DASHSCOPE_BASE_URL?.trim()) dsBase = process.env.DASHSCOPE_BASE_URL.trim();
    if (process.env.DASHSCOPE_MODEL?.trim()) dsModel = process.env.DASHSCOPE_MODEL.trim();
    if (process.env.DASHSCOPE_CHAT_COMPLETIONS_URL?.trim()) {
        dsChatUrl = process.env.DASHSCOPE_CHAT_COMPLETIONS_URL.trim();
    }
    return {
        dsKey,
        dsBase,
        dsModel,
        dsChatUrl,
        configPath: existsSync(path) ? path : null
    };
}

function dashscopeChatUrl(cfg) {
    if (cfg.dsChatUrl) return cfg.dsChatUrl;
    return cfg.dsBase.replace(/\/$/, "") + "/chat/completions";
}

function parseModelJsonContent(content) {
    if (content == null) throw new Error("empty model content");
    let s = typeof content === "string" ? content.trim() : JSON.stringify(content);
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) s = fenced[1].trim();
    return JSON.parse(s);
}

function validateQuestionPayload(q) {
    if (!q || typeof q !== "object") throw new Error("invalid question");
    const need = ["text", "answer", "ideal_explanation", "type", "options"];
    for (const k of need) {
        if (q[k] == null || q[k] === "") throw new Error("missing " + k);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error("options must be exactly 4 strings");
    for (let i = 0; i < q.options.length; i++) {
        if (q.options[i] == null || String(q.options[i]).trim() === "") throw new Error("empty option");
    }
    if (q.plotly_spec != null && typeof q.plotly_spec === "object") {
        try {
            q.plotly_spec = JSON.stringify(q.plotly_spec);
        } catch (_) {
            q.plotly_spec = "";
        }
    }
    if (q.plotly_spec == null) q.plotly_spec = "";
    if (q.topic_category == null) q.topic_category = "Math";
}

function assertSmokePingJson(parsed) {
    if (parsed && (parsed.ping === "ok" || parsed.ok === true)) return;
    throw new Error("Smoke marker missing");
}

async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms));
}

async function fetchWithBackoff(url, options, retries = 5, backoffOpts = {}) {
    const min429 = backoffOpts.min429DelayMs ?? 5000;
    const maxDelay = backoffOpts.maxDelayMs ?? 20000;
    let delay = backoffOpts.initialDelayMs ?? 1000;
    for (let i = 0; i < retries; i++) {
        let response;
        try {
            response = await fetch(url, options);
        } catch (err) {
            if (i === retries - 1) throw err;
            await sleep(delay);
            delay = Math.min(delay * 2, maxDelay);
            continue;
        }
        if (response.ok) return response;
        if (response.status === 429 && i < retries - 1) {
            const raHeader = response.headers.get("Retry-After");
            let raMs = 0;
            if (raHeader) {
                const n = parseInt(raHeader, 10);
                if (!Number.isNaN(n)) raMs = Math.min(Math.max(0, n) * 1000, 120000);
            }
            const wait = Math.max(delay, min429, raMs);
            await sleep(wait);
            delay = Math.min(delay * 2, maxDelay);
            continue;
        }
        if (response.status >= 500 && i < retries - 1) {
            await sleep(delay);
            delay = Math.min(delay * 2, maxDelay);
            continue;
        }
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 240)}`);
    }
}

async function smokeDashScopeCfg(cfg) {
    const url = dashscopeChatUrl(cfg);
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.dsKey}`
    };
    const bodyBase = {
        model: cfg.dsModel,
        messages: [{ role: "user", content: 'Output only JSON: {"ping":"ok"}' }],
        max_tokens: 48
    };
    const attemptOnce = async () => {
        let r = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ ...bodyBase, response_format: { type: "json_object" } })
        });
        if (r.status === 400) {
            r = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(bodyBase)
            });
        }
        return r;
    };
    let res = await attemptOnce();
    if (res.status === 429) {
        await sleep(6000);
        res = await attemptOnce();
    }
    if (res.status === 429) {
        await sleep(12000);
        res = await attemptOnce();
    }
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`DashScope HTTP ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const content = data?.choices?.[0]?.message?.content;
    if (content == null || String(content).trim() === "") throw new Error("DashScope: empty content");
    assertSmokePingJson(parseModelJsonContent(content));
}

const DASHSCOPE_MCQ_USER_SUFFIX =
    "\n\nHard requirements (Qwen-compatible JSON):\n" +
    '- type must be the string "mcq".\n' +
    "- options: exactly 4 non-empty strings, plausible distractors.\n" +
    "- answer: must exactly match one element of options (same characters and LaTeX).\n" +
    '- plotly_spec: string only — "" OR one JSON-encoded Plotly spec with escaped inner quotes. If "", never mention graphs/visuals in text or ideal_explanation. If not "", include numeric trace data (e.g. scatter x/y arrays).\n' +
    '- REQUIRED: If text or ideal_explanation mentions marbles, apples, cookies, toys, bag/box/jar, gave/take away/started with/how many left/in all, plotly_spec MUST NOT be "". Use number-line scatter (y all 0) or bar chart.\n' +
    '- Prefer non-empty plotly_spec when the math has a natural picture (equations, lines, rates, two quantities); minimal scatter or bar is enough. Use "" only when a graph would not help.\n' +
    "- ideal_explanation: 3–8 short sentences, ~age-10 reading level, friendly plain words, LaTeX for math; ~150 words max.\n" +
    '\nReturn one JSON object with exactly these keys: topic_category, text, answer, ideal_explanation, plotly_spec, type, options. No markdown, no code fences.';

async function questionDashScope(cfg) {
    const url = dashscopeChatUrl(cfg);
    const modelId = cfg.dsModel;
    const basePrompt = `[SEED: ${Date.now()}] Generate a unique introductory Algebra math question. Return JSON ONLY. Use LaTeX in the question text. ideal_explanation: explain like to a smart 10-year-old. Do not mention charts/visuals unless plotly_spec is a non-empty valid Plotly JSON string with numeric plot data. If you use marbles, bags, apples, or similar addition/subtraction stories, plotly_spec MUST be non-empty (number line or bars).`;
    const userContent = basePrompt + DASHSCOPE_MCQ_USER_SUFFIX;
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.dsKey}`
    };
    const messages = [
        {
            role: "system",
            content:
                "You output exactly one valid JSON object and nothing else. No markdown code fences, no commentary. Use double quotes for JSON strings. For quantity word problems (marbles, apples, bags), always include non-empty plotly_spec."
        },
        { role: "user", content: userContent }
    ];
    const bodyWithJson = JSON.stringify({
        model: modelId,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.72,
        max_tokens: 2800
    });
    const bodyPlain = JSON.stringify({
        model: modelId,
        messages,
        temperature: 0.72,
        max_tokens: 2800
    });
    const backoff = { min429DelayMs: 8000, maxDelayMs: 45000, initialDelayMs: 1500 };
    let res;
    try {
        res = await fetchWithBackoff(url, { method: "POST", headers, body: bodyWithJson }, 8, backoff);
    } catch (e) {
        const m = e && e.message ? String(e.message) : "";
        if (m.includes("400")) {
            res = await fetchWithBackoff(url, { method: "POST", headers, body: bodyPlain }, 8, backoff);
        } else {
            throw e;
        }
    }
    const data = await res.json();
    if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const content = data?.choices?.[0]?.message?.content;
    const parsed = parseModelJsonContent(content);
    validateQuestionPayload(parsed);
    return { modelId, topic: parsed.topic_category, textPreview: String(parsed.text).slice(0, 80) };
}

function printHelp() {
    console.log(`Math Battler — LLM API validator

Reads ai-config.js from the repo root unless --config is set.
Loads repo-root .env if present (does not override existing shell env).
Environment variables override file values: DASHSCOPE_API_KEY, DASHSCOPE_BASE_URL,
DASHSCOPE_MODEL, DASHSCOPE_CHAT_COMPLETIONS_URL

  --smoke      Tiny JSON ping (default if neither mode flag is passed alone)
  --question   Full MCQ generation + same validation as the game
  --both       Run smoke then question
  --config PATH

Examples:
  npm run validate-llm
  npm run validate-llm -- --question
  npm run validate-llm -- --config ./ai-config.js --both
`);
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) {
        printHelp();
        process.exit(0);
    }

    loadRootDotEnv();

    const cfg = readConfig(args.config);
    if (cfg.configPath) console.log("Config:", cfg.configPath);
    else console.log("Config: (no ai-config.js found; using env only)");

    if (!cfg.dsKey) {
        console.error("FAIL: No DashScope API key. Set __dashscope_api_key in ai-config.js or DASHSCOPE_API_KEY.");
        process.exit(1);
    }

    const runSmoke = args.smoke;
    const runQuestion = args.question;

    console.log("Provider: Alibaba DashScope");
    console.log("Chat URL:", dashscopeChatUrl(cfg));
    console.log("Model:", cfg.dsModel);

    try {
        if (runSmoke) {
            await smokeDashScopeCfg(cfg);
            console.log("PASS: DashScope smoke OK");
        }

        if (runQuestion) {
            const r = await questionDashScope(cfg);
            console.log("PASS: DashScope question OK");
            console.log("  Model:", r.modelId);
            console.log("  Topic:", r.topic);
            console.log("  Text:", r.textPreview + (r.textPreview.length >= 80 ? "…" : ""));
        }
    } catch (e) {
        let msg = e && e.message ? e.message : String(e);
        if (e?.cause) msg += ` — ${e.cause.message || e.cause}`;
        console.error("FAIL:", msg);
        if (e?.stack && process.env.DEBUG) console.error(e.stack);
        process.exit(1);
    }
}

main();

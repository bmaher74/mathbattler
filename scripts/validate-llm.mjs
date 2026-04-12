#!/usr/bin/env node
/**
 * Validate Alibaba DashScope LLM flows used by Math Battler.
 *
 * Modes:
 *   --smoke              Tiny JSON ping (default when no other mode is selected)
 *   --question / --mcq   Legacy MCQ generation + PracticeMcqSchema + finalizePracticeMcq
 *   Combat lab: --system-file + --user-file, or --prompt-file (see --help).
 *
 * Repo-root `.env` is merged into `process.env` via `scripts/loadRootDotEnv.mjs` (same rules as `npm run serve`).
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { parseAndValidate } from "../js/ai/parseModelJson.js";
import { SmokePingSchema, PracticeMcqSchema, CombatQuestionSchema } from "../js/ai/schemas/index.js";
import { finalizePracticeMcq } from "../js/ai/finalizePracticeMcq.js";
import { finalizeCombatQuestion } from "../js/ai/finalizeCombatQuestion.js";
import { parsePlotlySpec, combatQuestionRequiresSvgDiagram } from "../js/ai/plotlyQuestionHeuristics.js";
import { hasRenderableCombatSvg } from "../js/ai/combatVisualSvg.js";
import { combatQuestionJsonSchemaResponseFormat } from "../js/ai/prompts/combatQuestionJsonSchema.js";
import {
    buildCombatQuestionUserPrompt,
    enemyNameForMapLevel,
    normalizeSkillProfile
} from "../js/ai/prompts/combatQuestionPedagogy.js";
import { getCombatQuestionSystemPrompt } from "../js/ai/prompts/combatQuestionSystem.js";
import { loadRootDotEnvIntoProcessEnv } from "./loadRootDotEnv.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** @typedef {"full" | "object" | "none"} JsonModeCli */

/** Map CLI/env tokens to jsonMode; null if unrecognized. */
function normalizeJsonModeToken(v) {
    const t = String(v).trim().toLowerCase();
    if (t === "full" || t === "schema" || t === "default") return "full";
    if (t === "object" || t === "json_object") return "object";
    if (t === "none" || t === "plain") return "none";
    return null;
}

function parseArgs(argv) {
    const out = {
        smoke: true,
        mcq: false,
        combat: false,
        config: null,
        help: false,
        marbles: false,
        requirePlot: false,
        printJson: false,
        systemFile: null,
        userFile: null,
        /** Single file with ---SYSTEM--- … ---USER--- sections */
        promptFile: null,
        jsonSchema: null,
        /** full = json_schema then json_object then plain; object = json_object then plain; none = plain only */
        jsonMode: /** @type {JsonModeCli} */ ("full"),
        jsonModeInvalid: /** @type {string | null} */ (null),
        jsonModeEnvInvalid: /** @type {string | null} */ (null),
        dryRun: false,
        saveRaw: null,
        temperature: null,
        maxTokens: null,
        /** Build user message from Firestore profile (same pedagogy as the game). */
        combatLiveUser: /** @type {string | null} */ (null),
        combatMapLevel: /** @type {number | null} */ (null),
        combatTurnIndex: /** @type {number | null} */ (null),
        combatEasier: false
    };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--help" || a === "-h") out.help = true;
        else if (a === "--smoke") {
            out.smoke = true;
            out.mcq = false;
            out.combat = false;
        } else if (a === "--question" || a === "--mcq") {
            out.mcq = true;
            out.smoke = false;
            out.combat = false;
        } else if (a === "--combat") {
            out.combat = true;
            out.smoke = false;
            out.mcq = false;
        } else if (a === "--config" && argv[i + 1]) {
            out.config = resolve(argv[++i]);
        } else if (a === "--both") {
            out.smoke = true;
            out.mcq = true;
            out.combat = false;
        } else if (a === "--marbles") {
            out.marbles = true;
        } else if (a === "--require-plot") {
            out.requirePlot = true;
        } else if (a === "--print-json") {
            out.printJson = true;
        } else if (a === "--system-file" && argv[i + 1]) {
            out.systemFile = argv[++i];
        } else if (a === "--user-file" && argv[i + 1]) {
            out.userFile = argv[++i];
        } else if (a === "--json-schema" && argv[i + 1]) {
            out.jsonSchema = resolve(argv[++i]);
        } else if (a === "--prompt-file" && argv[i + 1]) {
            out.promptFile = argv[++i];
        } else if (a === "--json-mode" && argv[i + 1]) {
            const raw = argv[++i];
            const m = normalizeJsonModeToken(raw);
            if (m) out.jsonMode = m;
            else out.jsonModeInvalid = String(raw).trim();
        } else if (a === "--dry-run") {
            out.dryRun = true;
        } else if (a === "--save-raw" && argv[i + 1]) {
            out.saveRaw = resolve(argv[++i]);
        } else if (a === "--temperature" && argv[i + 1]) {
            out.temperature = parseFloat(argv[++i]);
        } else if (a === "--max-tokens" && argv[i + 1]) {
            out.maxTokens = parseInt(argv[++i], 10);
        } else if (a === "--combat-live-user" && argv[i + 1]) {
            out.combatLiveUser = String(argv[++i]).trim();
        } else if (a === "--combat-map-level" && argv[i + 1]) {
            out.combatMapLevel = parseInt(argv[++i], 10);
        } else if (a === "--combat-turn-index" && argv[i + 1]) {
            out.combatTurnIndex = parseInt(argv[++i], 10);
        } else if (a === "--combat-easier") {
            out.combatEasier = true;
        }
    }
    if (out.systemFile && out.userFile) {
        out.combat = true;
        out.mcq = false;
        if (!argv.includes("--smoke")) out.smoke = false;
    }
    if (out.promptFile) {
        out.combat = true;
        out.mcq = false;
        if (!argv.includes("--smoke")) out.smoke = false;
    }
    if (out.combatLiveUser) {
        out.combat = true;
        out.mcq = false;
        if (!argv.includes("--smoke")) out.smoke = false;
    }
    if (process.env.VALIDATE_LLM_JSON_MODE != null && process.env.VALIDATE_LLM_JSON_MODE.trim()) {
        const raw = process.env.VALIDATE_LLM_JSON_MODE.trim();
        const m = normalizeJsonModeToken(raw);
        if (m) out.jsonMode = m;
        else out.jsonModeEnvInvalid = raw;
    }
    if (process.env.VALIDATE_LLM_TEMPERATURE != null && process.env.VALIDATE_LLM_TEMPERATURE.trim()) {
        const n = parseFloat(process.env.VALIDATE_LLM_TEMPERATURE);
        if (Number.isFinite(n)) out.temperature = n;
    }
    if (process.env.VALIDATE_LLM_MAX_TOKENS != null && process.env.VALIDATE_LLM_MAX_TOKENS.trim()) {
        const n = parseInt(process.env.VALIDATE_LLM_MAX_TOKENS, 10);
        if (Number.isFinite(n)) out.maxTokens = n;
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

async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms));
}

function getFetchTimeoutSignal(backoffOpts, existingSignal) {
    if (existingSignal) return existingSignal;
    const raw = process.env.VALIDATE_LLM_FETCH_TIMEOUT_MS;
    const ms = backoffOpts.fetchTimeoutMs ?? (raw != null && String(raw).trim() ? parseInt(String(raw).trim(), 10) : 120000);
    if (!Number.isFinite(ms) || ms <= 0) return undefined;
    try {
        return AbortSignal.timeout(ms);
    } catch (_) {
        return undefined;
    }
}

async function fetchWithBackoff(url, options, retries = 5, backoffOpts = {}) {
    const min429 = backoffOpts.min429DelayMs ?? 5000;
    const maxDelay = backoffOpts.maxDelayMs ?? 20000;
    let delay = backoffOpts.initialDelayMs ?? 1000;
    for (let i = 0; i < retries; i++) {
        let response;
        try {
            const signal = getFetchTimeoutSignal(backoffOpts, options.signal);
            response = await fetch(url, signal ? { ...options, signal } : options);
        } catch (err) {
            const name = err && err.name ? String(err.name) : "";
            if (name === "AbortError" || name === "TimeoutError") {
                const ms =
                    backoffOpts.fetchTimeoutMs ??
                    (process.env.VALIDATE_LLM_FETCH_TIMEOUT_MS?.trim()
                        ? parseInt(process.env.VALIDATE_LLM_FETCH_TIMEOUT_MS, 10)
                        : 120000);
                throw new Error(`Request timed out or aborted (timeout ms=${ms}). ${err.message || ""}`);
            }
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

/** Read file path or stdin when path is "-". */
function readText(path) {
    if (path === "-") {
        try {
            return readFileSync(0, "utf8");
        } catch (_) {
            throw new Error("Failed to read stdin (use - for --prompt-file, --system-file, or --user-file)");
        }
    }
    const abs = resolve(path);
    if (!existsSync(abs)) throw new Error(`File not found: ${abs}`);
    return readFileSync(abs, "utf8");
}

const PROMPT_FILE_SYSTEM_MARKER = "---SYSTEM---";
const PROMPT_FILE_USER_MARKER = "---USER---";

/**
 * Split a combined combat prompt file into system and user strings.
 * Markers must appear in order: ---SYSTEM--- then ---USER--- (first occurrence of each).
 * Path may be "-" for stdin.
 */
function splitPromptFile(path) {
    const raw = readText(path);
    const label = path === "-" ? "(stdin)" : resolve(path);
    const si = raw.indexOf(PROMPT_FILE_SYSTEM_MARKER);
    const ui = raw.indexOf(PROMPT_FILE_USER_MARKER);
    if (si === -1) {
        throw new Error(`${label}: missing ${PROMPT_FILE_SYSTEM_MARKER} marker`);
    }
    if (ui === -1) {
        throw new Error(`${label}: missing ${PROMPT_FILE_USER_MARKER} marker`);
    }
    if (ui <= si) {
        throw new Error(`${label}: ${PROMPT_FILE_USER_MARKER} must appear after ${PROMPT_FILE_SYSTEM_MARKER}`);
    }
    let p = si + PROMPT_FILE_SYSTEM_MARKER.length;
    if (raw[p] === "\r") p++;
    if (raw[p] === "\n") p++;
    const systemText = raw.slice(p, ui).trimEnd();
    p = ui + PROMPT_FILE_USER_MARKER.length;
    if (raw[p] === "\r") p++;
    if (raw[p] === "\n") p++;
    const userText = raw.slice(p).trimEnd();
    if (!systemText) {
        throw new Error(`${label}: no system prompt text after ${PROMPT_FILE_SYSTEM_MARKER}`);
    }
    if (!userText) {
        throw new Error(`${label}: no user prompt text after ${PROMPT_FILE_USER_MARKER}`);
    }
    return { systemText, userText };
}

/**
 * Build DashScope response_format retry chain for combat lab (matches app behavior for "full").
 * @param {ReturnType<typeof parseArgs>} args
 */
function buildCombatFormatExtras(args) {
    const mode = args.jsonMode;
    /** @type {Array<Record<string, unknown>>} */
    const extras = [];
    if (mode === "full") {
        if (args.jsonSchema) {
            if (!existsSync(args.jsonSchema)) {
                throw new Error(`--json-schema file not found: ${args.jsonSchema}`);
            }
            const rf = loadJsonSchemaForApi(args.jsonSchema);
            extras.push({ response_format: rf });
        } else {
            extras.push({ response_format: combatQuestionJsonSchemaResponseFormat() });
        }
        extras.push({ response_format: { type: "json_object" } });
        extras.push({});
    } else if (mode === "object") {
        if (args.jsonSchema) {
            console.warn(
                "WARN: --json-schema is ignored when --json-mode is object (json_schema step is skipped)."
            );
        }
        extras.push({ response_format: { type: "json_object" } });
        extras.push({});
    } else {
        if (args.jsonSchema) {
            console.warn(
                "WARN: --json-schema is ignored when --json-mode is none (no structured response_format)."
            );
        }
        extras.push({});
    }
    return extras;
}

/** Load JSON schema file for response_format: either full OpenAI json_schema wrapper or a JSON Schema object. */
function loadJsonSchemaForApi(absPath) {
    const raw = readFileSync(absPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.schema != null && (parsed.name != null || parsed.strict != null)) {
        return { type: "json_schema", json_schema: parsed };
    }
    return {
        type: "json_schema",
        json_schema: {
            name: "CombatQuestion",
            strict: true,
            schema: parsed
        }
    };
}

/**
 * POST chat completions; on 400, retry with next response_format in chain (mirrors app resilience).
 * Returns { content, responseFormatLabel }.
 */
/** Remediation appended on retry; aligned with js/main.js fetchQuestionViaDashScope. */
function combatSchemaRetryUserSuffix(issuesText) {
    return (
        "\n\nYour previous output failed validation. Output one corrected JSON object only.\n" +
        String(issuesText || "Unknown validation issues") +
        "\n\nReminder: include every required key in order: _thought_process, topic_category, criterion, " +
        "text OR text_blocks (top-level — do not nest the stem under \"stem\"), expected_answer, success_criteria, " +
        "ideal_explanation, visual_type, svg_spec, type \"input\". " +
        'Use the key name "criterion" (A/B/C/D), not criterion_letter.'
    );
}

async function dashScopeChatWithFormatFallback(cfg, base, formatExtras, backoffOpts) {
    const url = dashscopeChatUrl(cfg);
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.dsKey}`
    };
    let lastErr = null;
    const maxRetries = backoffOpts.maxHttpRetries ?? 4;
    for (let i = 0; i < formatExtras.length; i++) {
        const body = { ...base, ...formatExtras[i] };
        const label = formatExtras[i].response_format?.type === "json_schema" ? "json_schema" : formatExtras[i].response_format?.type === "json_object" ? "json_object" : "plain";
        try {
            console.log(`→ DashScope request (response_format: ${label})…`);
            const res = await fetchWithBackoff(
                url,
                { method: "POST", headers, body: JSON.stringify(body) },
                maxRetries,
                backoffOpts
            );
            const data = await res.json();
            if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
            const content = data?.choices?.[0]?.message?.content;
            return { content, responseFormatLabel: label };
        } catch (e) {
            lastErr = e;
            const msg = e && e.message ? String(e.message) : "";
            if (msg.includes("timed out") || msg.includes("AbortError")) throw e;
            if (msg.includes("400") && i < formatExtras.length - 1) {
                console.warn(`WARN: ${label} rejected (400), trying next response_format…`);
                continue;
            }
            throw e;
        }
    }
    throw lastErr || new Error("DashScope: all response_format attempts failed");
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
    const smokePv = parseAndValidate(SmokePingSchema, content, { lenient: true });
    if (!smokePv.ok) throw new Error(smokePv.issuesText || "Smoke schema validation failed");
}

const DASHSCOPE_MCQ_USER_SUFFIX =
    "\n\nHard requirements (Qwen-compatible JSON):\n" +
    '- type must be the string "mcq".\n' +
    "- options: exactly 4 non-empty strings, plausible distractors.\n" +
    "- answer: must exactly match one element of options (same characters and LaTeX).\n" +
    '- plotly_spec: string only — "" OR one JSON-encoded chart spec (scatter/bar traces) with escaped inner quotes. If "", never mention graphs/visuals in text or ideal_explanation. If not "", include numeric trace data (e.g. scatter x/y arrays).\n' +
    '- REQUIRED: If text or ideal_explanation mentions marbles, apples, cookies, toys, bag/box/jar, gave/take away/started with/how many left/in all, plotly_spec MUST NOT be "". Use number-line scatter (y all 0) or bar chart.\n' +
    '- Prefer non-empty plotly_spec when the math has a natural picture (equations, lines, rates, two quantities); minimal scatter or bar is enough. Use "" only when a graph would not help.\n' +
    "- ideal_explanation: 3–8 short sentences, ~age-10 reading level, friendly plain words, LaTeX for math; ~150 words max.\n" +
    '\nReturn one JSON object with exactly these keys: topic_category, text, answer, ideal_explanation, plotly_spec, type, options. No markdown, no code fences.';

async function questionDashScope(cfg) {
    const url = dashscopeChatUrl(cfg);
    const modelId = cfg.dsModel;
    const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
    const basePromptCommon =
        `[SEED: ${Date.now()}] [NONCE: ${nonce}] Generate a unique introductory Algebra math question. Return JSON ONLY. ` +
        `Use LaTeX in the question text. ideal_explanation: explain like to a smart 10-year-old. ` +
        `Do not mention charts/visuals unless plotly_spec is a non-empty valid JSON chart string with numeric plot data. ` +
        `If you use marbles, bags, apples, or similar addition/subtraction stories, plotly_spec MUST be non-empty (number line or bars).`;
    const marbleOverride =
        `\n\nFOR THIS TEST: Make it a marbles addition/subtraction story (e.g., start + change = end), and you MUST include a number-line chart in plotly_spec.`;
    const userContent = basePromptCommon + (cfg.__cli_marbles ? marbleOverride : "") + DASHSCOPE_MCQ_USER_SUFFIX;
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.dsKey}`
    };
    const messages = [
        {
            role: "system",
            content:
                "You output exactly one valid JSON object and nothing else. No markdown code fences, no commentary. Use double quotes for JSON strings. For quantity word problems (marbles, apples, bags), always include non-empty plotly_spec with a chart."
        },
        { role: "user", content: userContent }
    ];
    const temperature = Number.isFinite(cfg.__temperature) ? cfg.__temperature : 0.72;
    const max_tokens = Number.isFinite(cfg.__max_tokens) ? cfg.__max_tokens : 2800;
    const bodyWithJson = JSON.stringify({
        model: modelId,
        messages,
        response_format: { type: "json_object" },
        temperature,
        max_tokens
    });
    const bodyPlain = JSON.stringify({
        model: modelId,
        messages,
        temperature,
        max_tokens
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
    const mcqPv = parseAndValidate(PracticeMcqSchema, content, { lenient: true });
    if (!mcqPv.ok) throw new Error(mcqPv.issuesText || "MCQ schema validation failed");
    finalizePracticeMcq(mcqPv.data);
    const parsed = mcqPv.data;
    const parsedPlot = parsePlotlySpec(parsed.plotly_spec);
    if (cfg.__cli_requirePlot && !parsedPlot) {
        throw new Error("plotly_spec missing/invalid but --require-plot was set");
    }
    return {
        modelId,
        topic: parsed.topic_category,
        text: String(parsed.text),
        plotlySpec: String(parsed.plotly_spec || ""),
        hasValidPlotly: !!parsedPlot,
        full: parsed
    };
}

async function runCombatLab(cfg, args) {
    let systemText;
    let userText;
    if (args.combatLiveUser) {
        if (args.userFile || args.promptFile) {
            throw new Error(
                "Do not combine --combat-live-user with --user-file or --prompt-file (user message is built from cloud profile)."
            );
        }
        const { fetchPlayerProfileDocFromFirestore } = await import("./firestorePlayerProfile.mjs");
        const cloud = await fetchPlayerProfileDocFromFirestore(args.combatLiveUser);
        if (!cloud || typeof cloud !== "object") {
            throw new Error(
                `Firestore: no profile document for "${args.combatLiveUser}" (check player name and service account access).`
            );
        }
        const skillProfile = normalizeSkillProfile(cloud.skillProfile);
        const strandRotationSeq =
            typeof cloud.strandRotationSeq === "number" && cloud.strandRotationSeq >= 0
                ? Math.floor(cloud.strandRotationSeq)
                : 0;
        const ul =
            typeof cloud.unlockedLevels === "number" && cloud.unlockedLevels >= 1
                ? Math.floor(cloud.unlockedLevels)
                : 4;
        const mapLevel =
            Number.isFinite(args.combatMapLevel) && args.combatMapLevel >= 1 ? Math.floor(args.combatMapLevel) : ul;
        const turnIndex =
            Number.isFinite(args.combatTurnIndex) && args.combatTurnIndex >= 0
                ? Math.floor(args.combatTurnIndex)
                : 0;
        const bundle = buildCombatQuestionUserPrompt({
            mapLevel,
            forceEasierNextQuestion: args.combatEasier === true,
            turnIndex,
            skillProfile,
            strandRotationSeq,
            playerName: args.combatLiveUser,
            enemyName: enemyNameForMapLevel(mapLevel),
            activeQuestionText: null,
            pinnedTopic: null,
            rng: Math.random
        });
        userText = bundle.prompt;
        systemText = args.systemFile ? readText(args.systemFile).trimEnd() : getCombatQuestionSystemPrompt();
        console.log("=== LIVE PROFILE (Firestore, read-only) ===");
        console.log(
            JSON.stringify(
                {
                    displayName: args.combatLiveUser,
                    strandRotationSeq,
                    nextStrandRotationSeqUnchanged: bundle.nextStrandRotationSeq,
                    rotationTopic: bundle.meta.rotationTopic,
                    retentionTopic: bundle.meta.retentionTopic,
                    battlePinned: bundle.meta.battlePinned,
                    chosenTopic: bundle.chosenTopic,
                    targetCriterion: bundle.targetCriterion,
                    mapLevel,
                    turnIndex
                },
                null,
                2
            )
        );
        console.log("");
    } else if (args.promptFile) {
        const sp = splitPromptFile(args.promptFile);
        systemText = sp.systemText;
        userText = sp.userText;
    } else if (args.systemFile && args.userFile) {
        systemText = readText(args.systemFile).trimEnd();
        userText = readText(args.userFile).trimEnd();
    } else {
        throw new Error(
            "Combat mode requires --combat-live-user, or --prompt-file, or both --system-file and --user-file (use - for stdin)"
        );
    }
    const temperature = Number.isFinite(args.temperature) ? args.temperature : 0.3;
    /** Default high enough for Qwen math + _thought_process + structured combat JSON (avoid truncation mid-string). */
    const max_tokens = Number.isFinite(args.maxTokens) ? args.maxTokens : 4096;

    const messages = [
        { role: "system", content: systemText },
        { role: "user", content: userText }
    ];

    const base = {
        model: cfg.dsModel,
        messages,
        temperature,
        max_tokens
    };

    const formatExtras = buildCombatFormatExtras(args);

    if (args.dryRun) {
        console.log("--- DRY RUN (first request body only) ---\n");
        const first = { ...base, ...formatExtras[0] };
        console.log(JSON.stringify(first, null, 2));
        return;
    }

    console.log(
        "Calling DashScope… (set VALIDATE_LLM_FETCH_TIMEOUT_MS if you need longer than default 120s per request)\n"
    );
    const backoff = {
        min429DelayMs: 3500,
        maxDelayMs: 22000,
        initialDelayMs: 1000,
        fetchTimeoutMs: 120000,
        maxHttpRetries: 4
    };
    let { content, responseFormatLabel } = await dashScopeChatWithFormatFallback(cfg, base, formatExtras, backoff);
    let raw = content == null ? "" : String(content);

    console.log("\n=== RAW ASSISTANT (model output) ===");
    console.log(raw);
    console.log("--- end raw ---");
    console.log(`(response_format path: ${responseFormatLabel}, chars: ${raw.length})\n`);

    let pv = parseAndValidate(CombatQuestionSchema, raw, { lenient: true });
    if (!pv.ok) {
        console.log("=== ZOD (CombatQuestionSchema) — first pass ===");
        console.error("FAIL:", pv.issuesText || "parse failed");
        console.log("\n→ Retrying once with validation errors (same as in-game)…\n");
        const retryBase = {
            ...base,
            messages: [
                { role: "system", content: systemText },
                { role: "user", content: userText + combatSchemaRetryUserSuffix(pv.issuesText || "") }
            ]
        };
        const second = await dashScopeChatWithFormatFallback(cfg, retryBase, formatExtras, backoff);
        responseFormatLabel = second.responseFormatLabel;
        raw = second.content == null ? "" : String(second.content);
        console.log("\n=== RAW ASSISTANT (retry) ===");
        console.log(raw);
        console.log("--- end raw ---");
        console.log(`(response_format path: ${responseFormatLabel}, chars: ${raw.length})\n`);
        pv = parseAndValidate(CombatQuestionSchema, raw, { lenient: true });
    }

    if (args.saveRaw) {
        writeFileSync(args.saveRaw, raw, "utf8");
        console.log("Wrote raw output to:", args.saveRaw, "\n");
    }

    if (raw.trim() === "") {
        throw new Error("Empty assistant content");
    }

    console.log("=== ZOD (CombatQuestionSchema) ===");
    if (!pv.ok) {
        console.error("FAIL:", pv.issuesText || "parse failed");
        throw new Error(pv.issuesText || "Combat question schema validation failed");
    }
    console.log("PASS: Zod parse OK\n");

    const q = { ...pv.data };
    console.log("=== FINALIZE (sanitize + chart heuristics, same as app) ===");
    try {
        finalizeCombatQuestion(q);
    } catch (e) {
        console.error("FAIL finalizeCombatQuestion:", e.message || e);
        throw e;
    }
    console.log("PASS: finalizeCombatQuestion OK\n");

    console.log("=== FINAL QUESTION OBJECT (post-finalize) ===");
    console.log(JSON.stringify(q, null, 2));

    if (args.requirePlot && combatQuestionRequiresSvgDiagram(q) && !hasRenderableCombatSvg(q)) {
        throw new Error("--require-plot: quantity-story heuristics need a valid svg_spec SVG after finalize");
    }

    if (args.printJson) {
        console.log("\n--- print-json: same as FINAL QUESTION OBJECT above ---");
    }

    console.log("\nPASS: Combat lab OK");
}

function printHelp() {
    console.log(`Math Battler — LLM API validator (Alibaba DashScope)

CONFIG
  Reads ai-config.js from the repo root unless --config PATH is set.
  Repo-root .env is merged into process.env (see scripts/loadRootDotEnv.mjs). Non-blank shell env wins.

ENVIRONMENT (API)
  DASHSCOPE_API_KEY           Required for real requests (or __dashscope_api_key in ai-config.js).
  DASHSCOPE_BASE_URL          Default https://dashscope-intl.aliyuncs.com/compatible-mode/v1
  DASHSCOPE_MODEL             Default qwen-flash
  DASHSCOPE_CHAT_COMPLETIONS_URL   Optional full chat URL (overrides base + /chat/completions).

ENVIRONMENT (Firestore — combat live profile only)
  Repo-root .env is merged on startup; non-blank exported variables override.
  FIREBASE_SERVICE_ACCOUNT_PATH   Path to the service account JSON (relative paths are from repo root).
  FIREBASE_SERVICE_ACCOUNT_JSON   Same JSON on one line (optional alternative to PATH).
  Required only for --combat-live-user. Use the Admin SDK key from Firebase Console → Service accounts,
  not the web FIREBASE_CONFIG_JSON used by the browser.

ENVIRONMENT (CLI defaults)
  VALIDATE_LLM_JSON_MODE      Combat: if set, overrides --json-mode (same tokens as CLI).
  VALIDATE_LLM_TEMPERATURE    Default temperature when --temperature omitted.
  VALIDATE_LLM_MAX_TOKENS     Default max_tokens when --max-tokens omitted.
  VALIDATE_LLM_FETCH_TIMEOUT_MS   Per-request abort in ms (default 120000).

GENERAL MODES
  --smoke              Tiny JSON ping (default when no combat inputs and no --question).
  --question, --mcq    Legacy MCQ path: PracticeMcqSchema + finalizePracticeMcq.
  --both               Run smoke, then MCQ.

COMBAT LAB
  Exercises CombatQuestionSchema + finalizeCombatQuestion (same validators as the app).
  The combat JSON schema includes _thought_process (model scratchpad) first; finalize strips it
  before the printed "final question" object (same as the game — students never see it).
  On Zod failure, the script retries the chat once with validation errors (same as in-game).
  Choose ONE input style:

  A) Two files
     --system-file PATH    System message (use - for stdin).
     --user-file PATH      User message (use - for stdin).

  B) One combined file
     --prompt-file PATH    File containing both prompts, split by line markers (order matters):
                           ---SYSTEM---
                           <system prompt text>
                           ---USER---
                           <user prompt text>
                           Use - to read the combined prompt from stdin.

  Do not pass --prompt-file together with --system-file or --user-file.

  C) Live cloud profile (same user prompt as the game: skillProfile + strandRotationSeq + rotation)
     --combat-live-user NAME   Same display name you type at login (Firestore doc id), e.g. "Brendan" or "Student Brendan".
                                Implies devDependency firebase-admin; set FIREBASE_SERVICE_ACCOUNT_*.
                                Omit --user-file / --prompt-file. System prompt: use --system-file or default
                                (embedded getCombatQuestionSystemPrompt() from the repo).
     --combat-map-level N       Override map level (default: profile unlockedLevels, else 4).
     --combat-turn-index N      MYP criterion rotation A–D (default 0). Not stored in cloud — CLI only.
     --combat-easier            Same as in-game remedial / easier band.

JSON OUTPUT (combat only): --json-mode MODE
  Controls the response_format chain sent to DashScope and the fallbacks on HTTP 400
  (same idea as the app: try stricter formats first, then relax).

  full (aliases: schema, default)   DEFAULT
      1) json_schema — from --json-schema PATH if set, else the embedded combat schema
         (same module as production: combatQuestionJsonSchema).
      2) json_object
      3) omit response_format (plain completion)
      On 400 from the API, the script retries with the next step in this list.

  object (alias: json_object)
      1) json_object
      2) plain
      --json-schema is ignored (warns).

  none (alias: plain)
      1) plain only
      --json-schema is ignored (warns).

COMBAT OPTIONS
  --json-schema PATH   Optional file: OpenAI-style json_schema wrapper OR a raw JSON Schema object.
                       Used only when --json-mode is full. If the file is missing, the script exits
                       with an error when --json-schema is set.
  --dry-run            Print the first request body only (no network). Reflects the chosen
                       --json-mode chain (first response_format step).
  --save-raw PATH      Write raw assistant string to a file.
  --temperature N      Combat default 0.3 if unset (Qwen: lower reduces rambling loops; see VALIDATE_LLM_TEMPERATURE).
  --max-tokens N       Combat default 4096 if unset (Qwen needs headroom for math; see VALIDATE_LLM_MAX_TOKENS).

SHARED
  --config PATH
  --marbles            (MCQ) Force a marbles story and chart.
  --require-plot       MCQ: fail if chart JSON in plotly_spec invalid. Combat: fail if quantity-story heuristics
                       expect a diagram after finalize but svg_spec has no valid SVG.
  --print-json         (MCQ) print full MCQ JSON after validation.

After a successful combat run, optional --smoke still runs a tiny JSON ping if you passed it.

EXAMPLES
  npm run validate-llm
  npm run validate-llm -- --question
  npm run validate-llm -- --config ./ai-config.js --both

  node scripts/validate-llm.mjs \\
    --system-file scripts/examples/combat-system.sample.txt \\
    --user-file scripts/examples/combat-user.sample.txt

  # Same, but force Geometry or Data & Probability in the user message (topic rotation lab):
  node scripts/validate-llm.mjs \\
    --system-file /tmp/mathbattler-combat-system-live.txt \\
    --user-file scripts/examples/combat-user.geometry.sample.txt \\
    --json-mode full

  node scripts/validate-llm.mjs \\
    --prompt-file scripts/examples/combat-prompt-combined.sample.txt \\
    --json-mode full

  node scripts/validate-llm.mjs \\
    --prompt-file - \\
    --json-mode object \\
    --dry-run < scripts/examples/combat-prompt-combined.sample.txt

  # Cloud profile (npm install includes firebase-admin): real strandRotationSeq + skills from Firestore
  export FIREBASE_SERVICE_ACCOUNT_PATH=\\$HOME/keys/your-project-firebase-adminsdk.json
  node scripts/validate-llm.mjs \\
    --combat-live-user 'Brendan' \\
    --json-mode full
`);
}

async function main() {
    loadRootDotEnvIntoProcessEnv(ROOT);
    const args = parseArgs(process.argv);
    if (args.help) {
        printHelp();
        process.exit(0);
    }

    if (args.jsonModeEnvInvalid) {
        console.error(
            "FAIL: Invalid VALIDATE_LLM_JSON_MODE:",
            JSON.stringify(args.jsonModeEnvInvalid),
            "(use full|schema|default, object|json_object, or none|plain)"
        );
        process.exit(1);
    }
    if (args.jsonModeInvalid) {
        console.error(
            "FAIL: Invalid --json-mode:",
            JSON.stringify(args.jsonModeInvalid),
            "(use full|schema|default, object|json_object, or none|plain)"
        );
        process.exit(1);
    }

    const cfg = readConfig(args.config);
    if (cfg.configPath) console.log("Config:", cfg.configPath);
    else console.log("Config: (no ai-config.js found; using env only)");

    if (args.promptFile && (args.systemFile || args.userFile)) {
        console.error(
            "FAIL: Use either --prompt-file OR both --system-file and --user-file, not both."
        );
        process.exit(1);
    }
    if (args.combatLiveUser && (args.userFile || args.promptFile)) {
        console.error("FAIL: --combat-live-user cannot be combined with --user-file or --prompt-file.");
        process.exit(1);
    }
    if (!args.combatLiveUser) {
        if ((args.systemFile && !args.userFile) || (!args.systemFile && args.userFile)) {
            console.error("FAIL: Combat lab needs both --system-file and --user-file (use - for stdin).");
            process.exit(1);
        }
    }
    const runCombat = !!(
        args.combatLiveUser ||
        args.promptFile ||
        (args.systemFile && args.userFile)
    );
    if (!cfg.dsKey && !args.dryRun) {
        console.error("FAIL: No DashScope API key. Set __dashscope_api_key in ai-config.js or DASHSCOPE_API_KEY.");
        process.exit(1);
    }
    if (args.dryRun && runCombat && !cfg.dsKey) {
        console.warn("WARN: No API key (dry-run only prints body)\n");
    }

    cfg.__temperature = args.temperature;
    cfg.__max_tokens = args.maxTokens;

    console.log("Provider: Alibaba DashScope");
    console.log("Chat URL:", dashscopeChatUrl(cfg));
    console.log("Model:", cfg.dsModel);

    try {
        if (runCombat) {
            await runCombatLab(cfg, args);
            if (args.smoke) {
                await smokeDashScopeCfg(cfg);
                console.log("PASS: DashScope smoke OK");
            }
            return;
        }

        if (args.smoke) {
            await smokeDashScopeCfg(cfg);
            console.log("PASS: DashScope smoke OK");
        }

        if (args.mcq) {
            cfg.__cli_marbles = !!args.marbles;
            cfg.__cli_requirePlot = !!args.requirePlot;
            const r = await questionDashScope(cfg);
            console.log("PASS: DashScope MCQ OK");
            console.log("  Model:", r.modelId);
            console.log("  Topic:", r.topic);
            console.log("  Has valid chart JSON:", r.hasValidPlotly ? "yes" : "no");
            console.log("  plotly_spec chars:", r.plotlySpec.length);
            console.log("  Text:", r.text.slice(0, 120) + (r.text.length > 120 ? "…" : ""));
            if (args.printJson) {
                console.log("\n--- FULL MCQ JSON ---\n" + JSON.stringify(r.full, null, 2));
            }
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

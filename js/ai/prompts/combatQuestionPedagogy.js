/**
 * Combat question topic rotation, skill snapshots, and user-message body (shared: browser + validate-llm).
 *
 * Full design write-up: docs/TOPIC_ROTATION.md (strand vs MYP criterion, battle pin, strandRotationSeq).
 */

import { PROMPT_VERSION } from "./contract.js";
import {
    MATH_BATTLE_CONTEXT_SEEDS,
    MATH_BATTLE_DM_DELIVERY_NUDGES,
    pickSeededIndex
} from "./mathBattleSeeds.js";

/** Strands used for topic interleaving (must stay in sync with prompts and profile UI). */
/**
 * Map node enemy names (keep in sync with QUEST_ROUTE in js/main.js).
 * Used only for prompt flavour; topic rotation comes from strandRotationSeq.
 */
export const QUEST_ENEMY_NAMES = [
    "Algebra Slime",
    "Fraction Golem",
    "Percentile Parasite",
    "Fibonacci Serpent",
    "Geo-Dragon",
    "Matrix Minotaur",
    "Probability Wraith",
    "Velocity Vanguard",
    "Axiom Sentinel",
    "Logic Leviathan"
];

export function enemyNameForMapLevel(level) {
    const n = Math.max(1, Math.floor(Number(level) || 1));
    const i = (n - 1) % QUEST_ENEMY_NAMES.length;
    return QUEST_ENEMY_NAMES[i];
}

export const CANONICAL_SKILL_TOPICS = [
    "Algebra",
    "Arithmetic",
    "Geometry",
    "Fractions & Percent",
    "Patterns & Sequences",
    "Data & Probability",
    "Real-Life Modeling"
];

/** Full IB MYP criterion titles (must match system prompt Section 7). */
export const MYP_CRITERION_TITLES = {
    A: "Knowing & Understanding",
    B: "Investigating Patterns",
    C: "Communicating",
    D: "Applying in Real-Life Contexts"
};

/** Until each strand has this many attempts, prefer it for "retention" picks (exploration). */
export const SKILL_TOPIC_MIN_SAMPLES = 3;

export function normalizeSkillProfile(raw) {
    const fallback = { Algebra: { attempts: 0, corrects: 0 } };
    if (!raw || typeof raw !== "object") return fallback;
    const out = {};
    for (const [topic, v] of Object.entries(raw)) {
        if (v && typeof v === "object") {
            out[topic] = {
                attempts: typeof v.attempts === "number" ? v.attempts : typeof v.a === "number" ? v.a : 0,
                corrects: typeof v.corrects === "number" ? v.corrects : typeof v.c === "number" ? v.c : 0
            };
        }
    }
    return Object.keys(out).length ? out : fallback;
}

export function mergeSkillProfiles(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const out = {};
    for (const k of keys) {
        const va = a[k] || { attempts: 0, corrects: 0 };
        const vb = b[k] || { attempts: 0, corrects: 0 };
        out[k] = {
            attempts: Math.max(va.attempts ?? 0, vb.attempts ?? 0),
            corrects: Math.max(va.corrects ?? 0, vb.corrects ?? 0)
        };
    }
    return Object.keys(out).length ? out : { Algebra: { attempts: 0, corrects: 0 } };
}

export function ensureCanonicalSkillTopicsInPlace(skillProfile) {
    if (!skillProfile || typeof skillProfile !== "object") return;
    for (const t of CANONICAL_SKILL_TOPICS) {
        if (!skillProfile[t]) skillProfile[t] = { attempts: 0, corrects: 0 };
    }
}

/** Map model / legacy labels onto CANONICAL_SKILL_TOPICS for stable stats. */
export function canonicalizeReportedTopic(raw) {
    const s = String(raw ?? "").trim();
    const sl = s.toLowerCase().replace(/\s+/g, " ");
    if (!sl || sl === "math") return "Arithmetic";
    for (const c of CANONICAL_SKILL_TOPICS) {
        if (sl === c.toLowerCase()) return c;
    }
    if (sl.includes("pattern") || sl.includes("sequence") || sl.includes("nth term")) return "Patterns & Sequences";
    if (sl.includes("fraction") || sl.includes("percent") || sl.includes("ratio") || sl.includes("decimal")) {
        return "Fractions & Percent";
    }
    if (sl.includes("geometry") || sl.includes("shape") || sl.includes("perimeter") || sl.includes("area"))
        return "Geometry";
    if (sl.includes("data") || sl.includes("probability") || sl.includes("mean") || sl.includes("median")) {
        return "Data & Probability";
    }
    if (sl.includes("graph") && (sl.includes("data") || sl.includes("bar") || sl.includes("chart") || sl.includes("plot"))) {
        return "Data & Probability";
    }
    if (sl.includes("model") || sl.includes("real-life") || sl.includes("real life")) return "Real-Life Modeling";
    if (sl.includes("arithmetic") || sl.includes("order of operations") || sl.includes("integer")) return "Arithmetic";
    if (sl.includes("algebra") || /\bequation\b/.test(sl)) return "Algebra";
    return s.length > 40 ? s.slice(0, 40) : s;
}

/**
 * Retention focus: under-sampled strands first (so one topic cannot monopolize), else lowest success ratio.
 * @param {() => number} rng returns uniform [0,1)
 */
/**
 * Deterministic strand for the next battle (or map prefetch): exploration first (canonical order), then
 * lowest success ratio, else rotation slot. No per-battle RNG — see docs/TOPIC_ROTATION.md.
 */
export function pickBattlePinnedTopic(skillProfile, strandRotationSeq) {
    const sp = normalizeSkillProfile(skillProfile);
    ensureCanonicalSkillTopicsInPlace(sp);
    const seq =
        typeof strandRotationSeq === "number" && strandRotationSeq >= 0 ? Math.floor(strandRotationSeq) : 0;
    for (const t of CANONICAL_SKILL_TOPICS) {
        if ((sp[t]?.attempts || 0) < SKILL_TOPIC_MIN_SAMPLES) return t;
    }
    let best = CANONICAL_SKILL_TOPICS[0];
    let bestRatio = 2;
    for (const t of CANONICAL_SKILL_TOPICS) {
        const d = sp[t];
        if (!d || d.attempts < 1) continue;
        const r = d.corrects / d.attempts;
        if (r < bestRatio - 1e-9) {
            bestRatio = r;
            best = t;
        }
    }
    if (bestRatio < 2 - 1e-9) return best;
    return CANONICAL_SKILL_TOPICS[seq % CANONICAL_SKILL_TOPICS.length];
}

export function pickRetentionTopic(skillProfile, rng = Math.random) {
    const sp = skillProfile && typeof skillProfile === "object" ? skillProfile : {};
    ensureCanonicalSkillTopicsInPlace(sp);
    const under = CANONICAL_SKILL_TOPICS.filter((t) => (sp[t]?.attempts || 0) < SKILL_TOPIC_MIN_SAMPLES);
    if (under.length) return under[Math.floor(rng() * under.length)];
    let best = CANONICAL_SKILL_TOPICS[0];
    let bestRatio = 2;
    for (const t of CANONICAL_SKILL_TOPICS) {
        const d = sp[t];
        if (!d || d.attempts < 1) continue;
        const r = d.corrects / d.attempts;
        if (r < bestRatio - 1e-9) {
            bestRatio = r;
            best = t;
        }
    }
    if (bestRatio >= 2 - 1e-9) {
        const under2 = CANONICAL_SKILL_TOPICS.filter((t) => (sp[t]?.attempts || 0) < SKILL_TOPIC_MIN_SAMPLES);
        if (under2.length) return under2[Math.floor(rng() * under2.length)];
        return CANONICAL_SKILL_TOPICS[Math.floor(rng() * CANONICAL_SKILL_TOPICS.length)];
    }
    return best;
}

/**
 * Human-readable explanation of why `pickRetentionTopic` would return `pickedTopic` for this profile (for debugging).
 * Does not replay RNG; describes the deterministic branch that matches the usual algorithm.
 */
export function describeRetentionTopicChoice(skillProfile, pickedTopic) {
    const sp = skillProfile && typeof skillProfile === "object" ? skillProfile : {};
    ensureCanonicalSkillTopicsInPlace(sp);
    const under = CANONICAL_SKILL_TOPICS.filter((t) => (sp[t]?.attempts || 0) < SKILL_TOPIC_MIN_SAMPLES);
    if (under.length) {
        return under.includes(pickedTopic)
            ? `exploration: uniform pick among under-sampled strands (attempts < ${SKILL_TOPIC_MIN_SAMPLES}): [${under.join(", ")}]`
            : `exploration pool was [${under.join(", ")}]; retention candidate "${pickedTopic}" came from RNG in that pool`;
    }
    let best = CANONICAL_SKILL_TOPICS[0];
    let bestRatio = 2;
    for (const t of CANONICAL_SKILL_TOPICS) {
        const d = sp[t];
        if (!d || d.attempts < 1) continue;
        const r = d.corrects / d.attempts;
        if (r < bestRatio - 1e-9) {
            bestRatio = r;
            best = t;
        }
    }
    if (bestRatio >= 2 - 1e-9) {
        return `fallback: no strand had attempts ≥ 1 — random canonical strand (candidate "${pickedTopic}")`;
    }
    return pickedTopic === best
        ? `weakest success ratio among strands with data: "${best}" (${(bestRatio * 100).toFixed(1)}%; ties break by canonical order)`
        : `retention candidate "${pickedTopic}" (RNG tie-break / fallback branch; computed weakest: "${best}")`;
}

export function formatSkillSnapshotForPrompt(skillProfile, maxTopics = 10) {
    const sp = skillProfile && typeof skillProfile === "object" ? skillProfile : {};
    ensureCanonicalSkillTopicsInPlace(sp);
    const rows = Object.entries(sp).map(([topic, v]) => {
        const a = typeof v?.attempts === "number" ? v.attempts : 0;
        const c = typeof v?.corrects === "number" ? v.corrects : 0;
        const ratio = a > 0 ? c / a : -1;
        const pct = a > 0 ? Math.round((100 * c) / a) : null;
        return { topic, a, c, ratio, pct };
    });
    rows.sort((x, y) => {
        if (x.ratio < 0 && y.ratio >= 0) return 1;
        if (y.ratio < 0 && x.ratio >= 0) return -1;
        if (x.ratio < 0 && y.ratio < 0) return x.topic.localeCompare(y.topic);
        return x.ratio - y.ratio;
    });
    const slice = rows.slice(0, maxTopics);
    if (!slice.length) return "(no skill profile yet — default to Topic below)";
    return slice.map((r) => `${r.topic}: ${r.c}/${r.a} correct${r.pct != null ? ` (${r.pct}%)` : ""}`).join("; ");
}

/** One line: what the math must look like for each strand (stops “everything is a wallet algebra” drift). */
export function strandShapeRequirement(topic) {
    const t = String(topic || "");
    const lines = {
        Algebra:
            "The core task must feature variables, expressions, equations, or inequalities (solve or manipulate symbols)—not merely a multi-step shopping tally with only arithmetic on named amounts.",
        Arithmetic:
            "The core task must feature integers, order of operations, factors/multiples, or mental calculation strategies. If there is a story, every payment or change uses the SAME unit and commodity as the starting amount (one currency/token name only).",
        Geometry:
            "The core task must feature lengths, angles, area, perimeter, coordinates, transformations, or shapes—geometry must be essential to the answer, not decoration.",
        "Fractions & Percent":
            "The core task must require fractions, ratios, percents, or decimal proportion reasoning as the main mathematical move (not just integers dressed as a story).",
        "Patterns & Sequences":
            "The core task must feature a sequence, table, or repeating rule; the student finds a pattern, next term, nth term, or justifies a rule—avoid unrelated percent-of-wallet chains. " +
            "Use consistent indexed notation in the stem via \\(...\\) (e.g. \\(a_1\\), \\(a_2\\), \\(a_n\\), or \\(T_n\\)); do not expect the student to reproduce LaTeX or true subscripts in the answer box—success_criteria must accept plain-text equivalents (a_1, a sub 1, T sub n, etc.).",
        "Data & Probability":
            "The core task must feature data (table, chart read-off, mean/median/range) or probability from counts/outcomes—statistics or chance must be central.",
        "Real-Life Modeling":
            "The core task must interpret a believable context with explicit assumptions; keep ONE consistent measure for each resource (e.g. all values in gold coins OR all in dollars—never subtract “dollars paid” from “coins held” without a stated exchange). Ask for reasonableness or a limitation when it fits the band."
    };
    return lines[t] || "Align the mathematics authentically with this strand.";
}

export function buildMypConstraintsBlock(level) {
    const band =
        level <= 3 ? "Foundations (early Year 7 readiness)" : level <= 6 ? "IB MYP Year 7" : "IB MYP Year 8";
    const allowedByBand =
        level <= 3
            ? [
                  "integer operations, order of operations, simple fractions/decimals/percent basics",
                  "one-step and simple two-step linear equations in one variable",
                  "simple patterns and substitution (evaluate an expression for a given value)",
                  "simple perimeter/area with whole-number dimensions"
              ]
            : level <= 6
              ? [
                    "linear expressions and equations; solving and checking solutions",
                    "fractions/decimals/percent conversions and problems in context",
                    "ratio and rates (unit rate) with straightforward numbers",
                    "basic geometry: perimeter/area; angle facts; simple coordinates"
                ]
              : [
                    "multi-step linear equations; distributive property; combining like terms",
                    "proportional relationships and percent change (increase/decrease) in context",
                    "intro to functions as input/output; reading simple graphs (no advanced curve fitting)",
                    "basic statistics: mean/median/mode; simple data displays and interpretation"
                ];
    const outOfScope = [
        "calculus (derivatives/integrals/limits)",
        "trigonometry (sin/cos/tan)",
        "quadratic formula / completing the square as a main skill",
        "simultaneous equations beyond very simple intuition",
        "logarithms"
    ];
    return (
        `\n\nCURRICULUM CONSTRAINTS (must follow):\n` +
        `- Target band: ${band}. Use this level to set difficulty.\n` +
        `- Keep the problem within IB MYP Year 7–8 scope. No “surprise” senior topics.\n` +
        `- Allowed focus areas for this band: ${allowedByBand.join("; ")}.\n` +
        `- Explicitly avoid: ${outOfScope.join(", ")}.\n` +
        `- Use MYP-friendly command terms in the stem when natural (e.g., "solve", "calculate", "determine", "simplify").\n` +
        `- Explanation quality (Rubicon-style): show the method clearly, include 1 quick check when possible, and keep the reading level ~age 12–14.\n`
    );
}

/** @deprecated Retention RNG removed; strand chosen via pickBattlePinnedTopic / battle pin. Kept for older scripts. */
export const RETENTION_FRACTION = 0.22;

/**
 * Instructions for the LLM: what this criterion tests and how to write success_criteria (judgeable bullets).
 * @param {string} letter - A | B | C | D
 */
export function criterionFocusBlock(letter) {
    const L = String(letter || "A").toUpperCase().slice(0, 1);
    const blocks = {
        A: `CRITERION A — Knowing & understanding (facts & procedures):
- The stem must require recalling or applying facts, procedures, or standard techniques (compute, simplify, solve, substitute).
- success_criteria: 2–5 lines starting "- ", each an observable check (e.g. correct operation, final value, correct units if applicable, one sanity check). Align every bullet to the same numbers/context as the stem.`,
        B: `CRITERION B — Investigating patterns:
- The stem must ask for pattern recognition, testing cases, a rule, generalisation, or justification of a pattern (not only a single numeric answer with no pattern work).
- If the sequence uses term labels, name them consistently in the stem with \\(...\\) (e.g. \\(a_1\\), \\(a_2\\), \\(a_n\\)). Remind students they may write answers in plain text (e.g. a_1, a sub 1, T sub n).
- success_criteria: bullets must require evidence of investigation (e.g. examples tested, pattern stated, rule or next term justified). Do not require formatted subscripts in the typed answer; credit clear plain-text or verbal equivalents.`,
        C: `CRITERION C — Communicating:
- The stem must ask for clear explanation: steps, correct vocabulary, or organised reasoning (not only a final answer).
- success_criteria: bullets must name what “good communication” looks like for this task (e.g. ordered steps, correct terms, logical flow). The answer box is plain text only—do not demand LaTeX, Unicode subscripts, or special symbols; underscore or “sub” wording counts as correct notation when unambiguous.`,
        D: `CRITERION D — Applying in real-life contexts:
- The stem must use a believable context; require modelling choices, interpretation, or reasonableness (e.g. assumption, limitation, units, “does this make sense?”).
- success_criteria: bullets must include checks for context use and interpretation, not only the algebra.`
    };
    return blocks[L] || blocks.A;
}

/**
 * Pure builder: same logic as the game’s combat user prompt (no global state).
 * @param {{
 *   mapLevel: number,
 *   forceEasierNextQuestion?: boolean,
 *   turnIndex: number,
 *   skillProfile: object | null,
 *   strandRotationSeq: number,
 *   playerName: string | null | undefined,
 *   enemyName: string,
 *   activeQuestionText?: string | null,
 *   pinnedTopic?: string | null,
 *   cosmeticsTier?: number,
 *   rng?: () => number
 * }} params
 */
export function buildCombatQuestionUserPrompt(params) {
    const mapLevel =
        Number.isFinite(params.mapLevel) && params.mapLevel >= 1 ? Math.floor(params.mapLevel) : 1;
    const easier = params.forceEasierNextQuestion === true;
    const diff = easier ? "Introductory" : mapLevel <= 3 ? "Introductory" : mapLevel <= 6 ? "Grade 7" : "Grade 8";
    const difficultyFromLevel =
        mapLevel <= 3 ? "Introductory (map levels 1–3)" : mapLevel <= 6 ? "Grade 7 (map levels 4–6)" : "Grade 8 (map level 7+)";
    const difficultyCalculationLine = easier
        ? `Difficulty label is Introductory because the player is on a remedial/easier question this round (potion or struggle path) — use Foundations-style tasks even if map level is ${mapLevel}.`
        : `Difficulty label follows map level: level ${mapLevel} → ${difficultyFromLevel.split("(")[0].trim()}.`;
    const criterionCycle = ["A", "B", "C", "D"];
    const turnIdx = Number.isFinite(params.turnIndex) ? Math.floor(params.turnIndex) : 0;
    const targetCriterion = criterionCycle[((turnIdx % 4) + 4) % 4];
    const enemyName = String(params.enemyName || "Enemy");
    const heroName = String(params.playerName || "").trim();
    const heroNameJson = heroName ? JSON.stringify(heroName) : "";

    let skillProfile = params.skillProfile != null && typeof params.skillProfile === "object" ? params.skillProfile : null;
    skillProfile = normalizeSkillProfile(skillProfile);
    ensureCanonicalSkillTopicsInPlace(skillProfile);

    const strandSeq =
        typeof params.strandRotationSeq === "number" && params.strandRotationSeq >= 0
            ? Math.floor(params.strandRotationSeq)
            : 0;
    const rotationTopic = CANONICAL_SKILL_TOPICS[strandSeq % CANONICAL_SKILL_TOPICS.length];
    const pin = params.pinnedTopic != null && String(params.pinnedTopic).trim() !== "";
    let chosenTopic;
    let topicPedagogyExplanation;
    if (pin) {
        chosenTopic = String(params.pinnedTopic).trim();
        topicPedagogyExplanation = `BATTLE PINNED: entire fight uses strand “${chosenTopic}”. Criterion A–D still advances each graded cast.`;
    } else {
        chosenTopic = pickBattlePinnedTopic(skillProfile, strandSeq);
        topicPedagogyExplanation = `STRAND (prefetch / tools): “${chosenTopic}” from pickBattlePinnedTopic(skillProfile, strandRotationSeq) — exploration & weakness emphasis; strandRotationSeq advances only at battle start in the game.`;
    }
    const skillSnapshot = formatSkillSnapshotForPrompt(skillProfile);
    const nonce =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    const cosmeticsTier = Math.min(
        5,
        Math.max(0, Math.floor(typeof params.cosmeticsTier === "number" ? params.cosmeticsTier : 0))
    );
    /** Mix hero evolution tier into seeded picks so taunt/delivery variety tracks prestige without a second API call. */
    const seedKey = `${nonce}::tier${cosmeticsTier}`;
    const contextSeed = MATH_BATTLE_CONTEXT_SEEDS[pickSeededIndex(seedKey, "ctx", MATH_BATTLE_CONTEXT_SEEDS.length)];
    const dmDeliveryNudge =
        MATH_BATTLE_DM_DELIVERY_NUDGES[pickSeededIndex(seedKey, "dm", MATH_BATTLE_DM_DELIVERY_NUDGES.length)];

    let avoidPrior = "";
    const prevStem = params.activeQuestionText;
    if (prevStem && String(prevStem).trim()) {
        const snippet = String(prevStem).trim().slice(0, 320);
        avoidPrior = `\n\nThe player was just shown this stem — you must NOT repeat it, reuse the same numbers with different wording, or mirror its structure. Produce a clearly different problem:\n${JSON.stringify(snippet)}`;
    }

    const criterionTitle = MYP_CRITERION_TITLES[targetCriterion] || MYP_CRITERION_TITLES.A;
    const levelForBand = easier ? 1 : mapLevel;
    const targetBandLabel =
        levelForBand <= 3
            ? "Foundations (early Year 7 readiness)"
            : levelForBand <= 6
              ? "IB MYP Year 7"
              : "IB MYP Year 8";

    const critFocus = criterionFocusBlock(targetCriterion);

    const promptBody = `[PROMPT_VERSION ${PROMPT_VERSION}] [SEED: ${Date.now()}] [NONCE: ${nonce}]

Role: IB MYP math examiner + snarky dungeon master for ages 11–13.

# CURRENT BATTLE PARAMETERS
- Topic Syllabus: ${chosenTopic}
- Target MYP Criterion: Criterion ${targetCriterion} (${criterionTitle})
- Task Directive: Look at Section 7 of your instructions. You MUST design this question specifically to test Criterion ${targetCriterion} skills using the topic of ${chosenTopic}.
- Grade Band: ${targetBandLabel} (typical ages ~12–14).

# CRITERION SUCCESS CONTRACT (follow exactly)
${critFocus}
- Set JSON "success_criteria" to a single string: several lines starting with "- " so the judge can check each line against the student response. Do not copy generic bullets from another criterion letter.

Combat (follow HARD REQUIREMENTS at the end for JSON keys and svg_spec SVG rules):
- Speaker (enemy): ${JSON.stringify(enemyName)} — taunt in their voice; name self at least once; never use the hero’s name as the monster’s identity.
- Hero evolution tier (staff upgrades, 0–5): ${cosmeticsTier}. Higher tiers → more wary or respectful opening taunt; lower tiers → cockier or dismissive. Stay consistent with the creative sparks below.
- Addressee: ${heroNameJson ? `${heroNameJson} — address by this exact string at least once in the taunt.` : "Hero name unset — use you/your only."}
- Map level: ${mapLevel} · Display difficulty: ${diff} (${difficultyCalculationLine})
- ${topicPedagogyExplanation}
- Rotation slot index (coverage reference): ${rotationTopic} (strandRotationSeq mod 7).
- topic_category for this question (verbatim): ${JSON.stringify(chosenTopic)} — syllabus label only, not ${JSON.stringify(enemyName)}’s name (no “Algebras” swarms).
- Strand shape (math must match, not just the label): ${strandShapeRequirement(chosenTopic)}
- Strand discipline: The stem must use THIS strand’s mathematics. Do not default to linear algebra (e.g. “solve for x”) when Topic is not Algebra — that wastes the rotation.
- Skill snapshot (scaffold weak / stretch strong; stay MYP): ${skillSnapshot}

Pedagogy: Balance progression and retention. Honor Topic=${chosenTopic} at ${diff}; if ${chosenTopic} looks weak in the snapshot, keep one clear main move.

Output: One rigorous MYP question. Machine rules (JSON schema, strings) win over flavor — but prefer an original stem over a generic one.

Structure & content:
- Single JSON object, no fences (details in HARD REQUIREMENTS). type "input", criterion "${targetCriterion}", no MCQ.
- Word problems: one consistent unit/ledger end-to-end; expected_answer and ideal_explanation match that ledger. One variable, one meaning (do not use x for both a count and a unit price). If you state cash on hand, the purchase total must be possible with that cash unless you explain extra money.
- Stem (player-readable question): EITHER (a) one string in "text", OR (b) when real US dollar money and algebra both appear: "text_blocks" — in prose, $ is ONLY for currency (e.g. "$5"); never $x$ or $3x+5$ in prose (that caused broken math rendering). Put every equation in inline_math; do not duplicate the same equation in prose and inline_math. Order: prose → inline_math (equation) → optional prose (question). Latex fields: no $ or \\(...\\); the app wraps them.
- Student answers are typed in a plain box: no LaTeX there. For sequences/indexed terms, show notation correctly in the stem (\\(...\\)) but do not expect students to type delimiters; optional hint that "a_1" or "a sub 1" is fine. success_criteria must be judgeable against plain-text responses.
- If you use "text" only: Math in \\(...\\) only; currency like $5 once, not $5$; in JSON double backslashes in TeX (\\\\text, \\\\times, \\\\frac).
- If you use "text_blocks": omit the "text" key entirely (schema rejects both stem modes at once).
- ideal_explanation: final polished solution only (max 4 sentences); smart 10-year-old voice; formulas only in \\(...\\); no scratchpad or self-corrections.
- Diagrams: use visual_type "svg" and svg_spec for any diagram. For Geometry, follow the system prompt SVG rules (single-quoted attributes, viewBox='0 0 100 100', primitives, no double quotes inside the SVG string). For quantity / object stories (bags, marbles, …) when a picture helps, use a minimal SVG (e.g. three rects for Start / Change / End) with the same rules.
- If visual_type is "none", do not claim a diagram exists in prose.

Creative: Original scenario; optional sparks (not data): ${contextSeed} · ${dmDeliveryNudge}
Vary task style with the criterion (solve, simplify, justify pattern, model, interpret). Skip tired marble-bag setups unless the topic needs them — then you must chart.
${avoidPrior}
${buildMypConstraintsBlock(easier ? 1 : mapLevel)}`;

    const nextStrandRotationSeq = strandSeq;

    return {
        prompt: promptBody,
        chosenTopic,
        targetCriterion,
        nextStrandRotationSeq,
        meta: {
            rotationTopic,
            retentionTopic: chosenTopic,
            usedRetention: false,
            strandSeq,
            battlePinned: pin
        }
    };
}

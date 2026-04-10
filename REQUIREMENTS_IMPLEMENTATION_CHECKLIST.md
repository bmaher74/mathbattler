# Math Battler — Requirements Implementation Checklist

This file maps `Game_Requirements.md` requirements to the current implementation (primarily `index.html`) and tracks remaining gaps.

## Legend
- **Implemented**: present in codebase now
- **Partial**: present but missing required details
- **Missing**: not implemented yet

## 1) Core concept
- **Implemented**: Web-based, zero-install (`index.html`)

## 2) MYP pedagogical requirements
- **Implemented**: Topics exist as categories (see skill profile normalization + prompt topic selection in `index.html`)
- **Implemented**: Combat is open-ended typed response (textarea + judge) (`index.html`, `#answer-form`, `handleInputAttack`)
- **Implemented**: MCQ exists as non-combat practice mode (`#practice-overlay`)
- **Implemented**: Plotly.js loaded and renders from `plotly_spec` string in Solution overlay (`showDetailedFeedback`, `Plotly.newPlot`)
- **Partial**: Rubric-style marking exists as bands but needs criterion-aware scoring details and `isCrit` support (see `buildJudgePrompt`, `gradeResponseViaDashScope`)

## 3) Progression & retention algorithm
- **Implemented**: Tracks per-topic attempts/corrects in skill profile and stores in local + Firestore (merge logic in `index.html`)
- **Implemented**: 70/30 interleaving (weakest topic vs alternative) (`buildMathQuestionPrompt`)
- **Implemented**: Difficulty band by level (<=3 / <=6 / 7+) in constraints prompt (`buildMypConstraintsBlock`)
- **Implemented**: Anti-repetition rolling stems with duplicate rejection (`recentQuestionStems`, `rememberQuestionStem`, duplicate retry)

## 4) High-fidelity graphics & presentation
- **Implemented**: All sprites are inline SVG strings (`ASSETS`, `BOSS_ASSETS`)
- **Implemented**: Key regression anchors for wizard/slime/golem exist and are tested (`runRegressions`)
- **Partial**: Boss sprites after L2 are still relatively simple placeholders; do not match Character Design Prompts fidelity
- **Partial**: Level 10 boss is “Calculus Titan” (out-of-scope topic per curriculum constraints). Must replace with MYP-scope final boss concept.
- **Implemented**: MathJax loaded; question + explanation typeset; units guidance exists in prompts

## 5) Engagement & combat mechanics
- **Partial**: Damage loop exists but differs from spec and lacks advanced juice:
  - Current: band-based damage (`damageForBand`)
  - Missing: crit hits, combo multiplier, hit-stop, low-HP enemy state, scan ability, potion second chance, parry reflection gate
- **Implemented**: Attack lunge animations + shake + floating damage text; HP bar transitions; damage overlay reset per question (`clearBattleDamageOverlay`)
- **Implemented**: Solution overlay blocks progression until “Continue” (`#detailed-feedback-overlay`)

## 6) Persistence & architecture
- **Implemented**: Firebase anon auth + Firestore profile path matches requirements (`artifacts/{appId}/public/data/playerProfiles/{playerName}` via `doc(db,"artifacts",appId,"public","data","playerProfiles",safeProfileDocId(name))`)
- **Implemented**: Offline fallback if Firebase missing/fails; merges cloud/local; uses localStorage
- **Implemented**: Network throttling/backoff helpers (`fetchWithBackoff`, singleton `fetchPromise` + `prefetchInFlight`)
- **Implemented**: Question schema validated and enforced; `plotly_spec` string handling

## 7) AI prompt engineering
- **Partial**: Uses DashScope (Qwen) for live questions and judging, with JSON-only constraints and response_format json_object
- **Missing**: Combat generator prompt should be defined explicitly from `Question Prompt Template.md` (with Apr 2026 combat update: input-only)
- **Partial**: Judge prompt exists but needs rubric-aligned detail, criterion-aware scoring, and `isCrit`

## 8) Regression suite (self-healing anchors)
- **Implemented**: Visual anchors test + MathJax + Vault + Scroll integrity checks
- **Partial**: Prompt debugging exists via `window.__debug_ai_prompts` but needs a user-toggleable UI switch

## 9) Database schema
- **Partial**: Skill profile exists; but other persistence fields required by meta-progression are missing (logic shards, bestiary, cosmetics, etc.)

## 10) Black box asset architecture
- **Implemented**: SVG strings in `ASSETS` and injected via `innerHTML`

## 11) Plotly integration
- **Implemented**: Renders Plotly when `plotly_spec` is non-empty valid JSON string
- **Implemented**: For “quantity story” questions with empty/invalid plotly_spec, the app synthesizes a minimal Plotly spec (`synthesizeQuantityStoryPlotlySpec`)

## 12–16) Juice + meta loop + combo
- **Missing**: Hit stop, crits, low-HP enemy behavior, combo state + multiplier
- **Missing**: Bestiary, Logic Shards, cosmetic upgrades

## 17–21) Advanced pedagogical mechanics
- **Missing**: Elemental typing / illusion of choice, parry reflection gate, health potion stepped-down question, scan ability hint, diagnostic tutorial boss behavior (rapid-fire multi-topic)

## Post-level-10 content
- **Partial**: Map can render beyond 10 nodes visually (`total = max(10, unlockedLevels + 1)`), but boss identities repeat via modulo and are not generated
- **Missing**: Infinite procedural levels >10 with LLM-generated bosses (battle + map) using `Dynamic Character Prompt.md`, cached locally and in Firestore


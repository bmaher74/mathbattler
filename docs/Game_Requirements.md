# Game Requirements Document: Math Creature Battler

## 1. Core Concept
A web-based, zero-installation RPG battler designed for Middle Years Programme (MYP) students. The game disguises rigorous mathematical assessment as turn-based combat, using LLM-driven generation to dynamically adapt to a student's learning gaps.

## 2. MYP Pedagogical Requirements
* **Target Audience:** Grade 7 and Grade 8 math students.
* **Core Topics:**
  * Algebra & Equations
  * Fractions, Percentages & Ratios
  * Geometry & Measurement
  * Patterns & Sequences
  * Data & Probability
  * Real-Life Modeling
* **Question Formats:**
  * *Multiple Choice (MCQ):* 4 dynamically generated options formatted with LaTeX.
  * *Open-Ended Input:* Text evaluation where an AI "Pedagogical Judge" reads the student's reasoning (e.g., "I think it's 7 because...") and scores it based on mathematical truth, ignoring conversational filler.
* **Update / Clarification (Apr 2026):** Combat questions must be **open-ended typed response** (not MCQ). Students submit a final answer *and* reasoning, and the AI judge marks using MYP Mathematics-style criteria **A–D** (see below). Students can only type plain text (no drawings); the judge accepts verbal descriptions of graphs or representations when appropriate for **Criterion C**. MCQ may still exist as a non-combat practice mode, but **not** the primary battle loop.
* **Visual Explanations:** The system must support svg to render dynamic scatter or bar charts inside the feedback window to visually explain complex concepts.
* **Curriculum Constraints (Apr 2026):** Generated problems, explanations, and marking must be **explicitly constrained to IB MYP Year 7/8 scope**, and must use the current game level to set difficulty band (Foundations → Year 7 → Year 8). Out-of-scope topics (e.g., calculus/trigonometry/logarithms/quadratic formula) must be avoided.

## 3. Progression and Retention Algorithm
* **Skill Tracking:** The database strictly tracks `attempts` vs. `corrects` for every tracked topic label (see §9 — canonical strand names in code).
* **Pedagogical Interleaving (The 70/30 Rule):** *Design intent for retention vs. variety.*
  * **70% Retention:** Prefer targeting the student's weakest topic (lowest success ratio where data exists).
  * **30% Progression:** Occasionally vary the topic so the student does not only ever see one strand.
  * **Implementation note (ship):** The **browser game** primarily uses **battle strand pinning** and **criterion rotation** (below). The standalone prompt builder in `js/llm.js` still applies a **random 70/30** weakest-vs-other topic mix for tooling / offline flows. Full detail: `docs/TOPIC_ROTATION.md`.
* **Battle strand pinning (Apr 2026, implemented):** When a fight starts, the game picks **one** canonical strand for **all questions in that battle** using `pickBattlePinnedTopic` (explore under-sampled strands first, then weakest success ratio, else a rotating slot via `strandRotationSeq`). The strand does not change mid-battle.
* **Criterion rotation A–D (Apr 2026, implemented):** Each time the student casts a spell and is graded, the next question targets the next MYP criterion in order **A → B → C → D** (`turnIndex` modulo 4), so a full boss fight exercises all four criteria over successive turns.
* **Dynamic Difficulty:** Level 1-3 bosses generate "Introductory" questions; Level 4-6 bosses generate "Grade 7" questions; Level 7+ bosses generate "Grade 8" questions.
* **Anti-Repetition (Apr 2026):** The system must avoid asking the same (or trivially reworded) question repeatedly. Maintain a rolling history of recent stems and reject duplicates.

## 4. High-Fidelity Graphics & Presentation
* **Constraint:** No external image files. All assets must be pure, self-contained SVG code to allow for dynamic styling and instant loading.
* **Entity Specs:**
  * **Math Wizard (Player):** Blue/purple theme, floating geometry, and a complex spinning staff wheel (`STAFF_WHEEL`) that uses CSS infinite rotation.
  * **Algebra Slime (Enemy):** Green theme, ambient math text (`x+y`), and independently pulsing left/right eyes.
  * **Fraction Golem (Enemy):** Orange theme, structural block body, glowing eyes, and visible internal fraction calculations ($1/4 + 1/4 = 1/2$).
* **Formatting:** All UI math (buttons, questions, feedback) must be strictly parsed through `MathJax` (LaTeX). Units (cm, m, %) must be wrapped in `\text{}` to prevent italicization.

## 5. High Engagement & Combat Mechanics
* **Action Loop:** Combat is driven entirely by math. **Damage is not a fixed 50/25** — it is derived from the **pedagogical judge bands** (see §7 and §22) so that correctness, reasoning quality, and partial understanding all map to different HP changes. Boss HP is tuned so a typical fight lasts on the order of **several well-reasoned hits** (not one-shot kills).
* **Juice (Game Feel):**
  * Hero and enemy **lunge / flinch** animations (combat-specific CSS keyframes, not legacy `animate-attack` only).
  * Hits trigger **screen shake** and **floating damage numbers** (`animate-damage`). Enemy-target damage numerals use a **high-contrast yellow** in the current stylesheet; player-target damage uses a red / pink tone.
  * **Impact flash** on the battle viewport on successful player strikes (brief full-screen flash layer).
  * Health bars use smooth transitions for depletion.
* **The Solution overlay:** If a student misses a question (or needs full feedback), the battle pauses. A modal overlay forces them to read the ideal explanation (and view any **Plotly** chart and/or **inline SVG diagram**) before continuing. The modal heading in the UI is **“Solution”** (epic copy elsewhere still uses scroll / spell metaphors).
* **Level Map:** At least **10** sequential boss fights on the main route unlock progressively. **Additional map levels** beyond the canonical route may be supported via **AI-generated boss SVG cache** (`bossCacheByLevel`) so progression can extend without shipping new static assets.
* **Battle Boss Identity (Apr 2026):** The boss shown in battle must match the level-map boss identity (no parity-based substitution). Battle sprites must remain high-detail; map icons may be simplified, but must not replace battle sprites.
* **Damage Overlay Reset (Apr 2026):** Floating damage text must not persist across questions/levels; damage overlays must be cleared when a new fight/question starts.

## 6. Persistence & Architecture
* **The Vault (Firebase):** Uses Firestore and Anonymous Authentication to silently track user profiles in the background without requiring passwords.
* **Profile Handshake:** Validates the existence of a profile (e.g., "Student Brendan"). If missing, it seeds a fresh profile with Level 1 unlocked and a blank MYP skill tree.
* **Offline Fallback:** If Firebase cannot complete setup in time, the game falls back to **local-only** profile data so the student can still play. The login / vault gate uses an **~8 second** timeout before unblocking the UI (not 6 seconds — implemented as 8000 ms). AI question fetch timeouts are separately configurable (e.g. `?aiTimeoutMs=` / `window.__prefetch_ai_timeout_ms`).
* **Network Throttling:** Uses **singleton promises** for prefetch and load-question paths, plus **exponential backoff** (and Retry-After awareness) on LLM HTTP calls so bursts of clicks or HTTP **429** responses do not stampede the API.
* **JSON Schema:** The LLM strictly outputs to a defined JSON object to guarantee the UI never breaks.
  * **Update / Clarification (Apr 2026):** Use `plotly_spec` as a **string** (`""` or a JSON-encoded Plotly spec). Do not promise visuals in prose unless `plotly_spec` is non-empty and valid.
  * **Update / Clarification (Apr 2026):** For open-ended combat questions, use `expected_answer` (and criterion metadata) rather than strict MCQ `options`.
  * **Update / Clarification (Apr 2026):** Combat stems may include an **inline SVG diagram** via `visual_type` / `svg_spec` (in addition to or instead of Plotly) so geometry / quantity stories can show a authored figure inside the question panel.


# Game Requirements Document: Part II (Technical Implementation)

## 7. AI Prompt Engineering (The Brain)
The game relies on two distinct LLM calls that must adhere to strict JSON schemas to prevent application crashes.
* **Provider (Apr 2026):** Use Alibaba DashScope (OpenAI-compatible endpoint). Do not depend on Gemini/OpenRouter for production gameplay.

* **The Generator Prompt (Pre-fetching):**
    * **Context Injected:** Current map difficulty (e.g., "Grade 7") and the targeted MYP topic (e.g., "Fractions").
    * **Formatting Constraints:** Instructed to ALWAYS wrap units in `\text{}` for LaTeX compatibility.
    * **Output Schema:** Must return structured JSON (no markdown) and include `plotly_spec` as described above.
    * **Logic (Apr 2026):** Combat generation rotates open-ended questions aligned to **MYP Criteria A–D**; the game level and student skill profile must drive difficulty and topic selection.

* **The Pedagogical Evaluator Prompt (Combat Input):**
    * **Context Injected:** The original question, `expected_answer`, `success_criteria`, targeted criterion letter, difficulty band (Foundations / Year 7 / Year 8), and the student's raw text input.
    * **Directive:** Assign an **achievement level 0–8 for the targeted criterion only** (paraphrased MYP-style descriptors in `js/ai/prompts/mypMathRubric.js`). `isCorrect` follows task success against `success_criteria`, not string-matching alone. Plain-text-only responses: accept described representations where a drawing is not possible.
    * **Output Schema (Apr 2026):** Must return a rubric-aligned JSON object that includes `band`, `score` (achievement level for that criterion), `isCorrect`, `isCrit` (game flag), and feedback.
    * **Rubric scope (Apr 2026):** Questions and marking use **MYP Criterion A, B, C, and D**; game bands map deterministically from `score` (see judge prompt + `finalizeJudgeResult` harmonisation).

## 8. The Regression Suite (Self-Healing Anchors)
To prevent LLM "Compression Bias" (where future code updates accidentally erase complex visual details to save tokens), the application runs a continuous integrity check on load.
* **Visuals Test:** The system parses the serialized `ASSETS` object to verify the presence of hyper-specific IDs (e.g., `SLIME_EYE_L`, `STAFF_WHEEL`, `GOLEM_BODY`). If these are missing, the UI flags a Visual Regression.
* **MathJax Test:** If `window.MathJax` exists, the strip shows **MATHJAX: PASS**. (A strict FAIL state when MathJax is absent is not yet asserted — missing engine may leave the label unchanged.)
* **Vault Test:** Verifies read/write permissions to the Firestore database.
* **Scroll Integrity:** Verifies the interaction panel is non-shrinking in the flex layout (equivalent to `flex-shrink: 0`, including Tailwind `shrink-0`) so the answer area is not crushed.
* **Prompt Debugging (Apr 2026):** The app must provide a debug switch to output the exact LLM prompt(s) used for generation and grading to the browser console, to make prompt issues diagnosable.

## 9. Database Schema (Firebase Firestore)
The game operates on a NoSQL document database. It uses Anonymous Authentication to bypass login screens while still associating data with the inputted username.

* **Path:** `artifacts/{appId}/public/data/playerProfiles/{playerName}`
* **Data Structure (representative):** Persisted documents include progression, skills, economy, cosmetics, and engagement. Topic keys in `skillProfile` follow **canonical strand labels** used by the game code (e.g. `Algebra`, `Arithmetic`, `Geometry`, `Fractions & Percent`, `Patterns & Sequences`, `Data & Probability`, `Real-Life Modeling`) — not necessarily the longer brochure wording in §2.
    ```json
    {
      "unlockedLevels": 2,
      "skillProfile": {
        "Algebra": { "attempts": 5, "corrects": 3 },
        "Geometry": { "attempts": 0, "corrects": 0 }
      },
      "shards": 120,
      "cosmeticsTier": 2,
      "bestiary": [],
      "strandRotationSeq": 14,
      "bossCacheByLevel": {},
      "engagement": {
        "streakCount": 0,
        "dailyQuestBattleDone": false
      },
      "audio": { "musicVolume": 1, "sfxVolume": 1 }
    }
    ```
* **Cloud sync:** When Firebase is available, profiles **merge** local and cloud fields (max unlocked level, per-topic max attempts/corrects, shards, etc.). Tab visibility and manual sync hooks refresh cloud state without blocking play.

## 10. The "Black Box" Asset Architecture
To protect high-fidelity graphics from being corrupted during code rewrites, all SVG code is strictly decoupled from the HTML body.
* **Methodology:** SVGs are stored as minified template literals inside a `const ASSETS = {}` dictionary at the top of the script.
* **Rendering:** The game dynamically injects these strings into generic container `div`s (e.g., `<div id="enemy-sprite"></div>`) using `innerHTML` at runtime based on the current level.

## 11. Plotly Integration (Data Visualization)
When the AI generates a question that benefits from visual representation (like statistics or geometry), it populates `plotly_spec`.
* **Trigger:** If `q.plotly_spec` is a non-empty string containing a valid Plotly JSON spec, the UI renders it.
* **Display:** The Solution Scroll modal opens and the game dynamically initializes `Plotly.newPlot()` inside a hidden container, binding the AI’s numeric trace arrays to a scatter or bar chart so the student can interact with the data that explains the concept.
* **Update / Clarification (Apr 2026):** Graphs must be strongly encouraged and, for certain story problems (e.g., marbles/add-sub), the system must ensure a plot appears (retry generation or synthesize a minimal explanatory chart) so the student never sees “imagine a number line” without an actual chart.

## 11b. Inline SVG Diagrams (Combat Questions)
* **Trigger:** When `visual_type` is `"svg"` and `svg_spec` contains a valid mini-SVG string (single-quote attributes, fixed viewBox), the battle UI injects it into the question area — **in addition to** Plotly in the feedback modal when both are present.
* **Purpose:** Support diagrams that are not well suited to Plotly (e.g. labelled segments, simple figures) while keeping assets as inline vector markup (no binary image files).

# Game Requirements Document: Part III (Engagement & Psychology)
## Target Demographic: Middle School (Ages 11-13, Male-leaning)

## 12. Game Feel & "Juice" (Sensory Feedback)
For this demographic, doing math must feel physically impactful. The UI must react violently to their success.
* **Strike sequencing (implemented):** Player attacks use a **timed sequence**: lunge → brief impact flash → HP update and floating numbers → optional enemy counter-attack animation. This is more structured than a single CSS class toggle.
* **Procedural SFX (implemented):** Combat hits use the **Web Audio API** (synthesized tones / noise — no external audio files required for core strikes). Volumes respect user SFX settings.
* **The "Hit Stop" (Hit Pause):** On **map level 7+**, a strong correct outcome (including many crits) adds **~100 ms** delay before applying damage numbers, mimicking fighting-game “hit stop.”
* **Critical Hits:** If the judge sets `isCrit: true` (subject to `finalizeJudgeResult` rules), damage to the enemy increases relative to a normal direct hit; SFX gain slightly more punch. The UI does **not** currently duplicate a separate “red vs yellow” enemy damage color — enemy damage numerals use one high-visibility color in CSS.
* **Dynamic Animations:** Enemies idle with a **breathing** animation (`scaleY`). Below **20%** HP they switch to a **low-HP** state (faster / stressed motion per stylesheet).

## 13. Meta-Progression & The Loop
A linear map of 10 bosses isn't enough to keep a 12-year-old coming back. They need a "Meta-Loop" (long-term goals).
* **The Bestiary (Monster Dex):** Once an enemy is defeated, it is added to the **Bestiary**. The student can view **unlocked boss SVGs**, the boss **name**, **topic label**, and **defeat date**. *LLM-written lore paragraphs are not a stored requirement in the shipped data model* — flavor text is primarily prompt/UI-side.
* **Loot & Currency:** Defeating enemies drops **Logic Shards** (persisted with the profile).
* **Cosmetic Upgrades (five-stage evolution):** Students spend Shards on **sequential tiers** (e.g. 100 / 200 / 350 / 500 / 750) that add cumulative **SVG overlays** on the wizard and grant a **weapon damage multiplier** (tier 0 = ×1.0, up to about ×1.44 at max tier — see `weaponDamageMultiplier` in code). This gives a non-academic reason to grind.

## 14. Tone, Narrative, and Humor
Middle school boys respond poorly to dry, overtly academic tones. They respond incredibly well to slight sarcasm, epic framing, and humor.
* **Enemy Trash Talk:** The AI prompt should instruct the enemy to occasionally "taunt" the player in the UI. 
    * *Example (Fraction Golem):* "Your common denominators are pathetic!"
* **Epic Framing:** Never use words like "Quiz," "Test," or "Study." 
    * "Review your answers" → *"Consult the Solution Scroll."* (modal title: **Solution**)
    * "Submit Answer" → *"Cast Spell."*
    * "Incorrect" → *"Your spell fizzled against their armor."*

## 15. Disguising Scaffolding as "Power-Ups"
When a student is stuck, they rarely click a button that says "Get a Hint" because it feels like admitting defeat. You must rebrand pedagogical help as tactical gameplay.
* **The "Scan" Ability:** Instead of asking for a hint, the player can click "Analyze Enemy." The AI generates a breakdown of the specific formula needed to beat the monster, presented as a tactical weakness. 
* **The "Health Potion" (Second Chance):** If a student is about to die, they can consume a potion. Instead of just giving HP, the potion gives them an "easier" (stepped-down) version of the question to allow them to recover their momentum.

## 16. The Combo System (Flow State)
To encourage speed and accuracy (fluency), implement a Combo Tracker.
* **The Mechanics (implemented):** After **three** judge outcomes counted as “good” (`correct_with_reasoning` band), the player enters **Combo State** and a **combo badge** is shown.
* **The Reward (implemented):** While in Combo State, outgoing damage to the boss is multiplied by **×1.25** (not ×1.5). Wrong answers reset the streak.
* **Not yet implemented:** Full-screen **blue arena pulse**, **glass-shattering** SFX on combo break — listed here as aspirational; see Part IV §17+ for other unshipped mechanics.

# Game Requirements Document: Part IV (Advanced Pedagogical Mechanics)
## Bridging the Gap Between Gameplay and Deep Learning

## 17. The Illusion of Choice (Elemental Math Typing)
To prevent the student from feeling like they are just being fed a test, the game must trick them into volunteering for difficult questions by disguising them as tactical advantages.
* **The Mechanic:** Assign "Elements" to MYP domains (e.g., Algebra = Fire, Geometry = Earth, Fractions = Water). Bosses are assigned an elemental type. Before an attack, the player can choose which "Spell Type" (math topic) to cast. 
* **The Reward:** Hitting a boss with its elemental weakness (e.g., choosing a Geometry question against a Water boss) deals 2x damage.
* **Educational Value:** Builds intrinsic motivation and student agency. The student actively assesses their own skill profile ("Am I good enough at Geometry to risk it for double damage?") rather than passively taking whatever question is handed to them.

## 18. Active Reflection (The "Parry" System)
The "Next Button" syndrome is a major risk in EdTech; students often skim feedback just to get back to the game. Feedback must be interactive.
* **The Mechanic:** When the "Solution Scroll" opens after a missed question, the student cannot simply click "Resume." They must type a brief reflection into an input box (e.g., "Where did my logic fail?"). 
* **The Reward:** The LLM quickly evaluates the reflection. If the student accurately identifies their mistake (e.g., "I forgot to distribute the negative sign"), they trigger a "Parry," causing the enemy's next attack to deal zero damage.
* **Educational Value:** Directly satisfies MYP requirements for metacognition and reflection, forcing the student to internalize the feedback to gain a tangible gameplay advantage.

## 19. Fluency vs. Accuracy (The "Overcharge" Timer)
While the base game rewards accuracy, middle school math also requires processing speed (fluency).
* **The Mechanic:** During multiple-choice questions, a visual "Overcharge" bar rapidly depletes over 10 seconds. 
* **The Reward:** If the student answers correctly *before* the bar empties, they trigger an Overcharge attack, dealing 1.5x damage with massive screen shake. If the timer empties, they can still answer the question normally for standard damage.
* **Educational Value:** Introduces a speedrun element for fast thinkers (dopamine hit) without penalizing slower, methodical thinkers who need scratch paper (they still get rewarded for accuracy).

## 20. Social Motivation (The "Bounty" System)
To prevent isolation and leverage the highly social/competitive nature of 11-13 year olds, the game utilizes asynchronous multiplayer.
* **The Mechanic:** Players can spend their earned "Logic Shards" to craft a custom math question. The LLM verifies the question is solvable and mathematically sound. This creates a "Bounty Monster" that is sent to a specific classmate's game.
* **The Reward:** When the classmate logs in, they are attacked by the Bounty Monster. If they defeat it, they win the Shards. If they fail, the sender gets the Shards.
* **Educational Value:** Disguises Peer-to-Peer Assessment as PvP combat. To craft a valid, difficult math question that stumps their friend, the sender must understand the underlying math deeply.

## 21. The Diagnostic Tutorial (The "Sorting Hat" Boss)
The 70/30 Interleaving Algorithm requires data to work, meaning the first few levels of a fresh profile are mathematically "blind."
* **The Mechanic:** Level 1 is a "Rift Guardian" designed to test the player's aura. Instead of standard combat, it rapid-fires 6 quick, low-damage questions—one from each of the primary MYP categories.
* **Educational Value:** Acts as an immediate, hidden diagnostic test. By Level 2, the algorithm has a complete baseline skill profile and can instantly begin targeting the student's weakest subjects, eliminating the "cold start" problem.

---

# Game Requirements Document: Part V (Retrospective — shipped additions)

The following items were **implemented in code** and are recorded here so the specification matches the product. They either extend earlier sections or formalize behavior that was not in the original brief.

## 22. Rubric-to-damage pipeline (combat)
* Combat damage is **not** a single fixed “correct/incorrect” pair. The judge’s `band` maps to **base** HP changes before combo and weapon multipliers. Representative base values (enemy damage / player damage):
  * `correct_with_reasoning` → **25** / 0 (or **40** / 0 when `isCrit` applies).
  * `correct_no_reasoning` → **10** / 0 (“weak hit”).
  * `partial` → **8** / **10** (“glancing”).
  * Otherwise (miss) → 0 / **20** (“spell fizzled”).
* **Combo** (§16) and **cosmetic weapon tier** multiply outgoing damage to the boss when applicable.
* **Boss HP** is fixed per fight design (e.g. 100) so fights last **several** exchanges across criteria A–D.

## 23. Practice mode (non-combat MCQ)
* A separate **Multiple Choice Warm-up** path uses DashScope JSON **MCQ** generation (`type: "mcq"`, four options). It does **not** replace the combat loop; it is optional practice with its own UI overlay.

## 24. Prefetch and question pipeline
* The next combat question is **prefetched** while the player reads feedback. Only **one** prefetch and **one** `loadQuestion` run apply at a time (singleton promises) so rapid clicks do not corrupt `state.nextQuestion`.
* Duplicate stems from the API trigger **retries** or rejection, aligned with §3 anti-repetition.

## 25. Engagement record (retention meta)
* Profiles persist an **engagement** object: e.g. **login streak** counters, **daily quest** completion flags, **streak freeze** allowance, and **milestone** claim state. The map HUD can surface streak / daily lines.
* Logic merges local and cloud engagement defensively (max of counters where appropriate).

## 26. Extended boss content (level 11+)
* Beyond the fixed **10** canonical route nodes, the game may show **additional levels** using **AI-generated** battle and map SVG strings cached per level in `bossCacheByLevel`, validated for a consistent viewBox and safe markup.

## 27. Map UX and audio (client-only)
* The quest map exposes **music and SFX volume** controls; levels persist under an **`audio`** object on the player profile (`musicVolume`, `sfxVolume`, etc.) with merge rules in `js/audioSettings.js`.
* **Boss strike SFX** can vary by canonical level index or by hash of generated boss name for extended levels (`bossStrikeSoundIndex` in `js/combatSfx.js`).

## 28. LLM I/O logging (developer)
* Beyond `debugPrompts`, the app can **log full combat question exchanges** (system + user + raw assistant JSON) to the console for DevTools debugging (`logCombatQuestionLlmExchange` pattern in `main.js`).

## 29. Parry reflection UX (clarification)
* When `requireReflection` is set for a miss, the **Parry Reflection** block is shown and **Continue** stays disabled until the student has typed a **minimum length** of reflection (implemented as a non-trivial character count). Otherwise the reflection panel is hidden and Continue is immediate.

## 30. Offline judge fallback
* If live DashScope grading fails, the game may fall back to a **local heuristic judge** so the battle does not soft-lock (safe bands + explanatory copy).

---

Appendix. How to improve the game even further
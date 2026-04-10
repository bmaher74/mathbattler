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
* **Update / Clarification (Apr 2026):** Combat questions must be **open-ended typed response** (not MCQ). Students submit a final answer *and* reasoning, and the AI judge marks using the MYP-style rubric described below (Criterion A/B/C). MCQ may still exist as a non-combat practice mode, but **not** the primary battle loop.
* **Visual Explanations:** The system must support `Plotly.js` to render dynamic scatter or bar charts inside the feedback window to visually explain complex concepts.
* **Curriculum Constraints (Apr 2026):** Generated problems, explanations, and marking must be **explicitly constrained to IB MYP Year 7/8 scope**, and must use the current game level to set difficulty band (Foundations → Year 7 → Year 8). Out-of-scope topics (e.g., calculus/trigonometry/logarithms/quadratic formula) must be avoided.

## 3. Progression and Retention Algorithm
* **Skill Tracking:** The database strictly tracks `attempts` vs. `corrects` for every MYP topic.
* **Pedagogical Interleaving (The 70/30 Rule):**
  * **70% Retention:** The game calculates the lowest success ratio and explicitly forces the AI to generate questions on the student's weakest topic.
  * **30% Progression:** The game randomly selects an alternative topic to provide spaced repetition and prevent topic fatigue.
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
* **Action Loop:** Combat is driven entirely by math. Correct answers deal 50 damage (Direct Hit!); incorrect answers cause the player to take 25 damage (Miss!).
* **Juice (Game Feel):** * Attacks trigger CSS transform lunges (`animate-attack`).
  * Hits trigger screen shakes and floating red damage numbers (`animate-damage`).
  * Health bars use cubic-bezier transitions for smooth depletion.
* **The Solution Scroll:** If a student misses a question, the battle pauses. A modal overlay forces them to read the "Ideal Logic" (and view any generated graphs) before they are allowed to resume combat.
* **Level Map:** 10 sequential boss fights that unlock progressively.
* **Battle Boss Identity (Apr 2026):** The boss shown in battle must match the level-map boss identity (no parity-based substitution). Battle sprites must remain high-detail; map icons may be simplified, but must not replace battle sprites.
* **Damage Overlay Reset (Apr 2026):** Floating damage text must not persist across questions/levels; damage overlays must be cleared when a new fight/question starts.

## 6. Persistence & Architecture
* **The Vault (Firebase):** Uses Firestore and Anonymous Authentication to silently track user profiles in the background without requiring passwords.
* **Profile Handshake:** Validates the existence of a profile (e.g., "Student Brendan"). If missing, it seeds a fresh profile with Level 1 unlocked and a blank MYP skill tree.
* **Offline Fallback:** If the database fails to connect within 6 seconds, the game seamlessly falls back to local memory so the student can still play.
* **Network Throttling:** Uses Singleton Promises and Exponential Backoff to ensure the AI generation never triggers an HTTP 429 (Rate Limit) error if the user clicks too fast.
* **JSON Schema:** The LLM strictly outputs to a defined JSON object to guarantee the UI never breaks.
  * **Update / Clarification (Apr 2026):** Use `plotly_spec` as a **string** (`""` or a JSON-encoded Plotly spec). Do not promise visuals in prose unless `plotly_spec` is non-empty and valid.
  * **Update / Clarification (Apr 2026):** For open-ended combat questions, use `expected_answer` (and criterion metadata) rather than strict MCQ `options`.


# Game Requirements Document: Part II (Technical Implementation)

## 7. AI Prompt Engineering (The Brain)
The game relies on two distinct LLM calls that must adhere to strict JSON schemas to prevent application crashes.
* **Provider (Apr 2026):** Use Alibaba DashScope (OpenAI-compatible endpoint). Do not depend on Gemini/OpenRouter for production gameplay.

* **The Generator Prompt (Pre-fetching):**
    * **Context Injected:** Current map difficulty (e.g., "Grade 7") and the targeted MYP topic (e.g., "Fractions").
    * **Formatting Constraints:** Instructed to ALWAYS wrap units in `\text{}` for LaTeX compatibility.
    * **Output Schema:** Must return structured JSON (no markdown) and include `plotly_spec` as described above.
    * **Logic (Apr 2026):** Combat generation prioritizes open-ended questions aligned to MYP Criterion A/B/C; the game level and student skill profile must drive difficulty and topic selection.

* **The Pedagogical Evaluator Prompt (Combat Input):**
    * **Context Injected:** The original question, the expected mathematical answer, and the student's raw text input.
    * **Directive:** "Determine if the student's input demonstrates mathematical understanding and arrives at the correct value, even if embedded in conversational text."
    * **Output Schema (Apr 2026):** Must return a rubric-aligned JSON object that includes correctness, a band/score, and feedback that teaches answer structure.
    * **Rubric scope (Apr 2026):** Questions must come from **MYP Criterion A, B, and C**, and marking must follow the same marking scheme (Rubicon-style) used for those criteria.

## 8. The Regression Suite (Self-Healing Anchors)
To prevent LLM "Compression Bias" (where future code updates accidentally erase complex visual details to save tokens), the application runs a continuous integrity check on load.
* **Visuals Test:** The system parses the serialized `ASSETS` object to verify the presence of hyper-specific IDs (e.g., `SLIME_EYE_L`, `STAFF_WHEEL`, `GOLEM_BODY`). If these are missing, the UI flags a Visual Regression.
* **MathJax Test:** Verifies the global window object has successfully loaded the LaTeX rendering engine.
* **Vault Test:** Verifies read/write permissions to the Firestore database.
* **Scroll Integrity:** Verifies the CSS `flex-shrink: 0` property remains on the interaction panel to guarantee MCQ buttons are never pushed off-screen.
* **Prompt Debugging (Apr 2026):** The app must provide a debug switch to output the exact LLM prompt(s) used for generation and grading to the browser console, to make prompt issues diagnosable.

## 9. Database Schema (Firebase Firestore)
The game operates on a NoSQL document database. It uses Anonymous Authentication to bypass login screens while still associating data with the inputted username.

* **Path:** `artifacts/{appId}/public/data/playerProfiles/{playerName}`
* **Data Structure:**
    ```json
    {
      "unlockedLevels": 2,
      "skillProfile": {
        "Algebra & Equations": { "attempts": 5, "corrects": 3 },
        "Fractions, Percentages & Ratios": { "attempts": 2, "corrects": 2 },
        "Geometry & Measurement": { "attempts": 0, "corrects": 0 },
        "Patterns & Sequences": { "attempts": 0, "corrects": 0 },
        "Data & Probability": { "attempts": 0, "corrects": 0 },
        "Real-Life Modeling": { "attempts": 1, "corrects": 0 }
      }
    }
    ```

## 10. The "Black Box" Asset Architecture
To protect high-fidelity graphics from being corrupted during code rewrites, all SVG code is strictly decoupled from the HTML body.
* **Methodology:** SVGs are stored as minified template literals inside a `const ASSETS = {}` dictionary at the top of the script.
* **Rendering:** The game dynamically injects these strings into generic container `div`s (e.g., `<div id="enemy-sprite"></div>`) using `innerHTML` at runtime based on the current level.

## 11. Plotly Integration (Data Visualization)
When the AI generates a question that benefits from visual representation (like statistics or geometry), it populates `plotly_spec`.
* **Trigger:** If `q.plotly_spec` is a non-empty string containing a valid Plotly JSON spec, the UI renders it.
* **Display:** The Solution Scroll modal opens and the game dynamically initializes `Plotly.newPlot()` inside a hidden container, binding the AI’s numeric trace arrays to a scatter or bar chart so the student can interact with the data that explains the concept.
* **Update / Clarification (Apr 2026):** Graphs must be strongly encouraged and, for certain story problems (e.g., marbles/add-sub), the system must ensure a plot appears (retry generation or synthesize a minimal explanatory chart) so the student never sees “imagine a number line” without an actual chart.

# Game Requirements Document: Part III (Engagement & Psychology)
## Target Demographic: Middle School (Ages 11-13, Male-leaning)

## 12. Game Feel & "Juice" (Sensory Feedback)
For this demographic, doing math must feel physically impactful. The UI must react violently to their success.
* **The "Hit Stop" (Hit Pause):** When a student answers a difficult Grade 8 question correctly, the game should freeze for 100 milliseconds before applying the damage. This mimics fighting games (like *Smash Bros*) and makes the "Logic Strike" feel incredibly heavy.
* **Critical Hits:** If a student answers an open-ended text question perfectly *and* provides a great explanation, the AI flags `isCrit: true`. The screen shakes twice as hard, the damage text is yellow instead of red, and the damage is doubled.
* **Dynamic Animations:** Enemies must idle with a breathing animation (`transform: scaleY`). When at low health (< 20%), enemies should blink red and their animations should speed up, signaling to the player to "finish them off."

## 13. Meta-Progression & The Loop
A linear map of 10 bosses isn't enough to keep a 12-year-old coming back. They need a "Meta-Loop" (long-term goals).
* **The Bestiary (Monster Dex):** Once an enemy is defeated, it is added to the "Bestiary." The student can view the SVGs they've unlocked, read lore generated by the LLM, and see the specific math concepts associated with that monster.
* **Loot & Currency:** Defeating enemies drops "Logic Shards" (saved to Firebase). 
* **Cosmetic Upgrades:** Students can spend Shards to upgrade their SVG Avatar.
    * *Example:* 100 Shards changes their generic staff to a "Staff of Geometry" (changes the SVG path). This provides a non-academic reason to grind math questions.

## 14. Tone, Narrative, and Humor
Middle school boys respond poorly to dry, overtly academic tones. They respond incredibly well to slight sarcasm, epic framing, and humor.
* **Enemy Trash Talk:** The AI prompt should instruct the enemy to occasionally "taunt" the player in the UI. 
    * *Example (Fraction Golem):* "Your common denominators are pathetic!"
* **Epic Framing:** Never use words like "Quiz," "Test," or "Study." 
    * "Review your answers" → *"Consult the Solution Scroll."*
    * "Submit Answer" → *"Cast Spell."*
    * "Incorrect" → *"Your spell fizzled against their armor."*

## 15. Disguising Scaffolding as "Power-Ups"
When a student is stuck, they rarely click a button that says "Get a Hint" because it feels like admitting defeat. You must rebrand pedagogical help as tactical gameplay.
* **The "Scan" Ability:** Instead of asking for a hint, the player can click "Analyze Enemy." The AI generates a breakdown of the specific formula needed to beat the monster, presented as a tactical weakness. 
* **The "Health Potion" (Second Chance):** If a student is about to die, they can consume a potion. Instead of just giving HP, the potion gives them an "easier" (stepped-down) version of the question to allow them to recover their momentum.

## 16. The Combo System (Flow State)
To encourage speed and accuracy (fluency), implement a Combo Tracker.
* **The Mechanics:** Answering 3 questions correctly in a row triggers a "Combo State." The background of the battle arena pulses with a blue aura.
* **The Reward:** While in a Combo State, the player deals 1.5x damage. If they get a question wrong, the combo breaks with a glass-shattering sound effect. This taps directly into the arcade-gamer mindset of protecting a "streak."



Appendix.  How to improve the game even futher 

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
why don't we gradiate difficulty across all the levels instead of 3 bands.  would that make the prompt logic too complicated?

You can graduate difficulty across levels; it does not have to explode prompt complexity. The tradeoff is how much you encode in prose vs how much you derive in code.

What you have now (roughly)
buildMypConstraintsBlock and the difficulty strings in buildCombatQuestionUserPrompt use a small number of bands (plus the special case for map level 1). That keeps the user prompt short and stable: the model sees a clear label (“On-ramp”, “Introductory”, “Grade 7”, …) and a bounded list of allowed moves.

Why teams often stop at a few bands
LLMs are noisy: a 11-step rubric in the prompt does not guarantee monotonic difficulty; it often adds length without proportional control.
Diminishing returns: most of the useful signal is “early / mid / late” plus topic + criterion + skill snapshot, not “level 6 vs 7 wording”.
Infinite levels: beyond the fixed route, you generate bosses; a continuous rule (e.g. “difficulty index = f(level)” with caps) in code is cleaner than listing 20+ prose tiers.
Graduating across all levels without messy prompts
The low-complexity pattern is:

Compute a small set of scalar knobs in code (not in the prompt as a wall of text), for example:

numericCeiling (e.g. 30 → 50 → 100 as level rises)
maxStemWords or “max distinct rates / steps”
allowMultiStep boolean threshold
readingAgeHint string from a 4–5 step lookup, not 11 unique paragraphs
Emit 3–6 bullet lines into the prompt built from those knobs, e.g.
- Numbers: prefer ≤ ${n}; avoid …
- At most ${k} conceptual steps in the stem.
That is more levels in the game, but not much more complexity in the prompt structure—just interpolation.

Keep curriculum bands coarse (MYP Year 7 vs 8 scope) while fine-tuning difficulty with the scalars. Curriculum is about what topics exist; difficulty is about how heavy the instance is.

When it does get “too complicated”
When every level has a unique long paragraph of rules (hard to maintain, easy to contradict).
When bands fight each other (“level 9 says X, criterion D says Y, topic Z says …”).
When you duplicate the same idea in five places (system prompt, user prompt, finalize, judge, offline pool).
Practical recommendation
Graduate in code with a few knobs; keep the written band count small (or slightly larger, e.g. 4–5 prose tiers). That gives you smooth progression without a novel in every request. If you want true per-level nuance for levels 1–10 only, a lookup table LEVEL_TUNING[level] in JS is still simple—the complexity lives in data, not in nested if spaghetti inside the prompt string.

So: no, graduating across levels does not inherently make prompt logic too complicated; it becomes complicated only if you try to express all nuance as free-form prose per level instead of structured parameters + short bullets.

I'm in Ask mode, so I can’t edit the repo; if you want a concrete LEVEL_TUNING design wired into buildCombatQuestionUserPrompt, switch to Agent mode and we can implement it

---

## Implemented in repo (graduated knobs)

- **`js/game/levelDifficulty.js`**: `getLevelDifficultyKnobs(mapLevel, { forceEasier })` returns `numericCeiling`, `maxStemWords`, `maxConceptualSteps`, `readingAgeShort`, and `allowMultiStep` (piecewise by map level). `formatDifficultyKnobsPromptBlock` turns that into the **DIFFICULTY SCAFFOLD** paragraph block.
- **`js/ai/prompts/combatQuestionPedagogy.js`**: `buildCombatQuestionUserPrompt` appends that block **before** `buildMypConstraintsBlock` so curriculum bands stay coarse while numbers/stem density graduate by level.
- **Tests**: `test/level-difficulty-knobs.test.mjs` (plus existing pedagogy tests assert the scaffold appears for level 1 prompts).
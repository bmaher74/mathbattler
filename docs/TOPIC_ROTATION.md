# Combat topic rotation (strand scheduling)

How the game chooses the **mathematics strand** (broad syllabus area: Algebra, Geometry, …) and how that relates to **MYP criteria A–D**. It does not describe map levels, enemy names, or shards.

---

## 1. Two independent axes

| Axis | What it controls | Driver | When it advances |
|------|------------------|--------|------------------|
| **MYP criterion** | A–D for each combat question | `turnIndex` (mod 4 → A,B,C,D) | Once per graded **Cast Spell** (after the judge runs) |
| **Strand / topic** | Which canonical syllabus area the math belongs to | `pickBattlePinnedTopic` + `strandRotationSeq` (profile) | **Strand is pinned for the whole battle**; `strandRotationSeq` advances **once per battle start** |

Within one battle, **all questions share the same strand**; the criterion cycles **A → B → C → D** across successive casts.

---

## 2. Canonical strands (fixed order)

`CANONICAL_SKILL_TOPICS` in `js/ai/prompts/combatQuestionPedagogy.js`:

```text
0  Algebra
1  Arithmetic
2  Geometry
3  Fractions & Percent
4  Patterns & Sequences
5  Data & Probability
6  Real-Life Modeling
```

---

## 3. Choosing the strand for the **next battle**

At **`startGame`** (when a fight begins):

1. **`state.turnIndex = 0`** so the first question targets criterion **A**.
2. **`battlePinnedTopic = pickBattlePinnedTopic(skillProfile, strandRotationSeq)`** — deterministic:
   - If any strand has `attempts < SKILL_TOPIC_MIN_SAMPLES` (default 3), pick the **first** such strand in canonical order (exploration / coverage).
   - Else, among strands with `attempts >= 1`, pick the strand with the **lowest** success ratio `corrects / attempts` (ties: first in canonical order).
   - Else use **`CANONICAL_SKILL_TOPICS[strandRotationSeq % 7]`** (rotation slot).
3. **`strandRotationSeq += 1`** and persist (local + cloud sync as today).

There is **no** random 78/22 “retention gate” for strand choice anymore; weakness and coverage are handled in **`pickBattlePinnedTopic`**.

**In-battle prompts** pass `pinnedTopic: battlePinnedTopic` so every LLM question in that fight uses the same `topic_category`. **`strandRotationSeq` does not change** when building combat prompts mid-fight or during prefetch.

---

## 4. Skill profile

`state.skillProfile` holds per-topic `attempts` and `corrects` for canonical labels.

**Updates:** `recordCombatSkillOutcome` in `js/main.js` after a graded cast (canonicalize `topic_category`, increment attempts, increment corrects on strong judge bands).

**Prefetch on the map** uses `battlePinnedTopic === null` and the same **`pickBattlePinnedTopic(skillProfile, strandRotationSeq)`** logic as the next battle would (no pin), so buffered questions match the upcoming battle topic when `strandRotationSeq` is unchanged.

---

## 5. Criterion A–D and prefetch

`buildCombatQuestionUserPrompt` receives **`turnIndex`** (any non-negative integer; criterion = `turnIndex % 4`).

- When loading the **current** question, the prompt uses **`criterionTurnIndex = state.turnIndex`**.
- When **prefetching the next** question after showing the current one, use **`criterionTurnIndex = state.turnIndex + 1`** so the buffered question matches the criterion after the next cast.

---

## 6. Strand shape

`strandShapeRequirement(chosenTopic)` keeps the math aligned with the strand (see pedagogy module).

---

## 7. Prompt bundle metadata (`buildCombatQuestionUserPrompt`)

| Field | Role |
|-------|------|
| `chosenTopic` | Strand label for `topic_category` |
| `targetCriterion` | A/B/C/D from `turnIndex` |
| `nextStrandRotationSeq` | Same as input `strandRotationSeq` (no increment in the builder) |
| `meta.rotationTopic` | `CANONICAL[strandSeq % 7]` |
| `meta.battlePinned` | Whether `pinnedTopic` was set |

---

## 8. Files

| File | Responsibility |
|------|----------------|
| `js/ai/prompts/combatQuestionPedagogy.js` | `CANONICAL_SKILL_TOPICS`, `pickBattlePinnedTopic`, `criterionFocusBlock`, `buildCombatQuestionUserPrompt`, `strandShapeRequirement` |
| `js/main.js` | `startGame` (pin + `strandRotationSeq`), `buildMathQuestionPrompt`, `recordCombatSkillOutcome`, prefetch criterion index |
| `js/state.js` | `battlePinnedTopic`, `strandRotationSeq`, `turnIndex` |

CLI tools (e.g. `scripts/validate-llm.mjs`) should pass `pinnedTopic: null` and a realistic `strandRotationSeq` / `skillProfile` to match map prefetch behaviour.

## Manual test plan (Math Battler)

### Setup
- **No Firebase**: Ensure `firebase-config.js` is missing/empty or points to invalid config, then reload.
- **With Firebase**: Configure `firebase-config.js` and ensure Firestore rules allow the profile path.
- **No AI**: Ensure `ai-config.js` has `window.__dashscope_api_key = ""`.
- **With AI**: Set a valid DashScope key (and optional same-origin proxy via `__dashscope_chat_completions_url`).

### Smoke tests
- **Integrity strip**: Confirm `VISUALS`, `MATHJAX`, `SCROLL` show PASS; `AI` shows SKIP/PASS depending on key; `PROMPTS` toggles with `?debugPrompts=1`.
- **Login**: Enter a name, start adventure.

### Core gameplay loop
- **Battle question**: Start level 1. Confirm battle uses **typed open-ended** response (textarea + “Cast Spell”).
- **Solution Scroll gate**: Intentionally answer wrong; confirm Solution overlay blocks progress until “Continue”. Confirm damage numbers clear on next question.
- **Plotly**: Get a quantity-story question (or force one via repeated retries). Confirm Plotly chart appears when required.

### Judge + crit/juice
- **Banding**: Submit (a) wrong (b) partial reasoning (c) correct no reasoning (d) correct with reasoning. Confirm feedback changes.
- **Critical hit**: Submit a strong, complete explanation on a harder level; confirm “CRITICAL HIT!” and doubled damage (100).
- **Hit stop**: On level 7+ correct_with_reasoning (or crit), confirm damage application feels delayed slightly (\(~100ms\)).
- **Combo**: Answer 3 in a row correctly; confirm combo badge appears and subsequent damage is boosted (1.5×). Miss once to break combo.
- **Low HP enemy**: Bring enemy below 20% HP; confirm sprite blinking/intensified animation.

### Scan / Potion / Parry reflection
- **Analyze Enemy**: Click “Analyze Enemy”; confirm hint appears (AI or fallback) and you can continue.
- **Potion**: Let your HP drop near 0, then miss; confirm potion prevents defeat once per battle and next question becomes easier.
- **Parry reflection**: After incorrect/partial, confirm reflection input appears and Continue is disabled until you type. If reflection judged “good”, next incoming player damage should be reduced to 0 once.

### Meta progression
- **Logic Shards**: Win a fight; confirm shards increase and show on map header.
- **Bestiary**: Open Bestiary; confirm defeated boss appears with SVG preview.
- **Upgrades**: Spend shards on cosmetic upgrade; confirm wizard sprite changes and shards decrease.
- **Persistence**: Reload the page; confirm unlocked levels, shards, bestiary, cosmetics persist (local and/or Firestore).

### Infinite levels (>10)
- **Unlock to 10**: Progress to level 10 and win.
- **Level 11+ appears**: Confirm map shows levels beyond 10. They should initially show placeholders, then fill in when generated.
- **Generated boss**: Start level 11. Confirm boss has unique name + portrait + battle sprite. Reload and confirm it persists.


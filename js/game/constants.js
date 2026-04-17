/** Boss fight length tuning: ~four solid hits at base damage to win (criterion A–D pacing). */
export const COMBAT_BOSS_HP = 100;
export const COMBAT_COMBO_MULT = 1.25;

/** Map layout (viewBox coords): level 1 at top, higher levels lower on the page. */
export const QUEST_ROUTE = [
    { x: 180, y: 142, name: "Algebra Slime", blurb: "Variables & expressions", hue: "#22c55e" },
    { x: 92, y: 232, name: "Fraction Golem", blurb: "Parts & wholes", hue: "#ea580c" },
    { x: 268, y: 322, name: "Percentile Parasite", blurb: "Percent & change", hue: "#fb7185" },
    { x: 88, y: 412, name: "Fibonacci Serpent", blurb: "Patterns & rules", hue: "#34d399" },
    { x: 272, y: 502, name: "Geo-Dragon", blurb: "Shapes & coordinates", hue: "#c4b5fd" },
    { x: 96, y: 592, name: "Matrix Minotaur", blurb: "Systems & structure", hue: "#fdba74" },
    { x: 264, y: 682, name: "Probability Wraith", blurb: "Chance & data", hue: "#93c5fd" },
    { x: 100, y: 772, name: "Velocity Vanguard", blurb: "Modeling & rates", hue: "#fde68a" },
    { x: 260, y: 852, name: "Axiom Sentinel", blurb: "Truth & precision", hue: "#facc15" },
    { x: 180, y: 932, name: "Logic Leviathan", blurb: "Final trial", hue: "#a5b4fc" }
];

// --- ENGAGEMENT / RETENTION (participation shards, streaks, daily quest) ---
export const EP_SHARD_LOSS_BATTLE = 5;
export const EP_SHARD_FIRST_CAST = 2;
export const EP_SHARD_PRACTICE = 1;
export const EP_PRACTICE_DAILY_CAP = 8;
export const EP_SHARD_REFLECTION = 3;
export const EP_SHARD_DAILY_QUEST_BATTLE = 5;
export const EP_SHARD_LOGIN = 2;
export const EP_STREAK_MILESTONE_SHARDS = { 3: 8, 7: 20, 14: 40 };

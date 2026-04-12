/**
 * Hero cosmetic evolution (Pokémon-style stages I–V). Cumulative SVG layers over the base wizard.
 */

export const MAX_COSMETIC_TIER = 5;

/** Sequential purchases only: tier 1 … tier 5. Costs scale with stage. */
export const COSMETIC_EVOLUTION_OPTIONS = [
    {
        tier: 1,
        cost: 100,
        stage: "I",
        title: "Initiate Glyph",
        desc: "A faint sigil awakens; the staff head catches a sharper edge (+8% damage)."
    },
    {
        tier: 2,
        cost: 200,
        stage: "II",
        title: "Scholar Aura",
        desc: "Golden focus in the orb; strikes hit harder (+16% damage)."
    },
    {
        tier: 3,
        cost: 350,
        stage: "III",
        title: "Theorem Mantle",
        desc: "A blade of pure symbol atop the staff (+25% damage)."
    },
    {
        tier: 4,
        cost: 500,
        stage: "IV",
        title: "Axiom Wings",
        desc: "Twin prongs channel theorems; foes feel it (+34% damage)."
    },
    {
        tier: 5,
        cost: 750,
        stage: "V",
        title: "Grand Convergence",
        desc: "Crown and prism burst — maximum forged power (+44% damage)."
    }
];

/**
 * @param {number} tier 1–5 (cumulative layers)
 * @returns {string} SVG fragment: defs + groups (no outer &lt;svg&gt;)
 */
export function buildCosmeticEvolutionExtra(tier) {
    const t = Math.min(MAX_COSMETIC_TIER, Math.max(0, Math.floor(tier)));
    if (t <= 0) return "";

    const defs = `<defs>
    <filter id="mbEvoGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="mbEvoCore" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#a78bfa" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#312e81" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

    /** Stage I — soft indigo ring + four-point star (first evolution). */
    const g1 = `<g class="evo-stage-1" opacity="0.88" filter="url(#mbEvoGlow)">
    <circle cx="50" cy="54" r="40" fill="none" stroke="#a5b4fc" stroke-width="2.2" opacity="0.5"/>
    <polygon points="50,6 55,24 74,26 60,40 65,58 50,48 35,58 40,40 26,26 45,24" fill="#6366f1" opacity="0.2"/>
  </g>`;

    /** Stage II — gold inner ring + orbit sparks. */
    const g2 = `<g class="evo-stage-2" opacity="0.9">
    <circle cx="50" cy="54" r="33" fill="none" stroke="#fbbf24" stroke-width="1.8" opacity="0.5"/>
    <circle cx="50" cy="54" r="26" fill="none" stroke="#c4b5fd" stroke-width="1.2" opacity="0.35"/>
    <circle cx="24" cy="58" r="2.8" fill="#fde68a" opacity="0.65"/>
    <circle cx="76" cy="58" r="2.8" fill="#fde68a" opacity="0.65"/>
    <circle cx="50" cy="22" r="2.2" fill="#fcd34d" opacity="0.55"/>
  </g>`;

    /** Stage III — “rune” arcs (∫ / ∑ inspired strokes). */
    const g3 = `<g class="evo-stage-3" opacity="0.88">
    <path d="M22 38 Q30 28 38 38 T54 38" fill="none" stroke="#34d399" stroke-width="2" opacity="0.45" stroke-linecap="round"/>
    <path d="M78 38 Q70 28 62 38 T46 38" fill="none" stroke="#34d399" stroke-width="2" opacity="0.45" stroke-linecap="round"/>
    <path d="M32 72 C40 64 44 68 50 70 C56 68 60 64 68 72" fill="none" stroke="#60a5fa" stroke-width="2.2" opacity="0.4" stroke-linecap="round"/>
    <text x="44" y="30" font-size="11" font-weight="900" fill="#94a3b8" opacity="0.35" font-family="system-ui,sans-serif">∑</text>
    <text x="52" y="78" font-size="10" font-weight="900" fill="#94a3b8" opacity="0.3" font-family="system-ui,sans-serif">∫</text>
  </g>`;

    /** Stage IV — wing-like curves (proof takes flight). */
    const g4 = `<g class="evo-stage-4" opacity="0.85">
    <path d="M18 48 C8 38 6 58 14 68 C18 52 22 44 28 40" fill="none" stroke="#c084fc" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
    <path d="M82 48 C92 38 94 58 86 68 C82 52 78 44 72 40" fill="none" stroke="#c084fc" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
    <path d="M20 76 Q50 62 80 76" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.35"/>
  </g>`;

    /** Stage V — crown arc + prism rays + core bloom (final evolution). */
    const g5 = `<g class="evo-stage-5" opacity="0.92">
    <circle cx="50" cy="54" r="44" fill="url(#mbEvoCore)" opacity="0.55"/>
    <path d="M32 14 L36 22 L44 18 L50 10 L56 18 L64 22 L68 14 L64 26 L50 24 L36 26 Z" fill="#fde047" fill-opacity="0.35" stroke="#facc15" stroke-width="1" stroke-opacity="0.55"/>
    <line x1="50" y1="4" x2="50" y2="14" stroke="#fef08a" stroke-width="2" opacity="0.55"/>
    <line x1="28" y1="12" x2="34" y2="18" stroke="#fde047" stroke-width="1.5" opacity="0.45"/>
    <line x1="72" y1="12" x2="66" y2="18" stroke="#fde047" stroke-width="1.5" opacity="0.45"/>
    <line x1="14" y1="44" x2="22" y2="48" stroke="#a78bfa" stroke-width="1.5" opacity="0.4"/>
    <line x1="86" y1="44" x2="78" y2="48" stroke="#a78bfa" stroke-width="1.5" opacity="0.4"/>
  </g>`;

    const parts = [defs];
    if (t >= 1) parts.push(g1);
    if (t >= 2) parts.push(g2);
    if (t >= 3) parts.push(g3);
    if (t >= 4) parts.push(g4);
    if (t >= 5) parts.push(g5);
    return parts.join("");
}

/**
 * @param {number} tier
 * @returns {string} Display title for celebration / UI
 */
export function cosmeticEvolutionTitle(tier) {
    const t = Math.min(MAX_COSMETIC_TIER, Math.max(1, Math.floor(tier || 1)));
    const o = COSMETIC_EVOLUTION_OPTIONS.find((x) => x.tier === t);
    return o ? o.title : "Evolution";
}

/** Damage multiplier vs bosses from forged staff tier (tier 0 = 1.0). */
export function weaponDamageMultiplier(tier) {
    const t = Math.min(MAX_COSMETIC_TIER, Math.max(0, Math.floor(typeof tier === "number" ? tier : 0)));
    const table = [1, 1.08, 1.16, 1.25, 1.34, 1.44];
    return table[t] ?? 1;
}

/**
 * Extra SVG on top of the base wizard staff (viewBox matches assets wizard): bigger head, prongs, glow.
 * Cumulative for tiers 1–5.
 */
export function buildHeroWeaponOverlay(tier) {
    const t = Math.min(MAX_COSMETIC_TIER, Math.max(0, Math.floor(typeof tier === "number" ? tier : 0)));
    if (t <= 0) return "";

    const w1 = `<g class="hero-weapon-t1" opacity="0.9">
    <circle cx="84" cy="12" r="28" fill="none" stroke="#22d3ee" stroke-width="1.4" opacity="0.65"/>
    <circle cx="84" cy="12" r="24" fill="none" stroke="#67e8f9" stroke-width="0.8" opacity="0.4" stroke-dasharray="4 3"/>
  </g>`;

    const w2 = `<g class="hero-weapon-t2" opacity="0.95">
    <circle cx="84" cy="12" r="5.5" fill="#fef08a" opacity="0.92"/>
    <circle cx="84" cy="12" r="2.8" fill="#fff" opacity="0.85"/>
  </g>`;

    const w3 = `<g class="hero-weapon-t3" opacity="0.92">
    <polygon points="84,-6 88,4 84,10 80,4" fill="#e879f9" stroke="#f0abfc" stroke-width="0.8" opacity="0.9"/>
    <polygon points="84,-2 92,8 84,14 76,8" fill="#a855f7" opacity="0.35"/>
  </g>`;

    const w4 = `<g class="hero-weapon-t4" opacity="0.88">
    <line x1="72" y1="8" x2="62" y2="4" stroke="#c084fc" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
    <line x1="96" y1="8" x2="106" y2="4" stroke="#c084fc" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
    <circle cx="62" cy="4" r="3" fill="#ddd6fe" opacity="0.55"/>
    <circle cx="106" cy="4" r="3" fill="#ddd6fe" opacity="0.55"/>
  </g>`;

    const w5 = `<g class="hero-weapon-t5" opacity="0.95">
    <polygon points="84,-14 90,-2 84,4 78,-2" fill="#fde047" opacity="0.55"/>
    <line x1="84" y1="-12" x2="84" y2="22" stroke="#facc15" stroke-width="5" stroke-linecap="round" opacity="0.35"/>
    <line x1="70" y1="12" x2="98" y2="12" stroke="#fbbf24" stroke-width="2" opacity="0.45"/>
    <polygon points="84,12 94,22 84,32 74,22" fill="#f59e0b" opacity="0.4"/>
  </g>`;

    const parts = [];
    if (t >= 1) parts.push(w1);
    if (t >= 2) parts.push(w2);
    if (t >= 3) parts.push(w3);
    if (t >= 4) parts.push(w4);
    if (t >= 5) parts.push(w5);
    return `<g id="HERO_WEAPON_EVOLUTION">${parts.join("")}</g>`;
}

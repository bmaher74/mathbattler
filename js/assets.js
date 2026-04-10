// Assets are anchored with specific IDs for regression tests to monitor detail levels.
export const ASSETS = {
    wizard: `<svg viewBox="10 -12 100 106" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_10px_20px_rgba(59,130,246,0.6)]" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <radialGradient id="wizCloak" cx="50%" cy="20%" r="80%">
                            <stop offset="0" stop-color="#1d4ed8" stop-opacity="0.95"/>
                            <stop offset="1" stop-color="#0b1024" stop-opacity="1"/>
                        </radialGradient>
                        <radialGradient id="wizGlow" cx="50%" cy="50%" r="60%">
                            <stop offset="0" stop-color="#a78bfa" stop-opacity="0.95"/>
                            <stop offset="1" stop-color="#7c3aed" stop-opacity="0.05"/>
                        </radialGradient>
                    </defs>
                    <circle cx="50" cy="54" r="38" fill="url(#wizGlow)" opacity="0.55"/>
                    <path d="M 50 18 L 16 92 L 84 92 Z" fill="url(#wizCloak)" stroke="#60a5fa" stroke-width="2.2"/>
                    <path d="M 30 92 L 50 42 L 70 92 Z" fill="#0b1024" opacity="0.9"/>
                    <path d="M 50 4 C 22 4 22 48 50 48 C 78 48 78 4 50 4 Z" fill="#2563eb" stroke="#93c5fd" stroke-width="1.2"/>
                    <circle id="WIZARD_FACE" cx="50" cy="25" r="10.5" fill="#0b1024" opacity="0.95"/>
                    <polygon points="41,25 46,22 46,28" fill="#60a5fa" class="animate-pulse"/>
                    <polygon points="59,25 54,22 54,28" fill="#60a5fa" class="animate-pulse"/>
                    <path d="M22 34 Q50 18 78 34" fill="none" stroke="#a78bfa" stroke-width="2" opacity="0.45"/>
                    <g opacity="0.6">
                        <polygon points="18,70 26,62 34,70 26,78" fill="#60a5fa" opacity="0.25"/>
                        <polygon points="66,70 74,62 82,70 74,78" fill="#a78bfa" opacity="0.25"/>
                        <polygon points="46,60 50,52 54,60 50,68" fill="#93c5fd" opacity="0.25"/>
                    </g>
                    <line x1="84" y1="12" x2="60" y2="92" stroke="#8b5cf6" stroke-width="4.2" stroke-linecap="round"/>
                    <g id="STAFF_WHEEL" style="transform-origin: 84px 12px;" class="animate-[spin_8s_linear_infinite]">
                        <circle cx="84" cy="12" r="23" fill="none" stroke="#d8b4fe" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.7"/>
                        <circle cx="84" cy="12" r="11" fill="none" stroke="#c4b5fd" stroke-width="1" opacity="0.7"/>
                        <circle cx="84" cy="12" r="6.5" fill="#f3e8ff" opacity="0.9"/>
                        <polygon points="84,-9 90,12 84,33 78,12" fill="#a855f7" opacity="0.85"/>
                        <polygon points="84,1 96,12 84,23 72,12" fill="#7c3aed" opacity="0.28"/>
                    </g>
                </svg>`,
    slime: `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="slimeCore" cx="50%" cy="35%" r="70%">
                            <stop offset="0" stop-color="#86efac" stop-opacity="0.95"/>
                            <stop offset="1" stop-color="#16a34a" stop-opacity="0.95"/>
                        </radialGradient>
                        <radialGradient id="slimeShadow" cx="50%" cy="80%" r="70%">
                            <stop offset="0" stop-color="#052e16" stop-opacity="0.9"/>
                            <stop offset="1" stop-color="#052e16" stop-opacity="0"/>
                        </radialGradient>
                    </defs>
                    <ellipse cx="50" cy="86" rx="34" ry="10" fill="url(#slimeShadow)" opacity="0.65"/>
                    <path d="M 14 78 Q 6 94 22 95 Q 30 107 40 95 Q 50 106 60 95 Q 70 107 78 95 Q 94 94 86 78 Z" fill="#064e3b" opacity="0.95"/>
                    <path d="M 14 78 C 6 28 30 3 50 3 C 70 3 94 28 86 78 Z" fill="url(#slimeCore)" stroke="#4ade80" stroke-width="2.2" opacity="0.98"/>
                    <path d="M 22 70 C 22 40 38 20 50 18 C 62 20 78 40 78 70 Q 64 64 50 66 Q 36 64 22 70 Z" fill="#14532d" opacity="0.25"/>
                    <path d="M 28 26 Q 40 16 52 18" fill="none" stroke="#bbf7d0" stroke-width="2" opacity="0.35"/>
                    <g opacity="0.55">
                        <text x="20" y="58" font-family="monospace" font-size="9" font-weight="700" fill="#bbf7d0">x+y</text>
                        <text x="68" y="62" font-family="monospace" font-size="9" font-weight="700" fill="#bbf7d0">2x</text>
                        <text x="44" y="86" font-family="monospace" font-size="8" font-weight="700" fill="#86efac" opacity="0.8">x≠y</text>
                    </g>
                    <polygon points="34,34 46,34 49,47 40,53 31,47" fill="#052e16" opacity="0.95"/>
                    <polygon points="66,34 54,34 51,47 60,53 69,47" fill="#052e16" opacity="0.95"/>
                    <circle id="SLIME_EYE_L" cx="40" cy="41" r="4.2" fill="#bef264" class="animate-pulse" style="filter: drop-shadow(0 0 6px #bef264)"/>
                    <circle id="SLIME_EYE_R" cx="60" cy="41" r="4.2" fill="#bef264" class="animate-pulse" style="filter: drop-shadow(0 0 6px #bef264)"/>
                    <path d="M 40 60 Q 50 66 60 60" fill="none" stroke="#052e16" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
                    <text id="AMBIENT_MATH" x="30" y="22" fill="#86efac" font-size="10" font-weight="900" opacity="0.45">x + y</text>
                </svg>`,
    golem: `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="golemStone" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#7c2d12"/>
                            <stop offset="1" stop-color="#431407"/>
                        </linearGradient>
                        <radialGradient id="golemCoreGlow" cx="50%" cy="50%" r="60%">
                            <stop offset="0" stop-color="#fde047" stop-opacity="0.95"/>
                            <stop offset="1" stop-color="#f97316" stop-opacity="0.15"/>
                        </radialGradient>
                    </defs>
                    <rect id="GOLEM_BODY" x="18" y="9" width="64" height="82" rx="6" fill="url(#golemStone)" stroke="#ea580c" stroke-width="3.2"/>
                    <path d="M18 30 H82" stroke="#9a3412" stroke-width="3" opacity="0.7"/>
                    <path d="M18 52 H82" stroke="#9a3412" stroke-width="3" opacity="0.7"/>
                    <path d="M18 74 H82" stroke="#9a3412" stroke-width="3" opacity="0.7"/>
                    <g opacity="0.5">
                        <path d="M26 14 L30 30 L22 34 Z" fill="#1c1917"/>
                        <path d="M78 20 L70 40 L86 42 Z" fill="#1c1917"/>
                        <path d="M26 88 L40 74 L44 92 Z" fill="#1c1917"/>
                    </g>

                    <circle cx="50" cy="56" r="16" fill="url(#golemCoreGlow)" opacity="0.9"/>
                    <rect id="GOLEM_FRACTION_L" x="23" y="14" width="25" height="38" fill="#f97316" stroke="#fff" stroke-width="1.2" opacity="0.92"/>
                    <rect id="GOLEM_FRACTION_R" x="52" y="14" width="25" height="38" fill="#ea580c" stroke="#fff" stroke-width="1.2" opacity="0.92"/>
                    <text x="35.5" y="28" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">1</text>
                    <line x1="29" y1="32" x2="42" y2="32" stroke="#fff" stroke-width="2"/>
                    <text x="35.5" y="46" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">4</text>
                    <text x="50" y="41" font-size="16" fill="#fff" text-anchor="middle" font-weight="900">+</text>
                    <text x="64.5" y="28" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">1</text>
                    <line x1="58" y1="32" x2="71" y2="32" stroke="#fff" stroke-width="2"/>
                    <text x="64.5" y="46" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">4</text>
                    <text id="GOLEM_RESULT" x="50" y="82" font-family="system-ui,sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">2/4 = 1/2</text>

                    <path d="M28 26 Q36 20 44 26" fill="none" stroke="#111827" stroke-width="2" opacity="0.7"/>
                    <path d="M56 26 Q64 20 72 26" fill="none" stroke="#111827" stroke-width="2" opacity="0.7"/>
                    <circle id="GOLEM_EYE_L" cx="36" cy="28" r="2.2" fill="#fde047" class="animate-pulse"/>
                    <circle id="GOLEM_EYE_R" cx="64" cy="28" r="2.2" fill="#fde047" class="animate-pulse"/>
                    <path d="M38 66 Q50 72 62 66" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
                </svg>`
};

/**
 * Full-detail boss sprites for battle (viewBox 0 0 100 100).
 * Map nodes intentionally use `mapBossPortrait()` which is compact and icon-like.
 */
export const BOSS_ASSETS = [
    // 1) Algebra Slime (weaponized variables)
    ASSETS.slime,
    // 2) Fraction Golem (ruined siege-juggernaut)
    ASSETS.golem,
    // 3) Percentile Parasite (percent/ratio predator)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(190,18,60,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="paraCore" cx="50%" cy="45%" r="60%">
                        <stop offset="0" stop-color="#fb7185" stop-opacity="0.95"/>
                        <stop offset="1" stop-color="#881337" stop-opacity="0.95"/>
                    </radialGradient>
                </defs>
                <g opacity="0.55">
                    <circle cx="50" cy="86" r="10" fill="#450a0a" opacity="0.5"/>
                </g>
                <g id="PARASITE_LEGS" opacity="0.95">
                    <line x1="50" y1="52" x2="10" y2="22" stroke="#be123c" stroke-width="4" stroke-linecap="round"/>
                    <line x1="50" y1="52" x2="90" y2="22" stroke="#be123c" stroke-width="4" stroke-linecap="round"/>
                    <line x1="50" y1="52" x2="16" y2="72" stroke="#be123c" stroke-width="4" stroke-linecap="round"/>
                    <line x1="50" y1="52" x2="84" y2="72" stroke="#be123c" stroke-width="4" stroke-linecap="round"/>
                    <line x1="50" y1="52" x2="34" y2="92" stroke="#be123c" stroke-width="4" stroke-linecap="round"/>
                    <line x1="50" y1="52" x2="66" y2="92" stroke="#be123c" stroke-width="4" stroke-linecap="round"/>
                </g>
                <circle id="PARASITE_CORE" cx="50" cy="52" r="16" fill="url(#paraCore)" stroke="#fecdd3" stroke-width="2"/>
                <circle cx="43" cy="48" r="3" fill="#0b1024"/>
                <circle cx="57" cy="48" r="3" fill="#0b1024"/>
                <text x="50" y="61" font-size="16" font-weight="900" fill="#fff1f2" text-anchor="middle">%</text>
                <path d="M40 68 Q50 74 60 68" fill="none" stroke="#fff1f2" stroke-width="2" opacity="0.65"/>
            </svg>`,
    // 4) Fibonacci Serpent (patterns/sequences)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(5,150,105,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="serpScale" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#065f46"/>
                        <stop offset="1" stop-color="#022c22"/>
                    </linearGradient>
                </defs>
                <path d="M20 78 C 26 42 44 24 60 22 C 78 20 90 36 82 50 C 76 62 56 62 46 56 C 34 48 34 34 46 28" fill="none" stroke="url(#serpScale)" stroke-width="12" stroke-linecap="round" opacity="0.9"/>
                <path id="FIBONACCI_SPIRAL" d="M 50 50 Q 70 30 80 60 T 40 80 T 20 40 T 70 10" fill="none" stroke="#34d399" stroke-width="4" opacity="0.85"/>
                <polygon points="74,20 88,26 78,36" fill="#10b981" opacity="0.9"/>
                <polygon points="78,28 88,26 84,38" fill="#047857" opacity="0.8"/>
                <polygon points="74,20 80,28 70,28" fill="#022c22" opacity="0.95"/>
                <polygon id="SERPENT_EYE" points="75,15 80,10 85,15" fill="#34d399" class="animate-pulse"/>
                <path d="M74 34 L86 34" stroke="#d1fae5" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
                <text x="30" y="26" font-family="monospace" font-size="9" font-weight="900" fill="#a7f3d0" opacity="0.75">1,1,2,3,5…</text>
            </svg>`,
    // 5) Geo-Dragon (polygons/compass/cartesian)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(147,51,234,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="geoWing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#4c1d95" stop-opacity="0.95"/>
                        <stop offset="1" stop-color="#1f103f" stop-opacity="0.95"/>
                    </linearGradient>
                </defs>
                <polygon points="12,52 34,30 40,58 22,72" fill="url(#geoWing)" stroke="#c4b5fd" stroke-width="1.5" opacity="0.9"/>
                <polygon points="88,52 66,30 60,58 78,72" fill="url(#geoWing)" stroke="#c4b5fd" stroke-width="1.5" opacity="0.9"/>
                <polygon points="22,72 40,58 50,82 30,88" fill="#2e1065" opacity="0.75"/>
                <polygon points="78,72 60,58 50,82 70,88" fill="#2e1065" opacity="0.75"/>
                <polygon points="34,30 50,22 66,30 60,58 40,58" fill="#2e1065" stroke="#e9d5ff" stroke-width="2" opacity="0.95"/>
                <polygon id="GEO_CORE" points="50,20 65,30 65,55 50,65 35,55 35,30" fill="#9333ea" stroke="#f3e8ff" stroke-width="2"/>
                <circle cx="46" cy="40" r="3" fill="#0b1024"/>
                <circle cx="54" cy="40" r="3" fill="#0b1024"/>
                <path d="M44 48 Q50 52 56 48" fill="none" stroke="#f3e8ff" stroke-width="2" opacity="0.8"/>
                <path d="M22 44 H78" stroke="#a78bfa" stroke-width="1.2" opacity="0.35"/>
                <path d="M50 18 V88" stroke="#a78bfa" stroke-width="1.2" opacity="0.35"/>
                <text x="50" y="14" font-family="monospace" font-size="9" font-weight="900" fill="#ddd6fe" text-anchor="middle">x,y</text>
            </svg>`,
    // 6) Matrix Minotaur (systems/equations feel without out-of-scope math)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(154,52,18,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <polyline id="MATRIX_BRACKET_L" points="30,20 20,20 20,80 30,80" fill="none" stroke="#9a3412" stroke-width="4"/>
                <polyline id="MATRIX_BRACKET_R" points="70,20 80,20 80,80 70,80" fill="none" stroke="#9a3412" stroke-width="4"/>
                <path id="MINOTAUR_HORNS" d="M 35 30 Q 50 10 65 30" fill="none" stroke="#fdba74" stroke-width="3"/>
                <rect x="30" y="26" width="40" height="58" rx="6" fill="#451a03" stroke="#fdba74" stroke-width="2"/>
                <g opacity="0.75">
                    <path d="M36 40 H64" stroke="#fef3c7" stroke-width="2"/>
                    <path d="M36 50 H64" stroke="#fef3c7" stroke-width="2" opacity="0.8"/>
                    <path d="M36 60 H64" stroke="#fef3c7" stroke-width="2" opacity="0.65"/>
                    <path d="M36 70 H64" stroke="#fef3c7" stroke-width="2" opacity="0.5"/>
                </g>
                <circle cx="42" cy="44" r="3.2" fill="#fde047"/>
                <circle cx="58" cy="44" r="3.2" fill="#fde047"/>
                <path d="M42 56 Q50 62 58 56" fill="none" stroke="#fef3c7" stroke-width="2" opacity="0.9"/>
                <text x="50" y="84" font-family="monospace" font-size="9" font-weight="900" fill="#fdba74" text-anchor="middle">[ ]</text>
            </svg>`,
    // 7) Probability Wraith (data/probability)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(96,165,250,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 84 C 20 56 32 30 50 28 C 68 30 80 56 80 84 Q 66 78 50 80 Q 34 78 20 84 Z" fill="#0b1024" opacity="0.85" stroke="#93c5fd" stroke-width="2"/>
                <path id="WRAITH_BELL_CURVE" d="M 10 90 Q 50 10 90 90" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.6"/>
                <rect id="DICE_CORE" x="40" y="36" width="20" height="20" rx="3" fill="#1e3a8a" stroke="#bfdbfe" stroke-width="2"/>
                <circle cx="46" cy="42" r="1.6" fill="#e0f2fe"/>
                <circle cx="54" cy="50" r="1.6" fill="#e0f2fe"/>
                <circle cx="46" cy="58" r="1.6" fill="#e0f2fe"/>
                <circle cx="54" cy="58" r="1.6" fill="#e0f2fe"/>
                <circle cx="44" cy="50" r="3" fill="#0b1024"/>
                <circle cx="56" cy="50" r="3" fill="#0b1024"/>
                <path d="M44 60 Q50 64 56 60" fill="none" stroke="#bfdbfe" stroke-width="2" opacity="0.8"/>
                <g opacity="0.6">
                    <circle cx="18" cy="40" r="2.2" fill="#bfdbfe"/>
                    <circle cx="82" cy="44" r="2.2" fill="#bfdbfe"/>
                    <circle cx="22" cy="62" r="2.2" fill="#bfdbfe"/>
                    <circle cx="78" cy="66" r="2.2" fill="#bfdbfe"/>
                </g>
            </svg>`,
    // 8) Velocity Vanguard (real-life modeling)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(252,211,77,0.45)]" xmlns="http://www.w3.org/2000/svg">
                <polygon id="VECTOR_SHIELD" points="30,40 50,30 70,40 50,80" fill="#374151" stroke="#9ca3af" stroke-width="2"/>
                <line id="VELOCITY_SPEAR" x1="10" y1="90" x2="90" y2="10" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
                <rect x="32" y="34" width="36" height="46" rx="6" fill="#0b1024" opacity="0.85" stroke="#9ca3af" stroke-width="2"/>
                <circle cx="44" cy="48" r="3" fill="#fcd34d"/>
                <circle cx="56" cy="48" r="3" fill="#fcd34d"/>
                <path d="M40 66 Q50 72 60 66" fill="none" stroke="#fcd34d" stroke-width="2" opacity="0.8"/>
                <path d="M18 84 Q50 62 82 84" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
                <text x="50" y="28" font-family="monospace" font-size="9" font-weight="900" fill="#fde68a" text-anchor="middle">v=d/t</text>
            </svg>`,
    // 9) Axiom Sentinel (calm, terrifying logic)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(234,179,8,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="axiomGlow" cx="50%" cy="50%" r="60%">
                        <stop offset="0" stop-color="#fde68a" stop-opacity="0.95"/>
                        <stop offset="1" stop-color="#92400e" stop-opacity="0.05"/>
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="40" fill="url(#axiomGlow)" opacity="0.55"/>
                <g id="AXIOM_RINGS" class="animate-[spin_10s_linear_infinite]" style="transform-origin: 50px 50px;">
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#eab308" stroke-width="2"/>
                    <circle cx="50" cy="50" r="20" fill="none" stroke="#facc15" stroke-width="1.6" opacity="0.8"/>
                    <path d="M20 50 H80" stroke="#fde68a" stroke-width="1.2" opacity="0.6"/>
                    <path d="M50 20 V80" stroke="#fde68a" stroke-width="1.2" opacity="0.6"/>
                </g>
                <circle cx="50" cy="50" r="14" fill="#0b1024" opacity="0.9" stroke="#fde68a" stroke-width="2"/>
                <circle id="SENTINEL_PUPIL" cx="50" cy="50" r="5" fill="#ffffff" class="animate-pulse"/>
                <text x="50" y="82" font-family="monospace" font-size="10" font-weight="900" fill="#fde68a" text-anchor="middle">x=x</text>
            </svg>`,
    // 10) Logic Leviathan (final boss; MYP-scope, cosmic logic)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_28px_rgba(49,46,129,0.65)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="levVoid" cx="50%" cy="50%" r="65%">
                        <stop offset="0" stop-color="#1e1b4b" stop-opacity="0.95"/>
                        <stop offset="1" stop-color="#020617" stop-opacity="1"/>
                    </radialGradient>
                    <linearGradient id="levRing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#a5b4fc" stop-opacity="0.85"/>
                        <stop offset="1" stop-color="#6366f1" stop-opacity="0.15"/>
                    </linearGradient>
                </defs>
                <circle cx="50" cy="52" r="42" fill="url(#levVoid)" opacity="0.98" stroke="#818cf8" stroke-width="2"/>
                <g opacity="0.65">
                    <circle cx="50" cy="52" r="34" fill="none" stroke="url(#levRing)" stroke-width="2"/>
                    <circle cx="50" cy="52" r="26" fill="none" stroke="url(#levRing)" stroke-width="1.6"/>
                    <circle cx="50" cy="52" r="18" fill="none" stroke="url(#levRing)" stroke-width="1.2"/>
                </g>
                <g opacity="0.8">
                    <text x="26" y="28" font-family="monospace" font-size="9" font-weight="900" fill="#c7d2fe">0 1 0 1</text>
                    <text x="56" y="30" font-family="monospace" font-size="9" font-weight="900" fill="#c7d2fe">AND</text>
                    <text x="18" y="78" font-family="monospace" font-size="9" font-weight="900" fill="#c7d2fe">OR</text>
                    <text x="66" y="78" font-family="monospace" font-size="9" font-weight="900" fill="#c7d2fe">NOT</text>
                </g>
                <circle id="LEVIATHAN_MAW" cx="50" cy="52" r="11" fill="#312e81"/>
                <circle cx="46" cy="50" r="2.8" fill="#e0e7ff"/>
                <circle cx="54" cy="50" r="2.8" fill="#e0e7ff"/>
                <path d="M42 60 Q50 66 58 60" fill="none" stroke="#a5b4fc" stroke-width="2" opacity="0.9"/>
                <g opacity="0.4">
                    <path d="M10 52 Q30 40 50 52 T90 52" fill="none" stroke="#818cf8" stroke-width="2"/>
                    <path d="M12 62 Q30 72 50 62 T88 62" fill="none" stroke="#6366f1" stroke-width="2"/>
                </g>
            </svg>`
];


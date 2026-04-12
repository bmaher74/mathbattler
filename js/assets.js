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
                    <ellipse cx="50" cy="88" rx="36" ry="11" fill="url(#slimeShadow)" opacity="0.65"/>
                    <!-- Pseudopod drips -->
                    <path d="M12 76 Q8 92 18 96 Q24 100 30 92" fill="#064e3b" opacity="0.9"/>
                    <path d="M88 76 Q92 92 82 96 Q76 100 70 92" fill="#064e3b" opacity="0.9"/>
                    <path d="M 14 78 Q 6 94 22 95 Q 30 107 40 95 Q 50 106 60 95 Q 70 107 78 95 Q 94 94 86 78 Z" fill="#064e3b" opacity="0.95"/>
                    <path d="M 14 78 C 6 28 30 3 50 3 C 70 3 94 28 86 78 Z" fill="url(#slimeCore)" stroke="#4ade80" stroke-width="2.2" opacity="0.98"/>
                    <!-- Upper lobe "head" bump -->
                    <ellipse cx="50" cy="14" rx="18" ry="12" fill="#22c55e" opacity="0.35"/>
                    <path d="M 22 70 C 22 40 38 20 50 18 C 62 20 78 40 78 70 Q 64 64 50 66 Q 36 64 22 70 Z" fill="#14532d" opacity="0.25"/>
                    <path d="M 28 26 Q 40 16 52 18" fill="none" stroke="#bbf7d0" stroke-width="2" opacity="0.35"/>
                    <g opacity="0.55">
                        <text x="18" y="56" font-family="monospace" font-size="9" font-weight="700" fill="#bbf7d0">x+y</text>
                        <text x="66" y="60" font-family="monospace" font-size="9" font-weight="700" fill="#bbf7d0">2x</text>
                        <text x="42" y="86" font-family="monospace" font-size="8" font-weight="700" fill="#86efac" opacity="0.8">x≠y</text>
                    </g>
                    <polygon points="34,34 46,34 49,47 40,53 31,47" fill="#052e16" opacity="0.95"/>
                    <polygon points="66,34 54,34 51,47 60,53 69,47" fill="#052e16" opacity="0.95"/>
                    <circle id="SLIME_EYE_L" cx="40" cy="41" r="4.2" fill="#bef264" class="animate-pulse" style="filter: drop-shadow(0 0 6px #bef264)"/>
                    <circle id="SLIME_EYE_R" cx="60" cy="41" r="4.2" fill="#bef264" class="animate-pulse" style="filter: drop-shadow(0 0 6px #bef264)"/>
                    <path d="M 40 60 Q 50 68 60 60" fill="none" stroke="#052e16" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
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
                        <linearGradient id="golemMoss" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0" stop-color="#14532d" stop-opacity="0.35"/>
                            <stop offset="1" stop-color="#14532d" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                    <ellipse cx="50" cy="95" rx="30" ry="5" fill="#0c0a09" opacity="0.45"/>
                    <!-- Block legs -->
                    <path d="M28 78 L28 90 L22 94 L22 78 Z" fill="url(#golemStone)" stroke="#9a3412" stroke-width="1.4"/>
                    <path d="M72 78 L72 90 L78 94 L78 78 Z" fill="url(#golemStone)" stroke="#9a3412" stroke-width="1.4"/>
                    <rect x="24" y="88" width="14" height="6" rx="1" fill="#57534e" stroke="#44403c" stroke-width="1"/>
                    <rect x="62" y="88" width="14" height="6" rx="1" fill="#57534e" stroke="#44403c" stroke-width="1"/>
                    <!-- Stacked torso + shoulders (main mass) -->
                    <g id="GOLEM_BODY">
                        <rect x="20" y="44" width="60" height="34" rx="5" fill="url(#golemStone)" stroke="#ea580c" stroke-width="2.8"/>
                        <path d="M20 56 H80" stroke="#9a3412" stroke-width="2.2" opacity="0.65"/>
                        <path d="M20 68 H80" stroke="#9a3412" stroke-width="2.2" opacity="0.5"/>
                        <rect x="10" y="46" width="14" height="28" rx="4" fill="url(#golemStone)" stroke="#ea580c" stroke-width="2"/>
                        <rect x="76" y="46" width="14" height="28" rx="4" fill="url(#golemStone)" stroke="#ea580c" stroke-width="2"/>
                        <rect x="6" y="58" width="10" height="14" rx="3" fill="#57534e" stroke="#ea580c" stroke-width="1.2"/>
                        <rect x="84" y="58" width="10" height="14" rx="3" fill="#57534e" stroke="#ea580c" stroke-width="1.2"/>
                    </g>
                    <!-- Neck -->
                    <rect x="36" y="36" width="28" height="12" rx="3" fill="url(#golemStone)" stroke="#9a3412" stroke-width="1.6"/>
                    <!-- Head: chiseled block -->
                    <path d="M26 10 L74 10 L78 22 L74 34 L26 34 L22 22 Z" fill="url(#golemStone)" stroke="#ea580c" stroke-width="2.4"/>
                    <path d="M30 14 H70" stroke="#9a3412" stroke-width="1.5" opacity="0.55"/>
                    <path d="M28 22 H72" stroke="#9a3412" stroke-width="1.5" opacity="0.45"/>
                    <rect x="28" y="36" width="44" height="10" rx="2" fill="url(#golemMoss)"/>
                    <path d="M38 30 Q50 34 62 30" fill="none" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round"/>
                    <circle id="GOLEM_EYE_L" cx="38" cy="22" r="2.4" fill="#fde047" class="animate-pulse"/>
                    <circle id="GOLEM_EYE_R" cx="62" cy="22" r="2.4" fill="#fde047" class="animate-pulse"/>
                    <!-- Chest furnace + carved fraction tablets -->
                    <circle cx="50" cy="58" r="13" fill="url(#golemCoreGlow)" opacity="0.88"/>
                    <rect id="GOLEM_FRACTION_L" x="22" y="48" width="22" height="26" rx="2" fill="#b45309" stroke="#fef3c7" stroke-width="1.1" opacity="0.95"/>
                    <rect id="GOLEM_FRACTION_R" x="56" y="48" width="22" height="26" rx="2" fill="#9a3412" stroke="#fef3c7" stroke-width="1.1" opacity="0.95"/>
                    <text x="33" y="60" font-size="8" font-weight="900" fill="#fffbeb" text-anchor="middle">1</text>
                    <line x1="27" y1="63" x2="39" y2="63" stroke="#fffbeb" stroke-width="1.6"/>
                    <text x="33" y="72" font-size="8" font-weight="900" fill="#fffbeb" text-anchor="middle">4</text>
                    <text x="50" y="66" font-size="11" fill="#fffbeb" text-anchor="middle" font-weight="900">+</text>
                    <text x="67" y="60" font-size="8" font-weight="900" fill="#fffbeb" text-anchor="middle">1</text>
                    <line x1="61" y1="63" x2="73" y2="63" stroke="#fffbeb" stroke-width="1.6"/>
                    <text x="67" y="72" font-size="8" font-weight="900" fill="#fffbeb" text-anchor="middle">4</text>
                    <text id="GOLEM_RESULT" x="50" y="84" font-family="system-ui,sans-serif" font-size="9" font-weight="900" fill="#fef3c7" text-anchor="middle">2/4 = 1/2</text>
                    <path d="M36 76 Q50 82 64 76" fill="none" stroke="#fbbf24" stroke-width="2.6" stroke-linecap="round" opacity="0.5"/>
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
                <ellipse cx="50" cy="90" rx="22" ry="6" fill="#450a0a" opacity="0.45"/>
                <!-- Abdomen: swollen tick / spider sack -->
                <ellipse cx="50" cy="68" rx="20" ry="14" fill="#4c0519" stroke="#9f1239" stroke-width="1.5" opacity="0.95"/>
                <path d="M42 58 Q50 52 58 58" fill="none" stroke="#fda4af" stroke-width="1.2" opacity="0.5"/>
                <g id="PARASITE_LEGS" opacity="0.95">
                    <path d="M50 54 L10 20" stroke="#be123c" stroke-width="3.5" stroke-linecap="round"/>
                    <path d="M50 54 L90 20" stroke="#be123c" stroke-width="3.5" stroke-linecap="round"/>
                    <path d="M50 56 L14 74" stroke="#be123c" stroke-width="3.5" stroke-linecap="round"/>
                    <path d="M50 56 L86 74" stroke="#be123c" stroke-width="3.5" stroke-linecap="round"/>
                    <path d="M50 58 L32 94" stroke="#be123c" stroke-width="3.5" stroke-linecap="round"/>
                    <path d="M50 58 L68 94" stroke="#be123c" stroke-width="3.5" stroke-linecap="round"/>
                    <circle cx="10" cy="20" r="2.5" fill="#881337"/>
                    <circle cx="90" cy="20" r="2.5" fill="#881337"/>
                    <circle cx="32" cy="94" r="2.5" fill="#881337"/>
                    <circle cx="68" cy="94" r="2.5" fill="#881337"/>
                </g>
                <circle id="PARASITE_CORE" cx="50" cy="44" r="17" fill="url(#paraCore)" stroke="#fecdd3" stroke-width="2"/>
                <!-- Small fang chelicerae -->
                <path d="M38 52 L34 62 L40 58 Z" fill="#450a0a"/>
                <path d="M62 52 L66 62 L60 58 Z" fill="#450a0a"/>
                <circle cx="43" cy="40" r="3.2" fill="#0b1024"/>
                <circle cx="57" cy="40" r="3.2" fill="#0b1024"/>
                <text x="50" y="74" font-size="14" font-weight="900" fill="#fff1f2" text-anchor="middle">%</text>
                <path d="M40 48 Q50 40 60 48" fill="none" stroke="#fff1f2" stroke-width="2" opacity="0.65"/>
            </svg>`,
    // 4) Fibonacci Serpent (patterns/sequences)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(5,150,105,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="serpScale" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#065f46"/>
                        <stop offset="1" stop-color="#022c22"/>
                    </linearGradient>
                </defs>
                <!-- Coiled body -->
                <path d="M18 82 C 22 48 38 28 52 26 C 72 24 88 38 84 54 C 80 70 58 76 44 70 C 28 64 24 48 38 38 C 52 28 72 32 78 48" fill="none" stroke="url(#serpScale)" stroke-width="11" stroke-linecap="round" opacity="0.92"/>
                <path d="M38 38 C 46 32 58 34 64 42" fill="none" stroke="#047857" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
                <path id="FIBONACCI_SPIRAL" d="M 50 50 Q 70 30 80 60 T 40 80 T 20 40 T 70 10" fill="none" stroke="#34d399" stroke-width="4" opacity="0.85"/>
                <!-- Head & jaw -->
                <path d="M72 18 L88 24 L82 38 L70 34 Z" fill="#065f46" stroke="#10b981" stroke-width="1.4"/>
                <polygon points="74,20 88,26 78,36" fill="#10b981" opacity="0.9"/>
                <polygon points="78,28 88,26 84,38" fill="#047857" opacity="0.8"/>
                <polygon points="74,20 80,28 70,28" fill="#022c22" opacity="0.95"/>
                <polygon id="SERPENT_EYE" points="75,15 80,10 85,15" fill="#34d399" class="animate-pulse"/>
                <path d="M82 30 L88 32" stroke="#fef3c7" stroke-width="2" stroke-linecap="round"/>
                <path d="M74 34 L86 34" stroke="#d1fae5" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
                <text x="22" y="24" font-family="monospace" font-size="9" font-weight="900" fill="#a7f3d0" opacity="0.75">1,1,2,3,5…</text>
            </svg>`,
    // 5) Geo-Dragon (polygons/compass/cartesian)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(147,51,234,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="geoWing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#4c1d95" stop-opacity="0.95"/>
                        <stop offset="1" stop-color="#1f103f" stop-opacity="0.95"/>
                    </linearGradient>
                </defs>
                <!-- Tail -->
                <path d="M78 88 Q88 78 92 88" fill="none" stroke="#6b21a8" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
                <polygon points="12,52 34,30 40,58 22,72" fill="url(#geoWing)" stroke="#c4b5fd" stroke-width="1.5" opacity="0.9"/>
                <polygon points="88,52 66,30 60,58 78,72" fill="url(#geoWing)" stroke="#c4b5fd" stroke-width="1.5" opacity="0.9"/>
                <polygon points="22,72 40,58 50,82 30,88" fill="#2e1065" opacity="0.75"/>
                <polygon points="78,72 60,58 50,82 70,88" fill="#2e1065" opacity="0.75"/>
                <!-- Snout + horn crest -->
                <path d="M40 18 L50 8 L60 18 L66 30 L50 26 L34 30 Z" fill="#4c1d95" stroke="#e9d5ff" stroke-width="1.4"/>
                <polygon points="34,30 50,22 66,30 60,58 40,58" fill="#2e1065" stroke="#e9d5ff" stroke-width="2" opacity="0.95"/>
                <polygon id="GEO_CORE" points="50,20 65,30 65,55 50,65 35,55 35,30" fill="#9333ea" stroke="#f3e8ff" stroke-width="2"/>
                <polygon points="46,32 50,28 54,32" fill="#f3e8ff" opacity="0.6"/>
                <circle cx="46" cy="40" r="3" fill="#0b1024"/>
                <circle cx="54" cy="40" r="3" fill="#0b1024"/>
                <path d="M44 48 Q50 52 56 48" fill="none" stroke="#f3e8ff" stroke-width="2" opacity="0.8"/>
                <path d="M22 44 H78" stroke="#a78bfa" stroke-width="1.2" opacity="0.35"/>
                <path d="M50 18 V88" stroke="#a78bfa" stroke-width="1.2" opacity="0.35"/>
                <text x="50" y="6" font-family="monospace" font-size="8" font-weight="900" fill="#ddd6fe" text-anchor="middle">x,y</text>
            </svg>`,
    // 6) Matrix Minotaur (systems/equations feel without out-of-scope math)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(154,52,18,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <polyline id="MATRIX_BRACKET_L" points="30,20 20,20 20,80 30,80" fill="none" stroke="#9a3412" stroke-width="4"/>
                <polyline id="MATRIX_BRACKET_R" points="70,20 80,20 80,80 70,80" fill="none" stroke="#9a3412" stroke-width="4"/>
                <!-- Bull head + hooves -->
                <ellipse cx="50" cy="28" rx="22" ry="16" fill="#422006" stroke="#fdba74" stroke-width="2"/>
                <path id="MINOTAUR_HORNS" d="M 32 22 Q 38 6 50 12 Q 62 6 68 22" fill="none" stroke="#fdba74" stroke-width="3.5"/>
                <path d="M32 22 L28 8 L36 18 Z" fill="#57534e"/>
                <path d="M68 22 L72 8 L64 18 Z" fill="#57534e"/>
                <ellipse cx="50" cy="44" rx="18" ry="10" fill="#451a03" stroke="#fdba74" stroke-width="1.5"/>
                <rect x="32" y="48" width="36" height="36" rx="6" fill="#451a03" stroke="#fdba74" stroke-width="2"/>
                <g opacity="0.75">
                    <path d="M36 56 H64" stroke="#fef3c7" stroke-width="2"/>
                    <path d="M36 64 H64" stroke="#fef3c7" stroke-width="2" opacity="0.8"/>
                    <path d="M36 72 H64" stroke="#fef3c7" stroke-width="2" opacity="0.65"/>
                </g>
                <circle cx="42" cy="32" r="3.2" fill="#fde047"/>
                <circle cx="58" cy="32" r="3.2" fill="#fde047"/>
                <ellipse cx="50" cy="38" rx="6" ry="4" fill="#292524"/>
                <path d="M42 76 Q50 82 58 76" fill="none" stroke="#fef3c7" stroke-width="2" opacity="0.9"/>
                <path d="M28 88 L32 84 L36 90 Z" fill="#292524"/>
                <path d="M64 88 L68 84 L72 90 Z" fill="#292524"/>
                <text x="50" y="84" font-family="monospace" font-size="9" font-weight="900" fill="#fdba74" text-anchor="middle">[ ]</text>
            </svg>`,
    // 7) Probability Wraith (data/probability)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(96,165,250,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <!-- Hooded mantle -->
                <path d="M18 88 C 14 52 28 22 50 20 C 72 22 86 52 82 88 Q 66 82 50 86 Q 34 82 18 88 Z" fill="#0b1024" opacity="0.9" stroke="#93c5fd" stroke-width="2"/>
                <path d="M26 24 Q50 8 74 24" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.35"/>
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
                <!-- Tattered sleeve wisps -->
                <path d="M18 70 Q10 78 8 88" fill="none" stroke="#93c5fd" stroke-width="2" opacity="0.45"/>
                <path d="M82 70 Q90 78 92 88" fill="none" stroke="#93c5fd" stroke-width="2" opacity="0.45"/>
            </svg>`,
    // 8) Velocity Vanguard (real-life modeling)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(252,211,77,0.45)]" xmlns="http://www.w3.org/2000/svg">
                <polygon id="VECTOR_SHIELD" points="30,40 50,30 70,40 50,80" fill="#374151" stroke="#9ca3af" stroke-width="2"/>
                <line id="VELOCITY_SPEAR" x1="10" y1="90" x2="90" y2="10" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
                <!-- Helmet -->
                <path d="M32 28 H68 L66 20 Q50 12 34 20 Z" fill="#4b5563" stroke="#d1d5db" stroke-width="1.5"/>
                <rect x="32" y="34" width="36" height="46" rx="6" fill="#0b1024" opacity="0.85" stroke="#9ca3af" stroke-width="2"/>
                <path d="M30 42 H70" stroke="#6b7280" stroke-width="2" opacity="0.6"/>
                <circle cx="44" cy="48" r="3" fill="#fcd34d"/>
                <circle cx="56" cy="48" r="3" fill="#fcd34d"/>
                <path d="M40 66 Q50 72 60 66" fill="none" stroke="#fcd34d" stroke-width="2" opacity="0.8"/>
                <path d="M18 84 Q50 62 82 84" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
                <text x="50" y="26" font-family="monospace" font-size="8" font-weight="900" fill="#fde68a" text-anchor="middle">v=d/t</text>
            </svg>`,
    // 9) Axiom Sentinel (calm, terrifying logic)
    `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_22px_rgba(234,179,8,0.55)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="axiomGlow" cx="50%" cy="50%" r="60%">
                        <stop offset="0" stop-color="#fde68a" stop-opacity="0.95"/>
                        <stop offset="1" stop-color="#92400e" stop-opacity="0.05"/>
                    </radialGradient>
                </defs>
                <!-- Obelisk "body" -->
                <path d="M38 92 L42 32 L50 20 L58 32 L62 92 Z" fill="#1c1917" stroke="#a16207" stroke-width="2" opacity="0.92"/>
                <path d="M42 32 L58 32" stroke="#fde68a" stroke-width="1.2" opacity="0.4"/>
                <circle cx="50" cy="50" r="40" fill="url(#axiomGlow)" opacity="0.55"/>
                <g id="AXIOM_RINGS" class="animate-[spin_10s_linear_infinite]" style="transform-origin: 50px 50px;">
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#eab308" stroke-width="2"/>
                    <circle cx="50" cy="50" r="20" fill="none" stroke="#facc15" stroke-width="1.6" opacity="0.8"/>
                    <path d="M20 50 H80" stroke="#fde68a" stroke-width="1.2" opacity="0.6"/>
                    <path d="M50 20 V80" stroke="#fde68a" stroke-width="1.2" opacity="0.6"/>
                </g>
                <circle cx="50" cy="50" r="14" fill="#0b1024" opacity="0.9" stroke="#fde68a" stroke-width="2"/>
                <circle id="SENTINEL_PUPIL" cx="50" cy="50" r="5" fill="#ffffff" class="animate-pulse"/>
                <text x="50" y="88" font-family="monospace" font-size="9" font-weight="900" fill="#fde68a" text-anchor="middle">x=x</text>
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
                <!-- Sea-serpent coils behind the void orb -->
                <path d="M6 88 C20 52 36 44 52 48 C72 52 88 68 94 88" fill="none" stroke="#312e81" stroke-width="8" stroke-linecap="round" opacity="0.55"/>
                <path d="M8 72 C24 40 44 28 58 32" fill="none" stroke="#4338ca" stroke-width="5" stroke-linecap="round" opacity="0.4"/>
                <path d="M12 24 L18 8 L22 20 Z" fill="#4338ca" opacity="0.5"/>
                <path d="M88 28 L82 12 L78 24 Z" fill="#4338ca" opacity="0.5"/>
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
                <path d="M40 52 L36 48 L38 56 Z" fill="#818cf8" opacity="0.7"/>
                <path d="M60 52 L64 48 L62 56 Z" fill="#818cf8" opacity="0.7"/>
                <circle cx="46" cy="50" r="2.8" fill="#e0e7ff"/>
                <circle cx="54" cy="50" r="2.8" fill="#e0e7ff"/>
                <path d="M42 60 Q50 66 58 60" fill="none" stroke="#a5b4fc" stroke-width="2" opacity="0.9"/>
                <g opacity="0.4">
                    <path d="M10 52 Q30 40 50 52 T90 52" fill="none" stroke="#818cf8" stroke-width="2"/>
                    <path d="M12 62 Q30 72 50 62 T88 62" fill="none" stroke="#6366f1" stroke-width="2"/>
                </g>
            </svg>`
];


        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // --- ACTIVE INVARIANTS (THE BLACK BOX) ---
        // Assets are anchored with specific IDs for regression tests to monitor detail levels.
        const ASSETS = {
            wizard: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_10px_20px_rgba(59,130,246,0.6)]">
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
        const BOSS_ASSETS = [
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

        /** Map layout (viewBox coords): level 1 at top, higher levels lower on the page. */
        const QUEST_ROUTE = [
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

        function getQuestNode(level) {
            if (level <= QUEST_ROUTE.length) {
                const i = (level - 1) % QUEST_ROUTE.length;
                return QUEST_ROUTE[i];
            }
            const gen = state.bossCacheByLevel?.[level];
            if (gen) {
                return { x: 0, y: 0, name: gen.name, blurb: gen.blurb, hue: gen.hue, topic: gen.topic, _generated: true };
            }
            // Placeholder while generation runs.
            return {
                x: 0,
                y: 0,
                name: `??? (Lv ${level})`,
                blurb: "Summoning a new boss…",
                hue: "#94a3b8",
                topic: "Math",
                _generated: true,
                _missing: true
            };
        }

        /** Compact SVG boss portrait for map nodes (viewBox 0 0 100 100). */
        function mapBossPortrait(level) {
            if (level > QUEST_ROUTE.length) {
                const gen = state.bossCacheByLevel?.[level];
                if (gen && gen.mapSvg) return svgInnerMarkup(gen.mapSvg) || `<circle cx="50" cy="50" r="22" fill="#0b1024" stroke="#94a3b8" stroke-width="2"/><text x="50" y="56" font-size="16" font-weight="900" fill="#94a3b8" text-anchor="middle">?</text>`;
                return `<circle cx="50" cy="50" r="22" fill="#0b1024" stroke="#94a3b8" stroke-width="2"/><text x="50" y="56" font-size="16" font-weight="900" fill="#94a3b8" text-anchor="middle">…</text>`;
            }
            const i = (level - 1) % 10;
            const portraits = [
                `<ellipse cx="50" cy="58" rx="38" ry="28" fill="#064e3b"/><ellipse cx="50" cy="42" rx="32" ry="30" fill="#22c55e"/><circle cx="40" cy="40" r="5" fill="#bef264"/><circle cx="60" cy="40" r="5" fill="#bef264"/><path d="M40 60 Q50 66 60 60" fill="none" stroke="#052e16" stroke-width="3" stroke-linecap="round"/><text x="50" y="74" font-size="16" font-weight="900" fill="#bbf7d0" text-anchor="middle">x+y</text>`,
                `<rect x="22" y="18" width="56" height="68" rx="6" fill="#431407" stroke="#ea580c" stroke-width="2"/><rect x="28" y="24" width="20" height="28" fill="#f97316"/><rect x="52" y="24" width="20" height="28" fill="#ea580c"/><text x="38" y="42" font-size="10" fill="#fff" text-anchor="middle">1</text><line x1="32" y1="46" x2="44" y2="46" stroke="#fff"/><text x="38" y="54" font-size="10" fill="#fff" text-anchor="middle">4</text><circle cx="40" cy="36" r="2.2" fill="#fde047"/><circle cx="60" cy="36" r="2.2" fill="#fde047"/>`,
                `<circle cx="50" cy="52" r="18" fill="#881337" stroke="#fecdd3" stroke-width="2"/><text x="50" y="58" font-size="18" font-weight="900" fill="#fff1f2" text-anchor="middle">%</text><path d="M22 58 L10 70" stroke="#be123c" stroke-width="4" stroke-linecap="round"/><path d="M78 58 L90 70" stroke="#be123c" stroke-width="4" stroke-linecap="round"/>`,
                `<path d="M22 74 C 30 40 50 26 66 30 C 80 34 84 50 74 58 C 62 66 46 56 42 44" fill="none" stroke="#065f46" stroke-width="10" stroke-linecap="round"/><path d="M50 50 Q70 30 80 60 T40 80" fill="none" stroke="#34d399" stroke-width="3"/><polygon points="75,18 80,13 85,18" fill="#34d399"/>`,
                `<polygon points="18,56 36,34 44,58 24,74" fill="#2e1065" stroke="#ddd6fe" stroke-width="1.5"/><polygon points="82,56 64,34 56,58 76,74" fill="#2e1065" stroke="#ddd6fe" stroke-width="1.5"/><polygon points="34,34 50,24 66,34 60,58 40,58" fill="#4c1d95"/><circle cx="46" cy="42" r="2.6" fill="#111827"/><circle cx="54" cy="42" r="2.6" fill="#111827"/>`,
                `<polyline points="32,28 24,28 24,78 32,78" fill="none" stroke="#9a3412" stroke-width="4"/><polyline points="68,28 76,28 76,78 68,78" fill="none" stroke="#9a3412" stroke-width="4"/><rect x="34" y="32" width="32" height="44" rx="6" fill="#451a03" stroke="#fdba74" stroke-width="2"/><text x="50" y="58" font-size="16" font-weight="900" fill="#fdba74" text-anchor="middle">[ ]</text>`,
                `<path d="M18 82 C 18 56 32 34 50 32 C 68 34 82 56 82 82 Q 66 76 50 78 Q 34 76 18 82 Z" fill="#0b1024" stroke="#93c5fd" stroke-width="2"/><path d="M12 88 Q50 20 88 88" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.6"/><rect x="42" y="40" width="16" height="16" rx="3" fill="#1e3a8a" stroke="#bfdbfe" stroke-width="2"/>`,
                `<polygon points="30,40 50,30 70,40 50,80" fill="#374151" stroke="#9ca3af" stroke-width="2"/><line x1="16" y1="84" x2="84" y2="16" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/><text x="50" y="28" font-size="9" font-weight="900" fill="#fde68a" text-anchor="middle">v=d/t</text>`,
                `<circle cx="50" cy="50" r="24" fill="#0b1024" stroke="#fde68a" stroke-width="2"/><circle cx="50" cy="50" r="5" fill="#fff" opacity="0.95"/><circle cx="50" cy="50" r="18" fill="none" stroke="#facc15" stroke-width="2"/><text x="50" y="80" font-size="10" font-weight="900" fill="#fde68a" text-anchor="middle">x=x</text>`,
                `<circle cx="50" cy="52" r="26" fill="#020617" stroke="#818cf8" stroke-width="2"/><circle cx="50" cy="52" r="10" fill="#312e81"/><text x="50" y="30" font-size="9" font-weight="900" fill="#c7d2fe" text-anchor="middle">0 1 0 1</text>`
            ];
            return portraits[i];
        }

        /** Full battle sprite — high-detail (map nodes use compact portraits). */
        function battleBossSvgMarkup(level) {
            if (level > QUEST_ROUTE.length) {
                const gen = state.bossCacheByLevel?.[level];
                if (gen && gen.battleSvg) return gen.battleSvg;
                return BOSS_ASSETS[BOSS_ASSETS.length - 1] || ASSETS.slime;
            }
            const i = (level - 1) % BOSS_ASSETS.length;
            return BOSS_ASSETS[i] || ASSETS.slime;
        }

        function clearBattleDamageOverlay() {
            ["enemy-damage", "player-damage"].forEach((id) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.innerText = "";
                el.classList.remove("animate-damage");
            });
        }

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'math-adventure-global';
        const state = {
            playerName: null,
            unlockedLevels: 1,
            currentLevel: 1,
            playerHP: 100,
            enemyHP: 100,
            isAnimating: false,
            turnIndex: 0,
            skillProfile: null,
            nextQuestion: null,
            activeQuestion: null,
            /** Rolling recent stems to reduce repeated LLM questions across battles/sessions. */
            recentQuestionStems: [],
            /** Meta-progression */
            shards: 0,
            cosmeticsTier: 0,
            bestiary: [],
            /** Combat juice state */
            comboCount: 0,
            comboActive: false,
            potionUsedThisBattle: false,
            forceEasierNextQuestion: false,
            nextEnemyAttackZero: false,
            requireReflection: false,
            /** LLM-generated boss metadata + SVGs for levels > 10. Keyed by level number. */
            bossCacheByLevel: {},
            lastCloudSyncAt: null,
            cloudSyncError: null,
            /** Set when live AI prefetch fails — shown on map banner */
            aiOfflineHint: null,
            /** Short technical detail for tooltips / buffer line (e.g. HTTP 429) */
            lastPrefetchError: null
        };

        const RECENT_STEMS_LS_KEY = "mb_recent_question_stems_v1";
        const MAX_RECENT_STEMS = 24;
        const BOSS_CACHE_LS_KEY = "mb_boss_cache_v1";
        const BOSS_CACHE_SCHEMA_VERSION = 1;

        function loadBossCache() {
            try {
                const raw = localStorage.getItem(BOSS_CACHE_LS_KEY);
                const parsed = raw ? JSON.parse(raw) : null;
                if (!parsed || typeof parsed !== "object") return {};
                if (parsed.v !== BOSS_CACHE_SCHEMA_VERSION) return {};
                const levels = parsed.levels && typeof parsed.levels === "object" ? parsed.levels : {};
                const out = {};
                for (const [k, v] of Object.entries(levels)) {
                    const n = parseInt(k, 10);
                    if (!Number.isFinite(n) || n < 11) continue;
                    if (!v || typeof v !== "object") continue;
                    if (typeof v.name !== "string" || typeof v.blurb !== "string" || typeof v.hue !== "string") continue;
                    if (typeof v.topic !== "string") continue;
                    if (typeof v.battleSvg !== "string" || !v.battleSvg.trim().startsWith("<svg")) continue;
                    if (typeof v.mapSvg !== "string" || !v.mapSvg.trim().startsWith("<svg")) continue;
                    out[n] = {
                        name: v.name,
                        blurb: v.blurb,
                        hue: v.hue,
                        topic: v.topic,
                        battleSvg: v.battleSvg,
                        mapSvg: v.mapSvg,
                        createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now()
                    };
                }
                return out;
            } catch (_) {
                return {};
            }
        }

        function saveBossCache(cache) {
            try {
                const levels = {};
                for (const [k, v] of Object.entries(cache || {})) {
                    const n = parseInt(k, 10);
                    if (!Number.isFinite(n) || n < 11) continue;
                    if (!v || typeof v !== "object") continue;
                    levels[String(n)] = {
                        name: String(v.name || ""),
                        blurb: String(v.blurb || ""),
                        hue: String(v.hue || ""),
                        topic: String(v.topic || ""),
                        battleSvg: String(v.battleSvg || ""),
                        mapSvg: String(v.mapSvg || ""),
                        createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now()
                    };
                }
                localStorage.setItem(BOSS_CACHE_LS_KEY, JSON.stringify({ v: BOSS_CACHE_SCHEMA_VERSION, levels }));
            } catch (_) {}
        }

        function svgInnerMarkup(svg) {
            const s = String(svg || "");
            const a = s.indexOf(">");
            const b = s.lastIndexOf("</svg>");
            if (a < 0 || b < 0 || b <= a) return "";
            return s.slice(a + 1, b);
        }

        function loadRecentStems() {
            try {
                const raw = localStorage.getItem(RECENT_STEMS_LS_KEY);
                const arr = raw ? JSON.parse(raw) : null;
                if (Array.isArray(arr)) {
                    state.recentQuestionStems = arr.filter((x) => typeof x === "string" && x.trim()).slice(0, MAX_RECENT_STEMS);
                }
            } catch (_) {
                state.recentQuestionStems = [];
            }
        }

        function saveRecentStems() {
            try {
                localStorage.setItem(RECENT_STEMS_LS_KEY, JSON.stringify(state.recentQuestionStems.slice(0, MAX_RECENT_STEMS)));
            } catch (_) {}
        }

        function rememberQuestionStem(text) {
            const norm = normalizeQuestionStem(text);
            if (!norm) return;
            state.recentQuestionStems = [norm, ...state.recentQuestionStems.filter((s) => s !== norm)].slice(0, MAX_RECENT_STEMS);
            saveRecentStems();
        }
        /** Set by runAiApiRegression (page load) before login; used by the Questions status chip. */
        let lastAiConnectivityCheck = { ok: null, summary: "", detail: "" };
        let cloudSyncManualInFlight = false;
        function readConfigString(v) {
            if (v == null) return "";
            const s = typeof v === "string" ? v : String(v);
            return s.trim();
        }

        function getConfiguredAiKeys() {
            const dsKey = readConfigString(typeof window !== "undefined" ? window.__dashscope_api_key : "");
            const dsBase =
                readConfigString(typeof window !== "undefined" ? window.__dashscope_base_url : "") ||
                "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
            const dsModel = readConfigString(typeof window !== "undefined" ? window.__dashscope_model : "") || "qwen-flash";
            const dsChatUrl = readConfigString(typeof window !== "undefined" ? window.__dashscope_chat_completions_url : "");
            return { dsKey, dsBase, dsModel, dsChatUrl };
        }

        function dashscopeChatCompletionsUrl() {
            const { dsBase, dsChatUrl } = getConfiguredAiKeys();
            if (dsChatUrl) return dsChatUrl;
            return dsBase.replace(/\/$/, "") + "/chat/completions";
        }

        let db, auth, currentUser, isFirebaseReady = false;
        let loginGateResolved = false;

        function safeSet(id, val, prop = 'innerText') { const el = document.getElementById(id); if (el) { if (prop.includes('.')) { const parts = prop.split('.'); el[parts[0]][parts[1]] = val; } else { el[prop] = val; } } return el; }

        function isPromptDebugEnabled() {
            try {
                const qs = new URLSearchParams(location.search);
                if (qs.get("debugPrompts") === "1") return true;
            } catch (_) {}
            try {
                if (typeof window !== "undefined" && window.__debug_ai_prompts === true) return true;
            } catch (_) {}
            try {
                return localStorage.getItem("mb_debug_ai_prompts") === "1";
            } catch (_) {
                return false;
            }
        }

        function debugLogAiPrompt(label, prompt) {
            if (!isPromptDebugEnabled()) return;
            try {
                const p = String(prompt ?? "");
                console.groupCollapsed(`AI prompt (${label}) • ${p.length} chars`);
                console.log(p);
                console.groupEnd();
            } catch (_) {}
        }

        function formatSyncAge(ts) {
            if (ts == null) return "";
            const s = Math.floor((Date.now() - ts) / 1000);
            if (s < 8) return "just now";
            if (s < 60) return `${s}s ago`;
            const m = Math.floor(s / 60);
            if (m < 60) return `${m}m ago`;
            const h = Math.floor(m / 60);
            return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
        }

        function updateCloudSyncBadge() {
            const root = document.getElementById("cloud-sync-badge");
            const l1 = document.getElementById("cloud-sync-badge-line1");
            const l2 = document.getElementById("cloud-sync-badge-line2");
            const icon = document.getElementById("cloud-sync-badge-icon");
            if (!root || root.classList.contains("hidden") || !l1 || !l2 || !icon) return;

            if (cloudSyncManualInFlight) {
                icon.textContent = "↻";
                l1.textContent = "Syncing…";
                l2.textContent = "Runs in background";
                return;
            }

            if (!isFirebaseReady || !db) {
                icon.textContent = "💾";
                l1.textContent = "Local save";
                l2.textContent = state.lastCloudSyncAt ? `Saved ${formatSyncAge(state.lastCloudSyncAt)}` : "This browser only";
                return;
            }

            if (state.cloudSyncError) {
                icon.textContent = "⚠";
                l1.textContent = "Sync issue";
                l2.textContent = "Tap to retry";
                return;
            }

            icon.textContent = "☁";
            l1.textContent = "Cloud";
            l2.textContent = state.lastCloudSyncAt
                ? `Synced ${formatSyncAge(state.lastCloudSyncAt)}`
                : "Tap to sync";
        }

        let cloudSyncBadgeTimeIntervalId = null;

        function showCloudSyncBadge() {
            const root = document.getElementById("cloud-sync-badge");
            if (root) {
                root.classList.remove("hidden");
                updateCloudSyncBadge();
                if (!cloudSyncBadgeTimeIntervalId) {
                    cloudSyncBadgeTimeIntervalId = setInterval(() => {
                        const b = document.getElementById("cloud-sync-badge");
                        if (b && !b.classList.contains("hidden")) updateCloudSyncBadge();
                    }, 25000);
                }
            }
        }

        /** Click handler: full reconcile; does not block the UI (async IIFE). */
        function requestUserSync() {
            if (!state.playerName) return;
            if (cloudSyncManualInFlight) return;
            cloudSyncManualInFlight = true;
            state.cloudSyncError = null;
            updateCloudSyncBadge();
            void (async () => {
                try {
                    if (isFirebaseReady && db) {
                        await reconcileProfileWithCloud();
                    } else {
                        saveLocalProfile(state.playerName);
                        state.lastCloudSyncAt = Date.now();
                        state.cloudSyncError = null;
                    }
                } catch (e) {
                    console.warn("requestUserSync:", e);
                    state.cloudSyncError = "failed";
                } finally {
                    cloudSyncManualInFlight = false;
                    updateCloudSyncBadge();
                }
            })();
        }

        function profileStorageKey(name) {
            return "mathbattler_profile_" + encodeURIComponent(name || "default");
        }

        /** Firestore document id cannot contain `/` (path separator). */
        function safeProfileDocId(displayName) {
            return String(displayName || "player").replace(/\//g, "_");
        }

        function loadLocalProfile(name) {
            try {
                const raw = localStorage.getItem(profileStorageKey(name));
                if (!raw) return null;
                const d = JSON.parse(raw);
                if (!d || typeof d !== "object") return null;
                if (typeof d.unlockedLevels === "number" && d.unlockedLevels >= 1) return d;
                if (d.skillProfile != null && typeof d.skillProfile === "object" && Object.keys(d.skillProfile).length > 0) {
                    return { ...d, unlockedLevels: Math.max(1, typeof d.unlockedLevels === "number" ? d.unlockedLevels : 1) };
                }
            } catch (e) { console.warn("loadLocalProfile", e); }
            return null;
        }

        function saveLocalProfile(name) {
            try {
                if (typeof state.unlockedLevels !== "number" || state.unlockedLevels < 1) return;
                const sp = state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null);
                localStorage.setItem(profileStorageKey(name), JSON.stringify({
                    unlockedLevels: state.unlockedLevels,
                    skillProfile: sp,
                    playerName: name,
                    shards: typeof state.shards === "number" ? Math.max(0, Math.floor(state.shards)) : 0,
                    cosmeticsTier: typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0,
                    bestiary: Array.isArray(state.bestiary) ? state.bestiary.slice(0, 200) : [],
                    bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {}
                }));
            } catch (e) { console.warn("saveLocalProfile", e); }
        }

        function normalizeSkillProfile(raw) {
            const fallback = { "Algebra": { attempts: 0, corrects: 0 } };
            if (!raw || typeof raw !== "object") return fallback;
            const out = {};
            for (const [topic, v] of Object.entries(raw)) {
                if (v && typeof v === "object") {
                    out[topic] = {
                        attempts: typeof v.attempts === "number" ? v.attempts : (typeof v.a === "number" ? v.a : 0),
                        corrects: typeof v.corrects === "number" ? v.corrects : (typeof v.c === "number" ? v.c : 0)
                    };
                }
            }
            return Object.keys(out).length ? out : fallback;
        }

        function mergeSkillProfiles(a, b) {
            const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
            const out = {};
            for (const k of keys) {
                const va = a[k] || { attempts: 0, corrects: 0 };
                const vb = b[k] || { attempts: 0, corrects: 0 };
                out[k] = {
                    attempts: Math.max(va.attempts ?? 0, vb.attempts ?? 0),
                    corrects: Math.max(va.corrects ?? 0, vb.corrects ?? 0)
                };
            }
            return Object.keys(out).length ? out : { "Algebra": { attempts: 0, corrects: 0 } };
        }

        /**
         * Combine Firestore + localStorage so neither source can wipe the other.
         * unlockedLevels = max(1, cloud, local); skills = per-topic max of stats.
         */
        function mergeProfileRecords(cloudDoc, localDoc) {
            const c = cloudDoc && typeof cloudDoc === "object" ? cloudDoc : {};
            const l = localDoc && typeof localDoc === "object" ? localDoc : {};
            const ulCloud = typeof c.unlockedLevels === "number" && c.unlockedLevels >= 1 ? c.unlockedLevels : 0;
            const ulLocal = typeof l.unlockedLevels === "number" && l.unlockedLevels >= 1 ? l.unlockedLevels : 0;
            const unlockedLevels = Math.max(1, ulCloud, ulLocal);
            const skillProfile = mergeSkillProfiles(
                normalizeSkillProfile(c.skillProfile),
                normalizeSkillProfile(l.skillProfile)
            );
            const shards = Math.max(
                0,
                typeof c.shards === "number" ? Math.floor(c.shards) : 0,
                typeof l.shards === "number" ? Math.floor(l.shards) : 0
            );
            const cosmeticsTier = Math.max(
                0,
                typeof c.cosmeticsTier === "number" ? Math.floor(c.cosmeticsTier) : 0,
                typeof l.cosmeticsTier === "number" ? Math.floor(l.cosmeticsTier) : 0
            );
            const bestiary = (() => {
                const arrC = Array.isArray(c.bestiary) ? c.bestiary : [];
                const arrL = Array.isArray(l.bestiary) ? l.bestiary : [];
                const out = [];
                const seen = new Set();
                for (const it of [...arrC, ...arrL]) {
                    if (!it || typeof it !== "object") continue;
                    const id = String(it.id || "").trim();
                    if (!id || seen.has(id)) continue;
                    seen.add(id);
                    out.push({
                        id,
                        name: String(it.name || "").trim(),
                        level: typeof it.level === "number" ? Math.floor(it.level) : null,
                        topic: String(it.topic || "").trim(),
                        hue: String(it.hue || "").trim(),
                        defeatedAt: typeof it.defeatedAt === "number" ? it.defeatedAt : null,
                        svg: typeof it.svg === "string" ? it.svg : ""
                    });
                }
                return out.slice(0, 200);
            })();
            const bossCacheByLevel = (() => {
                const out = {};
                const mergeOne = (src) => {
                    const levels = src && typeof src === "object" ? src : {};
                    for (const [k, v] of Object.entries(levels)) {
                        const n = parseInt(k, 10);
                        if (!Number.isFinite(n) || n < 11) continue;
                        if (!v || typeof v !== "object") continue;
                        const rec = {
                            name: String(v.name || "").trim(),
                            blurb: String(v.blurb || "").trim(),
                            hue: String(v.hue || "").trim(),
                            topic: String(v.topic || "").trim(),
                            battleSvg: String(v.battleSvg || "").trim(),
                            mapSvg: String(v.mapSvg || "").trim(),
                            createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now()
                        };
                        const prev = out[n];
                        if (!prev) {
                            out[n] = rec;
                            continue;
                        }
                        // Prefer entries with both SVGs; then prefer newest.
                        const prevOk = !!(prev.battleSvg && prev.mapSvg);
                        const recOk = !!(rec.battleSvg && rec.mapSvg);
                        if (recOk && !prevOk) out[n] = rec;
                        else if (recOk === prevOk && (rec.createdAt || 0) > (prev.createdAt || 0)) out[n] = rec;
                    }
                };
                mergeOne(c.bossCacheByLevel);
                mergeOne(l.bossCacheByLevel);
                return out;
            })();
            return { unlockedLevels, skillProfile, shards, cosmeticsTier, bestiary, bossCacheByLevel };
        }

        async function persistMergedProfileToCloud(name, merged) {
            if (!isFirebaseReady || !db) return false;
            try {
                const pRef = doc(db, "artifacts", appId, "public", "data", "playerProfiles", safeProfileDocId(name));
                await setDoc(pRef, {
                    unlockedLevels: merged.unlockedLevels,
                    skillProfile: merged.skillProfile,
                    shards: merged.shards ?? 0,
                    cosmeticsTier: merged.cosmeticsTier ?? 0,
                    bestiary: Array.isArray(merged.bestiary) ? merged.bestiary : [],
                    bossCacheByLevel: merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : {},
                    displayName: name,
                    lastSyncedAt: Date.now()
                }, { merge: true });
                state.lastCloudSyncAt = Date.now();
                state.cloudSyncError = null;
                updateCloudSyncBadge();
                return true;
            } catch (e) {
                console.warn("persistMergedProfileToCloud:", e);
                state.cloudSyncError = "failed";
                updateCloudSyncBadge();
                return false;
            }
        }

        /** Push current session state to Firestore (merge). Call after progress changes and on a timer. */
        async function syncCurrentProfileToCloud() {
            if (!isFirebaseReady || !db || !state.playerName) return;
            const name = state.playerName;
            const sp = state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null);
            if (typeof state.unlockedLevels !== "number" || state.unlockedLevels < 1) return;
            try {
                await setDoc(doc(db, "artifacts", appId, "public", "data", "playerProfiles", safeProfileDocId(name)), {
                    unlockedLevels: state.unlockedLevels,
                    skillProfile: sp,
                    shards: typeof state.shards === "number" ? Math.max(0, Math.floor(state.shards)) : 0,
                    cosmeticsTier: typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0,
                    bestiary: Array.isArray(state.bestiary) ? state.bestiary.slice(0, 200) : [],
                    bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {},
                    displayName: name,
                    lastSyncedAt: Date.now()
                }, { merge: true });
                state.lastCloudSyncAt = Date.now();
                state.cloudSyncError = null;
                updateCloudSyncBadge();
            } catch (e) {
                console.warn("syncCurrentProfileToCloud:", e);
                state.cloudSyncError = "failed";
                updateCloudSyncBadge();
            }
        }

        async function fetchCloudProfileDoc(name, retries = 2) {
            if (!isFirebaseReady || !db) return null;
            let lastErr;
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const pRef = doc(db, "artifacts", appId, "public", "data", "playerProfiles", safeProfileDocId(name));
                    const snap = await getDoc(pRef);
                    return snap.exists() ? snap.data() : null;
                } catch (e) {
                    lastErr = e;
                    if (attempt < retries) await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
                }
            }
            console.warn("fetchCloudProfileDoc:", lastErr);
            return null;
        }

        /**
         * Merge cloud + localStorage + in-memory state (max progress), save locally, upload.
         * Use when Firebase connects late or tab becomes visible again.
         */
        async function reconcileProfileWithCloud() {
            if (!isFirebaseReady || !db || !state.playerName) return;
            const name = state.playerName;
            const cloud = await fetchCloudProfileDoc(name, 1);
            const local = loadLocalProfile(name);
            const session = {
                unlockedLevels: state.unlockedLevels,
                skillProfile: state.skillProfile != null ? state.skillProfile : normalizeSkillProfile(null),
                shards: typeof state.shards === "number" ? state.shards : 0,
                cosmeticsTier: typeof state.cosmeticsTier === "number" ? state.cosmeticsTier : 0,
                bestiary: Array.isArray(state.bestiary) ? state.bestiary : [],
                bossCacheByLevel: state.bossCacheByLevel && typeof state.bossCacheByLevel === "object" ? state.bossCacheByLevel : {}
            };
            const m1 = mergeProfileRecords(cloud, local);
            const merged = mergeProfileRecords(m1, session);
            state.unlockedLevels = merged.unlockedLevels;
            state.skillProfile = merged.skillProfile;
            state.shards = merged.shards ?? 0;
            state.cosmeticsTier = merged.cosmeticsTier ?? 0;
            state.bestiary = Array.isArray(merged.bestiary) ? merged.bestiary : [];
            state.bossCacheByLevel = merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : state.bossCacheByLevel;
            saveLocalProfile(name);
            await persistMergedProfileToCloud(name, merged);
            const ls = document.getElementById("level-screen");
            if (ls && !ls.classList.contains("hidden")) {
                renderLevelMenu();
                syncAiRouteNotice();
                syncMapQuestionBufferHint();
            }
        }

        let cloudSyncIntervalId = null;

        function startCloudSyncHeartbeat() {
            if (cloudSyncIntervalId) clearInterval(cloudSyncIntervalId);
            cloudSyncIntervalId = setInterval(() => {
                syncCurrentProfileToCloud();
            }, 45000);
        }

        /** One-time: enable Start button and show accurate cloud / local status. */
        function resolveLoginGate(kind) {
            if (loginGateResolved) return;
            loginGateResolved = true;
            const msg = {
                firebase_ok: "Online save ready — your progress can sync to your account.",
                firebase_fail: "Can't reach online save — using progress stored on this device.",
                no_config: "Playing on this device only — progress stays in this browser until online save is set up.",
                timeout: "Online save is slow or blocked — using progress stored on this device."
            };
            safeSet("cloud-status-msg", msg[kind] || msg.timeout, "innerText");
            const el = document.getElementById("cloud-status-msg");
            if (el) el.className = "mt-4 text-[10px] font-mono text-center uppercase " + (kind === "firebase_ok" ? "text-emerald-400" : "text-amber-400/90");
            safeSet("login-btn", "START ADVENTURE").disabled = false;
        }

        // --- REGRESSION MONITORING ---
        function setRegressionVaultSkipped() {
            safeSet("t-vault", "VAULT: local OK");
            const el = document.getElementById("t-vault");
            if (el) {
                el.className = "text-emerald-400 font-bold";
                el.title = "No Firebase in this build — saves stay in this browser. Expected, not a failure.";
            }
            safeSet("t-brendan", "PROFILE: local OK");
            const b = document.getElementById("t-brendan");
            if (b) {
                b.className = "text-emerald-400 font-bold";
                b.title = "Cloud profile sync is not configured; data is local-only. Expected.";
            }
        }

        function setRegressionVaultFailed() {
            safeSet("t-vault", "VAULT: FAIL");
            const el = document.getElementById("t-vault");
            if (el) el.className = "text-red-400 font-bold";
            safeSet("t-brendan", "PROFILE: FAIL");
            const br = document.getElementById("t-brendan");
            if (br) br.className = "text-red-400 font-bold";
        }

        function setRegressionVaultStalled() {
            safeSet("t-vault", "VAULT: still connecting…");
            const el = document.getElementById("t-vault");
            if (el) {
                el.className = "text-amber-400 font-bold";
                el.title = "Firebase is taking longer than usual; you can still tap Start below.";
            }
            safeSet("t-brendan", "PROFILE: waiting on cloud…");
            const br = document.getElementById("t-brendan");
            if (br) {
                br.className = "text-amber-400 font-bold";
                br.title = "Waiting for cloud connection before profile seed check.";
            }
        }

        async function runRegressions() {
            const visualsOk = ASSETS.slime.includes("SLIME_EYE_L") && ASSETS.wizard.includes("STAFF_WHEEL") && ASSETS.golem.includes("GOLEM_BODY");
            safeSet('t-visuals', visualsOk ? 'VISUALS: PASS' : 'VISUALS: FAIL');
            document.getElementById('t-visuals').className = visualsOk ? "text-green-400 font-bold" : "text-red-400 font-bold";
            
            if (window.MathJax) {
                safeSet('t-logic', 'MATHJAX: PASS');
                document.getElementById('t-logic').className = "text-green-400";
            }

            const panel = document.getElementById('interaction-panel');
            const scrollOk = panel && window.getComputedStyle(panel).flexShrink === '0';
            safeSet('t-scroll', scrollOk ? 'SCROLL: PASS' : 'SCROLL: FAIL');
            document.getElementById('t-scroll').className = scrollOk ? "text-green-400" : "text-red-400";

            const promptsOn = isPromptDebugEnabled();
            safeSet("t-prompts", promptsOn ? "PROMPTS: ON" : "PROMPTS: OFF");
            const pEl = document.getElementById("t-prompts");
            if (pEl) pEl.className = promptsOn ? "text-sky-300" : "text-slate-500";

            const bossCount = (() => {
                try {
                    const keys = Object.keys(state.bossCacheByLevel || {}).filter((k) => parseInt(k, 10) >= 11);
                    return keys.length;
                } catch (_) {
                    return 0;
                }
            })();
            safeSet("t-bosses", bossCount > 0 ? `BOSSES: ${bossCount}` : "BOSSES: 0");
            const bEl = document.getElementById("t-bosses");
            if (bEl) bEl.className = bossCount > 0 ? "text-emerald-300" : "text-slate-500";

            await runAiApiRegression();
        }

        async function connectFirebaseAndSeedRegression() {
            const app = initializeApp(JSON.parse(__firebase_config));
            auth = getAuth(app);
            db = getFirestore(app);
            await (typeof __initial_auth_token !== "undefined" ? signInWithCustomToken(auth, __initial_auth_token) : signInAnonymously(auth));
            currentUser = auth.currentUser;

            const testRef = doc(db, "artifacts", appId, "public", "data", "healthcheck", "status");
            await setDoc(testRef, { ts: Date.now() }, { merge: true });
            isFirebaseReady = true;
            safeSet("t-vault", "VAULT: PASS");
            document.getElementById("t-vault").className = "text-green-400";

            try {
                const brendanRef = doc(db, "artifacts", appId, "public", "data", "playerProfiles", "Student Brendan");
                let bSnap = await getDoc(brendanRef);
                if (!bSnap.exists()) {
                    await setDoc(brendanRef, { unlockedLevels: 1, skillProfile: { "Math": { attempts: 0, corrects: 0 } } });
                    bSnap = await getDoc(brendanRef);
                }
                if (bSnap.exists()) {
                    safeSet("t-brendan", "BRENDAN: PASS");
                    document.getElementById("t-brendan").className = "text-green-400";
                } else {
                    safeSet("t-brendan", "BRENDAN: FAIL");
                    document.getElementById("t-brendan").className = "text-red-400 font-bold";
                }
            } catch (seedErr) {
                console.warn("Brendan seed handshake:", seedErr);
                safeSet("t-brendan", "BRENDAN: FAIL");
                const br = document.getElementById("t-brendan");
                if (br) br.className = "text-red-400 font-bold";
            }

            resolveLoginGate("firebase_ok");
            setTimeout(() => {
                if (state.playerName && isFirebaseReady) reconcileProfileWithCloud();
            }, 150);
        }

        // --- AUTH & VAULT HANDSHAKE ---
        async function initFirebase() {
            setTimeout(() => {
                if (!loginGateResolved) {
                    setRegressionVaultStalled();
                    resolveLoginGate("timeout");
                }
            }, 8000);
            if (typeof __firebase_config === "undefined") {
                setRegressionVaultSkipped();
                resolveLoginGate("no_config");
                return;
            }
            try {
                await connectFirebaseAndSeedRegression();
            } catch (e) {
                console.error(e);
                isFirebaseReady = false;
                setRegressionVaultFailed();
                resolveLoginGate("firebase_fail");
            }
        }

        document.addEventListener("visibilitychange", () => {
            if (!state.playerName) return;
            if (document.visibilityState === "hidden") {
                syncCurrentProfileToCloud();
            } else if (document.visibilityState === "visible" && isFirebaseReady) {
                reconcileProfileWithCloud();
            }
        });

        window.addEventListener("pagehide", () => {
            if (state.playerName) syncCurrentProfileToCloud();
        });

        window.handleLogin = async () => {
            const name = document.getElementById('player-name-input').value.trim() || 'Student Brendan';
            state.playerName = name;
            const loginBtn = document.getElementById('login-btn');
            loginBtn.innerText = "ACCESSING...";
            loginBtn.disabled = true;

            state.bossCacheByLevel = loadBossCache();
            const localSnapshot = loadLocalProfile(name);
            const cloudRetries = localSnapshot ? 1 : 3;
            const cloudSnapshot = isFirebaseReady && db ? await fetchCloudProfileDoc(name, cloudRetries) : null;

            const merged = mergeProfileRecords(cloudSnapshot, localSnapshot);
            state.unlockedLevels = merged.unlockedLevels;
            state.skillProfile = merged.skillProfile;
            state.shards = merged.shards ?? 0;
            state.cosmeticsTier = merged.cosmeticsTier ?? 0;
            state.bestiary = Array.isArray(merged.bestiary) ? merged.bestiary : [];
            state.bossCacheByLevel = merged.bossCacheByLevel && typeof merged.bossCacheByLevel === "object" ? merged.bossCacheByLevel : state.bossCacheByLevel;
            saveLocalProfile(name);

            if (isFirebaseReady && db) {
                await persistMergedProfileToCloud(name, merged);
            } else {
                state.lastCloudSyncAt = Date.now();
                state.cloudSyncError = null;
            }

            safeSet('welcome-player-text', name);
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('level-screen').classList.remove('hidden');
            renderPlayerSprite();
            renderLevelMenu();
            syncAiRouteNotice();
            syncMapQuestionBufferHint();
            prefetchQuestion(); // Non-blocking: Fetches in the background while the user views the map
            showCloudSyncBadge();
            syncQuestionsApiBadge();
            startCloudSyncHeartbeat();
            void syncCurrentProfileToCloud();
        };

        function renderPlayerSprite() {
            const tier = typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0;
            const base = ASSETS.wizard;
            if (tier <= 0) {
                safeSet("player-sprite", base, "innerHTML");
                return;
            }
            // Cosmetic layering: add extra glyphs/aura around the existing wizard SVG.
            const inner = svgInnerMarkup(base);
            const extra =
                tier === 1
                    ? `<g opacity="0.85">
                           <circle cx="50" cy="54" r="36" fill="none" stroke="#a5b4fc" stroke-width="2" opacity="0.55"/>
                           <polygon points="50,12 56,26 72,28 60,38 64,54 50,46 36,54 40,38 28,28 44,26" fill="#7c3aed" opacity="0.25"/>
                       </g>`
                    : `<g opacity="0.9">
                           <circle cx="50" cy="54" r="38" fill="none" stroke="#facc15" stroke-width="2" opacity="0.35"/>
                           <circle cx="50" cy="54" r="30" fill="none" stroke="#a78bfa" stroke-width="2" opacity="0.35"/>
                           <path d="M20 76 Q50 52 80 76" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.35"/>
                       </g>`;
            const upgraded = `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_10px_20px_rgba(59,130,246,0.6)]" xmlns="http://www.w3.org/2000/svg">${inner}${extra}</svg>`;
            safeSet("player-sprite", upgraded, "innerHTML");
        }

        function syncShardsUi() {
            safeSet("shards-count", String(Math.max(0, Math.floor(state.shards || 0))));
        }

        function bestiaryIdForLevel(level) {
            return `boss:${level}`;
        }

        function addBossToBestiary(level) {
            const meta = getQuestNode(level);
            const id = bestiaryIdForLevel(level);
            state.bestiary = Array.isArray(state.bestiary) ? state.bestiary : [];
            if (state.bestiary.some((b) => b && b.id === id)) return;
            const svg = battleBossSvgMarkup(level);
            state.bestiary.unshift({
                id,
                level,
                name: String(meta?.name || `Boss Lv ${level}`),
                topic: String(meta?.topic || ""),
                hue: String(meta?.hue || ""),
                defeatedAt: Date.now(),
                svg
            });
            state.bestiary = state.bestiary.slice(0, 200);
        }

        window.openBestiary = () => {
            document.getElementById("bestiary-overlay")?.classList.remove("hidden");
            renderBestiary();
        };
        window.closeBestiary = () => document.getElementById("bestiary-overlay")?.classList.add("hidden");

        function renderBestiary() {
            const grid = document.getElementById("bestiary-grid");
            if (!grid) return;
            const items = Array.isArray(state.bestiary) ? state.bestiary : [];
            if (!items.length) {
                grid.innerHTML = `<div class="sm:col-span-2 text-center text-slate-400 border border-slate-700 rounded-xl p-6">No monsters unlocked yet. Defeat a boss to add it here.</div>`;
                return;
            }
            grid.innerHTML = items
                .map((b) => {
                    const name = String(b.name || "Unknown");
                    const lvl = typeof b.level === "number" ? b.level : "?";
                    const hue = String(b.hue || "#94a3b8");
                    const topic = String(b.topic || "");
                    return `
                    <div class="border border-slate-700 rounded-xl bg-slate-900/40 p-3 flex gap-3">
                        <div class="w-20 h-20 shrink-0 rounded-lg border border-slate-700 bg-slate-950/60 flex items-center justify-center overflow-hidden">
                            <div class="w-20 h-20">${String(b.svg || "").trim() || ""}</div>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center justify-between gap-2">
                                <div class="font-black text-slate-100 truncate">${name}</div>
                                <div class="text-xs font-black uppercase text-slate-400">Lv ${lvl}</div>
                            </div>
                            <div class="mt-1 text-xs font-bold" style="color:${hue}">${topic || "Math"}</div>
                            <div class="mt-2 text-[11px] text-slate-400">Defeated: ${b.defeatedAt ? new Date(b.defeatedAt).toLocaleDateString() : ""}</div>
                        </div>
                    </div>`;
                })
                .join("");
        }

        window.openUpgrades = () => {
            document.getElementById("upgrades-overlay")?.classList.remove("hidden");
            renderUpgrades();
        };
        window.closeUpgrades = () => document.getElementById("upgrades-overlay")?.classList.add("hidden");

        function renderUpgrades() {
            safeSet("upgrades-shards", String(Math.max(0, Math.floor(state.shards || 0))));
            const list = document.getElementById("upgrades-list");
            if (!list) return;
            const tier = typeof state.cosmeticsTier === "number" ? Math.max(0, Math.floor(state.cosmeticsTier)) : 0;
            const options = [
                { tier: 1, cost: 100, title: "Staff of Geometry", desc: "A sharper aura around your cloak." },
                { tier: 2, cost: 250, title: "Axiom Halo", desc: "Golden rings of logic orbit you." }
            ];
            list.innerHTML = options
                .map((o) => {
                    const owned = tier >= o.tier;
                    const canBuy = !owned && (state.shards || 0) >= o.cost;
                    return `
                    <div class="border border-slate-700 rounded-xl bg-slate-900/40 p-4">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="font-black text-slate-100">${o.title}</div>
                                <div class="text-[12px] text-slate-400 mt-1">${o.desc}</div>
                            </div>
                            <div class="shrink-0 text-right">
                                <div class="text-xs font-black uppercase text-amber-200">${owned ? "Owned" : `${o.cost} shards`}</div>
                                <button type="button" ${canBuy ? "" : "disabled"}
                                    onclick="buyUpgrade(${o.tier}, ${o.cost})"
                                    class="mt-2 px-3 py-2 rounded-lg text-xs font-black uppercase border ${canBuy ? "border-emerald-600 bg-emerald-700/30 hover:bg-emerald-600/40" : owned ? "border-slate-700 bg-slate-900/30 text-slate-400" : "border-slate-700 bg-slate-900/30 text-slate-500"}">
                                    ${owned ? "Equipped" : canBuy ? "Buy" : "Need more"}
                                </button>
                            </div>
                        </div>
                    </div>`;
                })
                .join("");
        }

        window.buyUpgrade = (tier, cost) => {
            const t = Math.max(0, Math.floor(tier || 0));
            const c = Math.max(0, Math.floor(cost || 0));
            const curTier = Math.max(0, Math.floor(state.cosmeticsTier || 0));
            if (t <= curTier) return;
            const shards = Math.max(0, Math.floor(state.shards || 0));
            if (shards < c) return;
            state.shards = shards - c;
            state.cosmeticsTier = t;
            renderPlayerSprite();
            syncShardsUi();
            renderUpgrades();
            if (state.playerName) saveLocalProfile(state.playerName);
            syncCurrentProfileToCloud();
        };

        window.analyzeEnemy = async () => {
            const q = state.activeQuestion || {};
            const meta = getQuestNode(state.currentLevel) || {};
            try {
                const { dsKey, dsModel } = getConfiguredAiKeys();
                if (!dsKey) throw new Error("no DashScope API key configured");
                const url = dashscopeChatCompletionsUrl();
                const headers = { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` };
                const systemMsg = {
                    role: "system",
                    content: "You output exactly one valid JSON object and nothing else. No markdown. No code fences."
                };
                const user =
                    `You are the game's tactical scan ability. Give a short, helpful, MYP-scope hint.\n` +
                    `Boss: ${JSON.stringify(String(meta.name || ""))}\n` +
                    `Level: ${state.currentLevel}\n` +
                    `Criterion: ${JSON.stringify(String(q.criterion || ""))}\n` +
                    `Topic: ${JSON.stringify(String(q.topic_category || meta.topic || ""))}\n` +
                    `Question: ${JSON.stringify(String(q.text || ""))}\n\n` +
                    `Return JSON keys:\n- hint: string (3-6 short sentences max; tactical tone; include 1 equation/template if helpful)\n`;
                debugLogAiPrompt("dashscope.scan", user);
                const body = JSON.stringify({
                    model: dsModel,
                    messages: [systemMsg, { role: "user", content: user }],
                    response_format: { type: "json_object" },
                    temperature: 0.6,
                    max_tokens: 260
                });
                const res = await fetchWithBackoff(url, { method: "POST", headers, body }, 3, {
                    min429DelayMs: 3500,
                    maxDelayMs: 20000,
                    initialDelayMs: 900
                });
                const data = await res.json();
                if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
                const content = data?.choices?.[0]?.message?.content;
                const parsed = parseModelJsonContentLenient(content);
                const hint = String(parsed?.hint || "").trim();
                state.requireReflection = false;
                showDetailedFeedback(`Scan Report:\n\n${hint || "No hint available."}`);
            } catch (e) {
                state.requireReflection = false;
                showDetailedFeedback(
                    "Scan failed — try again.\n\nFallback hint: Write what you know, define the variable, do one operation per line, and end with “Therefore, …”."
                );
                console.warn("analyzeEnemy:", e);
            }
        };

        let fetchPromise = null;
        let prefetchInFlight = false;

        function clearPrefetchFailureUi() {
            state.aiOfflineHint = null;
            state.lastPrefetchError = null;
        }

        function setPrefetchFailureFromError(e) {
            const m = e && e.message ? String(e.message) : String(e);
            state.lastPrefetchError = m.slice(0, 280);
            const is429 = (e && e.isRateLimit) || /(^|\D)429(\D|$)|rate limit/i.test(state.lastPrefetchError);
            if (is429) {
                state.aiOfflineHint =
                    "Live AI hit HTTP 429 (rate limit). Free models are often busy; this battle uses the offline pool until a request succeeds. " +
                    state.lastPrefetchError;
            } else if (/no AI API key|no DashScope API key/i.test(state.lastPrefetchError)) {
                state.aiOfflineHint =
                    "No DashScope key in ai-config.js — questions come from the built-in offline pool only.";
            } else if (/PREFETCH_TIMEOUT|did not finish within|Live AI slow or stalled/i.test(state.lastPrefetchError)) {
                state.aiOfflineHint =
                    "Live AI took too long (rate limits or slow network). This battle uses the offline pool — check DashScope in ai-config.js or try again.";
            } else if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(state.lastPrefetchError)) {
                state.aiOfflineHint =
                    (state.lastPrefetchError || "") +
                    " If you use Alibaba DashScope from a static web page, the API often blocks browser CORS — use a small same-origin proxy and set window.__dashscope_chat_completions_url to your proxy URL.";
            } else {
                state.aiOfflineHint = "Live AI request failed — using the offline question pool. " + state.lastPrefetchError;
            }
        }

        function syncAiRouteNotice() {
            const el = document.getElementById("ai-route-notice");
            if (!el) return;
            if (state.aiOfflineHint) {
                el.textContent = state.aiOfflineHint;
                el.classList.remove("hidden");
            } else {
                el.textContent = "";
                el.classList.add("hidden");
            }
        }

        function syncMapQuestionBufferHint() {
            const el = document.getElementById("map-question-buffer-hint");
            if (!el) return;
            const parts = [];
            if (prefetchInFlight) parts.push("Fetching next question…");
            if (state.nextQuestion) {
                const src = state.nextQuestion._questionSource;
                if (src === "offline") {
                    parts.push("Queued: offline pool.");
                    if (state.lastPrefetchError) parts.push(state.lastPrefetchError.slice(0, 140));
                } else if (src === "dashscope") {
                    parts.push("Queued: live AI (Alibaba DashScope / Qwen).");
                } else if (src === "openrouter") {
                    parts.push("Queued: live AI (legacy source).");
                } else if (src === "gemini") {
                    parts.push("Queued: legacy Gemini (removed in this build).");
                } else {
                    parts.push("Queued: next battle question ready.");
                }
            } else if (!prefetchInFlight) {
                parts.push("No question prefetched yet.");
            }
            el.textContent = parts.join(" ");
            el.className =
                "text-[11px] mt-1 px-2 " +
                (state.nextQuestion && state.nextQuestion._questionSource === "offline"
                    ? "text-amber-400/90"
                    : "text-slate-500");
        }

        function updateQuestionSourceBadge(q) {
            const el = document.getElementById("question-source-badge");
            if (!el) return;
            if (!q) {
                el.classList.add("hidden");
                el.textContent = "";
                el.title = "";
                return;
            }
            const base = "mb-2 text-center text-xs font-bold uppercase tracking-wide rounded-lg py-1.5 px-2 border";
            el.classList.remove("hidden");
            const src = q._questionSource;
            if (src === "offline") {
                el.className = `${base} text-amber-300 border-amber-600/60 bg-amber-950/40`;
                el.textContent = "This question · offline pool (not from live AI)";
                el.title = state.lastPrefetchError || state.aiOfflineHint || "Built-in fallback questions.";
            } else if (src === "dashscope") {
                el.className = `${base} text-emerald-200 border-emerald-600/60 bg-emerald-950/40`;
                const m = q._dashscopeModel ? String(q._dashscopeModel) : "Qwen";
                el.textContent = `This question · live AI · DashScope (${m})`;
                el.title = "This multiple-choice question was generated by DashScope for this battle.";
            } else if (src === "gemini") {
                el.className = `${base} text-slate-300 border-slate-500/60 bg-slate-900/80`;
                el.textContent = "This question · legacy Gemini (no longer supported here)";
                el.title = "Older session data; new questions use DashScope or offline only.";
            } else if (src === "openrouter") {
                el.className = `${base} text-slate-200 border-slate-500/60 bg-slate-900/80`;
                el.textContent = "This question · live AI (legacy provider)";
                el.title = "Older saved question source.";
            } else {
                el.classList.add("hidden");
                el.textContent = "";
                el.title = "";
            }
        }

        function syncQuestionsApiBadge() {
            const root = document.getElementById("ai-questions-status");
            const l2 = document.getElementById("ai-status-line2");
            if (!root || !l2) return;

            const { dsKey, dsModel } = getConfiguredAiKeys();
            const hasKey = !!dsKey;
            const routeTitle = dsKey ? `DashScope: ${dsModel}` : "";

            const isLiveSource = (q) =>
                q && (q._questionSource === "dashscope" || q._questionSource === "openrouter" || q._questionSource === "gemini");
            const queuedLive = isLiveSource(state.nextQuestion);
            const activeLive = isLiveSource(state.activeQuestion);
            const battleEl = document.getElementById("battle-screen");
            const inBattle = !!(battleEl && !battleEl.classList.contains("hidden"));

            const setStyle = (borderHue, line2Class) => {
                root.className =
                    `fixed right-2 sm:right-3 top-12 sm:top-14 z-[119] max-w-[min(100vw-1rem,15rem)] rounded-lg border px-2.5 py-1.5 shadow-lg backdrop-blur-sm ${borderHue}`;
                l2.className = `text-[10px] sm:text-xs font-bold truncate ${line2Class}`;
            };

            if (state.playerName) {
                if (inBattle && state.activeQuestion) {
                    const aq = state.activeQuestion;
                    const pf = prefetchInFlight ? " · prefetch next…" : "";
                    if (aq._questionSource === "offline") {
                        setStyle("border-amber-600/80 bg-amber-950/40", "text-amber-200");
                        l2.textContent = "This question · offline" + pf;
                        root.title =
                            (state.lastPrefetchError || state.aiOfflineHint || "Offline pool.") +
                            " System AI: PASS is only a connectivity smoke ping, not proof this MCQ is live.";
                        return;
                    }
                    if (aq._questionSource === "dashscope") {
                        setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
                        l2.textContent = "This question · DashScope" + pf;
                        root.title = aq._dashscopeModel
                            ? `Live MCQ · model ${aq._dashscopeModel}. Smoke test ≠ guarantee of every fetch.`
                            : "Live MCQ from DashScope.";
                        return;
                    }
                    if (aq._questionSource === "gemini") {
                        setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
                        l2.textContent = "This question · legacy Gemini" + pf;
                        root.title = "Legacy only; configure DashScope for live questions in HK.";
                        return;
                    }
                    if (aq._questionSource === "openrouter") {
                        setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
                        l2.textContent = "This question · live (legacy)" + pf;
                        root.title = "Legacy live source.";
                        return;
                    }
                }
                if (prefetchInFlight) {
                    setStyle("border-sky-500/70 bg-slate-900/95", "text-sky-300");
                    l2.textContent = "Fetching from API…";
                    root.title = hasKey ? `Request in progress (${routeTitle})` : "";
                    return;
                }
                if (queuedLive || activeLive) {
                    setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
                    l2.textContent = "Next / last · live AI";
                    const m = state.nextQuestion && state.nextQuestion._dashscopeModel;
                    root.title = m ? `${routeTitle} (queued model: ${m})` : routeTitle;
                    return;
                }
                if (!hasKey) {
                    setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
                    l2.textContent = "Offline only (no key)";
                    root.title = "Add a key in ai-config.js to enable live questions.";
                    return;
                }
                if (state.aiOfflineHint) {
                    setStyle("border-amber-600/80 bg-amber-950/40", "text-amber-200");
                    l2.textContent = "Using offline pool";
                    root.title = state.lastPrefetchError || state.aiOfflineHint;
                    return;
                }
                setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-300");
                l2.textContent = lastAiConnectivityCheck.ok ? "Ready (no question queued)" : "Waiting for API…";
                root.title = lastAiConnectivityCheck.detail || routeTitle;
                return;
            }

            if (!hasKey) {
                setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
                l2.textContent = "No API key";
                root.title = lastAiConnectivityCheck.detail || "Configure ai-config.js";
                return;
            }
            if (lastAiConnectivityCheck.ok === true) {
                setStyle("border-emerald-500/70 bg-slate-900/95", "text-emerald-300");
                l2.textContent = "Smoke test: API OK";
                root.title = lastAiConnectivityCheck.detail || routeTitle;
                return;
            }
            if (lastAiConnectivityCheck.ok === false) {
                setStyle("border-amber-600/80 bg-amber-950/40", "text-amber-200");
                l2.textContent = lastAiConnectivityCheck.summary;
                root.title = lastAiConnectivityCheck.detail || "";
                return;
            }
            setStyle("border-slate-600/90 bg-slate-900/95", "text-slate-400");
            l2.textContent = "Checking API…";
            root.title = routeTitle;
        }

        function renderLevelMenu() {
            const container = document.getElementById('levels-container');
            const total = Math.max(10, state.unlockedLevels + 1);
            const vbW = 360;
            const vbH = 1040;
            const pts = [];
            for (let i = 0; i < total; i++) {
                const q = QUEST_ROUTE[i % QUEST_ROUTE.length];
                const lap = Math.floor(i / QUEST_ROUTE.length);
                pts.push({ x: q.x + lap * 12, y: q.y + lap * 48 });
            }
            const curveBulge = 22;
            let pathD = `M ${pts[0].x} ${pts[0].y}`;
            for (let i = 1; i < pts.length; i++) {
                const p0 = pts[i - 1], p1 = pts[i];
                const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + curveBulge;
                pathD += ` Q ${mx} ${my} ${p1.x} ${p1.y}`;
            }
            const unlocked = state.unlockedLevels;
            let pathProgress = "";
            if (unlocked >= 2) {
                pathProgress = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 1; i < unlocked && i < pts.length; i++) {
                    const p0 = pts[i - 1], p1 = pts[i];
                    const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + curveBulge;
                    pathProgress += ` Q ${mx} ${my} ${p1.x} ${p1.y}`;
                }
            }

            const nodesHtml = pts.map((p, idx) => {
                const level = idx + 1;
                const open = level <= unlocked;
                const isCurrent = open && level === unlocked;
                const meta = getQuestNode(level);
                const ring = open ? (isCurrent ? "#facc15" : "#38bdf8") : "#475569";
                const fill = open ? "rgba(15,23,42,0.92)" : "rgba(30,41,59,0.75)";
                const cursor = open ? "pointer" : "not-allowed";
                const opacity = open ? 1 : 0.42;
                const glow = isCurrent ? ' class="quest-node-current"' : "";
                const lock = open ? "" : `<g opacity="0.92"><rect x="${p.x - 12}" y="${p.y - 92}" width="24" height="20" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="2"/><path d="M ${p.x - 8} ${p.y - 92} V${p.y - 102} Q ${p.x} ${p.y - 112} ${p.x + 8} ${p.y - 102} V${p.y - 92}" fill="none" stroke="#94a3b8" stroke-width="2"/><circle cx="${p.x}" cy="${p.y - 84}" r="3" fill="#475569"/></g>`;
                const nameFs = meta.name.length > 16 ? 7.5 : 9;
                return `
                <g${glow} data-level="${level}" style="cursor:${cursor};opacity:${opacity}">
                    <title>${meta.name} — ${meta.blurb}</title>
                    <circle cx="${p.x}" cy="${p.y}" r="46" fill="${fill}" stroke="${ring}" stroke-width="${open ? 4 : 3}"/>
                    <g transform="translate(${p.x - 50},${p.y - 52}) scale(0.52)">${mapBossPortrait(level)}</g>
                    <text x="${p.x}" y="${p.y + 58}" text-anchor="middle" fill="#e2e8f0" font-size="13" font-weight="bold" font-family="system-ui,sans-serif">${level}</text>
                    <text x="${p.x}" y="${p.y + 74}" text-anchor="middle" fill="${meta.hue}" font-size="${nameFs}" font-weight="700" font-family="system-ui,sans-serif">${meta.name}</text>
                    ${lock}
                </g>`;
            }).join("");

            container.innerHTML = `
            <svg viewBox="0 0 ${vbW} ${vbH}" class="w-full h-auto drop-shadow-2xl select-none" xmlns="http://www.w3.org/2000/svg" aria-label="Quest map">
                <defs>
                    <linearGradient id="quest-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#0f172a"/><stop offset="45%" style="stop-color:#1e1b4b"/><stop offset="100%" style="stop-color:#312e81"/>
                    </linearGradient>
                    <linearGradient id="quest-ground" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#14532d"/><stop offset="100%" style="stop-color:#052e16"/>
                    </linearGradient>
                    <filter id="quest-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <rect width="${vbW}" height="${vbH}" fill="url(#quest-sky)"/>
                <path d="M0 ${vbH - 120} Q90 ${vbH - 160} 180 ${vbH - 130} T360 ${vbH - 110} L360 ${vbH} L0 ${vbH} Z" fill="url(#quest-ground)" opacity="0.85"/>
                <path d="M0 ${vbH - 95} Q120 ${vbH - 125} 240 ${vbH - 85} L360 ${vbH - 75} L360 ${vbH} L0 ${vbH} Z" fill="#166534" opacity="0.35"/>
                <path d="${pathD}" fill="none" stroke="#334155" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
                <path d="${pathD}" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
                ${pathProgress ? `<path d="${pathProgress}" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#quest-soft-glow)"/>` : ""}
                ${unlocked >= 1 ? `<circle cx="${pts[Math.min(unlocked - 1, pts.length - 1)].x}" cy="${pts[Math.min(unlocked - 1, pts.length - 1)].y}" r="6" fill="#fbbf24" stroke="#fef3c7" stroke-width="2" opacity="0.95"/>` : ""}
                ${nodesHtml}
            </svg>`;

            container.querySelectorAll("g[data-level]").forEach((g) => {
                const lv = parseInt(g.getAttribute("data-level"), 10);
                g.addEventListener("click", () => {
                    if (lv <= state.unlockedLevels) startGame(lv);
                });
                g.addEventListener("keydown", (e) => {
                    if ((e.key === "Enter" || e.key === " ") && lv <= state.unlockedLevels) { e.preventDefault(); startGame(lv); }
                });
                if (lv <= state.unlockedLevels) {
                    g.setAttribute("tabindex", "0");
                    g.setAttribute("role", "button");
                }
            });
            const mapScroll = document.querySelector(".quest-map-wrap");
            if (mapScroll) mapScroll.scrollTop = 0;
            syncAiRouteNotice();
            syncMapQuestionBufferHint();
            syncQuestionsApiBadge();

            // Non-blocking: generate bosses for newly visible infinite levels (so map portraits/names fill in).
            const targets = [];
            for (let lv = Math.max(11, state.unlockedLevels); lv <= Math.max(11, state.unlockedLevels + 2); lv++) targets.push(lv);
            targets.forEach((lv) => {
                if (lv > QUEST_ROUTE.length && !state.bossCacheByLevel?.[lv]) {
                    ensureGeneratedBossForLevel(lv)
                        .then(() => {
                            const ls = document.getElementById("level-screen");
                            if (ls && !ls.classList.contains("hidden")) renderLevelMenu();
                        })
                        .catch((e) => console.warn("boss prefetch failed", e));
                }
            });
        }

        /** Ensures battle screen never waits unbounded on live AI (rate limits / slow API). */
        async function raceWithPrefetchTimeout(promise, ms) {
            let tid;
            const timeout = new Promise((_, rej) => {
                tid = setTimeout(() => {
                    const e = new Error(
                        `Live AI did not finish within ${Math.round(ms / 1000)}s (often rate limits or a long model chain). Using offline questions.`
                    );
                    e.code = "PREFETCH_TIMEOUT";
                    rej(e);
                }, ms);
            });
            try {
                return await Promise.race([promise, timeout]);
            } finally {
                clearTimeout(tid);
            }
        }

        async function fetchWithBackoff(url, options, retries = 5, backoffOpts = {}) {
            const min429 = backoffOpts.min429DelayMs != null ? backoffOpts.min429DelayMs : 5000;
            const maxDelay = backoffOpts.maxDelayMs != null ? backoffOpts.maxDelayMs : 20000;
            let delay = backoffOpts.initialDelayMs != null ? backoffOpts.initialDelayMs : 1000;
            for (let i = 0; i < retries; i++) {
                let response;
                try {
                    response = await fetch(url, options);
                } catch (err) {
                    if (i === retries - 1) throw err;
                    await new Promise((res) => setTimeout(res, delay));
                    delay = Math.min(delay * 2, maxDelay);
                    continue;
                }
                if (response.ok) return response;
                if (response.status === 429 && i < retries - 1) {
                    const raHeader = response.headers.get("Retry-After");
                    let raMs = 0;
                    if (raHeader) {
                        const n = parseInt(raHeader, 10);
                        if (!Number.isNaN(n)) raMs = Math.min(Math.max(0, n) * 1000, 120000);
                    }
                    const wait = Math.max(delay, min429, raMs);
                    await new Promise((res) => setTimeout(res, wait));
                    delay = Math.min(delay * 2, maxDelay);
                    continue;
                }
                if (response.status >= 500 && i < retries - 1) {
                    await new Promise((res) => setTimeout(res, delay));
                    delay = Math.min(delay * 2, maxDelay);
                    continue;
                }
                throw new Error(`HTTP error ${response.status}`);
            }
        }

        /** Used when the API key is missing or the model request fails — must vary so battles are not identical every turn. */
        const FALLBACK_QUESTIONS = [
            {
                topic_category: "Algebra",
                criterion: "A",
                text: "Solve $x+5=12$.",
                expected_answer: "7",
                success_criteria: "- Show the inverse operation.\n- Write the final value of $x$.\n- Quick check by substituting back.",
                ideal_explanation: "Subtract $5$ from both sides: $x = 12 - 5 = 7$. Check: $7+5=12$.",
                plotly_spec: "",
                type: "input"
            },
            {
                topic_category: "Arithmetic",
                criterion: "A",
                text: "Calculate $2 + 3 \\times 4$.",
                expected_answer: "14",
                success_criteria: "- Use correct order of operations.\n- Show the intermediate multiplication.",
                ideal_explanation: "Multiply first: $3 \\times 4 = 12$, then $2 + 12 = 14$.",
                plotly_spec: "",
                type: "input"
            },
            {
                topic_category: "Arithmetic",
                criterion: "A",
                text: "Calculate $\\frac{1}{2} + \\frac{1}{4}$.",
                expected_answer: "$\\frac{3}{4}$",
                success_criteria: "- Use a common denominator.\n- Combine numerators.\n- Simplify if needed.",
                ideal_explanation: "Use a common denominator: $\\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}$.",
                plotly_spec: "",
                type: "input"
            },
            {
                topic_category: "Arithmetic",
                criterion: "A",
                text: "Calculate $8 - 3$.",
                expected_answer: "5",
                success_criteria: "- Correct subtraction.\n- Final statement.",
                ideal_explanation: "Subtract: $8 - 3 = 5$.",
                plotly_spec: "",
                type: "input"
            },
            {
                topic_category: "Geometry",
                criterion: "C",
                text: "A square has side length $4$. Determine its perimeter.",
                expected_answer: "16",
                success_criteria: "- State the perimeter rule.\n- Show multiplication.\n- Include units if given.",
                ideal_explanation: "Perimeter of a square is $4 \\times \\text{side} = 4 \\times 4 = 16$.",
                plotly_spec: "",
                type: "input"
            },
            {
                topic_category: "Arithmetic",
                criterion: "A",
                text: "Calculate $9 \\div 3$.",
                expected_answer: "3",
                success_criteria: "- Correct division.\n- Final statement.",
                ideal_explanation: "$9 \\div 3 = 3$.",
                plotly_spec: "",
                type: "input"
            }
        ];

        function pickFallbackQuestion(excludeText) {
            const norm = (t) => (t == null ? "" : String(t)).trim();
            const ex = norm(excludeText);
            const filtered = FALLBACK_QUESTIONS.filter((q) => norm(q.text) !== ex);
            const pool = filtered.length ? filtered : FALLBACK_QUESTIONS;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            return { ...pick, _questionSource: "offline" };
        }

        function normalizeQuestionStem(t) {
            return (t == null ? "" : String(t))
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();
        }

        /**
         * Normalize common LLM LaTeX currency glitches like `$\$15$` or `$ \$ 15 $`.
         * MathJax can render these, but we keep dollars out of math mode to avoid edge-case parsing bugs.
         */
        function normalizeLatexCurrency(s) {
            if (s == null) return s;
            let out = String(s);
            // Replace currency wrapped in inline math mode with plain escaped dollars.
            // `$\$15$` => `\$15`
            out = out.replace(/\$\s*\\\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, amt) => `\\$${amt}`);
            // Some models emit `$15` inside math mode without escaping: `$ $15 $` etc. Try to fix that too.
            out = out.replace(/\$\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, amt) => `\\$${amt}`);
            return out;
        }

        function extractAllIntegers(s) {
            const out = [];
            if (s == null) return out;
            const text = String(s);
            const re = /-?\d+/g;
            let m;
            while ((m = re.exec(text))) {
                const n = parseInt(m[0], 10);
                if (!Number.isNaN(n)) out.push(n);
            }
            return out;
        }

        function synthesizeQuantityStoryPlotlySpec(q) {
            const blob = `${String(q?.text || "")} ${String(q?.ideal_explanation || "")}`.toLowerCase();
            const ints = extractAllIntegers(blob);
            if (ints.length < 2) return "";

            // Heuristic: use the last two numbers as (change, end) or (end, change) depending on verbs.
            const a = ints[ints.length - 2];
            const b = ints[ints.length - 1];
            let change = a;
            let end = b;

            // If story implies subtraction (spent/gave away/lost), treat 'a' as change and compute start = end + change.
            const isSubtractStory = /\b(spend|spent|gave away|give away|lost|take away|take out|removed|minus|left)\b/.test(blob);
            const isAddStory = /\b(add|added|got|received|plus|more)\b/.test(blob);

            // Prefer end to be the larger number if add story; prefer end to be the smaller if subtract story.
            if (isAddStory && a > b) {
                change = b;
                end = a;
            } else if (isSubtractStory && a < b) {
                change = b;
                end = a;
            }

            const absChange = Math.abs(change);
            let start = isSubtractStory ? end + absChange : end - absChange;
            if (!Number.isFinite(start)) start = end - Math.abs(change);

            const signedChange = isSubtractStory ? -absChange : absChange;
            const labels = ["Start", "Change", "End"];
            const values = [start, signedChange, end];
            const barColors = ["#60a5fa", signedChange < 0 ? "#f87171" : "#34d399", "#fbbf24"];

            const spec = {
                data: [
                    {
                        type: "bar",
                        x: labels,
                        y: values,
                        marker: { color: barColors }
                    }
                ],
                layout: {
                    title: "Start → Change → End",
                    xaxis: { title: "" },
                    yaxis: { title: "Amount", zeroline: true }
                }
            };
            return JSON.stringify(spec);
        }

        /** True when text + explanation use concrete quantities / stories that should always get a Plotly chart. */
        function responseNeedsNonEmptyPlotlyChart(q) {
            if (!q || typeof q !== "object") return false;
            const blob = `${String(q.text || "")} ${String(q.ideal_explanation || "")}`.toLowerCase();
            const hasNumeric =
                /\d/.test(blob) ||
                /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/.test(
                    blob
                );
            if (!hasNumeric) return false;
            if (/\bmarbles?\b/.test(blob)) return true;
            const physical =
                /\b(apples?|cand(y|ies)|cookies?|toys?|oranges?|stickers?|balloons?|pencils?|eggs?)\b/.test(blob) ||
                /\b(bag|box|jar|basket)\b/.test(blob);
            const story =
                /\b(gave|give|gave away|received|got|lost|take out|take away|put in|started with|began with|had some|now has|now have|how many .{0,16}left|remaining|in all|altogether|more than|fewer|difference|total|sum|combined|plus|minus)\b/.test(
                    blob
                );
            const analogy =
                /\b(think of (it|this) like|picture|imagine|like a (bag|jar|box)|number line)\b/.test(blob);
            return physical && (story || analogy);
        }

        function buildMypConstraintsBlock(level) {
            const band =
                level <= 3 ? "Foundations (early Year 7 readiness)" : level <= 6 ? "IB MYP Year 7" : "IB MYP Year 8";
            const allowedByBand =
                level <= 3
                    ? [
                          "integer operations, order of operations, simple fractions/decimals/percent basics",
                          "one-step and simple two-step linear equations in one variable",
                          "simple patterns and substitution (evaluate an expression for a given value)",
                          "simple perimeter/area with whole-number dimensions"
                      ]
                    : level <= 6
                      ? [
                            "linear expressions and equations; solving and checking solutions",
                            "fractions/decimals/percent conversions and problems in context",
                            "ratio and rates (unit rate) with straightforward numbers",
                            "basic geometry: perimeter/area; angle facts; simple coordinates"
                        ]
                      : [
                            "multi-step linear equations; distributive property; combining like terms",
                            "proportional relationships and percent change (increase/decrease) in context",
                            "intro to functions as input/output; reading simple graphs (no advanced curve fitting)",
                            "basic statistics: mean/median/mode; simple data displays and interpretation"
                        ];

            const outOfScope = [
                "calculus (derivatives/integrals/limits)",
                "trigonometry (sin/cos/tan)",
                "quadratic formula / completing the square as a main skill",
                "simultaneous equations beyond very simple intuition",
                "logarithms"
            ];

            return (
                `\n\nCURRICULUM CONSTRAINTS (must follow):\n` +
                `- Target band: ${band}. Use this level to set difficulty.\n` +
                `- Keep the problem within IB MYP Year 7–8 scope. No “surprise” senior topics.\n` +
                `- Allowed focus areas for this band: ${allowedByBand.join("; ")}.\n` +
                `- Explicitly avoid: ${outOfScope.join(", ")}.\n` +
                `- Use MYP-friendly command terms in the stem when natural (e.g., "solve", "calculate", "determine", "simplify").\n` +
                `- Explanation quality (Rubicon-style): show the method clearly, include 1 quick check when possible, and keep the reading level ~age 12–14.\n` +
                `- Make distractors realistic: common student mistakes for this band (sign error, order of operations, wrong percent base, etc.).\n`
            );
        }

        function buildMathQuestionPrompt() {
            const easier = state.forceEasierNextQuestion === true;
            const diff = easier ? "Introductory" : (state.currentLevel <= 3 ? "Introductory" : (state.currentLevel <= 6 ? "Grade 7" : "Grade 8"));
            const criterionCycle = ["A", "B", "C"];
            const targetCriterion = criterionCycle[state.turnIndex % criterionCycle.length];
            const enemyName = String(getQuestNode(state.currentLevel)?.name || "Enemy");
            const contextSeeds = [
                "sports practice (scores, laps, training plan)",
                "shopping/budget (discounts, tax, unit price)",
                "school timetable (minutes, periods, totals)",
                "science lab (measurement, rates, density-style ratios)",
                "music (beats per minute, patterns, repeats)",
                "video games (XP, levels, upgrades, probability drops)",
                "travel (distance-time-speed with simple numbers)",
                "geometry in a room (perimeter/area, tiles, fencing)",
                "data display (table/bar chart/line chart interpretation)",
                "patterns & sequences (nth term, rule, justification)"
            ];
            const pickSeed = (nonce) => {
                const s = String(nonce || "");
                let h = 0;
                for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
                return contextSeeds[h % contextSeeds.length];
            };
            let weakestTopic = "Algebra";
            if (state.skillProfile) {
                let lowestRatio = 1.1;
                Object.entries(state.skillProfile).forEach(([topic, data]) => {
                    const ratio = data.attempts === 0 ? 0 : data.corrects / data.attempts;
                    if (ratio < lowestRatio) {
                        lowestRatio = ratio;
                        weakestTopic = topic;
                    }
                });
            }
            // 70/30 interleaving: 70% weakest-topic retention, 30% alternative topic progression.
            let chosenTopic = weakestTopic;
            try {
                const topics = state.skillProfile ? Object.keys(state.skillProfile) : [];
                const others = topics.filter((t) => t && t !== weakestTopic);
                if (others.length && Math.random() < 0.3) {
                    chosenTopic = others[Math.floor(Math.random() * others.length)];
                }
            } catch (_) {}
            const nonce =
                typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
            const contextSeed = pickSeed(nonce);
            let avoidPrior = "";
            const prevStem = state.activeQuestion?.text;
            if (prevStem && String(prevStem).trim()) {
                const snippet = String(prevStem).trim().slice(0, 320);
                avoidPrior = `\n\nThe player was just shown this stem — you must NOT repeat it, reuse the same numbers with different wording, or mirror its structure. Produce a clearly different problem:\n${JSON.stringify(snippet)}`;
            }
            return `[SEED: ${Date.now()}] [NONCE: ${nonce}]

Role: You are an expert IB Middle Years Programme (MYP) Math Examiner acting as a slightly snarky Dungeon Master for a middle school RPG.

Current Combat Parameters:
- Difficulty: ${diff}
- Topic: ${chosenTopic}
- Enemy Name: ${enemyName}

Task: Generate 1 unique, rigorous MYP-aligned math question based on the topic and difficulty.

Tone & Narrative (CRITICAL):
- The question "text" MUST be formatted in two parts:
  1) The Taunt: a short, slightly arrogant, math-themed insult/challenge spoken by the enemy (appeal to ages 11–13).
  2) The Equation/Problem: the actual math question immediately after, stated clearly. Do NOT hide the math in a confusing word problem unless the topic is Real-Life Modeling.

Technical & Formatting Constraints:
- All math notation MUST use LaTeX (e.g., $x^2 + 5 = 14$).
- IMPORTANT: When using units like cm, m, or percent, ALWAYS wrap them in \\text{} (e.g., $25 \\text{ cm}$).
- Combat questions MUST be open-ended typed response: type MUST be "input" and there MUST NOT be MCQ options in the combat schema.
- Return JSON ONLY (no markdown, no code fences).
${avoidPrior}
${buildMypConstraintsBlock(state.forceEasierNextQuestion === true ? 1 : state.currentLevel)}

CREATIVITY & VARIATION (must follow):
- Use this scenario seed to keep things fresh: ${contextSeed}.
- Do NOT reuse the same story template repeatedly. Avoid the cliché “bag of marbles / gave away / found more / now has” structure unless the prompt explicitly demands it.
- Vary the surface form: sometimes ask to simplify, solve, determine, represent with an equation, interpret a small table/graph, or justify a pattern (especially for Criterion B).
- Vary names, objects, and settings. Prefer realistic MYP contexts (school, sports, shopping, science, games) over marbles unless needed.
- For Criterion B, prioritize patterns/sequences/generalization and justification (not just a word-problem equation solve).

For ideal_explanation: write as if explaining to a smart 10-year-old — short sentences, everyday words, friendly tone, optional one simple analogy; still be mathematically correct and use LaTeX for formulas. Do not sound like a dry textbook abstract.

For charts vs words: If plotly_spec is "", you must NOT say there is a graph, picture, chart, plot, or "visual" in "text" or "ideal_explanation". If you want a chart, set plotly_spec to a non-empty JSON STRING (escaped in the outer JSON) with valid Plotly content: at least one trace with numeric coordinates (e.g. scatter with "x" and "y" arrays of numbers, or bars). The app renders only plotly_spec — promising a visual in prose without filling plotly_spec is wrong.

Default toward a chart when the math has a clear picture: linear or simple equations, inequalities on a number line, proportional relationships, "y vs x", comparing two quantities, or geometry with lengths/angles. Use a minimal Plotly chart (e.g. scatter mode lines+markers through two points, or a bar chart for two numbers). Reserve plotly_spec "" only when a graph would truly add nothing (e.g. "which expression is prime?", pure symbol push with no numeric story).

STRICT (addition/subtraction & stories): If the question OR ideal_explanation involves marbles, apples, cookies, toys, a bag/jar/box, "gave away", "started with", "take out", "how many left", "in all", or any similar real-world quantity story, plotly_spec MUST be a non-empty valid Plotly string — this is required, not optional.

Preferred chart for these: a bar chart with x = ["Start","Change","End"] and y = [start, change, end], where change is NEGATIVE for take-away/spent/gave-away and POSITIVE for added/received. This directly shows the math step.

Avoid an unlabeled line graph that doesn’t connect to the story steps.`;
        }

        function parseModelJsonContent(content) {
            if (content == null) throw new Error("empty model content");
            let s = typeof content === "string" ? content.trim() : JSON.stringify(content);
            const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (fenced) s = fenced[1].trim();
            return JSON.parse(s);
        }

        function parseModelJsonContentLenient(content) {
            if (content == null) throw new Error("empty model content");
            let s = typeof content === "string" ? content.trim() : JSON.stringify(content);
            const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (fenced) s = fenced[1].trim();
            try {
                return JSON.parse(s);
            } catch (_) {
                // Try to salvage the first JSON object in the output.
                const start = s.indexOf("{");
                const end = s.lastIndexOf("}");
                if (start >= 0 && end > start) {
                    const candidate = s.slice(start, end + 1);
                    return JSON.parse(candidate);
                }
                throw _;
            }
        }

        function validateQuestionPayload(q) {
            if (!q || typeof q !== "object") throw new Error("invalid question");
            const need = ["text", "ideal_explanation", "type", "expected_answer", "criterion", "success_criteria"];
            for (const k of need) {
                if (q[k] == null || q[k] === "") throw new Error("missing " + k);
            }
            // Sanitize currency patterns before rendering and before answer/option comparisons.
            q.text = normalizeLatexCurrency(q.text);
            q.ideal_explanation = normalizeLatexCurrency(q.ideal_explanation);
            q.expected_answer = normalizeLatexCurrency(q.expected_answer);
            q.criterion = String(q.criterion).trim().toUpperCase();
            if (!["A", "B", "C"].includes(q.criterion)) throw new Error("criterion must be A, B, or C");
            if (q.type !== "input") throw new Error('type must be "input"');
            if (q.plotly_spec != null && typeof q.plotly_spec === "object") {
                try {
                    q.plotly_spec = JSON.stringify(q.plotly_spec);
                } catch (_) {
                    q.plotly_spec = "";
                }
            }
            if (q.plotly_spec == null) q.plotly_spec = "";
            if (q.topic_category == null) q.topic_category = "Math";

            // If this is a quantity story and the model didn't give a valid chart, synthesize a minimal number line.
            // This prevents "imagine a number line" with no actual plot.
            if (responseNeedsNonEmptyPlotlyChart(q) && parsePlotlySpec(q.plotly_spec) == null) {
                const synthesized = synthesizeQuantityStoryPlotlySpec(q);
                if (synthesized) q.plotly_spec = synthesized;
            }
        }

        function assertSmokePingJson(parsed) {
            if (parsed && (parsed.ping === "ok" || parsed.ok === true)) return;
            throw new Error("Smoke marker missing");
        }

        async function smokePingDashScope(dashscopeKey, modelId, signal) {
            const url = dashscopeChatCompletionsUrl();
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dashscopeKey}`
            };
            const bodyBase = {
                model: modelId,
                messages: [{ role: "user", content: 'Output only JSON: {"ping":"ok"}' }],
                max_tokens: 48
            };
            const attemptOnce = async () => {
                let r = await fetch(url, {
                    method: "POST",
                    headers,
                    signal,
                    body: JSON.stringify({ ...bodyBase, response_format: { type: "json_object" } })
                });
                if (r.status === 400) {
                    r = await fetch(url, {
                        method: "POST",
                        headers,
                        signal,
                        body: JSON.stringify(bodyBase)
                    });
                }
                return r;
            };
            let res = await attemptOnce();
            if (res.status === 429) {
                await new Promise((r) => setTimeout(r, 6000));
                res = await attemptOnce();
            }
            if (res.status === 429) {
                await new Promise((r) => setTimeout(r, 12000));
                res = await attemptOnce();
            }
            if (res.status === 429) {
                const e = new Error("DashScope rate limited (429) after retries");
                e.isRateLimit = true;
                throw e;
            }
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`DashScope HTTP ${res.status}: ${errText.slice(0, 200)}`);
            }
            const data = await res.json();
            if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
            const content = data?.choices?.[0]?.message?.content;
            if (content == null || String(content).trim() === "") throw new Error("DashScope: empty content");
            assertSmokePingJson(parseModelJsonContent(content));
        }

        async function runAiApiRegression() {
            const el = document.getElementById("t-ai");
            const set = (label, cls, title) => {
                safeSet("t-ai", label);
                if (el) {
                    el.className = cls;
                    el.title = title || "";
                }
            };
            const { dsKey, dsModel } = getConfiguredAiKeys();
            if (!dsKey) {
                lastAiConnectivityCheck = {
                    ok: false,
                    summary: "No API key",
                    detail: "Set __dashscope_api_key in ai-config.js (Gemini is not used — unavailable in HK)."
                };
                set(
                    "AI: SKIP",
                    "text-slate-400 font-bold",
                    "No AI key — offline pool only. When you have a key, the banner above each MCQ shows live vs offline for that question."
                );
                syncQuestionsApiBadge();
                return;
            }
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 22000);
            lastAiConnectivityCheck = { ok: null, summary: "", detail: "" };
            syncQuestionsApiBadge();
            try {
                await smokePingDashScope(dsKey, dsModel, ctrl.signal);
                clearTimeout(tid);
                lastAiConnectivityCheck = {
                    ok: true,
                    summary: "API reachable",
                    detail: `DashScope · ${dsModel}`
                };
                set(
                    "AI: PASS",
                    "text-green-400 font-bold",
                    `${lastAiConnectivityCheck.detail} — Smoke ping only (tiny JSON). The strip does not mean this battle’s MCQ is live; read the label above the question text.`
                );
            } catch (e) {
                clearTimeout(tid);
                if (e && e.isRateLimit) {
                    lastAiConnectivityCheck = {
                        ok: false,
                        summary: "Rate limited (429)",
                        detail: e.message || "Upstream busy — try again later"
                    };
                    set(
                        "AI: 429",
                        "text-amber-400 font-bold",
                        (e.message || "Rate limited") +
                            " — Smoke failed; live MCQs may still work or fall back to offline (see banner above question)."
                    );
                    syncQuestionsApiBadge();
                    return;
                }
                const msg = e && e.name === "AbortError" ? "Timeout (22s)" : e && e.message ? e.message : String(e);
                lastAiConnectivityCheck = { ok: false, summary: "API check failed", detail: msg };
                set(
                    "AI: FAIL",
                    "text-red-400 font-bold",
                    msg + " — Smoke only; check the MCQ source banner and Questions chip on the battle screen."
                );
                console.warn("AI API regression:", e);
            }
            syncQuestionsApiBadge();
        }

        function dashScopeQuestionUserSuffix() {
            return (
                "\n\nHard requirements (Qwen-compatible JSON):\n" +
                '- type must be the string "input".\n' +
                '- criterion must be one of "A", "B", "C" (targeted by the prompt).\n' +
                "- expected_answer: the canonical final answer as a short string (may include LaTeX).\n" +
                "- success_criteria: 2–5 bullet points (as a single string) describing what earns full credit for the targeted criterion.\n" +
                '- plotly_spec: string only — "" OR one JSON-encoded Plotly spec with escaped inner quotes; never a raw object at this key. If "", do not mention any graph/chart/visual in text or ideal_explanation. If not "", include real numeric trace data so a chart can render (e.g. scatter with numeric "x" and "y").\n' +
                "- Curriculum: keep within IB MYP Year 7–8 scope and obey the band indicated in the prompt; avoid calculus/trig/logs/quadratic formula.\n" +
                '- REQUIRED: If text or ideal_explanation mentions marbles, apples, cookies, toys, a bag/box/jar, "gave"/"take away"/"started with"/"how many left"/"in all" or similar quantity stories, plotly_spec MUST NOT be "". Use a number-line scatter (y all 0) or a bar chart with numeric heights.\n' +
                '- Prefer non-empty plotly_spec when the math has a natural picture (equations, lines, rates, two quantities to compare, number-line ideas); a minimal scatter or bar chart is enough. Use "" only when a graph would not help.\n' +
                "- ideal_explanation: short teacher-style solution steps and a quick check; LaTeX for math; keep it readable for Year 7/8.\n" +
                '\nReturn one JSON object with exactly these keys: topic_category, criterion, text, expected_answer, success_criteria, ideal_explanation, plotly_spec, type. No markdown, no code fences.'
            );
        }

        async function fetchQuestionViaDashScope(dashscopeKey, basePrompt) {
            const url = dashscopeChatCompletionsUrl();
            const { dsModel } = getConfiguredAiKeys();
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dashscopeKey}`
            };
            const systemMsg = {
                role: "system",
                content:
                    "You output exactly one valid JSON object and nothing else. No markdown code fences, no commentary. Use double quotes for JSON strings. For word problems with objects (marbles, apples, bags) or addition/subtraction stories, always include a non-empty plotly_spec with numeric Plotly data (number line or bars) — never leave plotly_spec empty for those."
            };
            const questionBackoff = { min429DelayMs: 3500, maxDelayMs: 22000, initialDelayMs: 1000 };

            const callModel = async (userContent) => {
                debugLogAiPrompt("dashscope.user", userContent);
                const messages = [systemMsg, { role: "user", content: userContent }];
                const bodyWithJson = JSON.stringify({
                    model: dsModel,
                    messages,
                    response_format: { type: "json_object" },
                    temperature: 0.65,
                    max_tokens: 1100
                });
                const bodyPlain = JSON.stringify({
                    model: dsModel,
                    messages,
                    temperature: 0.65,
                    max_tokens: 1100
                });
                let res;
                try {
                    res = await fetchWithBackoff(url, { method: "POST", headers, body: bodyWithJson }, 4, questionBackoff);
                } catch (e) {
                    const m = e && e.message ? String(e.message) : "";
                    if (m.includes("400")) {
                        res = await fetchWithBackoff(url, { method: "POST", headers, body: bodyPlain }, 4, questionBackoff);
                    } else {
                        throw e;
                    }
                }
                const data = await res.json();
                if (data && data.error) {
                    throw new Error(data.error.message || JSON.stringify(data.error));
                }
                const content = data?.choices?.[0]?.message?.content;
                const parsed = parseModelJsonContent(content);
                validateQuestionPayload(parsed);
                return parsed;
            };

            const recentSet = new Set((state.recentQuestionStems || []).slice(0, MAX_RECENT_STEMS));
            const isDup = (t) => {
                const n = normalizeQuestionStem(t);
                return !!n && recentSet.has(n);
            };

            let parsed = await callModel(basePrompt + dashScopeQuestionUserSuffix());
            if (isDup(parsed.text)) {
                const avoid = (state.recentQuestionStems || []).slice(0, 10).map((s) => `- ${s}`).join("\n");
                parsed = await callModel(
                    basePrompt +
                        dashScopeQuestionUserSuffix() +
                        "\n\nCritical: You repeated a recent question. Regenerate a clearly different problem (new numbers, different story, different structure). Avoid anything similar to these recent stems:\n" +
                        avoid
                );
                validateQuestionPayload(parsed);
                if (isDup(parsed.text)) {
                    parsed = await callModel(
                        basePrompt +
                            dashScopeQuestionUserSuffix() +
                            "\n\nFinal warning: you repeated a recent question AGAIN. Output a brand-new problem with different numbers/context and a different structure. Do not reuse any prior stem patterns."
                    );
                    validateQuestionPayload(parsed);
                    if (isDup(parsed.text)) {
                        throw new Error("DashScope returned a duplicate question stem (recent history)");
                    }
                }
            }
            // Enforce charts for quantity stories (especially marbles). Retry a few times if the model ignores it.
            if (responseNeedsNonEmptyPlotlyChart(parsed)) {
                const chartRetries = 3;
                for (let i = 0; i < chartRetries && !parsePlotlySpec(parsed.plotly_spec); i++) {
                    parsed = await callModel(
                        basePrompt +
                            dashScopeQuestionUserSuffix() +
                            '\n\nYour previous JSON was rejected: it used a marble/bag/object quantity story, so plotly_spec MUST be a non-empty valid Plotly JSON string.\n' +
                            'You MUST include a chart. Use one of these minimal templates:\n' +
                            '1) Bars (preferred): {"data":[{"type":"bar","x":["Start","Change","End"],"y":[23,12,35]}],"layout":{"title":"Start → Change → End"}}\n' +
                            '   For take-away stories, make Change negative, e.g. {"y":[17,-5,12]}.\n' +
                            '2) Number line (ok): {"data":[{"type":"scatter","mode":"lines+markers","x":[23,35],"y":[0,0]}],"layout":{"title":"Number line"}}\n' +
                            'Pick numbers that match your story (use the exact quantities from the problem). plotly_spec must be a JSON-ENCODED STRING at that key.\n' +
                            'Do not leave plotly_spec empty.'
                    );
                    validateQuestionPayload(parsed);
                }
                if (!parsePlotlySpec(parsed.plotly_spec)) {
                    throw new Error("DashScope returned empty/invalid plotly_spec for a quantity story (chart required)");
                }
            }
            return Object.assign(parsed, { _questionSource: "dashscope", _dashscopeModel: dsModel });
        }

        function getPrefetchTimeoutMs() {
            // Debug/testing: allow bumping timeout without editing code.
            // - query: ?aiTimeoutMs=45000
            // - config: window.__prefetch_ai_timeout_ms = 45000
            let ms = 28000;
            try {
                const qs = new URLSearchParams(location.search);
                const v = qs.get("aiTimeoutMs");
                if (v) {
                    const n = parseInt(v, 10);
                    if (Number.isFinite(n) && n >= 5000 && n <= 180000) ms = n;
                }
            } catch (_) {}
            try {
                const cfg = typeof window !== "undefined" ? window.__prefetch_ai_timeout_ms : null;
                const n = typeof cfg === "number" ? cfg : parseInt(String(cfg || ""), 10);
                if (Number.isFinite(n) && n >= 5000 && n <= 180000) ms = n;
            } catch (_) {}
            return ms;
        }

        async function prefetchQuestion() {
            if (fetchPromise) return fetchPromise;

            fetchPromise = (async () => {
                prefetchInFlight = true;
                syncMapQuestionBufferHint();
                syncQuestionsApiBadge();
                const prompt = buildMathQuestionPrompt();
                const { dsKey } = getConfiguredAiKeys();
                const cancelLateAi = { cancelled: false };

                try {
                    await raceWithPrefetchTimeout(
                        (async () => {
                            if (!dsKey) throw new Error("no DashScope API key configured");
                            const q = await fetchQuestionViaDashScope(dsKey, prompt);
                            if (!cancelLateAi.cancelled) state.nextQuestion = q;
                        })(),
                        getPrefetchTimeoutMs()
                    );
                } catch (e) {
                    cancelLateAi.cancelled = true;
                    console.error("prefetchQuestion (live AI failed, using offline pool):", e);
                    setPrefetchFailureFromError(e);
                    state.nextQuestion = pickFallbackQuestion(state.activeQuestion?.text);
                } finally {
                    prefetchInFlight = false;
                    fetchPromise = null;
                    syncAiRouteNotice();
                    syncMapQuestionBufferHint();
                    syncQuestionsApiBadge();
                }
            })();
            return fetchPromise;
        }

        async function startGame(level) {
            state.currentLevel = level;
            state.playerHP = 100; state.enemyHP = 100;
            clearBattleDamageOverlay();
            state.comboCount = 0;
            state.comboActive = false;
            state.potionUsedThisBattle = false;
            state.forceEasierNextQuestion = false;
            state.nextEnemyAttackZero = false;
            state.requireReflection = false;
            const combo = document.getElementById("combo-badge");
            if (combo) combo.classList.add("hidden");
            if (level > QUEST_ROUTE.length) {
                try {
                    await ensureGeneratedBossForLevel(level);
                } catch (e) {
                    console.warn("Boss generation failed; using fallback art:", e);
                }
            }
            const qMeta = getQuestNode(level);
            safeSet('enemy-name', qMeta.name);
            safeSet('enemy-lvl-display', level);
            const spriteEl = document.getElementById("enemy-sprite");
            if (spriteEl) spriteEl.innerHTML = battleBossSvgMarkup(level);
            updateHP();
            
            // Instantly transition the UI so the user isn't stuck waiting
            document.getElementById('level-screen').classList.add('hidden');
            document.getElementById('battle-screen').classList.remove('hidden');

            if (!state.nextQuestion) {
                document.getElementById('question-text').innerText = "Summoning math magic...";
                document.getElementById('mcq-grid').innerHTML = '';
                updateQuestionSourceBadge(null);
            }
            await loadQuestion();
        }

        async function loadQuestion() {
            clearBattleDamageOverlay();
            if (!state.nextQuestion) {
                await prefetchQuestion();
            }
            let q = state.nextQuestion;
            state.nextQuestion = null;
            if (!q) {
                q = pickFallbackQuestion(state.activeQuestion?.text);
            }
            state.activeQuestion = q;
            rememberQuestionStem(q.text);
            state.forceEasierNextQuestion = false;
            if (q._questionSource === "dashscope" || q._questionSource === "openrouter" || q._questionSource === "gemini") {
                clearPrefetchFailureUi();
                syncAiRouteNotice();
                syncMapQuestionBufferHint();
            }

            prefetchQuestion();
            
            const qEl = document.getElementById('question-text');
            qEl.innerText = q.text;
            MathJax.typesetPromise([qEl]);

            const grid = document.getElementById('mcq-grid');
            if (grid) grid.classList.add("hidden");
            const form = document.getElementById("answer-form");
            if (form) form.classList.remove("hidden");
            const reasoningEl = document.getElementById("answer-input");
            if (reasoningEl) reasoningEl.value = "";

            updateQuestionSourceBadge(q);
            syncQuestionsApiBadge();
        }

        function updateHP() {
            safeSet('player-hp-bar', `${state.playerHP}%`, 'style.width');
            safeSet('enemy-hp-bar', `${state.enemyHP}%`, 'style.width');
            const es = document.getElementById("enemy-sprite");
            if (es) {
                es.classList.remove("enemy-lowhp", "enemy-breathe");
                if (state.enemyHP > 0 && state.enemyHP < 20) es.classList.add("enemy-lowhp");
                else es.classList.add("enemy-breathe");
            }
        }

        function showDamage(id, amt) {
            const el = document.getElementById(id);
            el.innerText = `-${amt}`;
            el.classList.add('animate-damage');
            setTimeout(() => el.classList.remove('animate-damage'), 1000);
        }


        function parsePlotlySpec(raw) {
            if (!raw || typeof raw !== "string" || !raw.trim()) return null;
            try {
                const spec = JSON.parse(raw);
                const data = Array.isArray(spec.data) ? spec.data : null;
                if (!data || !data.length) return null;
                return {
                    data,
                    layout: typeof spec.layout === "object" && spec.layout !== null ? spec.layout : {}
                };
            } catch (_) {
                return null;
            }
        }

        function showDetailedFeedback(msg) {
            safeSet('personalized-feedback', msg);

            const q = state.activeQuestion || {};
            const ideal = q.ideal_explanation || "";
            const explanationEl = document.getElementById("ideal-explanation");
            if (explanationEl) {
                explanationEl.innerHTML = ideal;
                if (window.MathJax) MathJax.typesetPromise([explanationEl]);
            }

            const reflectWrap = document.getElementById("reflection-wrap");
            const reflectInput = document.getElementById("reflection-input");
            const contBtn = document.getElementById("solution-continue-btn");
            if (reflectWrap && reflectInput && contBtn) {
                if (state.requireReflection) {
                    reflectWrap.classList.remove("hidden");
                    reflectInput.value = "";
                    contBtn.disabled = true;
                    contBtn.classList.add("opacity-60", "cursor-not-allowed");
                    reflectInput.oninput = () => {
                        const ok = String(reflectInput.value || "").trim().length >= 10;
                        contBtn.disabled = !ok;
                        contBtn.classList.toggle("opacity-60", !ok);
                        contBtn.classList.toggle("cursor-not-allowed", !ok);
                    };
                } else {
                    reflectWrap.classList.add("hidden");
                    reflectInput.value = "";
                    contBtn.disabled = false;
                    contBtn.classList.remove("opacity-60", "cursor-not-allowed");
                    reflectInput.oninput = null;
                }
            }

            const plotContainer = document.getElementById("plot-container");
            const parsed = typeof Plotly !== "undefined" ? parsePlotlySpec(q.plotly_spec) : null;
            if (plotContainer) {
                if (typeof Plotly !== "undefined") Plotly.purge(plotContainer);
                if (parsed && typeof Plotly !== "undefined") {
                    plotContainer.classList.remove("hidden");
                    const baseLayout = {
                        autosize: true,
                        margin: { t: 28, b: 40, l: 44, r: 20 },
                        paper_bgcolor: "transparent",
                        plot_bgcolor: "rgba(15,23,42,0.6)",
                        font: { color: "#e5e7eb", size: 11 },
                        xaxis: { gridcolor: "#4b5563", zerolinecolor: "#6b7280", automargin: true },
                        yaxis: { gridcolor: "#4b5563", zerolinecolor: "#6b7280", automargin: true }
                    };
                    const layout = { ...baseLayout, ...parsed.layout, autosize: true };
                    delete layout.height;
                    delete layout.width;
                    Plotly.newPlot(plotContainer, parsed.data, layout, {
                        displayModeBar: false,
                        responsive: true
                    });
                    requestAnimationFrame(() => {
                        try {
                            Plotly.Plots.resize(plotContainer);
                        } catch (_) {}
                    });
                } else {
                    plotContainer.classList.add("hidden");
                }
            }

            document.getElementById("detailed-feedback-overlay").classList.remove("hidden");
        }

        function buildJudgePrompt({ question, studentResponse }) {
            const q = question || {};
            const criterion = String(q.criterion || "A").toUpperCase();
            const expected = String(q.expected_answer || "");
            const stem = String(q.text || "");
            const success = String(q.success_criteria || "");
            const diff = state.currentLevel <= 3 ? "Foundations" : (state.currentLevel <= 6 ? "IB MYP Year 7" : "IB MYP Year 8");
            return (
                `You are an IB MYP math assessor. Target band: ${diff}. Target criterion: ${criterion}.\n` +
                `Mark the student response using a rubric-like scheme aligned to MYP Criterion A/B/C.\n` +
                `Be generous about conversational filler but strict about mathematical correctness and communication.\n\n` +
                `QUESTION (student saw): ${JSON.stringify(stem)}\n` +
                `EXPECTED_ANSWER: ${JSON.stringify(expected)}\n` +
                `SUCCESS_CRITERIA (for full credit): ${JSON.stringify(success)}\n\n` +
                `STUDENT_RESPONSE: ${JSON.stringify(studentResponse)}\n\n` +
                `Return JSON only with keys:\n` +
                `- band: one of "incorrect","partial","correct_no_reasoning","correct_with_reasoning"\n` +
                `- score: integer 0-8 (approx MYP-style banding; 0=none, 8=excellent)\n` +
                `- isCorrect: boolean (final answer mathematically correct)\n` +
                `- isCrit: boolean (true only if isCorrect is true AND reasoning is clear, complete, and well-communicated for the target criterion)\n` +
                `- extracted_final_answer: string (what you think the student’s final answer is)\n` +
                `- strengths: array of 1-3 short strings\n` +
                `- next_steps: array of 1-3 short strings\n` +
                `- feedback: string using this structure:\n` +
                `  What you did well: ...\n` +
                `  To score higher next time:\n` +
                `  - ...\n` +
                `  - ...\n` +
                `  Example sentence starter: ...\n` +
                `Scoring guidance:\n` +
                `- If final answer is wrong: score <= 3, band is incorrect/partial, isCrit must be false.\n` +
                `- If final answer is right but reasoning is missing/hand-wavy: band=correct_no_reasoning, score 4-6, isCrit=false.\n` +
                `- If final answer is right and reasoning is solid: band=correct_with_reasoning, score 6-8.\n` +
                `- isCrit should be true ONLY for score 8 (or very high end of 7) with excellent explanation.\n` +
                `Ignore filler; focus on math and communication.\n`
            );
        }

        async function gradeResponseViaDashScope({ question, studentResponse }) {
            const { dsKey, dsModel } = getConfiguredAiKeys();
            if (!dsKey) throw new Error("no DashScope API key configured");
            const url = dashscopeChatCompletionsUrl();
            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` };
            const systemMsg = {
                role: "system",
                content:
                    "You output exactly one valid JSON object and nothing else. No markdown, no code fences, no commentary. Use double quotes for JSON strings. Escape any newlines inside strings with \\n and escape quotes inside strings."
            };
            const userContent = buildJudgePrompt({ question, studentResponse });
            debugLogAiPrompt("dashscope.judge", userContent);
            const bodyWithJson = JSON.stringify({
                model: dsModel,
                messages: [systemMsg, { role: "user", content: userContent }],
                response_format: { type: "json_object" },
                temperature: 0.0,
                max_tokens: 750
            });
            const doCall = async (extraUserNudge) => {
                const nudgedBody = extraUserNudge
                    ? JSON.stringify({
                          model: dsModel,
                          messages: [systemMsg, { role: "user", content: userContent + extraUserNudge }],
                          response_format: { type: "json_object" },
                          temperature: 0.0,
                          max_tokens: 750
                      })
                    : bodyWithJson;
                const res = await fetchWithBackoff(url, { method: "POST", headers, body: nudgedBody }, 3, {
                    min429DelayMs: 3500,
                    maxDelayMs: 20000,
                    initialDelayMs: 900
                });
                const data = await res.json();
                if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
                return data?.choices?.[0]?.message?.content;
            };
            let content = await doCall("");
            let parsed;
            try {
                parsed = parseModelJsonContentLenient(content);
            } catch (e) {
                // One retry with a very explicit constraint.
                content = await doCall(
                    '\n\nCRITICAL: Your previous output was not valid JSON. Output ONLY a single JSON object. Do not include raw newlines in strings; use \\\\n. Do not include unescaped quotes.'
                );
                parsed = parseModelJsonContentLenient(content);
            }
            const band = String(parsed.band || "").trim();
            if (!["incorrect", "partial", "correct_no_reasoning", "correct_with_reasoning"].includes(band)) {
                throw new Error("judge returned invalid band");
            }
            return {
                band,
                isCorrect: !!parsed.isCorrect,
                score: Number.isFinite(parsed.score) ? Math.max(0, Math.min(8, Math.trunc(parsed.score))) : null,
                isCrit: !!parsed.isCrit,
                feedback: String(parsed.feedback || "").trim(),
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((s) => String(s || "").trim()).filter(Boolean).slice(0, 3) : [],
                next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps.map((s) => String(s || "").trim()).filter(Boolean).slice(0, 3) : []
            };
        }

        function damageForJudgement(judged) {
            const band = judged?.band;
            const isCrit = judged?.isCrit === true;
            if (band === "correct_with_reasoning") return { enemy: isCrit ? 100 : 50, player: 0, label: isCrit ? "CRITICAL HIT!" : "DIRECT HIT!", isCrit };
            if (band === "correct_no_reasoning") return { enemy: 15, player: 0, label: "WEAK HIT!", isCrit: false };
            if (band === "partial") return { enemy: 10, player: 10, label: "GLANCING HIT!", isCrit: false };
            return { enemy: 0, player: 20, label: "SPELL FIZZLED!", isCrit: false };
        }

        function normalizeForCompare(s) {
            return (s == null ? "" : String(s))
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();
        }

        function localFallbackJudge({ question, studentResponse }) {
            const expected = normalizeForCompare(question?.expected_answer);
            const resp = normalizeForCompare(studentResponse);
            const hasSteps = /(\n|\.|;|therefore|so|because|then)/i.test(studentResponse) && studentResponse.length >= 25;
            const looksCorrect = expected && (resp.includes(expected) || resp === expected);
            const band = looksCorrect ? (hasSteps ? "correct_with_reasoning" : "correct_no_reasoning") : (studentResponse.length >= 25 ? "partial" : "incorrect");
            const feedback =
                band === "correct_with_reasoning"
                    ? "What you did well: You included a clear method and a conclusion.\nTo score higher next time:\n- Keep your steps in order.\n- Add a quick check (substitute back or estimate).\nExample sentence starter: “First I…, then I…, so…, therefore ….”"
                    : band === "correct_no_reasoning"
                      ? "What you did well: Your final answer looks correct.\nTo score higher next time:\n- Show 2–5 steps (what you did and why).\n- End with a conclusion sentence.\nExample sentence starter: “First I…, then I…, so…, therefore ….”"
                      : band === "partial"
                        ? "What you did well: You started explaining.\nTo score higher next time:\n- Write the equation/operation you are using.\n- Show the key step that gets you to the final answer.\nExample sentence starter: “I start with…, then I…, so….”"
                        : "What you did well: You tried.\nTo score higher next time:\n- Write the equation or rule you’re using.\n- Show at least 2 steps.\nExample sentence starter: “First I…, then I….”";
            return { band, isCorrect: looksCorrect, isCrit: false, score: null, strengths: [], next_steps: [], feedback };
        }

        // --- PRACTICE MODE (MCQ, non-combat) ---
        function validatePracticeMcqPayload(q) {
            if (!q || typeof q !== "object") throw new Error("invalid practice question");
            const need = ["text", "answer", "ideal_explanation", "type", "options"];
            for (const k of need) {
                if (q[k] == null || q[k] === "") throw new Error("missing " + k);
            }
            if (q.type !== "mcq") throw new Error('type must be "mcq"');
            if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error("options must be exactly 4 strings");
            for (const opt of q.options) {
                if (opt == null || String(opt).trim() === "") throw new Error("empty option");
            }
            q.text = normalizeLatexCurrency(q.text);
            q.ideal_explanation = normalizeLatexCurrency(q.ideal_explanation);
            q.answer = normalizeLatexCurrency(q.answer);
            q.options = q.options.map((o) => normalizeLatexCurrency(o));
            if (q.plotly_spec != null && typeof q.plotly_spec === "object") {
                try {
                    q.plotly_spec = JSON.stringify(q.plotly_spec);
                } catch (_) {
                    q.plotly_spec = "";
                }
            }
            if (q.plotly_spec == null) q.plotly_spec = "";
        }

        function dashScopePracticeMcqSuffix() {
            return (
                "\n\nHard requirements (Qwen-compatible JSON):\n" +
                '- type must be the string "mcq".\n' +
                "- options: exactly 4 non-empty strings, plausible distractors.\n" +
                "- answer: must exactly match one element of options.\n" +
                '- plotly_spec: string only — "" OR one JSON-encoded Plotly spec with escaped inner quotes.\n' +
                "- ideal_explanation: 3–6 short sentences, clear steps.\n" +
                '\nReturn one JSON object with exactly these keys: topic_category, text, answer, ideal_explanation, plotly_spec, type, options. No markdown, no code fences.'
            );
        }

        async function fetchPracticeMcqViaDashScope() {
            const { dsKey, dsModel } = getConfiguredAiKeys();
            if (!dsKey) throw new Error("no DashScope API key configured");
            const url = dashscopeChatCompletionsUrl();
            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` };
            const systemMsg = {
                role: "system",
                content:
                    "You output exactly one valid JSON object and nothing else. No markdown, no code fences, no commentary. Use double quotes for JSON strings."
            };
            const diff = state.currentLevel <= 3 ? "Introductory" : (state.currentLevel <= 6 ? "Grade 7" : "Grade 8");
            const seed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const basePrompt =
                `[SEED:${seed}] Generate one unique ${diff} IB MYP Year 7/8 practice MCQ (warm-up). ` +
                `Keep it short and solvable quickly. Return JSON only. Use LaTeX for math.`;
            const userContent = basePrompt + dashScopePracticeMcqSuffix();
            debugLogAiPrompt("dashscope.practice", userContent);
            const body = JSON.stringify({
                model: dsModel,
                messages: [systemMsg, { role: "user", content: userContent }],
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 800
            });
            const res = await fetchWithBackoff(url, { method: "POST", headers, body }, 3, {
                min429DelayMs: 3500,
                maxDelayMs: 20000,
                initialDelayMs: 900
            });
            const data = await res.json();
            if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
            const content = data?.choices?.[0]?.message?.content;
            const parsed = parseModelJsonContentLenient(content);
            validatePracticeMcqPayload(parsed);
            return parsed;
        }

        // --- INFINITE LEVEL BOSSES (levels > 10) ---
        const GENERATED_BOSS_TOPICS = [
            "Algebra & Equations",
            "Fractions, Percentages & Ratios",
            "Geometry & Measurement",
            "Patterns & Sequences",
            "Data & Probability",
            "Real-Life Modeling"
        ];

        function fallbackGeneratedTopic(level) {
            const idx = Math.max(0, level - (QUEST_ROUTE.length + 1));
            return GENERATED_BOSS_TOPICS[idx % GENERATED_BOSS_TOPICS.length];
        }

        function sanitizeHexColor(s, fallback) {
            const t = String(s || "").trim();
            if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
            return fallback || "#94a3b8";
        }

        function validateBossSvg(svgText) {
            const svg = String(svgText || "").trim();
            if (!svg.startsWith("<svg")) throw new Error("boss svg must start with <svg");
            if (!svg.includes('viewBox="0 0 100 100"')) throw new Error("boss svg missing viewBox 0 0 100 100");
            if (!svg.includes('class="w-full h-full"')) throw new Error('boss svg root must include class="w-full h-full"');
            if (!svg.includes('id="BOSS_CORE"')) throw new Error('boss svg missing id="BOSS_CORE"');
            if (!svg.includes('id="BOSS_EYE"')) throw new Error('boss svg missing id="BOSS_EYE"');
            if (!svg.includes('id="BOSS_WEAPON"')) throw new Error('boss svg missing id="BOSS_WEAPON"');
            if (!svg.includes('id="BOSS_EYE"') || !svg.includes('class="animate-pulse"')) {
                // ensure at least one animate-pulse exists; prompt requires BOSS_EYE to have it
                if (!/id="BOSS_EYE"[^>]*class="[^"]*animate-pulse/.test(svg)) {
                    throw new Error('boss svg BOSS_EYE must include class="animate-pulse"');
                }
            }
            if (/<style[\s>]/i.test(svg)) throw new Error("boss svg must not include <style> blocks");
            return svg;
        }

        async function fetchRawSvgViaDashScope({ prompt, temperature = 0.9, max_tokens = 1800 }) {
            const { dsKey, dsModel } = getConfiguredAiKeys();
            if (!dsKey) throw new Error("no DashScope API key configured");
            const url = dashscopeChatCompletionsUrl();
            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` };
            const systemMsg = {
                role: "system",
                content:
                    "Your entire response must be RAW SVG only. No markdown. No code fences. No extra text. The first character must be < and the last character must be >."
            };
            debugLogAiPrompt("dashscope.boss_svg", prompt);
            const body = JSON.stringify({
                model: dsModel,
                messages: [systemMsg, { role: "user", content: prompt }],
                temperature,
                max_tokens
            });
            const res = await fetchWithBackoff(url, { method: "POST", headers, body }, 4, {
                min429DelayMs: 3500,
                maxDelayMs: 24000,
                initialDelayMs: 1000
            });
            const data = await res.json();
            if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
            const content = data?.choices?.[0]?.message?.content;
            if (content == null || String(content).trim() === "") throw new Error("DashScope returned empty SVG");
            const svg = String(content).trim();
            // Some models still wrap in fences; unwrap defensively.
            const fenced = svg.match(/```(?:svg|xml)?\s*([\s\S]*?)```/i);
            return fenced ? fenced[1].trim() : svg;
        }

        async function fetchBossMetaViaDashScope(level) {
            const { dsKey, dsModel } = getConfiguredAiKeys();
            if (!dsKey) throw new Error("no DashScope API key configured");
            const url = dashscopeChatCompletionsUrl();
            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` };
            const systemMsg = {
                role: "system",
                content:
                    "You output exactly one valid JSON object and nothing else. No markdown. No code fences. Use double quotes for JSON strings."
            };
            const defaultTopic = fallbackGeneratedTopic(level);
            const user = `Generate metadata for a new boss in a middle-school math RPG.\n` +
                `Constraints:\n` +
                `- Level: ${level}\n` +
                `- Math topic must be one of: ${GENERATED_BOSS_TOPICS.map((t) => JSON.stringify(t)).join(", ")}\n` +
                `- Tone: epic + slightly snarky (not mean).\n` +
                `Return JSON keys:\n` +
                `- name: string (2-3 words, intimidating)\n` +
                `- blurb: string (3-6 words)\n` +
                `- hue: string (hex color like #aabbcc)\n` +
                `- topic: string (one of the allowed topics)\n` +
                `Default topic to ${JSON.stringify(defaultTopic)} unless a better allowed pick fits level pacing.\n`;
            debugLogAiPrompt("dashscope.boss_meta", user);
            const body = JSON.stringify({
                model: dsModel,
                messages: [systemMsg, { role: "user", content: user }],
                response_format: { type: "json_object" },
                temperature: 0.8,
                max_tokens: 260
            });
            const res = await fetchWithBackoff(url, { method: "POST", headers, body }, 4, {
                min429DelayMs: 3500,
                maxDelayMs: 24000,
                initialDelayMs: 1000
            });
            const data = await res.json();
            if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
            const content = data?.choices?.[0]?.message?.content;
            const parsed = parseModelJsonContentLenient(content);
            const name = String(parsed?.name || `Boss Lv ${level}`).trim();
            const blurb = String(parsed?.blurb || "Summoned horror").trim();
            const hue = sanitizeHexColor(parsed?.hue, "#94a3b8");
            const topic = GENERATED_BOSS_TOPICS.includes(String(parsed?.topic || "").trim())
                ? String(parsed.topic).trim()
                : fallbackGeneratedTopic(level);
            return { name, blurb, hue, topic };
        }

        const bossGenInFlight = new Map();

        async function ensureGeneratedBossForLevel(level) {
            if (level <= QUEST_ROUTE.length) return null;
            if (state.bossCacheByLevel && state.bossCacheByLevel[level]) return state.bossCacheByLevel[level];
            if (bossGenInFlight.has(level)) return bossGenInFlight.get(level);

            const job = (async () => {
                let meta;
                try {
                    meta = await fetchBossMetaViaDashScope(level);
                } catch (e) {
                    meta = { name: `Boss Lv ${level}`, blurb: "Summoned horror", hue: "#94a3b8", topic: fallbackGeneratedTopic(level) };
                }
                const theme = meta.topic;
                const battlePrompt =
                    `Role: You are an expert SVG artist and technical game designer generating a dynamic boss monster for a Middle School math RPG.\n\n` +
                    `Current Parameters:\n` +
                    `- Level: ${level}\n` +
                    `- Math Theme: ${theme}\n\n` +
                    `Art Direction:\n` +
                    `The boss must look genuinely terrifying, aggressive, and formidable (appealing to an 11-13-year-old demographic). It should be a dark-energy fusion of the math theme. Use intricate geometric patterns, fractured paths, dynamic glowing effects, and a dark, menacing color palette. Weaponize the math concepts.\n\n` +
                    `Technical Constraints (CRITICAL):\n` +
                    `1. RAW OUTPUT ONLY: Your entire response MUST consist of pure, raw SVG code.\n` +
                    `2. The very first character must be < and the very last character must be >.\n` +
                    `3. Root element must be exactly: <svg viewBox="0 0 100 100" class="w-full h-full">\n` +
                    `4. No external images, fonts, or <style> blocks. Use only inline attributes.\n` +
                    `5. Regression anchors: include these exact IDs:\n` +
                    `   - id="BOSS_CORE" (main body/chest)\n` +
                    `   - id="BOSS_EYE" (glowing eye) and add class="animate-pulse"\n` +
                    `   - id="BOSS_WEAPON" (most aggressive weapon-like part)\n`;

                const mapPrompt =
                    battlePrompt +
                    `\nAdditional requirement for this render:\n` +
                    `- Make it a simplified MAP PORTRAIT icon version (readable at small size). Keep the same anchors/IDs.\n`;

                let battleSvg = "";
                let mapSvg = "";
                try {
                    battleSvg = validateBossSvg(await fetchRawSvgViaDashScope({ prompt: battlePrompt, temperature: 0.95, max_tokens: 2000 }));
                    mapSvg = validateBossSvg(await fetchRawSvgViaDashScope({ prompt: mapPrompt, temperature: 0.9, max_tokens: 1600 }));
                } catch (e) {
                    // If generation fails, do not poison cache; fall back to existing Leviathan art for now.
                    throw e;
                }

                const record = {
                    name: meta.name,
                    blurb: meta.blurb,
                    hue: meta.hue,
                    topic: meta.topic,
                    battleSvg,
                    mapSvg,
                    createdAt: Date.now()
                };
                state.bossCacheByLevel = state.bossCacheByLevel || {};
                state.bossCacheByLevel[level] = record;
                saveBossCache(state.bossCacheByLevel);
                return record;
            })();

            bossGenInFlight.set(level, job);
            try {
                return await job;
            } finally {
                bossGenInFlight.delete(level);
            }
        }

        let practiceActiveQuestion = null;
        window.openPracticeMode = async () => {
            document.getElementById("practice-overlay")?.classList.remove("hidden");
            await nextPracticeQuestion();
        };
        window.closePracticeMode = () => {
            document.getElementById("practice-overlay")?.classList.add("hidden");
            practiceActiveQuestion = null;
        };
        window.nextPracticeQuestion = async () => {
            const qEl = document.getElementById("practice-question-text");
            const grid = document.getElementById("practice-mcq-grid");
            const fb = document.getElementById("practice-feedback");
            if (fb) fb.innerText = "";
            if (grid) grid.innerHTML = "";
            if (qEl) qEl.innerText = "Summoning a practice question...";
            try {
                const q = await fetchPracticeMcqViaDashScope();
                practiceActiveQuestion = q;
                if (qEl) qEl.innerText = q.text;
                if (window.MathJax) MathJax.typesetPromise([qEl]);
                if (grid) {
                    q.options.forEach((opt) => {
                        const b = document.createElement("button");
                        const isMath = opt.toString().includes("^") || opt.toString().includes("\\");
                        b.innerHTML = `<span>${isMath ? `$${opt}$` : opt}</span>`;
                        b.className =
                            "bg-slate-800 hover:bg-slate-700 p-4 rounded-lg font-bold border-2 border-slate-600 transition-all text-sm min-h-[3rem]";
                        b.onclick = () => {
                            const correct = opt.toString().trim() === q.answer.toString().trim();
                            if (fb) fb.innerText = correct ? "Correct." : `Not quite. Correct answer: ${q.answer}`;
                            if (fb && window.MathJax) MathJax.typesetPromise([fb]);
                        };
                        grid.appendChild(b);
                    });
                    if (window.MathJax) MathJax.typesetPromise([grid]);
                }
            } catch (e) {
                if (qEl) qEl.innerText = "Practice AI failed — try again.";
                console.error("practice MCQ failed:", e);
            }
        };

        window.handleInputAttack = async (e) => {
            e.preventDefault();
            if (state.isAnimating) return;
            state.isAnimating = true;
            const q = state.activeQuestion || {};
            const studentResponse = String(document.getElementById("answer-input")?.value || "").trim();
            const castBtn = document.getElementById("cast-spell-btn");
            if (castBtn) castBtn.disabled = true;

            // Require some reasoning to proceed (encourages criterion-aligned work).
            if (!studentResponse) {
                if (castBtn) castBtn.disabled = false;
                state.isAnimating = false;
                showDetailedFeedback("To score higher, you must write your reasoning (2–5 steps). Try again.");
                return;
            }

            const bS = document.getElementById("battle-screen");
            const fb = document.getElementById("combat-feedback");
            const applyComboUpdate = (band) => {
                const good = band === "correct_with_reasoning" || band === "correct_no_reasoning";
                if (good) state.comboCount = Math.max(0, (state.comboCount || 0) + 1);
                else state.comboCount = 0;
                state.comboActive = state.comboCount >= 3;
                const badge = document.getElementById("combo-badge");
                if (badge) {
                    if (state.comboActive) badge.classList.remove("hidden");
                    else badge.classList.add("hidden");
                }
            };
            try {
                // If the active question is missing required judge fields, avoid punishing the student.
                if (!q || !q.expected_answer || !q.criterion) {
                    showDetailedFeedback(
                        "Judge setup error: this question is missing expected answer/criterion, so it can't be graded fairly. Generating a new question…"
                    );
                    await loadQuestion();
                    return;
                }
                const judged = await gradeResponseViaDashScope({ question: q, studentResponse });
                applyComboUpdate(judged.band);
                const dmg0 = damageForJudgement(judged);
                const comboMult = state.comboActive ? 1.5 : 1.0;
                let enemyDmg = dmg0.enemy > 0 ? Math.round(dmg0.enemy * comboMult) : 0;
                let playerDmg = dmg0.player;
                if (state.nextEnemyAttackZero && playerDmg > 0) {
                    playerDmg = 0;
                    state.nextEnemyAttackZero = false;
                }
                if (playerDmg > 0 && (state.playerHP - playerDmg) <= 0 && !state.potionUsedThisBattle) {
                    state.potionUsedThisBattle = true;
                    state.forceEasierNextQuestion = true;
                    state.playerHP = Math.max(state.playerHP, 30);
                    playerDmg = 0;
                }
                const dmg = { ...dmg0, enemy: enemyDmg, player: playerDmg };
                fb.innerText = dmg.label;
                fb.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 bg-gray-900 border-2 ${
                    dmg.enemy > 0 ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                } p-4 rounded-xl text-center z-40 opacity-100 font-black text-2xl`;

                const hitStop = state.currentLevel >= 7 && (judged.band === "correct_with_reasoning" || dmg.isCrit === true) ? 100 : 0;
                setTimeout(() => {
                    fb.style.opacity = 0;
                    if (dmg.enemy > 0) {
                        if (bS) bS.classList.add("animate-shake");
                        state.enemyHP = Math.max(0, state.enemyHP - dmg.enemy);
                        showDamage("enemy-damage", dmg.enemy);
                    }
                    if (dmg.player > 0) {
                        state.playerHP = Math.max(0, state.playerHP - dmg.player);
                        showDamage("player-damage", dmg.player);
                    }
                    updateHP();
                }, 350 + hitStop);

                // Advance criterion rotation.
                state.turnIndex++;

                // Personalized feedback becomes the judge feedback; ideal explanation remains teacher notes.
                const header =
                    judged.band === "correct_with_reasoning"
                        ? "Great structure — full credit."
                        : judged.band === "correct_no_reasoning"
                          ? "Answer is right, but you need better reasoning."
                          : judged.band === "partial"
                            ? "Some progress — tighten your steps."
                            : "Not yet — let’s fix the method.";
                state.requireReflection = judged.band === "incorrect" || judged.band === "partial";
                const potionNote = state.potionUsedThisBattle && dmg0.player > 0 && dmg.player === 0 ? "\n\nHealth Potion: You were saved from defeat — next question will be easier." : "";
                showDetailedFeedback(`${header}\n\n${judged.feedback}${potionNote}`);

                // End battle if needed after the overlay close loads the next question.
                if (state.enemyHP <= 0 || state.playerHP <= 0) {
                    finishBattle(state.enemyHP <= 0);
                }
            } catch (err) {
                console.error("grading failed:", err);
                const judged = localFallbackJudge({ question: q, studentResponse });
                applyComboUpdate(judged.band);
                const dmg0 = damageForJudgement(judged);
                const comboMult = state.comboActive ? 1.5 : 1.0;
                let enemyDmg = dmg0.enemy > 0 ? Math.round(dmg0.enemy * comboMult) : 0;
                let playerDmg = dmg0.player;
                if (state.nextEnemyAttackZero && playerDmg > 0) {
                    playerDmg = 0;
                    state.nextEnemyAttackZero = false;
                }
                if (playerDmg > 0 && (state.playerHP - playerDmg) <= 0 && !state.potionUsedThisBattle) {
                    state.potionUsedThisBattle = true;
                    state.forceEasierNextQuestion = true;
                    state.playerHP = Math.max(state.playerHP, 30);
                    playerDmg = 0;
                }
                const dmg = { ...dmg0, enemy: enemyDmg, player: playerDmg };
                fb.innerText = dmg.label;
                fb.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 bg-gray-900 border-2 ${
                    dmg.enemy > 0 ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                } p-4 rounded-xl text-center z-40 opacity-100 font-black text-2xl`;
                setTimeout(() => {
                    fb.style.opacity = 0;
                    if (dmg.enemy > 0) {
                        if (bS) bS.classList.add("animate-shake");
                        state.enemyHP = Math.max(0, state.enemyHP - dmg.enemy);
                        showDamage("enemy-damage", dmg.enemy);
                    }
                    if (dmg.player > 0) {
                        state.playerHP = Math.max(0, state.playerHP - dmg.player);
                        showDamage("player-damage", dmg.player);
                    }
                    updateHP();
                }, 350);
                state.turnIndex++;
                state.requireReflection = judged.band === "incorrect" || judged.band === "partial";
                const potionNote = state.potionUsedThisBattle && dmg0.player > 0 && dmg.player === 0 ? "\n\nHealth Potion: You were saved from defeat — next question will be easier." : "";
                showDetailedFeedback(
                    `Judge spell fizzled (AI grading failed), so I used a safe fallback grade.\n\n${judged.feedback}${potionNote}`
                );
            } finally {
                if (castBtn) castBtn.disabled = false;
                if (bS) bS.classList.remove("animate-shake");
                state.isAnimating = false;
                syncCurrentProfileToCloud();
            }
        };

        function finishBattle(win) {
            if (win) {
                const gain = 15 + Math.min(40, Math.floor(state.currentLevel / 2));
                state.shards = Math.max(0, Math.floor(state.shards || 0) + gain);
                addBossToBestiary(state.currentLevel);
                syncShardsUi();
                if (state.playerName) saveLocalProfile(state.playerName);
            }
            if (win && state.currentLevel === state.unlockedLevels) {
                state.unlockedLevels++;
                if (state.playerName) saveLocalProfile(state.playerName);
                syncCurrentProfileToCloud();
            }
            document.getElementById('result-overlay').classList.remove('hidden');
            safeSet('result-title', win ? 'VICTORY' : 'DEFEATED');
            safeSet(
                'result-desc',
                win
                    ? `The creature has been banished. +${15 + Math.min(40, Math.floor(state.currentLevel / 2))} Logic Shards.`
                    : 'Retreat to the academy to study.'
            );
        }

        window.returnToMenu = () => {
            document.getElementById('result-overlay').classList.add('hidden');
            document.getElementById('battle-screen').classList.add('hidden');
            document.getElementById('level-screen').classList.remove('hidden');
            state.isAnimating = false;
            syncShardsUi();
            renderLevelMenu();
            syncCurrentProfileToCloud();
        };
        window.closeDetailedFeedback = async () => {
            const plotEl = document.getElementById("plot-container");
            if (plotEl) {
                if (typeof Plotly !== "undefined") Plotly.purge(plotEl);
                plotEl.classList.add("hidden");
            }
            if (state.requireReflection) {
                const reflect = String(document.getElementById("reflection-input")?.value || "").trim();
                if (reflect.length >= 10) {
                    try {
                        const parry = await (async () => {
                            const { dsKey, dsModel } = getConfiguredAiKeys();
                            if (!dsKey) return { isParry: false };
                            const url = dashscopeChatCompletionsUrl();
                            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` };
                            const systemMsg = {
                                role: "system",
                                content:
                                    "You output exactly one valid JSON object and nothing else. No markdown, no code fences. Use double quotes for JSON strings."
                            };
                            const q = state.activeQuestion || {};
                            const user =
                                `You are a quick MYP teacher judging a student's reflection.\n` +
                                `The student just got a question wrong or partial.\n` +
                                `QUESTION: ${JSON.stringify(String(q.text || ""))}\n` +
                                `EXPECTED_ANSWER: ${JSON.stringify(String(q.expected_answer || ""))}\n` +
                                `IDEAL_EXPLANATION: ${JSON.stringify(String(q.ideal_explanation || ""))}\n` +
                                `STUDENT_REFLECTION: ${JSON.stringify(reflect)}\n\n` +
                                `Return JSON with keys:\n` +
                                `- isParry: boolean (true if the reflection correctly identifies the key mistake or missing step)\n` +
                                `- note: string (1 short sentence)\n`;
                            debugLogAiPrompt("dashscope.parry_reflection", user);
                            const body = JSON.stringify({
                                model: dsModel,
                                messages: [systemMsg, { role: "user", content: user }],
                                response_format: { type: "json_object" },
                                temperature: 0.2,
                                max_tokens: 180
                            });
                            const res = await fetchWithBackoff(url, { method: "POST", headers, body }, 3, {
                                min429DelayMs: 3500,
                                maxDelayMs: 20000,
                                initialDelayMs: 900
                            });
                            const data = await res.json();
                            if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));
                            const content = data?.choices?.[0]?.message?.content;
                            const parsed = parseModelJsonContentLenient(content);
                            return { isParry: !!parsed.isParry, note: String(parsed.note || "").trim() };
                        })();
                        if (parry.isParry) state.nextEnemyAttackZero = true;
                    } catch (e) {
                        console.warn("reflection judge failed:", e);
                    }
                }
                state.requireReflection = false;
            }
            document.getElementById("detailed-feedback-overlay").classList.add("hidden");
            await loadQuestion();
            state.isAnimating = false;
            syncCurrentProfileToCloud();
        };

        document.getElementById("cloud-sync-badge")?.addEventListener("click", () => requestUserSync());

        loadRecentStems();
        state.bossCacheByLevel = loadBossCache();
        runRegressions();
        initFirebase();
    
**Role:** You are an expert SVG artist and technical game designer. Your task is to upgrade a set of basic placeholder graphics into highly detailed, visually intense boss monsters for a Middle School math RPG. 

**Art Direction:**
The bosses must look genuinely terrifying, aggressive, and formidable—appealing to an 11-13-year-old demographic. They should appear as fusions of dark energy and complex mathematics. Use intricate geometric patterns, fractured paths, dynamic glowing effects (via SVG filters or layered opacity), and dark, menacing color palettes. The math theme must be clear but weaponized (e.g., razor-sharp protractors, swirling chaotic equations, corrupted fractal armor).

**Technical Constraints (CRITICAL):**
1. All assets must remain pure, self-contained SVG code. No external images or fonts.
2. You MUST maintain the `viewBox="0 0 100 100"` and `class="w-full h-full"` structure.
3. **REGRESSION ANCHORS:** You MUST NOT remove or rename the specific `id` attributes listed in the base frameworks below. The game engine relies on these exact nodes existing to pass integrity tests. You may style around them, add to them, or place them inside complex groups, but the IDs must exist.

Here are the four characters to upgrade, along with their required base frameworks:

### 1. The Algebra Slime
* **Theme:** A toxic, acidic mass of unsolved variables and creeping quadratic equations. 
* **Required Anchors:** `id="SLIME_EYE_L"`, `id="SLIME_EYE_R"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <circle id="SLIME_EYE_L" cx="40" cy="40" r="4" fill="#bef264" class="animate-pulse"/>
    <circle id="SLIME_EYE_R" cx="60" cy="40" r="4" fill="#bef264" class="animate-pulse"/>
</svg>

### 2. The Fraction Golem
* **Theme:** A massive, hulking juggernaut made of grinding stone blocks, numerators, and denominators. It should look like a ruined, ancient siege weapon powered by a glowing, volatile fraction core.
* **Required Anchors:** `id="GOLEM_BODY"`, `id="GOLEM_EYE_L"`, `id="GOLEM_EYE_R"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <rect id="GOLEM_BODY" x="20" y="10" width="60" height="80" rx="5" fill="#7c2d12"/>
    <circle id="GOLEM_EYE_L" cx="36" cy="28" r="2" fill="#fde047" class="animate-pulse"/>
    <circle id="GOLEM_EYE_R" cx="64" cy="28" r="2" fill="#fde047" class="animate-pulse"/>
</svg>

### 3. The Geo-Dragon
* **Theme:** A vicious, jagged, airborne apex predator whose wings and scales are constructed entirely from interlocking, razor-sharp polygons, compass needles, and Cartesian planes. 
* **Required Anchors:** `id="GEO_CORE"` (Add this to the dragon's chest/heart)
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <polygon id="GEO_CORE" points="50,20 65,30 65,55 50,65 35,55 35,30" fill="#9333ea" stroke="#f3e8ff" stroke-width="2"/>
</svg>

### 4. The Logic Leviathan (Final Boss)
* **Theme:** A cosmic, mind-bending, eldritch horror from the deep. It should be a massive, swirling vortex of Boolean logic, binary rings, and impossible, non-Euclidean geometry that feels overwhelming and apocalyptic.
* **Required Anchors:** `id="LEVIATHAN_MAW"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <circle id="LEVIATHAN_MAW" cx="50" cy="50" r="10" fill="#312e81"/>
</svg>


### 5. The Axiom Sentinel (Level 1: The Diagnostic Boss)
* **Theme:** A "biblically accurate" mathematical angel. It is composed of floating, intersecting golden rings of logic, glowing foundational truths (like $x=x$), and unblinking eyes. It should look ancient, strictly objective, and terrifyingly calm.
* **Required Anchors:** `id="AXIOM_RINGS"`, `id="SENTINEL_PUPIL"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <g id="AXIOM_RINGS" class="animate-[spin_10s_linear_infinite]" style="transform-origin: 50px 50px;">
        <circle cx="50" cy="50" r="30" fill="none" stroke="#eab308" stroke-width="2"/>
    </g>
    <circle id="SENTINEL_PUPIL" cx="50" cy="50" r="5" fill="#ffffff" class="animate-pulse"/>
</svg>

### 6. The Percentile Parasite
* **Theme:** A nightmarish, robotic spider or tick-like creature that represents fractions, percentages, and division. Its limbs should look like segmented division bars and percentage signs (%). It siphons energy by splitting and multiplying its jagged legs.
* **Required Anchors:** `id="PARASITE_CORE"`, `id="PARASITE_LEGS"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <g id="PARASITE_LEGS">
        <line x1="50" y1="50" x2="10" y2="20" stroke="#be123c" stroke-width="3"/>
        <line x1="50" y1="50" x2="90" y2="20" stroke="#be123c" stroke-width="3"/>
    </g>
    <circle id="PARASITE_CORE" cx="50" cy="50" r="15" fill="#881337" stroke="#fb7185" stroke-width="2"/>
</svg>

### 7. The Fibonacci Serpent
* **Theme:** An aggressive, coiled cobra or serpentine beast representing patterns and sequences. Its body is heavily armored with scales that grow logarithmically in a perfect Golden Ratio spiral. Its fangs are sharp, unequal greater-than/less-than signs (`< >`).
* **Required Anchors:** `id="FIBONACCI_SPIRAL"`, `id="SERPENT_EYE"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <path id="FIBONACCI_SPIRAL" d="M 50 50 Q 70 30 80 60 T 40 80 T 20 40 T 70 10" fill="none" stroke="#059669" stroke-width="4"/>
    <polygon id="SERPENT_EYE" points="75,15 80,10 85,15" fill="#34d399" class="animate-pulse"/>
</svg>

### 8. The Probability Wraith
* **Theme:** A spectral, floating ghost-like entity representing Data & Probability. It has no solid legs; its lower half trails off into a glowing, statistical Bell Curve. It summons floating, ethereal dice and shifting scatter plots as weapons.
* **Required Anchors:** `id="WRAITH_BELL_CURVE"`, `id="DICE_CORE"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <path id="WRAITH_BELL_CURVE" d="M 10 90 Q 50 10 90 90" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.6"/>
    <rect id="DICE_CORE" x="40" y="30" width="20" height="20" rx="3" fill="#1e3a8a" stroke="#bfdbfe" stroke-width="2"/>
</svg>

### 9. The Matrix Minotaur
* **Theme:** A brutal, hulking gladiator representing Systems of Equations and Matrices. Its arms and armor are made of massive, interlocking square brackets `[ ]`. It has glowing grid-lines across its chest, and its horns are sharp, intersecting axes.
* **Required Anchors:** `id="MATRIX_BRACKET_L"`, `id="MATRIX_BRACKET_R"`, `id="MINOTAUR_HORNS"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <polyline id="MATRIX_BRACKET_L" points="30,20 20,20 20,80 30,80" fill="none" stroke="#9a3412" stroke-width="4"/>
    <polyline id="MATRIX_BRACKET_R" points="70,20 80,20 80,80 70,80" fill="none" stroke="#9a3412" stroke-width="4"/>
    <path id="MINOTAUR_HORNS" d="M 35 30 Q 50 10 65 30" fill="none" stroke="#fdba74" stroke-width="3"/>
</svg>

### 10. The Velocity Vanguard
* **Theme:** A hyper-fast, heavily armored mechanical knight representing Real-Life Modeling and Physics. It hovers off the ground, emitting glowing parabolic trajectories and velocity vectors (`v = d/t`) from its thrusters. It wields a spear that looks like a deadly Y-intercept.
* **Required Anchors:** `id="VECTOR_SHIELD"`, `id="VELOCITY_SPEAR"`
* **Base Framework:**
<svg viewBox="0 0 100 100" class="w-full h-full">
    <polygon id="VECTOR_SHIELD" points="30,40 50,30 70,40 50,80" fill="#374151" stroke="#9ca3af" stroke-width="2"/>
    <line id="VELOCITY_SPEAR" x1="10" y1="90" x2="90" y2="10" stroke="#fcd34d" stroke-width="3"/>
</svg>

Please output the fully upgraded, high-fidelity SVG code for all four bosses.
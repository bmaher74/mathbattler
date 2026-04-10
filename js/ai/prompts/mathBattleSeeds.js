/**
 * Rotating quest / dungeon-master hooks for combat question prompts.
 * Indices are chosen deterministically from the per-request nonce (see pickSeededIndex).
 */

/** FNV-1a–style 32-bit hash for stable index picks from a nonce. */
export function pickSeededIndex(nonce, salt, modulo) {
    const str = String(nonce || "") + "\0" + String(salt ?? "");
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return modulo ? h % modulo : h;
}

/** Backdrop for the word problem or taunt—fantasy quest + a few everyday MYP contexts. */
export const MATH_BATTLE_CONTEXT_SEEDS = [
    // Classic MYP-adjacent (kept, still usable in taunt framing)
    "sports practice (scores, laps, training plan)",
    "shopping/budget (discounts, tax, unit price)",
    "school timetable (minutes, periods, totals)",
    "science lab (measurement, rates, density-style ratios)",
    "music (beats per minute, patterns, repeats)",
    "video games (XP, levels, upgrades, probability drops)",
    "travel (distance-time-speed with simple numbers)",
    "geometry in a room (perimeter/area, tiles, fencing)",
    "data display (table/bar chart/line chart interpretation)",
    "patterns & sequences (nth term, rule, justification)",
    // Dungeon & lair
    "torch oil burning down—how long until the party is in the dark?",
    "a trapped corridor: floor tiles light up in a number pattern—predict the next safe tile",
    "a riddle door that wants a numeric password from a clue (no copyrighted lore)",
    "a collapsing bridge: weight limits, rope segments, or planks needed",
    "a slime vat filling or draining (rate × time = volume change)",
    "a mimic chest that doubles coins once, then the party splits the hoard fairly",
    "a golem’s rune sequence: missing rune value from a simple rule",
    "a maze map drawn to scale—real distance from map units",
    "a portcullis drops in N seconds; can the party cross in time?",
    "a spiral staircase: steps per full turn, total steps to the tower top",
    // Quest economy & rewards
    "guild quest board: reward split among heroes, remainder donated",
    "merchant haggling: list vs sale price, percent discount, or ‘two for one’ trickery",
    "repair bill for armor after a fight—parts cost + labor rate",
    "bounty tiers: bronze/silver/gold payouts and how many small jobs equal one big job",
    "tax or toll at a city gate—fraction of cargo value",
    "potion ingredients: ratios for a brew, or diluting concentrate with water",
    "enchanting dust: cost per gram vs how many grams for an upgrade",
    "stolen treasure returned—what fraction each victim gets back",
    // Travel & world
    "caravan pace: days of travel, rations per day, total supplies",
    "river barge upstream/downstream speeds with a current (simple numbers)",
    "hot-air balloon ascent rate and time to clear cliff height",
    "forest path branches: shortest time route comparing two options",
    "mountain pass temperature drops with altitude (linear pattern)",
    "fairy ring mushrooms double each night—early exponential intuition with tiny integers",
    // Combat-adjacent (still MYP-safe math)
    "training dummy: damage per hit × hits to reach a HP target",
    "shield blocks a percent of damage—remaining damage arithmetic",
    "potion heals a fixed amount—how many sips from full to empty HP bar (whole numbers)",
    "arrow quiver: shots fired per round over several rounds, arrows left",
    // Social / academy fantasy
    "wizard academy exam: pass mark as a percent of total points",
    "house cup scores after a fair tie-break rule",
    "library late fees: days × rate, with a cap students notice",
    "cafeteria meal deal: compare combo vs à la carte",
    "club fundraiser: target amount minus sales so far",
    // Time & scheduling quests
    "ritual circles that must complete at exact minute marks (LCM-style thinking with small numbers)",
    "moon phase countdown simplified to a repeating cycle (pattern, not astronomy depth)",
    "shift schedules for guards: overlap time or gaps",
    "cooking timer stacking: when two timers finish together (small LCM)",
    // Puzzles & codes
    "combination lock wheels with digit constraints",
    "cipher wheel shift (Caesar-style) with a tiny arithmetic twist",
    "balance scales: two unknown weights inferred from equilibrium (simple)",
    "tiled mural: fraction of wall painted, fraction left",
    // Nature & hazards
    "acid pool spreading at a constant rate across tiles",
    "lava rise: depth per minute vs time to reach a ledge",
    "beehive honey harvest: jars filled per frame, frames collected",
    "vine growth per day along a wall—when it reaches the battlement",
    // Festivals & fairs (math in plain clothes)
    "carnival game tickets: bundles vs singles, best value",
    "pie-eating contest pacing: average rate over time slices",
    "relay race handoff times and total team time",
    // Heists & sneaking
    "guard patrol cycle—window of opportunity length",
    "noise meter fills per action; stay under a threshold",
    "lockpick attempts with decreasing success—expected tries with simple fractions",
    // Divine / oracle (tongue-in-cheek, not religious depth)
    "an oracle gives two contradictory hints—student resolves with arithmetic check",
    "constellation dots form a simple sequence on a star chart",
    // Ship & sky
    "airship cargo capacity: crates of two sizes that must fit a limit",
    "cloud layer altitude difference climbed by pegasus post (simple subtraction/rates)",
    // Crafting
    "smith needs ingots: recipe ratios and leftovers",
    "leather squares cut from a hide with waste strips",
    "alchemy cooldown timers stacked with buff duration",
    // Miscellaneous memorable hooks
    "a bet between two NPCs—the player adjudicates with math",
    "a fake treasure map with a deliberate arithmetic mistake to spot",
    "a ‘boss mechanic’ timer: phases every N turns, when is phase 3?",
    "a shrinking room: area halves each tick—how many ticks until too small?",
    "a charity vs greed choice: compare outcomes with percent and fixed bonuses",
    "a race between tortoise-and-hare style speeds over a fixed distance",
    "a dragon’s ‘fair’ riddle about splitting a prime number of gems (stay integer-safe)",
    "a haunted abacus that only accepts balanced equations—student supplies the missing value",
    "a portal requires equal ‘mana’ on both sides—set up and solve a simple balance",
    "a graveyard shift of skeleton workers: productivity rates and quotas",
    "a kraken tentacle grabs every 3rd second—predict the 10th grab (pattern)",
    "a crystal resonance frequency doubles each chamber—next two terms only",
    "a dwarven minecart: load weight vs slope speed (simple rate)",
    "an elven rope bridge: sag length vs tension described with arithmetic",
    "a gnome clock with extra gears—minute hand gains on the hour hand (small integers)",
    "a paladin’s oath tally: virtues scored, average per trial",
    "a rogue’s probability talk—translate bravado into a fair fraction",
    "a bard’s encore meter: crowd hype as percent, threshold to unlock verse two",
    "a ranger’s foraging: berries per bush × bushes, minus spoilage",
    "a cleric’s healing wave: total HP restored across rows of pews",
    "a warlock pact ‘interest’ on borrowed soul points—percent increase joke, numbers stay tiny",
    "a map legend: 1 cm = N fantasy units, convert a drawn segment",
    "a siege ladder: rung spacing × number of rungs to wall height",
    "a moat refill pump vs leak—net change per hour",
    "a throne room carpet order: area tiles and border trim",
    "a banquet seating: rows × seats, leftovers standing",
    "a parade formation: groups of equal size, remainder stragglers",
    "a harvest tithe: one tenth of sacks rounded fairly for story purposes",
    "a lighthouse beam rotation period—how many sweeps per minute",
    "a sandglass stack: small plus large glass total time",
    "a wishing well: coins thrown, fraction that are copper",
    "a mimic auction: bid increments and highest fair offer under a cap"
];

/** How to deliver the taunt / framing—rotates independently from context seeds. */
export const MATH_BATTLE_DM_DELIVERY_NUDGES = [
    "Open the taunt like a dramatic quest log entry (Quest / Objective / Threat) in one breath—then the math.",
    "Have the enemy brag about a ‘perfect plan’ that contains a subtle arithmetic error the student can exploit mentally.",
    "Use a mock-heroic nickname for the student (keep kind, not cruel) before dropping the problem.",
    "Frame stakes as a countdown or deadline (ritual, collapse, sunset)—still middle-school appropriate.",
    "Reference a silly legendary artifact with a math pun in the name (invented, not trademarked).",
    "Let the enemy complain about ‘adventurer paperwork’ (forms, fees, permits) as comedic padding before the numbers.",
    "Two-sentence cold open: atmosphere, then snap to the clear equation line.",
    "The taunt pretends the math is ‘too easy for minions’—dare the player to prove otherwise.",
    "Use a fake ‘dungeon inspection checklist’ motif (safety, signage, hazard cones) as flavor.",
    "NPC merchant energy: hype the ‘deal’ with numbers that must be checked.",
    "Overconfident tutor villain: teaches the wrong shortcut, problem still fair to solve correctly.",
    "Trap designer monologue: boast about precision—numbers must line up cleanly.",
    "Rival adventurer trash-talk comparing stats—translate to a solvable comparison problem.",
    "Cryptic prophecy vibe but the actual math is straightforward once decoded in plain language.",
    "Seasonal festival hook (harvest moon fair, ice solstice market) with one vivid detail.",
    "Mini-boss ‘phase two’ joke: same enemy, new numbers—taunt acknowledges the rematch.",
    "Pretend the battle is a ‘certified MYP trial’ in-universe with pompous wording.",
    "Start with a one-line sensory detail (smell/sound) unrelated to math, then pivot sharp to the question.",
    "Enemy claims they invented a ‘new operation’—it must reduce to standard Year 7/8 math.",
    "Break the fourth wall lightly (‘the DM rolled badly’) without mentioning real game systems by trademark.",
    "Offer a ‘side quest’ fake choice A vs B in the taunt, but the math problem is unambiguous.",
    "Use an imaginary monster manual stat block vibe—only the numbers you need for the task.",
    "Guild announcer voice: introduce the challenger and the puzzle like a sports broadcast.",
    "Ancient plaque inscription: half poetic, half numeric clue.",
    "Friendly rival: taunt ends with ‘show your work or I win by default’ as tone, not a rule change.",
    "Clocktower chimes motif—tie time units naturally into the story.",
    "Underdog pep: enemy pretends they’re outnumbered but the math evens the odds.",
    "Absurdly specific measurement (‘exactly 17 scones’) to feel handcrafted and memorable."
];

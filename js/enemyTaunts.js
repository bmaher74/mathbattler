/**
 * Battle taunts from the boss toward the hero — tone scales with hero prestige (level + evolution tier).
 */

const RUDE = [
    "Puny human, show me a real proof!",
    "I’ve seen sharper logic on a crumpled worksheet.",
    "Your variables tremble. Mine don’t.",
    "Step up—or step aside, apprentice.",
    "That brain of yours still warming up?"
];

const SNIDE = [
    "Fine. Impress me with more than a guess.",
    "Work shown? Good. Now make it *correct*.",
    "I’ll wait. The universe has patience. Barely.",
    "Neat handwriting won’t save you here.",
    "Show the steps—no skipping, no fairy tales."
];

const WARY = [
    "You’re no rookie anymore. Prove it again.",
    "Solid notation… I’ll give you that much.",
    "Hmm. That line of reasoning almost stings.",
    "Careful—I'm actually paying attention now.",
    "One lemma at a time. Don’t get cocky."
];

const RESPECTFUL = [
    "Your rigor… I’ll admit, it’s intimidating.",
    "Speak, scholar—I’m listening.",
    "That structure? Worthy of a real duel.",
    "I came for a fight; you brought a proof. Fair.",
    "Keep that clarity. I hate that I respect it."
];

const REVERENT = [
    "Archwizard of the axioms… I yield the floor.",
    "Teach me, master—my counterexample crumbled.",
    "By the old lemmas… you’ve earned this bout.",
    "I speak with respect: strike true, theorem-bearer.",
    "Your work humbles even this old equation-eater."
];

/**
 * Same formula as taunt tone: 0 = dismissive … 10 = deferential.
 * @param {{ level?: number, cosmeticsTier?: number }} p
 */
export function computeRespectScore(p) {
    const level = Math.max(1, Math.floor(typeof p.level === "number" ? p.level : 1));
    const cosmeticsTier = Math.min(5, Math.max(0, Math.floor(typeof p.cosmeticsTier === "number" ? p.cosmeticsTier : 0)));
    return Math.min(10, Math.floor(cosmeticsTier * 1.8 + Math.min(5, Math.floor(level / 2))));
}

/**
 * Short instructions for the LLM so it matches the same respect scale as offline taunts.
 * @param {number} respect 0–10
 */
export function toneGuidanceForRespect(respect) {
    const r = Math.max(0, Math.min(10, Math.floor(respect)));
    if (r <= 2) return "Hostile and belittling; mock the hero's math and confidence.";
    if (r <= 4) return "Skeptical coach; demand rigor, poke at shortcuts.";
    if (r <= 6) return "Wary rival; admit the hero is competent but still challenge them.";
    if (r <= 8) return "Respectful adversary; praise discipline and clarity while staying in character.";
    return "Deeply deferential; speak as if the hero is a feared master of proofs.";
}

/**
 * @param {{ level?: number, cosmeticsTier?: number, turnIndex?: number, bossName?: string }} p
 * @returns {string}
 */
export function pickEnemyTaunt(p) {
    const level = Math.max(1, Math.floor(typeof p.level === "number" ? p.level : 1));
    const cosmeticsTier = Math.min(5, Math.max(0, Math.floor(typeof p.cosmeticsTier === "number" ? p.cosmeticsTier : 0)));
    const turnIndex = Math.max(0, Math.floor(typeof p.turnIndex === "number" ? p.turnIndex : 0));
    const bossName = String(p.bossName || "Boss").trim() || "Boss";

    const respect = computeRespectScore({ level, cosmeticsTier });

    let pool;
    if (respect <= 2) pool = RUDE;
    else if (respect <= 4) pool = SNIDE;
    else if (respect <= 6) pool = WARY;
    else if (respect <= 8) pool = RESPECTFUL;
    else pool = REVERENT;

    const idx = Math.abs((turnIndex * 17 + level * 31 + cosmeticsTier * 13 + bossName.length * 3) % pool.length);
    const line = pool[idx];
    if (respect >= 8) {
        return `${bossName}: “${line}”`;
    }
    return line;
}

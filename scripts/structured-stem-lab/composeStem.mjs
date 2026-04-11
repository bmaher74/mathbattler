/**
 * Lab CLI re-exports app stem composer (single implementation in js/ai/combatTextBlocks.js).
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { composeCombatStemTextFromBlocks } = await import(join(ROOT, "js/ai/combatTextBlocks.js"));

export { composeCombatStemTextFromBlocks as composeStructuredStem };

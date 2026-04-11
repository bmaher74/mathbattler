import { composeCombatStemTextFromBlocks } from "./combatTextBlocks.js";
import { normalizeLatexCurrency } from "./latexPostprocess.js";
import { sanitizeLlmProseString } from "./llmProseSanitize.js";
import { combatQuestionRequiresSvgDiagram } from "./plotlyQuestionHeuristics.js";
import { hasRenderableCombatSvg, synthesizeQuantityStorySvgSpec } from "./combatVisualSvg.js";

/** Apply LaTeX/prose sanitization after Zod parse. Diagrams: visual_type + svg_spec (SVG). */
export function finalizeCombatQuestion(q) {
    if (Array.isArray(q.text_blocks) && q.text_blocks.length > 0) {
        q.text = composeCombatStemTextFromBlocks(q.text_blocks);
    } else {
        q.text = sanitizeLlmProseString(normalizeLatexCurrency(String(q.text ?? "")));
    }
    q.ideal_explanation = sanitizeLlmProseString(normalizeLatexCurrency(q.ideal_explanation));
    q.expected_answer = sanitizeLlmProseString(normalizeLatexCurrency(q.expected_answer));
    q.success_criteria = sanitizeLlmProseString(String(q.success_criteria));
    if (/```/.test(q.text) || /```/.test(q.ideal_explanation)) {
        throw new Error("model output still contained ``` after sanitization");
    }
    if (q.visual_type === "svg" && !String(q.svg_spec ?? "").trim()) {
        q.visual_type = "none";
        q.svg_spec = "";
    }
    if (combatQuestionRequiresSvgDiagram(q) && !hasRenderableCombatSvg(q)) {
        const syn = synthesizeQuantityStorySvgSpec(q);
        if (syn) {
            q.visual_type = "svg";
            q.svg_spec = syn;
        }
    }
    if ("_thought_process" in q) delete q._thought_process;
    return q;
}

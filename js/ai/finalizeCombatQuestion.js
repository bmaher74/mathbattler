import { composeCombatStemTextFromBlocks } from "./combatTextBlocks.js";
import { normalizeLatexCurrency } from "./latexPostprocess.js";
import { sanitizeLlmProseString } from "./llmProseSanitize.js";
import { combatQuestionRequiresDiagram, parsePlotlySpec, synthesizeQuantityStoryPlotlySpec } from "./plotlyQuestionHeuristics.js";
import { hasRenderableCombatGom, hasRenderableCombatVisual } from "./combatVisualSvg.js";

/** Apply LaTeX/prose sanitization after Zod parse. Diagrams: visual_type + visual_spec (GOM) or plotly_spec. */
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
    if (q.visual_type === "plotly" && !parsePlotlySpec(q.plotly_spec)) {
        q.visual_type = "none";
        q.plotly_spec = "";
    }
    if (q.visual_type === "gom" && !hasRenderableCombatGom(q)) {
        q.visual_type = "none";
        q.visual_spec = null;
    }
    if (combatQuestionRequiresDiagram(q) && !hasRenderableCombatVisual(q)) {
        const syn = synthesizeQuantityStoryPlotlySpec(q);
        if (syn) {
            q.visual_type = "plotly";
            q.plotly_spec = syn;
            q.visual_spec = null;
        }
    }
    if ("_thought_process" in q) delete q._thought_process;
    return q;
}

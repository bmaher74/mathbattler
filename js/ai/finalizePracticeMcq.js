import { normalizeLatexCurrency } from "./latexPostprocess.js";
import { sanitizeLlmProseString } from "./llmProseSanitize.js";
import { parsePlotlySpec } from "./plotlyQuestionHeuristics.js";
import { hasRenderableCombatGom } from "./combatVisualSvg.js";

export function finalizePracticeMcq(q) {
    q.text = sanitizeLlmProseString(normalizeLatexCurrency(q.text));
    q.ideal_explanation = sanitizeLlmProseString(normalizeLatexCurrency(q.ideal_explanation));
    q.answer = sanitizeLlmProseString(normalizeLatexCurrency(q.answer));
    q.options = q.options.map((o) => sanitizeLlmProseString(normalizeLatexCurrency(o)));

    if (q.visual_type === "plotly" && !parsePlotlySpec(q.plotly_spec)) {
        q.visual_type = "none";
        q.plotly_spec = "";
    }
    if (q.visual_type === "gom" && !hasRenderableCombatGom(q)) {
        q.visual_type = "none";
        q.visual_spec = null;
    }
    return q;
}

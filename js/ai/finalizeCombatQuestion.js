import { normalizeLatexCurrency } from "./latexPostprocess.js";
import { sanitizeLlmProseString } from "./llmProseSanitize.js";
import { parsePlotlySpec, responseNeedsNonEmptyPlotlyChart, synthesizeQuantityStoryPlotlySpec } from "./plotlyQuestionHeuristics.js";

/** Apply LaTeX/prose sanitization and Plotly synthesis heuristics after Zod parse. */
export function finalizeCombatQuestion(q) {
    q.text = sanitizeLlmProseString(normalizeLatexCurrency(q.text));
    q.ideal_explanation = sanitizeLlmProseString(normalizeLatexCurrency(q.ideal_explanation));
    q.expected_answer = sanitizeLlmProseString(normalizeLatexCurrency(q.expected_answer));
    q.success_criteria = sanitizeLlmProseString(String(q.success_criteria));
    if (/```/.test(q.text) || /```/.test(q.ideal_explanation)) {
        throw new Error("model output still contained ``` after sanitization");
    }
    if (responseNeedsNonEmptyPlotlyChart(q) && parsePlotlySpec(q.plotly_spec) == null) {
        const synthesized = synthesizeQuantityStoryPlotlySpec(q);
        if (synthesized) q.plotly_spec = synthesized;
    }
    return q;
}

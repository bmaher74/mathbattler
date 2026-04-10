import { normalizeLatexCurrency } from "./latexPostprocess.js";
import { sanitizeLlmProseString } from "./llmProseSanitize.js";

export function finalizePracticeMcq(q) {
    q.text = sanitizeLlmProseString(normalizeLatexCurrency(q.text));
    q.ideal_explanation = sanitizeLlmProseString(normalizeLatexCurrency(q.ideal_explanation));
    q.answer = sanitizeLlmProseString(normalizeLatexCurrency(q.answer));
    q.options = q.options.map((o) => sanitizeLlmProseString(normalizeLatexCurrency(o)));
    return q;
}

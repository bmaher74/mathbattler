/** Heuristics for quantity stories and legacy chart JSON parsing (MCQ / old payloads). */

export function extractAllIntegers(s) {
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

export function synthesizeQuantityStoryPlotlySpec(q) {
    const blob = `${String(q?.text || "")} ${String(q?.ideal_explanation || "")}`.toLowerCase();
    const ints = extractAllIntegers(blob);
    if (ints.length < 2) return "";
    const a = ints[ints.length - 2];
    const b = ints[ints.length - 1];
    let change = a;
    let end = b;
    const isSubtractStory = /\b(spend|spent|gave away|give away|lost|take away|take out|removed|minus|left)\b/.test(blob);
    const isAddStory = /\b(add|added|got|received|plus|more)\b/.test(blob);
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

export function responseNeedsNonEmptyPlotlyChart(q) {
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

/** Net inflow/outflow / rate stories (moat, pump, leak, …) — expect a Plotly or GOM diagram like quantity tales. */
export function rateOrNetChangeStoryNeedsSvg(q) {
    if (!q || typeof q !== "object") return false;
    const blob = `${String(q.text || "")} ${String(q.ideal_explanation || "")}`.toLowerCase();
    if (!/\d/.test(blob)) return false;
    const rateCue =
        /\b(per hour|\/hour|each hour|every hour|liters? per|litres? per|net (gain|loss|change|increase|decrease))\b/.test(
            blob
        ) ||
        /\b(inflow|outflow|pump|leak|drain|refill|moat|tank|reservoir)\b/.test(blob);
    const unitCue = /\b(liter|litre|hour|hr|minute|min|gallon)\b/.test(blob);
    return rateCue && unitCue;
}

/** True when combat JSON should include a diagram: Plotly (bars/data) or GOM (schematic). */
export function combatQuestionRequiresDiagram(q) {
    return responseNeedsNonEmptyPlotlyChart(q) || rateOrNetChangeStoryNeedsSvg(q);
}

/** @deprecated Use combatQuestionRequiresDiagram */
export const combatQuestionRequiresSvgDiagram = combatQuestionRequiresDiagram;

export function parsePlotlySpec(raw) {
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

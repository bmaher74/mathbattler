/**
 * Combat question visuals: GOM (structured SVG) or Plotly (charts / bars / data).
 */

import { parsePlotlySpec } from "./plotlyQuestionHeuristics.js";
import { GomSpecSchema } from "./schemas/combatQuestion.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Default stroke/fill for schematic diagrams on dark backgrounds */
const GOM_STROKE = "#e5e7eb";
const GOM_FILL = "rgba(55, 65, 81, 0.55)";
const GOM_LABEL = "#f3f4f6";
const GOM_LINE_DIM = "#9ca3af";

/**
 * @param {import("./schemas/combatQuestion.js").GomSpec} spec
 * @returns {SVGSVGElement}
 */
export function renderGomSpecToSvgElement(spec) {
    const svg = document.createElementNS(SVG_NS, "svg");
    const vb = spec.viewBox || "-20 -20 140 140";
    svg.setAttribute("viewBox", vb);
    svg.setAttribute("xmlns", SVG_NS);
    svg.classList.add("w-full", "max-w-xs", "mx-auto", "my-2", "block");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-hidden", "true");

    for (const el of spec.elements) {
        if (el.type === "rect") {
            const node = document.createElementNS(SVG_NS, "rect");
            node.setAttribute("x", String(el.x));
            node.setAttribute("y", String(el.y));
            node.setAttribute("width", String(el.w));
            node.setAttribute("height", String(el.h));
            node.setAttribute("stroke", GOM_STROKE);
            node.setAttribute("stroke-width", "2");
            node.setAttribute("fill", GOM_FILL);
            svg.appendChild(node);
        } else if (el.type === "polygon") {
            const node = document.createElementNS(SVG_NS, "polygon");
            node.setAttribute("points", el.points);
            node.setAttribute("stroke", GOM_STROKE);
            node.setAttribute("stroke-width", "2");
            node.setAttribute("fill", GOM_FILL);
            svg.appendChild(node);
        } else if (el.type === "line") {
            const node = document.createElementNS(SVG_NS, "line");
            node.setAttribute("x1", String(el.x1));
            node.setAttribute("y1", String(el.y1));
            node.setAttribute("x2", String(el.x2));
            node.setAttribute("y2", String(el.y2));
            node.setAttribute("stroke", GOM_LINE_DIM);
            node.setAttribute("stroke-width", "1");
            node.setAttribute("stroke-dasharray", "4");
            svg.appendChild(node);
        } else if (el.type === "label") {
            const node = document.createElementNS(SVG_NS, "text");
            node.setAttribute("x", String(el.x));
            node.setAttribute("y", String(el.y));
            node.setAttribute("fill", GOM_LABEL);
            node.setAttribute("font-size", "6");
            node.setAttribute("text-anchor", "middle");
            node.textContent = el.text;
            svg.appendChild(node);
        }
    }
    return svg;
}

/** Layout merged with model layout for Plotly on dark UI */
export function getDarkPlotlyLayoutBase() {
    return {
        autosize: true,
        margin: { t: 28, b: 40, l: 44, r: 20 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "rgba(15,23,42,0.6)",
        font: { color: "#e5e7eb", size: 11 },
        xaxis: { gridcolor: "#4b5563", zerolinecolor: "#6b7280", automargin: true },
        yaxis: { gridcolor: "#4b5563", zerolinecolor: "#6b7280", automargin: true }
    };
}

export function hasRenderableCombatGom(q) {
    if (!q || q.visual_type !== "gom") return false;
    const p = GomSpecSchema.safeParse(q.visual_spec);
    return p.success;
}

export function hasRenderableCombatPlotly(q) {
    if (!q || q.visual_type !== "plotly") return false;
    return parsePlotlySpec(q.plotly_spec) != null;
}

export function hasRenderableCombatVisual(q) {
    return hasRenderableCombatGom(q) || hasRenderableCombatPlotly(q);
}

/** @deprecated Use hasRenderableCombatVisual */
export function hasRenderableCombatSvg(q) {
    return hasRenderableCombatVisual(q);
}

/**
 * Mount GOM or Plotly for a combat / feedback question.
 * @param {HTMLElement | null} el
 * @param { { visual_type?: string, visual_spec?: unknown, plotly_spec?: string } } q
 */
export function mountCombatVisual(el, q) {
    if (!el) return;
    if (typeof Plotly !== "undefined") {
        try {
            Plotly.purge(el);
        } catch (_) {}
    }
    el.innerHTML = "";

    if (hasRenderableCombatGom(q) && q.visual_spec) {
        try {
            const svg = renderGomSpecToSvgElement(
                /** @type {import("./schemas/combatQuestion.js").GomSpec} */ (q.visual_spec)
            );
            el.appendChild(svg);
            el.classList.remove("hidden");
        } catch (_) {
            el.classList.add("hidden");
        }
        return;
    }

    if (hasRenderableCombatPlotly(q)) {
        const parsed = parsePlotlySpec(q.plotly_spec);
        if (parsed && typeof Plotly !== "undefined") {
            const baseLayout = getDarkPlotlyLayoutBase();
            const layout = { ...baseLayout, ...parsed.layout, autosize: true };
            delete layout.height;
            delete layout.width;
            Plotly.newPlot(el, parsed.data, layout, {
                displayModeBar: false,
                responsive: true
            });
            requestAnimationFrame(() => {
                try {
                    Plotly.Plots.resize(el);
                } catch (_) {}
            });
            el.classList.remove("hidden");
            return;
        }
    }

    el.classList.add("hidden");
}

/** @deprecated Use mountCombatVisual */
export function mountCombatVisualSvg(el, q) {
    mountCombatVisual(el, q);
}

/** Clear battle or feedback visual mount point. */
export function clearCombatVisualMount(el) {
    if (!el) return;
    if (typeof Plotly !== "undefined") {
        try {
            Plotly.purge(el);
        } catch (_) {}
    }
    el.innerHTML = "";
    el.classList.add("hidden");
}

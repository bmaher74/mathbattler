/**
 * Combat question diagrams: raw SVG in JSON (single-quoted attributes).
 */

import { extractAllIntegers } from "./plotlyQuestionHeuristics.js";

/** True when the payload should render an SVG in the battle / feedback UI. */
export function hasRenderableCombatSvg(q) {
    if (!q || q.visual_type !== "svg") return false;
    const s = String(q.svg_spec ?? "").trim();
    if (s.length < 12) return false;
    return /<svg[\s>]/i.test(s) && /viewBox\s*=\s*['"]/i.test(s);
}

/**
 * @param {HTMLElement | null} el
 * @param { { visual_type?: string, svg_spec?: string } } q
 */
export function mountCombatVisualSvg(el, q) {
    if (!el) return;
    if (!hasRenderableCombatSvg(q)) {
        el.classList.add("hidden");
        el.innerHTML = "";
        return;
    }
    el.innerHTML = String(q.svg_spec).trim();
    el.classList.remove("hidden");
    const svg = el.querySelector("svg");
    if (svg) {
        svg.classList.add("w-full", "max-w-xs", "mx-auto", "my-2", "block");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-hidden", "true");
    }
}

/** Clear battle or feedback visual mount point. */
export function clearCombatVisualMount(el) {
    if (!el) return;
    el.innerHTML = "";
    el.classList.add("hidden");
}

/**
 * Minimal Start / Change / End bar SVG for quantity stories when the model omits svg_spec.
 * Single-quoted attributes only; viewBox 0 0 100 100.
 */
export function synthesizeQuantityStorySvgSpec(q) {
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
    const vals = [start, signedChange, end];
    const maxAbs = Math.max(1, ...vals.map((v) => Math.abs(v)));
    const labels = ["Start", "Chg", "End"];
    const colors = ["#60a5fa", signedChange < 0 ? "#f87171" : "#34d399", "#fbbf24"];
    const bw = 22;
    const gap = 6;
    const baseY = 88;
    const maxH = 62;
    let x = 10;
    const parts = [];
    for (let i = 0; i < 3; i++) {
        const v = vals[i];
        const h = Math.round((Math.abs(v) / maxAbs) * maxH);
        const y = baseY - h;
        const fill = colors[i];
        parts.push(
            `<rect x='${x}' y='${y}' width='${bw}' height='${h}' fill='${fill}' stroke='black' stroke-width='0.6'/>`
        );
        parts.push(
            `<text x='${x + bw / 2}' y='${96}' font-size='5' text-anchor='middle' fill='#e5e7eb'>${labels[i]}</text>`
        );
        x += bw + gap;
    }
    return `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>${parts.join("")}</svg>`;
}

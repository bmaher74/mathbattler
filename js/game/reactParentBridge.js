/** Debounced snapshot of map HUD text nodes → React parent (`postMessage`) when embedded in an iframe. */

export const MB_LEGACY_POSTMESSAGE_SOURCE = "mathbattler-legacy";

let hudSnapTimer = null;

function readHudPayload() {
    const t = (id) => {
        try {
            return document.getElementById(id)?.textContent?.trim() ?? "";
        } catch (_) {
            return "";
        }
    };
    return {
        cloudLine1: t("cloud-sync-badge-line1"),
        cloudLine2: t("cloud-sync-badge-line2"),
        streak: t("map-streak-line"),
        dailyQuest: t("map-daily-quest-line"),
        aiLine2: t("ai-status-line2"),
        bufferHint: t("map-question-buffer-hint"),
        aiRouteNotice: t("ai-route-notice")
    };
}

function postHudSnapshotToParent() {
    try {
        if (typeof window === "undefined" || window.parent === window) return;
        const msg = {
            source: MB_LEGACY_POSTMESSAGE_SOURCE,
            type: "hud-snapshot",
            ts: Date.now(),
            payload: readHudPayload()
        };
        /** `srcdoc` iframes can report an opaque origin; `*` avoids dropped deliveries. */
        const o =
            typeof location !== "undefined" && location.origin && location.origin !== "null"
                ? location.origin
                : "*";
        try {
            window.parent.postMessage(msg, o);
        } catch (_) {
            window.parent.postMessage(msg, "*");
        }
    } catch (_) {
        /* ignore */
    }
}

/** Immediate send (map render, tab hide) so navigation does not cancel a pending debounced post. */
export function flushReactParentHudSnapshot() {
    try {
        if (typeof window === "undefined" || window.parent === window) return;
    } catch (_) {
        return;
    }
    if (hudSnapTimer) {
        clearTimeout(hudSnapTimer);
        hudSnapTimer = null;
    }
    postHudSnapshotToParent();
}

export function scheduleReactParentHudSnapshot() {
    try {
        if (typeof window === "undefined" || window.parent === window) return;
    } catch (_) {
        return;
    }
    if (hudSnapTimer) clearTimeout(hudSnapTimer);
    hudSnapTimer = setTimeout(() => {
        hudSnapTimer = null;
        postHudSnapshotToParent();
    }, 16);
}

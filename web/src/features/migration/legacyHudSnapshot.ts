export const MB_LAST_HUD_SNAPSHOT_KEY = "mb_last_hud_snapshot_v1";

/** Payload mirrored from `js/game/reactParentBridge.js` `readHudPayload()`. */
export type LegacyHudSnapshot = {
    cloudLine1: string;
    cloudLine2: string;
    streak: string;
    dailyQuest: string;
    aiLine2: string;
    bufferHint: string;
    aiRouteNotice: string;
};

export function isLegacyHudSnapshot(x: unknown): x is LegacyHudSnapshot {
    if (!x || typeof x !== "object") return false;
    const o = x as Record<string, unknown>;
    const keys = ["cloudLine1", "cloudLine2", "streak", "dailyQuest", "aiLine2", "bufferHint", "aiRouteNotice"];
    return keys.every((k) => typeof o[k] === "string");
}

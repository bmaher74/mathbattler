import { useEffect } from "react";
import { isLegacyHudSnapshot, MB_LAST_HUD_SNAPSHOT_KEY } from "@/features/migration/legacyHudSnapshot";

const SOURCE = "mathbattler-legacy";

/** Forwards iframe `postMessage` HUD snapshots to a same-tab `CustomEvent` + sessionStorage for later routes. */
export default function LegacyHudBridge() {
    useEffect(() => {
        function onMessage(ev: MessageEvent) {
            const d = ev.data;
            if (!d || typeof d !== "object") return;
            if (d.source !== SOURCE || d.type !== "hud-snapshot") return;
            const payload = d.payload;
            if (!isLegacyHudSnapshot(payload)) return;
            try {
                const wrapped = JSON.stringify({ ts: Date.now(), payload });
                sessionStorage.setItem(MB_LAST_HUD_SNAPSHOT_KEY, wrapped);
                localStorage.setItem(MB_LAST_HUD_SNAPSHOT_KEY, wrapped);
            } catch {
                /* ignore */
            }
            window.dispatchEvent(new CustomEvent("mb-legacy-hud-snapshot", { detail: payload }));
        }
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);
    return null;
}

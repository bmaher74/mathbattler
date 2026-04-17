import { useEffect } from "react";
import { isLegacyHudSnapshot, MB_LAST_HUD_SNAPSHOT_KEY } from "@/features/migration/legacyHudSnapshot";
import { signOutShellFirebase } from "@/lib/firebaseWeb";

const SOURCE = "mathbattler-legacy";

function isTrustedLegacyMessageOrigin(origin: string): boolean {
    if (origin === window.location.origin) return true;
    // `about:srcdoc` sometimes reports the serialized origin as the string "null" while still being our iframe.
    if (origin === "null") return true;
    return false;
}

/**
 * `postMessage` from the classic `/game` iframe: HUD snapshots and map logout.
 * Rejects cross-site origins; allows this app origin and the common srcdoc serialized origin.
 */
export default function LegacyHudBridge() {
    useEffect(() => {
        function onMessage(ev: MessageEvent) {
            if (!isTrustedLegacyMessageOrigin(ev.origin)) return;
            const d = ev.data;
            if (!d || typeof d !== "object" || d.source !== SOURCE) return;

            if (d.type === "request-sign-out") {
                void (async () => {
                    await signOutShellFirebase();
                    window.location.assign("/signin");
                })();
                return;
            }

            if (d.type !== "hud-snapshot") return;
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

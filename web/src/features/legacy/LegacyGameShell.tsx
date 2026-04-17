import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import bodyContent from "@/legacy/bodyContent.html?raw";
import { ensureShellAuthBootstrap } from "@/lib/firebaseWeb";
import { buildLegacyEmbedHtml } from "./buildLegacyEmbedHtml";

/**
 * Classic client in an isolated iframe so each visit to `/game` gets a fresh `js/main.js` realm
 * (avoids stale DOM after SPA navigation away and back).
 * Waits for shell Firebase Auth bootstrap first so the iframe reuses the same persisted session (same origin).
 */
export default function LegacyGameShell() {
    const { key } = useLocation();
    const iframeKey = key ?? "default";
    const base =
        import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const srcDoc = useMemo(() => buildLegacyEmbedHtml(bodyContent, base), [base]);
    const [authPrimed, setAuthPrimed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void ensureShellAuthBootstrap().finally(() => {
            if (!cancelled) setAuthPrimed(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    if (!authPrimed) {
        return (
            <div className="flex h-dvh min-h-0 w-full flex-col items-center justify-center gap-2 bg-gray-900 px-4 text-center text-sm text-slate-400">
                <p className="font-bold uppercase tracking-wide text-slate-500">Connecting online save…</p>
                <p className="max-w-sm text-xs">One Firebase session is shared with the classic game in this tab.</p>
            </div>
        );
    }

    return (
        <iframe
            key={iframeKey}
            title="Math Creature Battler — classic client"
            className="block h-dvh min-h-0 w-full max-w-full flex-none border-0 bg-gray-900"
            srcDoc={srcDoc}
        />
    );
}

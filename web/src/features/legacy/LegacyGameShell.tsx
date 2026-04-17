import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import bodyContent from "@/legacy/bodyContent.html?raw";
import { buildLegacyEmbedHtml } from "./buildLegacyEmbedHtml";

/**
 * Classic client in an isolated iframe so each visit to `/game` gets a fresh `js/main.js` realm
 * (avoids stale DOM after SPA navigation away and back).
 */
export default function LegacyGameShell() {
    const { key } = useLocation();
    const iframeKey = key ?? "default";
    const base =
        import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const srcDoc = useMemo(() => buildLegacyEmbedHtml(bodyContent, base), [base]);

    return (
        <iframe
            key={iframeKey}
            title="Math Creature Battler — classic client"
            className="block h-dvh min-h-0 w-full max-w-full flex-none border-0 bg-gray-900"
            srcDoc={srcDoc}
        />
    );
}

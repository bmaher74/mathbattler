import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isLegacyHudSnapshot, MB_LAST_HUD_SNAPSHOT_KEY, type LegacyHudSnapshot } from "@/features/migration/legacyHudSnapshot";

function parseWrapped(raw: string | null): { ts: number; payload: LegacyHudSnapshot } | null {
    if (!raw) return null;
    try {
        const o = JSON.parse(raw) as { ts?: unknown; payload?: unknown };
        const ts = typeof o.ts === "number" ? o.ts : 0;
        if (!isLegacyHudSnapshot(o.payload)) return null;
        return { ts, payload: o.payload };
    } catch {
        return null;
    }
}

/** Prefer newest between sessionStorage (same tab) and localStorage (cross-tab mirror). */
function readStoredHudSnapshot(): LegacyHudSnapshot | null {
    const a = parseWrapped(sessionStorage.getItem(MB_LAST_HUD_SNAPSHOT_KEY));
    const b = parseWrapped(localStorage.getItem(MB_LAST_HUD_SNAPSHOT_KEY));
    if (!a && !b) return null;
    if (!a) return b!.payload;
    if (!b) return a.payload;
    return a.ts >= b.ts ? a.payload : b.payload;
}

function snapshotHasText(s: LegacyHudSnapshot | null): boolean {
    if (!s) return false;
    return Boolean(
        s.cloudLine1 ||
            s.cloudLine2 ||
            s.streak ||
            s.dailyQuest ||
            s.aiLine2 ||
            s.bufferHint ||
            s.aiRouteNotice
    );
}

/** RTL-oriented testids; values from iframe `postMessage` + `sessionStorage`. */
export default function HudPreviewPage() {
    const [snap, setSnap] = useState<LegacyHudSnapshot | null>(() => readStoredHudSnapshot());

    const reloadFromStorage = useCallback(() => {
        setSnap(readStoredHudSnapshot());
    }, []);

    useEffect(() => {
        function onSnap(ev: Event) {
            const ce = ev as CustomEvent<unknown>;
            const d = ce.detail;
            if (isLegacyHudSnapshot(d)) setSnap(d);
        }
        window.addEventListener("mb-legacy-hud-snapshot", onSnap);
        return () => window.removeEventListener("mb-legacy-hud-snapshot", onSnap);
    }, []);

    useEffect(() => {
        function onStorage(ev: StorageEvent) {
            if (ev.key !== MB_LAST_HUD_SNAPSHOT_KEY || !ev.newValue) return;
            try {
                const o = JSON.parse(ev.newValue) as { payload?: unknown };
                if (isLegacyHudSnapshot(o.payload)) setSnap(o.payload);
            } catch {
                /* ignore */
            }
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const live = snapshotHasText(snap);

    const cloudText =
        snap && (snap.cloudLine1 || snap.cloudLine2)
            ? [snap.cloudLine1, snap.cloudLine2].filter(Boolean).join(" — ")
            : "—";
    const aiText =
        snap && (snap.aiLine2 || snap.bufferHint)
            ? [snap.aiLine2, snap.bufferHint].filter(Boolean).join(" · ")
            : "—";
    const engageText =
        snap && (snap.streak || snap.dailyQuest)
            ? [snap.streak, snap.dailyQuest].filter(Boolean).join("\n")
            : "—";

    return (
        <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-black text-slate-100">HUD preview (migration)</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={reloadFromStorage}
                        className="rounded-lg border border-slate-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:bg-slate-800"
                    >
                        Reload snapshot
                    </button>
                    <Link to="/game" className="text-xs font-bold uppercase text-sky-400 hover:underline">
                        /game →
                    </Link>
                </div>
            </div>

            {!live ? (
                <p className="rounded-lg border border-amber-800/50 bg-amber-950/35 px-3 py-2 text-sm text-amber-100/95">
                    No HUD text yet. Open{" "}
                    <Link className="font-bold text-sky-300 underline" to="/game">
                        /game
                    </Link>
                    , sign in, open the <strong>quest map</strong>, then return here (or click <strong>Reload snapshot</strong>
                    ). With <code className="rounded bg-black/30 px-1">/game</code> in another tab, this page can update
                    when{" "}
                    {"that tab's"} map HUD changes (same origin, via localStorage).
                </p>
            ) : null}

            <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                <li>
                    Classic map HUD posts a debounced{" "}
                    <code className="rounded bg-slate-800 px-1 text-[11px]">postMessage</code> to this shell.
                </li>
                <li>Last payload is cached in session storage so this route can show it after you leave /game.</li>
            </ul>

            {snap?.aiRouteNotice ? (
                <p className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
                    {snap.aiRouteNotice}
                </p>
            ) : null}

            <div
                data-testid="cloud-sync-badge-preview"
                className="whitespace-pre-wrap rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs text-slate-300"
            >
                {cloudText}
            </div>
            <div
                data-testid="ai-questions-status-preview"
                className="whitespace-pre-wrap rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs text-slate-300"
            >
                {aiText}
            </div>
            <div
                data-testid="engagement-toast-preview"
                className="whitespace-pre-wrap rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
            >
                {engageText}
            </div>

            <p className="text-[11px] text-slate-500">
                Map overlays:{" "}
                <Link className="text-sky-400 underline" to="/map/bestiary">
                    /map/bestiary
                </Link>
                ,{" "}
                <Link className="text-sky-400 underline" to="/map/upgrades">
                    /map/upgrades
                </Link>
                ,{" "}
                <Link className="text-sky-400 underline" to="/map/practice">
                    /map/practice
                </Link>
                .
            </p>
        </div>
    );
}

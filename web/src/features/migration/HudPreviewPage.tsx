import { Link } from "react-router-dom";

/** Stub targets for React Testing Library once HUD state leaves legacy DOM. */
export default function HudPreviewPage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-black text-slate-100">HUD preview (migration)</h1>
                <Link to="/game" className="text-xs font-bold uppercase text-sky-400 hover:underline">
                    Classic game →
                </Link>
            </div>
            <p className="text-sm text-slate-400">
                Placeholders mirror the IDs used in the classic layout for cloud sync, AI status, and engagement toasts.
                Map overlays open the classic UI via{" "}
                <code className="rounded bg-slate-800 px-1 text-[11px]">/game?overlay=…</code> from{" "}
                <Link className="text-sky-400 underline" to="/map/bestiary">
                    /map/bestiary
                </Link>
                ,{" "}
                <Link className="text-sky-400 underline" to="/map/upgrades">
                    /map/upgrades
                </Link>
                , and{" "}
                <Link className="text-sky-400 underline" to="/map/practice">
                    /map/practice
                </Link>
                .
            </p>
            <div
                data-testid="cloud-sync-badge-preview"
                className="rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs text-slate-300"
            >
                Cloud sync badge (preview)
            </div>
            <div
                data-testid="ai-questions-status-preview"
                className="rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs text-slate-300"
            >
                AI questions status (preview)
            </div>
            <div
                data-testid="engagement-toast-preview"
                className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
            >
                Engagement toast (preview)
            </div>
        </div>
    );
}

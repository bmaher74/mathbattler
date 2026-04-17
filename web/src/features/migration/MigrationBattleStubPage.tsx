import { Link } from "react-router-dom";

/** URL reservation for a future React battle shell; combat still runs in the classic iframe at `/game`. */
export default function MigrationBattleStubPage() {
    return (
        <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
            <h1 className="text-xl font-black text-slate-100">Battle (migration stub)</h1>
            <p className="text-sm text-slate-400">
                The full combat loop, judge UI, and overlays still live in the classic client. Open{" "}
                <Link className="text-sky-400 underline" to="/game">
                    /game
                </Link>{" "}
                to play. This route exists so the router and nav can grow toward a ported battle without URL churn.
            </p>
            <Link
                to="/map"
                className="inline-block rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
            >
                ← Map
            </Link>
        </div>
    );
}

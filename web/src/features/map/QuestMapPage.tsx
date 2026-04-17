import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QUEST_ROUTE } from "@game/constants.js";

const VB_W = 360;
const VB_H = 1040;

/** Session key consumed by legacy `js/main.js` after login (`readPendingStartLevelFromBridge`). */
const PENDING_LEVEL_KEY = "mb_pending_start_level";

export default function QuestMapPage() {
    const navigate = useNavigate();
    const pts = useMemo(() => QUEST_ROUTE.map((q, i) => ({ ...q, level: i + 1 })), []);

    function onPickLevel(level: number) {
        try {
            sessionStorage.setItem(PENDING_LEVEL_KEY, String(level));
        } catch {
            /* ignore */
        }
        navigate("/game");
    }

    return (
        <div className="mx-auto max-w-lg px-3 py-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h1 className="text-xl font-black text-slate-100">Quest map (React)</h1>
                    <p className="text-xs text-slate-400">
                        Tap a node, then open the classic client — it will pre-start that level after you log in (if
                        unlocked).
                    </p>
                </div>
                <Link
                    to="/game"
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold uppercase text-slate-200 hover:bg-slate-800"
                >
                    Full game →
                </Link>
            </div>
            <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="h-auto w-full max-h-[min(78vh,52rem)] rounded-xl border border-slate-700 bg-slate-950 drop-shadow-xl"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Quest map preview"
            >
                <defs>
                    <linearGradient id="react-quest-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: "#0f172a" }} />
                        <stop offset="45%" style={{ stopColor: "#1e1b4b" }} />
                        <stop offset="100%" style={{ stopColor: "#312e81" }} />
                    </linearGradient>
                </defs>
                <rect width={VB_W} height={VB_H} fill="url(#react-quest-sky)" />
                {pts.map((p) => (
                    <g key={p.level}>
                        <title>{`${p.name} — ${p.blurb}`}</title>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={40}
                            fill="rgba(15,23,42,0.92)"
                            stroke={p.hue}
                            strokeWidth={3}
                            className="cursor-pointer hover:opacity-90"
                            onClick={() => onPickLevel(p.level)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onPickLevel(p.level);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        />
                        <text
                            x={p.x}
                            y={p.y + 6}
                            textAnchor="middle"
                            fill="#e2e8f0"
                            fontSize="14"
                            fontWeight="bold"
                            pointerEvents="none"
                        >
                            {p.level}
                        </text>
                        <text
                            x={p.x}
                            y={p.y + 58}
                            textAnchor="middle"
                            fill={p.hue}
                            fontSize="9"
                            fontWeight="700"
                            pointerEvents="none"
                        >
                            {p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name}
                        </text>
                    </g>
                ))}
            </svg>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link
                    to="/map/bestiary"
                    className="rounded-lg border border-slate-600 px-3 py-2 font-bold uppercase text-slate-300 hover:bg-slate-800"
                >
                    Bestiary
                </Link>
                <Link
                    to="/map/upgrades"
                    className="rounded-lg border border-slate-600 px-3 py-2 font-bold uppercase text-slate-300 hover:bg-slate-800"
                >
                    Upgrades
                </Link>
                <Link
                    to="/map/practice"
                    className="rounded-lg border border-slate-600 px-3 py-2 font-bold uppercase text-slate-300 hover:bg-slate-800"
                >
                    Practice
                </Link>
            </div>
        </div>
    );
}

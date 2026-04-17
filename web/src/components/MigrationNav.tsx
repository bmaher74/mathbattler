import { Link, useLocation } from "react-router-dom";
import { signOutShellFirebase } from "@/lib/firebaseWeb";

const linkCls =
    "rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-300 hover:bg-slate-800 hover:text-white";

export default function MigrationNav() {
    const { pathname } = useLocation();
    if (pathname === "/game" || pathname.startsWith("/game/")) return null;

    async function onResetOnlineSave() {
        await signOutShellFirebase();
        window.location.assign(pathname && pathname !== "/" ? pathname : "/map");
    }

    return (
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">React shell</span>
            <nav className="flex flex-wrap gap-1">
                <Link className={linkCls} to="/game">
                    Classic game
                </Link>
                <Link className={linkCls} to="/signin">
                    Sign in
                </Link>
                <Link className={linkCls} to="/map">
                    Map
                </Link>
                <Link className={linkCls} to="/map/practice">
                    Practice
                </Link>
                <Link className={linkCls} to="/settings/audio">
                    Audio
                </Link>
                <Link className={linkCls} to="/migration/hud">
                    HUD preview
                </Link>
                <Link className={linkCls} to="/migration/battle">
                    Battle stub
                </Link>
            </nav>
            <button
                type="button"
                className="ml-auto rounded-md border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 hover:border-amber-800/60 hover:text-amber-200/90"
                title="Clears Firebase Auth persistence for this site (shell + classic iframe on next load)"
                onClick={() => void onResetOnlineSave()}
            >
                Reset online save session
            </button>
        </header>
    );
}

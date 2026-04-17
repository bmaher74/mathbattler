import { Link, useLocation } from "react-router-dom";

const linkCls =
    "rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-300 hover:bg-slate-800 hover:text-white";

export default function MigrationNav() {
    const { pathname } = useLocation();
    if (pathname === "/game" || pathname.startsWith("/game/")) return null;

    return (
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur-sm">
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
            </nav>
        </header>
    );
}

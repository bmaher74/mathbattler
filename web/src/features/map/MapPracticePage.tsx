import { Navigate } from "react-router-dom";
import { MB_REACT_RETURN_AFTER_OVERLAY_KEY } from "@game/constants.js";

/** Hands off to legacy `openPracticeMode` via `/game?overlay=practice`; Close returns to `/map` when launched from here. */
export default function MapPracticePage() {
    try {
        sessionStorage.setItem(MB_REACT_RETURN_AFTER_OVERLAY_KEY, "/map");
    } catch {
        /* ignore */
    }
    return <Navigate to="/game?overlay=practice" replace />;
}

import { Navigate } from "react-router-dom";
import { MB_REACT_RETURN_AFTER_OVERLAY_KEY } from "@game/constants.js";

/**
 * React reserves `/map/bestiary`; classic map HUD + overlays still render inside `/game`.
 * We hand off to legacy `openBestiary` (same stacking as `closeOtherMapHudOverlays`) and return to `/map` on Close when launched from here.
 */
export default function MapBestiaryPage() {
    try {
        sessionStorage.setItem(MB_REACT_RETURN_AFTER_OVERLAY_KEY, "/map");
    } catch {
        /* ignore */
    }
    return <Navigate to="/game?overlay=bestiary" replace />;
}

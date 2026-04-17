import { Navigate } from "react-router-dom";
import { MB_REACT_RETURN_AFTER_OVERLAY_KEY } from "@game/constants.js";

/** Same bridge as bestiary: real upgrades overlay on `/game`, optional return to React map. */
export default function MapUpgradesPage() {
    try {
        sessionStorage.setItem(MB_REACT_RETURN_AFTER_OVERLAY_KEY, "/map");
    } catch {
        /* ignore */
    }
    return <Navigate to="/game?overlay=upgrades" replace />;
}

import { useCallback, useState } from "react";

/** Session key consumed by legacy `js/main.js` (`applyReactBridgePrefill`). */
export const REACT_PLAYER_PREFILL_KEY = "mb_prefill_player_name";

export function writePlayerNameForClassicGame(name: string) {
    const t = String(name || "").trim().slice(0, 120);
    if (!t) return;
    try {
        sessionStorage.setItem(REACT_PLAYER_PREFILL_KEY, t);
    } catch {
        /* private mode */
    }
}

export function readPlayerNamePrefill(): string | null {
    try {
        const v = sessionStorage.getItem(REACT_PLAYER_PREFILL_KEY);
        return v && v.trim() ? v.trim() : null;
    } catch {
        return null;
    }
}

/**
 * Display name for the classic login form: stored in sessionStorage for `applyReactBridgePrefill` in `js/main.js`.
 * Firebase Auth (anonymous by default) is established in the React shell via `ensureShellAuthBootstrap` in
 * `firebaseWeb.ts` so the `/game` iframe reuses the same persisted session (same origin).
 */
export function useAuthFlow() {
    const [playerName, setPlayerName] = useState(() => readPlayerNamePrefill() ?? "");

    const saveForClassicGame = useCallback(() => {
        writePlayerNameForClassicGame(playerName);
    }, [playerName]);

    return { playerName, setPlayerName, saveForClassicGame };
}

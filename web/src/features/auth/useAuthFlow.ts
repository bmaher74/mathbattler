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
 * Minimal “auth flow” for the migration shell: collect display name and pass it to the classic client.
 * Full Firebase Auth remains in legacy `main.js` (gstatic) until a single bundled SDK path exists.
 */
export function useAuthFlow() {
    const [playerName, setPlayerName] = useState(() => readPlayerNamePrefill() ?? "");

    const saveForClassicGame = useCallback(() => {
        writePlayerNameForClassicGame(playerName);
    }, [playerName]);

    return { playerName, setPlayerName, saveForClassicGame };
}

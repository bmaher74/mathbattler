/**
 * Map vs combat background music (CC0 — see audio/SOURCES.txt).
 * Switches on screen transitions; requires a user gesture before audio can start (login / first interaction).
 */

const MAP_SRC = new URL("../audio/determined_pursuit_loop.ogg", import.meta.url).href;
const COMBAT_SRC = new URL("../audio/heartfelt-battle_loop.ogg", import.meta.url).href;

let mapAudio;
let combatAudio;
/** @type {"map" | "combat" | null} */
let activeScene = null;

function ensureAudio() {
    if (mapAudio) return;
    mapAudio = new Audio(MAP_SRC);
    combatAudio = new Audio(COMBAT_SRC);
    mapAudio.loop = true;
    combatAudio.loop = true;
    mapAudio.preload = "auto";
    combatAudio.preload = "auto";
    mapAudio.volume = 0.38;
    combatAudio.volume = 0.34;
}

/**
 * Call from a click handler so playback is allowed (browser autoplay policy).
 */
export async function startMapBgmFromUserGesture() {
    ensureAudio();
    if (activeScene === "map") {
        try {
            await mapAudio.play();
        } catch (_) {
            /* ignored */
        }
        return;
    }
    combatAudio.pause();
    combatAudio.currentTime = 0;
    activeScene = "map";
    try {
        await mapAudio.play();
    } catch (_) {
        /* Safari / strict autoplay: may need another gesture */
    }
}

export async function startCombatBgmFromUserGesture() {
    ensureAudio();
    if (activeScene === "combat") {
        try {
            await combatAudio.play();
        } catch (_) {
            /* ignored */
        }
        return;
    }
    mapAudio.pause();
    mapAudio.currentTime = 0;
    activeScene = "combat";
    try {
        await combatAudio.play();
    } catch (_) {
        /* ignored */
    }
}

export function stopAllBgm() {
    ensureAudio();
    mapAudio.pause();
    combatAudio.pause();
    activeScene = null;
}

/** Pause/resume when the tab is backgrounded (keeps activeScene). */
export function wireBgmVisibility() {
    ensureAudio();
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            mapAudio.pause();
            combatAudio.pause();
        } else if (activeScene === "map") {
            void mapAudio.play().catch(() => {});
        } else if (activeScene === "combat") {
            void combatAudio.play().catch(() => {});
        }
    });
}

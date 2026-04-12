/**
 * Per-profile music / SFX levels (stored in state + localStorage + Firestore).
 */
import { state } from "./state.js";
import { applyBgmUserSettings } from "./bgm.js";
import { setCombatSfxUserGain } from "./combatSfx.js";

const DEFAULT_AUDIO = {
    musicVolume: 1,
    sfxVolume: 1,
    musicMuted: false,
    sfxMuted: false
};

export function normalizeAudioSettings(raw) {
    const a = raw && typeof raw === "object" ? raw : {};
    let mv = typeof a.musicVolume === "number" ? a.musicVolume : DEFAULT_AUDIO.musicVolume;
    let sv = typeof a.sfxVolume === "number" ? a.sfxVolume : DEFAULT_AUDIO.sfxVolume;
    mv = Math.min(1, Math.max(0, mv));
    sv = Math.min(1, Math.max(0, sv));
    return {
        musicVolume: mv,
        sfxVolume: sv,
        musicMuted: typeof a.musicMuted === "boolean" ? a.musicMuted : DEFAULT_AUDIO.musicMuted,
        sfxMuted: typeof a.sfxMuted === "boolean" ? a.sfxMuted : DEFAULT_AUDIO.sfxMuted
    };
}

/** Prefer second doc (local / session) when it carries audio fields. */
export function mergeProfileAudio(cloudDoc, localDoc) {
    const l = localDoc && typeof localDoc.audio === "object" ? localDoc.audio : null;
    const c = cloudDoc && typeof cloudDoc.audio === "object" ? cloudDoc.audio : null;
    if (
        l &&
        (l.musicVolume != null ||
            l.sfxVolume != null ||
            l.musicMuted != null ||
            l.sfxMuted != null)
    ) {
        return normalizeAudioSettings(l);
    }
    if (c) return normalizeAudioSettings(c);
    return normalizeAudioSettings(null);
}

export function effectiveMusicGain() {
    const a = normalizeAudioSettings(state.audio);
    if (a.musicMuted) return 0;
    return a.musicVolume;
}

export function effectiveSfxGain() {
    const a = normalizeAudioSettings(state.audio);
    if (a.sfxMuted) return 0;
    return a.sfxVolume;
}

export function applyAudioFromState() {
    applyBgmUserSettings(effectiveMusicGain());
    setCombatSfxUserGain(effectiveSfxGain());
}

/**
 * @param {Partial<{ musicVolume: number, sfxVolume: number, musicMuted: boolean, sfxMuted: boolean }>} partial
 */
export function patchAudioSettings(partial) {
    state.audio = normalizeAudioSettings({ ...state.audio, ...partial });
    applyAudioFromState();
}

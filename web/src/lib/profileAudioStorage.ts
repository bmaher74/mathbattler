/** Matches `mathbattler_profile_*` keys in `js/main.js` `profileStorageKey`. */
const PROFILE_PREFIX = "mathbattler_profile_";

export type ProfileAudio = {
    musicVolume: number;
    sfxVolume: number;
    musicMuted: boolean;
    sfxMuted: boolean;
};

const DEFAULT_AUDIO: ProfileAudio = {
    musicVolume: 1,
    sfxVolume: 1,
    musicMuted: false,
    sfxMuted: false
};

/** Same clamp rules as `js/audioSettings.js` `normalizeAudioSettings` (no `state.js` import). */
export function normalizeProfileAudio(raw: unknown): ProfileAudio {
    const a = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
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

export function listProfileStorageKeys(): string[] {
    if (typeof localStorage === "undefined") return [];
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PROFILE_PREFIX)) out.push(k);
    }
    return out.sort();
}

export function loadProfileDoc(key: string): Record<string, unknown> | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const d = JSON.parse(raw) as unknown;
        return d && typeof d === "object" ? (d as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}

export function saveProfileAudio(key: string, audio: ProfileAudio) {
    const doc = loadProfileDoc(key);
    if (!doc) return false;
    const next = { ...doc, audio: normalizeProfileAudio(audio) };
    try {
        localStorage.setItem(key, JSON.stringify(next));
        return true;
    } catch {
        return false;
    }
}

export function readAudioFromProfileKey(key: string): ProfileAudio {
    const doc = loadProfileDoc(key);
    const a = doc?.audio;
    return normalizeProfileAudio(a);
}

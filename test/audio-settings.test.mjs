/**
 * Tests for js/audioSettings.js (pure normalization + merge; no browser Audio).
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { normalizeAudioSettings, mergeProfileAudio, effectiveMusicGain, effectiveSfxGain } = await import(
    join(ROOT, "js/audioSettings.js")
);
const { state } = await import(join(ROOT, "js/state.js"));

let savedAudio;

beforeEach(() => {
    savedAudio = { ...state.audio };
});

afterEach(() => {
    state.audio = savedAudio;
});

describe("normalizeAudioSettings", () => {
    it("applies defaults for non-objects", () => {
        const a = normalizeAudioSettings(null);
        assert.deepEqual(a, {
            musicVolume: 1,
            sfxVolume: 1,
            musicMuted: false,
            sfxMuted: false
        });
    });

    it("clamps volumes to 0..1", () => {
        const a = normalizeAudioSettings({ musicVolume: -0.5, sfxVolume: 2 });
        assert.equal(a.musicVolume, 0);
        assert.equal(a.sfxVolume, 1);
    });

    it("preserves explicit booleans", () => {
        const a = normalizeAudioSettings({ musicMuted: true, sfxMuted: true });
        assert.equal(a.musicMuted, true);
        assert.equal(a.sfxMuted, true);
    });
});

describe("mergeProfileAudio", () => {
    it("prefers local audio when it defines any field", () => {
        const out = mergeProfileAudio(
            { audio: { musicVolume: 0.2, sfxVolume: 0.2, musicMuted: false, sfxMuted: false } },
            { audio: { musicVolume: 0.8 } }
        );
        assert.equal(out.musicVolume, 0.8);
    });

    it("falls back to cloud when local has no audio object", () => {
        const out = mergeProfileAudio(
            { audio: { musicVolume: 0.3, sfxVolume: 1, musicMuted: false, sfxMuted: false } },
            {}
        );
        assert.equal(out.musicVolume, 0.3);
    });

    it("returns defaults when neither side has usable audio", () => {
        const out = mergeProfileAudio({}, { profile: "x" });
        assert.equal(out.musicVolume, 1);
        assert.equal(out.sfxVolume, 1);
    });
});

describe("effectiveMusicGain / effectiveSfxGain", () => {
    it("returns 0 when muted", () => {
        state.audio = normalizeAudioSettings({ musicVolume: 1, musicMuted: true, sfxVolume: 1, sfxMuted: true });
        assert.equal(effectiveMusicGain(), 0);
        assert.equal(effectiveSfxGain(), 0);
    });

    it("returns volume when not muted", () => {
        state.audio = normalizeAudioSettings({ musicVolume: 0.4, sfxVolume: 0.6, musicMuted: false, sfxMuted: false });
        assert.equal(effectiveMusicGain(), 0.4);
        assert.equal(effectiveSfxGain(), 0.6);
    });
});

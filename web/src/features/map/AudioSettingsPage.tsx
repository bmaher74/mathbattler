import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    listProfileStorageKeys,
    normalizeProfileAudio,
    readAudioFromProfileKey,
    saveProfileAudio,
    type ProfileAudio
} from "@/lib/profileAudioStorage";

function displayNameFromKey(key: string) {
    const prefix = "mathbattler_profile_";
    if (!key.startsWith(prefix)) return key;
    try {
        return decodeURIComponent(key.slice(prefix.length)) || key;
    } catch {
        return key;
    }
}

export default function AudioSettingsPage() {
    const keys = useMemo(() => listProfileStorageKeys(), []);
    const [selectedKey, setSelectedKey] = useState(() => keys[0] ?? "");
    const [audio, setAudio] = useState<ProfileAudio>(() =>
        selectedKey ? readAudioFromProfileKey(selectedKey) : normalizeProfileAudio(null)
    );

    useEffect(() => {
        if (!selectedKey) return;
        setAudio(readAudioFromProfileKey(selectedKey));
    }, [selectedKey]);

    const persist = useCallback(
        (next: ProfileAudio) => {
            setAudio(next);
            if (selectedKey) saveProfileAudio(selectedKey, next);
        },
        [selectedKey]
    );

    if (!keys.length) {
        return (
            <div className="mx-auto max-w-lg px-4 py-10 text-slate-200">
                <h1 className="text-xl font-black text-slate-100">Audio</h1>
                <p className="mt-3 text-sm text-slate-400">
                    No <code className="rounded bg-slate-800 px-1 text-xs">mathbattler_profile_*</code> entries yet.
                    Play once in the{" "}
                    <Link className="text-sky-400 underline" to="/game">
                        classic game
                    </Link>{" "}
                    to create a local profile, then return here.
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg px-4 py-8 text-slate-200">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-black text-slate-100">Audio</h1>
                <Link to="/game" className="text-xs font-bold uppercase text-sky-400 hover:underline">
                    Classic game →
                </Link>
            </div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Profile slot
                <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                >
                    {keys.map((k) => (
                        <option key={k} value={k}>
                            {displayNameFromKey(k)}
                        </option>
                    ))}
                </select>
            </label>
            <p className="mt-2 text-[11px] text-slate-500">
                Writes the same <code className="text-sky-200/90">audio</code> object the classic HUD saves in each
                profile blob.
            </p>

            <div className="mt-8 space-y-6 rounded-xl border border-slate-700 bg-slate-950/80 p-5">
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Music volume</span>
                        <span>{Math.round(audio.musicVolume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(audio.musicVolume * 100)}
                        onChange={(e) =>
                            persist({
                                ...audio,
                                musicVolume: Number(e.target.value) / 100,
                                musicMuted: false
                            })
                        }
                        className="mt-2 w-full accent-sky-500"
                    />
                    <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={audio.musicMuted}
                            onChange={(e) => persist({ ...audio, musicMuted: e.target.checked })}
                        />
                        Mute music
                    </label>
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>SFX volume</span>
                        <span>{Math.round(audio.sfxVolume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(audio.sfxVolume * 100)}
                        onChange={(e) =>
                            persist({
                                ...audio,
                                sfxVolume: Number(e.target.value) / 100,
                                sfxMuted: false
                            })
                        }
                        className="mt-2 w-full accent-sky-500"
                    />
                    <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={audio.sfxMuted}
                            onChange={(e) => persist({ ...audio, sfxMuted: e.target.checked })}
                        />
                        Mute SFX
                    </label>
                </div>
            </div>
        </div>
    );
}

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuthFlow } from "@/features/auth/useAuthFlow";
import {
    ensureShellAuthBootstrap,
    getFirebaseWebAuth,
    readFirebaseWebConfigStatus,
    signInOrLinkGoogleInShell,
    type FirebaseWebConfigStatus
} from "@/lib/firebaseWeb";

function formatGoogleAuthError(err: unknown): string {
    const e = err as { code?: string; message?: string };
    const code = e?.code;
    if (code === "auth/popup-blocked") return "Popup was blocked. Allow popups for this site and try again.";
    if (code === "auth/popup-closed-by-user") return "Sign-in was cancelled.";
    if (code === "auth/credential-already-in-use") {
        return "That Google account is already linked to another session here. Use “Reset online save session” in the header, then try again.";
    }
    return e?.message || "Google sign-in failed.";
}

export default function SignInPage() {
    const navigate = useNavigate();
    const { playerName, setPlayerName, saveForClassicGame } = useAuthFlow();
    const [fbStatus, setFbStatus] = useState<FirebaseWebConfigStatus>(() => readFirebaseWebConfigStatus());
    const [shellUser, setShellUser] = useState<User | null>(null);
    const [googleBusy, setGoogleBusy] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    useEffect(() => {
        setFbStatus(readFirebaseWebConfigStatus());
    }, []);

    useEffect(() => {
        const auth = getFirebaseWebAuth();
        if (!auth) {
            setShellUser(null);
            return;
        }
        void ensureShellAuthBootstrap().then(() => setShellUser(auth.currentUser));
        const unsub = onAuthStateChanged(auth, setShellUser);
        return unsub;
    }, [fbStatus]);

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        saveForClassicGame();
        navigate("/map");
    }

    async function onGoogle() {
        setGoogleError(null);
        setGoogleBusy(true);
        try {
            await signInOrLinkGoogleInShell();
        } catch (err) {
            setGoogleError(formatGoogleAuthError(err));
        } finally {
            setGoogleBusy(false);
        }
    }

    const identityHint =
        shellUser && !shellUser.isAnonymous
            ? shellUser.email || shellUser.displayName || "Google"
            : null;

    const shellAuthLine =
        fbStatus !== "ok"
            ? null
            : shellUser
              ? identityHint
                  ? `Online save: ${identityHint} (UID …${shellUser.uid.slice(-6)})`
                  : `Online save: guest session (UID …${shellUser.uid.slice(-6)}) — link Google below to keep progress on that account.`
              : "Establishing online save session…";

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-6 px-4 py-10">
            <div>
                <h1 className="text-2xl font-black text-slate-100">Sign in (migration)</h1>
                <p className="mt-2 text-sm text-slate-400">
                    Firebase Auth runs in this React shell first; the classic client at{" "}
                    <Link className="text-sky-400 underline" to="/game">
                        /game
                    </Link>{" "}
                    reuses the same browser session. Enter your hero name for the classic login screen (still required for
                    profile id).
                </p>
                {fbStatus !== "ok" ? (
                    <p
                        className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
                        role="status"
                    >
                        {fbStatus === "missing"
                            ? "No firebase config detected on window (__firebase_config). Check firebase-config.js and runtime-config."
                            : "Firebase config looks like a placeholder — sign-in may fail until real keys are set."}
                    </p>
                ) : null}
                {shellAuthLine ? (
                    <p className="mt-2 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-xs text-slate-300" role="status">
                        {shellAuthLine}
                    </p>
                ) : null}
                {googleError ? (
                    <p className="mt-2 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-100" role="alert">
                        {googleError}
                    </p>
                ) : null}
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Online account</p>
                <button
                    type="button"
                    disabled={fbStatus !== "ok" || googleBusy}
                    onClick={() => void onGoogle()}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900 py-2.5 text-sm font-bold text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {googleBusy ? (
                        "Opening Google…"
                    ) : (
                        <>
                            <span className="text-lg leading-none" aria-hidden>
                                G
                            </span>
                            {shellUser?.isAnonymous !== false ? "Continue with Google" : "Switch Google account"}
                        </>
                    )}
                </button>
                <p className="text-center text-[10px] text-slate-500">
                    While you are a guest, Google is <span className="font-semibold text-slate-400">linked</span> to the
                    same profile UID. Enable the Google provider in the Firebase console if this button errors.
                </p>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Classic hero name</p>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Display name
                    <input
                        value={playerName}
                        onChange={(ev) => setPlayerName(ev.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                        placeholder="Student Brendan"
                        autoComplete="username"
                    />
                </label>
                <button
                    type="submit"
                    className="rounded-lg bg-sky-600 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-sky-500"
                >
                    Continue to map
                </button>
            </form>
        </div>
    );
}

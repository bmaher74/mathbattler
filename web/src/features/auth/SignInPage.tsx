import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthFlow } from "@/features/auth/useAuthFlow";
import { readFirebaseWebConfigStatus, type FirebaseWebConfigStatus } from "@/lib/firebaseWeb";

export default function SignInPage() {
    const navigate = useNavigate();
    const { playerName, setPlayerName, saveForClassicGame } = useAuthFlow();
    const [fbStatus, setFbStatus] = useState<FirebaseWebConfigStatus>(() => readFirebaseWebConfigStatus());

    useEffect(() => {
        setFbStatus(readFirebaseWebConfigStatus());
    }, []);

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        saveForClassicGame();
        navigate("/map");
    }

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-6 px-4 py-10">
            <div>
                <h1 className="text-2xl font-black text-slate-100">Sign in (migration)</h1>
                <p className="mt-2 text-sm text-slate-400">
                    Enter the hero name used in the classic game. Firebase auth still runs inside the classic client at{" "}
                    <Link className="text-sky-400 underline" to="/game">
                        /game
                    </Link>{" "}
                    (iframe); this step only pre-fills the login form. React-side Firebase wiring is next.
                </p>
                {fbStatus !== "ok" ? (
                    <p
                        className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
                        role="status"
                    >
                        {fbStatus === "missing"
                            ? "No firebase config detected on window (__firebase_config). Check firebase-config.js and runtime-config."
                            : "Firebase config looks like a placeholder — anonymous sign-in inside /game may fail until real keys are set."}
                    </p>
                ) : null}
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-950/80 p-5">
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

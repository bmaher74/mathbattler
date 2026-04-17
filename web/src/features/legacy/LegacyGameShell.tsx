import { useLayoutEffect, useRef } from "react";
import bodyContent from "@/legacy/bodyContent.html?raw";

let legacyMainAttached = false;

/**
 * Injects the legacy `index.html` body markup and loads `js/main.js` as a module.
 * Kept behind React Router as the `*` route so future screens can mount beside or instead of this shell.
 */
export default function LegacyGameShell() {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const host = ref.current;
        if (!host || legacyMainAttached) return;

        host.innerHTML = bodyContent;
        legacyMainAttached = true;

        const script = document.createElement("script");
        script.type = "module";
        const base = import.meta.env.BASE_URL.endsWith("/")
            ? import.meta.env.BASE_URL
            : `${import.meta.env.BASE_URL}/`;
        script.src = `${base}js/main.js`;
        document.body.appendChild(script);
    }, []);

    return (
        <div
            ref={ref}
            className="bg-gray-900 text-white font-sans h-dvh w-screen overflow-hidden flex flex-col"
        />
    );
}

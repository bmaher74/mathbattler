import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import MigrationNav from "@/components/MigrationNav";
import LegacyHudBridge from "@/features/migration/LegacyHudBridge";
import { ensureShellAuthBootstrap } from "@/lib/firebaseWeb";

/**
 * Top-level route shell: safe area, global chrome, error boundaries can wrap here later.
 * Classic game at `/game` hides the migration strip so the legacy layout keeps full height.
 */
export default function RootLayout() {
    useEffect(() => {
        void ensureShellAuthBootstrap();
    }, []);

    return (
        <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
            <LegacyHudBridge />
            <MigrationNav />
            <div className="min-h-0 flex-1">
                <Outlet />
            </div>
        </div>
    );
}

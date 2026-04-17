import { Outlet } from "react-router-dom";

/**
 * Top-level route shell: safe area, global chrome, error boundaries can wrap here later.
 * Legacy game still fills the viewport via nested routes.
 */
export default function RootLayout() {
    return <Outlet />;
}

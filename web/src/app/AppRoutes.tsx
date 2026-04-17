import { Route, Routes } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import LegacyGameShell from "@/features/legacy/LegacyGameShell";

export default function App() {
    return (
        <Routes>
            <Route element={<RootLayout />}>
                <Route path="*" element={<LegacyGameShell />} />
            </Route>
        </Routes>
    );
}

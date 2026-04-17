import { Navigate, Route, Routes } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import LegacyGameShell from "@/features/legacy/LegacyGameShell";
import SignInPage from "@/features/auth/SignInPage";
import QuestMapPage from "@/features/map/QuestMapPage";
import MapBestiaryPage from "@/features/map/MapBestiaryPage";
import MapUpgradesPage from "@/features/map/MapUpgradesPage";
import MapPracticePage from "@/features/map/MapPracticePage";
import AudioSettingsPage from "@/features/map/AudioSettingsPage";
import HudPreviewPage from "@/features/migration/HudPreviewPage";
import MigrationBattleStubPage from "@/features/migration/MigrationBattleStubPage";

export default function App() {
    return (
        <Routes>
            <Route element={<RootLayout />}>
                <Route index element={<Navigate to="/game" replace />} />
                <Route path="signin" element={<SignInPage />} />
                <Route path="map/bestiary" element={<MapBestiaryPage />} />
                <Route path="map/upgrades" element={<MapUpgradesPage />} />
                <Route path="map/practice" element={<MapPracticePage />} />
                <Route path="map" element={<QuestMapPage />} />
                <Route path="settings/audio" element={<AudioSettingsPage />} />
                <Route path="migration/hud" element={<HudPreviewPage />} />
                <Route path="migration/battle" element={<MigrationBattleStubPage />} />
                <Route path="game/*" element={<LegacyGameShell />} />
                <Route path="*" element={<Navigate to="/game" replace />} />
            </Route>
        </Routes>
    );
}

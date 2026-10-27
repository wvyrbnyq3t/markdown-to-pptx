import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { EditorPage } from "../pages/EditorPage";
import { GuidePage } from "../pages/GuidePage";
import { HomePage } from "../pages/HomePage";
import { AccountPage } from "../pages/AccountPage";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

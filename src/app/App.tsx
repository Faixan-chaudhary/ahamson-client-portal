import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LoginPage } from "@/pages/admin/LoginPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { SubmissionsPage } from "@/pages/admin/SubmissionsPage";
import { LinksPage } from "@/pages/admin/LinksPage";
import { SubmissionDetailPage } from "@/pages/admin/SubmissionDetailPage";
import { DocumentFormPage } from "@/pages/client/DocumentFormPage";
import { PreviewPage } from "@/pages/client/PreviewPage";
import { ExpiredPage } from "@/pages/client/ExpiredPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/submissions" element={<SubmissionsPage />} />
        <Route path="/admin/links" element={<LinksPage />} />
        <Route path="/admin/submissions/:id" element={<SubmissionDetailPage />} />
        <Route path="/client/document/:token" element={<DocumentFormPage />} />
        <Route path="/client/preview/:token" element={<PreviewPage />} />
        <Route path="/client/expired" element={<ExpiredPage />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

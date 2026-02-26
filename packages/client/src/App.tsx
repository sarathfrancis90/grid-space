import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ProfilePage from "./components/auth/ProfilePage";
import OAuthCallback from "./components/auth/OAuthCallback";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import DashboardPage from "./components/dashboard/DashboardPage";
import SpreadsheetEditorPage from "./components/dashboard/SpreadsheetEditorPage";
import NotFoundPage from "./components/dashboard/NotFoundPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard — spreadsheet list/home page */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Spreadsheet editor with URL routing (/spreadsheet/:id) */}
        <Route
          path="/spreadsheet/:id"
          element={
            <ProtectedRoute>
              <SpreadsheetEditorPage />
            </ProtectedRoute>
          }
        />

        {/* 404 page */}
        <Route path="/not-found" element={<NotFoundPage />} />

        {/* Root redirects to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

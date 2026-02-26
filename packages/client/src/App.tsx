import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Grid } from "./components/grid";
import { Toolbar } from "./components/toolbar";
import { SheetTabs } from "./components/sheets/SheetTabs";
import { FindReplace } from "./components/data/FindReplace";
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

        {/* Root — the full spreadsheet editor (legacy / default) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div
                data-testid="app-root"
                style={{
                  width: "100vw",
                  height: "100vh",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Toolbar />
                <div
                  style={{ flex: 1, overflow: "hidden", position: "relative" }}
                >
                  <Grid />
                  <FindReplace />
                </div>
                <SheetTabs />
              </div>
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

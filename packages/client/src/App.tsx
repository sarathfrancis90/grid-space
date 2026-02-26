import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Grid } from "./components/grid";
import { Toolbar } from "./components/toolbar";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ProfilePage from "./components/auth/ProfilePage";
import OAuthCallback from "./components/auth/OAuthCallback";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

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

        {/* Grid — the main spreadsheet view */}
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
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <Grid />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

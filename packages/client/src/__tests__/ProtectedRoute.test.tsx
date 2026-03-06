import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { useAuthStore } from "../stores/authStore";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderProtectedRoute(initialPath = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={<div data-testid="login-page">Login</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it("shows loading state while checking auth", () => {
    // Mock a refresh that never resolves
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderProtectedRoute();

    expect(screen.getByTestId("auth-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });

  it("redirects to /login when user is not authenticated", async () => {
    // Mock refresh failure (401)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 401, message: "No refresh token" },
      }),
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", async () => {
    // Set authenticated state with user
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        avatarUrl: null,
        emailVerified: true,
        createdAt: "2026-01-01",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });

  it("redirects when isAuthenticated is true but user is null", async () => {
    // Simulate inconsistent state: authenticated flag without user data
    useAuthStore.setState({
      user: null,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock refresh failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 401, message: "No refresh token" },
      }),
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("redirects when refresh returns empty data", async () => {
    // Mock refresh returning success but with no valid data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {},
      }),
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});

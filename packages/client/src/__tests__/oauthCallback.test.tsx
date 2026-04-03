import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OAuthCallback from "../components/auth/OAuthCallback";
import { useAuthStore } from "../stores/authStore";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderOAuthCallback(search = "?token=oauth-token-123") {
  return render(
    <MemoryRouter initialEntries={[`/oauth/callback${search}`]}>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OAuthCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it("shows 'Completing sign in...' loading state", () => {
    // Mock refresh that doesn't resolve immediately
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderOAuthCallback();

    expect(screen.getByTestId("oauth-callback")).toBeInTheDocument();
    expect(screen.getByText("Completing sign in...")).toBeInTheDocument();
  });

  it("calls refreshToken and navigates to / on successful token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user-oauth",
            email: "oauth@example.com",
            name: "OAuth User",
            avatarUrl: null,
            emailVerified: true,
            createdAt: "2026-01-01",
          },
          accessToken: "new-access-token",
        },
      }),
    });

    renderOAuthCallback("?token=valid-oauth-token");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    // Verify token was set and refresh was called
    expect(mockFetch).toHaveBeenCalled();
  });

  it("navigates to /login when no token is present", async () => {
    renderOAuthCallback("");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("navigates to /login when token param is empty", async () => {
    renderOAuthCallback("?token=");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});

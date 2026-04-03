import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../components/auth/LoginPage";
import { useAuthStore } from "../stores/authStore";

// Track navigations
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it("renders the login form with all required elements", () => {
    renderLoginPage();

    expect(screen.getByTestId("login-title")).toHaveTextContent("Welcome back");
    expect(screen.getByTestId("login-email")).toBeInTheDocument();
    expect(screen.getByTestId("login-password")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit")).toBeInTheDocument();
    expect(screen.getByTestId("login-google")).toBeInTheDocument();
    expect(screen.getByTestId("login-forgot-link")).toBeInTheDocument();
    expect(screen.getByTestId("login-register-link")).toBeInTheDocument();
  });

  it("submit button shows 'Sign in' by default", () => {
    renderLoginPage();
    expect(screen.getByTestId("login-submit")).toHaveTextContent("Sign in");
  });

  it("navigates to /dashboard on successful login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test",
            avatarUrl: null,
            emailVerified: true,
            createdAt: "2026-01-01",
          },
          accessToken: "token-123",
        },
      }),
    });

    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("login-email"), "test@example.com");
    await user.type(screen.getByTestId("login-password"), "password123");
    await user.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays error message on failed login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 401, message: "Invalid email or password" },
      }),
    });

    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("login-email"), "test@example.com");
    await user.type(screen.getByTestId("login-password"), "wrongpass");
    await user.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toHaveTextContent(
        "Invalid email or password",
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows 'Signing in...' while loading", async () => {
    // Mock a fetch that never resolves
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("login-email"), "test@example.com");
    await user.type(screen.getByTestId("login-password"), "password123");
    await user.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("login-submit")).toHaveTextContent(
        "Signing in...",
      );
    });
  });

  it("password field toggles visibility", async () => {
    renderLoginPage();
    const user = userEvent.setup();

    const passwordInput = screen.getByTestId("login-password");
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click the toggle button (sibling of the input)
    const toggleButton = passwordInput.parentElement?.querySelector(
      "button",
    ) as HTMLButtonElement;
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    // Toggle back
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("forgot password link points to /forgot-password", () => {
    renderLoginPage();
    const link = screen.getByTestId("login-forgot-link");
    expect(link).toHaveAttribute("href", "/forgot-password");
  });

  it("register link points to /register", () => {
    renderLoginPage();
    const link = screen.getByTestId("login-register-link");
    expect(link).toHaveAttribute("href", "/register");
  });

  it("clears error when error message is clicked", async () => {
    // Set error state
    useAuthStore.setState({ error: "Some login error" });

    renderLoginPage();
    const user = userEvent.setup();

    const errorDiv = screen.getByTestId("login-error");
    expect(errorDiv).toBeInTheDocument();

    await user.click(errorDiv);

    await waitFor(() => {
      expect(screen.queryByTestId("login-error")).not.toBeInTheDocument();
    });
  });
});

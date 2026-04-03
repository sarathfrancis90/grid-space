import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../components/auth/RegisterPage";
import { useAuthStore } from "../stores/authStore";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it("renders the registration form with all required elements", () => {
    renderRegisterPage();

    expect(screen.getByTestId("register-title")).toHaveTextContent(
      "Create your account",
    );
    expect(screen.getByTestId("register-name")).toBeInTheDocument();
    expect(screen.getByTestId("register-email")).toBeInTheDocument();
    expect(screen.getByTestId("register-password")).toBeInTheDocument();
    expect(screen.getByTestId("register-submit")).toBeInTheDocument();
    expect(screen.getByTestId("register-google")).toBeInTheDocument();
    expect(screen.getByTestId("register-login-link")).toBeInTheDocument();
  });

  it("submit button shows 'Create account' by default", () => {
    renderRegisterPage();
    expect(screen.getByTestId("register-submit")).toHaveTextContent(
      "Create account",
    );
  });

  it("navigates to /dashboard on successful registration", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user-2",
            email: "new@example.com",
            name: "New User",
            avatarUrl: null,
            emailVerified: false,
            createdAt: "2026-01-01",
          },
          accessToken: "token-456",
        },
      }),
    });

    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("register-name"), "New User");
    await user.type(screen.getByTestId("register-email"), "new@example.com");
    await user.type(screen.getByTestId("register-password"), "Password1!");
    await user.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays error on failed registration", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: { code: 409, message: "Email already in use" },
      }),
    });

    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("register-email"), "taken@example.com");
    await user.type(screen.getByTestId("register-password"), "Password1!");
    await user.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("register-error")).toHaveTextContent(
        "Email already in use",
      );
    });
  });

  it("shows password strength indicator when typing password", async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    // No strength indicator initially
    expect(screen.queryByText("Weak")).not.toBeInTheDocument();

    // Type a weak password
    await user.type(screen.getByTestId("register-password"), "short");
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("shows 'Strong' for a complex password", async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByTestId("register-password"),
      "MyStr0ng!Pass123",
    );
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("shows 'Creating account...' while loading", async () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("register-email"), "new@example.com");
    await user.type(screen.getByTestId("register-password"), "Password1!");
    await user.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("register-submit")).toHaveTextContent(
        "Creating account...",
      );
    });
  });

  it("password field toggles visibility", async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    const passwordInput = screen.getByTestId("register-password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = passwordInput.parentElement?.querySelector(
      "button",
    ) as HTMLButtonElement;
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("login link points to /login", () => {
    renderRegisterPage();
    const link = screen.getByTestId("register-login-link");
    expect(link).toHaveAttribute("href", "/login");
  });

  it("name field is optional — registers without name", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user-3",
            email: "noname@example.com",
            name: null,
            avatarUrl: null,
            emailVerified: false,
            createdAt: "2026-01-01",
          },
          accessToken: "token-789",
        },
      }),
    });

    renderRegisterPage();
    const user = userEvent.setup();

    // Skip name field
    await user.type(screen.getByTestId("register-email"), "noname@example.com");
    await user.type(screen.getByTestId("register-password"), "Password1!");
    await user.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("clears error when error message is clicked", async () => {
    useAuthStore.setState({ error: "Some registration error" });

    renderRegisterPage();
    const user = userEvent.setup();

    const errorDiv = screen.getByTestId("register-error");
    expect(errorDiv).toBeInTheDocument();

    await user.click(errorDiv);

    await waitFor(() => {
      expect(screen.queryByTestId("register-error")).not.toBeInTheDocument();
    });
  });
});

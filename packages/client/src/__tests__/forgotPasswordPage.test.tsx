import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../components/auth/ForgotPasswordPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { post: vi.fn() },
}));

const mockPost = vi.mocked(api.post);

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title with 'Forgot' text", () => {
    renderPage();
    const title = screen.getByTestId("forgot-title");
    expect(title).toBeInTheDocument();
    expect(title.textContent).toContain("Forgot");
  });

  it("renders email input field", () => {
    renderPage();
    expect(screen.getByTestId("forgot-email")).toBeInTheDocument();
  });

  it("renders submit button with correct text", () => {
    renderPage();
    const button = screen.getByTestId("forgot-submit");
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("Send reset link");
  });

  it("renders sign in link", () => {
    renderPage();
    const link = screen.getByTestId("forgot-login-link");
    expect(link).toBeInTheDocument();
    expect(link.textContent).toBe("Sign in");
  });

  it("shows success message after successful form submission", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("forgot-email"), "user@example.com");
    await user.click(screen.getByTestId("forgot-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-success")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/we've sent a password reset link/i),
    ).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "user@example.com",
    });
  });

  it("shows error message on failed submission", async () => {
    mockPost.mockRejectedValueOnce(new Error("Server error"));

    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("forgot-email"), "user@example.com");
    await user.click(screen.getByTestId("forgot-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-error")).toHaveTextContent(
        "Server error",
      );
    });
  });

  it("shows 'Sending...' while loading", async () => {
    mockPost.mockReturnValueOnce(new Promise(() => {}));

    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("forgot-email"), "user@example.com");
    await user.click(screen.getByTestId("forgot-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-submit")).toHaveTextContent(
        "Sending...",
      );
    });
  });

  it("hides the form after successful submission", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId("forgot-email"), "user@example.com");
    await user.click(screen.getByTestId("forgot-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-success")).toBeInTheDocument();
    });

    // Form elements should be gone
    expect(screen.queryByTestId("forgot-email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("forgot-submit")).not.toBeInTheDocument();
  });
});

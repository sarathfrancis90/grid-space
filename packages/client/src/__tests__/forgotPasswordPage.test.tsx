import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../components/auth/ForgotPasswordPage";

vi.mock("../services/api", () => ({
  api: { post: vi.fn() },
}));

describe("ForgotPasswordPage", () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
  }

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
});

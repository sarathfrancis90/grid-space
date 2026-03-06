import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../components/auth/ForgotPasswordPage";

vi.mock("../services/api", () => ({
  api: {
    post: vi.fn().mockResolvedValue({}),
  },
}));

describe("ForgotPasswordPage", () => {
  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
  }

  it("renders the title with 'Forgot Password'", () => {
    renderPage();
    const title = screen.getByTestId("forgot-title");
    expect(title).toBeInTheDocument();
    expect(title.textContent).toBe("Forgot Password");
  });

  it("contains the word 'Forgot' in visible text", () => {
    renderPage();
    expect(screen.getByText(/Forgot/)).toBeInTheDocument();
  });

  it("renders the email input field", () => {
    renderPage();
    expect(screen.getByTestId("forgot-email")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    renderPage();
    const button = screen.getByTestId("forgot-submit");
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("Send reset link");
  });

  it("renders the sign-in link", () => {
    renderPage();
    expect(screen.getByTestId("forgot-login-link")).toBeInTheDocument();
  });
});

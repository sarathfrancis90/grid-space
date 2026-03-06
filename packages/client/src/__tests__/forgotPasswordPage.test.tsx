import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../components/auth/ForgotPasswordPage";

describe("ForgotPasswordPage", () => {
  it("renders the page with 'Forgot' in the title", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    const title = screen.getByTestId("forgot-title");
    expect(title).toBeInTheDocument();
    expect(title.textContent).toContain("Forgot");
  });

  it("renders email input and submit button", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("forgot-email")).toBeInTheDocument();
    expect(screen.getByTestId("forgot-submit")).toBeInTheDocument();
  });

  it("renders sign in link", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("forgot-login-link")).toBeInTheDocument();
  });
});

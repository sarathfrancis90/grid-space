import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Grid } from "../components/grid";
import { App } from "../App";

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    // Unauthenticated users see the loading or login page
    expect(document.body).toBeTruthy();
  });

  it("shows auth loading or login when not authenticated", async () => {
    render(<App />);
    // ProtectedRoute will show loading first, then redirect to login
    const loading = screen.queryByTestId("auth-loading");
    const loginForm = screen.queryByTestId("login-form");
    expect(loading || loginForm).toBeTruthy();
  });
});

describe("Grid component", () => {
  it("renders the grid container", () => {
    render(
      <MemoryRouter>
        <Grid />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("grid-container")).toBeInTheDocument();
  });

  it("renders the grid canvas", () => {
    render(
      <MemoryRouter>
        <Grid />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("grid-canvas")).toBeInTheDocument();
  });

  it("renders the scroll container", () => {
    render(
      <MemoryRouter>
        <Grid />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("grid-scroll-container")).toBeInTheDocument();
  });
});

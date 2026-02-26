import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Grid } from "../components/grid";
import { App } from "../App";

describe("App", () => {
  it("renders without crashing", async () => {
    render(<App />);
    // Wait for ProtectedRoute's async auth check to settle
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it("shows auth loading or login when not authenticated", async () => {
    render(<App />);
    // ProtectedRoute shows loading first, then redirects to login after auth check
    await waitFor(() => {
      const loading = screen.queryByTestId("auth-loading");
      const loginTitle = screen.queryByTestId("login-title");
      expect(loading || loginTitle).toBeTruthy();
    });
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

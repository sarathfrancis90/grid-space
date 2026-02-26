import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../App";

describe("App", () => {
  it("renders the grid container", () => {
    render(<App />);
    expect(screen.getByTestId("grid-container")).toBeInTheDocument();
  });

  it("renders the grid canvas", () => {
    render(<App />);
    expect(screen.getByTestId("grid-canvas")).toBeInTheDocument();
  });

  it("renders the scroll container", () => {
    render(<App />);
    expect(screen.getByTestId("grid-scroll-container")).toBeInTheDocument();
  });
});

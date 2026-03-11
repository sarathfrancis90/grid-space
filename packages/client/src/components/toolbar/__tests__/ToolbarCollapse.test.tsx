import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "../Toolbar";
import { useUIStore } from "../../../stores/uiStore";

describe("Toolbar collapse chevron", () => {
  beforeEach(() => {
    useUIStore.setState({ isToolbarCollapsed: false });
  });

  it("renders the collapse button", () => {
    render(<Toolbar />);
    expect(screen.getByTestId("toolbar-collapse-button")).toBeTruthy();
  });

  it("sets isToolbarCollapsed to true when clicked", () => {
    render(<Toolbar />);
    fireEvent.click(screen.getByTestId("toolbar-collapse-button"));
    expect(useUIStore.getState().isToolbarCollapsed).toBe(true);
  });
});

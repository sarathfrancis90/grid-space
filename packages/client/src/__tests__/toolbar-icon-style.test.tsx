import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toolbar } from "../components/toolbar/Toolbar";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

function renderToolbar() {
  return render(
    <MemoryRouter>
      <Toolbar />
    </MemoryRouter>,
  );
}

describe("Toolbar — Google Sheets icon style parity", () => {
  beforeEach(() => {
    useUIStore.setState({
      isCommandPaletteOpen: false,
      isPrintDialogOpen: false,
      isHyperlinkDialogOpen: false,
    });
    useSpreadsheetStore.setState({ activeSheetId: "sheet-1" });
  });

  it("icon buttons have 36px (h-9) touch targets", () => {
    renderToolbar();
    const iconButtons = [
      "undo-button",
      "redo-button",
      "print-button",
      "bold-button",
      "italic-button",
      "underline-button",
      "strikethrough-button",
      "merge-cells-button",
      "insert-link-button",
      "insert-comment-button",
      "insert-chart-button",
      "filter-button",
    ];

    for (const testId of iconButtons) {
      const btn = screen.getByTestId(testId);
      expect(btn.className).toContain("h-9");
    }
  });

  it("icon buttons have gray-600 text color", () => {
    renderToolbar();
    const iconButtons = [
      "undo-button",
      "redo-button",
      "print-button",
      "merge-cells-button",
      "insert-link-button",
      "insert-comment-button",
      "insert-chart-button",
    ];

    for (const testId of iconButtons) {
      const btn = screen.getByTestId(testId);
      expect(btn.className).toContain("text-gray-600");
    }
  });

  it("icon buttons have hover:bg-gray-100 hover state", () => {
    renderToolbar();
    const btn = screen.getByTestId("undo-button");
    expect(btn.className).toContain("hover:bg-gray-100");
  });

  it("SVG icons use 20px size", () => {
    renderToolbar();
    const undoBtn = screen.getByTestId("undo-button");
    const svg = undoBtn.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
  });

  it("SVG icons use thin stroke (1.5) for outlined look", () => {
    renderToolbar();
    const undoBtn = screen.getByTestId("undo-button");
    const svg = undoBtn.querySelector("svg");
    expect(svg?.getAttribute("stroke-width")).toBe("1.5");
  });

  it("borders button has a dropdown arrow indicator", () => {
    renderToolbar();
    const bordersBtn = screen.getByTestId("borders-button");
    const svgs = bordersBtn.querySelectorAll("svg");
    // Main icon + dropdown arrow = 2 SVGs
    expect(svgs.length).toBe(2);
  });

  it("functions button has a dropdown arrow indicator", () => {
    renderToolbar();
    const funcBtn = screen.getByTestId("functions-button");
    const svgs = funcBtn.querySelectorAll("svg");
    // Main icon + dropdown arrow = 2 SVGs
    expect(svgs.length).toBe(2);
  });

  it("toolbar has thin dividers between button groups", () => {
    renderToolbar();
    const toolbar = screen.getByTestId("toolbar");
    const dividers = toolbar.querySelectorAll(".bg-gray-300.w-px");
    // Multiple dividers should exist between button groups
    expect(dividers.length).toBeGreaterThanOrEqual(5);
  });
});

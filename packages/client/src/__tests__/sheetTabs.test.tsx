import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SheetTabs } from "../components/sheets/SheetTabs";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

function makeSheet(id: string, name: string) {
  return {
    id,
    name,
    cells: new Map(),
    columnWidths: new Map(),
    rowHeights: new Map(),
    frozenRows: 0,
    frozenCols: 0,
    hiddenRows: new Set(),
    hiddenCols: new Set(),
  };
}

function renderSheetTabs() {
  return render(
    <MemoryRouter>
      <SheetTabs />
    </MemoryRouter>,
  );
}

describe("SheetTabs", () => {
  beforeEach(() => {
    useSpreadsheetStore.setState({
      id: "spreadsheet-1",
      title: "Untitled Spreadsheet",
      sheets: [
        makeSheet("sheet-1", "Sheet 1"),
        makeSheet("sheet-2", "Sheet 2"),
        makeSheet("sheet-3", "Sheet 3"),
      ],
      activeSheetId: "sheet-1",
    });
  });

  it("renders the all sheets hamburger button", () => {
    renderSheetTabs();
    expect(screen.getByTestId("all-sheets-btn")).toBeInTheDocument();
  });

  it("opens all sheets menu and lists all sheets", () => {
    renderSheetTabs();
    fireEvent.click(screen.getByTestId("all-sheets-btn"));
    expect(screen.getByTestId("all-sheets-menu")).toBeInTheDocument();
    expect(screen.getByTestId("all-sheets-item-sheet-1")).toBeInTheDocument();
    expect(screen.getByTestId("all-sheets-item-sheet-2")).toBeInTheDocument();
    expect(screen.getByTestId("all-sheets-item-sheet-3")).toBeInTheDocument();
  });

  it("highlights the active sheet in all sheets menu", () => {
    renderSheetTabs();
    fireEvent.click(screen.getByTestId("all-sheets-btn"));
    const activeItem = screen.getByTestId("all-sheets-item-sheet-1");
    expect(activeItem.className).toContain("font-medium");
  });

  it("navigates to a sheet when clicking in all sheets menu", () => {
    renderSheetTabs();
    fireEvent.click(screen.getByTestId("all-sheets-btn"));
    fireEvent.click(screen.getByTestId("all-sheets-item-sheet-2"));
    expect(useSpreadsheetStore.getState().activeSheetId).toBe("sheet-2");
    // Menu should close after selection
    expect(screen.queryByTestId("all-sheets-menu")).not.toBeInTheDocument();
  });

  it("renders tab dropdown triangle on each tab", () => {
    renderSheetTabs();
    expect(
      screen.getByTestId("sheet-tab-dropdown-sheet-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("sheet-tab-dropdown-sheet-2"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("sheet-tab-dropdown-sheet-3"),
    ).toBeInTheDocument();
  });

  it("opens context menu when clicking tab dropdown triangle", () => {
    renderSheetTabs();
    fireEvent.click(screen.getByTestId("sheet-tab-dropdown-sheet-2"));
    expect(screen.getByTestId("sheet-context-menu")).toBeInTheDocument();
  });

  it("renders add sheet button", () => {
    renderSheetTabs();
    expect(screen.getByTestId("add-sheet-btn")).toBeInTheDocument();
  });

  it("renders all sheet tabs", () => {
    renderSheetTabs();
    expect(screen.getByTestId("sheet-tab-sheet-1")).toBeInTheDocument();
    expect(screen.getByTestId("sheet-tab-sheet-2")).toBeInTheDocument();
    expect(screen.getByTestId("sheet-tab-sheet-3")).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toolbar } from "../components/toolbar/Toolbar";
import { useUIStore } from "../stores/uiStore";
import { useFilterStore } from "../stores/filterStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

function renderToolbar() {
  return render(
    <MemoryRouter>
      <Toolbar />
    </MemoryRouter>,
  );
}

describe("Toolbar — missing buttons", () => {
  beforeEach(() => {
    // Reset store state
    useUIStore.setState({
      isCommandPaletteOpen: false,
      isPrintDialogOpen: false,
      isHyperlinkDialogOpen: false,
    });
    useSpreadsheetStore.setState({ activeSheetId: "sheet-1" });
  });

  it("renders the Menus search button", () => {
    renderToolbar();
    const btn = screen.getByTestId("menus-search-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Search menus (Alt+/)");
  });

  it("opens command palette when Menus search is clicked", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("menus-search-button"));
    expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
  });

  it("renders the Print button", () => {
    renderToolbar();
    const btn = screen.getByTestId("print-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Print (Ctrl+P)");
  });

  it("opens print dialog when Print is clicked", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("print-button"));
    expect(useUIStore.getState().isPrintDialogOpen).toBe(true);
  });

  it("renders the Zoom controls", () => {
    renderToolbar();
    expect(screen.getByTestId("zoom-controls")).toBeInTheDocument();
  });

  it("renders the Insert Link button", () => {
    renderToolbar();
    const btn = screen.getByTestId("insert-link-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Insert link (Ctrl+K)");
  });

  it("opens hyperlink dialog when Link is clicked", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("insert-link-button"));
    expect(useUIStore.getState().isHyperlinkDialogOpen).toBe(true);
  });

  it("renders the Insert Comment button", () => {
    renderToolbar();
    expect(screen.getByTestId("insert-comment-button")).toBeInTheDocument();
  });

  it("renders the Insert Chart button", () => {
    renderToolbar();
    expect(screen.getByTestId("insert-chart-button")).toBeInTheDocument();
  });

  it("renders the Filter button", () => {
    renderToolbar();
    expect(screen.getByTestId("filter-button")).toBeInTheDocument();
  });

  it("toggles filters when Filter is clicked", () => {
    renderToolbar();
    const before = useFilterStore.getState().isFilterEnabled("sheet-1");
    fireEvent.click(screen.getByTestId("filter-button"));
    const after = useFilterStore.getState().isFilterEnabled("sheet-1");
    expect(after).toBe(!before);
  });

  it("renders the Functions (Sigma) button", () => {
    renderToolbar();
    expect(screen.getByTestId("functions-button")).toBeInTheDocument();
  });

  it("opens functions dropdown when clicked", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("functions-button"));
    expect(screen.getByTestId("functions-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("function-sum")).toBeInTheDocument();
    expect(screen.getByTestId("function-average")).toBeInTheDocument();
    expect(screen.getByTestId("function-count")).toBeInTheDocument();
    expect(screen.getByTestId("function-max")).toBeInTheDocument();
    expect(screen.getByTestId("function-min")).toBeInTheDocument();
  });
});

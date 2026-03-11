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

  it("renders the Currency format button", () => {
    renderToolbar();
    const btn = screen.getByTestId("currency-format-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Format as currency");
    expect(btn.textContent?.trim()).toBe("$");
  });

  it("renders the Percent format button", () => {
    renderToolbar();
    const btn = screen.getByTestId("percent-format-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Format as percent");
    expect(btn.textContent?.trim()).toBe("%");
  });

  it("renders the Decrease decimal quick button", () => {
    renderToolbar();
    const btn = screen.getByTestId("decrease-decimal-button-quick");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Decrease decimal places");
  });

  it("renders the Increase decimal quick button", () => {
    renderToolbar();
    const btn = screen.getByTestId("increase-decimal-button-quick");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Increase decimal places");
  });

  it("positions number format buttons between Zoom and Font controls", () => {
    renderToolbar();
    const toolbar = screen.getByTestId("toolbar");
    const children = Array.from(toolbar.children);

    const zoomIdx = children.findIndex(
      (el) => (el as HTMLElement).dataset?.testid === "zoom-controls",
    );
    const currencyIdx = children.findIndex(
      (el) => (el as HTMLElement).dataset?.testid === "currency-format-button",
    );
    const fontIdx = children.findIndex(
      (el) => (el as HTMLElement).dataset?.testid === "font-family-picker",
    );

    expect(zoomIdx).toBeGreaterThan(-1);
    expect(currencyIdx).toBeGreaterThan(zoomIdx);
    expect(fontIdx).toBeGreaterThan(currencyIdx);
  });
});

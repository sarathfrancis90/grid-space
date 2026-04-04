import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NamedRangesPanel } from "../components/data/NamedRangesPanel";
import { useNamedRangeStore } from "../stores/namedRangeStore";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

describe("NamedRangesPanel", () => {
  beforeEach(() => {
    useNamedRangeStore.setState({ ranges: new Map() });
    useUIStore.setState({ isNamedRangesPanelOpen: true });
    useSpreadsheetStore.setState({ activeSheetId: "sheet-1" });
  });

  it("renders when open", () => {
    render(<NamedRangesPanel />);
    expect(screen.getByTestId("named-ranges-panel")).toBeDefined();
    expect(screen.getByText("Named ranges")).toBeDefined();
  });

  it("does not render when closed", () => {
    useUIStore.setState({ isNamedRangesPanelOpen: false });
    const { container } = render(<NamedRangesPanel />);
    expect(container.innerHTML).toBe("");
  });

  it("shows empty state when no ranges exist", () => {
    render(<NamedRangesPanel />);
    expect(screen.getByTestId("named-ranges-empty")).toBeDefined();
    expect(screen.getByText("No named ranges defined")).toBeDefined();
  });

  it("adds a named range", () => {
    render(<NamedRangesPanel />);
    const nameInput = screen.getByTestId("named-range-name-input");
    const rangeInput = screen.getByTestId("named-range-range-input");
    const addBtn = screen.getByTestId("named-range-add-btn");

    fireEvent.change(nameInput, { target: { value: "TestRange" } });
    fireEvent.change(rangeInput, { target: { value: "A1:C10" } });
    fireEvent.click(addBtn);

    expect(useNamedRangeStore.getState().getRange("TestRange")).toBeDefined();
    expect(screen.getByTestId("named-range-row-TestRange")).toBeDefined();
  });

  it("shows error for empty name", () => {
    render(<NamedRangesPanel />);
    const rangeInput = screen.getByTestId("named-range-range-input");
    const addBtn = screen.getByTestId("named-range-add-btn");

    fireEvent.change(rangeInput, { target: { value: "A1:B5" } });
    fireEvent.click(addBtn);

    expect(screen.getByTestId("named-range-error")).toBeDefined();
    expect(screen.getByText("Name is required")).toBeDefined();
  });

  it("shows error for invalid range format", () => {
    render(<NamedRangesPanel />);
    const nameInput = screen.getByTestId("named-range-name-input");
    const rangeInput = screen.getByTestId("named-range-range-input");
    const addBtn = screen.getByTestId("named-range-add-btn");

    fireEvent.change(nameInput, { target: { value: "MyRange" } });
    fireEvent.change(rangeInput, { target: { value: "invalid" } });
    fireEvent.click(addBtn);

    expect(screen.getByTestId("named-range-error")).toBeDefined();
  });

  it("shows error for duplicate name", () => {
    useNamedRangeStore.getState().addRange({
      name: "Existing",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 5,
      endCol: 5,
    });

    render(<NamedRangesPanel />);
    const nameInput = screen.getByTestId("named-range-name-input");
    const rangeInput = screen.getByTestId("named-range-range-input");
    const addBtn = screen.getByTestId("named-range-add-btn");

    fireEvent.change(nameInput, { target: { value: "Existing" } });
    fireEvent.change(rangeInput, { target: { value: "A1:B5" } });
    fireEvent.click(addBtn);

    expect(screen.getByText("Name already exists")).toBeDefined();
  });

  it("deletes a named range", () => {
    useNamedRangeStore.getState().addRange({
      name: "ToDelete",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 5,
      endCol: 5,
    });

    render(<NamedRangesPanel />);
    expect(screen.getByTestId("named-range-row-ToDelete")).toBeDefined();

    fireEvent.click(screen.getByTestId("named-range-delete-ToDelete"));
    expect(useNamedRangeStore.getState().getRange("ToDelete")).toBeUndefined();
  });

  it("displays existing named ranges", () => {
    useNamedRangeStore.getState().addRange({
      name: "Sales",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 9,
      endCol: 2,
    });

    render(<NamedRangesPanel />);
    expect(screen.getByTestId("named-range-row-Sales")).toBeDefined();
    expect(screen.getByText("Sales")).toBeDefined();
    expect(screen.getByText("A1:C10")).toBeDefined();
  });

  it("jumps to range on click", () => {
    useNamedRangeStore.getState().addRange({
      name: "Target",
      sheetId: "sheet-1",
      startRow: 5,
      startCol: 2,
      endRow: 10,
      endCol: 4,
    });

    render(<NamedRangesPanel />);
    fireEvent.click(screen.getByTestId("named-range-jump-Target"));

    const selectedCell = useUIStore.getState().selectedCell;
    expect(selectedCell).toEqual({ row: 5, col: 2 });
  });

  it("closes panel when close button clicked", () => {
    render(<NamedRangesPanel />);
    fireEvent.click(screen.getByTestId("named-ranges-close"));
    expect(useUIStore.getState().isNamedRangesPanelOpen).toBe(false);
  });

  it("opens edit mode and saves changes", () => {
    useNamedRangeStore.getState().addRange({
      name: "EditMe",
      sheetId: "sheet-1",
      startRow: 0,
      startCol: 0,
      endRow: 5,
      endCol: 5,
    });

    render(<NamedRangesPanel />);
    fireEvent.click(screen.getByTestId("named-range-edit-EditMe"));

    const rangeInput = screen.getByTestId("named-range-edit-range");
    fireEvent.change(rangeInput, { target: { value: "A1:J20" } });
    fireEvent.click(screen.getByTestId("named-range-save-edit"));

    const updated = useNamedRangeStore.getState().getRange("EditMe");
    expect(updated?.endRow).toBe(19);
    expect(updated?.endCol).toBe(9);
  });
});

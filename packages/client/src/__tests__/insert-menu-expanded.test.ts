/**
 * Tests for expanded Insert menu items:
 * Function, Sparkline, Drawing, Pivot table, Slicer
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

const SHEET_ID = "sheet-1";

function resetStores() {
  useUIStore.setState({
    selectedCell: null,
    selections: [],
    isEditing: false,
    editValue: "",
    editingCell: null,
    isFunctionPickerOpen: false,
    isDrawingDialogOpen: false,
    isSlicerDialogOpen: false,
  });
  useCellStore.setState({ cells: new Map() });
  useCellStore.getState().ensureSheet(SHEET_ID);
  useSpreadsheetStore.setState({ activeSheetId: SHEET_ID });
}

describe("Insert menu — Function", () => {
  beforeEach(resetStores);

  it("opens the function picker dialog", () => {
    expect(useUIStore.getState().isFunctionPickerOpen).toBe(false);
    useUIStore.getState().setFunctionPickerOpen(true);
    expect(useUIStore.getState().isFunctionPickerOpen).toBe(true);
  });
});

describe("Insert menu — Sparkline", () => {
  beforeEach(resetStores);

  it("inserts SPARKLINE formula into the selected cell and starts editing", () => {
    const sel = { row: 2, col: 3 };
    useUIStore.getState().setSelectedCell(sel);

    // Simulate the Sparkline menu action
    const sid = useSpreadsheetStore.getState().activeSheetId;
    useCellStore.getState().setCell(sid, sel.row, sel.col, {
      value: "=SPARKLINE()",
      formula: "=SPARKLINE()",
    });
    useUIStore.getState().startEditing(sel, "=SPARKLINE()");

    const cell = useCellStore.getState().getCell(sid, sel.row, sel.col);
    expect(cell?.formula).toBe("=SPARKLINE()");

    const ui = useUIStore.getState();
    expect(ui.isEditing).toBe(true);
    expect(ui.editValue).toBe("=SPARKLINE()");
    expect(ui.isFormulaMode).toBe(true);
  });
});

describe("Insert menu — Drawing", () => {
  beforeEach(resetStores);

  it("opens the drawing dialog", () => {
    expect(useUIStore.getState().isDrawingDialogOpen).toBe(false);
    useUIStore.getState().setDrawingDialogOpen(true);
    expect(useUIStore.getState().isDrawingDialogOpen).toBe(true);
  });

  it("closes the drawing dialog", () => {
    useUIStore.getState().setDrawingDialogOpen(true);
    useUIStore.getState().setDrawingDialogOpen(false);
    expect(useUIStore.getState().isDrawingDialogOpen).toBe(false);
  });
});

describe("Insert menu — Slicer", () => {
  beforeEach(resetStores);

  it("opens the slicer dialog", () => {
    expect(useUIStore.getState().isSlicerDialogOpen).toBe(false);
    useUIStore.getState().setSlicerDialogOpen(true);
    expect(useUIStore.getState().isSlicerDialogOpen).toBe(true);
  });
});

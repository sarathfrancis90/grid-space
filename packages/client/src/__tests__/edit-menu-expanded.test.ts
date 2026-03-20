/**
 * Tests for expanded Edit menu items:
 * Paste special (values, format, transpose), Select all, Delete values/row/column,
 * Move row/column
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useGridStore } from "../stores/gridStore";
import { useHistoryStore } from "../stores/historyStore";
import { useClipboardStore } from "../stores/clipboardStore";

const SHEET_ID = "sheet-1";

function resetStores() {
  useUIStore.setState({
    selectedCell: null,
    selections: [],
    isEditing: false,
    editValue: "",
    editingCell: null,
  });
  useCellStore.setState({ cells: new Map() });
  useCellStore.getState().ensureSheet(SHEET_ID);
  useSpreadsheetStore.setState({ activeSheetId: SHEET_ID });
  useGridStore.setState({ totalRows: 100, totalCols: 26 });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
  useClipboardStore.setState({
    mode: null,
    cells: new Map(),
    sourceRange: null,
  });
}

describe("Edit menu — Delete values", () => {
  beforeEach(resetStores);

  it("clears cell values in the selected range", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Hello" });
    cs.setCell(SHEET_ID, 0, 1, { value: "World" });
    cs.setCell(SHEET_ID, 1, 0, { value: "Foo" });

    useUIStore
      .getState()
      .setSelections([{ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } }]);

    // Simulate the Delete values action (now uses clearValues)
    const ui = useUIStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;
    if (ui.selections.length > 0) {
      const sel = ui.selections[ui.selections.length - 1];
      useHistoryStore.getState().pushUndo();
      useCellStore
        .getState()
        .clearValues(
          sid,
          Math.min(sel.start.row, sel.end.row),
          Math.min(sel.start.col, sel.end.col),
          Math.max(sel.start.row, sel.end.row),
          Math.max(sel.start.col, sel.end.col),
        );
    }

    // Cells without formatting should be fully removed
    expect(useCellStore.getState().getCell(SHEET_ID, 0, 0)).toBeUndefined();
    expect(useCellStore.getState().getCell(SHEET_ID, 0, 1)).toBeUndefined();
    expect(useCellStore.getState().getCell(SHEET_ID, 1, 0)).toBeUndefined();
  });

  it("preserves formatting when clearing values", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, {
      value: "Hello",
      format: { bold: true, backgroundColor: "#ff0000" },
    });
    cs.setCell(SHEET_ID, 0, 1, {
      value: 42,
      formula: "=SUM(A1:A10)",
      format: { italic: true },
    });

    useCellStore.getState().clearValues(SHEET_ID, 0, 0, 0, 1);

    // Cell should still exist with format preserved but value cleared
    const cell00 = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    expect(cell00).toBeDefined();
    expect(cell00?.value).toBeNull();
    expect(cell00?.format?.bold).toBe(true);
    expect(cell00?.format?.backgroundColor).toBe("#ff0000");
    expect(cell00?.formula).toBeUndefined();

    const cell01 = useCellStore.getState().getCell(SHEET_ID, 0, 1);
    expect(cell01).toBeDefined();
    expect(cell01?.value).toBeNull();
    expect(cell01?.format?.italic).toBe(true);
    expect(cell01?.formula).toBeUndefined();
  });
});

describe("Edit menu — Delete row", () => {
  beforeEach(resetStores);

  it("removes the selected row and decrements totalRows", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Row0" });
    cs.setCell(SHEET_ID, 1, 0, { value: "Row1" });
    cs.setCell(SHEET_ID, 2, 0, { value: "Row2" });

    useUIStore.getState().setSelectedCell({ row: 1, col: 0 });

    const sel = useUIStore.getState().selectedCell;
    if (sel) {
      const gs = useGridStore.getState();
      useHistoryStore.getState().pushUndo();
      useCellStore.getState().deleteRows(SHEET_ID, [sel.row], gs.totalRows);
      gs.deleteRowHeights([sel.row]);
      useGridStore.getState().setTotalRows(Math.max(1, gs.totalRows - 1));
    }

    expect(useGridStore.getState().totalRows).toBe(99);
    // Row1 was deleted, so what was Row2 is now at row 1
    const cellAtRow1 = useCellStore.getState().getCell(SHEET_ID, 1, 0);
    expect(cellAtRow1?.value).toBe("Row2");
  });
});

describe("Edit menu — Delete column", () => {
  beforeEach(resetStores);

  it("removes the selected column and decrements totalCols", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Col0" });
    cs.setCell(SHEET_ID, 0, 1, { value: "Col1" });
    cs.setCell(SHEET_ID, 0, 2, { value: "Col2" });

    useUIStore.getState().setSelectedCell({ row: 0, col: 1 });

    const sel = useUIStore.getState().selectedCell;
    if (sel) {
      const gs = useGridStore.getState();
      useHistoryStore.getState().pushUndo();
      useCellStore.getState().deleteCols(SHEET_ID, [sel.col], gs.totalCols);
      gs.deleteColWidths([sel.col]);
      useGridStore.getState().setTotalCols(Math.max(1, gs.totalCols - 1));
    }

    expect(useGridStore.getState().totalCols).toBe(25);
    // Col1 was deleted, so what was Col2 is now at col 1
    const cellAtCol1 = useCellStore.getState().getCell(SHEET_ID, 0, 1);
    expect(cellAtCol1?.value).toBe("Col2");
  });
});

describe("Edit menu — Select all", () => {
  beforeEach(resetStores);

  it("selects the entire grid", () => {
    const gs = useGridStore.getState();
    useUIStore.getState().setSelectedCell({ row: 0, col: 0 });
    useUIStore.getState().setSelections([
      {
        start: { row: 0, col: 0 },
        end: { row: gs.totalRows - 1, col: gs.totalCols - 1 },
      },
    ]);

    const selections = useUIStore.getState().selections;
    expect(selections).toHaveLength(1);
    expect(selections[0].start).toEqual({ row: 0, col: 0 });
    expect(selections[0].end).toEqual({ row: 99, col: 25 });
  });
});

describe("Edit menu — Move row up", () => {
  beforeEach(resetStores);

  it("swaps the selected row with the row above", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Row0" });
    cs.setCell(SHEET_ID, 1, 0, { value: "Row1" });
    cs.setCell(SHEET_ID, 2, 0, { value: "Row2" });

    useUIStore.getState().setSelectedCell({ row: 1, col: 0 });

    const sel = useUIStore.getState().selectedCell;
    if (sel && sel.row > 0) {
      const gs = useGridStore.getState();
      useHistoryStore.getState().pushUndo();
      useCellStore
        .getState()
        .moveRow(SHEET_ID, sel.row, sel.row - 1, gs.totalCols);
      useUIStore.getState().setSelectedCell({ row: sel.row - 1, col: sel.col });
    }

    // Row1 moved up to row 0, Row0 moved down to row 1
    expect(useCellStore.getState().getCell(SHEET_ID, 0, 0)?.value).toBe("Row1");
    expect(useCellStore.getState().getCell(SHEET_ID, 1, 0)?.value).toBe("Row0");
    expect(useCellStore.getState().getCell(SHEET_ID, 2, 0)?.value).toBe("Row2");
    expect(useUIStore.getState().selectedCell).toEqual({ row: 0, col: 0 });
  });

  it("does nothing when at row 0", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Row0" });

    useUIStore.getState().setSelectedCell({ row: 0, col: 0 });

    const sel = useUIStore.getState().selectedCell;
    // Guard: sel.row > 0 prevents action
    if (sel && sel.row > 0) {
      useCellStore.getState().moveRow(SHEET_ID, sel.row, sel.row - 1, 26);
    }

    expect(useCellStore.getState().getCell(SHEET_ID, 0, 0)?.value).toBe("Row0");
  });
});

describe("Edit menu — Move row down", () => {
  beforeEach(resetStores);

  it("swaps the selected row with the row below", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Row0" });
    cs.setCell(SHEET_ID, 1, 0, { value: "Row1" });
    cs.setCell(SHEET_ID, 2, 0, { value: "Row2" });

    useUIStore.getState().setSelectedCell({ row: 1, col: 0 });

    const sel = useUIStore.getState().selectedCell;
    const gs = useGridStore.getState();
    if (sel && sel.row < gs.totalRows - 1) {
      useHistoryStore.getState().pushUndo();
      useCellStore
        .getState()
        .moveRow(SHEET_ID, sel.row, sel.row + 1, gs.totalCols);
      useUIStore.getState().setSelectedCell({ row: sel.row + 1, col: sel.col });
    }

    expect(useCellStore.getState().getCell(SHEET_ID, 0, 0)?.value).toBe("Row0");
    expect(useCellStore.getState().getCell(SHEET_ID, 1, 0)?.value).toBe("Row2");
    expect(useCellStore.getState().getCell(SHEET_ID, 2, 0)?.value).toBe("Row1");
    expect(useUIStore.getState().selectedCell).toEqual({ row: 2, col: 0 });
  });
});

describe("Edit menu — Move column left", () => {
  beforeEach(resetStores);

  it("swaps the selected column with the column to its left", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Col0" });
    cs.setCell(SHEET_ID, 0, 1, { value: "Col1" });
    cs.setCell(SHEET_ID, 0, 2, { value: "Col2" });

    useUIStore.getState().setSelectedCell({ row: 0, col: 1 });

    const sel = useUIStore.getState().selectedCell;
    if (sel && sel.col > 0) {
      const gs = useGridStore.getState();
      useHistoryStore.getState().pushUndo();
      useCellStore
        .getState()
        .moveCol(SHEET_ID, sel.col, sel.col - 1, gs.totalRows);
      useUIStore.getState().setSelectedCell({ row: sel.row, col: sel.col - 1 });
    }

    expect(useCellStore.getState().getCell(SHEET_ID, 0, 0)?.value).toBe("Col1");
    expect(useCellStore.getState().getCell(SHEET_ID, 0, 1)?.value).toBe("Col0");
    expect(useCellStore.getState().getCell(SHEET_ID, 0, 2)?.value).toBe("Col2");
    expect(useUIStore.getState().selectedCell).toEqual({ row: 0, col: 0 });
  });
});

describe("Edit menu — Move column right", () => {
  beforeEach(resetStores);

  it("swaps the selected column with the column to its right", () => {
    const cs = useCellStore.getState();
    cs.setCell(SHEET_ID, 0, 0, { value: "Col0" });
    cs.setCell(SHEET_ID, 0, 1, { value: "Col1" });
    cs.setCell(SHEET_ID, 0, 2, { value: "Col2" });

    useUIStore.getState().setSelectedCell({ row: 0, col: 1 });

    const sel = useUIStore.getState().selectedCell;
    const gs = useGridStore.getState();
    if (sel && sel.col < gs.totalCols - 1) {
      useHistoryStore.getState().pushUndo();
      useCellStore
        .getState()
        .moveCol(SHEET_ID, sel.col, sel.col + 1, gs.totalRows);
      useUIStore.getState().setSelectedCell({ row: sel.row, col: sel.col + 1 });
    }

    expect(useCellStore.getState().getCell(SHEET_ID, 0, 0)?.value).toBe("Col0");
    expect(useCellStore.getState().getCell(SHEET_ID, 0, 1)?.value).toBe("Col2");
    expect(useCellStore.getState().getCell(SHEET_ID, 0, 2)?.value).toBe("Col1");
    expect(useUIStore.getState().selectedCell).toEqual({ row: 0, col: 2 });
  });
});

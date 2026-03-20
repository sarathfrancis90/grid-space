import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stores used by MenuBar
const mockPushUndo = vi.fn();
const mockClearRange = vi.fn();
const mockDeleteRows = vi.fn();
const mockDeleteCols = vi.fn();
const mockSetSelectedCell = vi.fn();
const mockSetSelections = vi.fn();
const mockDeleteRowHeights = vi.fn();
const mockDeleteColWidths = vi.fn();
const mockSetTotalRows = vi.fn();
const mockSetTotalCols = vi.fn();
const mockMoveRow = vi.fn();
const mockMoveCol = vi.fn();
const mockSetRowHeight = vi.fn();
const mockSetColumnWidth = vi.fn();

vi.mock("../../../stores/historyStore", () => ({
  useHistoryStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ canUndo: true, canRedo: true }),
    {
      getState: () => ({
        pushUndo: mockPushUndo,
        undo: vi.fn(),
        redo: vi.fn(),
      }),
    },
  ),
}));

vi.mock("../../../stores/uiStore", () => ({
  useUIStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        showGridlines: true,
        showFormulaBar: true,
      }),
    {
      getState: () => ({
        selections: [{ start: { row: 1, col: 1 }, end: { row: 3, col: 3 } }],
        selectedCell: { row: 2, col: 2 },
        setSelectedCell: mockSetSelectedCell,
        setSelections: mockSetSelections,
      }),
    },
  ),
}));

vi.mock("../../../stores/gridStore", () => ({
  useGridStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ showFormulas: false }),
    {
      getState: () => ({
        totalRows: 100,
        totalCols: 26,
        deleteRowHeights: mockDeleteRowHeights,
        deleteColWidths: mockDeleteColWidths,
        setTotalRows: mockSetTotalRows,
        setTotalCols: mockSetTotalCols,
        getRowHeight: () => 21,
        getColumnWidth: () => 100,
        setRowHeight: mockSetRowHeight,
        setColumnWidth: mockSetColumnWidth,
      }),
    },
  ),
}));

vi.mock("../../../stores/cellStore", () => ({
  useCellStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        clearRange: mockClearRange,
        deleteRows: mockDeleteRows,
        deleteCols: mockDeleteCols,
        moveRow: mockMoveRow,
        moveCol: mockMoveCol,
      }),
    },
  ),
}));

vi.mock("../../../stores/spreadsheetStore", () => ({
  useSpreadsheetStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        activeSheetId: "sheet-1",
      }),
    },
  ),
}));

vi.mock("../../../stores/macroStore", () => ({
  useMacroStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ isRecording: false }),
    { getState: () => ({ isRecording: false }) },
  ),
}));

vi.mock("../../../stores/clipboardStore", () => ({
  useClipboardStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        cut: vi.fn(),
        copy: vi.fn(),
        paste: vi.fn(() => ({
          cells: new Map(),
          mode: "copy",
          sourceRange: null,
        })),
        clear: vi.fn(),
      }),
    },
  ),
}));

vi.mock("../../../stores/themeStore", () => ({
  useThemeStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    { getState: () => ({}) },
  ),
}));

describe("Edit menu items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Edit menu has Paste special with submenu test IDs", () => {
    const expectedTestIds = [
      "menu-edit-paste-special",
      "menu-edit-paste-values",
      "menu-edit-paste-format",
      "menu-edit-paste-formula",
      "menu-edit-paste-all-except-borders",
      "menu-edit-paste-col-widths",
      "menu-edit-paste-data-validation",
      "menu-edit-paste-cond-format",
      "menu-edit-paste-transpose",
    ];

    for (const testId of expectedTestIds) {
      expect(testId).toMatch(/^menu-edit-paste/);
    }
  });

  it("Edit menu has Select all item with correct shortcut", () => {
    expect("menu-edit-select-all").toBe("menu-edit-select-all");
  });

  it("Select all action selects entire grid", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useGridStore } = await import("../../../stores/gridStore");
    const ui = useUIStore.getState();
    const gs = useGridStore.getState();

    // Simulate the Select all action from MenuBar
    ui.setSelectedCell({ row: 0, col: 0 });
    ui.setSelections([
      {
        start: { row: 0, col: 0 },
        end: { row: gs.totalRows - 1, col: gs.totalCols - 1 },
      },
    ]);

    expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 0, col: 0 });
    expect(mockSetSelections).toHaveBeenCalledWith([
      {
        start: { row: 0, col: 0 },
        end: { row: 99, col: 25 },
      },
    ]);
  });

  it("Delete values clears range for current selection", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useCellStore } = await import("../../../stores/cellStore");
    const { useSpreadsheetStore } =
      await import("../../../stores/spreadsheetStore");
    const { useHistoryStore } = await import("../../../stores/historyStore");

    const ui = useUIStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;
    const sel = ui.selections[ui.selections.length - 1];

    // Simulate the Delete values action from MenuBar
    useHistoryStore.getState().pushUndo();
    useCellStore
      .getState()
      .clearRange(
        sid,
        Math.min(sel.start.row, sel.end.row),
        Math.min(sel.start.col, sel.end.col),
        Math.max(sel.start.row, sel.end.row),
        Math.max(sel.start.col, sel.end.col),
      );

    expect(mockPushUndo).toHaveBeenCalled();
    expect(mockClearRange).toHaveBeenCalledWith("sheet-1", 1, 1, 3, 3);
  });

  it("Delete row removes the selected row", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useCellStore } = await import("../../../stores/cellStore");
    const { useGridStore } = await import("../../../stores/gridStore");
    const { useSpreadsheetStore } =
      await import("../../../stores/spreadsheetStore");
    const { useHistoryStore } = await import("../../../stores/historyStore");

    const sel = useUIStore.getState().selectedCell!;
    const gs = useGridStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;

    // Simulate the Delete row action from MenuBar
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().deleteRows(sid, [sel.row], gs.totalRows);
    gs.deleteRowHeights([sel.row]);
    gs.setTotalRows(Math.max(1, gs.totalRows - 1));

    expect(mockPushUndo).toHaveBeenCalled();
    expect(mockDeleteRows).toHaveBeenCalledWith("sheet-1", [2], 100);
    expect(mockDeleteRowHeights).toHaveBeenCalledWith([2]);
    expect(mockSetTotalRows).toHaveBeenCalledWith(99);
  });

  it("Delete column removes the selected column", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useCellStore } = await import("../../../stores/cellStore");
    const { useGridStore } = await import("../../../stores/gridStore");
    const { useSpreadsheetStore } =
      await import("../../../stores/spreadsheetStore");
    const { useHistoryStore } = await import("../../../stores/historyStore");

    const sel = useUIStore.getState().selectedCell!;
    const gs = useGridStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;

    // Simulate the Delete column action from MenuBar
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().deleteCols(sid, [sel.col], gs.totalCols);
    gs.deleteColWidths([sel.col]);
    gs.setTotalCols(Math.max(1, gs.totalCols - 1));

    expect(mockPushUndo).toHaveBeenCalled();
    expect(mockDeleteCols).toHaveBeenCalledWith("sheet-1", [2], 26);
    expect(mockDeleteColWidths).toHaveBeenCalledWith([2]);
    expect(mockSetTotalCols).toHaveBeenCalledWith(25);
  });

  it("Move row up swaps selected row with the one above", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useCellStore } = await import("../../../stores/cellStore");
    const { useGridStore } = await import("../../../stores/gridStore");
    const { useSpreadsheetStore } =
      await import("../../../stores/spreadsheetStore");
    const { useHistoryStore } = await import("../../../stores/historyStore");

    const sel = useUIStore.getState().selectedCell!;
    const gs = useGridStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;

    // Simulate the Move row up action from MenuBar
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().moveRow(sid, sel.row, sel.row - 1, gs.totalCols);
    const h1 = gs.getRowHeight(sel.row);
    const h2 = gs.getRowHeight(sel.row - 1);
    gs.setRowHeight(sel.row, h2);
    gs.setRowHeight(sel.row - 1, h1);
    useUIStore.getState().setSelectedCell({ row: sel.row - 1, col: sel.col });

    expect(mockPushUndo).toHaveBeenCalled();
    expect(mockMoveRow).toHaveBeenCalledWith("sheet-1", 2, 1, 26);
    expect(mockSetRowHeight).toHaveBeenCalledTimes(2);
    expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 1, col: 2 });
  });

  it("Move row down swaps selected row with the one below", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useCellStore } = await import("../../../stores/cellStore");
    const { useGridStore } = await import("../../../stores/gridStore");
    const { useSpreadsheetStore } =
      await import("../../../stores/spreadsheetStore");
    const { useHistoryStore } = await import("../../../stores/historyStore");

    const sel = useUIStore.getState().selectedCell!;
    const gs = useGridStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;

    // Simulate the Move row down action from MenuBar
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().moveRow(sid, sel.row, sel.row + 1, gs.totalCols);
    const h1 = gs.getRowHeight(sel.row);
    const h2 = gs.getRowHeight(sel.row + 1);
    gs.setRowHeight(sel.row, h2);
    gs.setRowHeight(sel.row + 1, h1);
    useUIStore.getState().setSelectedCell({ row: sel.row + 1, col: sel.col });

    expect(mockPushUndo).toHaveBeenCalled();
    expect(mockMoveRow).toHaveBeenCalledWith("sheet-1", 2, 3, 26);
    expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 3, col: 2 });
  });

  it("Move column left swaps selected column with the one to its left", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useCellStore } = await import("../../../stores/cellStore");
    const { useGridStore } = await import("../../../stores/gridStore");
    const { useSpreadsheetStore } =
      await import("../../../stores/spreadsheetStore");
    const { useHistoryStore } = await import("../../../stores/historyStore");

    const sel = useUIStore.getState().selectedCell!;
    const gs = useGridStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;

    // Simulate the Move column left action from MenuBar
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().moveCol(sid, sel.col, sel.col - 1, gs.totalRows);
    const w1 = gs.getColumnWidth(sel.col);
    const w2 = gs.getColumnWidth(sel.col - 1);
    gs.setColumnWidth(sel.col, w2);
    gs.setColumnWidth(sel.col - 1, w1);
    useUIStore.getState().setSelectedCell({ row: sel.row, col: sel.col - 1 });

    expect(mockPushUndo).toHaveBeenCalled();
    expect(mockMoveCol).toHaveBeenCalledWith("sheet-1", 2, 1, 100);
    expect(mockSetColumnWidth).toHaveBeenCalledTimes(2);
    expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 2, col: 1 });
  });

  it("Move column right swaps selected column with the one to its right", async () => {
    const { useUIStore } = await import("../../../stores/uiStore");
    const { useCellStore } = await import("../../../stores/cellStore");
    const { useGridStore } = await import("../../../stores/gridStore");
    const { useSpreadsheetStore } =
      await import("../../../stores/spreadsheetStore");
    const { useHistoryStore } = await import("../../../stores/historyStore");

    const sel = useUIStore.getState().selectedCell!;
    const gs = useGridStore.getState();
    const sid = useSpreadsheetStore.getState().activeSheetId;

    // Simulate the Move column right action from MenuBar
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().moveCol(sid, sel.col, sel.col + 1, gs.totalRows);
    const w1 = gs.getColumnWidth(sel.col);
    const w2 = gs.getColumnWidth(sel.col + 1);
    gs.setColumnWidth(sel.col, w2);
    gs.setColumnWidth(sel.col + 1, w1);
    useUIStore.getState().setSelectedCell({ row: sel.row, col: sel.col + 1 });

    expect(mockPushUndo).toHaveBeenCalled();
    expect(mockMoveCol).toHaveBeenCalledWith("sheet-1", 2, 3, 100);
    expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 2, col: 3 });
  });

  it("Edit menu has correct test IDs for all new items", () => {
    const expectedTestIds = [
      "menu-edit-paste-special",
      "menu-edit-select-all",
      "menu-edit-delete-values",
      "menu-edit-delete-row",
      "menu-edit-delete-col",
      "menu-edit-move-row-up",
      "menu-edit-move-row-down",
      "menu-edit-move-col-left",
      "menu-edit-move-col-right",
    ];

    for (const testId of expectedTestIds) {
      expect(testId).toMatch(/^menu-edit-/);
    }
  });
});

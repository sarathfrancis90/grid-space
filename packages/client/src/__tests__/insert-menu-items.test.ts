/**
 * Tests for Insert menu items: Comment, Checkbox, Dropdown, New sheet
 * Issue #139
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useCommentStore } from "../stores/commentStore";
import { useValidationStore } from "../stores/validationStore";
import { useHistoryStore } from "../stores/historyStore";

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
  useSpreadsheetStore.setState({
    activeSheetId: SHEET_ID,
    sheets: [
      {
        id: SHEET_ID,
        name: "Sheet 1",
        cells: new Map(),
        columnWidths: new Map(),
        rowHeights: new Map(),
        frozenRows: 0,
        frozenCols: 0,
        hiddenRows: new Set(),
        hiddenCols: new Set(),
      },
    ],
  });
  useValidationStore.setState({ rules: new Map() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
  useCommentStore.getState().closePanel();
}

describe("Insert menu — Comment", () => {
  beforeEach(resetStores);

  it("opens the comments sidebar panel", () => {
    expect(useCommentStore.getState().isPanelOpen).toBe(false);
    useCommentStore.getState().openPanel();
    expect(useCommentStore.getState().isPanelOpen).toBe(true);
  });
});

describe("Insert menu — Checkbox", () => {
  beforeEach(resetStores);

  it("inserts a checkbox validation rule and sets cell value to false", () => {
    const sel = { row: 2, col: 3 };
    useUIStore.getState().setSelectedCell(sel);

    // Simulate the Checkbox menu action
    const sid = useSpreadsheetStore.getState().activeSheetId;
    useHistoryStore.getState().pushUndo();
    useValidationStore.getState().setRule(sid, sel.row, sel.col, {
      type: "checkbox",
    });
    useCellStore.getState().setCell(sid, sel.row, sel.col, { value: false });

    // Verify validation rule
    const rule = useValidationStore.getState().getRule(sid, sel.row, sel.col);
    expect(rule).toBeDefined();
    expect(rule?.type).toBe("checkbox");

    // Verify cell value
    const cell = useCellStore.getState().getCell(sid, sel.row, sel.col);
    expect(cell?.value).toBe(false);
  });
});

describe("Insert menu — Dropdown", () => {
  beforeEach(resetStores);

  it("inserts a dropdown-list validation rule with default options", () => {
    const sel = { row: 1, col: 1 };
    useUIStore.getState().setSelectedCell(sel);

    const sid = useSpreadsheetStore.getState().activeSheetId;
    useHistoryStore.getState().pushUndo();
    useValidationStore.getState().setRule(sid, sel.row, sel.col, {
      type: "dropdown-list",
      listValues: ["Option 1", "Option 2", "Option 3"],
    });

    const rule = useValidationStore.getState().getRule(sid, sel.row, sel.col);
    expect(rule).toBeDefined();
    expect(rule?.type).toBe("dropdown-list");
    expect(rule?.listValues).toEqual(["Option 1", "Option 2", "Option 3"]);
  });
});

describe("Insert menu — New sheet", () => {
  beforeEach(resetStores);

  it("adds a new sheet tab", () => {
    const initialCount = useSpreadsheetStore.getState().sheets.length;
    useSpreadsheetStore.getState().addSheet();
    expect(useSpreadsheetStore.getState().sheets.length).toBe(initialCount + 1);
  });
});

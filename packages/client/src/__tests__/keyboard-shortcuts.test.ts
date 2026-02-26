/**
 * Tests for Sprint 8 keyboard shortcuts (S8-001 to S8-010).
 * Validates the store actions that keyboard shortcuts dispatch to.
 * The useKeyboardShortcuts hook maps keydown events → store calls,
 * so we test the store actions directly.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useHistoryStore } from "../stores/historyStore";
import { useClipboardStore } from "../stores/clipboardStore";
import { useFormatStore } from "../stores/formatStore";
import { useFindReplaceStore } from "../stores/findReplaceStore";
import { performPasteSpecial } from "../hooks/useKeyboardShortcuts";

function resetStores(): void {
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  useUIStore.setState({
    selectedCell: { row: 0, col: 0 },
    selections: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }],
    isEditing: false,
    editValue: "",
    editingCell: null,
    zoom: 100,
    isPrintDialogOpen: false,
    isFormatCellsDialogOpen: false,
    isPasteSpecialOpen: false,
    isCommandPaletteOpen: false,
  });
  useCellStore.setState({ cells: new Map() });
  useCellStore.getState().ensureSheet(sheetId);
  useHistoryStore.getState().clear();
  useClipboardStore.getState().clear();
  useFindReplaceStore.getState().close();
}

describe("Sprint 8 — Keyboard Shortcuts", () => {
  beforeEach(resetStores);

  // S8-001: Ctrl+B/I/U formatting
  describe("S8-001: Ctrl+B/I/U formatting", () => {
    it("toggleFormatOnSelection('bold') toggles bold on selected cell", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "test" });
      useHistoryStore.getState().pushUndo();
      useFormatStore.getState().toggleFormatOnSelection("bold");
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.bold).toBe(true);
    });

    it("toggleFormatOnSelection('italic') toggles italic", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "test" });
      useFormatStore.getState().toggleFormatOnSelection("italic");
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.italic).toBe(true);
    });

    it("toggleFormatOnSelection('underline') toggles underline", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "test" });
      useFormatStore.getState().toggleFormatOnSelection("underline");
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.underline).toBe(true);
    });

    it("double toggle turns bold off", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "test" });
      useFormatStore.getState().toggleFormatOnSelection("bold");
      useFormatStore.getState().toggleFormatOnSelection("bold");
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.bold).toBe(false);
    });
  });

  // S8-002: Ctrl+Z/Y undo/redo
  describe("S8-002: Ctrl+Z/Y undo/redo", () => {
    it("undo restores previous state", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "original" });
      useHistoryStore.getState().pushUndo();
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "modified" });
      useHistoryStore.getState().undo();
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.value).toBe("original");
    });

    it("redo restores undone state", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "original" });
      useHistoryStore.getState().pushUndo();
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "modified" });
      useHistoryStore.getState().undo();
      useHistoryStore.getState().redo();
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.value).toBe("modified");
    });

    it("canUndo/canRedo reflect stack state", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "v1" });
      useHistoryStore.getState().pushUndo();
      expect(useHistoryStore.getState().canUndo()).toBe(true);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });
  });

  // S8-003: Ctrl+C/V/X copy/paste/cut
  describe("S8-003: Ctrl+C/V/X copy/paste/cut", () => {
    it("copy stores cells in clipboard", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "hello" });
      const cells = useCellStore
        .getState()
        .getCellsInRangeWithKeys(sheetId, 0, 0, 0, 0);
      const range = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
      useClipboardStore.getState().copy(cells, range);
      expect(useClipboardStore.getState().mode).toBe("copy");
      expect(useClipboardStore.getState().cells.size).toBe(1);
    });

    it("cut sets mode to cut", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "hello" });
      const cells = useCellStore
        .getState()
        .getCellsInRangeWithKeys(sheetId, 0, 0, 0, 0);
      const range = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
      useClipboardStore.getState().cut(cells, range);
      expect(useClipboardStore.getState().mode).toBe("cut");
    });

    it("paste places cells at target position", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "source" });
      const cells = useCellStore
        .getState()
        .getCellsInRangeWithKeys(sheetId, 0, 0, 0, 0);
      const range = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
      useClipboardStore.getState().copy(cells, range);
      const result = useClipboardStore.getState().paste({ row: 1, col: 0 });
      expect(result.cells.size).toBe(1);
      // Apply paste result
      for (const [key, data] of result.cells) {
        const [r, c] = key.split(",").map(Number);
        useCellStore.getState().setCell(sheetId, r, c, data);
      }
      const pasted = useCellStore.getState().getCell(sheetId, 1, 0);
      expect(pasted?.value).toBe("source");
    });
  });

  // S8-004: Ctrl+Shift+V paste special
  describe("S8-004: Ctrl+Shift+V paste special", () => {
    it("values-only pastes values without formatting", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, {
        value: "source",
        format: { bold: true },
      });
      const cells = useCellStore
        .getState()
        .getCellsInRangeWithKeys(sheetId, 0, 0, 0, 0);
      const range = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
      useClipboardStore.getState().copy(cells, range);
      useUIStore.getState().setSelectedCell({ row: 1, col: 0 });
      performPasteSpecial("values");
      const pasted = useCellStore.getState().getCell(sheetId, 1, 0);
      expect(pasted?.value).toBe("source");
      expect(pasted?.format?.bold).toBeUndefined();
    });

    it("format-only pastes format without values", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, {
        value: "source",
        format: { bold: true },
      });
      useCellStore.getState().setCell(sheetId, 1, 0, { value: "target" });
      const cells = useCellStore
        .getState()
        .getCellsInRangeWithKeys(sheetId, 0, 0, 0, 0);
      const range = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
      useClipboardStore.getState().copy(cells, range);
      useUIStore.getState().setSelectedCell({ row: 1, col: 0 });
      performPasteSpecial("format");
      const pasted = useCellStore.getState().getCell(sheetId, 1, 0);
      expect(pasted?.value).toBe("target");
      expect(pasted?.format?.bold).toBe(true);
    });
  });

  // S8-005: Ctrl+F/H find and replace
  describe("S8-005: Ctrl+F find, Ctrl+H replace", () => {
    it("open(false) opens find dialog", () => {
      useFindReplaceStore.getState().open(false);
      expect(useFindReplaceStore.getState().isOpen).toBe(true);
      expect(useFindReplaceStore.getState().showReplace).toBe(false);
    });

    it("open(true) opens replace dialog", () => {
      useFindReplaceStore.getState().open(true);
      expect(useFindReplaceStore.getState().isOpen).toBe(true);
      expect(useFindReplaceStore.getState().showReplace).toBe(true);
    });
  });

  // S8-006: Ctrl+; insert date
  describe("S8-006: Ctrl+; insert current date", () => {
    it("inserts today's date in M/D/YYYY format", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      const pos = useUIStore.getState().selectedCell;
      expect(pos).not.toBeNull();
      useHistoryStore.getState().pushUndo();
      const today = new Date();
      const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
      useCellStore
        .getState()
        .setCell(sheetId, pos!.row, pos!.col, { value: dateStr });
      const cell = useCellStore.getState().getCell(sheetId, pos!.row, pos!.col);
      expect(cell?.value).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });
  });

  // S8-007: Alt+Enter newline
  describe("S8-007: Alt+Enter newline in cell", () => {
    it("appends newline to edit value", () => {
      useUIStore.getState().startEditing({ row: 0, col: 0 }, "line1");
      const current = useUIStore.getState().editValue;
      useUIStore.getState().setEditValue(current + "\n");
      expect(useUIStore.getState().editValue).toBe("line1\n");
    });
  });

  // S8-008: F2 edit mode
  describe("S8-008: F2 enters edit mode", () => {
    it("startEditing enters edit mode for selected cell", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: "edit me" });
      const pos = useUIStore.getState().selectedCell!;
      const cell = useCellStore.getState().getCell(sheetId, pos.row, pos.col);
      const initialValue = cell?.formula
        ? `=${cell.formula}`
        : String(cell?.value ?? "");
      useUIStore.getState().startEditing(pos, initialValue);
      expect(useUIStore.getState().isEditing).toBe(true);
      expect(useUIStore.getState().editValue).toBe("edit me");
    });

    it("formula cell shows =formula prefix", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore
        .getState()
        .setCell(sheetId, 0, 0, { value: 42, formula: "SUM(A2:A5)" });
      const pos = useUIStore.getState().selectedCell!;
      const cell = useCellStore.getState().getCell(sheetId, pos.row, pos.col);
      const initialValue = cell?.formula
        ? `=${cell.formula}`
        : String(cell?.value ?? "");
      useUIStore.getState().startEditing(pos, initialValue);
      expect(useUIStore.getState().editValue).toBe("=SUM(A2:A5)");
    });
  });

  // S8-009: Ctrl+1 format cells dialog
  describe("S8-009: Ctrl+1 format cells dialog", () => {
    it("opens and closes format cells dialog", () => {
      useUIStore.getState().setFormatCellsDialogOpen(true);
      expect(useUIStore.getState().isFormatCellsDialogOpen).toBe(true);
      useUIStore.getState().setFormatCellsDialogOpen(false);
      expect(useUIStore.getState().isFormatCellsDialogOpen).toBe(false);
    });
  });

  // S8-010: Ctrl+Shift+1-6 number formats
  describe("S8-010: Ctrl+Shift+1-6 number format shortcuts", () => {
    const NUMBER_FORMAT_MAP: Record<string, string> = {
      "1": "#,##0.00",
      "2": "h:mm:ss AM/PM",
      "3": "M/d/yyyy",
      "4": "$#,##0.00",
      "5": "0.00%",
      "6": "0.00E+00",
    };

    it("Ctrl+Shift+1 applies number format", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: 42 });
      useHistoryStore.getState().pushUndo();
      useFormatStore
        .getState()
        .setFormatOnSelection({ numberFormat: NUMBER_FORMAT_MAP["1"] });
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.numberFormat).toBe("#,##0.00");
    });

    it("Ctrl+Shift+2 applies time format", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: 0.5 });
      useFormatStore
        .getState()
        .setFormatOnSelection({ numberFormat: NUMBER_FORMAT_MAP["2"] });
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.numberFormat).toBe("h:mm:ss AM/PM");
    });

    it("Ctrl+Shift+3 applies date format", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: 44000 });
      useFormatStore
        .getState()
        .setFormatOnSelection({ numberFormat: NUMBER_FORMAT_MAP["3"] });
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.numberFormat).toBe("M/d/yyyy");
    });

    it("Ctrl+Shift+4 applies currency format", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: 1000 });
      useFormatStore
        .getState()
        .setFormatOnSelection({ numberFormat: NUMBER_FORMAT_MAP["4"] });
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.numberFormat).toBe("$#,##0.00");
    });

    it("Ctrl+Shift+5 applies percent format", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: 0.5 });
      useFormatStore
        .getState()
        .setFormatOnSelection({ numberFormat: NUMBER_FORMAT_MAP["5"] });
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.numberFormat).toBe("0.00%");
    });

    it("Ctrl+Shift+6 applies scientific format", () => {
      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      useCellStore.getState().setCell(sheetId, 0, 0, { value: 123456 });
      useFormatStore
        .getState()
        .setFormatOnSelection({ numberFormat: NUMBER_FORMAT_MAP["6"] });
      const cell = useCellStore.getState().getCell(sheetId, 0, 0);
      expect(cell?.format?.numberFormat).toBe("0.00E+00");
    });
  });
});

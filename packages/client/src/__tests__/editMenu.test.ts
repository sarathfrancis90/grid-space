import { describe, it, expect, beforeEach } from "vitest";
import { useCellStore } from "../stores/cellStore";
import { useGridStore } from "../stores/gridStore";
import { useClipboardStore } from "../stores/clipboardStore";
import { performPasteSpecial } from "../hooks/useKeyboardShortcuts";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

describe("Edit Menu — Move Row/Column", () => {
  const sheetId = "sheet-1";

  beforeEach(() => {
    useCellStore.getState().ensureSheet(sheetId);
    // Clear all cells
    useCellStore.setState((state) => {
      state.cells.set(sheetId, new Map());
    });
    useSpreadsheetStore.setState((state) => {
      state.activeSheetId = sheetId;
      state.sheets = [{ id: sheetId, name: "Sheet1", color: null }];
    });
  });

  describe("moveRow", () => {
    it("should swap two rows", () => {
      const store = useCellStore.getState();
      store.setCell(sheetId, 0, 0, { value: "A1" });
      store.setCell(sheetId, 0, 1, { value: "B1" });
      store.setCell(sheetId, 1, 0, { value: "A2" });
      store.setCell(sheetId, 1, 1, { value: "B2" });

      store.moveRow(sheetId, 0, 1, 2);

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)?.value).toBe("A2");
      expect(after.getCell(sheetId, 0, 1)?.value).toBe("B2");
      expect(after.getCell(sheetId, 1, 0)?.value).toBe("A1");
      expect(after.getCell(sheetId, 1, 1)?.value).toBe("B1");
    });

    it("should handle moving row with empty target", () => {
      const store = useCellStore.getState();
      store.setCell(sheetId, 0, 0, { value: "A1" });

      store.moveRow(sheetId, 0, 1, 2);

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)).toBeUndefined();
      expect(after.getCell(sheetId, 1, 0)?.value).toBe("A1");
    });

    it("should no-op when from === to", () => {
      const store = useCellStore.getState();
      store.setCell(sheetId, 0, 0, { value: "A1" });

      store.moveRow(sheetId, 0, 0, 2);

      expect(useCellStore.getState().getCell(sheetId, 0, 0)?.value).toBe("A1");
    });
  });

  describe("moveCol", () => {
    it("should swap two columns", () => {
      const store = useCellStore.getState();
      store.setCell(sheetId, 0, 0, { value: "A1" });
      store.setCell(sheetId, 1, 0, { value: "A2" });
      store.setCell(sheetId, 0, 1, { value: "B1" });
      store.setCell(sheetId, 1, 1, { value: "B2" });

      store.moveCol(sheetId, 0, 1, 2);

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)?.value).toBe("B1");
      expect(after.getCell(sheetId, 1, 0)?.value).toBe("B2");
      expect(after.getCell(sheetId, 0, 1)?.value).toBe("A1");
      expect(after.getCell(sheetId, 1, 1)?.value).toBe("A2");
    });

    it("should handle moving column with empty target", () => {
      const store = useCellStore.getState();
      store.setCell(sheetId, 0, 0, { value: "A1" });
      store.setCell(sheetId, 1, 0, { value: "A2" });

      store.moveCol(sheetId, 0, 1, 2);

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)).toBeUndefined();
      expect(after.getCell(sheetId, 1, 0)).toBeUndefined();
      expect(after.getCell(sheetId, 0, 1)?.value).toBe("A1");
      expect(after.getCell(sheetId, 1, 1)?.value).toBe("A2");
    });
  });
});

describe("Edit Menu — Paste Special modes", () => {
  const sheetId = "sheet-1";

  beforeEach(() => {
    useCellStore.getState().ensureSheet(sheetId);
    useCellStore.setState((state) => {
      state.cells.set(sheetId, new Map());
    });
    useSpreadsheetStore.setState((state) => {
      state.activeSheetId = sheetId;
      state.sheets = [{ id: sheetId, name: "Sheet1", color: null }];
    });
    useUIStore.setState((state) => {
      state.selectedCell = { row: 2, col: 0 };
    });
  });

  it("should paste allExceptBorders — strips borders from format", () => {
    const store = useCellStore.getState();
    store.setCell(sheetId, 0, 0, {
      value: "Hello",
      format: {
        bold: true,
        borders: { top: { style: "thin", color: "#000" } },
      },
    });

    // Set up clipboard
    const cells = new Map<
      string,
      { value: unknown; format?: Record<string, unknown> }
    >();
    cells.set("0,0", {
      value: "Hello",
      format: {
        bold: true,
        borders: { top: { style: "thin", color: "#000" } },
      },
    });
    useClipboardStore
      .getState()
      .copy(cells as Map<string, { value: unknown }>, {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 0 },
      });

    performPasteSpecial("allExceptBorders");

    const pasted = useCellStore.getState().getCell(sheetId, 2, 0);
    expect(pasted?.value).toBe("Hello");
    expect(pasted?.format?.bold).toBe(true);
    expect(pasted?.format?.borders).toBeUndefined();
  });

  it("should paste formula only — keeps existing format", () => {
    const store = useCellStore.getState();
    store.setCell(sheetId, 2, 0, {
      value: "existing",
      format: { bold: true },
    });

    const cells = new Map<string, { value: unknown; formula?: string }>();
    cells.set("0,0", { value: 42, formula: "=SUM(A1:A5)" });
    useClipboardStore
      .getState()
      .copy(cells as Map<string, { value: unknown }>, {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 0 },
      });

    performPasteSpecial("formula");

    const pasted = useCellStore.getState().getCell(sheetId, 2, 0);
    expect(pasted?.formula).toBe("=SUM(A1:A5)");
    expect(pasted?.format?.bold).toBe(true);
  });
});

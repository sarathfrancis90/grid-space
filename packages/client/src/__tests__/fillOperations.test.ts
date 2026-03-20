import { describe, it, expect, beforeEach } from "vitest";
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import {
  fillDown,
  fillRight,
  fillUp,
  fillLeft,
  fillSeries,
} from "../utils/fillOperations";

describe("Fill Operations", () => {
  const sheetId = "sheet-1";

  beforeEach(() => {
    useCellStore.getState().ensureSheet(sheetId);
    useCellStore.setState((state) => {
      state.cells.set(sheetId, new Map());
    });
    useSpreadsheetStore.setState((state) => {
      state.activeSheetId = sheetId;
      state.sheets = [{ id: sheetId, name: "Sheet1" }] as typeof state.sheets;
    });
    useUIStore.setState((state) => {
      state.selectedCell = { row: 0, col: 0 };
      state.selections = [
        { start: { row: 0, col: 0 }, end: { row: 2, col: 1 } },
      ];
    });
  });

  describe("fillDown", () => {
    it("copies first row values to all rows below in selection", () => {
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 0, { value: "Hello" });
      cs.setCell(sheetId, 0, 1, { value: 42 });

      fillDown();

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 1, 0)?.value).toBe("Hello");
      expect(after.getCell(sheetId, 2, 0)?.value).toBe("Hello");
      expect(after.getCell(sheetId, 1, 1)?.value).toBe(42);
      expect(after.getCell(sheetId, 2, 1)?.value).toBe(42);
    });

    it("does nothing when selection is a single row", () => {
      useUIStore.setState((state) => {
        state.selections = [
          { start: { row: 0, col: 0 }, end: { row: 0, col: 1 } },
        ];
      });
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 0, { value: "A" });

      fillDown();

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 1, 0)).toBeUndefined();
    });
  });

  describe("fillRight", () => {
    it("copies first column values to all columns right in selection", () => {
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 0, { value: "X" });
      cs.setCell(sheetId, 1, 0, { value: "Y" });
      cs.setCell(sheetId, 2, 0, { value: "Z" });

      fillRight();

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 1)?.value).toBe("X");
      expect(after.getCell(sheetId, 1, 1)?.value).toBe("Y");
      expect(after.getCell(sheetId, 2, 1)?.value).toBe("Z");
    });
  });

  describe("fillUp", () => {
    it("copies last row values to all rows above in selection", () => {
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 2, 0, { value: "Bottom" });
      cs.setCell(sheetId, 2, 1, { value: 99 });

      fillUp();

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)?.value).toBe("Bottom");
      expect(after.getCell(sheetId, 1, 0)?.value).toBe("Bottom");
      expect(after.getCell(sheetId, 0, 1)?.value).toBe(99);
      expect(after.getCell(sheetId, 1, 1)?.value).toBe(99);
    });
  });

  describe("fillLeft", () => {
    it("copies last column values to all columns left in selection", () => {
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 1, { value: "Right" });
      cs.setCell(sheetId, 1, 1, { value: "Side" });

      fillLeft();

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)?.value).toBe("Right");
      expect(after.getCell(sheetId, 1, 0)?.value).toBe("Side");
    });
  });

  describe("fillSeries", () => {
    it("generates a linear series from the start cell", () => {
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 0, { value: 1 });

      useUIStore.setState((state) => {
        state.selections = [
          { start: { row: 0, col: 0 }, end: { row: 4, col: 0 } },
        ];
      });

      fillSeries({ type: "linear", stepValue: 2 });

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)?.value).toBe(1);
      expect(after.getCell(sheetId, 1, 0)?.value).toBe(3);
      expect(after.getCell(sheetId, 2, 0)?.value).toBe(5);
      expect(after.getCell(sheetId, 3, 0)?.value).toBe(7);
      expect(after.getCell(sheetId, 4, 0)?.value).toBe(9);
    });

    it("generates a growth series", () => {
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 0, { value: 2 });

      useUIStore.setState((state) => {
        state.selections = [
          { start: { row: 0, col: 0 }, end: { row: 2, col: 0 } },
        ];
      });

      fillSeries({ type: "growth", stepValue: 3 });

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)?.value).toBe(2); // 2 * 3^0
      expect(after.getCell(sheetId, 1, 0)?.value).toBe(6); // 2 * 3^1
      expect(after.getCell(sheetId, 2, 0)?.value).toBe(18); // 2 * 3^2
    });

    it("respects stop value", () => {
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 0, { value: 0 });

      useUIStore.setState((state) => {
        state.selections = [
          { start: { row: 0, col: 0 }, end: { row: 9, col: 0 } },
        ];
      });

      fillSeries({ type: "linear", stepValue: 5, stopValue: 12 });

      const after = useCellStore.getState();
      expect(after.getCell(sheetId, 0, 0)?.value).toBe(0);
      expect(after.getCell(sheetId, 1, 0)?.value).toBe(5);
      expect(after.getCell(sheetId, 2, 0)?.value).toBe(10);
      // Row 3 would be 15, exceeding stopValue 12 — should not be filled
      expect(after.getCell(sheetId, 3, 0)?.value).toBeUndefined();
    });
  });

  describe("fillDown with no selection", () => {
    it("does nothing when there are no selections", () => {
      useUIStore.setState((state) => {
        state.selections = [];
      });
      const cs = useCellStore.getState();
      cs.setCell(sheetId, 0, 0, { value: "A" });

      fillDown();

      // Should not throw and cell should be unchanged
      expect(useCellStore.getState().getCell(sheetId, 0, 0)?.value).toBe("A");
    });
  });
});

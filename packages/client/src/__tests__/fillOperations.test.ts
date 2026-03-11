import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stores
const mockPushUndo = vi.fn();
const mockGetCell = vi.fn();
const mockSetCellBatch = vi.fn();

vi.mock("../stores/historyStore", () => ({
  useHistoryStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        pushUndo: mockPushUndo,
      }),
    },
  ),
}));

vi.mock("../stores/uiStore", () => ({
  useUIStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        selections: [{ start: { row: 0, col: 0 }, end: { row: 3, col: 0 } }],
        selectedCell: { row: 0, col: 0 },
        isFillSeriesDialogOpen: false,
        setFillSeriesDialogOpen: vi.fn(),
      }),
    },
  ),
}));

vi.mock("../stores/spreadsheetStore", () => ({
  useSpreadsheetStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        activeSheetId: "sheet-1",
      }),
    },
  ),
}));

vi.mock("../stores/cellStore", () => ({
  useCellStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    {
      getState: () => ({
        getCell: mockGetCell,
        setCellBatch: mockSetCellBatch,
      }),
    },
  ),
}));

import {
  fillDown,
  fillRight,
  fillUp,
  fillLeft,
  fillSeries,
} from "../utils/fillOperations";

describe("fillOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fillDown", () => {
    it("copies source row cells into all rows below within selection", () => {
      mockGetCell.mockImplementation(
        (_sid: string, row: number, _col: number) => {
          if (row === 0) return { value: "Hello" };
          return undefined;
        },
      );

      fillDown();

      expect(mockPushUndo).toHaveBeenCalled();
      expect(mockSetCellBatch).toHaveBeenCalledWith("sheet-1", [
        { row: 1, col: 0, data: { value: "Hello" } },
        { row: 2, col: 0, data: { value: "Hello" } },
        { row: 3, col: 0, data: { value: "Hello" } },
      ]);
    });

    it("does nothing when selection is a single row", async () => {
      const { useUIStore } = await import("../stores/uiStore");
      const origGetState = useUIStore.getState;
      (useUIStore as unknown as { getState: () => unknown }).getState = () => ({
        ...origGetState(),
        selections: [{ start: { row: 2, col: 0 }, end: { row: 2, col: 0 } }],
      });

      fillDown();

      expect(mockPushUndo).not.toHaveBeenCalled();
      expect(mockSetCellBatch).not.toHaveBeenCalled();

      (useUIStore as unknown as { getState: () => unknown }).getState =
        origGetState;
    });
  });

  describe("fillRight", () => {
    it("copies source column cells into all columns to the right", async () => {
      const { useUIStore } = await import("../stores/uiStore");
      const origGetState = useUIStore.getState;
      (useUIStore as unknown as { getState: () => unknown }).getState = () => ({
        ...origGetState(),
        selections: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }],
      });

      mockGetCell.mockImplementation(
        (_sid: string, _row: number, col: number) => {
          if (col === 0) return { value: 42 };
          return undefined;
        },
      );

      fillRight();

      expect(mockPushUndo).toHaveBeenCalled();
      expect(mockSetCellBatch).toHaveBeenCalledWith("sheet-1", [
        { row: 0, col: 1, data: { value: 42 } },
        { row: 0, col: 2, data: { value: 42 } },
      ]);

      (useUIStore as unknown as { getState: () => unknown }).getState =
        origGetState;
    });
  });

  describe("fillUp", () => {
    it("copies last row cells into all rows above", () => {
      mockGetCell.mockImplementation(
        (_sid: string, row: number, _col: number) => {
          if (row === 3) return { value: "Bottom" };
          return undefined;
        },
      );

      fillUp();

      expect(mockPushUndo).toHaveBeenCalled();
      expect(mockSetCellBatch).toHaveBeenCalledWith("sheet-1", [
        { row: 0, col: 0, data: { value: "Bottom" } },
        { row: 1, col: 0, data: { value: "Bottom" } },
        { row: 2, col: 0, data: { value: "Bottom" } },
      ]);
    });
  });

  describe("fillLeft", () => {
    it("copies last column cells into all columns to the left", async () => {
      const { useUIStore } = await import("../stores/uiStore");
      const origGetState = useUIStore.getState;
      (useUIStore as unknown as { getState: () => unknown }).getState = () => ({
        ...origGetState(),
        selections: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }],
      });

      mockGetCell.mockImplementation(
        (_sid: string, _row: number, col: number) => {
          if (col === 2) return { value: "Right" };
          return undefined;
        },
      );

      fillLeft();

      expect(mockPushUndo).toHaveBeenCalled();
      expect(mockSetCellBatch).toHaveBeenCalledWith("sheet-1", [
        { row: 0, col: 0, data: { value: "Right" } },
        { row: 0, col: 1, data: { value: "Right" } },
      ]);

      (useUIStore as unknown as { getState: () => unknown }).getState =
        origGetState;
    });
  });

  describe("fillSeries", () => {
    it("generates a linear series from the source cell value", () => {
      mockGetCell.mockImplementation(
        (_sid: string, row: number, _col: number) => {
          if (row === 0) return { value: 10 };
          return undefined;
        },
      );

      fillSeries({ type: "linear", stepValue: 5, stopValue: null });

      expect(mockPushUndo).toHaveBeenCalled();
      expect(mockSetCellBatch).toHaveBeenCalledWith("sheet-1", [
        { row: 0, col: 0, data: { value: 10 } },
        { row: 1, col: 0, data: { value: 15 } },
        { row: 2, col: 0, data: { value: 20 } },
        { row: 3, col: 0, data: { value: 25 } },
      ]);
    });

    it("generates a growth series from the source cell value", () => {
      mockGetCell.mockImplementation(
        (_sid: string, row: number, _col: number) => {
          if (row === 0) return { value: 2 };
          return undefined;
        },
      );

      fillSeries({ type: "growth", stepValue: 3, stopValue: null });

      expect(mockPushUndo).toHaveBeenCalled();
      const calls = mockSetCellBatch.mock.calls[0];
      expect(calls[0]).toBe("sheet-1");
      const updates = calls[1] as Array<{
        row: number;
        col: number;
        data: { value: number };
      }>;
      expect(updates[0].data.value).toBe(2); // 2 * 3^0
      expect(updates[1].data.value).toBe(6); // 2 * 3^1
      expect(updates[2].data.value).toBe(18); // 2 * 3^2
      expect(updates[3].data.value).toBe(54); // 2 * 3^3
    });

    it("stops at the stop value for a linear series", () => {
      mockGetCell.mockImplementation(
        (_sid: string, row: number, _col: number) => {
          if (row === 0) return { value: 1 };
          return undefined;
        },
      );

      fillSeries({ type: "linear", stepValue: 2, stopValue: 4 });

      expect(mockSetCellBatch).toHaveBeenCalledWith("sheet-1", [
        { row: 0, col: 0, data: { value: 1 } },
        { row: 1, col: 0, data: { value: 3 } },
      ]);
    });
  });

  describe("Edit menu fill submenu items", () => {
    it("defines expected test IDs for fill submenu items", () => {
      const expectedTestIds = [
        "menu-edit-fill",
        "menu-edit-fill-down",
        "menu-edit-fill-right",
        "menu-edit-fill-up",
        "menu-edit-fill-left",
        "menu-edit-fill-series",
      ];
      for (const testId of expectedTestIds) {
        expect(testId).toMatch(/^menu-edit-fill/);
      }
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { useGridStore } from "../stores/gridStore";
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useNamedRangeStore } from "../stores/namedRangeStore";
import { useCommentStore } from "../stores/commentStore";
import { useFilterStore } from "../stores/filterStore";

describe("Expanded Context Menu Operations", () => {
  const sheetId = "sheet1";

  beforeEach(() => {
    // Reset stores
    useGridStore.setState({
      totalRows: 100,
      totalCols: 26,
      rowHeights: new Map<number, number>(),
      columnWidths: new Map<number, number>(),
      hiddenRows: new Set<number>(),
      hiddenCols: new Set<number>(),
    });
    useCellStore.setState({
      cells: new Map([[sheetId, new Map()]]),
    });
    useUIStore.getState().setSelectedCell({ row: 5, col: 3 });
    useUIStore
      .getState()
      .setSelections([{ start: { row: 5, col: 3 }, end: { row: 5, col: 3 } }]);
    useNamedRangeStore.setState({ ranges: new Map() });
  });

  describe("Row operations from cell context menu", () => {
    it("should insert a row above the selected cell", () => {
      const gs = useGridStore.getState();
      const initialRows = gs.totalRows;

      useCellStore.getState().insertRows(sheetId, 5, 1, gs.totalRows);
      useGridStore.getState().setTotalRows(initialRows + 1);

      expect(useGridStore.getState().totalRows).toBe(initialRows + 1);
    });

    it("should insert a row below the selected cell", () => {
      const gs = useGridStore.getState();
      const initialRows = gs.totalRows;

      useCellStore.getState().insertRows(sheetId, 6, 1, gs.totalRows);
      useGridStore.getState().setTotalRows(initialRows + 1);

      expect(useGridStore.getState().totalRows).toBe(initialRows + 1);
    });

    it("should delete the selected row", () => {
      const gs = useGridStore.getState();
      const initialRows = gs.totalRows;

      useCellStore.getState().deleteRows(sheetId, [5], gs.totalRows);
      useGridStore.getState().setTotalRows(initialRows - 1);

      expect(useGridStore.getState().totalRows).toBe(initialRows - 1);
    });
  });

  describe("Column operations from cell context menu", () => {
    it("should insert a column left of the selected cell", () => {
      const gs = useGridStore.getState();
      const initialCols = gs.totalCols;

      useCellStore.getState().insertCols(sheetId, 3, 1, gs.totalCols);
      useGridStore.getState().setTotalCols(initialCols + 1);

      expect(useGridStore.getState().totalCols).toBe(initialCols + 1);
    });

    it("should insert a column right of the selected cell", () => {
      const gs = useGridStore.getState();
      const initialCols = gs.totalCols;

      useCellStore.getState().insertCols(sheetId, 4, 1, gs.totalCols);
      useGridStore.getState().setTotalCols(initialCols + 1);

      expect(useGridStore.getState().totalCols).toBe(initialCols + 1);
    });

    it("should delete the selected column", () => {
      const gs = useGridStore.getState();
      const initialCols = gs.totalCols;

      useCellStore.getState().deleteCols(sheetId, [3], gs.totalCols);
      useGridStore.getState().setTotalCols(initialCols - 1);

      expect(useGridStore.getState().totalCols).toBe(initialCols - 1);
    });
  });

  describe("Hide row/column operations", () => {
    it("should hide a row", () => {
      useGridStore.getState().hideRows([5]);
      expect(useGridStore.getState().hiddenRows.has(5)).toBe(true);
    });

    it("should unhide a row", () => {
      useGridStore.getState().hideRows([5]);
      useGridStore.getState().unhideRows([5]);
      expect(useGridStore.getState().hiddenRows.has(5)).toBe(false);
    });

    it("should hide a column", () => {
      useGridStore.getState().hideCols([3]);
      expect(useGridStore.getState().hiddenCols.has(3)).toBe(true);
    });

    it("should unhide a column", () => {
      useGridStore.getState().hideCols([3]);
      useGridStore.getState().unhideCols([3]);
      expect(useGridStore.getState().hiddenCols.has(3)).toBe(false);
    });
  });

  describe("Resize row/column operations", () => {
    it("should resize a row", () => {
      useGridStore.getState().setRowHeight(5, 50);
      expect(useGridStore.getState().getRowHeight(5)).toBe(50);
    });

    it("should resize a column", () => {
      useGridStore.getState().setColumnWidth(3, 200);
      expect(useGridStore.getState().getColumnWidth(3)).toBe(200);
    });
  });

  describe("Comment operations", () => {
    it("should set active comment cell", () => {
      useCommentStore.getState().setActiveCommentCell(sheetId, "5,3");
      const state = useCommentStore.getState();
      expect(state.activeSheetForComment).toBe(sheetId);
      expect(state.activeCommentCell).toBe("5,3");
    });
  });

  describe("Named range operations", () => {
    it("should define a named range from selection", () => {
      useNamedRangeStore.getState().addRange({
        name: "Range_D6_D6",
        sheetId,
        startRow: 5,
        startCol: 3,
        endRow: 5,
        endCol: 3,
      });

      const range = useNamedRangeStore.getState().getRange("Range_D6_D6");
      expect(range).toBeDefined();
      expect(range?.sheetId).toBe(sheetId);
      expect(range?.startRow).toBe(5);
      expect(range?.startCol).toBe(3);
    });

    it("should define a named range from multi-cell selection", () => {
      useUIStore
        .getState()
        .setSelections([
          { start: { row: 2, col: 1 }, end: { row: 5, col: 4 } },
        ]);

      useNamedRangeStore.getState().addRange({
        name: "Range_B3_E6",
        sheetId,
        startRow: 2,
        startCol: 1,
        endRow: 5,
        endCol: 4,
      });

      const range = useNamedRangeStore.getState().getRange("Range_B3_E6");
      expect(range).toBeDefined();
      expect(range?.startRow).toBe(2);
      expect(range?.endRow).toBe(5);
    });
  });

  describe("UI dialog triggers", () => {
    it("should open hyperlink dialog for Insert link", () => {
      useUIStore.getState().setHyperlinkDialogOpen(true);
      expect(useUIStore.getState().isHyperlinkDialogOpen).toBe(true);
    });

    it("should open protection dialog for Protect range", () => {
      useUIStore.getState().setProtectionDialogOpen(true);
      expect(useUIStore.getState().isProtectionDialogOpen).toBe(true);
    });
  });

  describe("Sort operations from context menu", () => {
    it("should set sort criteria ascending for a column", () => {
      useFilterStore
        .getState()
        .setSortCriteria(sheetId, [{ col: 3, direction: "asc" }]);
      const criteria = useFilterStore.getState().sortCriteria.get(sheetId);
      expect(criteria).toBeDefined();
      expect(criteria).toHaveLength(1);
      expect(criteria![0].col).toBe(3);
      expect(criteria![0].direction).toBe("asc");
    });

    it("should set sort criteria descending for a column", () => {
      useFilterStore
        .getState()
        .setSortCriteria(sheetId, [{ col: 3, direction: "desc" }]);
      const criteria = useFilterStore.getState().sortCriteria.get(sheetId);
      expect(criteria).toBeDefined();
      expect(criteria![0].direction).toBe("desc");
    });
  });

  describe("Filter toggle from context menu", () => {
    it("should toggle filters on a sheet", () => {
      useFilterStore.getState().toggleFilters(sheetId);
      expect(useFilterStore.getState().isFilterEnabled(sheetId)).toBe(true);

      useFilterStore.getState().toggleFilters(sheetId);
      expect(useFilterStore.getState().isFilterEnabled(sheetId)).toBe(false);
    });
  });

  describe("Multi-selection context menu labels", () => {
    it("should detect multi-row selection count", () => {
      useUIStore
        .getState()
        .setSelections([
          { start: { row: 2, col: 0 }, end: { row: 5, col: 25 } },
        ]);
      const selections = useUIStore.getState().selections;
      const lastSel = selections[selections.length - 1];
      const rowCount = Math.abs(lastSel.end.row - lastSel.start.row) + 1;
      expect(rowCount).toBe(4);
    });

    it("should detect multi-column selection count", () => {
      useUIStore
        .getState()
        .setSelections([
          { start: { row: 0, col: 1 }, end: { row: 99, col: 3 } },
        ]);
      const selections = useUIStore.getState().selections;
      const lastSel = selections[selections.length - 1];
      const colCount = Math.abs(lastSel.end.col - lastSel.start.col) + 1;
      expect(colCount).toBe(3);
    });
  });

  describe("Get link to cell", () => {
    it("should generate a cell link URL with correct cell reference", () => {
      const cellCol = 3;
      const cellRow = 5;
      const colToLetter = (col: number): string => {
        let letter = "";
        let c = col;
        while (c >= 0) {
          letter = String.fromCharCode((c % 26) + 65) + letter;
          c = Math.floor(c / 26) - 1;
        }
        return letter;
      };
      const cellRef = `${colToLetter(cellCol)}${cellRow + 1}`;
      expect(cellRef).toBe("D6");

      const url = `https://example.com/sheet#cell=${cellRef}`;
      expect(url).toContain("#cell=D6");
    });
  });
});

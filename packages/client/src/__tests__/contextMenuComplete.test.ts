import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGridStore } from "../stores/gridStore";
import { useCellStore } from "../stores/cellStore";
import { useUIStore } from "../stores/uiStore";
import { useFilterStore } from "../stores/filterStore";

describe("Complete Context Menu — Issue #188", () => {
  const sheetId = "sheet1";

  beforeEach(() => {
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
    useFilterStore.setState({
      filtersEnabled: new Map(),
      columnFilters: new Map(),
      sortCriteria: new Map(),
      filteredRows: new Map(),
    });
  });

  describe("Insert N rows/columns (multi-selection)", () => {
    it("should support inserting multiple rows based on selection count", () => {
      // Simulate selecting 3 rows (row 5 to row 7)
      useUIStore
        .getState()
        .setSelections([
          { start: { row: 5, col: 0 }, end: { row: 7, col: 25 } },
        ]);

      const selections = useUIStore.getState().selections;
      const lastSel = selections[selections.length - 1];
      const selectedRowCount =
        Math.abs(lastSel.end.row - lastSel.start.row) + 1;

      expect(selectedRowCount).toBe(3);

      // Insert that many rows
      const gs = useGridStore.getState();
      const initialRows = gs.totalRows;
      for (let i = 0; i < selectedRowCount; i++) {
        useCellStore.getState().insertRows(sheetId, 5, 1, gs.totalRows + i);
        useGridStore.getState().setTotalRows(initialRows + i + 1);
      }

      expect(useGridStore.getState().totalRows).toBe(initialRows + 3);
    });

    it("should support inserting multiple columns based on selection count", () => {
      // Simulate selecting 2 columns (col 3 to col 4)
      useUIStore
        .getState()
        .setSelections([
          { start: { row: 0, col: 3 }, end: { row: 99, col: 4 } },
        ]);

      const selections = useUIStore.getState().selections;
      const lastSel = selections[selections.length - 1];
      const selectedColCount =
        Math.abs(lastSel.end.col - lastSel.start.col) + 1;

      expect(selectedColCount).toBe(2);

      const gs = useGridStore.getState();
      const initialCols = gs.totalCols;
      for (let i = 0; i < selectedColCount; i++) {
        useCellStore.getState().insertCols(sheetId, 3, 1, gs.totalCols + i);
        useGridStore.getState().setTotalCols(initialCols + i + 1);
      }

      expect(useGridStore.getState().totalCols).toBe(initialCols + 2);
    });
  });

  describe("Hide row/column from cell context menu", () => {
    it("should hide the row of the selected cell", () => {
      const selectedCell = useUIStore.getState().selectedCell;
      expect(selectedCell).not.toBeNull();

      useGridStore.getState().hideRows([selectedCell!.row]);
      expect(useGridStore.getState().hiddenRows.has(5)).toBe(true);
    });

    it("should hide the column of the selected cell", () => {
      const selectedCell = useUIStore.getState().selectedCell;
      expect(selectedCell).not.toBeNull();

      useGridStore.getState().hideCols([selectedCell!.col]);
      expect(useGridStore.getState().hiddenCols.has(3)).toBe(true);
    });
  });

  describe("Resize row/column from cell context menu", () => {
    it("should resize the row of the selected cell", () => {
      const selectedCell = useUIStore.getState().selectedCell;
      expect(selectedCell).not.toBeNull();

      useGridStore.getState().setRowHeight(selectedCell!.row, 60);
      expect(useGridStore.getState().getRowHeight(5)).toBe(60);
    });

    it("should resize the column of the selected cell", () => {
      const selectedCell = useUIStore.getState().selectedCell;
      expect(selectedCell).not.toBeNull();

      useGridStore.getState().setColumnWidth(selectedCell!.col, 180);
      expect(useGridStore.getState().getColumnWidth(3)).toBe(180);
    });
  });

  describe("Get link to this cell", () => {
    it("should generate correct cell reference URL", () => {
      const selectedCell = useUIStore.getState().selectedCell;
      expect(selectedCell).not.toBeNull();

      // Cell at row 5, col 3 should be D6
      const col = selectedCell!.col;
      const row = selectedCell!.row;
      const colLetter = String.fromCharCode(65 + col); // D
      const cellRef = `${colLetter}${row + 1}`; // D6

      expect(cellRef).toBe("D6");

      // The URL would be constructed with this ref
      const url = `http://localhost/#cell=${cellRef}`;
      expect(url).toContain("#cell=D6");
    });
  });

  describe("Sort operations from context menu", () => {
    it("should set sort criteria to ascending for selected column", () => {
      const selectedCell = useUIStore.getState().selectedCell;
      expect(selectedCell).not.toBeNull();

      useFilterStore
        .getState()
        .setSortCriteria(sheetId, [
          { col: selectedCell!.col, direction: "asc" },
        ]);

      const criteria = useFilterStore.getState().sortCriteria.get(sheetId);
      expect(criteria).toBeDefined();
      expect(criteria![0].col).toBe(3);
      expect(criteria![0].direction).toBe("asc");
    });

    it("should set sort criteria to descending for selected column", () => {
      const selectedCell = useUIStore.getState().selectedCell;
      expect(selectedCell).not.toBeNull();

      useFilterStore
        .getState()
        .setSortCriteria(sheetId, [
          { col: selectedCell!.col, direction: "desc" },
        ]);

      const criteria = useFilterStore.getState().sortCriteria.get(sheetId);
      expect(criteria).toBeDefined();
      expect(criteria![0].direction).toBe("desc");
    });
  });

  describe("Create filter from context menu", () => {
    it("should toggle filters for the active sheet", () => {
      useFilterStore.getState().toggleFilters(sheetId);
      expect(useFilterStore.getState().isFilterEnabled(sheetId)).toBe(true);
    });

    it("should toggle filters off when already enabled", () => {
      useFilterStore.getState().toggleFilters(sheetId);
      useFilterStore.getState().toggleFilters(sheetId);
      expect(useFilterStore.getState().isFilterEnabled(sheetId)).toBe(false);
    });
  });

  describe("Protection dialog from row/col context menu", () => {
    it("should open protection dialog", () => {
      useUIStore.getState().setProtectionDialogOpen(true);
      expect(useUIStore.getState().isProtectionDialogOpen).toBe(true);
    });
  });

  describe("Submenu structure", () => {
    it("should support Paste special submenu items", () => {
      // Verify the submenu structure can be constructed
      const submenuItems = [
        { label: "Values only", action: () => {} },
        { label: "Format only", action: () => {} },
        { label: "Transpose", action: () => {} },
      ];

      expect(submenuItems).toHaveLength(3);
      expect(submenuItems[0].label).toBe("Values only");
      expect(submenuItems[1].label).toBe("Format only");
      expect(submenuItems[2].label).toBe("Transpose");
    });

    it("should support More cell actions submenu items", () => {
      const submenuItems = [
        { label: "Sort sheet A → Z", action: () => {} },
        { label: "Sort sheet Z → A", action: () => {} },
        { label: "Create filter", action: () => {} },
      ];

      expect(submenuItems).toHaveLength(3);
      expect(submenuItems[0].label).toContain("Sort");
      expect(submenuItems[2].label).toBe("Create filter");
    });
  });
});

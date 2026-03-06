import { describe, it, expect, beforeEach } from "vitest";
import { useTableStore } from "../stores/tableStore";
import type { TableConfig, CellData } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

function makeTable(overrides?: Partial<TableConfig>): TableConfig {
  return {
    id: "table-1",
    name: "Sales",
    sheetId: "sheet-1",
    startRow: 0,
    startCol: 0,
    endRow: 5,
    endCol: 2,
    columns: [
      { id: "c1", headerName: "Product" },
      { id: "c2", headerName: "Quantity" },
      { id: "c3", headerName: "Price" },
    ],
    showHeaderRow: true,
    showTotalRow: false,
    showBandedRows: true,
    showBandedCols: false,
    stylePreset: "blue-medium-1",
    autoExpand: true,
    ...overrides,
  };
}

describe("tableStore — new features", () => {
  beforeEach(() => {
    useTableStore.setState({ tables: new Map() });
  });

  describe("convertSelectionToTable", () => {
    it("creates a table from selection with auto-detected headers", () => {
      const cells = new Map<string, CellData>();
      cells.set(getCellKey(0, 0), { value: "Name" });
      cells.set(getCellKey(0, 1), { value: "Age" });
      cells.set(getCellKey(0, 2), { value: "Score" });
      cells.set(getCellKey(1, 0), { value: "Alice" });
      cells.set(getCellKey(1, 1), { value: 30 });
      cells.set(getCellKey(1, 2), { value: 95 });

      const table = useTableStore
        .getState()
        .convertSelectionToTable("sheet-1", 0, 0, 2, 2, cells, true);

      expect(table.name).toMatch(/^Table/);
      expect(table.sheetId).toBe("sheet-1");
      expect(table.startRow).toBe(0);
      expect(table.endRow).toBe(2);
      expect(table.columns).toHaveLength(3);
      expect(table.columns[0].headerName).toBe("Name");
      expect(table.columns[1].headerName).toBe("Age");
      expect(table.columns[2].headerName).toBe("Score");
      expect(table.showHeaderRow).toBe(true);
      expect(table.showBandedRows).toBe(true);
      expect(table.autoExpand).toBe(true);

      // Verify it's stored
      expect(useTableStore.getState().getTable(table.id)).toBeTruthy();
    });

    it("creates a table without headers when hasHeaders is false", () => {
      const cells = new Map<string, CellData>();
      cells.set(getCellKey(0, 0), { value: 100 });
      cells.set(getCellKey(0, 1), { value: 200 });

      const table = useTableStore
        .getState()
        .convertSelectionToTable("sheet-1", 0, 0, 3, 1, cells, false);

      expect(table.columns[0].headerName).toBe("Column 1");
      expect(table.columns[1].headerName).toBe("Column 2");
      expect(table.showHeaderRow).toBe(false);
    });

    it("allows custom table name", () => {
      const cells = new Map<string, CellData>();
      const table = useTableStore
        .getState()
        .convertSelectionToTable(
          "sheet-1",
          0,
          0,
          3,
          1,
          cells,
          false,
          "Revenue",
        );

      expect(table.name).toBe("Revenue");
    });

    it("generates unique names for multiple tables", () => {
      const cells = new Map<string, CellData>();
      const t1 = useTableStore
        .getState()
        .convertSelectionToTable("sheet-1", 0, 0, 3, 1, cells, false);
      const t2 = useTableStore
        .getState()
        .convertSelectionToTable("sheet-1", 5, 0, 8, 1, cells, false);

      expect(t1.name).not.toBe(t2.name);
    });
  });

  describe("auto-expand", () => {
    it("expands table when data added to adjacent row below", () => {
      useTableStore.getState().createTable(makeTable());
      // Cell at row 6 (immediately below endRow=5), col 1 (within col range)
      useTableStore.getState().checkAutoExpand("sheet-1", 6, 1);

      const table = useTableStore.getState().getTable("table-1");
      expect(table?.endRow).toBe(6);
    });

    it("expands table when data added to adjacent column right", () => {
      useTableStore.getState().createTable(makeTable());
      // Cell at col 3 (immediately right of endCol=2), row 2 (within row range)
      useTableStore.getState().checkAutoExpand("sheet-1", 2, 3);

      const table = useTableStore.getState().getTable("table-1");
      expect(table?.endCol).toBe(3);
      expect(table?.columns).toHaveLength(4);
    });

    it("does not expand when autoExpand is false", () => {
      useTableStore.getState().createTable(makeTable({ autoExpand: false }));
      useTableStore.getState().checkAutoExpand("sheet-1", 6, 1);

      const table = useTableStore.getState().getTable("table-1");
      expect(table?.endRow).toBe(5);
    });

    it("does not expand for non-adjacent cells", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().checkAutoExpand("sheet-1", 8, 1);

      const table = useTableStore.getState().getTable("table-1");
      expect(table?.endRow).toBe(5);
    });

    it("does not expand for different sheet", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().checkAutoExpand("sheet-2", 6, 1);

      const table = useTableStore.getState().getTable("table-1");
      expect(table?.endRow).toBe(5);
    });
  });

  describe("total row functions", () => {
    it("setColumnTotalFunction updates column", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setColumnTotalFunction("table-1", "c2", "sum");
      const table = useTableStore.getState().getTable("table-1");
      expect(table?.columns[1].totalFunction).toBe("sum");
    });

    it("computeTotalValue calculates sum", () => {
      useTableStore.getState().createTable(makeTable({ showTotalRow: false }));
      useTableStore.getState().setColumnTotalFunction("table-1", "c2", "sum");

      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 10 });
      cells.set(getCellKey(2, 1), { value: 20 });
      cells.set(getCellKey(3, 1), { value: 30 });

      const result = useTableStore
        .getState()
        .computeTotalValue("table-1", "c2", cells);
      expect(result).toBe(60);
    });

    it("computeTotalValue calculates average", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore
        .getState()
        .setColumnTotalFunction("table-1", "c3", "average");

      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 2), { value: 10 });
      cells.set(getCellKey(2, 2), { value: 20 });
      cells.set(getCellKey(3, 2), { value: 30 });

      const result = useTableStore
        .getState()
        .computeTotalValue("table-1", "c3", cells);
      expect(result).toBe(20);
    });

    it("computeTotalValue calculates count", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setColumnTotalFunction("table-1", "c2", "count");

      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 10 });
      cells.set(getCellKey(2, 1), { value: "text" });
      cells.set(getCellKey(3, 1), { value: 30 });

      // count only counts numbers
      const result = useTableStore
        .getState()
        .computeTotalValue("table-1", "c2", cells);
      expect(result).toBe(2);
    });

    it("computeTotalValue calculates counta", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore
        .getState()
        .setColumnTotalFunction("table-1", "c2", "counta");

      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 10 });
      cells.set(getCellKey(2, 1), { value: "text" });
      cells.set(getCellKey(3, 1), { value: null });

      const result = useTableStore
        .getState()
        .computeTotalValue("table-1", "c2", cells);
      expect(result).toBe(2);
    });

    it("computeTotalValue calculates min", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setColumnTotalFunction("table-1", "c2", "min");

      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 50 });
      cells.set(getCellKey(2, 1), { value: 10 });
      cells.set(getCellKey(3, 1), { value: 30 });

      const result = useTableStore
        .getState()
        .computeTotalValue("table-1", "c2", cells);
      expect(result).toBe(10);
    });

    it("computeTotalValue calculates max", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setColumnTotalFunction("table-1", "c2", "max");

      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 50 });
      cells.set(getCellKey(2, 1), { value: 10 });
      cells.set(getCellKey(3, 1), { value: 30 });

      const result = useTableStore
        .getState()
        .computeTotalValue("table-1", "c2", cells);
      expect(result).toBe(50);
    });

    it("computeTotalValue returns null for 'none' function", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setColumnTotalFunction("table-1", "c2", "none");

      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 10 });

      const result = useTableStore
        .getState()
        .computeTotalValue("table-1", "c2", cells);
      expect(result).toBeNull();
    });

    it("computeTotalValue returns null for unknown table", () => {
      const cells = new Map<string, CellData>();
      const result = useTableStore
        .getState()
        .computeTotalValue("missing", "c1", cells);
      expect(result).toBeNull();
    });
  });

  describe("setAutoExpand", () => {
    it("toggles autoExpand flag", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setAutoExpand("table-1", false);
      expect(useTableStore.getState().getTable("table-1")?.autoExpand).toBe(
        false,
      );
      useTableStore.getState().setAutoExpand("table-1", true);
      expect(useTableStore.getState().getTable("table-1")?.autoExpand).toBe(
        true,
      );
    });
  });
});

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
    ...overrides,
  };
}

describe("tableStore", () => {
  beforeEach(() => {
    useTableStore.setState({ tables: new Map() });
  });

  describe("CRUD operations", () => {
    it("creates a table", () => {
      const table = makeTable();
      useTableStore.getState().createTable(table);
      expect(useTableStore.getState().getTable("table-1")).toEqual(table);
    });

    it("deletes a table", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().deleteTable("table-1");
      expect(useTableStore.getState().getTable("table-1")).toBeUndefined();
    });

    it("renames a table", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().renameTable("table-1", "Revenue");
      expect(useTableStore.getState().getTable("table-1")?.name).toBe(
        "Revenue",
      );
    });

    it("resizes a table - expand columns", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().resizeTable("table-1", 5, 4);
      const table = useTableStore.getState().getTable("table-1")!;
      expect(table.endCol).toBe(4);
      expect(table.columns).toHaveLength(5);
      expect(table.columns[3].headerName).toBe("Column 4");
      expect(table.columns[4].headerName).toBe("Column 5");
    });

    it("resizes a table - shrink columns", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().resizeTable("table-1", 5, 1);
      const table = useTableStore.getState().getTable("table-1")!;
      expect(table.endCol).toBe(1);
      expect(table.columns).toHaveLength(2);
    });

    it("resizes a table - change end row", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().resizeTable("table-1", 10, 2);
      expect(useTableStore.getState().getTable("table-1")?.endRow).toBe(10);
    });
  });

  describe("query operations", () => {
    it("getTableByName is case-insensitive", () => {
      useTableStore.getState().createTable(makeTable());
      expect(useTableStore.getState().getTableByName("sales")).toBeTruthy();
      expect(useTableStore.getState().getTableByName("SALES")).toBeTruthy();
    });

    it("getTablesForSheet returns only matching sheet tables", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore
        .getState()
        .createTable(
          makeTable({ id: "table-2", name: "Other", sheetId: "sheet-2" }),
        );
      const sheet1Tables = useTableStore
        .getState()
        .getTablesForSheet("sheet-1");
      expect(sheet1Tables).toHaveLength(1);
      expect(sheet1Tables[0].name).toBe("Sales");
    });

    it("getTableAtCell finds table containing a cell", () => {
      useTableStore.getState().createTable(makeTable());
      const found = useTableStore.getState().getTableAtCell("sheet-1", 3, 1);
      expect(found?.id).toBe("table-1");
    });

    it("getTableAtCell returns undefined for cell outside table", () => {
      useTableStore.getState().createTable(makeTable());
      const found = useTableStore.getState().getTableAtCell("sheet-1", 10, 10);
      expect(found).toBeUndefined();
    });

    it("getAllTables returns all tables", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore
        .getState()
        .createTable(
          makeTable({ id: "table-2", name: "Other", sheetId: "sheet-2" }),
        );
      expect(useTableStore.getState().getAllTables()).toHaveLength(2);
    });
  });

  describe("column management", () => {
    it("adds a column", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().addColumn("table-1", "Discount");
      const table = useTableStore.getState().getTable("table-1")!;
      expect(table.columns).toHaveLength(4);
      expect(table.columns[3].headerName).toBe("Discount");
      expect(table.endCol).toBe(3);
    });

    it("removes a column", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().removeColumn("table-1", "c2");
      const table = useTableStore.getState().getTable("table-1")!;
      expect(table.columns).toHaveLength(2);
      expect(table.endCol).toBe(1);
    });

    it("does not remove the last column", () => {
      useTableStore.getState().createTable(
        makeTable({
          endCol: 0,
          columns: [{ id: "c1", headerName: "Only" }],
        }),
      );
      useTableStore.getState().removeColumn("table-1", "c1");
      expect(
        useTableStore.getState().getTable("table-1")!.columns,
      ).toHaveLength(1);
    });

    it("renames a column", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().renameColumn("table-1", "c1", "Item");
      expect(
        useTableStore.getState().getTable("table-1")!.columns[0].headerName,
      ).toBe("Item");
    });

    it("getColumnIndex is case-insensitive", () => {
      useTableStore.getState().createTable(makeTable());
      expect(
        useTableStore.getState().getColumnIndex("table-1", "quantity"),
      ).toBe(1);
      expect(useTableStore.getState().getColumnIndex("table-1", "PRICE")).toBe(
        2,
      );
    });

    it("getColumnIndex returns -1 for missing column", () => {
      useTableStore.getState().createTable(makeTable());
      expect(
        useTableStore.getState().getColumnIndex("table-1", "Missing"),
      ).toBe(-1);
    });
  });

  describe("table options", () => {
    it("toggles banded rows", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setShowBandedRows("table-1", false);
      expect(useTableStore.getState().getTable("table-1")!.showBandedRows).toBe(
        false,
      );
    });

    it("toggles banded columns", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setShowBandedCols("table-1", true);
      expect(useTableStore.getState().getTable("table-1")!.showBandedCols).toBe(
        true,
      );
    });

    it("toggles total row", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setShowTotalRow("table-1", true);
      expect(useTableStore.getState().getTable("table-1")!.showTotalRow).toBe(
        true,
      );
    });

    it("toggles header row", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setShowHeaderRow("table-1", false);
      expect(useTableStore.getState().getTable("table-1")!.showHeaderRow).toBe(
        false,
      );
    });

    it("changes style preset", () => {
      useTableStore.getState().createTable(makeTable());
      useTableStore.getState().setStylePreset("table-1", "green-medium-1");
      expect(useTableStore.getState().getTable("table-1")!.stylePreset).toBe(
        "green-medium-1",
      );
    });
  });

  describe("structured reference resolution", () => {
    beforeEach(() => {
      useTableStore.getState().createTable(makeTable());
    });

    it("resolves #All", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#All");
      expect(result).toEqual({
        startRow: 0,
        startCol: 0,
        endRow: 5,
        endCol: 2,
      });
    });

    it("resolves #Data (with header, no total)", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#Data");
      expect(result).toEqual({
        startRow: 1,
        startCol: 0,
        endRow: 5,
        endCol: 2,
      });
    });

    it("resolves #Data (with header and total)", () => {
      useTableStore.getState().setShowTotalRow("table-1", true);
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#Data");
      expect(result).toEqual({
        startRow: 1,
        startCol: 0,
        endRow: 4,
        endCol: 2,
      });
    });

    it("resolves #Headers", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#Headers");
      expect(result).toEqual({
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 2,
      });
    });

    it("returns null for #Headers when no header row", () => {
      useTableStore.getState().setShowHeaderRow("table-1", false);
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#Headers");
      expect(result).toBeNull();
    });

    it("resolves #Totals", () => {
      useTableStore.getState().setShowTotalRow("table-1", true);
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#Totals");
      expect(result).toEqual({
        startRow: 5,
        startCol: 0,
        endRow: 5,
        endCol: 2,
      });
    });

    it("returns null for #Totals when no total row", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#Totals");
      expect(result).toBeNull();
    });

    it("resolves #This Row", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#This Row", 3);
      expect(result).toEqual({
        startRow: 3,
        startCol: 0,
        endRow: 3,
        endCol: 2,
      });
    });

    it("returns null for #This Row without currentRow", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#This Row");
      expect(result).toBeNull();
    });

    it("returns null for #This Row outside data range", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "#This Row", 0);
      expect(result).toBeNull();
    });

    it("resolves @ (alias for #This Row)", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "@", 2);
      expect(result).toEqual({
        startRow: 2,
        startCol: 0,
        endRow: 2,
        endCol: 2,
      });
    });

    it("resolves column by name", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "Quantity");
      expect(result).toEqual({
        startRow: 1,
        startCol: 1,
        endRow: 5,
        endCol: 1,
      });
    });

    it("column name resolution is case-insensitive", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "price");
      expect(result).toEqual({
        startRow: 1,
        startCol: 2,
        endRow: 5,
        endCol: 2,
      });
    });

    it("returns null for unknown table name", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Unknown", "#Data");
      expect(result).toBeNull();
    });

    it("returns null for unknown column name", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "Missing");
      expect(result).toBeNull();
    });

    it("table name resolution is case-insensitive", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("sales", "#Data");
      expect(result).not.toBeNull();
    });

    it("resolves @ColumnName to current row intersected with column", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "@Price", 3);
      expect(result).toEqual({
        startRow: 3,
        startCol: 2,
        endRow: 3,
        endCol: 2,
      });
    });

    it("@ColumnName is case-insensitive", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "@quantity", 2);
      expect(result).toEqual({
        startRow: 2,
        startCol: 1,
        endRow: 2,
        endCol: 1,
      });
    });

    it("returns null for @ColumnName without currentRow", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "@Price");
      expect(result).toBeNull();
    });

    it("returns null for @ColumnName outside data range", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "@Price", 0);
      expect(result).toBeNull();
    });

    it("returns null for @ColumnName with unknown column", () => {
      const result = useTableStore
        .getState()
        .resolveStructuredRef("Sales", "@Missing", 3);
      expect(result).toBeNull();
    });
  });

  describe("header-aware operations", () => {
    it("getTableHeaders returns header names", () => {
      useTableStore.getState().createTable(makeTable());
      const headers = useTableStore.getState().getTableHeaders("table-1");
      expect(headers).toEqual(["Product", "Quantity", "Price"]);
    });

    it("sortTableByColumn sorts ascending", () => {
      useTableStore.getState().createTable(makeTable());
      const cells = new Map<string, CellData>();
      // Row 0: header
      cells.set(getCellKey(0, 1), { value: "Quantity" });
      // Rows 1-5: data
      cells.set(getCellKey(1, 1), { value: 30 });
      cells.set(getCellKey(2, 1), { value: 10 });
      cells.set(getCellKey(3, 1), { value: 50 });
      cells.set(getCellKey(4, 1), { value: 20 });
      cells.set(getCellKey(5, 1), { value: 40 });

      const sorted = useTableStore
        .getState()
        .sortTableByColumn("table-1", "Quantity", "asc", cells);

      expect(sorted.get(getCellKey(1, 1))?.value).toBe(10);
      expect(sorted.get(getCellKey(2, 1))?.value).toBe(20);
      expect(sorted.get(getCellKey(3, 1))?.value).toBe(30);
      expect(sorted.get(getCellKey(4, 1))?.value).toBe(40);
      expect(sorted.get(getCellKey(5, 1))?.value).toBe(50);
    });

    it("sortTableByColumn sorts descending", () => {
      useTableStore.getState().createTable(makeTable());
      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 30 });
      cells.set(getCellKey(2, 1), { value: 10 });
      cells.set(getCellKey(3, 1), { value: 50 });

      const sorted = useTableStore
        .getState()
        .sortTableByColumn("table-1", "Quantity", "desc", cells);

      expect(sorted.get(getCellKey(1, 1))?.value).toBe(50);
      expect(sorted.get(getCellKey(2, 1))?.value).toBe(30);
      expect(sorted.get(getCellKey(3, 1))?.value).toBe(10);
    });

    it("filterTableByColumn returns hidden rows", () => {
      useTableStore.getState().createTable(makeTable());
      const cells = new Map<string, CellData>();
      cells.set(getCellKey(1, 1), { value: 30 });
      cells.set(getCellKey(2, 1), { value: 10 });
      cells.set(getCellKey(3, 1), { value: 50 });
      cells.set(getCellKey(4, 1), { value: 5 });
      cells.set(getCellKey(5, 1), { value: 25 });

      const hidden = useTableStore
        .getState()
        .filterTableByColumn(
          "table-1",
          "Quantity",
          cells,
          (v: string | number | boolean | null) => {
            return typeof v === "number" && v >= 20;
          },
        );

      expect(hidden.has(2)).toBe(true); // 10 < 20
      expect(hidden.has(4)).toBe(true); // 5 < 20
      expect(hidden.has(1)).toBe(false); // 30 >= 20
      expect(hidden.has(3)).toBe(false); // 50 >= 20
      expect(hidden.has(5)).toBe(false); // 25 >= 20
    });

    it("returns original cells if table not found for sort", () => {
      const cells = new Map<string, CellData>();
      cells.set("0,0", { value: 1 });
      const result = useTableStore
        .getState()
        .sortTableByColumn("missing", "Col", "asc", cells);
      expect(result).toBe(cells);
    });

    it("returns empty set if table not found for filter", () => {
      const cells = new Map<string, CellData>();
      const result = useTableStore
        .getState()
        .filterTableByColumn("missing", "Col", cells, () => true);
      expect(result.size).toBe(0);
    });
  });
});

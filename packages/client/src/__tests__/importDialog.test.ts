/**
 * Tests for Import Dialog functionality (Issue #144).
 * Tests CSV/TSV parsing, import modes, and UI store state.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useGridStore } from "../stores/gridStore";
import { parseCSV, detectDelimiter } from "../utils/fileOps";

const SHEET = "test-sheet";

function resetStores() {
  useCellStore.setState({ cells: new Map() });
  useSpreadsheetStore.setState({ activeSheetId: SHEET });
  useCellStore.getState().ensureSheet(SHEET);
  useGridStore.getState().setTotalRows(100);
  useGridStore.getState().setTotalCols(26);
  useUIStore.getState().setImportDialogOpen(false);
}

describe("Import Dialog UI Store", () => {
  beforeEach(resetStores);

  it("opens and closes the import dialog", () => {
    expect(useUIStore.getState().isImportDialogOpen).toBe(false);
    useUIStore.getState().setImportDialogOpen(true);
    expect(useUIStore.getState().isImportDialogOpen).toBe(true);
    useUIStore.getState().setImportDialogOpen(false);
    expect(useUIStore.getState().isImportDialogOpen).toBe(false);
  });
});

describe("CSV Parsing for Import", () => {
  it("parses simple CSV data", () => {
    const text = "Name,Age,City\nAlice,30,NYC\nBob,25,LA";
    const rows = parseCSV(text);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(["Name", "Age", "City"]);
    expect(rows[1]).toEqual(["Alice", "30", "NYC"]);
    expect(rows[2]).toEqual(["Bob", "25", "LA"]);
  });

  it("parses TSV data", () => {
    const text = "Name\tAge\tCity\nAlice\t30\tNYC";
    const rows = parseCSV(text, "\t");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["Name", "Age", "City"]);
  });

  it("handles quoted fields with commas", () => {
    const text = '"Last, First",Age\n"Doe, John",30';
    const rows = parseCSV(text);
    expect(rows[0][0]).toBe("Last, First");
    expect(rows[1][0]).toBe("Doe, John");
  });

  it("handles empty fields", () => {
    const text = "a,,c\n,b,";
    const rows = parseCSV(text);
    expect(rows[0]).toEqual(["a", "", "c"]);
    expect(rows[1]).toEqual(["", "b", ""]);
  });
});

describe("Separator Detection for Import", () => {
  it("detects comma separator", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
  });

  it("detects tab separator", () => {
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("detects semicolon separator", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
  });
});

describe("Import into cells", () => {
  beforeEach(resetStores);

  it("imports CSV rows into a new sheet via insert-sheet mode", () => {
    const rows = parseCSV("Name,Age\nAlice,30\nBob,25");
    const cellStore = useCellStore.getState();
    const spreadsheetStore = useSpreadsheetStore.getState();

    // Simulate insert-sheet: add new sheet and populate
    spreadsheetStore.addSheet("Imported");
    const sheets = useSpreadsheetStore.getState().sheets;
    const newSheet = sheets[sheets.length - 1];

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] !== "") {
          cellStore.setCell(newSheet.id, r, c, { value: rows[r][c] });
        }
      }
    }

    expect(useCellStore.getState().getCell(newSheet.id, 0, 0)?.value).toBe(
      "Name",
    );
    expect(useCellStore.getState().getCell(newSheet.id, 0, 1)?.value).toBe(
      "Age",
    );
    expect(useCellStore.getState().getCell(newSheet.id, 1, 0)?.value).toBe(
      "Alice",
    );
    expect(useCellStore.getState().getCell(newSheet.id, 2, 1)?.value).toBe(
      "25",
    );
  });

  it("imports CSV rows into current sheet via replace-sheet mode", () => {
    const cellStore = useCellStore.getState();

    // Set existing data
    cellStore.setCell(SHEET, 0, 0, { value: "old" });

    // Parse new data
    const rows = parseCSV("new1,new2\nnew3,new4");

    // Simulate replace: clear and write
    cellStore.setCell(SHEET, 0, 0, { value: null });
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        cellStore.setCell(SHEET, r, c, { value: rows[r][c] });
      }
    }

    expect(useCellStore.getState().getCell(SHEET, 0, 0)?.value).toBe("new1");
    expect(useCellStore.getState().getCell(SHEET, 1, 1)?.value).toBe("new4");
  });

  it("appends CSV rows to current sheet via append-sheet mode", () => {
    const cellStore = useCellStore.getState();

    // Set existing data in rows 0-1
    cellStore.setCell(SHEET, 0, 0, { value: "existing" });
    cellStore.setCell(SHEET, 1, 0, { value: "data" });

    // Parse new data
    const rows = parseCSV("appended1\nappended2");

    // Find last row and append
    let maxRow = -1;
    const sheetCells = useCellStore.getState().cells.get(SHEET);
    if (sheetCells) {
      for (const key of sheetCells.keys()) {
        const r = parseInt(key.split(",")[0], 10);
        if (r > maxRow) maxRow = r;
      }
    }
    const startRow = maxRow + 1;

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        cellStore.setCell(SHEET, startRow + r, c, { value: rows[r][c] });
      }
    }

    // Original data preserved
    expect(useCellStore.getState().getCell(SHEET, 0, 0)?.value).toBe(
      "existing",
    );
    // Appended data starts at row 2
    expect(useCellStore.getState().getCell(SHEET, 2, 0)?.value).toBe(
      "appended1",
    );
    expect(useCellStore.getState().getCell(SHEET, 3, 0)?.value).toBe(
      "appended2",
    );
  });
});

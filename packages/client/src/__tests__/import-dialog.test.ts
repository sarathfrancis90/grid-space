/**
 * Tests for Import Dialog functionality (issue #144).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { parseCSV, detectDelimiter } from "../utils/fileOps";

const SHEET = "test-sheet";

function resetStores() {
  useCellStore.setState({ cells: new Map() });
  useSpreadsheetStore.setState({
    activeSheetId: SHEET,
  });
  useCellStore.getState().ensureSheet(SHEET);
  useUIStore.getState().setImportDialogOpen(false);
}

describe("Import Dialog — UI Store", () => {
  beforeEach(resetStores);

  it("opens and closes the import dialog", () => {
    expect(useUIStore.getState().isImportDialogOpen).toBe(false);
    useUIStore.getState().setImportDialogOpen(true);
    expect(useUIStore.getState().isImportDialogOpen).toBe(true);
    useUIStore.getState().setImportDialogOpen(false);
    expect(useUIStore.getState().isImportDialogOpen).toBe(false);
  });
});

describe("Import — CSV parsing for import", () => {
  it("parses CSV with comma delimiter", () => {
    const rows = parseCSV("Name,Age,City\nAlice,30,NYC\nBob,25,LA");
    expect(rows).toEqual([
      ["Name", "Age", "City"],
      ["Alice", "30", "NYC"],
      ["Bob", "25", "LA"],
    ]);
  });

  it("parses TSV data", () => {
    const rows = parseCSV("Name\tAge\nAlice\t30", "\t");
    expect(rows).toEqual([
      ["Name", "Age"],
      ["Alice", "30"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    const rows = parseCSV('"Hello, World",42\n"Foo ""bar""",7');
    expect(rows).toEqual([
      ["Hello, World", "42"],
      ['Foo "bar"', "7"],
    ]);
  });

  it("auto-detects tab delimiter", () => {
    expect(detectDelimiter("A\tB\tC\n1\t2\t3")).toBe("\t");
  });

  it("auto-detects semicolon delimiter", () => {
    expect(detectDelimiter("A;B;C\n1;2;3")).toBe(";");
  });

  it("defaults to comma delimiter", () => {
    expect(detectDelimiter("A,B,C\n1,2,3")).toBe(",");
  });
});

describe("Import — batch cell update simulation", () => {
  beforeEach(resetStores);

  it("imports rows into a new sheet via setCellBatch", () => {
    const store = useSpreadsheetStore.getState();
    store.addSheet("Imported");
    const sheets = useSpreadsheetStore.getState().sheets;
    const newSheet = sheets[sheets.length - 1];

    const updates = [
      {
        row: 0,
        col: 0,
        data: { value: "Name" as string | number | boolean | null },
      },
      {
        row: 0,
        col: 1,
        data: { value: "Age" as string | number | boolean | null },
      },
      {
        row: 1,
        col: 0,
        data: { value: "Alice" as string | number | boolean | null },
      },
      {
        row: 1,
        col: 1,
        data: { value: 30 as string | number | boolean | null },
      },
    ];
    useCellStore.getState().setCellBatch(newSheet.id, updates);

    expect(useCellStore.getState().getCell(newSheet.id, 0, 0)?.value).toBe(
      "Name",
    );
    expect(useCellStore.getState().getCell(newSheet.id, 0, 1)?.value).toBe(
      "Age",
    );
    expect(useCellStore.getState().getCell(newSheet.id, 1, 0)?.value).toBe(
      "Alice",
    );
    expect(useCellStore.getState().getCell(newSheet.id, 1, 1)?.value).toBe(30);
  });

  it("replaces current sheet by clearing and setting new data", () => {
    // Set existing data
    useCellStore.getState().setCell(SHEET, 0, 0, { value: "Old" });
    expect(useCellStore.getState().getCell(SHEET, 0, 0)?.value).toBe("Old");

    // Clear and replace
    useCellStore.getState().clearSheet(SHEET);
    useCellStore
      .getState()
      .setCellBatch(SHEET, [{ row: 0, col: 0, data: { value: "New" } }]);

    expect(useCellStore.getState().getCell(SHEET, 0, 0)?.value).toBe("New");
  });

  it("appends data after existing rows", () => {
    useCellStore.getState().setCell(SHEET, 0, 0, { value: "Existing" });

    // Append at row 1
    useCellStore
      .getState()
      .setCellBatch(SHEET, [{ row: 1, col: 0, data: { value: "Appended" } }]);

    expect(useCellStore.getState().getCell(SHEET, 0, 0)?.value).toBe(
      "Existing",
    );
    expect(useCellStore.getState().getCell(SHEET, 1, 0)?.value).toBe(
      "Appended",
    );
  });
});

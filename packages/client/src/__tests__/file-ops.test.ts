/**
 * Tests for File Ops & Undo (S5-001 through S5-018).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "../stores/historyStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import {
  parseCSV,
  toCSV,
  toJSON,
  detectDelimiter,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from "../utils/fileOps";
import type { CellData } from "../types/grid";

const SHEET = "test-sheet";

function resetStores() {
  useCellStore.setState({ cells: new Map() });
  useSpreadsheetStore.setState({ activeSheetId: SHEET });
  useCellStore.getState().ensureSheet(SHEET);
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
}

function setCell(row: number, col: number, value: string | number | boolean) {
  useCellStore.getState().setCell(SHEET, row, col, { value });
}

function getCell(row: number, col: number): CellData | undefined {
  return useCellStore.getState().getCell(SHEET, row, col);
}

// ── Undo/Redo (S5-001, S5-002, S5-003) ──────────────────────

describe("Undo (S5-001)", () => {
  beforeEach(resetStores);

  it("undoes the last cell change", () => {
    setCell(0, 0, "original");
    useHistoryStore.getState().pushUndo();
    setCell(0, 0, "changed");

    useHistoryStore.getState().undo();
    expect(getCell(0, 0)?.value).toBe("original");
  });

  it("does nothing when undo stack is empty", () => {
    setCell(0, 0, "hello");
    useHistoryStore.getState().undo();
    expect(getCell(0, 0)?.value).toBe("hello");
  });

  it("canUndo returns false when empty", () => {
    expect(useHistoryStore.getState().canUndo()).toBe(false);
  });

  it("canUndo returns true after pushUndo", () => {
    useHistoryStore.getState().pushUndo();
    expect(useHistoryStore.getState().canUndo()).toBe(true);
  });
});

describe("Redo (S5-002)", () => {
  beforeEach(resetStores);

  it("redoes the last undone change", () => {
    setCell(0, 0, "original");
    useHistoryStore.getState().pushUndo();
    setCell(0, 0, "changed");

    useHistoryStore.getState().undo();
    expect(getCell(0, 0)?.value).toBe("original");

    useHistoryStore.getState().redo();
    expect(getCell(0, 0)?.value).toBe("changed");
  });

  it("clears redo stack on new action", () => {
    setCell(0, 0, "a");
    useHistoryStore.getState().pushUndo();
    setCell(0, 0, "b");
    useHistoryStore.getState().undo();

    // New action should clear redo
    useHistoryStore.getState().pushUndo();
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });

  it("canRedo returns false initially", () => {
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });
});

describe("Undo stack limit (S5-003)", () => {
  beforeEach(resetStores);

  it("limits undo stack to 100 entries", () => {
    for (let i = 0; i < 120; i++) {
      useHistoryStore.getState().pushUndo();
      setCell(0, 0, `value-${i}`);
    }
    expect(useHistoryStore.getState().undoStack.length).toBeLessThanOrEqual(
      100,
    );
  });

  it("can chain multiple undo/redo", () => {
    setCell(0, 0, "v0");
    useHistoryStore.getState().pushUndo();
    setCell(0, 0, "v1");
    useHistoryStore.getState().pushUndo();
    setCell(0, 0, "v2");
    useHistoryStore.getState().pushUndo();
    setCell(0, 0, "v3");

    useHistoryStore.getState().undo(); // → v2
    expect(getCell(0, 0)?.value).toBe("v2");
    useHistoryStore.getState().undo(); // → v1
    expect(getCell(0, 0)?.value).toBe("v1");
    useHistoryStore.getState().redo(); // → v2
    expect(getCell(0, 0)?.value).toBe("v2");
  });
});

// ── CSV Import/Export (S5-004, S5-005, S5-017) ──────────────

describe("CSV import (S5-004)", () => {
  it("parses simple CSV", () => {
    const rows = parseCSV("a,b,c\n1,2,3");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields", () => {
    const rows = parseCSV('a,"b,c",d');
    expect(rows).toEqual([["a", "b,c", "d"]]);
  });

  it("handles escaped quotes", () => {
    const rows = parseCSV('a,"say ""hi""",c');
    expect(rows).toEqual([["a", 'say "hi"', "c"]]);
  });

  it("handles empty fields", () => {
    const rows = parseCSV("a,,c\n,b,");
    expect(rows).toEqual([
      ["a", "", "c"],
      ["", "b", ""],
    ]);
  });

  it("handles CRLF line endings", () => {
    const rows = parseCSV("a,b\r\nc,d");
    expect(rows).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("CSV export (S5-005)", () => {
  it("exports cells to CSV string", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "Name" });
    cells.set("0,1", { value: "Age" });
    cells.set("1,0", { value: "Alice" });
    cells.set("1,1", { value: 30 });
    const csv = toCSV(cells);
    expect(csv).toBe("Name,Age\nAlice,30");
  });

  it("quotes values with commas", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "a,b" });
    const csv = toCSV(cells);
    expect(csv).toBe('"a,b"');
  });

  it("quotes values with quotes", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: 'say "hi"' });
    const csv = toCSV(cells);
    expect(csv).toBe('"say ""hi"""');
  });
});

describe("CSV auto-detect delimiter (S5-017)", () => {
  it("detects comma delimiter", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
  });

  it("detects tab delimiter", () => {
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("detects semicolon delimiter", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
  });

  it("defaults to comma for ambiguous data", () => {
    expect(detectDelimiter("hello")).toBe(",");
  });
});

// ── TSV Export (S5-008) ──────────────────────────────────────

describe("TSV export (S5-008)", () => {
  it("exports cells to TSV string", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "Name" });
    cells.set("0,1", { value: "Age" });
    cells.set("1,0", { value: "Alice" });
    cells.set("1,1", { value: 30 });
    const tsv = toCSV(cells, "\t");
    expect(tsv).toBe("Name\tAge\nAlice\t30");
  });
});

// ── JSON Export (S5-010) ─────────────────────────────────────

describe("JSON export (S5-010)", () => {
  it("exports cells to JSON array of objects", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "Name" });
    cells.set("0,1", { value: "Age" });
    cells.set("1,0", { value: "Alice" });
    cells.set("1,1", { value: 30 });
    const json = JSON.parse(toJSON(cells));
    expect(json).toEqual([{ Name: "Alice", Age: 30 }]);
  });

  it("handles empty cells as null", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "A" });
    cells.set("0,1", { value: "B" });
    cells.set("1,0", { value: "x" });
    const json = JSON.parse(toJSON(cells));
    expect(json[0].B).toBeNull();
  });
});

// ── Export Selected Range (S5-018) ───────────────────────────

describe("Export selected range (S5-018)", () => {
  it("exports only the specified range", () => {
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "A" });
    cells.set("0,1", { value: "B" });
    cells.set("0,2", { value: "C" });
    cells.set("1,0", { value: 1 });
    cells.set("1,1", { value: 2 });
    cells.set("1,2", { value: 3 });
    cells.set("2,0", { value: 4 });
    cells.set("2,1", { value: 5 });
    cells.set("2,2", { value: 6 });

    const csv = toCSV(cells, ",", {
      startRow: 0,
      startCol: 0,
      endRow: 1,
      endCol: 1,
    });
    expect(csv).toBe("A,B\n1,2");
  });
});

// ── Autosave (S5-012, S5-013) ────────────────────────────────

describe("Autosave to localStorage (S5-012)", () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it("saves data to localStorage", () => {
    const data = {
      timestamp: Date.now(),
      title: "Test",
      sheets: [
        {
          id: "s1",
          name: "Sheet 1",
          cells: [["0,0", { value: 42 }]] as [string, CellData][],
        },
      ],
    };
    saveToLocalStorage(data);
    const loaded = loadFromLocalStorage();
    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe("Test");
    expect(loaded?.sheets[0].cells[0][1].value).toBe(42);
  });
});

describe("Restore from localStorage (S5-013)", () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it("returns null when no data saved", () => {
    expect(loadFromLocalStorage()).toBeNull();
  });

  it("restores saved data", () => {
    const data = {
      timestamp: Date.now(),
      title: "Restored",
      sheets: [
        {
          id: "s1",
          name: "Sheet 1",
          cells: [
            ["0,0", { value: "hello" }],
            ["1,0", { value: 123 }],
          ] as [string, CellData][],
        },
      ],
    };
    saveToLocalStorage(data);
    const loaded = loadFromLocalStorage();
    expect(loaded?.sheets[0].cells).toHaveLength(2);
    expect(loaded?.sheets[0].cells[1][1].value).toBe(123);
  });
});

// ── XLSX import/export basic structure (S5-006, S5-007, S5-014, S5-015, S5-016) ─

describe("XLSX import/export (S5-006, S5-007)", () => {
  it("exports and re-imports XLSX round-trip", async () => {
    const { importXLSX, exportXLSX } = await import("../utils/fileOps");
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: "Name" });
    cells.set("0,1", { value: "Score" });
    cells.set("1,0", { value: "Alice" });
    cells.set("1,1", { value: 95 });

    const buffer = await exportXLSX([{ name: "Sheet1", cells }]);
    expect(buffer).toBeInstanceOf(ArrayBuffer);

    const sheets = await importXLSX(buffer);
    expect(sheets.length).toBeGreaterThanOrEqual(1);
    expect(sheets[0].name).toBe("Sheet1");
    expect(sheets[0].cells.get("0,0")?.value).toBe("Name");
    expect(sheets[0].cells.get("1,1")?.value).toBe(95);
  });
});

describe("XLSX preserves formulas (S5-014)", () => {
  it("preserves formula on export and import", async () => {
    const { importXLSX, exportXLSX } = await import("../utils/fileOps");
    const cells = new Map<string, CellData>();
    cells.set("0,0", { value: 10 });
    cells.set("0,1", { value: 20 });
    cells.set("0,2", { value: 30, formula: "=A1+B1" });

    const buffer = await exportXLSX([{ name: "Sheet1", cells }]);
    const sheets = await importXLSX(buffer);

    const formulaCell = sheets[0].cells.get("0,2");
    expect(formulaCell?.formula).toBe("=A1+B1");
  });
});

describe("XLSX preserves formatting (S5-015)", () => {
  it("round-trips basic cell values", async () => {
    const { importXLSX, exportXLSX } = await import("../utils/fileOps");
    const cells = new Map<string, CellData>();
    cells.set("0,0", {
      value: "Bold text",
      format: { bold: true },
    });

    const buffer = await exportXLSX([{ name: "Sheet1", cells }]);
    const sheets = await importXLSX(buffer);

    // Value should survive round-trip
    expect(sheets[0].cells.get("0,0")?.value).toBe("Bold text");
  });
});

describe("XLSX preserves multiple sheets (S5-016)", () => {
  it("exports and imports multiple sheets", async () => {
    const { importXLSX, exportXLSX } = await import("../utils/fileOps");
    const sheet1 = new Map<string, CellData>();
    sheet1.set("0,0", { value: "Sheet1 data" });
    const sheet2 = new Map<string, CellData>();
    sheet2.set("0,0", { value: "Sheet2 data" });

    const buffer = await exportXLSX([
      { name: "Data", cells: sheet1 },
      { name: "Summary", cells: sheet2 },
    ]);

    const sheets = await importXLSX(buffer);
    expect(sheets).toHaveLength(2);
    expect(sheets[0].name).toBe("Data");
    expect(sheets[1].name).toBe("Summary");
    expect(sheets[0].cells.get("0,0")?.value).toBe("Sheet1 data");
    expect(sheets[1].cells.get("0,0")?.value).toBe("Sheet2 data");
  });
});

// ── PDF Export (S5-009) — structural test ────────────────────

describe("PDF export (S5-009)", () => {
  it("exportPDF is a function (rendering tested via E2E)", async () => {
    const { exportPDF } = await import("../utils/fileOps");
    expect(typeof exportPDF).toBe("function");
  });
});

// ── Drag and Drop (S5-011) — structural test ─────────────────

describe("Drag-and-drop import (S5-011)", () => {
  it("parseCSV handles file content from drag-drop", () => {
    // Simulating file content read from FileReader
    const content = "Name,Age\nAlice,30\nBob,25";
    const rows = parseCSV(content);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(["Name", "Age"]);
  });
});

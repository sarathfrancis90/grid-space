/**
 * Tests for Download as CSV menu action.
 * Verifies that the toCSV + downloadFile integration works correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { toCSV, downloadFile } from "../utils/fileOps";

const SHEET = "test-sheet";

function resetStores() {
  useCellStore.setState({ cells: new Map() });
  useSpreadsheetStore.setState({ activeSheetId: SHEET });
  useCellStore.getState().ensureSheet(SHEET);
}

describe("Download as CSV", () => {
  beforeEach(resetStores);

  it("generates correct CSV from active sheet cells", () => {
    useCellStore.getState().setCell(SHEET, 0, 0, { value: "Name" });
    useCellStore.getState().setCell(SHEET, 0, 1, { value: "Age" });
    useCellStore.getState().setCell(SHEET, 1, 0, { value: "Alice" });
    useCellStore.getState().setCell(SHEET, 1, 1, { value: 30 });

    const cells = useCellStore.getState().cells.get(SHEET) ?? new Map();
    const csv = toCSV(cells);

    expect(csv).toBe("Name,Age\nAlice,30");
  });

  it("handles empty sheet gracefully", () => {
    const cells = useCellStore.getState().cells.get(SHEET) ?? new Map();
    const csv = toCSV(cells);
    expect(csv).toBe("");
  });

  it("quotes fields containing commas", () => {
    useCellStore.getState().setCell(SHEET, 0, 0, { value: "hello, world" });

    const cells = useCellStore.getState().cells.get(SHEET) ?? new Map();
    const csv = toCSV(cells);

    expect(csv).toBe('"hello, world"');
  });

  it("downloadFile creates and clicks a blob link", () => {
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    const clickSpy = vi.fn();

    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const el = origCreateElement("a");
        el.click = clickSpy;
        return el;
      }
      return origCreateElement(tag);
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(
      (node: Node) => node,
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      (node: Node) => node,
    );

    downloadFile("Name,Age\nAlice,30", "spreadsheet.csv", "text/csv");

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});

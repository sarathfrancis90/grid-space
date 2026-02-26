import { describe, it, expect, beforeEach } from "vitest";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

describe("spreadsheetStore", () => {
  beforeEach(() => {
    useSpreadsheetStore.setState({
      id: "spreadsheet-1",
      title: "Untitled Spreadsheet",
      sheets: [
        {
          id: "sheet-1",
          name: "Sheet 1",
          cells: new Map(),
          columnWidths: new Map(),
          rowHeights: new Map(),
          frozenRows: 0,
          frozenCols: 0,
          hiddenRows: new Set(),
          hiddenCols: new Set(),
        },
      ],
      activeSheetId: "sheet-1",
    });
  });

  it("adds a new sheet", () => {
    useSpreadsheetStore.getState().addSheet();
    const sheets = useSpreadsheetStore.getState().sheets;
    expect(sheets).toHaveLength(2);
    expect(sheets[1].name).toBe("Sheet 2");
  });

  it("adds a sheet with custom name", () => {
    useSpreadsheetStore.getState().addSheet("My Sheet");
    const sheets = useSpreadsheetStore.getState().sheets;
    expect(sheets[1].name).toBe("My Sheet");
  });

  it("removes a sheet", () => {
    useSpreadsheetStore.getState().addSheet();
    const sheetId = useSpreadsheetStore.getState().sheets[1].id;

    useSpreadsheetStore.getState().removeSheet(sheetId);
    expect(useSpreadsheetStore.getState().sheets).toHaveLength(1);
  });

  it("does not remove the last sheet", () => {
    useSpreadsheetStore.getState().removeSheet("sheet-1");
    expect(useSpreadsheetStore.getState().sheets).toHaveLength(1);
  });

  it("switches active sheet when removing active", () => {
    useSpreadsheetStore.getState().addSheet();
    const secondId = useSpreadsheetStore.getState().sheets[1].id;
    useSpreadsheetStore.getState().setActiveSheet(secondId);
    useSpreadsheetStore.getState().removeSheet(secondId);

    expect(useSpreadsheetStore.getState().activeSheetId).toBe("sheet-1");
  });

  it("renames a sheet", () => {
    useSpreadsheetStore.getState().renameSheet("sheet-1", "Data");
    expect(useSpreadsheetStore.getState().sheets[0].name).toBe("Data");
  });

  it("duplicates a sheet", () => {
    useSpreadsheetStore.getState().setTabColor("sheet-1", "#ff0000");
    useSpreadsheetStore.getState().duplicateSheet("sheet-1");

    const sheets = useSpreadsheetStore.getState().sheets;
    expect(sheets).toHaveLength(2);
    expect(sheets[1].name).toBe("Sheet 1 (Copy)");
    expect(sheets[1].tabColor).toBe("#ff0000");
    expect(sheets[1].id).not.toBe("sheet-1");
  });

  it("reorders sheets", () => {
    useSpreadsheetStore.getState().addSheet("Sheet 2");
    useSpreadsheetStore.getState().addSheet("Sheet 3");

    useSpreadsheetStore.getState().reorderSheet(2, 0);
    const names = useSpreadsheetStore.getState().sheets.map((s) => s.name);
    expect(names).toEqual(["Sheet 3", "Sheet 1", "Sheet 2"]);
  });

  it("does not reorder with out-of-bounds indices", () => {
    useSpreadsheetStore.getState().reorderSheet(-1, 0);
    expect(useSpreadsheetStore.getState().sheets).toHaveLength(1);

    useSpreadsheetStore.getState().reorderSheet(0, 5);
    expect(useSpreadsheetStore.getState().sheets).toHaveLength(1);
  });

  it("sets tab color", () => {
    useSpreadsheetStore.getState().setTabColor("sheet-1", "#00ff00");
    expect(useSpreadsheetStore.getState().sheets[0].tabColor).toBe("#00ff00");

    useSpreadsheetStore.getState().setTabColor("sheet-1", undefined);
    expect(useSpreadsheetStore.getState().sheets[0].tabColor).toBeUndefined();
  });

  it("sets active sheet", () => {
    useSpreadsheetStore.getState().addSheet();
    const secondId = useSpreadsheetStore.getState().sheets[1].id;

    useSpreadsheetStore.getState().setActiveSheet(secondId);
    expect(useSpreadsheetStore.getState().activeSheetId).toBe(secondId);
  });

  it("gets active sheet", () => {
    const activeSheet = useSpreadsheetStore.getState().getActiveSheet();
    expect(activeSheet?.id).toBe("sheet-1");
    expect(activeSheet?.name).toBe("Sheet 1");
  });
});

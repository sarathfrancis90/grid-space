import { describe, it, expect, beforeEach } from "vitest";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

function resetStores() {
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

  useCellStore.setState({
    cells: new Map(),
  });
}

describe("cellStore.moveCells", () => {
  beforeEach(resetStores);

  it("moves a single cell to a new position", () => {
    const store = useCellStore.getState();
    store.setCell("sheet-1", 0, 0, { value: "hello" });

    store.moveCells("sheet-1", 0, 0, 0, 0, 2, 3);

    expect(store.getCell("sheet-1", 0, 0)).toBeUndefined();
    expect(store.getCell("sheet-1", 2, 3)?.value).toBe("hello");
  });

  it("moves a range of cells", () => {
    const store = useCellStore.getState();
    store.setCell("sheet-1", 0, 0, { value: "A1" });
    store.setCell("sheet-1", 0, 1, { value: "B1" });
    store.setCell("sheet-1", 1, 0, { value: "A2" });
    store.setCell("sheet-1", 1, 1, { value: "B2" });

    store.moveCells("sheet-1", 0, 0, 1, 1, 3, 3);

    // Original positions should be empty
    expect(store.getCell("sheet-1", 0, 0)).toBeUndefined();
    expect(store.getCell("sheet-1", 0, 1)).toBeUndefined();
    expect(store.getCell("sheet-1", 1, 0)).toBeUndefined();
    expect(store.getCell("sheet-1", 1, 1)).toBeUndefined();

    // New positions should have the data
    expect(store.getCell("sheet-1", 3, 3)?.value).toBe("A1");
    expect(store.getCell("sheet-1", 3, 4)?.value).toBe("B1");
    expect(store.getCell("sheet-1", 4, 3)?.value).toBe("A2");
    expect(store.getCell("sheet-1", 4, 4)?.value).toBe("B2");
  });

  it("preserves cell formatting during move", () => {
    const store = useCellStore.getState();
    store.setCell("sheet-1", 0, 0, {
      value: "styled",
      format: { bold: true, textColor: "#ff0000" },
    });

    store.moveCells("sheet-1", 0, 0, 0, 0, 5, 5);

    const moved = store.getCell("sheet-1", 5, 5);
    expect(moved?.value).toBe("styled");
    expect(moved?.format?.bold).toBe(true);
    expect(moved?.format?.textColor).toBe("#ff0000");
  });

  it("clears source range even with empty cells in between", () => {
    const store = useCellStore.getState();
    store.setCell("sheet-1", 0, 0, { value: "A1" });
    // 0,1 is empty
    store.setCell("sheet-1", 0, 2, { value: "C1" });

    store.moveCells("sheet-1", 0, 0, 0, 2, 2, 0);

    expect(store.getCell("sheet-1", 0, 0)).toBeUndefined();
    expect(store.getCell("sheet-1", 0, 2)).toBeUndefined();
    expect(store.getCell("sheet-1", 2, 0)?.value).toBe("A1");
    expect(store.getCell("sheet-1", 2, 2)?.value).toBe("C1");
  });

  it("handles move with reversed range coordinates", () => {
    const store = useCellStore.getState();
    store.setCell("sheet-1", 2, 2, { value: "data" });

    // Pass end before start - range normalized to (0,0)-(2,2)
    // Cell at (2,2) has offset (2,2) from top-left of range
    // So it ends up at target (5,5) + offset (2,2) = (7,7)
    store.moveCells("sheet-1", 2, 2, 0, 0, 5, 5);

    expect(store.getCell("sheet-1", 2, 2)).toBeUndefined();
    expect(store.getCell("sheet-1", 7, 7)?.value).toBe("data");
  });
});

describe("spreadsheetStore - hide/show sheets", () => {
  beforeEach(resetStores);

  it("hides a sheet", () => {
    const store = useSpreadsheetStore.getState();
    store.addSheet("Sheet 2");
    const sheet2Id = useSpreadsheetStore.getState().sheets[1].id;

    store.hideSheet(sheet2Id);

    const sheet2 = useSpreadsheetStore
      .getState()
      .sheets.find((s) => s.id === sheet2Id);
    expect(sheet2?.hidden).toBe(true);
  });

  it("cannot hide the last visible sheet", () => {
    useSpreadsheetStore.getState().hideSheet("sheet-1");

    const sheet1 = useSpreadsheetStore.getState().sheets[0];
    expect(sheet1.hidden).toBeFalsy();
  });

  it("switches active sheet when hiding the active one", () => {
    const store = useSpreadsheetStore.getState();
    store.addSheet("Sheet 2");
    const sheet2Id = useSpreadsheetStore.getState().sheets[1].id;
    store.setActiveSheet(sheet2Id);

    store.hideSheet(sheet2Id);

    expect(useSpreadsheetStore.getState().activeSheetId).toBe("sheet-1");
  });

  it("shows a hidden sheet and makes it active", () => {
    const store = useSpreadsheetStore.getState();
    store.addSheet("Sheet 2");
    const sheet2Id = useSpreadsheetStore.getState().sheets[1].id;
    store.hideSheet(sheet2Id);

    store.showSheet(sheet2Id);

    const sheet2 = useSpreadsheetStore
      .getState()
      .sheets.find((s) => s.id === sheet2Id);
    expect(sheet2?.hidden).toBe(false);
    expect(useSpreadsheetStore.getState().activeSheetId).toBe(sheet2Id);
  });

  it("getHiddenSheets returns only hidden sheets", () => {
    const store = useSpreadsheetStore.getState();
    store.addSheet("Sheet 2");
    store.addSheet("Sheet 3");
    const sheet2Id = useSpreadsheetStore.getState().sheets[1].id;
    store.hideSheet(sheet2Id);

    const hidden = useSpreadsheetStore.getState().getHiddenSheets();
    expect(hidden).toHaveLength(1);
    expect(hidden[0].id).toBe(sheet2Id);
  });

  it("getVisibleSheets returns only visible sheets", () => {
    const store = useSpreadsheetStore.getState();
    store.addSheet("Sheet 2");
    const sheet2Id = useSpreadsheetStore.getState().sheets[1].id;

    useSpreadsheetStore.getState().hideSheet(sheet2Id);

    const visible = useSpreadsheetStore.getState().getVisibleSheets();
    expect(visible).toHaveLength(1);
    expect(visible[0].name).toBe("Sheet 1");
  });

  it("cannot hide when only one sheet is visible", () => {
    const store = useSpreadsheetStore.getState();
    store.addSheet("Sheet 2");
    const sheet2Id = useSpreadsheetStore.getState().sheets[1].id;
    store.hideSheet(sheet2Id);

    // Now try to hide the remaining visible sheet
    store.hideSheet("sheet-1");
    expect(useSpreadsheetStore.getState().sheets[0].hidden).toBeFalsy();
  });
});

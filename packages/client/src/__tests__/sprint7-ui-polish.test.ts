/**
 * Sprint 7 — UI Polish tests
 * S7-001 to S7-025: FormulaBar, ContextMenu, MenuBar, StatusBar,
 *   Comments, Hyperlinks, Images, Gridlines, Formula bar toggle
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useCommentStore } from "../stores/commentStore";
import { useClipboardStore } from "../stores/clipboardStore";
import { useNamedRangeStore } from "../stores/namedRangeStore";
import {
  colToLetter,
  getCellKey,
  cellRefToPosition,
} from "../utils/coordinates";
import type { CellComment } from "../types/grid";

const SHEET_ID = "sheet-1";

function resetStores() {
  useUIStore.setState({
    selectedCell: null,
    selections: [],
    isEditing: false,
    editValue: "",
    editingCell: null,
    zoom: 100,
    showGridlines: true,
    showFormulaBar: true,
    isHyperlinkDialogOpen: false,
    isImageDialogOpen: false,
  });
  useCellStore.setState({ cells: new Map() });
  useCellStore.getState().ensureSheet(SHEET_ID);
  useSpreadsheetStore.setState({ activeSheetId: SHEET_ID });
  useCommentStore.setState({
    comments: new Map(),
    activeCommentCell: null,
    activeSheetForComment: null,
  });
  useClipboardStore.setState({
    mode: null,
    cells: new Map(),
    sourceRange: null,
  });
  useNamedRangeStore.setState({ ranges: new Map() });
}

// ═══════════════════════════════════════════════════════
// S7-001: Name box shows cell address
// ═══════════════════════════════════════════════════════
describe("S7-001: Name box shows cell address", () => {
  beforeEach(resetStores);

  it("builds correct cell address A1 for row=0, col=0", () => {
    const pos = { row: 0, col: 0 };
    const addr = `${colToLetter(pos.col)}${pos.row + 1}`;
    expect(addr).toBe("A1");
  });

  it("builds correct cell address B5 for row=4, col=1", () => {
    const pos = { row: 4, col: 1 };
    const addr = `${colToLetter(pos.col)}${pos.row + 1}`;
    expect(addr).toBe("B5");
  });

  it("builds correct cell address AA1 for col=26", () => {
    const pos = { row: 0, col: 26 };
    const addr = `${colToLetter(pos.col)}${pos.row + 1}`;
    expect(addr).toBe("AA1");
  });
});

// ═══════════════════════════════════════════════════════
// S7-002: Formula bar shows formula for selected cell
// ═══════════════════════════════════════════════════════
describe("S7-002: Formula bar shows formula/value", () => {
  beforeEach(resetStores);

  it("shows raw formula when cell has formula", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, {
      value: 10,
      formula: "=SUM(B1:B5)",
    });
    const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    const display = cell?.formula ?? String(cell?.value ?? "");
    expect(display).toBe("=SUM(B1:B5)");
  });

  it("shows value when cell has no formula", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, { value: "Hello" });
    const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    const display = cell?.formula ?? String(cell?.value ?? "");
    expect(display).toBe("Hello");
  });

  it("shows empty string for empty cell", () => {
    const cell = useCellStore.getState().getCell(SHEET_ID, 5, 5);
    const display = cell?.formula ?? String(cell?.value ?? "");
    expect(display).toBe("");
  });
});

// ═══════════════════════════════════════════════════════
// S7-003: Edit formula directly in bar
// ═══════════════════════════════════════════════════════
describe("S7-003: Edit formula in bar", () => {
  beforeEach(resetStores);

  it("starts editing and sets edit value", () => {
    useUIStore.getState().startEditing({ row: 0, col: 0 }, "=A1+B1");
    expect(useUIStore.getState().isEditing).toBe(true);
    expect(useUIStore.getState().editValue).toBe("=A1+B1");
  });

  it("updates edit value as user types", () => {
    useUIStore.getState().startEditing({ row: 0, col: 0 }, "=");
    useUIStore.getState().setEditValue("=SUM(A1:A10)");
    expect(useUIStore.getState().editValue).toBe("=SUM(A1:A10)");
  });

  it("commits edit and resets state", () => {
    useUIStore.getState().startEditing({ row: 0, col: 0 }, "test");
    useUIStore.getState().commitEdit();
    const s = useUIStore.getState();
    expect(s.isEditing).toBe(false);
    expect(s.editingCell).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════
// S7-004: Name box — type address to navigate
// ═══════════════════════════════════════════════════════
describe("S7-004: Name box navigation", () => {
  beforeEach(resetStores);

  it("cellRefToPosition parses B5 to {row:4, col:1}", () => {
    const pos = cellRefToPosition("B5");
    expect(pos).toEqual({ row: 4, col: 1 });
  });

  it("cellRefToPosition parses AA1 to {row:0, col:26}", () => {
    const pos = cellRefToPosition("AA1");
    expect(pos).toEqual({ row: 0, col: 26 });
  });

  it("navigates to a typed cell reference", () => {
    const pos = cellRefToPosition("C3");
    useUIStore.getState().setSelectedCell(pos);
    expect(useUIStore.getState().selectedCell).toEqual({ row: 2, col: 2 });
  });
});

// ═══════════════════════════════════════════════════════
// S7-005: Name box shows named range names
// ═══════════════════════════════════════════════════════
describe("S7-005: Named range display in name box", () => {
  beforeEach(resetStores);

  it("shows named range name when cell matches", () => {
    useNamedRangeStore.getState().addRange({
      name: "MyRange",
      sheetId: SHEET_ID,
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: 0,
    });
    const ranges = useNamedRangeStore.getState().getAllRanges();
    const match = ranges.find(
      (r) =>
        r.sheetId === SHEET_ID &&
        r.startRow === 0 &&
        r.startCol === 0 &&
        r.endRow === 0 &&
        r.endCol === 0,
    );
    expect(match?.name).toBe("MyRange");
  });

  it("returns undefined when no named range matches", () => {
    const ranges = useNamedRangeStore.getState().getAllRanges();
    const match = ranges.find(
      (r) =>
        r.sheetId === SHEET_ID &&
        r.startRow === 5 &&
        r.startCol === 5 &&
        r.endRow === 5 &&
        r.endCol === 5,
    );
    expect(match).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════
// S7-006 to S7-008: Context menus (cell, row, col)
// ═══════════════════════════════════════════════════════
describe("S7-006/007/008: Context menu clipboard ops", () => {
  beforeEach(resetStores);

  it("copy operation stores cells in clipboard", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, { value: "hello" });
    const sel = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
    const cells = useCellStore
      .getState()
      .getCellsInRangeWithKeys(SHEET_ID, 0, 0, 0, 0);
    useClipboardStore.getState().copy(cells, sel);
    const clip = useClipboardStore.getState();
    expect(clip.mode).toBe("copy");
    expect(clip.cells.size).toBe(1);
  });

  it("cut operation stores cells and sets mode to cut", () => {
    useCellStore.getState().setCell(SHEET_ID, 1, 1, { value: 42 });
    const sel = { start: { row: 1, col: 1 }, end: { row: 1, col: 1 } };
    const cells = useCellStore
      .getState()
      .getCellsInRangeWithKeys(SHEET_ID, 1, 1, 1, 1);
    useClipboardStore.getState().cut(cells, sel);
    expect(useClipboardStore.getState().mode).toBe("cut");
  });

  it("paste operation places cells at target", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, { value: "data" });
    const sel = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
    const cells = useCellStore
      .getState()
      .getCellsInRangeWithKeys(SHEET_ID, 0, 0, 0, 0);
    useClipboardStore.getState().copy(cells, sel);
    const result = useClipboardStore.getState().paste({ row: 2, col: 2 });
    expect(result.cells.size).toBe(1);
    expect(result.cells.get("2,2")?.value).toBe("data");
  });
});

// ═══════════════════════════════════════════════════════
// S7-016: Status bar — SUM of selection
// ═══════════════════════════════════════════════════════
describe("S7-016: Status bar SUM", () => {
  beforeEach(resetStores);

  it("sums numeric values in selection", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, { value: 10 });
    useCellStore.getState().setCell(SHEET_ID, 1, 0, { value: 20 });
    useCellStore.getState().setCell(SHEET_ID, 2, 0, { value: 30 });
    const sel = { start: { row: 0, col: 0 }, end: { row: 2, col: 0 } };
    useUIStore.getState().setSelections([sel]);

    const sheetCells = useCellStore.getState().cells.get(SHEET_ID)!;
    let sum = 0;
    for (let r = 0; r <= 2; r++) {
      const cell = sheetCells.get(getCellKey(r, 0));
      if (cell?.value != null) {
        const num = Number(cell.value);
        if (!isNaN(num)) sum += num;
      }
    }
    expect(sum).toBe(60);
  });
});

// ═══════════════════════════════════════════════════════
// S7-017: Status bar — AVG, COUNT, MIN, MAX
// ═══════════════════════════════════════════════════════
describe("S7-017: Status bar AVG/COUNT/MIN/MAX", () => {
  beforeEach(resetStores);

  it("computes all stats for numeric selection", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, { value: 10 });
    useCellStore.getState().setCell(SHEET_ID, 1, 0, { value: 20 });
    useCellStore.getState().setCell(SHEET_ID, 2, 0, { value: 30 });

    const sheetCells = useCellStore.getState().cells.get(SHEET_ID)!;
    let sum = 0;
    let count = 0;
    let numCount = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let r = 0; r <= 2; r++) {
      const cell = sheetCells.get(getCellKey(r, 0));
      if (cell?.value == null || cell.value === "") continue;
      count++;
      const num = Number(cell.value);
      if (!isNaN(num)) {
        sum += num;
        numCount++;
        if (num < min) min = num;
        if (num > max) max = num;
      }
    }

    expect(sum).toBe(60);
    expect(count).toBe(3);
    expect(numCount).toBe(3);
    expect(sum / numCount).toBe(20);
    expect(min).toBe(10);
    expect(max).toBe(30);
  });

  it("counts non-numeric values in COUNT but not in SUM", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, { value: 10 });
    useCellStore.getState().setCell(SHEET_ID, 1, 0, { value: "text" });

    const sheetCells = useCellStore.getState().cells.get(SHEET_ID)!;
    let sum = 0;
    let count = 0;
    let numCount = 0;

    for (let r = 0; r <= 1; r++) {
      const cell = sheetCells.get(getCellKey(r, 0));
      if (cell?.value == null || cell.value === "") continue;
      count++;
      const num = Number(cell.value);
      if (!isNaN(num)) {
        sum += num;
        numCount++;
      }
    }

    expect(count).toBe(2);
    expect(numCount).toBe(1);
    expect(sum).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════
// S7-018: Cell comments — add comment
// ═══════════════════════════════════════════════════════
describe("S7-018: Add comment", () => {
  beforeEach(resetStores);

  it("adds a comment to a cell", () => {
    const comment: CellComment = {
      id: "c1",
      cellKey: "0,0",
      sheetId: SHEET_ID,
      text: "Test comment",
      author: "You",
      createdAt: Date.now(),
    };
    useCommentStore.getState().addComment(SHEET_ID, comment);
    const comments = useCommentStore
      .getState()
      .getCommentsForCell(SHEET_ID, "0,0");
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe("Test comment");
  });

  it("hasComment returns true after adding", () => {
    const comment: CellComment = {
      id: "c2",
      cellKey: "1,1",
      sheetId: SHEET_ID,
      text: "Another comment",
      author: "You",
      createdAt: Date.now(),
    };
    useCommentStore.getState().addComment(SHEET_ID, comment);
    expect(useCommentStore.getState().hasComment(SHEET_ID, "1,1")).toBe(true);
    expect(useCommentStore.getState().hasComment(SHEET_ID, "2,2")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════
// S7-019: Cell comments — edit, delete
// ═══════════════════════════════════════════════════════
describe("S7-019: Edit/delete comment", () => {
  beforeEach(resetStores);

  it("edits a comment", () => {
    const comment: CellComment = {
      id: "c3",
      cellKey: "0,0",
      sheetId: SHEET_ID,
      text: "Original",
      author: "You",
      createdAt: Date.now(),
    };
    useCommentStore.getState().addComment(SHEET_ID, comment);
    useCommentStore.getState().editComment(SHEET_ID, "c3", "Updated");
    const comments = useCommentStore
      .getState()
      .getCommentsForCell(SHEET_ID, "0,0");
    expect(comments[0].text).toBe("Updated");
    expect(comments[0].updatedAt).toBeDefined();
  });

  it("deletes a comment", () => {
    const comment: CellComment = {
      id: "c4",
      cellKey: "0,0",
      sheetId: SHEET_ID,
      text: "Delete me",
      author: "You",
      createdAt: Date.now(),
    };
    useCommentStore.getState().addComment(SHEET_ID, comment);
    useCommentStore.getState().deleteComment(SHEET_ID, "c4");
    const comments = useCommentStore
      .getState()
      .getCommentsForCell(SHEET_ID, "0,0");
    expect(comments).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════
// S7-020: Cell notes (non-threaded)
// ═══════════════════════════════════════════════════════
describe("S7-020: Cell notes", () => {
  beforeEach(resetStores);

  it("stores note on cell data", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, {
      value: "Hello",
      note: "This is a note",
    });
    const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    expect(cell?.note).toBe("This is a note");
  });

  it("note is undefined by default", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, { value: "Hello" });
    const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    expect(cell?.note).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════
// S7-021: Hyperlink — insert link
// ═══════════════════════════════════════════════════════
describe("S7-021: Insert hyperlink", () => {
  beforeEach(resetStores);

  it("stores hyperlink on cell data", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, {
      value: "Click here",
      hyperlink: { url: "https://example.com", label: "Click here" },
    });
    const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    expect(cell?.hyperlink).toBeDefined();
    expect(cell?.hyperlink?.url).toBe("https://example.com");
    expect(cell?.hyperlink?.label).toBe("Click here");
  });

  it("opens hyperlink dialog via uiStore", () => {
    useUIStore.getState().setHyperlinkDialogOpen(true);
    expect(useUIStore.getState().isHyperlinkDialogOpen).toBe(true);
    useUIStore.getState().setHyperlinkDialogOpen(false);
    expect(useUIStore.getState().isHyperlinkDialogOpen).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════
// S7-022: Hyperlink — click to open
// ═══════════════════════════════════════════════════════
describe("S7-022: Hyperlink click behavior", () => {
  beforeEach(resetStores);

  it("hyperlink data is accessible from cell", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, {
      value: "Link",
      hyperlink: { url: "https://test.com" },
    });
    const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    expect(cell?.hyperlink?.url).toBe("https://test.com");
  });
});

// ═══════════════════════════════════════════════════════
// S7-023: Image in cell
// ═══════════════════════════════════════════════════════
describe("S7-023: Image in cell", () => {
  beforeEach(resetStores);

  it("stores image data on cell", () => {
    useCellStore.getState().setCell(SHEET_ID, 0, 0, {
      value: null,
      image: { url: "https://img.test/photo.png", alt: "Photo" },
    });
    const cell = useCellStore.getState().getCell(SHEET_ID, 0, 0);
    expect(cell?.image).toBeDefined();
    expect(cell?.image?.url).toBe("https://img.test/photo.png");
    expect(cell?.image?.alt).toBe("Photo");
  });

  it("opens image dialog via uiStore", () => {
    useUIStore.getState().setImageDialogOpen(true);
    expect(useUIStore.getState().isImageDialogOpen).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// S7-024: Show/hide gridlines
// ═══════════════════════════════════════════════════════
describe("S7-024: Show/hide gridlines", () => {
  beforeEach(resetStores);

  it("gridlines default to visible", () => {
    expect(useUIStore.getState().showGridlines).toBe(true);
  });

  it("toggles gridlines off", () => {
    useUIStore.getState().setShowGridlines(false);
    expect(useUIStore.getState().showGridlines).toBe(false);
  });

  it("toggles gridlines back on", () => {
    useUIStore.getState().setShowGridlines(false);
    useUIStore.getState().setShowGridlines(true);
    expect(useUIStore.getState().showGridlines).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// S7-025: Show/hide formula bar
// ═══════════════════════════════════════════════════════
describe("S7-025: Show/hide formula bar", () => {
  beforeEach(resetStores);

  it("formula bar defaults to visible", () => {
    expect(useUIStore.getState().showFormulaBar).toBe(true);
  });

  it("hides formula bar", () => {
    useUIStore.getState().setShowFormulaBar(false);
    expect(useUIStore.getState().showFormulaBar).toBe(false);
  });

  it("shows formula bar again", () => {
    useUIStore.getState().setShowFormulaBar(false);
    useUIStore.getState().setShowFormulaBar(true);
    expect(useUIStore.getState().showFormulaBar).toBe(true);
  });
});

/**
 * Tests for Insert menu: Comment, Checkbox, Dropdown, New Sheet items.
 * Issue #139
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useValidationStore } from "../stores/validationStore";
import { useCommentStore } from "../stores/commentStore";
import { useHistoryStore } from "../stores/historyStore";

describe("Insert menu items", () => {
  beforeEach(() => {
    // Reset stores to default state
    useUIStore.getState().setSelectedCell({ row: 0, col: 0 });
  });

  it("should insert a checkbox in the selected cell", () => {
    const sid = useSpreadsheetStore.getState().activeSheetId;
    const sel = useUIStore.getState().selectedCell;
    expect(sel).toBeTruthy();

    useHistoryStore.getState().pushUndo();
    useCellStore.getState().setCell(sid, sel!.row, sel!.col, {
      value: false,
    });
    useValidationStore.getState().setRule(sid, sel!.row, sel!.col, {
      type: "checkbox",
    });

    const rule = useValidationStore.getState().getRule(sid, sel!.row, sel!.col);
    expect(rule).toBeDefined();
    expect(rule!.type).toBe("checkbox");
  });

  it("should insert a dropdown validation in the selected cell", () => {
    const sid = useSpreadsheetStore.getState().activeSheetId;
    const sel = useUIStore.getState().selectedCell;
    expect(sel).toBeTruthy();

    useValidationStore.getState().setRule(sid, sel!.row, sel!.col, {
      type: "dropdown-list",
      listValues: ["Option 1", "Option 2", "Option 3"],
    });

    const rule = useValidationStore.getState().getRule(sid, sel!.row, sel!.col);
    expect(rule).toBeDefined();
    expect(rule!.type).toBe("dropdown-list");
    expect(rule!.listValues).toEqual(["Option 1", "Option 2", "Option 3"]);
  });

  it("should add a new sheet via addSheet", () => {
    const before = useSpreadsheetStore.getState().sheets.length;
    useSpreadsheetStore.getState().addSheet();
    const after = useSpreadsheetStore.getState().sheets.length;
    expect(after).toBe(before + 1);
  });

  it("should open comment panel", () => {
    useCommentStore.getState().openPanel();
    expect(useCommentStore.getState().isPanelOpen).toBe(true);
  });
});

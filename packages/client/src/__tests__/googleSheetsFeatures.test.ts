import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useValidationStore } from "../stores/validationStore";

describe("Google Sheets Feature Parity", () => {
  describe("Cell notes/comments", () => {
    beforeEach(() => {
      useCellStore.setState({ cells: new Map() });
      useSpreadsheetStore.setState({ activeSheetId: "sheet1" });
    });

    it("stores comment on cell data", () => {
      useCellStore.getState().setCell("sheet1", 0, 0, {
        value: "test",
        comment: "This is a comment",
      });
      const cell = useCellStore.getState().getCell("sheet1", 0, 0);
      expect(cell?.comment).toBe("This is a comment");
    });

    it("stores note on cell data", () => {
      useCellStore.getState().setCell("sheet1", 0, 0, {
        value: "test",
        note: "This is a note",
      });
      const cell = useCellStore.getState().getCell("sheet1", 0, 0);
      expect(cell?.note).toBe("This is a note");
    });

    it("cell can have both value and comment", () => {
      useCellStore.getState().setCell("sheet1", 1, 1, {
        value: 42,
        comment: "The answer",
      });
      const cell = useCellStore.getState().getCell("sheet1", 1, 1);
      expect(cell?.value).toBe(42);
      expect(cell?.comment).toBe("The answer");
    });
  });

  describe("Data validation with dropdown list", () => {
    beforeEach(() => {
      useValidationStore.setState({ rules: new Map() });
      useSpreadsheetStore.setState({ activeSheetId: "sheet1" });
    });

    it("adds dropdown-list validation rule", () => {
      useValidationStore.getState().setRule("sheet1", 0, 0, {
        type: "dropdown-list",
        listValues: ["Option A", "Option B", "Option C"],
      });
      const rules = useValidationStore.getState().rules.get("sheet1");
      expect(rules?.get("0,0")).toBeDefined();
      expect(rules?.get("0,0")?.type).toBe("dropdown-list");
    });

    it("validates dropdown-list values", () => {
      useValidationStore.getState().setRule("sheet1", 0, 0, {
        type: "dropdown-list",
        listValues: ["Yes", "No", "Maybe"],
      });
      const result = useValidationStore
        .getState()
        .validate("sheet1", 0, 0, "Yes");
      expect(result.valid).toBe(true);
    });
  });

  describe("Keyboard shortcuts dialog state", () => {
    it("has all dialog states initialized to false", () => {
      const state = useUIStore.getState();
      expect(state.isKeyboardShortcutsOpen).toBe(false);
      expect(state.isPrintDialogOpen).toBe(false);
      expect(state.isFormatCellsDialogOpen).toBe(false);
      expect(state.isCommandPaletteOpen).toBe(false);
    });

    it("dialogs are independent - opening one does not affect others", () => {
      useUIStore.getState().setKeyboardShortcutsOpen(true);
      expect(useUIStore.getState().isPrintDialogOpen).toBe(false);
      expect(useUIStore.getState().isFormatCellsDialogOpen).toBe(false);
      expect(useUIStore.getState().isKeyboardShortcutsOpen).toBe(true);
    });
  });
});

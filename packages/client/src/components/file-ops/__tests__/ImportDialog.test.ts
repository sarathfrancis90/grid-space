import { describe, it, expect, beforeEach } from "vitest";
import { parseCSV, detectDelimiter } from "../../../utils/fileOps";
import { useUIStore } from "../../../stores/uiStore";

describe("ImportDialog support utilities", () => {
  describe("detectDelimiter", () => {
    it("detects comma delimiter", () => {
      expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    });

    it("detects tab delimiter", () => {
      expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
    });

    it("detects semicolon delimiter", () => {
      expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    });
  });

  describe("parseCSV", () => {
    it("parses basic CSV", () => {
      const rows = parseCSV("Name,Age,City\nAlice,30,NYC\nBob,25,LA");
      expect(rows).toEqual([
        ["Name", "Age", "City"],
        ["Alice", "30", "NYC"],
        ["Bob", "25", "LA"],
      ]);
    });

    it("handles quoted fields with commas", () => {
      const rows = parseCSV('Name,Address\n"Smith, John","123 Main St"');
      expect(rows).toEqual([
        ["Name", "Address"],
        ["Smith, John", "123 Main St"],
      ]);
    });

    it("handles quoted fields with escaped quotes", () => {
      const rows = parseCSV('Value\n"He said ""hello"""');
      expect(rows).toEqual([["Value"], ['He said "hello"']]);
    });

    it("parses TSV with tab delimiter", () => {
      const rows = parseCSV("A\tB\tC\n1\t2\t3", "\t");
      expect(rows).toEqual([
        ["A", "B", "C"],
        ["1", "2", "3"],
      ]);
    });

    it("handles empty CSV", () => {
      const rows = parseCSV("");
      expect(rows).toEqual([]);
    });

    it("handles CRLF line endings", () => {
      const rows = parseCSV("a,b\r\n1,2\r\n");
      expect(rows).toEqual([
        ["a", "b"],
        ["1", "2"],
      ]);
    });
  });

  describe("UIStore import dialog state", () => {
    beforeEach(() => {
      useUIStore.setState({ isImportDialogOpen: false });
    });

    it("opens and closes import dialog", () => {
      expect(useUIStore.getState().isImportDialogOpen).toBe(false);

      useUIStore.getState().setImportDialogOpen(true);
      expect(useUIStore.getState().isImportDialogOpen).toBe(true);

      useUIStore.getState().setImportDialogOpen(false);
      expect(useUIStore.getState().isImportDialogOpen).toBe(false);
    });
  });
});

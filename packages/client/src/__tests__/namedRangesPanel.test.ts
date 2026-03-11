import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";
import { useNamedRangeStore } from "../stores/namedRangeStore";

describe("Named Ranges Panel", () => {
  beforeEach(() => {
    // Reset stores
    useUIStore.setState({ isNamedRangesPanelOpen: false });
    useNamedRangeStore.setState({ ranges: new Map() });
  });

  describe("uiStore integration", () => {
    it("should open and close the named ranges panel", () => {
      expect(useUIStore.getState().isNamedRangesPanelOpen).toBe(false);
      useUIStore.getState().setNamedRangesPanelOpen(true);
      expect(useUIStore.getState().isNamedRangesPanelOpen).toBe(true);
      useUIStore.getState().setNamedRangesPanelOpen(false);
      expect(useUIStore.getState().isNamedRangesPanelOpen).toBe(false);
    });
  });

  describe("namedRangeStore CRUD", () => {
    it("should add a named range", () => {
      const store = useNamedRangeStore.getState();
      store.addRange({
        name: "TestRange",
        sheetId: "sheet1",
        startRow: 0,
        startCol: 0,
        endRow: 4,
        endCol: 2,
      });
      const range = store.getRange("TestRange");
      expect(range).toBeDefined();
      expect(range?.name).toBe("TestRange");
      expect(range?.startRow).toBe(0);
      expect(range?.endCol).toBe(2);
    });

    it("should delete a named range", () => {
      const store = useNamedRangeStore.getState();
      store.addRange({
        name: "ToDelete",
        sheetId: "sheet1",
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
      });
      expect(store.getRange("ToDelete")).toBeDefined();
      store.removeRange("ToDelete");
      expect(
        useNamedRangeStore.getState().getRange("ToDelete"),
      ).toBeUndefined();
    });

    it("should update a named range", () => {
      const store = useNamedRangeStore.getState();
      store.addRange({
        name: "Editable",
        sheetId: "sheet1",
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
      });
      store.updateRange("Editable", { endRow: 9, endCol: 5 });
      const updated = useNamedRangeStore.getState().getRange("Editable");
      expect(updated?.endRow).toBe(9);
      expect(updated?.endCol).toBe(5);
    });

    it("should list all ranges", () => {
      const store = useNamedRangeStore.getState();
      store.addRange({
        name: "Range1",
        sheetId: "sheet1",
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
      });
      store.addRange({
        name: "Range2",
        sheetId: "sheet1",
        startRow: 2,
        startCol: 2,
        endRow: 3,
        endCol: 3,
      });
      const all = useNamedRangeStore.getState().getAllRanges();
      expect(all.length).toBe(2);
    });

    it("should filter ranges by sheet", () => {
      const store = useNamedRangeStore.getState();
      store.addRange({
        name: "Sheet1Range",
        sheetId: "sheet1",
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
      });
      store.addRange({
        name: "Sheet2Range",
        sheetId: "sheet2",
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
      });
      const sheet1Ranges = useNamedRangeStore
        .getState()
        .getRangesForSheet("sheet1");
      expect(sheet1Ranges.length).toBe(1);
      expect(sheet1Ranges[0].name).toBe("Sheet1Range");
    });

    it("should resolve range to positions", () => {
      const store = useNamedRangeStore.getState();
      store.addRange({
        name: "Resolve",
        sheetId: "sheet1",
        startRow: 2,
        startCol: 3,
        endRow: 5,
        endCol: 7,
      });
      const resolved = useNamedRangeStore.getState().resolveRange("Resolve");
      expect(resolved).toEqual({
        sheetId: "sheet1",
        start: { row: 2, col: 3 },
        end: { row: 5, col: 7 },
      });
    });

    it("should return null for non-existent range", () => {
      const resolved = useNamedRangeStore.getState().resolveRange("NoExist");
      expect(resolved).toBeNull();
    });
  });
});

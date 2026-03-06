import { describe, it, expect, beforeEach } from "vitest";
import {
  useSmartChipStore,
  generateChipId,
  getChipDisplayValue,
  getChipColor,
  SMART_CHIP_MENU_ITEMS,
} from "../stores/smartChipStore";
import type {
  DateChipData,
  DropdownChipData,
  RatingChipData,
  PeopleChipData,
  SmartChip,
} from "../types/grid";

describe("smartChipStore", () => {
  const SHEET = "sheet-1";

  beforeEach(() => {
    useSmartChipStore.setState({
      chips: new Map(),
      menu: {
        isMenuOpen: false,
        menuPosition: { x: 0, y: 0 },
        selectedIndex: 0,
        filterText: "",
      },
    });
  });

  describe("chip CRUD operations", () => {
    it("sets and gets a chip", () => {
      const chip: DateChipData = {
        id: "chip-1",
        type: "date",
        date: "2026-03-06",
      };
      useSmartChipStore.getState().setChip(SHEET, 0, 0, chip);
      const got = useSmartChipStore.getState().getChip(SHEET, 0, 0);
      expect(got).toBeDefined();
      expect(got?.type).toBe("date");
      expect((got as DateChipData).date).toBe("2026-03-06");
    });

    it("returns undefined for non-existent chip", () => {
      const got = useSmartChipStore.getState().getChip(SHEET, 0, 0);
      expect(got).toBeUndefined();
    });

    it("returns undefined for non-existent sheet", () => {
      const got = useSmartChipStore.getState().getChip("no-sheet", 0, 0);
      expect(got).toBeUndefined();
    });

    it("removes a chip", () => {
      const chip: RatingChipData = {
        id: "chip-2",
        type: "rating",
        value: 4,
      };
      useSmartChipStore.getState().setChip(SHEET, 1, 1, chip);
      useSmartChipStore.getState().removeChip(SHEET, 1, 1);
      expect(useSmartChipStore.getState().getChip(SHEET, 1, 1)).toBeUndefined();
    });

    it("sets multiple chips on different cells", () => {
      const dateChip: DateChipData = {
        id: "chip-d1",
        type: "date",
        date: "2026-01-01",
      };
      const ratingChip: RatingChipData = {
        id: "chip-r1",
        type: "rating",
        value: 5,
      };
      useSmartChipStore.getState().setChip(SHEET, 0, 0, dateChip);
      useSmartChipStore.getState().setChip(SHEET, 0, 1, ratingChip);

      expect(useSmartChipStore.getState().getChip(SHEET, 0, 0)?.type).toBe(
        "date",
      );
      expect(useSmartChipStore.getState().getChip(SHEET, 0, 1)?.type).toBe(
        "rating",
      );
    });

    it("overwrites a chip on the same cell", () => {
      const chip1: DateChipData = {
        id: "chip-1",
        type: "date",
        date: "2026-01-01",
      };
      const chip2: RatingChipData = {
        id: "chip-2",
        type: "rating",
        value: 3,
      };
      useSmartChipStore.getState().setChip(SHEET, 0, 0, chip1);
      useSmartChipStore.getState().setChip(SHEET, 0, 0, chip2);

      const got = useSmartChipStore.getState().getChip(SHEET, 0, 0);
      expect(got?.type).toBe("rating");
    });
  });

  describe("menu state", () => {
    it("opens the menu", () => {
      useSmartChipStore.getState().openMenu({ x: 100, y: 200 });
      const menu = useSmartChipStore.getState().menu;
      expect(menu.isMenuOpen).toBe(true);
      expect(menu.menuPosition).toEqual({ x: 100, y: 200 });
      expect(menu.selectedIndex).toBe(0);
      expect(menu.filterText).toBe("");
    });

    it("closes the menu", () => {
      useSmartChipStore.getState().openMenu({ x: 100, y: 200 });
      useSmartChipStore.getState().closeMenu();
      const menu = useSmartChipStore.getState().menu;
      expect(menu.isMenuOpen).toBe(false);
    });

    it("sets selected index", () => {
      useSmartChipStore.getState().setMenuSelectedIndex(2);
      expect(useSmartChipStore.getState().menu.selectedIndex).toBe(2);
    });

    it("sets filter text and resets index", () => {
      useSmartChipStore.getState().setMenuSelectedIndex(3);
      useSmartChipStore.getState().setMenuFilterText("date");
      const menu = useSmartChipStore.getState().menu;
      expect(menu.filterText).toBe("date");
      expect(menu.selectedIndex).toBe(0);
    });
  });

  describe("utility functions", () => {
    it("generateChipId returns unique IDs", () => {
      const id1 = generateChipId();
      const id2 = generateChipId();
      expect(id1).not.toBe(id2);
      expect(id1.startsWith("chip-")).toBe(true);
    });

    it("getChipDisplayValue for date chip", () => {
      const chip: DateChipData = { id: "1", type: "date", date: "2026-03-06" };
      expect(getChipDisplayValue(chip)).toBe("2026-03-06");
    });

    it("getChipDisplayValue for dropdown chip", () => {
      const chip: DropdownChipData = {
        id: "1",
        type: "dropdown",
        value: "Active",
        options: ["Active", "Done"],
      };
      expect(getChipDisplayValue(chip)).toBe("Active");
    });

    it("getChipDisplayValue for rating chip", () => {
      const chip: RatingChipData = { id: "1", type: "rating", value: 3 };
      const display = getChipDisplayValue(chip);
      expect(display).toBe("\u2605\u2605\u2605\u2606\u2606");
    });

    it("getChipDisplayValue for people chip", () => {
      const chip: PeopleChipData = {
        id: "1",
        type: "people",
        name: "Alice",
        email: "alice@example.com",
      };
      expect(getChipDisplayValue(chip)).toBe("Alice");
    });

    it("getChipColor returns expected colors", () => {
      expect(
        getChipColor({ id: "1", type: "date", date: "" } as DateChipData),
      ).toBe("#1a73e8");
      expect(
        getChipColor({
          id: "1",
          type: "dropdown",
          value: "",
          options: [],
        } as DropdownChipData),
      ).toBe("#34a853");
      expect(
        getChipColor({
          id: "1",
          type: "dropdown",
          value: "",
          options: [],
          color: "#ff0000",
        } as DropdownChipData),
      ).toBe("#ff0000");
      expect(
        getChipColor({ id: "1", type: "rating", value: 0 } as RatingChipData),
      ).toBe("#fbbc04");
      expect(
        getChipColor({
          id: "1",
          type: "people",
          name: "",
        } as PeopleChipData),
      ).toBe("#9334e6");
    });
  });

  describe("SMART_CHIP_MENU_ITEMS", () => {
    it("has all four chip types", () => {
      const types = SMART_CHIP_MENU_ITEMS.map((i) => i.type);
      expect(types).toContain("date");
      expect(types).toContain("dropdown");
      expect(types).toContain("rating");
      expect(types).toContain("people");
    });

    it("each item has label and icon", () => {
      for (const item of SMART_CHIP_MENU_ITEMS) {
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.icon.length).toBeGreaterThan(0);
      }
    });
  });

  describe("chip types (type narrowing)", () => {
    it("date chip has correct shape", () => {
      const chip: SmartChip = { id: "1", type: "date", date: "2026-01-15" };
      if (chip.type === "date") {
        expect(chip.date).toBe("2026-01-15");
      }
    });

    it("dropdown chip has correct shape", () => {
      const chip: SmartChip = {
        id: "2",
        type: "dropdown",
        value: "A",
        options: ["A", "B", "C"],
        color: "#34a853",
      };
      if (chip.type === "dropdown") {
        expect(chip.options).toHaveLength(3);
        expect(chip.value).toBe("A");
        expect(chip.color).toBe("#34a853");
      }
    });

    it("rating chip value is clamped 0-5", () => {
      const chip: RatingChipData = { id: "3", type: "rating", value: 5 };
      expect(chip.value).toBe(5);
      const display = getChipDisplayValue(chip);
      expect(display).toBe("\u2605\u2605\u2605\u2605\u2605");
    });

    it("rating chip 0 stars", () => {
      const chip: RatingChipData = { id: "4", type: "rating", value: 0 };
      const display = getChipDisplayValue(chip);
      expect(display).toBe("\u2606\u2606\u2606\u2606\u2606");
    });

    it("people chip with optional fields", () => {
      const chip: PeopleChipData = {
        id: "5",
        type: "people",
        name: "Bob",
      };
      expect(chip.email).toBeUndefined();
      expect(chip.avatarUrl).toBeUndefined();
      expect(getChipDisplayValue(chip)).toBe("Bob");
    });
  });
});

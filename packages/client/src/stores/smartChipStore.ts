import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { SmartChip, SmartChipType } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface SmartChipMenuState {
  isMenuOpen: boolean;
  menuPosition: { x: number; y: number };
  selectedIndex: number;
  filterText: string;
}

interface SmartChipState {
  chips: Map<string, Map<string, SmartChip>>;
  menu: SmartChipMenuState;
  getChip: (sheetId: string, row: number, col: number) => SmartChip | undefined;
  setChip: (sheetId: string, row: number, col: number, chip: SmartChip) => void;
  removeChip: (sheetId: string, row: number, col: number) => void;
  openMenu: (position: { x: number; y: number }) => void;
  closeMenu: () => void;
  setMenuSelectedIndex: (index: number) => void;
  setMenuFilterText: (text: string) => void;
}

export const SMART_CHIP_MENU_ITEMS: Array<{
  type: SmartChipType;
  label: string;
  icon: string;
}> = [
  { type: "date", label: "Date", icon: "\uD83D\uDCC5" },
  { type: "dropdown", label: "Dropdown", icon: "\u25BC" },
  { type: "rating", label: "Rating", icon: "\u2605" },
  { type: "people", label: "People", icon: "\uD83D\uDC64" },
];

export const useSmartChipStore = create<SmartChipState>()(
  immer((set, get) => ({
    chips: new Map<string, Map<string, SmartChip>>(),
    menu: {
      isMenuOpen: false,
      menuPosition: { x: 0, y: 0 },
      selectedIndex: 0,
      filterText: "",
    },

    getChip: (sheetId: string, row: number, col: number) => {
      const sheetChips = get().chips.get(sheetId);
      if (!sheetChips) return undefined;
      return sheetChips.get(getCellKey(row, col));
    },

    setChip: (sheetId: string, row: number, col: number, chip: SmartChip) => {
      set((state) => {
        if (!state.chips.has(sheetId)) {
          state.chips.set(sheetId, new Map<string, SmartChip>());
        }
        state.chips.get(sheetId)!.set(getCellKey(row, col), chip);
      });
    },

    removeChip: (sheetId: string, row: number, col: number) => {
      set((state) => {
        const sheetChips = state.chips.get(sheetId);
        if (sheetChips) {
          sheetChips.delete(getCellKey(row, col));
        }
      });
    },

    openMenu: (position: { x: number; y: number }) => {
      set((state) => {
        state.menu.isMenuOpen = true;
        state.menu.menuPosition = position;
        state.menu.selectedIndex = 0;
        state.menu.filterText = "";
      });
    },

    closeMenu: () => {
      set((state) => {
        state.menu.isMenuOpen = false;
        state.menu.filterText = "";
        state.menu.selectedIndex = 0;
      });
    },

    setMenuSelectedIndex: (index: number) => {
      set((state) => {
        state.menu.selectedIndex = index;
      });
    },

    setMenuFilterText: (text: string) => {
      set((state) => {
        state.menu.filterText = text;
        state.menu.selectedIndex = 0;
      });
    },
  })),
);

export function generateChipId(): string {
  return `chip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getChipDisplayValue(chip: SmartChip): string {
  switch (chip.type) {
    case "date":
      return chip.date;
    case "dropdown":
      return chip.value;
    case "rating":
      return "\u2605".repeat(chip.value) + "\u2606".repeat(5 - chip.value);
    case "people":
      return chip.name;
  }
}

export function getChipColor(chip: SmartChip): string {
  switch (chip.type) {
    case "date":
      return "#1a73e8";
    case "dropdown":
      return chip.color ?? "#34a853";
    case "rating":
      return "#fbbc04";
    case "people":
      return "#9334e6";
  }
}

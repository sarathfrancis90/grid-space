import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SmartChip,
  SmartChipType,
  SmartChipSuggestion,
  PersonChip,
  FileChip,
  DateChip,
  EventChip,
  PlaceChip,
  FinanceChip,
} from "../types/grid";

interface SmartChipState {
  /** Registry of known entities (people, files, etc.) for autocomplete */
  registry: Map<SmartChipType, SmartChip[]>;
  /** Whether the @-mention autocomplete popup is currently visible */
  isAutocompleteOpen: boolean;
  /** Current query text after the @ trigger */
  autocompleteQuery: string;
  /** Filtered suggestions based on query */
  suggestions: SmartChipSuggestion[];
  /** Index of currently highlighted suggestion */
  selectedIndex: number;
  /** Position of the autocomplete popup */
  popupPosition: { x: number; y: number } | null;

  registerChip: (chip: SmartChip) => void;
  registerChips: (chips: SmartChip[]) => void;
  unregisterChip: (type: SmartChipType, id: string) => void;
  getChipsByType: (type: SmartChipType) => SmartChip[];
  getChipById: (type: SmartChipType, id: string) => SmartChip | undefined;

  openAutocomplete: (x: number, y: number) => void;
  closeAutocomplete: () => void;
  setAutocompleteQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  moveSelectionUp: () => void;
  moveSelectionDown: () => void;
  getSelectedSuggestion: () => SmartChipSuggestion | undefined;

  searchChips: (query: string) => SmartChipSuggestion[];
}

function scoreMatch(chip: SmartChip, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const text = chip.displayText.toLowerCase();

  if (text === q) return 100;
  if (text.startsWith(q)) return 80;
  if (text.includes(q)) return 60;

  // Check type-specific fields
  switch (chip.type) {
    case "person": {
      const p = chip as PersonChip;
      if (p.email.toLowerCase().includes(q)) return 50;
      if (p.name.toLowerCase().includes(q)) return 50;
      break;
    }
    case "file": {
      const f = chip as FileChip;
      if (f.fileName.toLowerCase().includes(q)) return 50;
      break;
    }
    case "date": {
      const d = chip as DateChip;
      if (d.date.includes(q)) return 40;
      break;
    }
    case "event": {
      const e = chip as EventChip;
      if (e.title.toLowerCase().includes(q)) return 50;
      break;
    }
    case "place": {
      const pl = chip as PlaceChip;
      if (pl.placeName.toLowerCase().includes(q)) return 50;
      if (pl.address?.toLowerCase().includes(q)) return 40;
      break;
    }
    case "finance": {
      const fi = chip as FinanceChip;
      if (fi.ticker.toLowerCase().includes(q)) return 70;
      break;
    }
  }
  return 0;
}

export const useSmartChipStore = create<SmartChipState>()(
  immer((set, get) => ({
    registry: new Map<SmartChipType, SmartChip[]>(),
    isAutocompleteOpen: false,
    autocompleteQuery: "",
    suggestions: [],
    selectedIndex: 0,
    popupPosition: null,

    registerChip: (chip: SmartChip) => {
      set((state) => {
        if (!state.registry.has(chip.type)) {
          state.registry.set(chip.type, []);
        }
        const list = state.registry.get(chip.type)!;
        const existing = list.findIndex((c) => c.id === chip.id);
        if (existing >= 0) {
          list[existing] = chip;
        } else {
          list.push(chip);
        }
      });
    },

    registerChips: (chips: SmartChip[]) => {
      set((state) => {
        for (const chip of chips) {
          if (!state.registry.has(chip.type)) {
            state.registry.set(chip.type, []);
          }
          const list = state.registry.get(chip.type)!;
          const existing = list.findIndex((c) => c.id === chip.id);
          if (existing >= 0) {
            list[existing] = chip;
          } else {
            list.push(chip);
          }
        }
      });
    },

    unregisterChip: (type: SmartChipType, id: string) => {
      set((state) => {
        const list = state.registry.get(type);
        if (!list) return;
        state.registry.set(
          type,
          list.filter((c) => c.id !== id),
        );
      });
    },

    getChipsByType: (type: SmartChipType) => {
      return get().registry.get(type) ?? [];
    },

    getChipById: (type: SmartChipType, id: string) => {
      return get()
        .registry.get(type)
        ?.find((c) => c.id === id);
    },

    openAutocomplete: (x: number, y: number) => {
      set((state) => {
        state.isAutocompleteOpen = true;
        state.popupPosition = { x, y };
        state.autocompleteQuery = "";
        state.selectedIndex = 0;
        state.suggestions = get().searchChips("");
      });
    },

    closeAutocomplete: () => {
      set((state) => {
        state.isAutocompleteOpen = false;
        state.autocompleteQuery = "";
        state.suggestions = [];
        state.selectedIndex = 0;
        state.popupPosition = null;
      });
    },

    setAutocompleteQuery: (query: string) => {
      const suggestions = get().searchChips(query);
      set((state) => {
        state.autocompleteQuery = query;
        state.suggestions = suggestions;
        state.selectedIndex = 0;
      });
    },

    setSelectedIndex: (index: number) => {
      set((state) => {
        state.selectedIndex = index;
      });
    },

    moveSelectionUp: () => {
      set((state) => {
        if (state.suggestions.length === 0) return;
        state.selectedIndex =
          state.selectedIndex <= 0
            ? state.suggestions.length - 1
            : state.selectedIndex - 1;
      });
    },

    moveSelectionDown: () => {
      set((state) => {
        if (state.suggestions.length === 0) return;
        state.selectedIndex =
          state.selectedIndex >= state.suggestions.length - 1
            ? 0
            : state.selectedIndex + 1;
      });
    },

    getSelectedSuggestion: () => {
      const state = get();
      if (state.suggestions.length === 0) return undefined;
      return state.suggestions[state.selectedIndex];
    },

    searchChips: (query: string) => {
      const state = get();
      const results: SmartChipSuggestion[] = [];

      for (const [, chips] of state.registry) {
        for (const chip of chips) {
          const score = scoreMatch(chip, query);
          if (score > 0) {
            results.push({ chip, score });
          }
        }
      }

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, 10);
    },
  })),
);

export { scoreMatch };

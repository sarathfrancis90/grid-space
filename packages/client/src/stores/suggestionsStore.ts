import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  EditingMode,
  Suggestion,
  SuggestionFilter,
  SuggestionStatus,
} from "../types/suggestions";

let nextId = 1;
function generateId(): string {
  return `suggestion-${Date.now()}-${nextId++}`;
}

interface SuggestionsState {
  editingMode: EditingMode;
  suggestions: Suggestion[];
  isSidebarOpen: boolean;
  filter: SuggestionFilter;
  selectedSuggestionId: string | null;

  setEditingMode: (mode: EditingMode) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setFilter: (filter: SuggestionFilter) => void;
  setSelectedSuggestion: (id: string | null) => void;

  proposeSuggestion: (params: {
    sheetId: string;
    cellRef: string;
    oldValue: string | number | boolean | null;
    newValue: string | number | boolean | null;
    proposedBy: string;
    proposedById: string;
    comment?: string;
  }) => string;

  acceptSuggestion: (id: string, resolvedBy?: string) => void;
  rejectSuggestion: (id: string, resolvedBy?: string) => void;
  acceptAll: (resolvedBy?: string) => void;
  rejectAll: (resolvedBy?: string) => void;
  removeSuggestion: (id: string) => void;
  clearResolved: () => void;

  getPendingSuggestionsForCell: (
    sheetId: string,
    cellRef: string,
  ) => Suggestion[];
  getPendingCount: () => number;
  getFilteredSuggestions: () => Suggestion[];
}

export const useSuggestionsStore = create<SuggestionsState>()(
  immer((set, get) => ({
    editingMode: "editing",
    suggestions: [],
    isSidebarOpen: false,
    filter: "all",
    selectedSuggestionId: null,

    setEditingMode: (mode: EditingMode) => {
      set((state) => {
        state.editingMode = mode;
      });
    },

    openSidebar: () => {
      set((state) => {
        state.isSidebarOpen = true;
      });
    },

    closeSidebar: () => {
      set((state) => {
        state.isSidebarOpen = false;
        state.selectedSuggestionId = null;
      });
    },

    toggleSidebar: () => {
      set((state) => {
        state.isSidebarOpen = !state.isSidebarOpen;
        if (!state.isSidebarOpen) {
          state.selectedSuggestionId = null;
        }
      });
    },

    setFilter: (filter: SuggestionFilter) => {
      set((state) => {
        state.filter = filter;
      });
    },

    setSelectedSuggestion: (id: string | null) => {
      set((state) => {
        state.selectedSuggestionId = id;
      });
    },

    proposeSuggestion: (params) => {
      const id = generateId();
      set((state) => {
        state.suggestions.push({
          id,
          sheetId: params.sheetId,
          cellRef: params.cellRef,
          oldValue: params.oldValue,
          newValue: params.newValue,
          proposedBy: params.proposedBy,
          proposedById: params.proposedById,
          status: "pending",
          comment: params.comment,
          createdAt: Date.now(),
        });
      });
      return id;
    },

    acceptSuggestion: (id: string, resolvedBy?: string) => {
      set((state) => {
        const suggestion = state.suggestions.find((s) => s.id === id);
        if (suggestion && suggestion.status === "pending") {
          suggestion.status = "accepted";
          suggestion.resolvedAt = Date.now();
          suggestion.resolvedBy = resolvedBy;
        }
      });
    },

    rejectSuggestion: (id: string, resolvedBy?: string) => {
      set((state) => {
        const suggestion = state.suggestions.find((s) => s.id === id);
        if (suggestion && suggestion.status === "pending") {
          suggestion.status = "rejected";
          suggestion.resolvedAt = Date.now();
          suggestion.resolvedBy = resolvedBy;
        }
      });
    },

    acceptAll: (resolvedBy?: string) => {
      set((state) => {
        const now = Date.now();
        for (const s of state.suggestions) {
          if (s.status === "pending") {
            s.status = "accepted";
            s.resolvedAt = now;
            s.resolvedBy = resolvedBy;
          }
        }
      });
    },

    rejectAll: (resolvedBy?: string) => {
      set((state) => {
        const now = Date.now();
        for (const s of state.suggestions) {
          if (s.status === "pending") {
            s.status = "rejected";
            s.resolvedAt = now;
            s.resolvedBy = resolvedBy;
          }
        }
      });
    },

    removeSuggestion: (id: string) => {
      set((state) => {
        const idx = state.suggestions.findIndex((s) => s.id === id);
        if (idx !== -1) {
          state.suggestions.splice(idx, 1);
        }
      });
    },

    clearResolved: () => {
      set((state) => {
        state.suggestions = state.suggestions.filter(
          (s) => s.status === "pending",
        );
      });
    },

    getPendingSuggestionsForCell: (sheetId: string, cellRef: string) => {
      return get().suggestions.filter(
        (s) =>
          s.sheetId === sheetId &&
          s.cellRef === cellRef &&
          s.status === "pending",
      );
    },

    getPendingCount: () => {
      return get().suggestions.filter((s) => s.status === "pending").length;
    },

    getFilteredSuggestions: () => {
      const { suggestions, filter } = get();
      if (filter === "all") return suggestions;
      return suggestions.filter(
        (s) => s.status === (filter as SuggestionStatus),
      );
    },
  })),
);

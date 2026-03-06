/**
 * Suggestion store — manages Suggestions Mode (track changes).
 * When mode is "suggesting", cell edits create suggestion records
 * instead of directly modifying cell data.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SpreadsheetMode,
  Suggestion,
  SuggestionStatus,
} from "../types/grid";

interface SuggestionState {
  /** Current spreadsheet editing mode */
  mode: SpreadsheetMode;
  /** All pending suggestions keyed by id */
  suggestions: Map<string, Suggestion>;
  /** Currently selected suggestion for review */
  selectedSuggestionId: string | null;

  setMode: (mode: SpreadsheetMode) => void;
  addSuggestion: (suggestion: Suggestion) => void;
  removeSuggestion: (id: string) => void;
  setSuggestionStatus: (
    id: string,
    status: SuggestionStatus,
    reviewedBy: string,
  ) => void;
  selectSuggestion: (id: string | null) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  clearSuggestions: () => void;
  getSuggestionsForCell: (sheetId: string, cellKey: string) => Suggestion[];
  getPendingSuggestions: () => Suggestion[];
  acceptAll: (reviewedBy: string) => void;
  rejectAll: (reviewedBy: string) => void;
}

export const useSuggestionStore = create<SuggestionState>()(
  immer((set, get) => ({
    mode: "editing" as SpreadsheetMode,
    suggestions: new Map<string, Suggestion>(),
    selectedSuggestionId: null,

    setMode: (mode: SpreadsheetMode) => {
      set((state) => {
        state.mode = mode;
      });
    },

    addSuggestion: (suggestion: Suggestion) => {
      set((state) => {
        state.suggestions.set(suggestion.id, suggestion);
      });
    },

    removeSuggestion: (id: string) => {
      set((state) => {
        state.suggestions.delete(id);
        if (state.selectedSuggestionId === id) {
          state.selectedSuggestionId = null;
        }
      });
    },

    setSuggestionStatus: (
      id: string,
      status: SuggestionStatus,
      reviewedBy: string,
    ) => {
      set((state) => {
        const suggestion = state.suggestions.get(id);
        if (suggestion) {
          suggestion.status = status;
          suggestion.reviewedAt = Date.now();
          suggestion.reviewedBy = reviewedBy;
        }
      });
    },

    selectSuggestion: (id: string | null) => {
      set((state) => {
        state.selectedSuggestionId = id;
      });
    },

    setSuggestions: (suggestions: Suggestion[]) => {
      set((state) => {
        state.suggestions.clear();
        for (const s of suggestions) {
          state.suggestions.set(s.id, s);
        }
      });
    },

    clearSuggestions: () => {
      set((state) => {
        state.suggestions.clear();
        state.selectedSuggestionId = null;
      });
    },

    getSuggestionsForCell: (sheetId: string, cellKey: string) => {
      const suggestions = get().suggestions;
      const result: Suggestion[] = [];
      suggestions.forEach((s) => {
        if (
          s.sheetId === sheetId &&
          s.cellKey === cellKey &&
          s.status === "pending"
        ) {
          result.push(s);
        }
      });
      return result;
    },

    getPendingSuggestions: () => {
      const suggestions = get().suggestions;
      const result: Suggestion[] = [];
      suggestions.forEach((s) => {
        if (s.status === "pending") {
          result.push(s);
        }
      });
      return result.sort((a, b) => b.createdAt - a.createdAt);
    },

    acceptAll: (reviewedBy: string) => {
      set((state) => {
        const now = Date.now();
        state.suggestions.forEach((s) => {
          if (s.status === "pending") {
            s.status = "accepted";
            s.reviewedAt = now;
            s.reviewedBy = reviewedBy;
          }
        });
      });
    },

    rejectAll: (reviewedBy: string) => {
      set((state) => {
        const now = Date.now();
        state.suggestions.forEach((s) => {
          if (s.status === "pending") {
            s.status = "rejected";
            s.reviewedAt = now;
            s.reviewedBy = reviewedBy;
          }
        });
      });
    },
  })),
);

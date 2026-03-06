import { describe, it, expect, beforeEach } from "vitest";
import { useSuggestionStore } from "../stores/suggestionStore";
import type { Suggestion } from "../types/grid";

function resetStore() {
  useSuggestionStore.setState({
    mode: "editing",
    suggestions: new Map(),
    selectedSuggestionId: null,
  });
}

function createSuggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    id: `suggestion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    spreadsheetId: "sp1",
    sheetId: "sheet1",
    cellKey: "0,0",
    oldValue: "old",
    newValue: "new",
    authorId: "user1",
    authorName: "Test User",
    status: "pending",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("suggestionStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("mode management", () => {
    it("starts in editing mode", () => {
      expect(useSuggestionStore.getState().mode).toBe("editing");
    });

    it("sets mode to suggesting", () => {
      useSuggestionStore.getState().setMode("suggesting");
      expect(useSuggestionStore.getState().mode).toBe("suggesting");
    });

    it("sets mode to viewing", () => {
      useSuggestionStore.getState().setMode("viewing");
      expect(useSuggestionStore.getState().mode).toBe("viewing");
    });

    it("cycles through all modes", () => {
      const store = useSuggestionStore.getState();
      store.setMode("suggesting");
      expect(useSuggestionStore.getState().mode).toBe("suggesting");
      store.setMode("viewing");
      expect(useSuggestionStore.getState().mode).toBe("viewing");
      store.setMode("editing");
      expect(useSuggestionStore.getState().mode).toBe("editing");
    });
  });

  describe("suggestion CRUD", () => {
    it("adds a suggestion", () => {
      const suggestion = createSuggestion({ id: "s1" });
      useSuggestionStore.getState().addSuggestion(suggestion);
      expect(useSuggestionStore.getState().suggestions.size).toBe(1);
      expect(useSuggestionStore.getState().suggestions.get("s1")).toEqual(
        suggestion,
      );
    });

    it("removes a suggestion", () => {
      const suggestion = createSuggestion({ id: "s1" });
      useSuggestionStore.getState().addSuggestion(suggestion);
      useSuggestionStore.getState().removeSuggestion("s1");
      expect(useSuggestionStore.getState().suggestions.size).toBe(0);
    });

    it("clears selected suggestion when removed", () => {
      const suggestion = createSuggestion({ id: "s1" });
      useSuggestionStore.getState().addSuggestion(suggestion);
      useSuggestionStore.getState().selectSuggestion("s1");
      useSuggestionStore.getState().removeSuggestion("s1");
      expect(useSuggestionStore.getState().selectedSuggestionId).toBeNull();
    });

    it("sets suggestions from array", () => {
      const s1 = createSuggestion({ id: "s1" });
      const s2 = createSuggestion({ id: "s2" });
      useSuggestionStore.getState().setSuggestions([s1, s2]);
      expect(useSuggestionStore.getState().suggestions.size).toBe(2);
    });

    it("clears all suggestions", () => {
      const s1 = createSuggestion({ id: "s1" });
      useSuggestionStore.getState().addSuggestion(s1);
      useSuggestionStore.getState().selectSuggestion("s1");
      useSuggestionStore.getState().clearSuggestions();
      expect(useSuggestionStore.getState().suggestions.size).toBe(0);
      expect(useSuggestionStore.getState().selectedSuggestionId).toBeNull();
    });
  });

  describe("suggestion status", () => {
    it("accepts a suggestion", () => {
      const suggestion = createSuggestion({ id: "s1" });
      useSuggestionStore.getState().addSuggestion(suggestion);
      useSuggestionStore
        .getState()
        .setSuggestionStatus("s1", "accepted", "reviewer1");

      const updated = useSuggestionStore.getState().suggestions.get("s1");
      expect(updated?.status).toBe("accepted");
      expect(updated?.reviewedBy).toBe("reviewer1");
      expect(updated?.reviewedAt).toBeDefined();
    });

    it("rejects a suggestion", () => {
      const suggestion = createSuggestion({ id: "s1" });
      useSuggestionStore.getState().addSuggestion(suggestion);
      useSuggestionStore
        .getState()
        .setSuggestionStatus("s1", "rejected", "reviewer1");

      const updated = useSuggestionStore.getState().suggestions.get("s1");
      expect(updated?.status).toBe("rejected");
    });
  });

  describe("bulk operations", () => {
    it("accepts all pending suggestions", () => {
      const s1 = createSuggestion({ id: "s1" });
      const s2 = createSuggestion({ id: "s2" });
      const s3 = createSuggestion({ id: "s3", status: "rejected" });
      useSuggestionStore.getState().setSuggestions([s1, s2, s3]);
      useSuggestionStore.getState().acceptAll("reviewer");

      const state = useSuggestionStore.getState();
      expect(state.suggestions.get("s1")?.status).toBe("accepted");
      expect(state.suggestions.get("s2")?.status).toBe("accepted");
      expect(state.suggestions.get("s3")?.status).toBe("rejected"); // unchanged
    });

    it("rejects all pending suggestions", () => {
      const s1 = createSuggestion({ id: "s1" });
      const s2 = createSuggestion({ id: "s2" });
      useSuggestionStore.getState().setSuggestions([s1, s2]);
      useSuggestionStore.getState().rejectAll("reviewer");

      const state = useSuggestionStore.getState();
      expect(state.suggestions.get("s1")?.status).toBe("rejected");
      expect(state.suggestions.get("s2")?.status).toBe("rejected");
    });
  });

  describe("queries", () => {
    it("gets suggestions for a specific cell", () => {
      const s1 = createSuggestion({
        id: "s1",
        sheetId: "sheet1",
        cellKey: "0,0",
      });
      const s2 = createSuggestion({
        id: "s2",
        sheetId: "sheet1",
        cellKey: "1,1",
      });
      const s3 = createSuggestion({
        id: "s3",
        sheetId: "sheet1",
        cellKey: "0,0",
        status: "accepted",
      });
      useSuggestionStore.getState().setSuggestions([s1, s2, s3]);

      const cellSuggestions = useSuggestionStore
        .getState()
        .getSuggestionsForCell("sheet1", "0,0");
      expect(cellSuggestions).toHaveLength(1); // only pending
      expect(cellSuggestions[0].id).toBe("s1");
    });

    it("gets pending suggestions sorted by creation time", () => {
      const s1 = createSuggestion({ id: "s1", createdAt: 1000 });
      const s2 = createSuggestion({ id: "s2", createdAt: 3000 });
      const s3 = createSuggestion({ id: "s3", createdAt: 2000 });
      useSuggestionStore.getState().setSuggestions([s1, s2, s3]);

      const pending = useSuggestionStore.getState().getPendingSuggestions();
      expect(pending).toHaveLength(3);
      expect(pending[0].id).toBe("s2"); // newest first
      expect(pending[1].id).toBe("s3");
      expect(pending[2].id).toBe("s1");
    });
  });

  describe("selection", () => {
    it("selects a suggestion", () => {
      const s1 = createSuggestion({ id: "s1" });
      useSuggestionStore.getState().addSuggestion(s1);
      useSuggestionStore.getState().selectSuggestion("s1");
      expect(useSuggestionStore.getState().selectedSuggestionId).toBe("s1");
    });

    it("deselects a suggestion", () => {
      useSuggestionStore.getState().selectSuggestion("s1");
      useSuggestionStore.getState().selectSuggestion(null);
      expect(useSuggestionStore.getState().selectedSuggestionId).toBeNull();
    });
  });
});

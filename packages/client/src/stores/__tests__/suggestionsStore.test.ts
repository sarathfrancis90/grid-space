import { describe, it, expect, beforeEach } from "vitest";
import { useSuggestionsStore } from "../suggestionsStore";

describe("suggestionsStore", () => {
  beforeEach(() => {
    // Reset the store between tests
    const store = useSuggestionsStore.getState();
    store.setEditingMode("editing");
    // Clear all suggestions by rejecting then clearing
    useSuggestionsStore.setState({
      suggestions: [],
      isSidebarOpen: false,
      filter: "all",
      selectedSuggestionId: null,
    });
  });

  describe("editingMode", () => {
    it("defaults to 'editing'", () => {
      expect(useSuggestionsStore.getState().editingMode).toBe("editing");
    });

    it("can be set to 'suggesting'", () => {
      useSuggestionsStore.getState().setEditingMode("suggesting");
      expect(useSuggestionsStore.getState().editingMode).toBe("suggesting");
    });

    it("can be set to 'viewing'", () => {
      useSuggestionsStore.getState().setEditingMode("viewing");
      expect(useSuggestionsStore.getState().editingMode).toBe("viewing");
    });
  });

  describe("sidebar", () => {
    it("defaults to closed", () => {
      expect(useSuggestionsStore.getState().isSidebarOpen).toBe(false);
    });

    it("opens sidebar", () => {
      useSuggestionsStore.getState().openSidebar();
      expect(useSuggestionsStore.getState().isSidebarOpen).toBe(true);
    });

    it("closes sidebar and clears selection", () => {
      useSuggestionsStore.getState().openSidebar();
      useSuggestionsStore.getState().setSelectedSuggestion("test-id");
      useSuggestionsStore.getState().closeSidebar();
      expect(useSuggestionsStore.getState().isSidebarOpen).toBe(false);
      expect(useSuggestionsStore.getState().selectedSuggestionId).toBeNull();
    });

    it("toggles sidebar", () => {
      useSuggestionsStore.getState().toggleSidebar();
      expect(useSuggestionsStore.getState().isSidebarOpen).toBe(true);
      useSuggestionsStore.getState().toggleSidebar();
      expect(useSuggestionsStore.getState().isSidebarOpen).toBe(false);
    });
  });

  describe("proposeSuggestion", () => {
    it("creates a suggestion with pending status", () => {
      const id = useSuggestionsStore.getState().proposeSuggestion({
        sheetId: "sheet1",
        cellRef: "0,0",
        oldValue: "old",
        newValue: "new",
        proposedBy: "Test User",
        proposedById: "user-1",
      });

      const suggestions = useSuggestionsStore.getState().suggestions;
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe(id);
      expect(suggestions[0].status).toBe("pending");
      expect(suggestions[0].oldValue).toBe("old");
      expect(suggestions[0].newValue).toBe("new");
      expect(suggestions[0].proposedBy).toBe("Test User");
    });

    it("creates a suggestion with a comment", () => {
      useSuggestionsStore.getState().proposeSuggestion({
        sheetId: "sheet1",
        cellRef: "1,2",
        oldValue: null,
        newValue: "hello",
        proposedBy: "User",
        proposedById: "user-1",
        comment: "Adding greeting",
      });

      const s = useSuggestionsStore.getState().suggestions[0];
      expect(s.comment).toBe("Adding greeting");
    });
  });

  describe("acceptSuggestion", () => {
    it("changes status to accepted", () => {
      const id = useSuggestionsStore.getState().proposeSuggestion({
        sheetId: "sheet1",
        cellRef: "0,0",
        oldValue: "old",
        newValue: "new",
        proposedBy: "User",
        proposedById: "user-1",
      });

      useSuggestionsStore.getState().acceptSuggestion(id, "Reviewer");
      const s = useSuggestionsStore.getState().suggestions[0];
      expect(s.status).toBe("accepted");
      expect(s.resolvedBy).toBe("Reviewer");
      expect(s.resolvedAt).toBeDefined();
    });

    it("does not accept already rejected suggestions", () => {
      const id = useSuggestionsStore.getState().proposeSuggestion({
        sheetId: "sheet1",
        cellRef: "0,0",
        oldValue: "old",
        newValue: "new",
        proposedBy: "User",
        proposedById: "user-1",
      });

      useSuggestionsStore.getState().rejectSuggestion(id);
      useSuggestionsStore.getState().acceptSuggestion(id);
      expect(useSuggestionsStore.getState().suggestions[0].status).toBe(
        "rejected",
      );
    });
  });

  describe("rejectSuggestion", () => {
    it("changes status to rejected", () => {
      const id = useSuggestionsStore.getState().proposeSuggestion({
        sheetId: "sheet1",
        cellRef: "0,0",
        oldValue: "old",
        newValue: "new",
        proposedBy: "User",
        proposedById: "user-1",
      });

      useSuggestionsStore.getState().rejectSuggestion(id);
      expect(useSuggestionsStore.getState().suggestions[0].status).toBe(
        "rejected",
      );
    });
  });

  describe("bulk actions", () => {
    function addThreeSuggestions() {
      const store = useSuggestionsStore.getState();
      store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "0,0",
        oldValue: "a",
        newValue: "b",
        proposedBy: "U",
        proposedById: "u1",
      });
      store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "1,0",
        oldValue: "c",
        newValue: "d",
        proposedBy: "U",
        proposedById: "u1",
      });
      store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "2,0",
        oldValue: "e",
        newValue: "f",
        proposedBy: "U",
        proposedById: "u1",
      });
    }

    it("acceptAll sets all pending to accepted", () => {
      addThreeSuggestions();
      useSuggestionsStore.getState().acceptAll("Admin");
      const all = useSuggestionsStore.getState().suggestions;
      expect(all.every((s) => s.status === "accepted")).toBe(true);
      expect(all.every((s) => s.resolvedBy === "Admin")).toBe(true);
    });

    it("rejectAll sets all pending to rejected", () => {
      addThreeSuggestions();
      useSuggestionsStore.getState().rejectAll();
      const all = useSuggestionsStore.getState().suggestions;
      expect(all.every((s) => s.status === "rejected")).toBe(true);
    });

    it("clearResolved removes non-pending suggestions", () => {
      addThreeSuggestions();
      const ids = useSuggestionsStore.getState().suggestions.map((s) => s.id);
      useSuggestionsStore.getState().acceptSuggestion(ids[0]);
      useSuggestionsStore.getState().rejectSuggestion(ids[1]);
      useSuggestionsStore.getState().clearResolved();
      expect(useSuggestionsStore.getState().suggestions).toHaveLength(1);
      expect(useSuggestionsStore.getState().suggestions[0].id).toBe(ids[2]);
    });
  });

  describe("getPendingCount", () => {
    it("returns count of pending suggestions", () => {
      const store = useSuggestionsStore.getState();
      expect(store.getPendingCount()).toBe(0);

      const id1 = store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "0,0",
        oldValue: null,
        newValue: "x",
        proposedBy: "U",
        proposedById: "u1",
      });
      expect(useSuggestionsStore.getState().getPendingCount()).toBe(1);

      useSuggestionsStore.getState().proposeSuggestion({
        sheetId: "s1",
        cellRef: "1,0",
        oldValue: null,
        newValue: "y",
        proposedBy: "U",
        proposedById: "u1",
      });
      expect(useSuggestionsStore.getState().getPendingCount()).toBe(2);

      useSuggestionsStore.getState().acceptSuggestion(id1);
      expect(useSuggestionsStore.getState().getPendingCount()).toBe(1);
    });
  });

  describe("getFilteredSuggestions", () => {
    it("returns all when filter is 'all'", () => {
      const store = useSuggestionsStore.getState();
      const id = store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "0,0",
        oldValue: null,
        newValue: "x",
        proposedBy: "U",
        proposedById: "u1",
      });
      store.acceptSuggestion(id);
      store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "1,0",
        oldValue: null,
        newValue: "y",
        proposedBy: "U",
        proposedById: "u1",
      });

      expect(
        useSuggestionsStore.getState().getFilteredSuggestions(),
      ).toHaveLength(2);
    });

    it("filters by status", () => {
      const store = useSuggestionsStore.getState();
      const id = store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "0,0",
        oldValue: null,
        newValue: "x",
        proposedBy: "U",
        proposedById: "u1",
      });
      store.acceptSuggestion(id);
      store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "1,0",
        oldValue: null,
        newValue: "y",
        proposedBy: "U",
        proposedById: "u1",
      });

      store.setFilter("pending");
      expect(
        useSuggestionsStore.getState().getFilteredSuggestions(),
      ).toHaveLength(1);
      expect(
        useSuggestionsStore.getState().getFilteredSuggestions()[0].status,
      ).toBe("pending");

      store.setFilter("accepted");
      expect(
        useSuggestionsStore.getState().getFilteredSuggestions(),
      ).toHaveLength(1);
      expect(
        useSuggestionsStore.getState().getFilteredSuggestions()[0].status,
      ).toBe("accepted");
    });
  });

  describe("getPendingSuggestionsForCell", () => {
    it("returns pending suggestions for a specific cell", () => {
      const store = useSuggestionsStore.getState();
      store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "0,0",
        oldValue: null,
        newValue: "x",
        proposedBy: "U",
        proposedById: "u1",
      });
      store.proposeSuggestion({
        sheetId: "s1",
        cellRef: "1,0",
        oldValue: null,
        newValue: "y",
        proposedBy: "U",
        proposedById: "u1",
      });

      const result = useSuggestionsStore
        .getState()
        .getPendingSuggestionsForCell("s1", "0,0");
      expect(result).toHaveLength(1);
      expect(result[0].newValue).toBe("x");
    });
  });

  describe("removeSuggestion", () => {
    it("removes a suggestion by id", () => {
      const id = useSuggestionsStore.getState().proposeSuggestion({
        sheetId: "s1",
        cellRef: "0,0",
        oldValue: null,
        newValue: "x",
        proposedBy: "U",
        proposedById: "u1",
      });
      expect(useSuggestionsStore.getState().suggestions).toHaveLength(1);
      useSuggestionsStore.getState().removeSuggestion(id);
      expect(useSuggestionsStore.getState().suggestions).toHaveLength(0);
    });
  });
});

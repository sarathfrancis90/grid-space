import { describe, it, expect, beforeEach } from "vitest";
import { useSmartChipStore, scoreMatch } from "../stores/smartChipStore";
import type {
  PersonChip,
  FileChip,
  DateChip,
  EventChip,
  PlaceChip,
  FinanceChip,
  CustomChip,
} from "../types/grid";

function resetStore() {
  useSmartChipStore.setState({
    registry: new Map(),
    isAutocompleteOpen: false,
    autocompleteQuery: "",
    suggestions: [],
    selectedIndex: 0,
    popupPosition: null,
  });
}

const personChip: PersonChip = {
  id: "p1",
  type: "person",
  displayText: "John Doe",
  email: "john@example.com",
  name: "John Doe",
};

const fileChip: FileChip = {
  id: "f1",
  type: "file",
  displayText: "Budget.xlsx",
  fileId: "file-123",
  fileName: "Budget.xlsx",
  mimeType: "application/xlsx",
};

const dateChip: DateChip = {
  id: "d1",
  type: "date",
  displayText: "March 6, 2026",
  date: "2026-03-06",
};

const eventChip: EventChip = {
  id: "e1",
  type: "event",
  displayText: "Team Standup",
  eventId: "evt-456",
  title: "Team Standup",
  startDate: "2026-03-06T09:00:00Z",
};

const placeChip: PlaceChip = {
  id: "pl1",
  type: "place",
  displayText: "Googleplex",
  placeId: "place-789",
  placeName: "Googleplex",
  address: "1600 Amphitheatre Parkway",
};

const financeChip: FinanceChip = {
  id: "fi1",
  type: "finance",
  displayText: "GOOGL",
  ticker: "GOOGL",
  exchange: "NASDAQ",
};

const customChip: CustomChip = {
  id: "c1",
  type: "custom",
  displayText: "Priority: High",
  icon: "!",
  color: "#ff0000",
};

describe("smartChipStore", () => {
  beforeEach(resetStore);

  describe("registerChip / getChipsByType / getChipById", () => {
    it("should register a chip and retrieve it by type", () => {
      const store = useSmartChipStore.getState();
      store.registerChip(personChip);

      const people = store.getChipsByType("person");
      expect(people).toHaveLength(1);
      expect(people[0].id).toBe("p1");
    });

    it("should retrieve a chip by type and id", () => {
      const store = useSmartChipStore.getState();
      store.registerChip(personChip);
      store.registerChip(fileChip);

      expect(store.getChipById("person", "p1")).toEqual(personChip);
      expect(store.getChipById("file", "f1")).toEqual(fileChip);
      expect(store.getChipById("person", "nonexistent")).toBeUndefined();
    });

    it("should update existing chip on re-register", () => {
      const store = useSmartChipStore.getState();
      store.registerChip(personChip);

      const updated: PersonChip = { ...personChip, name: "Jane Doe" };
      store.registerChip(updated);

      const people = store.getChipsByType("person");
      expect(people).toHaveLength(1);
      expect((people[0] as PersonChip).name).toBe("Jane Doe");
    });
  });

  describe("registerChips (batch)", () => {
    it("should register multiple chips at once", () => {
      const store = useSmartChipStore.getState();
      store.registerChips([personChip, fileChip, dateChip]);

      expect(store.getChipsByType("person")).toHaveLength(1);
      expect(store.getChipsByType("file")).toHaveLength(1);
      expect(store.getChipsByType("date")).toHaveLength(1);
    });
  });

  describe("unregisterChip", () => {
    it("should remove a chip from the registry", () => {
      const store = useSmartChipStore.getState();
      store.registerChip(personChip);
      store.unregisterChip("person", "p1");

      expect(store.getChipsByType("person")).toHaveLength(0);
    });

    it("should be a no-op for non-existent type", () => {
      const store = useSmartChipStore.getState();
      store.unregisterChip("person", "nonexistent");
      expect(store.getChipsByType("person")).toHaveLength(0);
    });
  });

  describe("autocomplete", () => {
    beforeEach(() => {
      const store = useSmartChipStore.getState();
      store.registerChips([
        personChip,
        fileChip,
        dateChip,
        eventChip,
        placeChip,
        financeChip,
        customChip,
      ]);
    });

    it("should open and close autocomplete", () => {
      const store = useSmartChipStore.getState();
      store.openAutocomplete(100, 200);

      let state = useSmartChipStore.getState();
      expect(state.isAutocompleteOpen).toBe(true);
      expect(state.popupPosition).toEqual({ x: 100, y: 200 });
      expect(state.suggestions.length).toBeGreaterThan(0);

      store.closeAutocomplete();
      state = useSmartChipStore.getState();
      expect(state.isAutocompleteOpen).toBe(false);
      expect(state.suggestions).toHaveLength(0);
    });

    it("should filter suggestions by query", () => {
      const store = useSmartChipStore.getState();
      store.openAutocomplete(0, 0);
      store.setAutocompleteQuery("john");

      const state = useSmartChipStore.getState();
      expect(state.suggestions.length).toBeGreaterThan(0);
      expect(state.suggestions[0].chip.id).toBe("p1");
    });

    it("should return empty for non-matching query", () => {
      const store = useSmartChipStore.getState();
      store.openAutocomplete(0, 0);
      store.setAutocompleteQuery("zzzzzzz");

      expect(useSmartChipStore.getState().suggestions).toHaveLength(0);
    });

    it("should navigate selection up/down", () => {
      const store = useSmartChipStore.getState();
      store.openAutocomplete(0, 0);

      expect(useSmartChipStore.getState().selectedIndex).toBe(0);

      store.moveSelectionDown();
      expect(useSmartChipStore.getState().selectedIndex).toBe(1);

      store.moveSelectionUp();
      expect(useSmartChipStore.getState().selectedIndex).toBe(0);

      // Wrap around to bottom
      store.moveSelectionUp();
      const state = useSmartChipStore.getState();
      expect(state.selectedIndex).toBe(state.suggestions.length - 1);
    });

    it("should get selected suggestion", () => {
      const store = useSmartChipStore.getState();
      store.openAutocomplete(0, 0);

      const selected = store.getSelectedSuggestion();
      expect(selected).toBeDefined();
      expect(selected!.chip).toBeDefined();
    });
  });

  describe("searchChips", () => {
    beforeEach(() => {
      const store = useSmartChipStore.getState();
      store.registerChips([
        personChip,
        fileChip,
        dateChip,
        eventChip,
        placeChip,
        financeChip,
        customChip,
      ]);
    });

    it("should return all chips for empty query", () => {
      const results = useSmartChipStore.getState().searchChips("");
      expect(results).toHaveLength(7);
    });

    it("should match by displayText", () => {
      const results = useSmartChipStore.getState().searchChips("Budget");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chip.id).toBe("f1");
    });

    it("should match person by email", () => {
      const results = useSmartChipStore.getState().searchChips("john@");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chip.type).toBe("person");
    });

    it("should match finance by ticker", () => {
      const results = useSmartChipStore.getState().searchChips("GOOGL");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chip.type).toBe("finance");
    });

    it("should match place by address", () => {
      const results = useSmartChipStore.getState().searchChips("Amphitheatre");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chip.type).toBe("place");
    });

    it("should limit to 10 results", () => {
      const store = useSmartChipStore.getState();
      for (let i = 0; i < 15; i++) {
        store.registerChip({
          id: `extra-${i}`,
          type: "custom",
          displayText: `Item ${i}`,
        });
      }
      const results = store.searchChips("");
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });
});

describe("scoreMatch", () => {
  it("returns 100 for exact match", () => {
    expect(scoreMatch(personChip, "John Doe")).toBe(100);
  });

  it("returns 80 for prefix match", () => {
    expect(scoreMatch(personChip, "John")).toBe(80);
  });

  it("returns 60 for substring match", () => {
    expect(scoreMatch(personChip, "Doe")).toBe(60);
  });

  it("returns 0 for no match", () => {
    expect(scoreMatch(personChip, "zzzzz")).toBe(0);
  });

  it("returns 1 for empty query", () => {
    expect(scoreMatch(personChip, "")).toBe(1);
  });

  it("matches person email", () => {
    expect(scoreMatch(personChip, "john@example")).toBe(50);
  });

  it("matches finance ticker", () => {
    // "googl" matches displayText "GOOGL" exactly (case-insensitive) → 100
    expect(scoreMatch(financeChip, "googl")).toBe(100);
  });
});

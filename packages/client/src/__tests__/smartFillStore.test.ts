import { describe, it, expect, beforeEach } from "vitest";
import { useSmartFillStore } from "../stores/smartFillStore";
import type { SmartFillSuggestion } from "../utils/smartFill";
import type { OrganizeSuggestion } from "../utils/sheetOrganizer";

describe("smartFillStore", () => {
  beforeEach(() => {
    useSmartFillStore.setState({
      suggestion: null,
      isPreviewVisible: false,
      organizeSuggestions: [],
      isOrganizePanelOpen: false,
    });
  });

  it("starts with no suggestion", () => {
    const state = useSmartFillStore.getState();
    expect(state.suggestion).toBeNull();
    expect(state.isPreviewVisible).toBe(false);
  });

  it("sets suggestion and shows preview", () => {
    const suggestion: SmartFillSuggestion = {
      cells: [{ row: 3, col: 0, value: 4 }],
      pattern: {
        type: "arithmetic",
        confidence: 1,
        description: "Arithmetic sequence",
      },
    };
    useSmartFillStore.getState().setSuggestion(suggestion);
    const state = useSmartFillStore.getState();
    expect(state.suggestion).toEqual(suggestion);
    expect(state.isPreviewVisible).toBe(true);
  });

  it("clears suggestion when set to null", () => {
    const suggestion: SmartFillSuggestion = {
      cells: [{ row: 0, col: 0, value: 1 }],
      pattern: {
        type: "arithmetic",
        confidence: 1,
        description: "test",
      },
    };
    useSmartFillStore.getState().setSuggestion(suggestion);
    useSmartFillStore.getState().setSuggestion(null);
    const state = useSmartFillStore.getState();
    expect(state.suggestion).toBeNull();
    expect(state.isPreviewVisible).toBe(false);
  });

  it("accepts suggestion clears state", () => {
    const suggestion: SmartFillSuggestion = {
      cells: [{ row: 0, col: 0, value: 1 }],
      pattern: {
        type: "arithmetic",
        confidence: 1,
        description: "test",
      },
    };
    useSmartFillStore.getState().setSuggestion(suggestion);
    useSmartFillStore.getState().acceptSuggestion();
    const state = useSmartFillStore.getState();
    expect(state.suggestion).toBeNull();
    expect(state.isPreviewVisible).toBe(false);
  });

  it("rejects suggestion clears state", () => {
    const suggestion: SmartFillSuggestion = {
      cells: [{ row: 0, col: 0, value: 1 }],
      pattern: {
        type: "arithmetic",
        confidence: 1,
        description: "test",
      },
    };
    useSmartFillStore.getState().setSuggestion(suggestion);
    useSmartFillStore.getState().rejectSuggestion();
    const state = useSmartFillStore.getState();
    expect(state.suggestion).toBeNull();
    expect(state.isPreviewVisible).toBe(false);
  });

  it("manages organize suggestions", () => {
    const suggestions: OrganizeSuggestion[] = [
      {
        type: "add-header-format",
        description: "Format header",
        priority: 1,
      },
      {
        type: "freeze-header",
        description: "Freeze header",
        priority: 2,
      },
    ];
    useSmartFillStore.getState().setOrganizeSuggestions(suggestions);
    expect(useSmartFillStore.getState().organizeSuggestions).toHaveLength(2);
  });

  it("dismisses organize suggestion by index", () => {
    const suggestions: OrganizeSuggestion[] = [
      {
        type: "add-header-format",
        description: "Format header",
        priority: 1,
      },
      {
        type: "freeze-header",
        description: "Freeze header",
        priority: 2,
      },
    ];
    useSmartFillStore.getState().setOrganizeSuggestions(suggestions);
    useSmartFillStore.getState().dismissOrganizeSuggestion(0);
    const state = useSmartFillStore.getState();
    expect(state.organizeSuggestions).toHaveLength(1);
    expect(state.organizeSuggestions[0].type).toBe("freeze-header");
  });

  it("toggles organize panel", () => {
    useSmartFillStore.getState().setOrganizePanelOpen(true);
    expect(useSmartFillStore.getState().isOrganizePanelOpen).toBe(true);
    useSmartFillStore.getState().setOrganizePanelOpen(false);
    expect(useSmartFillStore.getState().isOrganizePanelOpen).toBe(false);
  });

  it("toggles preview visibility", () => {
    useSmartFillStore.getState().setPreviewVisible(true);
    expect(useSmartFillStore.getState().isPreviewVisible).toBe(true);
    useSmartFillStore.getState().setPreviewVisible(false);
    expect(useSmartFillStore.getState().isPreviewVisible).toBe(false);
  });
});

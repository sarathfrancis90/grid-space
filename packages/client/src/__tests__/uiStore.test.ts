import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedCell: null,
      selections: [],
      isEditing: false,
      editValue: "",
      editingCell: null,
    });
  });

  it("starts with null selected cell", () => {
    expect(useUIStore.getState().selectedCell).toBeNull();
  });

  it("sets selected cell and creates single selection", () => {
    useUIStore.getState().setSelectedCell({ row: 2, col: 3 });
    const state = useUIStore.getState();
    expect(state.selectedCell).toEqual({ row: 2, col: 3 });
    expect(state.selections).toHaveLength(1);
    expect(state.selections[0]).toEqual({
      start: { row: 2, col: 3 },
      end: { row: 2, col: 3 },
    });
  });

  it("adds selection range", () => {
    useUIStore.getState().setSelectedCell({ row: 0, col: 0 });
    useUIStore.getState().addSelection({
      start: { row: 2, col: 2 },
      end: { row: 4, col: 4 },
    });
    expect(useUIStore.getState().selections).toHaveLength(2);
  });

  it("clears selections", () => {
    useUIStore.getState().setSelectedCell({ row: 0, col: 0 });
    useUIStore.getState().clearSelections();
    expect(useUIStore.getState().selections).toHaveLength(0);
  });

  it("sets selections array", () => {
    const ranges = [
      { start: { row: 0, col: 0 }, end: { row: 1, col: 1 } },
      { start: { row: 3, col: 3 }, end: { row: 5, col: 5 } },
    ];
    useUIStore.getState().setSelections(ranges);
    expect(useUIStore.getState().selections).toEqual(ranges);
  });

  it("starts editing a cell", () => {
    useUIStore.getState().startEditing({ row: 1, col: 2 }, "hello");
    const state = useUIStore.getState();
    expect(state.isEditing).toBe(true);
    expect(state.editingCell).toEqual({ row: 1, col: 2 });
    expect(state.editValue).toBe("hello");
  });

  it("sets edit value", () => {
    useUIStore.getState().startEditing({ row: 0, col: 0 }, "");
    useUIStore.getState().setEditValue("new value");
    expect(useUIStore.getState().editValue).toBe("new value");
  });

  it("commits edit and resets editing state", () => {
    useUIStore.getState().startEditing({ row: 0, col: 0 }, "test");
    useUIStore.getState().commitEdit();
    const state = useUIStore.getState();
    expect(state.isEditing).toBe(false);
    expect(state.editingCell).toBeNull();
    expect(state.editValue).toBe("");
  });

  it("cancels edit and resets editing state", () => {
    useUIStore.getState().startEditing({ row: 0, col: 0 }, "test");
    useUIStore.getState().cancelEdit();
    const state = useUIStore.getState();
    expect(state.isEditing).toBe(false);
    expect(state.editingCell).toBeNull();
    expect(state.editValue).toBe("");
  });

  it("setting null selected cell clears selection behavior", () => {
    useUIStore.getState().setSelectedCell(null);
    expect(useUIStore.getState().selectedCell).toBeNull();
  });
});

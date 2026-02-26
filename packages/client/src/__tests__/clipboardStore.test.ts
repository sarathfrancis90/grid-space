import { describe, it, expect, beforeEach } from "vitest";
import { useClipboardStore } from "../stores/clipboardStore";
import type { CellData, SelectionRange } from "../types/grid";

describe("clipboardStore", () => {
  beforeEach(() => {
    useClipboardStore.setState({
      mode: null,
      cells: new Map(),
      sourceRange: null,
    });
  });

  it("starts with null mode", () => {
    expect(useClipboardStore.getState().mode).toBeNull();
  });

  it("copies cells", () => {
    const cells = new Map<string, CellData>([
      ["0,0", { value: "A1" }],
      ["0,1", { value: "B1" }],
    ]);
    const range: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 0, col: 1 },
    };
    useClipboardStore.getState().copy(cells, range);
    const state = useClipboardStore.getState();
    expect(state.mode).toBe("copy");
    expect(state.cells.size).toBe(2);
    expect(state.sourceRange).toEqual(range);
  });

  it("cuts cells", () => {
    const cells = new Map<string, CellData>([["0,0", { value: "hello" }]]);
    const range: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 0, col: 0 },
    };
    useClipboardStore.getState().cut(cells, range);
    expect(useClipboardStore.getState().mode).toBe("cut");
  });

  it("pastes cells at target position", () => {
    const cells = new Map<string, CellData>([
      ["0,0", { value: "A1" }],
      ["0,1", { value: "B1" }],
      ["1,0", { value: "A2" }],
    ]);
    const range: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    };
    useClipboardStore.getState().copy(cells, range);

    const result = useClipboardStore.getState().paste({ row: 5, col: 3 });
    expect(result.mode).toBe("copy");
    expect(result.cells.has("5,3")).toBe(true); // A1 → 5,3
    expect(result.cells.has("5,4")).toBe(true); // B1 → 5,4
    expect(result.cells.has("6,3")).toBe(true); // A2 → 6,3
  });

  it("paste returns empty when no source", () => {
    const result = useClipboardStore.getState().paste({ row: 0, col: 0 });
    expect(result.cells.size).toBe(0);
    expect(result.mode).toBeNull();
  });

  it("clears clipboard", () => {
    const cells = new Map<string, CellData>([["0,0", { value: "test" }]]);
    const range: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 0, col: 0 },
    };
    useClipboardStore.getState().copy(cells, range);
    useClipboardStore.getState().clear();
    const state = useClipboardStore.getState();
    expect(state.mode).toBeNull();
    expect(state.cells.size).toBe(0);
    expect(state.sourceRange).toBeNull();
  });
});

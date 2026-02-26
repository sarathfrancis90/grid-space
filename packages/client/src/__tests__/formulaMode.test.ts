/**
 * Tests for formula mode features (S2-001 to S2-004).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore, parseFormulaRefs } from "../stores/uiStore";

function resetStore() {
  useUIStore.setState({
    selectedCell: null,
    selections: [],
    isEditing: false,
    editValue: "",
    editingCell: null,
    zoom: 100,
    isFormulaMode: false,
    formulaReferences: [],
    isPrintDialogOpen: false,
    isFormatCellsDialogOpen: false,
    isPasteSpecialOpen: false,
    isCommandPaletteOpen: false,
    showGridlines: true,
    showFormulaBar: true,
    isHyperlinkDialogOpen: false,
    isImageDialogOpen: false,
  });
}

describe("S2-001: Typing = activates formula mode", () => {
  beforeEach(resetStore);

  it("sets isFormulaMode to true when startEditing with '=' prefix", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=SUM(A1:A5)");
    expect(useUIStore.getState().isFormulaMode).toBe(true);
  });

  it("does not set isFormulaMode for regular values", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "hello");
    expect(useUIStore.getState().isFormulaMode).toBe(false);
  });

  it("activates formula mode when setEditValue starts with =", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "");
    expect(useUIStore.getState().isFormulaMode).toBe(false);

    store.setEditValue("=");
    expect(useUIStore.getState().isFormulaMode).toBe(true);
  });

  it("deactivates formula mode when = is removed", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=A1");
    expect(useUIStore.getState().isFormulaMode).toBe(true);

    store.setEditValue("A1");
    expect(useUIStore.getState().isFormulaMode).toBe(false);
  });

  it("commitEdit resets formula mode", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=A1+B1");
    expect(useUIStore.getState().isFormulaMode).toBe(true);

    store.commitEdit();
    expect(useUIStore.getState().isFormulaMode).toBe(false);
    expect(useUIStore.getState().formulaReferences).toEqual([]);
  });

  it("cancelEdit resets formula mode", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=SUM(A1)");
    store.cancelEdit();
    expect(useUIStore.getState().isFormulaMode).toBe(false);
  });

  it("setFormulaMode can be called directly", () => {
    const store = useUIStore.getState();
    store.setFormulaMode(true);
    expect(useUIStore.getState().isFormulaMode).toBe(true);

    store.setFormulaMode(false);
    expect(useUIStore.getState().isFormulaMode).toBe(false);
    expect(useUIStore.getState().formulaReferences).toEqual([]);
  });
});

describe("S2-002: Formula autocomplete (tested via UI integration)", () => {
  // The FormulaAutocomplete component itself is tested by rendering.
  // Here we test that typing = triggers formula mode which controls visibility.
  beforeEach(resetStore);

  it("formula mode becomes active for autocomplete to show", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=SU");
    expect(useUIStore.getState().isFormulaMode).toBe(true);
    expect(useUIStore.getState().editValue).toBe("=SU");
  });
});

describe("S2-003: Click cell inserts reference in formula mode", () => {
  beforeEach(resetStore);

  it("insertCellReference appends reference to editValue", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=SUM(");
    store.insertCellReference("A1");
    expect(useUIStore.getState().editValue).toBe("=SUM(A1");
  });

  it("insertCellReference does nothing when not in formula mode", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "hello");
    store.insertCellReference("A1");
    expect(useUIStore.getState().editValue).toBe("hello");
  });

  it("insertCellReference does nothing when not editing", () => {
    const store = useUIStore.getState();
    store.setFormulaMode(true);
    store.insertCellReference("A1");
    // Not editing, so editValue stays empty
    expect(useUIStore.getState().editValue).toBe("");
  });

  it("insertCellReference updates formula references", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=");
    store.insertCellReference("B2");
    expect(useUIStore.getState().editValue).toBe("=B2");
    expect(useUIStore.getState().formulaReferences.length).toBeGreaterThan(0);
    expect(useUIStore.getState().formulaReferences[0].cellKey).toBe("B2");
  });

  it("appends multiple references", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=");
    store.insertCellReference("A1");
    store.insertCellReference("+B2");
    expect(useUIStore.getState().editValue).toBe("=A1+B2");
    expect(useUIStore.getState().formulaReferences).toHaveLength(2);
  });
});

describe("S2-004: Color-coded range references", () => {
  beforeEach(resetStore);

  it("parseFormulaRefs extracts single cell reference", () => {
    const refs = parseFormulaRefs("=A1+10");
    expect(refs).toHaveLength(1);
    expect(refs[0].cellKey).toBe("A1");
    expect(refs[0].color).toBeTruthy();
  });

  it("parseFormulaRefs extracts multiple cell references", () => {
    const refs = parseFormulaRefs("=A1+B2*C3");
    expect(refs).toHaveLength(3);
    const keys = refs.map((r) => r.cellKey.toUpperCase());
    expect(keys).toContain("A1");
    expect(keys).toContain("B2");
    expect(keys).toContain("C3");
  });

  it("parseFormulaRefs assigns different colors to different refs", () => {
    const refs = parseFormulaRefs("=A1+B2");
    expect(refs[0].color).not.toBe(refs[1].color);
  });

  it("parseFormulaRefs handles range references", () => {
    const refs = parseFormulaRefs("=SUM(A1:B5)");
    expect(refs).toHaveLength(1);
    expect(refs[0].cellKey).toContain("A1");
  });

  it("parseFormulaRefs deduplicates same references", () => {
    const refs = parseFormulaRefs("=A1+A1");
    expect(refs).toHaveLength(1);
  });

  it("parseFormulaRefs handles absolute references", () => {
    const refs = parseFormulaRefs("=$A$1+$B$2");
    expect(refs).toHaveLength(2);
  });

  it("parseFormulaRefs handles cross-sheet references", () => {
    const refs = parseFormulaRefs("=Sheet2!A1");
    expect(refs).toHaveLength(1);
    expect(refs[0].cellKey).toContain("Sheet2");
  });

  it("parseFormulaRefs returns empty for no references", () => {
    const refs = parseFormulaRefs("=100+200");
    expect(refs).toHaveLength(0);
  });

  it("updateFormulaReferences updates state", () => {
    const store = useUIStore.getState();
    store.updateFormulaReferences("=A1+B2");
    const state = useUIStore.getState();
    expect(state.formulaReferences).toHaveLength(2);
  });

  it("setEditValue updates formulaReferences when formula starts with =", () => {
    const store = useUIStore.getState();
    store.startEditing({ row: 0, col: 0 }, "=");
    store.setEditValue("=A1+B2+C3");
    const state = useUIStore.getState();
    expect(state.formulaReferences).toHaveLength(3);
  });
});

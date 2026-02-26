import { describe, it, expect, beforeEach } from "vitest";
import { useFindReplaceStore } from "../stores/findReplaceStore";
import { getCellKey } from "../utils/coordinates";
import type { CellData } from "../types/grid";

describe("findReplaceStore", () => {
  beforeEach(() => {
    useFindReplaceStore.setState({
      isOpen: false,
      showReplace: false,
      searchTerm: "",
      replaceTerm: "",
      useRegex: false,
      caseSensitive: false,
      matchEntireCell: false,
      matches: [],
      currentMatchIndex: -1,
    });
  });

  const SHEET = "sheet-1";

  function makeCells(
    values: (string | number | null)[][],
  ): Map<string, CellData> {
    const cells = new Map<string, CellData>();
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        if (values[r][c] != null) {
          cells.set(getCellKey(r, c), { value: values[r][c] });
        }
      }
    }
    return cells;
  }

  it("opens and closes dialog", () => {
    const store = useFindReplaceStore.getState();
    store.open(false);
    expect(useFindReplaceStore.getState().isOpen).toBe(true);
    expect(useFindReplaceStore.getState().showReplace).toBe(false);

    useFindReplaceStore.getState().open(true);
    expect(useFindReplaceStore.getState().showReplace).toBe(true);

    useFindReplaceStore.getState().close();
    expect(useFindReplaceStore.getState().isOpen).toBe(false);
  });

  it("finds all matching cells", () => {
    const cells = makeCells([
      ["Hello", "World"],
      ["hello again", "test"],
      ["nope", "HELLO"],
    ]);

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("hello");
    useFindReplaceStore.getState().findAll(SHEET, cells, 3, 2);

    const state = useFindReplaceStore.getState();
    // Case insensitive by default → "Hello", "hello again", "HELLO"
    expect(state.matches).toHaveLength(3);
    expect(state.currentMatchIndex).toBe(0);
  });

  it("finds with case sensitivity", () => {
    const cells = makeCells([
      ["Hello", "world"],
      ["hello", "HELLO"],
    ]);

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("Hello");
    store.setCaseSensitive(true);
    useFindReplaceStore.getState().findAll(SHEET, cells, 2, 2);

    expect(useFindReplaceStore.getState().matches).toHaveLength(1);
    expect(useFindReplaceStore.getState().matches[0]).toEqual({
      row: 0,
      col: 0,
    });
  });

  it("finds with regex", () => {
    const cells = makeCells([
      ["abc123", "def"],
      ["xyz789", "abc"],
    ]);

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("\\d{3}");
    store.setUseRegex(true);
    useFindReplaceStore.getState().findAll(SHEET, cells, 2, 2);

    // "abc123" and "xyz789" have 3-digit sequences
    expect(useFindReplaceStore.getState().matches).toHaveLength(2);
  });

  it("finds with match entire cell", () => {
    const cells = makeCells([
      ["apple", "pineapple"],
      ["apple pie", "Apple"],
    ]);

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("apple");
    store.setMatchEntireCell(true);
    useFindReplaceStore.getState().findAll(SHEET, cells, 2, 2);

    // Only exact matches: "apple" and "Apple" (case insensitive)
    expect(useFindReplaceStore.getState().matches).toHaveLength(2);
  });

  it("navigates matches with findNext and findPrev", () => {
    const cells = makeCells([
      ["a", "b"],
      ["a", "c"],
    ]);

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("a");
    useFindReplaceStore.getState().findAll(SHEET, cells, 2, 2);

    expect(useFindReplaceStore.getState().currentMatchIndex).toBe(0);

    const next = useFindReplaceStore.getState().findNext();
    expect(next).toEqual({ row: 1, col: 0 });
    expect(useFindReplaceStore.getState().currentMatchIndex).toBe(1);

    // Wraps around
    const next2 = useFindReplaceStore.getState().findNext();
    expect(next2).toEqual({ row: 0, col: 0 });
    expect(useFindReplaceStore.getState().currentMatchIndex).toBe(0);

    const prev = useFindReplaceStore.getState().findPrev();
    expect(prev).toEqual({ row: 1, col: 0 });
  });

  it("replaces current match", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "hello world" });
    cells.set(getCellKey(1, 0), { value: "hello there" });

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("hello");
    store.setReplaceTerm("goodbye");
    useFindReplaceStore.getState().findAll(SHEET, cells, 2, 1);

    const replacedCells = new Map(cells);
    const setCellFn = (
      _sheetId: string,
      row: number,
      col: number,
      data: CellData,
    ) => {
      replacedCells.set(getCellKey(row, col), data);
    };
    const getCellFn = (_sheetId: string, row: number, col: number) => {
      return replacedCells.get(getCellKey(row, col));
    };

    useFindReplaceStore.getState().replaceCurrent(SHEET, setCellFn, getCellFn);

    expect(replacedCells.get(getCellKey(0, 0))?.value).toBe("goodbye world");
    // Second cell unchanged
    expect(replacedCells.get(getCellKey(1, 0))?.value).toBe("hello there");
  });

  it("replaces all matches", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "foo bar" });
    cells.set(getCellKey(1, 0), { value: "foo baz" });
    cells.set(getCellKey(2, 0), { value: "other" });

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("foo");
    store.setReplaceTerm("qux");
    useFindReplaceStore.getState().findAll(SHEET, cells, 3, 1);

    const replacedCells = new Map(cells);
    const setCellFn = (
      _sheetId: string,
      row: number,
      col: number,
      data: CellData,
    ) => {
      replacedCells.set(getCellKey(row, col), data);
    };
    const getCellFn = (_sheetId: string, row: number, col: number) => {
      return replacedCells.get(getCellKey(row, col));
    };

    const count = useFindReplaceStore
      .getState()
      .replaceAll(SHEET, setCellFn, getCellFn);

    expect(count).toBe(2);
    expect(replacedCells.get(getCellKey(0, 0))?.value).toBe("qux bar");
    expect(replacedCells.get(getCellKey(1, 0))?.value).toBe("qux baz");
    expect(replacedCells.get(getCellKey(2, 0))?.value).toBe("other");
  });

  it("replaces with regex", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "abc123def" });

    const store = useFindReplaceStore.getState();
    store.setSearchTerm("\\d+");
    store.setReplaceTerm("NUM");
    store.setUseRegex(true);
    useFindReplaceStore.getState().findAll(SHEET, cells, 1, 1);

    const replacedCells = new Map(cells);
    const setCellFn = (
      _sheetId: string,
      row: number,
      col: number,
      data: CellData,
    ) => {
      replacedCells.set(getCellKey(row, col), data);
    };
    const getCellFn = (_sheetId: string, row: number, col: number) => {
      return replacedCells.get(getCellKey(row, col));
    };

    const count = useFindReplaceStore
      .getState()
      .replaceAll(SHEET, setCellFn, getCellFn);

    expect(count).toBe(1);
    expect(replacedCells.get(getCellKey(0, 0))?.value).toBe("abcNUMdef");
  });
});

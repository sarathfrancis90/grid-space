import { describe, it, expect } from "vitest";
import {
  splitTextToColumns,
  findDuplicateRows,
  removeDuplicateRows,
  trimWhitespace,
} from "../utils/dataCleanup";
import { getCellKey } from "../utils/coordinates";
import type { CellData } from "../types/grid";

describe("splitTextToColumns", () => {
  it("splits by comma", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "John,Doe,30" });
    cells.set(getCellKey(1, 0), { value: "Jane,Smith,25" });

    const result = splitTextToColumns(cells, "sheet-1", 0, 0, 1, ",");

    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ row: 0, col: 0, data: { value: "John" } });
    expect(result[1]).toEqual({ row: 0, col: 1, data: { value: "Doe" } });
    expect(result[2]).toEqual({ row: 0, col: 2, data: { value: "30" } });
    expect(result[3]).toEqual({ row: 1, col: 0, data: { value: "Jane" } });
  });

  it("trims whitespace in split parts", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "a , b , c" });

    const result = splitTextToColumns(cells, "sheet-1", 0, 0, 0, ",");
    expect(result[0].data.value).toBe("a");
    expect(result[1].data.value).toBe("b");
    expect(result[2].data.value).toBe("c");
  });

  it("skips null cells", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(1, 0), { value: "x,y" });

    const result = splitTextToColumns(cells, "sheet-1", 0, 0, 1, ",");
    expect(result).toHaveLength(2); // only row 1
  });
});

describe("findDuplicateRows", () => {
  it("finds duplicate rows", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "Alice" });
    cells.set(getCellKey(0, 1), { value: 10 });
    cells.set(getCellKey(1, 0), { value: "Bob" });
    cells.set(getCellKey(1, 1), { value: 20 });
    cells.set(getCellKey(2, 0), { value: "Alice" });
    cells.set(getCellKey(2, 1), { value: 10 });
    cells.set(getCellKey(3, 0), { value: "Alice" });
    cells.set(getCellKey(3, 1), { value: 30 });

    const dupes = findDuplicateRows(cells, 0, 3, [0, 1]);
    expect(dupes.size).toBe(1);
    expect(dupes.has(2)).toBe(true); // row 2 is a dup of row 0
  });

  it("returns empty set when no duplicates", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "A" });
    cells.set(getCellKey(1, 0), { value: "B" });
    cells.set(getCellKey(2, 0), { value: "C" });

    const dupes = findDuplicateRows(cells, 0, 2, [0]);
    expect(dupes.size).toBe(0);
  });

  it("finds duplicates with single key column", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "X" });
    cells.set(getCellKey(1, 0), { value: "Y" });
    cells.set(getCellKey(2, 0), { value: "X" });

    const dupes = findDuplicateRows(cells, 0, 2, [0]);
    expect(dupes.size).toBe(1);
    expect(dupes.has(2)).toBe(true);
  });
});

describe("removeDuplicateRows", () => {
  it("removes duplicate rows and shifts", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "A" });
    cells.set(getCellKey(1, 0), { value: "B" });
    cells.set(getCellKey(2, 0), { value: "A" });
    cells.set(getCellKey(3, 0), { value: "C" });

    const { newCells, removedCount } = removeDuplicateRows(
      cells,
      0,
      3,
      0,
      0,
      [0],
    );

    expect(removedCount).toBe(1);
    expect(newCells.get(getCellKey(0, 0))?.value).toBe("A");
    expect(newCells.get(getCellKey(1, 0))?.value).toBe("B");
    expect(newCells.get(getCellKey(2, 0))?.value).toBe("C");
  });
});

describe("trimWhitespace", () => {
  it("trims leading and trailing whitespace", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: "  hello  " });
    cells.set(getCellKey(1, 0), { value: "world" });
    cells.set(getCellKey(2, 0), { value: "  foo   bar  " });

    const result = trimWhitespace(cells, 0, 2, 0, 0);

    expect(result).toHaveLength(2); // "world" unchanged
    expect(result[0].data.value).toBe("hello");
    expect(result[1].data.value).toBe("foo bar");
  });

  it("skips non-string values", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: 42 });
    cells.set(getCellKey(1, 0), { value: true });

    const result = trimWhitespace(cells, 0, 1, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("skips null cells", () => {
    const cells = new Map<string, CellData>();
    cells.set(getCellKey(0, 0), { value: null });

    const result = trimWhitespace(cells, 0, 0, 0, 0);
    expect(result).toHaveLength(0);
  });
});

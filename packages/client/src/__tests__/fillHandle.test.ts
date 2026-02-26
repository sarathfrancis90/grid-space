import { describe, it, expect } from "vitest";
import { detectPattern, generateFillValues } from "../utils/fillHandle";
import type { CellData } from "../types/grid";

describe("detectPattern", () => {
  it("detects arithmetic sequence from numbers", () => {
    const cells: CellData[] = [{ value: 1 }, { value: 2 }, { value: 3 }];
    const pattern = detectPattern(cells);
    expect(pattern.type).toBe("arithmetic");
    expect(pattern.startValue).toBe(1);
    expect(pattern.step).toBe(1);
  });

  it("detects arithmetic sequence with step 5", () => {
    const cells: CellData[] = [{ value: 10 }, { value: 15 }];
    const pattern = detectPattern(cells);
    expect(pattern.type).toBe("arithmetic");
    expect(pattern.step).toBe(5);
  });

  it("detects repeat for single number", () => {
    const cells: CellData[] = [{ value: 42 }];
    const pattern = detectPattern(cells);
    expect(pattern.type).toBe("repeat");
    expect(pattern.startValue).toBe(42);
  });

  it("detects repeat for strings", () => {
    const cells: CellData[] = [{ value: "hello" }, { value: "world" }];
    const pattern = detectPattern(cells);
    expect(pattern.type).toBe("repeat");
  });

  it("detects repeat for null values", () => {
    const cells: CellData[] = [{ value: null }];
    const pattern = detectPattern(cells);
    expect(pattern.type).toBe("repeat");
  });

  it("detects arithmetic from string numbers", () => {
    const cells: CellData[] = [{ value: "1" }, { value: "2" }];
    const pattern = detectPattern(cells);
    expect(pattern.type).toBe("arithmetic");
    expect(pattern.step).toBe(1);
  });

  it("returns repeat for non-arithmetic numbers", () => {
    const cells: CellData[] = [{ value: 1 }, { value: 3 }, { value: 7 }];
    const pattern = detectPattern(cells);
    expect(pattern.type).toBe("repeat");
  });
});

describe("generateFillValues", () => {
  it("generates arithmetic fill", () => {
    const source: CellData[] = [{ value: 1 }, { value: 2 }, { value: 3 }];
    const result = generateFillValues(source, 3);
    expect(result).toHaveLength(3);
    expect(result[0].value).toBe(4);
    expect(result[1].value).toBe(5);
    expect(result[2].value).toBe(6);
  });

  it("generates repeat fill for strings", () => {
    const source: CellData[] = [{ value: "a" }, { value: "b" }];
    const result = generateFillValues(source, 4);
    expect(result).toHaveLength(4);
    expect(result[0].value).toBe("a");
    expect(result[1].value).toBe("b");
    expect(result[2].value).toBe("a");
    expect(result[3].value).toBe("b");
  });

  it("generates fill with step 10", () => {
    const source: CellData[] = [{ value: 10 }, { value: 20 }];
    const result = generateFillValues(source, 2);
    expect(result[0].value).toBe(30);
    expect(result[1].value).toBe(40);
  });

  it("returns empty for empty source", () => {
    const result = generateFillValues([], 5);
    expect(result).toHaveLength(0);
  });

  it("returns empty for count 0", () => {
    const source: CellData[] = [{ value: 1 }];
    const result = generateFillValues(source, 0);
    expect(result).toHaveLength(0);
  });

  it("repeats single value", () => {
    const source: CellData[] = [{ value: 42 }];
    const result = generateFillValues(source, 3);
    expect(result).toHaveLength(3);
    expect(result[0].value).toBe(42);
    expect(result[1].value).toBe(42);
    expect(result[2].value).toBe(42);
  });
});

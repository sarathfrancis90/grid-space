import { describe, it, expect } from "vitest";
import {
  detectSmartPattern,
  generateSmartFillValues,
  generateSmartFillSuggestion,
} from "../utils/smartFill";
import type { CellData } from "../types/grid";

describe("detectSmartPattern", () => {
  it("detects arithmetic sequence", () => {
    const cells: CellData[] = [{ value: 1 }, { value: 2 }, { value: 3 }];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("arithmetic");
    expect(pattern.confidence).toBe(1);
  });

  it("detects arithmetic with negative step", () => {
    const cells: CellData[] = [{ value: 10 }, { value: 8 }, { value: 6 }];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("arithmetic");
    expect(pattern.description).toContain("-2");
  });

  it("detects geometric sequence", () => {
    const cells: CellData[] = [{ value: 2 }, { value: 4 }, { value: 8 }];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("geometric");
    expect(pattern.confidence).toBeGreaterThan(0.9);
  });

  it("detects day name sequence (full)", () => {
    const cells: CellData[] = [
      { value: "Monday" },
      { value: "Tuesday" },
      { value: "Wednesday" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("day-names");
    expect(pattern.confidence).toBe(1);
  });

  it("detects day name sequence (abbreviated)", () => {
    const cells: CellData[] = [
      { value: "Mon" },
      { value: "Tue" },
      { value: "Wed" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("day-names");
  });

  it("detects month name sequence (full)", () => {
    const cells: CellData[] = [
      { value: "January" },
      { value: "February" },
      { value: "March" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("month-names");
  });

  it("detects month name sequence (abbreviated)", () => {
    const cells: CellData[] = [
      { value: "Jan" },
      { value: "Feb" },
      { value: "Mar" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("month-names");
  });

  it("detects text+number pattern", () => {
    const cells: CellData[] = [
      { value: "Item1" },
      { value: "Item2" },
      { value: "Item3" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("text-number");
    expect(pattern.confidence).toBeGreaterThan(0.8);
  });

  it("detects number+suffix pattern (ordinals)", () => {
    const cells: CellData[] = [
      { value: "1st" },
      { value: "2nd" },
      { value: "3rd" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("number-suffix");
  });

  it("detects date sequence (ISO)", () => {
    const cells: CellData[] = [
      { value: "2024-01-01" },
      { value: "2024-01-02" },
      { value: "2024-01-03" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("date-sequence");
    expect(pattern.description).toContain("Daily");
  });

  it("detects weekly date sequence", () => {
    const cells: CellData[] = [
      { value: "2024-01-01" },
      { value: "2024-01-08" },
      { value: "2024-01-15" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("date-sequence");
    expect(pattern.description).toContain("Weekly");
  });

  it("detects constant value", () => {
    const cells: CellData[] = [
      { value: "same" },
      { value: "same" },
      { value: "same" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("constant");
  });

  it("detects repeat cycle", () => {
    const cells: CellData[] = [
      { value: "A" },
      { value: "B" },
      { value: "A" },
      { value: "B" },
    ];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("repeat-cycle");
  });

  it("returns unknown for empty values", () => {
    const cells: CellData[] = [{ value: null }];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("unknown");
  });

  it("returns unknown for random strings", () => {
    const cells: CellData[] = [{ value: "apple" }, { value: "banana" }];
    const pattern = detectSmartPattern(cells);
    expect(pattern.type).toBe("unknown");
  });
});

describe("generateSmartFillValues", () => {
  it("generates arithmetic values", () => {
    const source: CellData[] = [{ value: 1 }, { value: 3 }, { value: 5 }];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual([7, 9, 11]);
  });

  it("generates geometric values", () => {
    const source: CellData[] = [{ value: 2 }, { value: 4 }, { value: 8 }];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual([16, 32, 64]);
  });

  it("generates day names continuing from source", () => {
    const source: CellData[] = [
      { value: "Monday" },
      { value: "Tuesday" },
      { value: "Wednesday" },
    ];
    const result = generateSmartFillValues(source, 4);
    expect(result).toEqual(["Thursday", "Friday", "Saturday", "Sunday"]);
  });

  it("generates abbreviated day names", () => {
    const source: CellData[] = [{ value: "Mon" }, { value: "Tue" }];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual(["Wed", "Thu", "Fri"]);
  });

  it("generates month names continuing from source", () => {
    const source: CellData[] = [
      { value: "January" },
      { value: "February" },
      { value: "March" },
    ];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual(["April", "May", "June"]);
  });

  it("wraps around month names", () => {
    const source: CellData[] = [{ value: "Nov" }, { value: "Dec" }];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual(["Jan", "Feb", "Mar"]);
  });

  it("generates text+number values", () => {
    const source: CellData[] = [
      { value: "Item1" },
      { value: "Item2" },
      { value: "Item3" },
    ];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual(["Item4", "Item5", "Item6"]);
  });

  it("generates ordinal suffixes", () => {
    const source: CellData[] = [
      { value: "1st" },
      { value: "2nd" },
      { value: "3rd" },
    ];
    const result = generateSmartFillValues(source, 4);
    expect(result).toEqual(["4th", "5th", "6th", "7th"]);
  });

  it("handles 11th, 12th, 13th ordinals correctly", () => {
    const source: CellData[] = [
      { value: "9th" },
      { value: "10th" },
      { value: "11th" },
    ];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual(["12th", "13th", "14th"]);
  });

  it("generates date sequence (ISO format)", () => {
    const source: CellData[] = [
      { value: "2024-01-01" },
      { value: "2024-01-02" },
      { value: "2024-01-03" },
    ];
    const result = generateSmartFillValues(source, 2);
    expect(result).toEqual(["2024-01-04", "2024-01-05"]);
  });

  it("generates constant values", () => {
    const source: CellData[] = [{ value: "fixed" }, { value: "fixed" }];
    const result = generateSmartFillValues(source, 3);
    expect(result).toEqual(["fixed", "fixed", "fixed"]);
  });

  it("generates repeat cycle values", () => {
    const source: CellData[] = [
      { value: "A" },
      { value: "B" },
      { value: "A" },
      { value: "B" },
    ];
    const result = generateSmartFillValues(source, 4);
    expect(result).toEqual(["A", "B", "A", "B"]);
  });

  it("returns empty for empty source", () => {
    const result = generateSmartFillValues([], 5);
    expect(result).toEqual([]);
  });

  it("returns empty for count 0", () => {
    const result = generateSmartFillValues([{ value: 1 }], 0);
    expect(result).toEqual([]);
  });
});

describe("generateSmartFillSuggestion", () => {
  it("generates suggestion for column fill down", () => {
    const source: CellData[] = [{ value: 1 }, { value: 2 }, { value: 3 }];
    const suggestion = generateSmartFillSuggestion(
      source,
      { row: 0, col: 0 },
      { row: 3, col: 0 },
      3,
      "down",
    );
    expect(suggestion).not.toBeNull();
    expect(suggestion!.cells).toHaveLength(3);
    expect(suggestion!.cells[0]).toEqual({ row: 3, col: 0, value: 4 });
    expect(suggestion!.cells[1]).toEqual({ row: 4, col: 0, value: 5 });
    expect(suggestion!.cells[2]).toEqual({ row: 5, col: 0, value: 6 });
    expect(suggestion!.pattern.type).toBe("arithmetic");
  });

  it("generates suggestion for row fill right", () => {
    const source: CellData[] = [{ value: 10 }, { value: 20 }];
    const suggestion = generateSmartFillSuggestion(
      source,
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      3,
      "right",
    );
    expect(suggestion).not.toBeNull();
    expect(suggestion!.cells[0]).toEqual({ row: 0, col: 2, value: 30 });
    expect(suggestion!.cells[1]).toEqual({ row: 0, col: 3, value: 40 });
    expect(suggestion!.cells[2]).toEqual({ row: 0, col: 4, value: 50 });
  });

  it("returns null for unknown pattern", () => {
    const source: CellData[] = [{ value: "apple" }, { value: "banana" }];
    const suggestion = generateSmartFillSuggestion(
      source,
      { row: 0, col: 0 },
      { row: 2, col: 0 },
      3,
      "down",
    );
    expect(suggestion).toBeNull();
  });
});

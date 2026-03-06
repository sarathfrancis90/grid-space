import { describe, it, expect } from "vitest";
import { parseFormula } from "../components/formula/parser";
import { evaluate } from "../components/formula/evaluator";
import type { CellValueGetter, FormulaValue } from "../types/formula";

function evalFormula(
  formula: string,
  cells: Record<string, FormulaValue> = {},
): FormulaValue {
  const getCellValue: CellValueGetter = (_sheet, col, row) => {
    const colLetter = String.fromCharCode(65 + col);
    const key = `${colLetter}${row + 1}`;
    return cells[key] ?? null;
  };
  const ast = parseFormula(formula);
  return evaluate(ast, getCellValue);
}

describe("STDEVP — population standard deviation", () => {
  it("computes population stdev for a set of numbers", () => {
    // Population stdev of [2, 4, 4, 4, 5, 5, 7, 9]
    // Mean = 5, variance = 4, stdev = 2
    const result = evalFormula("STDEVP(2, 4, 4, 4, 5, 5, 7, 9)");
    expect(result).toBe(2);
  });

  it("returns 0 for single value", () => {
    expect(evalFormula("STDEVP(5)")).toBe(0);
  });

  it("returns #DIV/0! for empty input", () => {
    expect(evalFormula('STDEVP("abc")')).toBe("#DIV/0!");
  });

  it("works with cell range", () => {
    const cells = { A1: 10, A2: 20, A3: 30 };
    // Mean = 20, variance = (100+0+100)/3 = 66.667, stdev ≈ 8.165
    const result = evalFormula("STDEVP(A1:A3)", cells);
    expect(result).toBeCloseTo(8.16496580927726, 5);
  });
});

describe("VARP — population variance", () => {
  it("computes population variance for a set of numbers", () => {
    // Population variance of [2, 4, 4, 4, 5, 5, 7, 9]
    // Mean = 5, variance = 4
    const result = evalFormula("VARP(2, 4, 4, 4, 5, 5, 7, 9)");
    expect(result).toBe(4);
  });

  it("returns 0 for single value", () => {
    expect(evalFormula("VARP(5)")).toBe(0);
  });

  it("returns #DIV/0! for empty input", () => {
    expect(evalFormula('VARP("abc")')).toBe("#DIV/0!");
  });

  it("works with cell range", () => {
    const cells = { A1: 10, A2: 20, A3: 30 };
    // Mean = 20, variance = (100+0+100)/3 ≈ 66.667
    const result = evalFormula("VARP(A1:A3)", cells);
    expect(result).toBeCloseTo(66.66666666666667, 5);
  });
});

describe("MAXIFS — max with criteria", () => {
  const cells: Record<string, FormulaValue> = {
    A1: 10,
    A2: 20,
    A3: 30,
    A4: 40,
    A5: 50,
    B1: "apple",
    B2: "banana",
    B3: "apple",
    B4: "banana",
    B5: "apple",
  };

  it("returns max value matching single criteria", () => {
    const result = evalFormula('MAXIFS(A1:A5, B1:B5, "apple")', cells);
    // apple rows: 10, 30, 50 → max = 50
    expect(result).toBe(50);
  });

  it("returns max value matching another criteria", () => {
    const result = evalFormula('MAXIFS(A1:A5, B1:B5, "banana")', cells);
    // banana rows: 20, 40 → max = 40
    expect(result).toBe(40);
  });

  it("returns 0 when no criteria match", () => {
    const result = evalFormula('MAXIFS(A1:A5, B1:B5, "cherry")', cells);
    expect(result).toBe(0);
  });

  it("supports numeric criteria", () => {
    const result = evalFormula('MAXIFS(A1:A5, A1:A5, ">25")', cells);
    // Values > 25: 30, 40, 50 → max = 50
    expect(result).toBe(50);
  });

  it("supports multi-criteria", () => {
    const extCells: Record<string, FormulaValue> = {
      ...cells,
      C1: 1,
      C2: 2,
      C3: 1,
      C4: 2,
      C5: 2,
    };
    const result = evalFormula(
      'MAXIFS(A1:A5, B1:B5, "apple", C1:C5, 1)',
      extCells,
    );
    // apple AND C=1: rows 1,3 → values 10, 30 → max = 30
    expect(result).toBe(30);
  });

  it("returns #VALUE! for wrong arg count", () => {
    expect(evalFormula("MAXIFS(A1:A5, B1:B5)", cells)).toBe("#VALUE!");
  });
});

describe("MINIFS — min with criteria", () => {
  const cells: Record<string, FormulaValue> = {
    A1: 10,
    A2: 20,
    A3: 30,
    A4: 40,
    A5: 50,
    B1: "apple",
    B2: "banana",
    B3: "apple",
    B4: "banana",
    B5: "apple",
  };

  it("returns min value matching single criteria", () => {
    const result = evalFormula('MINIFS(A1:A5, B1:B5, "apple")', cells);
    // apple rows: 10, 30, 50 → min = 10
    expect(result).toBe(10);
  });

  it("returns min value matching another criteria", () => {
    const result = evalFormula('MINIFS(A1:A5, B1:B5, "banana")', cells);
    // banana rows: 20, 40 → min = 20
    expect(result).toBe(20);
  });

  it("returns 0 when no criteria match", () => {
    const result = evalFormula('MINIFS(A1:A5, B1:B5, "cherry")', cells);
    expect(result).toBe(0);
  });

  it("supports numeric criteria", () => {
    const result = evalFormula('MINIFS(A1:A5, A1:A5, ">25")', cells);
    // Values > 25: 30, 40, 50 → min = 30
    expect(result).toBe(30);
  });

  it("supports multi-criteria", () => {
    const extCells: Record<string, FormulaValue> = {
      ...cells,
      C1: 1,
      C2: 2,
      C3: 1,
      C4: 2,
      C5: 2,
    };
    const result = evalFormula(
      'MINIFS(A1:A5, B1:B5, "apple", C1:C5, 1)',
      extCells,
    );
    // apple AND C=1: rows 1,3 → values 10, 30 → min = 10
    expect(result).toBe(10);
  });

  it("returns #VALUE! for wrong arg count", () => {
    expect(evalFormula("MINIFS(A1:A5, B1:B5)", cells)).toBe("#VALUE!");
  });
});

import { describe, it, expect } from "vitest";
import { parseFormula } from "../components/formula/parser";
import { evaluate } from "../components/formula/evaluator";
import type { CellValueGetter, FormulaValue } from "../types/formula";

/**
 * Helper: evaluate a formula string with a mock cell value getter.
 */
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

/**
 * Parse the __SPARKLINE__ marker string back to an object for assertions.
 */
function parseSparkline(value: FormulaValue): Record<string, unknown> | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("__SPARKLINE__")) return null;
  return JSON.parse(value.slice("__SPARKLINE__".length));
}

describe("SPARKLINE function", () => {
  it("returns #VALUE! with no arguments", () => {
    expect(evalFormula("SPARKLINE()")).toBe("#VALUE!");
  });

  it("creates a line sparkline from a range", () => {
    const cells = { A1: 1, A2: 3, A3: 2, A4: 5, A5: 4 };
    const result = evalFormula("SPARKLINE(A1:A5)", cells);
    const spark = parseSparkline(result);
    expect(spark).not.toBeNull();
    expect(spark!.data).toEqual([1, 3, 2, 5, 4]);
    expect(spark!.type).toBe("line");
  });

  it("defaults to line chart type", () => {
    const cells = { A1: 10, A2: 20 };
    const result = evalFormula("SPARKLINE(A1:A2)", cells);
    const spark = parseSparkline(result);
    expect(spark!.type).toBe("line");
  });

  it("skips non-numeric values in data", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: "hello",
      A3: 3,
      A4: null,
      A5: 5,
    };
    const result = evalFormula("SPARKLINE(A1:A5)", cells);
    const spark = parseSparkline(result);
    expect(spark!.data).toEqual([1, 3, 5]);
  });

  it("returns #VALUE! when all values are non-numeric", () => {
    const cells: Record<string, FormulaValue> = {
      A1: "hello",
      A2: "world",
    };
    const result = evalFormula("SPARKLINE(A1:A2)", cells);
    expect(result).toBe("#VALUE!");
  });

  it("works with a single numeric argument", () => {
    const result = evalFormula("SPARKLINE(42)");
    const spark = parseSparkline(result);
    expect(spark!.data).toEqual([42]);
    expect(spark!.type).toBe("line");
  });

  it("preserves color option", () => {
    const cells = { A1: 1, A2: 2 };
    // Options passed as key-value pairs in a range: "color", "red"
    // Simulating: SPARKLINE(A1:A2, B1:B4) where B1="charttype", B2="bar", B3="color", B4="red"
    const cellsWithOpts: Record<string, FormulaValue> = {
      ...cells,
      B1: "charttype",
      B2: "bar",
      B3: "color",
      B4: "#ff0000",
    };
    const result = evalFormula("SPARKLINE(A1:A2, B1:B4)", cellsWithOpts);
    const spark = parseSparkline(result);
    expect(spark!.type).toBe("bar");
    expect(spark!.color).toBe("#ff0000");
  });

  it("supports column chart type", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: 3,
      A3: 2,
      B1: "charttype",
      B2: "column",
    };
    const result = evalFormula("SPARKLINE(A1:A3, B1:B2)", cells);
    const spark = parseSparkline(result);
    expect(spark!.type).toBe("column");
  });

  it("supports winloss chart type", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: -1,
      A3: 1,
      B1: "charttype",
      B2: "winloss",
    };
    const result = evalFormula("SPARKLINE(A1:A3, B1:B2)", cells);
    const spark = parseSparkline(result);
    expect(spark!.type).toBe("winloss");
  });

  it("falls back to line for unknown chart type", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: 2,
      B1: "charttype",
      B2: "unknown",
    };
    const result = evalFormula("SPARKLINE(A1:A2, B1:B2)", cells);
    const spark = parseSparkline(result);
    expect(spark!.type).toBe("line");
  });

  it("preserves linewidth option", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: 2,
      B1: "linewidth",
      B2: 3,
    };
    const result = evalFormula("SPARKLINE(A1:A2, B1:B2)", cells);
    const spark = parseSparkline(result);
    expect(spark!.linewidth).toBe(3);
  });

  it("preserves min and max options", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 5,
      A2: 10,
      B1: "min",
      B2: 0,
      B3: "max",
      B4: 20,
    };
    const result = evalFormula("SPARKLINE(A1:A2, B1:B4)", cells);
    const spark = parseSparkline(result);
    expect(spark!.min).toBe(0);
    expect(spark!.max).toBe(20);
  });

  it("preserves negcolor option", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: -1,
      B1: "charttype",
      B2: "column",
      B3: "negcolor",
      B4: "#dc3912",
    };
    const result = evalFormula("SPARKLINE(A1:A2, B1:B4)", cells);
    const spark = parseSparkline(result);
    expect(spark!.negcolor).toBe("#dc3912");
  });

  it("preserves highcolor and lowcolor options", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: 5,
      A3: 2,
      B1: "highcolor",
      B2: "green",
      B3: "lowcolor",
      B4: "red",
    };
    const result = evalFormula("SPARKLINE(A1:A3, B1:B4)", cells);
    const spark = parseSparkline(result);
    expect(spark!.highcolor).toBe("green");
    expect(spark!.lowcolor).toBe("red");
  });

  it("preserves firstcolor and lastcolor options", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: 2,
      A3: 3,
      B1: "firstcolor",
      B2: "blue",
      B3: "lastcolor",
      B4: "orange",
    };
    const result = evalFormula("SPARKLINE(A1:A3, B1:B4)", cells);
    const spark = parseSparkline(result);
    expect(spark!.firstcolor).toBe("blue");
    expect(spark!.lastcolor).toBe("orange");
  });

  it("preserves rtl option", () => {
    const cells: Record<string, FormulaValue> = {
      A1: 1,
      A2: 2,
      B1: "rtl",
      B2: "true",
    };
    const result = evalFormula("SPARKLINE(A1:A2, B1:B2)", cells);
    const spark = parseSparkline(result);
    expect(spark!.rtl).toBe(true);
  });
});

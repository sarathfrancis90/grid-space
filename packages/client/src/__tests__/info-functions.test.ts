import { describe, it, expect, afterEach } from "vitest";
import { parseFormula } from "../components/formula/parser";
import {
  evaluate,
  setCellFormulaChecker,
} from "../components/formula/evaluator";
import type { CellValueGetter, FormulaValue } from "../types/formula";

interface CellEntry {
  value: FormulaValue;
  formula?: string;
}

function evalFormula(
  formula: string,
  cells: Record<string, FormulaValue | CellEntry> = {},
): FormulaValue {
  const getCellValue: CellValueGetter = (_sheet, col, row) => {
    const colLetter = String.fromCharCode(65 + col);
    const key = `${colLetter}${row + 1}`;
    const entry = cells[key];
    if (entry === undefined || entry === null) return null;
    if (typeof entry === "object" && entry !== null && "value" in entry) {
      return (entry as CellEntry).value;
    }
    return entry as FormulaValue;
  };
  const ast = parseFormula(formula);
  return evaluate(ast, getCellValue);
}

afterEach(() => {
  setCellFormulaChecker(null);
});

// --- ISEVEN ---
describe("ISEVEN", () => {
  it("returns TRUE for even number", () => {
    expect(evalFormula("ISEVEN(4)")).toBe(true);
  });
  it("returns FALSE for odd number", () => {
    expect(evalFormula("ISEVEN(3)")).toBe(false);
  });
  it("returns TRUE for zero", () => {
    expect(evalFormula("ISEVEN(0)")).toBe(true);
  });
  it("returns TRUE for negative even number", () => {
    expect(evalFormula("ISEVEN(-2)")).toBe(true);
  });
  it("truncates decimal before checking", () => {
    expect(evalFormula("ISEVEN(4.7)")).toBe(true);
    expect(evalFormula("ISEVEN(3.9)")).toBe(false);
  });
  it("returns #VALUE! for non-numeric", () => {
    expect(evalFormula('ISEVEN("hello")')).toBe("#VALUE!");
  });
});

// --- ISODD ---
describe("ISODD", () => {
  it("returns TRUE for odd number", () => {
    expect(evalFormula("ISODD(3)")).toBe(true);
  });
  it("returns FALSE for even number", () => {
    expect(evalFormula("ISODD(4)")).toBe(false);
  });
  it("returns FALSE for zero", () => {
    expect(evalFormula("ISODD(0)")).toBe(false);
  });
  it("returns TRUE for negative odd number", () => {
    expect(evalFormula("ISODD(-3)")).toBe(true);
  });
  it("truncates decimal before checking", () => {
    expect(evalFormula("ISODD(3.1)")).toBe(true);
    expect(evalFormula("ISODD(4.9)")).toBe(false);
  });
});

// --- ISNA ---
describe("ISNA", () => {
  it("returns TRUE for #N/A", () => {
    expect(evalFormula("ISNA(MATCH(99, A1:A3, 0))", {})).toBe(true);
  });
  it("returns FALSE for other errors", () => {
    expect(evalFormula("ISNA(1/0)")).toBe(false);
  });
  it("returns FALSE for normal values", () => {
    expect(evalFormula("ISNA(42)")).toBe(false);
    expect(evalFormula('ISNA("hello")')).toBe(false);
  });
});

// --- ISERR ---
describe("ISERR", () => {
  it("returns TRUE for #DIV/0!", () => {
    expect(evalFormula("ISERR(1/0)")).toBe(true);
  });
  it("returns TRUE for #VALUE!", () => {
    expect(evalFormula('ISERR("abc"+1)')).toBe(true);
  });
  it("returns FALSE for #N/A", () => {
    expect(evalFormula("ISERR(MATCH(99, A1:A3, 0))", {})).toBe(false);
  });
  it("returns FALSE for normal values", () => {
    expect(evalFormula("ISERR(42)")).toBe(false);
  });
});

// --- ERROR.TYPE ---
describe("ERROR.TYPE", () => {
  it("returns 2 for #DIV/0!", () => {
    expect(evalFormula("ERROR.TYPE(1/0)")).toBe(2);
  });
  it("returns 3 for #VALUE!", () => {
    expect(evalFormula('ERROR.TYPE("abc"+1)')).toBe(3);
  });
  it("returns 7 for #N/A", () => {
    expect(evalFormula("ERROR.TYPE(MATCH(99, A1:A3, 0))", {})).toBe(7);
  });
  it("returns #N/A for non-error values", () => {
    expect(evalFormula("ERROR.TYPE(42)")).toBe("#N/A");
  });
});

// --- ISREF ---
describe("ISREF", () => {
  it("returns TRUE for a cell reference", () => {
    expect(evalFormula("ISREF(A1)")).toBe(true);
  });
  it("returns FALSE for a literal value", () => {
    expect(evalFormula("ISREF(42)")).toBe(false);
    expect(evalFormula('ISREF("hello")')).toBe(false);
  });
});

// --- ISFORMULA ---
describe("ISFORMULA", () => {
  it("returns TRUE when cell has formula", () => {
    setCellFormulaChecker((_sheet, col, row) => {
      // A1 has a formula
      return col === 0 && row === 0;
    });
    expect(evalFormula("ISFORMULA(A1)", { A1: 42 })).toBe(true);
  });
  it("returns FALSE when cell has no formula", () => {
    setCellFormulaChecker(() => false);
    expect(evalFormula("ISFORMULA(A1)", { A1: 42 })).toBe(false);
  });
  it("returns FALSE when no checker is set", () => {
    expect(evalFormula("ISFORMULA(A1)", { A1: 42 })).toBe(false);
  });
  it("returns #VALUE! for non-reference argument", () => {
    expect(evalFormula("ISFORMULA(42)")).toBe("#VALUE!");
  });
});

// --- CELL ---
describe("CELL", () => {
  it('returns address for "address"', () => {
    expect(evalFormula('CELL("address", A1)')).toBe("$A$1");
  });
  it('returns column number for "col"', () => {
    expect(evalFormula('CELL("col", B1)')).toBe(2);
  });
  it('returns row number for "row"', () => {
    expect(evalFormula('CELL("row", A3)')).toBe(3);
  });
  it('returns "b" for blank cell type', () => {
    expect(evalFormula('CELL("type", A1)', {})).toBe("b");
  });
  it('returns "v" for numeric cell type', () => {
    expect(evalFormula('CELL("type", A1)', { A1: 42 })).toBe("v");
  });
  it('returns "l" for text cell type', () => {
    expect(evalFormula('CELL("type", A1)', { A1: "hello" })).toBe("l");
  });
  it("returns #VALUE! for unsupported info_type", () => {
    expect(evalFormula('CELL("width", A1)')).toBe("#VALUE!");
  });
  it("is case-insensitive for info_type", () => {
    expect(evalFormula('CELL("ADDRESS", A1)')).toBe("$A$1");
    expect(evalFormula('CELL("Col", B1)')).toBe(2);
  });
  it("returns address for multi-letter columns", () => {
    // Column Z = index 25, AA = index 26
    expect(evalFormula('CELL("address", AA1)')).toBe("$AA$1");
  });
});

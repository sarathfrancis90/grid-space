import { describe, it, expect } from "vitest";
import { parseFormula } from "../components/formula/parser";
import { evaluate } from "../components/formula/evaluator";
import type {
  CellValueGetter,
  FormulaValue,
  EvaluationContext,
} from "../types/formula";

/**
 * Helper: evaluate a formula string with a mock cell value getter.
 * Optionally accepts an evaluation context for testing ROW/COLUMN/etc.
 */
function evalFormula(
  formula: string,
  cells: Record<string, FormulaValue> = {},
  context?: EvaluationContext,
): FormulaValue {
  const getCellValue: CellValueGetter = (sheet, col, row) => {
    const colLetter = String.fromCharCode(65 + col);
    const key = sheet
      ? `${sheet}!${colLetter}${row + 1}`
      : `${colLetter}${row + 1}`;
    return cells[key] ?? null;
  };
  const ast = parseFormula(formula);
  return evaluate(ast, getCellValue, context);
}

// ---------------------------------------------------------------------------
// ROW() / COLUMN() with context
// ---------------------------------------------------------------------------
describe("ROW() with evaluator context", () => {
  it("returns current row (1-based) when called without args", () => {
    // Cell at row 4 (0-based), col 2 (0-based) → ROW() = 5
    const ctx: EvaluationContext = { currentRow: 4, currentCol: 2 };
    expect(evalFormula("ROW()", {}, ctx)).toBe(5);
  });

  it("returns 1 when no context is provided", () => {
    expect(evalFormula("ROW()")).toBe(1);
  });

  it("returns row of a cell reference", () => {
    // ROW(B3) → 3 (1-based row of B3)
    expect(evalFormula("ROW(B3)")).toBe(3);
  });

  it("returns start row of a range reference", () => {
    // ROW(A2:C5) → 2
    expect(evalFormula("ROW(A2:C5)")).toBe(2);
  });
});

describe("COLUMN() with evaluator context", () => {
  it("returns current column (1-based) when called without args", () => {
    // Cell at row 0, col 3 (0-based) → COLUMN() = 4
    const ctx: EvaluationContext = { currentRow: 0, currentCol: 3 };
    expect(evalFormula("COLUMN()", {}, ctx)).toBe(4);
  });

  it("returns 1 when no context is provided", () => {
    expect(evalFormula("COLUMN()")).toBe(1);
  });

  it("returns column of a cell reference", () => {
    // COLUMN(C1) → 3 (C is column index 2 → 1-based = 3)
    expect(evalFormula("COLUMN(C1)")).toBe(3);
  });

  it("returns start column of a range reference", () => {
    // COLUMN(B2:D5) → 2
    expect(evalFormula("COLUMN(B2:D5)")).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// ADDRESS
// ---------------------------------------------------------------------------
describe("ADDRESS", () => {
  it("creates absolute A1 reference by default", () => {
    // ADDRESS(1, 1) → "$A$1"
    expect(evalFormula("ADDRESS(1, 1)")).toBe("$A$1");
  });

  it("creates absolute reference for row 3 col 2", () => {
    expect(evalFormula("ADDRESS(3, 2)")).toBe("$B$3");
  });

  it("abs_num=2 → absolute row, relative col", () => {
    expect(evalFormula("ADDRESS(1, 1, 2)")).toBe("A$1");
  });

  it("abs_num=3 → relative row, absolute col", () => {
    expect(evalFormula("ADDRESS(1, 1, 3)")).toBe("$A1");
  });

  it("abs_num=4 → fully relative", () => {
    expect(evalFormula("ADDRESS(1, 1, 4)")).toBe("A1");
  });

  it("multi-letter column", () => {
    // Column 27 → AA
    expect(evalFormula("ADDRESS(1, 27)")).toBe("$AA$1");
  });

  it("with sheet name", () => {
    expect(evalFormula('ADDRESS(1, 1, 1, TRUE, "Sheet2")')).toBe("Sheet2!$A$1");
  });

  it("with sheet name containing spaces", () => {
    expect(evalFormula('ADDRESS(1, 1, 1, TRUE, "My Sheet")')).toBe(
      "'My Sheet'!$A$1",
    );
  });

  it("R1C1 notation", () => {
    // ADDRESS(2, 3, 1, FALSE) → R2C3
    expect(evalFormula("ADDRESS(2, 3, 1, FALSE)")).toBe("R2C3");
  });

  it("R1C1 relative notation", () => {
    // ADDRESS(2, 3, 4, FALSE) → R[2]C[3]
    expect(evalFormula("ADDRESS(2, 3, 4, FALSE)")).toBe("R[2]C[3]");
  });

  it("returns #VALUE! for invalid inputs", () => {
    expect(evalFormula("ADDRESS(0, 1)")).toBe("#VALUE!");
    expect(evalFormula("ADDRESS(1, 0)")).toBe("#VALUE!");
  });
});

// ---------------------------------------------------------------------------
// LOOKUP
// ---------------------------------------------------------------------------
describe("LOOKUP", () => {
  const cells: Record<string, FormulaValue> = {
    A1: 1,
    A2: 2,
    A3: 3,
    A4: 4,
    B1: "one",
    B2: "two",
    B3: "three",
    B4: "four",
  };

  it("searches first column and returns from last column (2-column range)", () => {
    // LOOKUP(2, A1:B4) → searches A1:A4 for 2, returns B2 = "two"
    expect(evalFormula("LOOKUP(2, A1:B4)", cells)).toBe("two");
  });

  it("searches with separate result range", () => {
    // LOOKUP(3, A1:A4, B1:B4) → "three"
    expect(evalFormula("LOOKUP(3, A1:A4, B1:B4)", cells)).toBe("three");
  });

  it("finds largest value <= search key (sorted ascending)", () => {
    // LOOKUP(2.5, A1:A4, B1:B4) → finds 2 (largest <= 2.5) → "two"
    expect(evalFormula("LOOKUP(2.5, A1:A4, B1:B4)", cells)).toBe("two");
  });

  it("returns #N/A when search key is less than all values", () => {
    expect(evalFormula("LOOKUP(0, A1:A4, B1:B4)", cells)).toBe("#N/A");
  });

  it("works with a single-row range", () => {
    const rowCells: Record<string, FormulaValue> = {
      A1: 10,
      B1: 20,
      C1: 30,
      A2: "x",
      B2: "y",
      C2: "z",
    };
    // LOOKUP(20, A1:C1, A2:C2) → "y"
    expect(evalFormula("LOOKUP(20, A1:C1, A2:C2)", rowCells)).toBe("y");
  });
});

// ---------------------------------------------------------------------------
// OFFSET
// ---------------------------------------------------------------------------
describe("OFFSET", () => {
  const cells: Record<string, FormulaValue> = {
    A1: 10,
    A2: 20,
    A3: 30,
    B1: 100,
    B2: 200,
    B3: 300,
    C1: 1000,
    C2: 2000,
    C3: 3000,
  };

  it("returns single cell offset from reference", () => {
    // OFFSET(A1, 1, 0) → A2 = 20
    expect(evalFormula("OFFSET(A1, 1, 0)", cells)).toBe(20);
  });

  it("offsets both row and column", () => {
    // OFFSET(A1, 2, 1) → B3 = 300
    expect(evalFormula("OFFSET(A1, 2, 1)", cells)).toBe(300);
  });

  it("offsets from a different starting cell", () => {
    // OFFSET(B2, -1, 1) → C1 = 1000
    expect(evalFormula("OFFSET(B2, -1, 1)", cells)).toBe(1000);
  });

  it("returns a range with height and width", () => {
    // OFFSET(A1, 0, 0, 2, 2) → [[10, 100], [20, 200]]
    const result = evalFormula("OFFSET(A1, 0, 0, 2, 2)", cells);
    expect(result).toEqual([
      [10, 100],
      [20, 200],
    ]);
  });

  it("works with SUM over offset range", () => {
    // SUM(OFFSET(A1, 0, 0, 3, 1)) → 10 + 20 + 30 = 60
    expect(evalFormula("SUM(OFFSET(A1, 0, 0, 3, 1))", cells)).toBe(60);
  });

  it("returns #REF! for negative resulting position", () => {
    // OFFSET(A1, -1, 0) → row -1 → #REF!
    expect(evalFormula("OFFSET(A1, -1, 0)", cells)).toBe("#REF!");
  });

  it("returns #VALUE! with too few arguments", () => {
    expect(evalFormula("OFFSET(A1, 1)", cells)).toBe("#VALUE!");
  });

  it("works with range as first argument", () => {
    // OFFSET(A1:A3, 0, 1) → B1:B3 (inherits height=3, width=1)
    const result = evalFormula("OFFSET(A1:A3, 0, 1)", cells);
    expect(result).toEqual([[100], [200], [300]]);
  });
});

// ---------------------------------------------------------------------------
// INDIRECT
// ---------------------------------------------------------------------------
describe("INDIRECT", () => {
  const cells: Record<string, FormulaValue> = {
    A1: "B2",
    A2: 42,
    B1: 100,
    B2: 200,
    B3: 300,
    C1: 500,
  };

  it("resolves a cell reference string", () => {
    // INDIRECT("B2") → 200
    expect(evalFormula('INDIRECT("B2")', cells)).toBe(200);
  });

  it("resolves with $ absolute references", () => {
    expect(evalFormula('INDIRECT("$B$2")', cells)).toBe(200);
  });

  it("can chain with cell containing a reference string", () => {
    // A1 contains "B2", so INDIRECT(A1) → value of B2 = 200
    expect(evalFormula("INDIRECT(A1)", cells)).toBe(200);
  });

  it("resolves a range reference string", () => {
    // INDIRECT("B1:B3") → [[100], [200], [300]]
    const result = evalFormula('INDIRECT("B1:B3")', cells);
    expect(result).toEqual([[100], [200], [300]]);
  });

  it("returns SUM of indirect range", () => {
    expect(evalFormula('SUM(INDIRECT("B1:B3"))', cells)).toBe(600);
  });

  it("returns #REF! for invalid reference string", () => {
    expect(evalFormula('INDIRECT("not_a_ref")', cells)).toBe("#REF!");
  });

  it("returns #REF! for empty string", () => {
    expect(evalFormula('INDIRECT("")', cells)).toBe("#REF!");
  });

  it("resolves sheet-qualified reference", () => {
    const sheetCells: Record<string, FormulaValue> = {
      "Sheet2!A1": 999,
    };
    expect(evalFormula('INDIRECT("Sheet2!A1")', sheetCells)).toBe(999);
  });
});

// ---------------------------------------------------------------------------
// Integration: combining functions
// ---------------------------------------------------------------------------
describe("Integration tests", () => {
  const cells: Record<string, FormulaValue> = {
    A1: 1,
    A2: 2,
    A3: 3,
    B1: 10,
    B2: 20,
    B3: 30,
  };

  it("INDEX + MATCH pattern works alongside new functions", () => {
    expect(evalFormula("INDEX(B1:B3, MATCH(2, A1:A3, 0))", cells)).toBe(20);
  });

  it("ADDRESS returns string that INDIRECT can resolve", () => {
    // ADDRESS(2, 2) → "$B$2", INDIRECT("$B$2") → 20
    expect(evalFormula("INDIRECT(ADDRESS(2, 2))", cells)).toBe(20);
  });

  it("ROW in arithmetic with context", () => {
    const ctx: EvaluationContext = { currentRow: 2, currentCol: 0 };
    // ROW() * 10 → 3 * 10 = 30
    expect(evalFormula("ROW() * 10", {}, ctx)).toBe(30);
  });
});

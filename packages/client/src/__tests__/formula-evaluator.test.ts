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

describe("Evaluator — Arithmetic", () => {
  it("evaluates 1+2 → 3", () => {
    expect(evalFormula("1+2")).toBe(3);
  });

  it("evaluates 10-3 → 7", () => {
    expect(evalFormula("10-3")).toBe(7);
  });

  it("evaluates 4*3 → 12", () => {
    expect(evalFormula("4*3")).toBe(12);
  });

  it("evaluates 10/2 → 5", () => {
    expect(evalFormula("10/2")).toBe(5);
  });

  it("evaluates 2^3 → 8", () => {
    expect(evalFormula("2^3")).toBe(8);
  });

  it("evaluates unary minus -5 → -5", () => {
    expect(evalFormula("-5")).toBe(-5);
  });

  it("evaluates 10/0 → #DIV/0!", () => {
    expect(evalFormula("10/0")).toBe("#DIV/0!");
  });

  it("evaluates 50% → 0.5", () => {
    expect(evalFormula("50%")).toBe(0.5);
  });
});

describe("Evaluator — Operator Precedence (S2-041)", () => {
  it("2+3*4 → 14 (not 20)", () => {
    expect(evalFormula("2+3*4")).toBe(14);
  });

  it("(2+3)*4 → 20", () => {
    expect(evalFormula("(2+3)*4")).toBe(20);
  });

  it("2*3^2 → 18 (not 36)", () => {
    expect(evalFormula("2*3^2")).toBe(18);
  });

  it("10-2*3 → 4", () => {
    expect(evalFormula("10-2*3")).toBe(4);
  });

  it("2+3=5 evaluates comparison correctly", () => {
    expect(evalFormula("2+3=5")).toBe(true);
  });
});

describe("Evaluator — String Concatenation", () => {
  it('evaluates "Hello"&" "&"World"', () => {
    expect(evalFormula('"Hello"&" "&"World"')).toBe("Hello World");
  });

  it("concatenates numbers as strings", () => {
    expect(evalFormula('1&"2"')).toBe("12");
  });
});

describe("Evaluator — Comparison", () => {
  it("evaluates 1=1 → true", () => {
    expect(evalFormula("1=1")).toBe(true);
  });

  it("evaluates 1<>2 → true", () => {
    expect(evalFormula("1<>2")).toBe(true);
  });

  it("evaluates 1<2 → true", () => {
    expect(evalFormula("1<2")).toBe(true);
  });

  it("evaluates 2>1 → true", () => {
    expect(evalFormula("2>1")).toBe(true);
  });

  it("evaluates 1<=1 → true", () => {
    expect(evalFormula("1<=1")).toBe(true);
  });

  it("evaluates 1>=2 → false", () => {
    expect(evalFormula("1>=2")).toBe(false);
  });
});

describe("Evaluator — Cell References (S2-005, S2-006, S2-007)", () => {
  it("resolves A1 cell reference", () => {
    expect(evalFormula("A1", { A1: 42 })).toBe(42);
  });

  it("resolves $A$1 absolute reference", () => {
    expect(evalFormula("$A$1", { A1: 42 })).toBe(42);
  });

  it("resolves $A1 mixed reference", () => {
    expect(evalFormula("$A1", { A1: 10 })).toBe(10);
  });

  it("resolves A$1 mixed reference", () => {
    expect(evalFormula("A$1", { A1: 10 })).toBe(10);
  });

  it("treats empty cell as null", () => {
    expect(evalFormula("A1")).toBe(null);
  });

  it("uses cell values in arithmetic", () => {
    expect(evalFormula("A1+B1", { A1: 10, B1: 20 })).toBe(30);
  });
});

describe("Evaluator — SUM, AVERAGE, COUNT, COUNTA, COUNTBLANK (S2-013)", () => {
  it("SUM of range", () => {
    expect(evalFormula("SUM(A1:A3)", { A1: 1, A2: 2, A3: 3 })).toBe(6);
  });

  it("SUM treats empty cells as 0", () => {
    expect(evalFormula("SUM(A1:A3)", { A1: 1, A3: 3 })).toBe(4);
  });

  it("SUM of individual values", () => {
    expect(evalFormula("SUM(1, 2, 3)")).toBe(6);
  });

  it("AVERAGE of range", () => {
    expect(evalFormula("AVERAGE(A1:A3)", { A1: 2, A2: 4, A3: 6 })).toBe(4);
  });

  it("AVERAGE with no numeric values → #DIV/0!", () => {
    expect(evalFormula("AVERAGE(A1:A2)")).toBe("#DIV/0!");
  });

  it("COUNT counts numeric values", () => {
    expect(
      evalFormula("COUNT(A1:A4)", { A1: 1, A2: "text", A3: 3, A4: null }),
    ).toBe(2);
  });

  it("COUNTA counts non-empty values", () => {
    expect(evalFormula("COUNTA(A1:A4)", { A1: 1, A2: "text", A3: 3 })).toBe(3);
  });

  it("COUNTBLANK counts empty values", () => {
    expect(evalFormula("COUNTBLANK(A1:A4)", { A1: 1, A3: 3 })).toBe(2);
  });
});

describe("Evaluator — MIN, MAX (S2-014)", () => {
  it("MIN of range", () => {
    expect(evalFormula("MIN(A1:A3)", { A1: 5, A2: 2, A3: 8 })).toBe(2);
  });

  it("MAX of range", () => {
    expect(evalFormula("MAX(A1:A3)", { A1: 5, A2: 2, A3: 8 })).toBe(8);
  });

  it("MIN with no values → 0", () => {
    expect(evalFormula("MIN(A1:A2)")).toBe(0);
  });

  it("MAX with no values → 0", () => {
    expect(evalFormula("MAX(A1:A2)")).toBe(0);
  });
});

describe("Evaluator — IF, IFS, SWITCH (S2-015)", () => {
  it("IF true branch", () => {
    expect(evalFormula("IF(TRUE, 1, 2)")).toBe(1);
  });

  it("IF false branch", () => {
    expect(evalFormula("IF(FALSE, 1, 2)")).toBe(2);
  });

  it("IF with cell condition", () => {
    expect(evalFormula("IF(A1>0, A1, 0)", { A1: 5 })).toBe(5);
  });

  it("IF with cell condition false", () => {
    expect(evalFormula("IF(A1>0, A1, 0)", { A1: -1 })).toBe(0);
  });

  it("IFS returns first true branch", () => {
    expect(evalFormula("IFS(FALSE, 1, TRUE, 2, TRUE, 3)")).toBe(2);
  });

  it("IFS returns #N/A when no condition is true", () => {
    expect(evalFormula("IFS(FALSE, 1, FALSE, 2)")).toBe("#N/A");
  });

  it("SWITCH matches first value", () => {
    expect(evalFormula("SWITCH(1, 1, 10, 2, 20)")).toBe(10);
  });

  it("SWITCH matches second value", () => {
    expect(evalFormula("SWITCH(2, 1, 10, 2, 20)")).toBe(20);
  });

  it("SWITCH uses default when no match", () => {
    expect(evalFormula("SWITCH(3, 1, 10, 2, 20, 99)")).toBe(99);
  });

  it("SWITCH returns #N/A when no match and no default", () => {
    expect(evalFormula("SWITCH(3, 1, 10, 2, 20)")).toBe("#N/A");
  });
});

describe("Evaluator — AND, OR, NOT, XOR, IFERROR, IFNA (S2-016)", () => {
  it("AND(TRUE, TRUE) → true", () => {
    expect(evalFormula("AND(TRUE, TRUE)")).toBe(true);
  });

  it("AND(TRUE, FALSE) → false", () => {
    expect(evalFormula("AND(TRUE, FALSE)")).toBe(false);
  });

  it("OR(FALSE, TRUE) → true", () => {
    expect(evalFormula("OR(FALSE, TRUE)")).toBe(true);
  });

  it("OR(FALSE, FALSE) → false", () => {
    expect(evalFormula("OR(FALSE, FALSE)")).toBe(false);
  });

  it("NOT(TRUE) → false", () => {
    expect(evalFormula("NOT(TRUE)")).toBe(false);
  });

  it("NOT(FALSE) → true", () => {
    expect(evalFormula("NOT(FALSE)")).toBe(true);
  });

  it("XOR(TRUE, FALSE) → true", () => {
    expect(evalFormula("XOR(TRUE, FALSE)")).toBe(true);
  });

  it("XOR(TRUE, TRUE) → false", () => {
    expect(evalFormula("XOR(TRUE, TRUE)")).toBe(false);
  });

  it("IFERROR catches error", () => {
    expect(evalFormula("IFERROR(1/0, 0)")).toBe(0);
  });

  it("IFERROR returns value when no error", () => {
    expect(evalFormula("IFERROR(42, 0)")).toBe(42);
  });

  it("IFNA catches #N/A", () => {
    // IFS with no matching condition returns #N/A
    expect(evalFormula("IFNA(IFS(FALSE, 1), 99)")).toBe(99);
  });

  it("IFNA does not catch other errors", () => {
    expect(evalFormula("IFNA(1/0, 99)")).toBe("#DIV/0!");
  });
});

describe("Evaluator — Nested formulas (S2-040)", () => {
  it("SUM(A1, IF(B1>0, B1, 0))", () => {
    expect(evalFormula("SUM(A1, IF(B1>0, B1, 0))", { A1: 10, B1: 5 })).toBe(15);
  });

  it("SUM(A1, IF(B1>0, B1, 0)) with negative B1", () => {
    expect(evalFormula("SUM(A1, IF(B1>0, B1, 0))", { A1: 10, B1: -5 })).toBe(
      10,
    );
  });

  it("IF(AND(A1>0, B1>0), A1+B1, 0)", () => {
    expect(evalFormula("IF(AND(A1>0, B1>0), A1+B1, 0)", { A1: 3, B1: 4 })).toBe(
      7,
    );
  });

  it("IFERROR(A1/B1, 0) with zero divisor", () => {
    expect(evalFormula("IFERROR(A1/B1, 0)", { A1: 10, B1: 0 })).toBe(0);
  });

  it("nested SUM and MAX", () => {
    expect(evalFormula("SUM(MAX(A1:A3), 10)", { A1: 1, A2: 5, A3: 3 })).toBe(
      15,
    );
  });
});

describe("Evaluator — Error Values (S2-012)", () => {
  it("#DIV/0! on division by zero", () => {
    expect(evalFormula("1/0")).toBe("#DIV/0!");
  });

  it("#VALUE! on invalid operand", () => {
    expect(evalFormula('"text"+1')).toBe("#VALUE!");
  });

  it("#NAME? on unknown function", () => {
    expect(evalFormula("UNKNOWNFUNC(1)")).toBe("#NAME?");
  });

  it("error propagates through operations", () => {
    expect(evalFormula("1+(1/0)")).toBe("#DIV/0!");
  });
});

describe("Evaluator — Function case insensitivity", () => {
  it("sum works lowercase", () => {
    // Tokenizer uppercases function names
    expect(evalFormula("SUM(1, 2, 3)")).toBe(6);
  });
});

describe("Evaluator — Cross-sheet references (S2-009)", () => {
  it("resolves cross-sheet cell reference", () => {
    const getCellValue: CellValueGetter = (sheet, col, row) => {
      if (sheet === "Sheet2" && col === 0 && row === 0) return 42;
      return null;
    };
    const ast = parseFormula("Sheet2!A1");
    expect(evaluate(ast, getCellValue)).toBe(42);
  });
});

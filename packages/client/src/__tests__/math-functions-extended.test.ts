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

// --- P0/P1: SUMPRODUCT, PRODUCT, INT, TRUNC, SIGN, SUBTOTAL ---

describe("SUMPRODUCT", () => {
  it("multiplies corresponding elements and sums", () => {
    expect(
      evalFormula("SUMPRODUCT(A1:A3, B1:B3)", {
        A1: 1,
        A2: 2,
        A3: 3,
        B1: 4,
        B2: 5,
        B3: 6,
      }),
    ).toBe(32); // 1*4 + 2*5 + 3*6
  });

  it("works with a single array", () => {
    expect(
      evalFormula("SUMPRODUCT(A1:A3)", {
        A1: 2,
        A2: 3,
        A3: 4,
      }),
    ).toBe(9); // just sums
  });

  it("returns #VALUE! for mismatched array sizes", () => {
    expect(
      evalFormula("SUMPRODUCT(A1:A3, B1:B2)", {
        A1: 1,
        A2: 2,
        A3: 3,
        B1: 4,
        B2: 5,
      }),
    ).toBe("#VALUE!");
  });
});

describe("PRODUCT", () => {
  it("returns the product of numbers", () => {
    expect(evalFormula("PRODUCT(A1:A3)", { A1: 2, A2: 3, A3: 4 })).toBe(24);
  });

  it("returns 0 for empty range", () => {
    expect(evalFormula("PRODUCT(A1:A1)", { A1: null })).toBe(0);
  });

  it("handles single number", () => {
    expect(evalFormula("PRODUCT(5)")).toBe(5);
  });
});

describe("INT", () => {
  it("rounds down positive numbers", () => {
    expect(evalFormula("INT(5.7)")).toBe(5);
  });

  it("rounds down negative numbers (toward more negative)", () => {
    expect(evalFormula("INT(-5.7)")).toBe(-6);
  });

  it("returns integer unchanged", () => {
    expect(evalFormula("INT(3)")).toBe(3);
  });
});

describe("TRUNC", () => {
  it("truncates to integer by default", () => {
    expect(evalFormula("TRUNC(5.7)")).toBe(5);
  });

  it("truncates negative numbers toward zero", () => {
    expect(evalFormula("TRUNC(-5.7)")).toBe(-5);
  });

  it("truncates to specified decimal places", () => {
    expect(evalFormula("TRUNC(3.14159, 2)")).toBe(3.14);
  });
});

describe("SIGN", () => {
  it("returns 1 for positive", () => {
    expect(evalFormula("SIGN(42)")).toBe(1);
  });

  it("returns -1 for negative", () => {
    expect(evalFormula("SIGN(-7)")).toBe(-1);
  });

  it("returns 0 for zero", () => {
    expect(evalFormula("SIGN(0)")).toBe(0);
  });
});

describe("SUBTOTAL", () => {
  it("SUM (code 9)", () => {
    expect(evalFormula("SUBTOTAL(9, A1:A3)", { A1: 10, A2: 20, A3: 30 })).toBe(
      60,
    );
  });

  it("AVERAGE (code 1)", () => {
    expect(evalFormula("SUBTOTAL(1, A1:A3)", { A1: 10, A2: 20, A3: 30 })).toBe(
      20,
    );
  });

  it("COUNT (code 2)", () => {
    expect(evalFormula("SUBTOTAL(2, A1:A3)", { A1: 10, A2: 20, A3: 30 })).toBe(
      3,
    );
  });

  it("MAX (code 4)", () => {
    expect(evalFormula("SUBTOTAL(4, A1:A3)", { A1: 10, A2: 30, A3: 20 })).toBe(
      30,
    );
  });

  it("MIN (code 5)", () => {
    expect(evalFormula("SUBTOTAL(5, A1:A3)", { A1: 10, A2: 30, A3: 20 })).toBe(
      10,
    );
  });

  it("PRODUCT (code 6)", () => {
    expect(evalFormula("SUBTOTAL(6, A1:A3)", { A1: 2, A2: 3, A3: 4 })).toBe(24);
  });

  it("SUM with 100+ code (exclude hidden)", () => {
    expect(
      evalFormula("SUBTOTAL(109, A1:A3)", { A1: 10, A2: 20, A3: 30 }),
    ).toBe(60);
  });

  it("invalid code returns #VALUE!", () => {
    expect(evalFormula("SUBTOTAL(99, A1:A1)", { A1: 1 })).toBe("#VALUE!");
  });
});

// --- P2 functions ---

describe("EVEN", () => {
  it("rounds 1.5 up to 2", () => {
    expect(evalFormula("EVEN(1.5)")).toBe(2);
  });

  it("rounds 3 up to 4", () => {
    expect(evalFormula("EVEN(3)")).toBe(4);
  });

  it("returns 2 for 2", () => {
    expect(evalFormula("EVEN(2)")).toBe(2);
  });

  it("rounds -1 to -2", () => {
    expect(evalFormula("EVEN(-1)")).toBe(-2);
  });
});

describe("ODD", () => {
  it("rounds 1.5 up to 3 (next odd)", () => {
    expect(evalFormula("ODD(1.5)")).toBe(3);
  });

  it("rounds 2 up to 3", () => {
    expect(evalFormula("ODD(2)")).toBe(3);
  });

  it("returns 1 for 1", () => {
    expect(evalFormula("ODD(1)")).toBe(1);
  });

  it("returns 1 for 0", () => {
    expect(evalFormula("ODD(0)")).toBe(1);
  });
});

describe("FACT", () => {
  it("5! = 120", () => {
    expect(evalFormula("FACT(5)")).toBe(120);
  });

  it("0! = 1", () => {
    expect(evalFormula("FACT(0)")).toBe(1);
  });

  it("negative returns #NUM!", () => {
    expect(evalFormula("FACT(-1)")).toBe("#NUM!");
  });
});

describe("COMBIN", () => {
  it("C(5,2) = 10", () => {
    expect(evalFormula("COMBIN(5, 2)")).toBe(10);
  });

  it("C(10,0) = 1", () => {
    expect(evalFormula("COMBIN(10, 0)")).toBe(1);
  });

  it("k > n returns #NUM!", () => {
    expect(evalFormula("COMBIN(3, 5)")).toBe("#NUM!");
  });
});

describe("PERMUT", () => {
  it("P(5,2) = 20", () => {
    expect(evalFormula("PERMUT(5, 2)")).toBe(20);
  });

  it("P(5,0) = 1", () => {
    expect(evalFormula("PERMUT(5, 0)")).toBe(1);
  });
});

describe("GCD", () => {
  it("GCD(12, 8) = 4", () => {
    expect(evalFormula("GCD(12, 8)")).toBe(4);
  });

  it("GCD(5, 0) = 5", () => {
    expect(evalFormula("GCD(5, 0)")).toBe(5);
  });
});

describe("LCM", () => {
  it("LCM(4, 6) = 12", () => {
    expect(evalFormula("LCM(4, 6)")).toBe(12);
  });

  it("LCM(5, 0) = 0", () => {
    expect(evalFormula("LCM(5, 0)")).toBe(0);
  });
});

describe("MROUND", () => {
  it("MROUND(10, 3) = 9", () => {
    expect(evalFormula("MROUND(10, 3)")).toBe(9);
  });

  it("MROUND(-10, -3) = -9", () => {
    expect(evalFormula("MROUND(-10, -3)")).toBe(-9);
  });

  it("opposite signs returns #NUM!", () => {
    expect(evalFormula("MROUND(5, -2)")).toBe("#NUM!");
  });
});

describe("QUOTIENT", () => {
  it("QUOTIENT(5, 2) = 2", () => {
    expect(evalFormula("QUOTIENT(5, 2)")).toBe(2);
  });

  it("QUOTIENT(-10, 3) = -3", () => {
    expect(evalFormula("QUOTIENT(-10, 3)")).toBe(-3);
  });

  it("division by zero returns #DIV/0!", () => {
    expect(evalFormula("QUOTIENT(5, 0)")).toBe("#DIV/0!");
  });
});

// Trig functions
describe("Trigonometric functions", () => {
  it("SIN(0) = 0", () => {
    expect(evalFormula("SIN(0)")).toBe(0);
  });

  it("COS(0) = 1", () => {
    expect(evalFormula("COS(0)")).toBe(1);
  });

  it("TAN(0) = 0", () => {
    expect(evalFormula("TAN(0)")).toBe(0);
  });

  it("ASIN(1) = PI/2", () => {
    expect(evalFormula("ASIN(1)")).toBeCloseTo(Math.PI / 2);
  });

  it("ASIN(2) = #NUM!", () => {
    expect(evalFormula("ASIN(2)")).toBe("#NUM!");
  });

  it("ACOS(1) = 0", () => {
    expect(evalFormula("ACOS(1)")).toBeCloseTo(0);
  });

  it("ACOS(2) = #NUM!", () => {
    expect(evalFormula("ACOS(2)")).toBe("#NUM!");
  });

  it("ATAN(1) = PI/4", () => {
    expect(evalFormula("ATAN(1)")).toBeCloseTo(Math.PI / 4);
  });

  it("ATAN2(1, 1) = PI/4", () => {
    expect(evalFormula("ATAN2(1, 1)")).toBeCloseTo(Math.PI / 4);
  });

  it("ATAN2(0, 0) = #DIV/0!", () => {
    expect(evalFormula("ATAN2(0, 0)")).toBe("#DIV/0!");
  });
});

describe("RADIANS and DEGREES", () => {
  it("RADIANS(180) = PI", () => {
    expect(evalFormula("RADIANS(180)")).toBeCloseTo(Math.PI);
  });

  it("DEGREES(PI()) = 180", () => {
    expect(evalFormula("DEGREES(PI())")).toBeCloseTo(180);
  });
});

describe("LN", () => {
  it("LN(1) = 0", () => {
    expect(evalFormula("LN(1)")).toBe(0);
  });

  it("LN(E) ≈ 1", () => {
    expect(evalFormula("LN(2.718281828)")).toBeCloseTo(1);
  });

  it("LN(0) = #NUM!", () => {
    expect(evalFormula("LN(0)")).toBe("#NUM!");
  });

  it("LN(-1) = #NUM!", () => {
    expect(evalFormula("LN(-1)")).toBe("#NUM!");
  });
});

// --- P3 functions ---

describe("Hyperbolic functions", () => {
  it("SINH(0) = 0", () => {
    expect(evalFormula("SINH(0)")).toBe(0);
  });

  it("COSH(0) = 1", () => {
    expect(evalFormula("COSH(0)")).toBe(1);
  });

  it("TANH(0) = 0", () => {
    expect(evalFormula("TANH(0)")).toBe(0);
  });

  it("SINH(1) = Math.sinh(1)", () => {
    expect(evalFormula("SINH(1)")).toBeCloseTo(Math.sinh(1));
  });
});

describe("SQRTPI", () => {
  it("SQRTPI(1) = sqrt(PI)", () => {
    expect(evalFormula("SQRTPI(1)")).toBeCloseTo(Math.sqrt(Math.PI));
  });

  it("SQRTPI(2) = sqrt(2*PI)", () => {
    expect(evalFormula("SQRTPI(2)")).toBeCloseTo(Math.sqrt(2 * Math.PI));
  });

  it("SQRTPI(-1) = #NUM!", () => {
    expect(evalFormula("SQRTPI(-1)")).toBe("#NUM!");
  });
});

describe("MULTINOMIAL", () => {
  it("MULTINOMIAL(2, 3) = 10", () => {
    // 5! / (2! * 3!) = 120 / (2 * 6) = 10
    expect(evalFormula("MULTINOMIAL(2, 3)")).toBe(10);
  });

  it("MULTINOMIAL(1, 1, 1) = 6", () => {
    // 3! / (1! * 1! * 1!) = 6
    expect(evalFormula("MULTINOMIAL(1, 1, 1)")).toBe(6);
  });
});

describe("SUMSQ", () => {
  it("SUMSQ(3, 4) = 25", () => {
    expect(evalFormula("SUMSQ(3, 4)")).toBe(25);
  });

  it("SUMSQ with range", () => {
    expect(evalFormula("SUMSQ(A1:A3)", { A1: 1, A2: 2, A3: 3 })).toBe(14); // 1+4+9
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { parseFormula } from "../components/formula/parser";
import { evaluate, resetLambdaRegistry } from "../components/formula/evaluator";
import { getFunction, hasFunction } from "../components/formula/functions";
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
  resetLambdaRegistry();
  const ast = parseFormula(formula);
  return evaluate(ast, getCellValue);
}

describe("LAMBDA — full implementation", () => {
  beforeEach(() => resetLambdaRegistry());

  it("is registered in function registry", () => {
    expect(hasFunction("LAMBDA")).toBe(true);
  });

  it("creates and invokes a simple lambda", () => {
    // LAMBDA(x, x+1)(5) → 6
    expect(evalFormula("LAMBDA(x, x+1)(5)")).toBe(6);
  });

  it("creates lambda with two parameters", () => {
    // LAMBDA(a, b, a*b)(3, 4) → 12
    expect(evalFormula("LAMBDA(a, b, a*b)(3, 4)")).toBe(12);
  });

  it("returns #VALUE! if arity mismatch", () => {
    expect(evalFormula("LAMBDA(x, x+1)(1, 2)")).toBe("#VALUE!");
  });

  it("returns #VALUE! with too few arguments", () => {
    // LAMBDA needs at least 2 args (1 param + body)
    expect(evalFormula("LAMBDA(x)")).toBe("#VALUE!");
  });
});

describe("MAP function", () => {
  beforeEach(() => resetLambdaRegistry());

  it("is registered", () => {
    expect(hasFunction("MAP")).toBe(true);
  });

  it("applies lambda to each element of a range", () => {
    // MAP(A1:A3, LAMBDA(x, x*2)) where A1=1, A2=2, A3=3
    const result = evalFormula("MAP(A1:A3, LAMBDA(x, x*2))", {
      A1: 1,
      A2: 2,
      A3: 3,
    });
    expect(result).toEqual([[2], [4], [6]]);
  });

  it("applies lambda to each element of a row range", () => {
    const result = evalFormula("MAP(A1:C1, LAMBDA(x, x+10))", {
      A1: 1,
      B1: 2,
      C1: 3,
    });
    expect(result).toEqual([[11, 12, 13]]);
  });

  it("applies lambda element-wise to two arrays", () => {
    const result = evalFormula("MAP(A1:A2, B1:B2, LAMBDA(a, b, a+b))", {
      A1: 10,
      A2: 20,
      B1: 1,
      B2: 2,
    });
    expect(result).toEqual([[11], [22]]);
  });

  it("returns #VALUE! with fewer than 2 args", () => {
    expect(evalFormula("MAP(LAMBDA(x, x))")).toBe("#VALUE!");
  });
});

describe("REDUCE function", () => {
  beforeEach(() => resetLambdaRegistry());

  it("is registered", () => {
    expect(hasFunction("REDUCE")).toBe(true);
  });

  it("reduces an array with a lambda", () => {
    // REDUCE(0, A1:A3, LAMBDA(acc, x, acc+x)) where A1=1, A2=2, A3=3 → 6
    const result = evalFormula("REDUCE(0, A1:A3, LAMBDA(acc, x, acc+x))", {
      A1: 1,
      A2: 2,
      A3: 3,
    });
    expect(result).toBe(6);
  });

  it("reduces with multiplication", () => {
    const result = evalFormula("REDUCE(1, A1:A3, LAMBDA(acc, x, acc*x))", {
      A1: 2,
      A2: 3,
      A3: 4,
    });
    expect(result).toBe(24);
  });

  it("returns #VALUE! with wrong number of args", () => {
    expect(evalFormula("REDUCE(0, A1:A3)")).toBe("#VALUE!");
  });
});

describe("SCAN function", () => {
  beforeEach(() => resetLambdaRegistry());

  it("is registered", () => {
    expect(hasFunction("SCAN")).toBe(true);
  });

  it("returns running accumulation", () => {
    // SCAN(0, A1:A3, LAMBDA(acc, x, acc+x)) → [1, 3, 6]
    const result = evalFormula("SCAN(0, A1:A3, LAMBDA(acc, x, acc+x))", {
      A1: 1,
      A2: 2,
      A3: 3,
    });
    expect(result).toEqual([[1], [3], [6]]);
  });

  it("returns #VALUE! with wrong number of args", () => {
    expect(evalFormula("SCAN(0, A1:A3)")).toBe("#VALUE!");
  });
});

describe("MAKEARRAY function", () => {
  beforeEach(() => resetLambdaRegistry());

  it("is registered", () => {
    expect(hasFunction("MAKEARRAY")).toBe(true);
  });

  it("creates a 2x3 array with row*col", () => {
    const result = evalFormula("MAKEARRAY(2, 3, LAMBDA(r, c, r*c))");
    expect(result).toEqual([
      [1, 2, 3],
      [2, 4, 6],
    ]);
  });

  it("creates a 1x1 array returning scalar", () => {
    const result = evalFormula("MAKEARRAY(1, 1, LAMBDA(r, c, r+c))");
    expect(result).toBe(2);
  });

  it("returns #VALUE! for non-positive dimensions", () => {
    expect(evalFormula("MAKEARRAY(0, 3, LAMBDA(r, c, r+c))")).toBe("#VALUE!");
  });

  it("returns #VALUE! with wrong number of args", () => {
    expect(evalFormula("MAKEARRAY(2, 3)")).toBe("#VALUE!");
  });
});

describe("BYROW function", () => {
  beforeEach(() => resetLambdaRegistry());

  it("is registered", () => {
    expect(hasFunction("BYROW")).toBe(true);
  });

  it("applies SUM to each row via lambda", () => {
    // BYROW(A1:B2, LAMBDA(row, SUM(row)))
    const result = evalFormula("BYROW(A1:B2, LAMBDA(row, SUM(row)))", {
      A1: 1,
      B1: 2,
      A2: 3,
      B2: 4,
    });
    expect(result).toEqual([[3], [7]]);
  });

  it("returns #VALUE! with wrong number of args", () => {
    expect(evalFormula("BYROW(A1:B2)")).toBe("#VALUE!");
  });
});

describe("BYCOL function", () => {
  beforeEach(() => resetLambdaRegistry());

  it("is registered", () => {
    expect(hasFunction("BYCOL")).toBe(true);
  });

  it("applies SUM to each column via lambda", () => {
    const result = evalFormula("BYCOL(A1:B2, LAMBDA(col, SUM(col)))", {
      A1: 1,
      B1: 2,
      A2: 3,
      B2: 4,
    });
    expect(result).toEqual([[4, 6]]);
  });

  it("returns #VALUE! with wrong number of args", () => {
    expect(evalFormula("BYCOL(A1:B2)")).toBe("#VALUE!");
  });
});

describe("FLATTEN function", () => {
  it("is registered", () => {
    expect(hasFunction("FLATTEN")).toBe(true);
  });

  it("flattens a 2D range into a column", () => {
    const fn = getFunction("FLATTEN")!;
    const input = [
      [1, 2],
      [3, 4],
    ] as unknown as FormulaValue;
    const result = fn(input);
    expect(result).toEqual([[1], [2], [3], [4]]);
  });

  it("returns #VALUE! with no args", () => {
    const fn = getFunction("FLATTEN")!;
    expect(fn()).toBe("#VALUE!");
  });
});

describe("TOCOL function", () => {
  it("is registered", () => {
    expect(hasFunction("TOCOL")).toBe(true);
  });

  it("converts 2D array to column (row scan)", () => {
    const fn = getFunction("TOCOL")!;
    const input = [
      [1, 2],
      [3, 4],
    ] as unknown as FormulaValue;
    const result = fn(input);
    expect(result).toEqual([[1], [2], [3], [4]]);
  });

  it("converts 2D array to column (column scan)", () => {
    const fn = getFunction("TOCOL")!;
    const input = [
      [1, 2],
      [3, 4],
    ] as unknown as FormulaValue;
    const result = fn(input, 0, true);
    expect(result).toEqual([[1], [3], [2], [4]]);
  });

  it("ignores blanks when mode=1", () => {
    const fn = getFunction("TOCOL")!;
    const input = [
      [1, null],
      [3, 4],
    ] as unknown as FormulaValue;
    const result = fn(input, 1);
    expect(result).toEqual([[1], [3], [4]]);
  });
});

describe("TOROW function", () => {
  it("is registered", () => {
    expect(hasFunction("TOROW")).toBe(true);
  });

  it("converts 2D array to row", () => {
    const fn = getFunction("TOROW")!;
    const input = [
      [1, 2],
      [3, 4],
    ] as unknown as FormulaValue;
    const result = fn(input);
    expect(result).toEqual([[1, 2, 3, 4]]);
  });
});

describe("HSTACK function", () => {
  it("is registered", () => {
    expect(hasFunction("HSTACK")).toBe(true);
  });

  it("stacks two arrays horizontally", () => {
    const fn = getFunction("HSTACK")!;
    const a = [[1], [2]] as unknown as FormulaValue;
    const b = [[3], [4]] as unknown as FormulaValue;
    const result = fn(a, b);
    expect(result).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });
});

describe("VSTACK function", () => {
  it("is registered", () => {
    expect(hasFunction("VSTACK")).toBe(true);
  });

  it("stacks two arrays vertically", () => {
    const fn = getFunction("VSTACK")!;
    const a = [[1, 2]] as unknown as FormulaValue;
    const b = [[3, 4]] as unknown as FormulaValue;
    const result = fn(a, b);
    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("pads with null when widths differ", () => {
    const fn = getFunction("VSTACK")!;
    const a = [[1, 2, 3]] as unknown as FormulaValue;
    const b = [[4]] as unknown as FormulaValue;
    const result = fn(a, b);
    expect(result).toEqual([
      [1, 2, 3],
      [4, null, null],
    ]);
  });
});

describe("CHOOSECOLS function", () => {
  it("is registered", () => {
    expect(hasFunction("CHOOSECOLS")).toBe(true);
  });

  it("selects specific columns", () => {
    const fn = getFunction("CHOOSECOLS")!;
    const data = [
      [1, 2, 3],
      [4, 5, 6],
    ] as unknown as FormulaValue;
    const result = fn(data, 1, 3);
    expect(result).toEqual([
      [1, 3],
      [4, 6],
    ]);
  });

  it("supports negative indices", () => {
    const fn = getFunction("CHOOSECOLS")!;
    const data = [
      [1, 2, 3],
      [4, 5, 6],
    ] as unknown as FormulaValue;
    const result = fn(data, -1);
    expect(result).toEqual([[3], [6]]);
  });
});

describe("CHOOSEROWS function", () => {
  it("is registered", () => {
    expect(hasFunction("CHOOSEROWS")).toBe(true);
  });

  it("selects specific rows", () => {
    const fn = getFunction("CHOOSEROWS")!;
    const data = [
      [1, 2],
      [3, 4],
      [5, 6],
    ] as unknown as FormulaValue;
    const result = fn(data, 1, 3);
    expect(result).toEqual([
      [1, 2],
      [5, 6],
    ]);
  });

  it("supports negative indices", () => {
    const fn = getFunction("CHOOSEROWS")!;
    const data = [
      [1, 2],
      [3, 4],
      [5, 6],
    ] as unknown as FormulaValue;
    const result = fn(data, -1);
    expect(result).toEqual([[5, 6]]);
  });
});

describe("WRAPCOLS function", () => {
  it("is registered", () => {
    expect(hasFunction("WRAPCOLS")).toBe(true);
  });

  it("wraps flat array into columns", () => {
    const fn = getFunction("WRAPCOLS")!;
    const data = [1, 2, 3, 4, 5, 6] as unknown as FormulaValue;
    const result = fn(data, 3);
    expect(result).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  it("pads with null for incomplete columns", () => {
    const fn = getFunction("WRAPCOLS")!;
    const data = [1, 2, 3, 4, 5] as unknown as FormulaValue;
    const result = fn(data, 3);
    expect(result).toEqual([
      [1, 4],
      [2, 5],
      [3, null],
    ]);
  });

  it("pads with custom value", () => {
    const fn = getFunction("WRAPCOLS")!;
    const data = [1, 2, 3, 4, 5] as unknown as FormulaValue;
    const result = fn(data, 3, 0);
    expect(result).toEqual([
      [1, 4],
      [2, 5],
      [3, 0],
    ]);
  });
});

describe("WRAPROWS function", () => {
  it("is registered", () => {
    expect(hasFunction("WRAPROWS")).toBe(true);
  });

  it("wraps flat array into rows", () => {
    const fn = getFunction("WRAPROWS")!;
    const data = [1, 2, 3, 4, 5, 6] as unknown as FormulaValue;
    const result = fn(data, 3);
    expect(result).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("pads with null for incomplete rows", () => {
    const fn = getFunction("WRAPROWS")!;
    const data = [1, 2, 3, 4, 5] as unknown as FormulaValue;
    const result = fn(data, 3);
    expect(result).toEqual([
      [1, 2, 3],
      [4, 5, null],
    ]);
  });
});

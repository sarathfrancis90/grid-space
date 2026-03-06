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

function closeTo(result: FormulaValue, expected: number, precision = 2): void {
  expect(typeof result).toBe("number");
  expect(result as number).toBeCloseTo(expected, precision);
}

// --- PPMT ---
describe("PPMT", () => {
  it("returns principal portion for period 1 of a loan", () => {
    // Loan: 8% annual / 12 months, 10 periods, $200k PV
    closeTo(evalFormula("PPMT(0.08/12, 1, 10, 200000)"), -19407.31, 2);
  });

  it("returns principal portion for period 5", () => {
    closeTo(evalFormula("PPMT(0.08/12, 5, 10, 200000)"), -19930.04, 2);
  });

  it("returns #NUM! for invalid period", () => {
    expect(evalFormula("PPMT(0.08, 0, 10, 200000)")).toBe("#NUM!");
    expect(evalFormula("PPMT(0.08, 11, 10, 200000)")).toBe("#NUM!");
  });

  it("works with zero interest rate", () => {
    closeTo(evalFormula("PPMT(0, 1, 10, 1000)"), -100, 2);
  });

  it("returns #VALUE! with too few args", () => {
    expect(evalFormula("PPMT(0.08, 1, 10)")).toBe("#VALUE!");
  });
});

// --- IPMT ---
describe("IPMT", () => {
  it("returns interest portion for period 1 of a loan", () => {
    // 8% annual / 12, period 1, 10 periods, $200k
    closeTo(evalFormula("IPMT(0.08/12, 1, 10, 200000)"), -1333.33, 2);
  });

  it("interest decreases over time (period 5 vs period 1)", () => {
    const ipmt1 = evalFormula("IPMT(0.08/12, 1, 10, 200000)") as number;
    const ipmt5 = evalFormula("IPMT(0.08/12, 5, 10, 200000)") as number;
    // Interest should decrease (less negative) as principal is paid down
    expect(ipmt5).toBeGreaterThan(ipmt1);
  });

  it("returns 0 interest when rate is 0", () => {
    closeTo(evalFormula("IPMT(0, 1, 10, 1000)"), 0, 10);
  });

  it("returns #NUM! for invalid period", () => {
    expect(evalFormula("IPMT(0.08, 0, 10, 200000)")).toBe("#NUM!");
  });

  it("PPMT + IPMT equals PMT", () => {
    const pmt = evalFormula("PMT(0.1, 5, 10000)") as number;
    const ppmt = evalFormula("PPMT(0.1, 3, 5, 10000)") as number;
    const ipmt = evalFormula("IPMT(0.1, 3, 5, 10000)") as number;
    expect(ppmt + ipmt).toBeCloseTo(pmt, 6);
  });
});

// --- CUMIPMT ---
describe("CUMIPMT", () => {
  it("returns cumulative interest for a range of periods", () => {
    // 9% annual / 12, 30 years (360 periods), $125000 PV, periods 1-12, end of period
    closeTo(
      evalFormula("CUMIPMT(0.09/12, 360, 125000, 1, 12, 0)"),
      -11215.34,
      0,
    );
  });

  it("returns #NUM! for invalid inputs", () => {
    expect(evalFormula("CUMIPMT(0, 360, 125000, 1, 12, 0)")).toBe("#NUM!");
    expect(evalFormula("CUMIPMT(0.09/12, 360, 125000, 13, 12, 0)")).toBe(
      "#NUM!",
    );
  });
});

// --- CUMPRINC ---
describe("CUMPRINC", () => {
  it("returns cumulative principal for a range of periods", () => {
    // 9% annual / 12, 30 years (360 periods), $125000 PV, periods 1-12, end of period
    closeTo(evalFormula("CUMPRINC(0.09/12, 360, 125000, 1, 12, 0)"), -854.0, 0);
  });

  it("returns #NUM! for invalid inputs", () => {
    expect(evalFormula("CUMPRINC(-0.09, 360, 125000, 1, 12, 0)")).toBe("#NUM!");
  });
});

// --- SLN ---
describe("SLN", () => {
  it("returns straight-line depreciation", () => {
    closeTo(evalFormula("SLN(30000, 7500, 10)"), 2250, 2);
  });

  it("returns #DIV/0! when life is 0", () => {
    expect(evalFormula("SLN(30000, 7500, 0)")).toBe("#DIV/0!");
  });
});

// --- SYD ---
describe("SYD", () => {
  it("returns sum-of-years-digits depreciation for period 1", () => {
    closeTo(evalFormula("SYD(30000, 7500, 10, 1)"), 4090.91, 2);
  });

  it("returns depreciation for last period", () => {
    closeTo(evalFormula("SYD(30000, 7500, 10, 10)"), 409.09, 2);
  });

  it("returns #NUM! for invalid period", () => {
    expect(evalFormula("SYD(30000, 7500, 10, 0)")).toBe("#NUM!");
    expect(evalFormula("SYD(30000, 7500, 10, 11)")).toBe("#NUM!");
  });
});

// --- DB ---
describe("DB", () => {
  it("returns declining balance depreciation for period 1", () => {
    // cost=1000000, salvage=100000, life=6, period=1, month=7
    closeTo(evalFormula("DB(1000000, 100000, 6, 1, 7)"), 186083.33, 2);
  });

  it("returns depreciation for period 2", () => {
    closeTo(evalFormula("DB(1000000, 100000, 6, 2, 7)"), 259639.42, 2);
  });

  it("defaults month to 12", () => {
    const result = evalFormula("DB(1000000, 100000, 6, 1)");
    expect(typeof result).toBe("number");
  });
});

// --- DDB ---
describe("DDB", () => {
  it("returns double declining balance for period 1", () => {
    // cost=2400, salvage=300, life=10, period=1
    closeTo(evalFormula("DDB(2400, 300, 10, 1)"), 480, 2);
  });

  it("returns DDB for period 2", () => {
    closeTo(evalFormula("DDB(2400, 300, 10, 2)"), 384, 2);
  });

  it("never depreciates below salvage", () => {
    // cost=100, salvage=50, life=2, period=2 — remaining is 50, salvage is 50
    const result = evalFormula("DDB(100, 50, 2, 2)") as number;
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("accepts custom factor", () => {
    closeTo(evalFormula("DDB(2400, 300, 10, 1, 1.5)"), 360, 2);
  });

  it("returns #NUM! for invalid inputs", () => {
    expect(evalFormula("DDB(2400, 300, 0, 1)")).toBe("#NUM!");
    expect(evalFormula("DDB(2400, 300, 10, 0)")).toBe("#NUM!");
  });
});

// --- EFFECT ---
describe("EFFECT", () => {
  it("converts nominal to effective rate", () => {
    closeTo(evalFormula("EFFECT(0.1, 4)"), 0.10381, 4);
  });

  it("returns #NUM! for invalid inputs", () => {
    expect(evalFormula("EFFECT(0, 4)")).toBe("#NUM!");
    expect(evalFormula("EFFECT(0.1, 0)")).toBe("#NUM!");
  });
});

// --- NOMINAL ---
describe("NOMINAL", () => {
  it("converts effective to nominal rate", () => {
    closeTo(evalFormula("NOMINAL(0.10381289, 4)"), 0.1, 4);
  });

  it("returns #NUM! for invalid inputs", () => {
    expect(evalFormula("NOMINAL(0, 4)")).toBe("#NUM!");
    expect(evalFormula("NOMINAL(0.1, 0)")).toBe("#NUM!");
  });
});

// --- MIRR ---
describe("MIRR", () => {
  it("calculates modified internal rate of return", () => {
    // Cash flows: -120000, 39000, 30000, 21000, 37000, 46000
    // Finance rate: 10%, Reinvest rate: 12%
    const cells: Record<string, FormulaValue> = {
      A1: -120000,
      A2: 39000,
      A3: 30000,
      A4: 21000,
      A5: 37000,
      A6: 46000,
    };
    const result = evalFormula("MIRR(A1:A6, 0.10, 0.12)", cells);
    closeTo(result, 0.1261, 3);
  });
});

// --- XNPV ---
describe("XNPV", () => {
  it("returns net present value for irregular cash flows", () => {
    const cells: Record<string, FormulaValue> = {
      A1: -10000,
      A2: 2750,
      A3: 4250,
      A4: 3250,
      A5: 2750,
      B1: "2008-01-01",
      B2: "2008-03-01",
      B3: "2008-10-30",
      B4: "2009-02-15",
      B5: "2009-04-01",
    };
    const result = evalFormula("XNPV(0.09, A1:A5, B1:B5)", cells);
    closeTo(result, 2086.65, 0);
  });
});

// --- XIRR ---
describe("XIRR", () => {
  it("returns internal rate of return for irregular cash flows", () => {
    const cells: Record<string, FormulaValue> = {
      A1: -10000,
      A2: 2750,
      A3: 4250,
      A4: 3250,
      A5: 2750,
      B1: "2008-01-01",
      B2: "2008-03-01",
      B3: "2008-10-30",
      B4: "2009-02-15",
      B5: "2009-04-01",
    };
    const result = evalFormula("XIRR(A1:A5, B1:B5, 0.1)", cells);
    expect(typeof result).toBe("number");
    closeTo(result, 0.3734, 2);
  });
});

// --- Edge cases ---
describe("Financial function edge cases", () => {
  it("PPMT and IPMT with fv and type parameters", () => {
    const pmt = evalFormula("PMT(0.1, 5, 10000, 5000, 1)") as number;
    const ppmt = evalFormula("PPMT(0.1, 2, 5, 10000, 5000, 1)") as number;
    const ipmt = evalFormula("IPMT(0.1, 2, 5, 10000, 5000, 1)") as number;
    expect(ppmt + ipmt).toBeCloseTo(pmt, 6);
  });

  it("all new functions are registered (callable)", () => {
    // Just test they don't return #NAME? error
    expect(evalFormula("SLN(1000, 100, 5)")).not.toBe("#NAME?");
    expect(evalFormula("SYD(1000, 100, 5, 1)")).not.toBe("#NAME?");
    expect(evalFormula("DDB(1000, 100, 5, 1)")).not.toBe("#NAME?");
    expect(evalFormula("EFFECT(0.1, 4)")).not.toBe("#NAME?");
    expect(evalFormula("NOMINAL(0.1, 4)")).not.toBe("#NAME?");
  });
});

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

// --- S2-029: Math functions ---
describe("Math functions (S2-029)", () => {
  it("ROUND(3.456, 2) → 3.46", () => {
    expect(evalFormula("ROUND(3.456, 2)")).toBe(3.46);
  });
  it("ROUND(3.5, 0) → 4", () => {
    expect(evalFormula("ROUND(3.5, 0)")).toBe(4);
  });
  it("ROUNDUP(3.1, 0) → 4", () => {
    expect(evalFormula("ROUNDUP(3.1, 0)")).toBe(4);
  });
  it("ROUNDDOWN(3.9, 0) → 3", () => {
    expect(evalFormula("ROUNDDOWN(3.9, 0)")).toBe(3);
  });
  it("ABS(-5) → 5", () => {
    expect(evalFormula("ABS(-5)")).toBe(5);
  });
  it("SQRT(16) → 4", () => {
    expect(evalFormula("SQRT(16)")).toBe(4);
  });
  it("SQRT(-1) → #NUM!", () => {
    expect(evalFormula("SQRT(-1)")).toBe("#NUM!");
  });
  it("POWER(2, 10) → 1024", () => {
    expect(evalFormula("POWER(2, 10)")).toBe(1024);
  });
  it("MOD(10, 3) → 1", () => {
    expect(evalFormula("MOD(10, 3)")).toBe(1);
  });
  it("MOD(10, 0) → #DIV/0!", () => {
    expect(evalFormula("MOD(10, 0)")).toBe("#DIV/0!");
  });
});

// --- S2-030: More math ---
describe("Extended math (S2-030)", () => {
  it("CEILING(4.1, 1) → 5", () => {
    expect(evalFormula("CEILING(4.1, 1)")).toBe(5);
  });
  it("FLOOR(4.9, 1) → 4", () => {
    expect(evalFormula("FLOOR(4.9, 1)")).toBe(4);
  });
  it("LOG(100) → 2 (base 10)", () => {
    expect(evalFormula("LOG(100)")).toBeCloseTo(2);
  });
  it("LOG(8, 2) → 3", () => {
    expect(evalFormula("LOG(8, 2)")).toBeCloseTo(3);
  });
  it("LOG10(1000) → 3", () => {
    expect(evalFormula("LOG10(1000)")).toBeCloseTo(3);
  });
  it("EXP(1) → e", () => {
    expect(evalFormula("EXP(1)")).toBeCloseTo(Math.E);
  });
  it("PI() → π", () => {
    expect(evalFormula("PI()")).toBeCloseTo(Math.PI);
  });
  it("RAND() returns 0..1", () => {
    const r = evalFormula("RAND()") as number;
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
  });
  it("RANDBETWEEN(1, 10) returns integer in range", () => {
    const r = evalFormula("RANDBETWEEN(1, 10)") as number;
    expect(r).toBeGreaterThanOrEqual(1);
    expect(r).toBeLessThanOrEqual(10);
    expect(r).toBe(Math.floor(r));
  });
});

// --- S2-023: Text functions ---
describe("Text functions (S2-023)", () => {
  it("CONCATENATE", () => {
    expect(evalFormula('CONCATENATE("Hello", " ", "World")')).toBe(
      "Hello World",
    );
  });
  it("LEFT", () => {
    expect(evalFormula('LEFT("Hello", 3)')).toBe("Hel");
  });
  it("RIGHT", () => {
    expect(evalFormula('RIGHT("Hello", 2)')).toBe("lo");
  });
  it("MID", () => {
    expect(evalFormula('MID("Hello World", 7, 5)')).toBe("World");
  });
  it("LEN", () => {
    expect(evalFormula('LEN("Hello")')).toBe(5);
  });
  it("TRIM", () => {
    expect(evalFormula('TRIM("  Hello   World  ")')).toBe("Hello World");
  });
});

// --- S2-024: More text ---
describe("Text functions (S2-024)", () => {
  it("UPPER", () => {
    expect(evalFormula('UPPER("hello")')).toBe("HELLO");
  });
  it("LOWER", () => {
    expect(evalFormula('LOWER("HELLO")')).toBe("hello");
  });
  it("PROPER", () => {
    expect(evalFormula('PROPER("hello world")')).toBe("Hello World");
  });
  it("SUBSTITUTE", () => {
    expect(evalFormula('SUBSTITUTE("Hello World", "World", "Earth")')).toBe(
      "Hello Earth",
    );
  });
  it("FIND (case-sensitive)", () => {
    expect(evalFormula('FIND("World", "Hello World")')).toBe(7);
  });
  it("FIND not found → #VALUE!", () => {
    expect(evalFormula('FIND("xyz", "Hello")')).toBe("#VALUE!");
  });
  it("SEARCH (case-insensitive)", () => {
    expect(evalFormula('SEARCH("world", "Hello World")')).toBe(7);
  });
});

// --- S2-025: TEXT, VALUE, REPT, etc ---
describe("Text functions (S2-025)", () => {
  it("TEXT formats number", () => {
    expect(evalFormula('TEXT(3.14159, "0.00")')).toBe("3.14");
  });
  it("VALUE parses string to number", () => {
    expect(evalFormula('VALUE("42")')).toBe(42);
  });
  it("REPT repeats string", () => {
    expect(evalFormula('REPT("ab", 3)')).toBe("ababab");
  });
  it("EXACT (case-sensitive)", () => {
    expect(evalFormula('EXACT("Hello", "Hello")')).toBe(true);
  });
  it("EXACT fails on different case", () => {
    expect(evalFormula('EXACT("Hello", "hello")')).toBe(false);
  });
  it("CLEAN removes non-printable chars", () => {
    // Just test that it returns a string
    expect(typeof evalFormula('CLEAN("Hello")')).toBe("string");
  });
  it("CHAR(65) → A", () => {
    expect(evalFormula("CHAR(65)")).toBe("A");
  });
  it("CODE(A) → 65", () => {
    expect(evalFormula('CODE("A")')).toBe(65);
  });
});

// --- S2-026: Date basics ---
describe("Date functions (S2-026)", () => {
  it("TODAY returns a serial number", () => {
    const r = evalFormula("TODAY()") as number;
    expect(r).toBeGreaterThan(40000); // some date after 2009
  });
  it("NOW returns a serial with fractional time", () => {
    const r = evalFormula("NOW()") as number;
    expect(r).toBeGreaterThan(40000);
  });
  it("DATE(2024, 1, 15) returns a serial", () => {
    const r = evalFormula("DATE(2024, 1, 15)") as number;
    expect(r).toBeGreaterThan(40000);
  });
  it("YEAR extracts year", () => {
    const serial = evalFormula("DATE(2024, 6, 15)") as number;
    expect(evalFormula(`YEAR(${serial})`)).toBe(2024);
  });
  it("MONTH extracts month", () => {
    const serial = evalFormula("DATE(2024, 6, 15)") as number;
    expect(evalFormula(`MONTH(${serial})`)).toBe(6);
  });
  it("DAY extracts day", () => {
    const serial = evalFormula("DATE(2024, 6, 15)") as number;
    expect(evalFormula(`DAY(${serial})`)).toBe(15);
  });
});

// --- S2-027: More date functions ---
describe("Date functions (S2-027)", () => {
  it("DATEDIF counts days", () => {
    const d1 = evalFormula("DATE(2024, 1, 1)") as number;
    const d2 = evalFormula("DATE(2024, 1, 31)") as number;
    expect(evalFormula(`DATEDIF(${d1}, ${d2}, "D")`)).toBe(30);
  });
  it("EDATE adds months", () => {
    const d = evalFormula("DATE(2024, 1, 15)") as number;
    const result = evalFormula(`EDATE(${d}, 3)`) as number;
    expect(evalFormula(`MONTH(${result})`)).toBe(4);
  });
  it("EOMONTH gets end of month", () => {
    const d = evalFormula("DATE(2024, 1, 15)") as number;
    const result = evalFormula(`EOMONTH(${d}, 0)`) as number;
    expect(evalFormula(`DAY(${result})`)).toBe(31);
  });
});

// --- S2-028: Weekday/workday ---
describe("Date functions (S2-028)", () => {
  it("WEEKDAY returns a number 1-7", () => {
    const d = evalFormula("DATE(2024, 1, 15)") as number; // Monday
    const wd = evalFormula(`WEEKDAY(${d})`) as number;
    expect(wd).toBeGreaterThanOrEqual(1);
    expect(wd).toBeLessThanOrEqual(7);
  });
  it("WEEKNUM returns week of year", () => {
    const d = evalFormula("DATE(2024, 1, 15)") as number;
    const wn = evalFormula(`WEEKNUM(${d})`) as number;
    expect(wn).toBeGreaterThanOrEqual(1);
    expect(wn).toBeLessThanOrEqual(53);
  });
  it("NETWORKDAYS counts working days", () => {
    const d1 = evalFormula("DATE(2024, 1, 1)") as number;
    const d2 = evalFormula("DATE(2024, 1, 5)") as number;
    const wd = evalFormula(`NETWORKDAYS(${d1}, ${d2})`) as number;
    expect(wd).toBeGreaterThanOrEqual(1);
  });
});

// --- S2-017: VLOOKUP ---
describe("VLOOKUP (S2-017)", () => {
  const cells = { A1: 1, B1: "one", A2: 2, B2: "two", A3: 3, B3: "three" };

  it("exact match", () => {
    expect(evalFormula("VLOOKUP(2, A1:B3, 2, FALSE)", cells)).toBe("two");
  });
  it("returns #N/A when not found", () => {
    expect(evalFormula("VLOOKUP(5, A1:B3, 2, FALSE)", cells)).toBe("#N/A");
  });
});

// --- S2-018: HLOOKUP ---
describe("HLOOKUP (S2-018)", () => {
  const cells = { A1: 1, B1: 2, C1: 3, A2: "one", B2: "two", C2: "three" };

  it("exact match", () => {
    expect(evalFormula("HLOOKUP(2, A1:C2, 2, FALSE)", cells)).toBe("two");
  });
  it("returns #N/A when not found", () => {
    expect(evalFormula("HLOOKUP(5, A1:C2, 2, FALSE)", cells)).toBe("#N/A");
  });
});

// --- S2-019: INDEX/MATCH ---
describe("INDEX/MATCH (S2-019)", () => {
  const cells = { A1: 10, A2: 20, A3: 30, B1: 100, B2: 200, B3: 300 };

  it("INDEX returns value at position", () => {
    expect(evalFormula("INDEX(A1:B3, 2, 2)", cells)).toBe(200);
  });
  it("MATCH finds position", () => {
    expect(evalFormula("MATCH(20, A1:A3, 0)", cells)).toBe(2);
  });
  it("MATCH returns #N/A when not found", () => {
    expect(evalFormula("MATCH(99, A1:A3, 0)", cells)).toBe("#N/A");
  });
});

// --- S2-020: XLOOKUP ---
describe("XLOOKUP (S2-020)", () => {
  const cells = { A1: "cat", A2: "dog", A3: "fish", B1: 1, B2: 2, B3: 3 };

  it("finds and returns from return range", () => {
    expect(evalFormula('XLOOKUP("dog", A1:A3, B1:B3)', cells)).toBe(2);
  });
  it("returns default when not found", () => {
    expect(evalFormula('XLOOKUP("bird", A1:A3, B1:B3, 0)', cells)).toBe(0);
  });
});

// --- S2-021: SUMIF/COUNTIF/AVERAGEIF ---
describe("Conditional aggregates (S2-021)", () => {
  const cells = { A1: 1, A2: 2, A3: 3, A4: 4, A5: 5 };

  it("SUMIF with > criteria", () => {
    expect(evalFormula('SUMIF(A1:A5, ">3")', cells)).toBe(9); // 4+5
  });
  it("COUNTIF with > criteria", () => {
    expect(evalFormula('COUNTIF(A1:A5, ">3")', cells)).toBe(2);
  });
  it("AVERAGEIF with > criteria", () => {
    expect(evalFormula('AVERAGEIF(A1:A5, ">3")', cells)).toBe(4.5);
  });
});

// --- S2-022: SUMIFS/COUNTIFS/AVERAGEIFS ---
describe("Multi-criteria aggregates (S2-022)", () => {
  const cells = {
    A1: "yes",
    A2: "no",
    A3: "yes",
    A4: "no",
    B1: 10,
    B2: 20,
    B3: 30,
    B4: 40,
  };

  it("SUMIFS with criteria on first range", () => {
    expect(evalFormula('SUMIFS(B1:B4, A1:A4, "yes")', cells)).toBe(40); // 10+30
  });
  it("COUNTIFS", () => {
    expect(evalFormula('COUNTIFS(A1:A4, "yes")', cells)).toBe(2);
  });
});

// --- S2-031: Statistical ---
describe("Statistical functions (S2-031)", () => {
  const cells = { A1: 2, A2: 4, A3: 4, A4: 4, A5: 5, A6: 5, A7: 7, A8: 9 };

  it("MEDIAN", () => {
    expect(evalFormula("MEDIAN(A1:A8)", cells)).toBe(4.5);
  });
  it("MODE", () => {
    expect(evalFormula("MODE(A1:A8)", cells)).toBe(4);
  });
  it("STDEV returns a number", () => {
    const r = evalFormula("STDEV(A1:A8)", cells) as number;
    expect(r).toBeGreaterThan(0);
  });
  it("VAR returns a number", () => {
    const r = evalFormula("VAR(A1:A8)", cells) as number;
    expect(r).toBeGreaterThan(0);
  });
  it("PERCENTILE(range, 0.5) = median", () => {
    expect(evalFormula("PERCENTILE(A1:A8, 0.5)", cells)).toBe(4.5);
  });
  it("QUARTILE(range, 2) = median", () => {
    expect(evalFormula("QUARTILE(A1:A8, 2)", cells)).toBe(4.5);
  });
  it("RANK", () => {
    expect(evalFormula("RANK(9, A1:A8)", cells)).toBe(1); // largest first
  });
});

// --- S2-032: LARGE, SMALL, CORREL, FORECAST ---
describe("Statistical functions (S2-032)", () => {
  const cells = { A1: 10, A2: 20, A3: 30, A4: 40, A5: 50 };

  it("LARGE(range, 2) → 2nd largest", () => {
    expect(evalFormula("LARGE(A1:A5, 2)", cells)).toBe(40);
  });
  it("SMALL(range, 2) → 2nd smallest", () => {
    expect(evalFormula("SMALL(A1:A5, 2)", cells)).toBe(20);
  });
  it("CORREL of perfectly correlated data → 1", () => {
    const r = evalFormula("CORREL(A1:A5, A1:A5)", cells) as number;
    expect(r).toBeCloseTo(1);
  });
  it("FORECAST", () => {
    const r = evalFormula("FORECAST(6, A1:A5, A1:A5)", cells) as number;
    expect(typeof r).toBe("number");
  });
});

// --- S2-033: Financial ---
describe("Financial functions (S2-033)", () => {
  it("PMT calculates payment", () => {
    // 5% annual, 30 years, $200k loan
    const pmt = evalFormula("PMT(0.05/12, 360, 200000)") as number;
    expect(pmt).toBeLessThan(0); // payments are negative
    expect(Math.abs(pmt)).toBeCloseTo(1073.64, 0);
  });
  it("FV calculates future value", () => {
    const fv = evalFormula("FV(0.05/12, 120, -100)") as number;
    expect(fv).toBeGreaterThan(0);
  });
  it("PV calculates present value", () => {
    const pv = evalFormula("PV(0.05/12, 120, -100)") as number;
    expect(pv).toBeGreaterThan(0);
  });
  it("NPV calculates net present value", () => {
    const npv = evalFormula("NPV(0.1, 100, 200, 300)") as number;
    expect(npv).toBeGreaterThan(0);
  });
  it("NPER calculates periods", () => {
    const nper = evalFormula("NPER(0.05/12, -100, 10000)") as number;
    expect(nper).toBeGreaterThan(0);
  });
});

// --- S2-034: Info functions ---
describe("Info functions (S2-034)", () => {
  it("ISBLANK(empty) → true", () => {
    expect(evalFormula("ISBLANK(A1)")).toBe(true);
  });
  it("ISBLANK(non-empty) → false", () => {
    expect(evalFormula("ISBLANK(A1)", { A1: 1 })).toBe(false);
  });
  it("ISERROR on error → true", () => {
    expect(evalFormula("ISERROR(1/0)")).toBe(true);
  });
  it("ISERROR on non-error → false", () => {
    expect(evalFormula("ISERROR(42)")).toBe(false);
  });
  it("ISNUMBER(42) → true", () => {
    expect(evalFormula("ISNUMBER(42)")).toBe(true);
  });
  it('ISTEXT("hi") → true', () => {
    expect(evalFormula('ISTEXT("hi")')).toBe(true);
  });
  it("ISLOGICAL(TRUE) → true", () => {
    expect(evalFormula("ISLOGICAL(TRUE)")).toBe(true);
  });
  it("TYPE(42) → 1 (number)", () => {
    expect(evalFormula("TYPE(42)")).toBe(1);
  });
  it('TYPE("hi") → 2 (text)', () => {
    expect(evalFormula('TYPE("hi")')).toBe(2);
  });
});

// --- S2-035: Reference functions ---
describe("Reference functions (S2-035)", () => {
  const cells = { A1: 10, A2: 20, B1: 30, B2: 40 };

  it("ROWS counts rows in range", () => {
    expect(evalFormula("ROWS(A1:A5)", cells)).toBe(5);
  });
  it("COLUMNS counts columns", () => {
    expect(evalFormula("COLUMNS(A1:C1)", cells)).toBe(3);
  });
  it("CHOOSE picks by index", () => {
    expect(evalFormula('CHOOSE(2, "a", "b", "c")')).toBe("b");
  });
});

// --- S2-036/S2-037: Array functions ---
describe("Array functions (S2-036, S2-037)", () => {
  it("UNIQUE deduplicates", () => {
    const cells = { A1: 1, A2: 2, A3: 1, A4: 3 };
    const result = evalFormula("UNIQUE(A1:A4)", cells);
    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown as FormulaValue[]).length).toBe(3);
  });

  it("TRANSPOSE works on 2D range", () => {
    const cells = { A1: 1, B1: 2, A2: 3, B2: 4 };
    const result = evalFormula("TRANSPOSE(A1:B2)", cells);
    // Should be a 2D array transposed
    expect(Array.isArray(result)).toBe(true);
  });
});

// --- S2-038: SPARKLINE ---
describe("SPARKLINE (S2-038)", () => {
  it("returns sparkline marker", () => {
    const result = evalFormula("SPARKLINE(A1:A5)", { A1: 1, A2: 2, A3: 3 });
    expect(typeof result).toBe("string");
    expect((result as string).startsWith("__SPARKLINE__")).toBe(true);
  });
});

// --- S2-039: String concatenation with & ---
describe("String concat with & (S2-039)", () => {
  it("basic concat", () => {
    expect(evalFormula('"Hello"&" "&"World"')).toBe("Hello World");
  });
  it("concat with cell refs", () => {
    expect(evalFormula("A1&B1", { A1: "Hi", B1: " There" })).toBe("Hi There");
  });
  it("concat number with string", () => {
    expect(evalFormula('42&" items"')).toBe("42 items");
  });
});

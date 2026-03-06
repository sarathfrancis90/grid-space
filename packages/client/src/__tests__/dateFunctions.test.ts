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

/** Convert a JS Date to the expected serial number (Excel epoch). */
function dateToSerial(date: Date): number {
  const epoch = new Date(1899, 11, 30);
  return Math.round((date.getTime() - epoch.getTime()) / 86400000);
}

describe("DATEVALUE", () => {
  it("parses a standard date string", () => {
    const result = evalFormula('DATEVALUE("2024-01-15")');
    expect(result).toBe(dateToSerial(new Date(2024, 0, 15)));
  });

  it("parses month/day/year format", () => {
    const result = evalFormula('DATEVALUE("March 1, 2024")');
    expect(result).toBe(dateToSerial(new Date(2024, 2, 1)));
  });

  it("returns #VALUE! for invalid date string", () => {
    expect(evalFormula('DATEVALUE("not-a-date")')).toBe("#VALUE!");
  });
});

describe("TIMEVALUE", () => {
  it("parses a time string to fractional day", () => {
    const result = evalFormula('TIMEVALUE("12:00:00")');
    expect(result).toBe(0.5); // noon = half a day
  });

  it("parses morning time", () => {
    const result = evalFormula('TIMEVALUE("06:00:00")');
    expect(result).toBe(0.25); // 6 AM = quarter day
  });

  it("returns #VALUE! for invalid time string", () => {
    expect(evalFormula('TIMEVALUE("not-a-time")')).toBe("#VALUE!");
  });
});

describe("TIME", () => {
  it("creates a time value from components", () => {
    const result = evalFormula("TIME(12, 0, 0)");
    expect(result).toBe(0.5);
  });

  it("handles hours, minutes, seconds", () => {
    const result = evalFormula("TIME(6, 30, 0)");
    expect(result).toBeCloseTo((6 * 3600 + 30 * 60) / 86400, 10);
  });

  it("returns fractional day for midnight", () => {
    expect(evalFormula("TIME(0, 0, 0)")).toBe(0);
  });

  it("returns #NUM! for negative total", () => {
    expect(evalFormula("TIME(-1, 0, 0)")).toBe("#NUM!");
  });

  it("returns #VALUE! with too few args", () => {
    expect(evalFormula("TIME(12, 0)")).toBe("#VALUE!");
  });
});

describe("DAYS", () => {
  it("returns days between two dates", () => {
    // DAYS(end_date, start_date) — note: end first, start second
    const result = evalFormula('DAYS("2024-03-01", "2024-01-01")');
    expect(result).toBe(60); // 31 (Jan) + 29 (Feb 2024 is leap)
  });

  it("returns negative when end < start", () => {
    const result = evalFormula('DAYS("2024-01-01", "2024-03-01")');
    expect(result).toBe(-60);
  });

  it("returns 0 for same date", () => {
    expect(evalFormula('DAYS("2024-06-15", "2024-06-15")')).toBe(0);
  });

  it("returns #VALUE! for invalid dates", () => {
    expect(evalFormula('DAYS("bad", "2024-01-01")')).toBe("#VALUE!");
  });
});

describe("DAYS360", () => {
  it("calculates with US method (default)", () => {
    const result = evalFormula('DAYS360("2024-01-01", "2024-07-01")');
    expect(result).toBe(180);
  });

  it("calculates with European method", () => {
    const result = evalFormula('DAYS360("2024-01-31", "2024-03-31", TRUE)');
    // European: both 31s → 30: (0*360) + (2*30) + (30-30) = 60
    expect(result).toBe(60);
  });

  it("returns #VALUE! for invalid dates", () => {
    expect(evalFormula('DAYS360("bad", "2024-01-01")')).toBe("#VALUE!");
  });
});

describe("ISOWEEKNUM", () => {
  it("returns ISO week number for a date", () => {
    // Jan 1, 2024 is a Monday → ISO week 1
    expect(evalFormula('ISOWEEKNUM("2024-01-01")')).toBe(1);
  });

  it("returns correct week for mid-year", () => {
    // July 1, 2024 is a Monday → week 27
    expect(evalFormula('ISOWEEKNUM("2024-07-01")')).toBe(27);
  });

  it("handles year boundary (Dec 31 can be week 1)", () => {
    // Dec 31, 2024 is a Tuesday → ISO week 1 of 2025
    expect(evalFormula('ISOWEEKNUM("2024-12-31")')).toBe(1);
  });

  it("returns #VALUE! for invalid date", () => {
    expect(evalFormula('ISOWEEKNUM("bad")')).toBe("#VALUE!");
  });
});

describe("YEARFRAC", () => {
  it("calculates year fraction with basis 0 (US 30/360)", () => {
    const result = evalFormula('YEARFRAC("2024-01-01", "2024-07-01", 0)');
    expect(result).toBe(0.5);
  });

  it("calculates year fraction with basis 1 (actual/actual)", () => {
    const result = evalFormula('YEARFRAC("2024-01-01", "2024-07-01", 1)');
    // 182 days in a leap year of 366
    expect(result).toBeCloseTo(182 / 366, 5);
  });

  it("calculates year fraction with basis 2 (actual/360)", () => {
    const result = evalFormula('YEARFRAC("2024-01-01", "2024-07-01", 2)');
    expect(result).toBeCloseTo(182 / 360, 5);
  });

  it("calculates year fraction with basis 3 (actual/365)", () => {
    const result = evalFormula('YEARFRAC("2024-01-01", "2024-07-01", 3)');
    expect(result).toBeCloseTo(182 / 365, 5);
  });

  it("returns #NUM! for invalid basis", () => {
    expect(evalFormula('YEARFRAC("2024-01-01", "2024-07-01", 5)')).toBe(
      "#NUM!",
    );
  });

  it("defaults to basis 0 when not specified", () => {
    const result = evalFormula('YEARFRAC("2024-01-01", "2024-07-01")');
    expect(result).toBe(0.5);
  });
});

describe("WORKDAY.INTL", () => {
  it("calculates workdays with default weekend (Sat/Sun)", () => {
    // 2024-01-01 is Monday. 5 workdays later = 2024-01-08 (next Monday)
    const result = evalFormula('WORKDAY.INTL("2024-01-01", 5)');
    expect(result).toBe(dateToSerial(new Date(2024, 0, 8)));
  });

  it("calculates workdays with Sunday-only weekend (code 11)", () => {
    // Weekend = Sunday only (code 11). 6 workdays from Mon Jan 1
    // Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6) → Jan 8
    const result = evalFormula('WORKDAY.INTL("2024-01-01", 6, 11)');
    expect(result).toBe(dateToSerial(new Date(2024, 0, 8)));
  });

  it("returns #VALUE! for invalid weekend code", () => {
    expect(evalFormula('WORKDAY.INTL("2024-01-01", 5, 99)')).toBe("#VALUE!");
  });
});

describe("NETWORKDAYS.INTL", () => {
  it("counts network days with default weekend", () => {
    // Jan 1 (Mon) to Jan 5 (Fri) 2024 = 5 workdays
    const result = evalFormula('NETWORKDAYS.INTL("2024-01-01", "2024-01-05")');
    expect(result).toBe(5);
  });

  it("counts network days with Sunday-only weekend (code 11)", () => {
    // Jan 1 (Mon) to Jan 7 (Sun) 2024 — 6 working days (Mon-Sat)
    const result = evalFormula(
      'NETWORKDAYS.INTL("2024-01-01", "2024-01-07", 11)',
    );
    expect(result).toBe(6);
  });

  it("returns #VALUE! for invalid dates", () => {
    expect(evalFormula('NETWORKDAYS.INTL("bad", "2024-01-05")')).toBe(
      "#VALUE!",
    );
  });
});

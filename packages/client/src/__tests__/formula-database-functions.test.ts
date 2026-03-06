import { describe, it, expect } from "vitest";
import { parseFormula } from "../components/formula/parser";
import { evaluate } from "../components/formula/evaluator";
import type { CellValueGetter, FormulaValue } from "../types/formula";

/**
 * Helper: evaluate a formula with a cell value map.
 * Keys are like "A1", "B2", etc.
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
 * Shared test database layout (A1:D7):
 *
 *   A         B        C        D
 * 1 Name      Dept     Salary   Age
 * 2 Alice     Eng      80000    30
 * 3 Bob       Sales    60000    25
 * 4 Charlie   Eng      90000    35
 * 5 Diana     Sales    70000    28
 * 6 Eve       Eng      85000    32
 * 7 Frank     HR       55000    40
 *
 * Criteria range E1:F2 (single criteria: Dept = "Eng"):
 *   E         F
 * 1 Dept
 * 2 Eng
 *
 * Criteria range E4:F5 (multiple OR criteria: Dept = "Eng" OR Dept = "Sales"):
 *   E         F
 * 4 Dept
 * 5 Eng
 * 6 Sales
 *
 * Criteria range H1:I2 (multi-column AND: Dept = "Eng" AND Salary > 80000):
 *   H         I
 * 1 Dept      Salary
 * 2 Eng       >80000
 */
const DB_CELLS: Record<string, FormulaValue> = {
  // Database headers (row 1)
  A1: "Name",
  B1: "Dept",
  C1: "Salary",
  D1: "Age",
  // Row 2
  A2: "Alice",
  B2: "Eng",
  C2: 80000,
  D2: 30,
  // Row 3
  A3: "Bob",
  B3: "Sales",
  C3: 60000,
  D3: 25,
  // Row 4
  A4: "Charlie",
  B4: "Eng",
  C4: 90000,
  D4: 35,
  // Row 5
  A5: "Diana",
  B5: "Sales",
  C5: 70000,
  D5: 28,
  // Row 6
  A6: "Eve",
  B6: "Eng",
  C6: 85000,
  D6: 32,
  // Row 7
  A7: "Frank",
  B7: "HR",
  C7: 55000,
  D7: 40,

  // Criteria 1: Dept = Eng (E1:E2)
  E1: "Dept",
  E2: "Eng",

  // Criteria 2: Dept = Eng OR Sales (E4:E6)
  E4: "Dept",
  E5: "Eng",
  E6: "Sales",

  // Criteria 3: Dept = Eng AND Salary > 80000 (H1:I2)
  H1: "Dept",
  I1: "Salary",
  H2: "Eng",
  I2: ">80000",
};

describe("Database functions", () => {
  describe("DSUM", () => {
    it("sums salary for Eng dept", () => {
      // Eng: Alice(80000) + Charlie(90000) + Eve(85000) = 255000
      expect(evalFormula('DSUM(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(
        255000,
      );
    });

    it("works with field as column index", () => {
      // Field 3 = Salary column (1-based)
      expect(evalFormula("DSUM(A1:D7, 3, E1:E2)", DB_CELLS)).toBe(255000);
    });

    it("sums with multi-column AND criteria", () => {
      // Eng AND Salary > 80000: Charlie(90000) + Eve(85000) = 175000
      expect(evalFormula('DSUM(A1:D7, "Salary", H1:I2)', DB_CELLS)).toBe(
        175000,
      );
    });

    it("returns #VALUE! with too few args", () => {
      expect(evalFormula('DSUM(A1:D7, "Salary")', DB_CELLS)).toBe("#VALUE!");
    });
  });

  describe("DAVERAGE", () => {
    it("averages salary for Eng dept", () => {
      // Eng: (80000 + 90000 + 85000) / 3 = 85000
      expect(evalFormula('DAVERAGE(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(
        85000,
      );
    });

    it("averages age for Eng dept", () => {
      // Eng ages: (30 + 35 + 32) / 3 ≈ 32.333...
      const result = evalFormula(
        'DAVERAGE(A1:D7, "Age", E1:E2)',
        DB_CELLS,
      ) as number;
      expect(result).toBeCloseTo(32.333, 2);
    });
  });

  describe("DCOUNT", () => {
    it("counts numeric values in Salary for Eng dept", () => {
      // 3 Eng employees with numeric salaries
      expect(evalFormula('DCOUNT(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(3);
    });

    it("counts numeric values in Name for Eng dept (strings, not numbers)", () => {
      // Name column has strings, not numbers → 0
      expect(evalFormula('DCOUNT(A1:D7, "Name", E1:E2)', DB_CELLS)).toBe(0);
    });
  });

  describe("DCOUNTA", () => {
    it("counts non-empty values in Name for Eng dept", () => {
      // 3 Eng employees with non-empty names
      expect(evalFormula('DCOUNTA(A1:D7, "Name", E1:E2)', DB_CELLS)).toBe(3);
    });

    it("counts non-empty values in Salary for Eng dept", () => {
      expect(evalFormula('DCOUNTA(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(3);
    });
  });

  describe("DGET", () => {
    it("returns single matching value", () => {
      // Criteria: Dept=Eng AND Salary>80000 AND we need a unique match
      // Let's use a specific criteria to get exactly one result
      // We'll create a new criteria for Name=Alice
      const cells = {
        ...DB_CELLS,
        G1: "Name",
        G2: "Alice",
      };
      expect(evalFormula('DGET(A1:D7, "Salary", G1:G2)', cells)).toBe(80000);
    });

    it("returns #NUM! when multiple matches", () => {
      // Eng has 3 matches → #NUM!
      expect(evalFormula('DGET(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(
        "#NUM!",
      );
    });

    it("returns #VALUE! when no matches", () => {
      const cells = {
        ...DB_CELLS,
        G1: "Dept",
        G2: "Legal",
      };
      expect(evalFormula('DGET(A1:D7, "Salary", G1:G2)', cells)).toBe(
        "#VALUE!",
      );
    });
  });

  describe("DMAX", () => {
    it("finds max salary for Eng dept", () => {
      // Eng: max(80000, 90000, 85000) = 90000
      expect(evalFormula('DMAX(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(90000);
    });

    it("finds max age for Eng dept", () => {
      // Eng ages: max(30, 35, 32) = 35
      expect(evalFormula('DMAX(A1:D7, "Age", E1:E2)', DB_CELLS)).toBe(35);
    });
  });

  describe("DMIN", () => {
    it("finds min salary for Eng dept", () => {
      // Eng: min(80000, 90000, 85000) = 80000
      expect(evalFormula('DMIN(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(80000);
    });

    it("finds min age for Eng dept", () => {
      // Eng ages: min(30, 35, 32) = 30
      expect(evalFormula('DMIN(A1:D7, "Age", E1:E2)', DB_CELLS)).toBe(30);
    });
  });

  describe("DPRODUCT", () => {
    it("computes product of ages for Eng dept", () => {
      // Eng ages: 30 * 35 * 32 = 33600
      expect(evalFormula('DPRODUCT(A1:D7, "Age", E1:E2)', DB_CELLS)).toBe(
        33600,
      );
    });
  });

  describe("DSTDEV (sample)", () => {
    it("computes sample std dev of salaries for Eng dept", () => {
      // Eng salaries: 80000, 90000, 85000
      // mean = 85000, sample var = ((80000-85000)^2 + (90000-85000)^2 + (85000-85000)^2) / 2
      // = (25000000 + 25000000 + 0) / 2 = 25000000
      // stdev = 5000
      expect(evalFormula('DSTDEV(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(
        5000,
      );
    });

    it("returns #DIV/0! with fewer than 2 values", () => {
      const cells = {
        ...DB_CELLS,
        G1: "Name",
        G2: "Alice",
      };
      expect(evalFormula('DSTDEV(A1:D7, "Salary", G1:G2)', cells)).toBe(
        "#DIV/0!",
      );
    });
  });

  describe("DSTDEVP (population)", () => {
    it("computes population std dev of salaries for Eng dept", () => {
      // population var = 50000000 / 3 ≈ 16666666.67
      // stdevp ≈ 4082.48
      const result = evalFormula(
        'DSTDEVP(A1:D7, "Salary", E1:E2)',
        DB_CELLS,
      ) as number;
      expect(result).toBeCloseTo(4082.48, 1);
    });
  });

  describe("DVAR (sample)", () => {
    it("computes sample variance of salaries for Eng dept", () => {
      // sample var = 25000000
      expect(evalFormula('DVAR(A1:D7, "Salary", E1:E2)', DB_CELLS)).toBe(
        25000000,
      );
    });
  });

  describe("DVARP (population)", () => {
    it("computes population variance of salaries for Eng dept", () => {
      // population var = 50000000 / 3 ≈ 16666666.67
      const result = evalFormula(
        'DVARP(A1:D7, "Salary", E1:E2)',
        DB_CELLS,
      ) as number;
      expect(result).toBeCloseTo(16666666.67, 0);
    });
  });

  describe("OR criteria (multiple criteria rows)", () => {
    it("DSUM with Eng OR Sales", () => {
      // Eng: 80000+90000+85000=255000, Sales: 60000+70000=130000, total=385000
      expect(evalFormula('DSUM(A1:D7, "Salary", E4:E6)', DB_CELLS)).toBe(
        385000,
      );
    });

    it("DCOUNT with Eng OR Sales", () => {
      // 5 employees match
      expect(evalFormula('DCOUNT(A1:D7, "Salary", E4:E6)', DB_CELLS)).toBe(5);
    });
  });

  describe("Edge cases", () => {
    it("returns #VALUE! for invalid field name", () => {
      expect(evalFormula('DSUM(A1:D7, "NonExistent", E1:E2)', DB_CELLS)).toBe(
        "#VALUE!",
      );
    });

    it("returns #VALUE! for out-of-range field index", () => {
      expect(evalFormula("DSUM(A1:D7, 10, E1:E2)", DB_CELLS)).toBe("#VALUE!");
    });

    it("returns #VALUE! for field index 0", () => {
      expect(evalFormula("DSUM(A1:D7, 0, E1:E2)", DB_CELLS)).toBe("#VALUE!");
    });

    it("handles field as string number", () => {
      // "3" should be treated as column index 3 (Salary)
      expect(evalFormula('DSUM(A1:D7, "3", E1:E2)', DB_CELLS)).toBe(255000);
    });
  });
});

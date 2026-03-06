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

describe("TEXTJOIN", () => {
  it("joins values with delimiter", () => {
    expect(evalFormula('TEXTJOIN(", ", TRUE, "a", "b", "c")')).toBe("a, b, c");
  });

  it("joins with empty delimiter", () => {
    expect(evalFormula('TEXTJOIN("", TRUE, "a", "b", "c")')).toBe("abc");
  });

  it("ignores empty when ignore_empty is TRUE", () => {
    const cells = { A1: "hello", A2: null, A3: "world" };
    expect(evalFormula('TEXTJOIN(" ", TRUE, A1, A2, A3)', cells)).toBe(
      "hello world",
    );
  });

  it("includes empty when ignore_empty is FALSE", () => {
    const cells = { A1: "hello", A2: null, A3: "world" };
    expect(evalFormula('TEXTJOIN("-", FALSE, A1, A2, A3)', cells)).toBe(
      "hello--world",
    );
  });

  it("returns #VALUE! with too few args", () => {
    expect(evalFormula('TEXTJOIN(",")')).toBe("#VALUE!");
  });

  it("propagates errors", () => {
    expect(evalFormula("TEXTJOIN(A1, TRUE, 1/0)", {})).toBe("#DIV/0!");
  });
});

describe("SPLIT", () => {
  it("splits text by delimiter", () => {
    const result = evalFormula('SPLIT("a,b,c", ",")');
    expect(Array.isArray(result)).toBe(true);
    const flat = (result as unknown as string[][])[0];
    expect(flat).toEqual(["a", "b", "c"]);
  });

  it("splits by each character by default", () => {
    const result = evalFormula('SPLIT("axbycz", "xy")');
    expect(Array.isArray(result)).toBe(true);
    const flat = (result as unknown as string[][])[0];
    expect(flat).toEqual(["a", "b", "cz"]);
  });

  it("splits by whole delimiter when split_by_each is FALSE", () => {
    const result = evalFormula('SPLIT("axybxyc", "xy", FALSE)');
    expect(Array.isArray(result)).toBe(true);
    const flat = (result as unknown as string[][])[0];
    expect(flat).toEqual(["a", "b", "c"]);
  });

  it("removes empty strings by default", () => {
    const result = evalFormula('SPLIT("a,,b", ",")');
    const flat = (result as unknown as string[][])[0];
    expect(flat).toEqual(["a", "b"]);
  });

  it("keeps empty strings when remove_empty is FALSE", () => {
    const result = evalFormula('SPLIT("a,,b", ",", TRUE, FALSE)');
    const flat = (result as unknown as string[][])[0];
    expect(flat).toEqual(["a", "", "b"]);
  });

  it("returns #VALUE! with too few args", () => {
    expect(evalFormula('SPLIT("hello")')).toBe("#VALUE!");
  });
});

describe("REPLACE", () => {
  it("replaces part of text by position", () => {
    expect(evalFormula('REPLACE("Hello World", 7, 5, "Earth")')).toBe(
      "Hello Earth",
    );
  });

  it("inserts text at position (0 chars replaced)", () => {
    expect(evalFormula('REPLACE("Hello", 6, 0, " World")')).toBe("Hello World");
  });

  it("removes text (empty replacement)", () => {
    expect(evalFormula('REPLACE("Hello World", 6, 6, "")')).toBe("Hello");
  });

  it("returns #VALUE! with start < 1", () => {
    expect(evalFormula('REPLACE("Hello", 0, 1, "X")')).toBe("#VALUE!");
  });

  it("returns #VALUE! with too few args", () => {
    expect(evalFormula('REPLACE("Hello", 1)')).toBe("#VALUE!");
  });
});

describe("JOIN", () => {
  it("joins values with delimiter", () => {
    expect(evalFormula('JOIN(", ", "a", "b", "c")')).toBe("a, b, c");
  });

  it("joins cell range with delimiter", () => {
    const cells = { A1: "x", A2: "y", A3: "z" };
    expect(evalFormula('JOIN("-", A1:A3)', cells)).toBe("x-y-z");
  });

  it("converts numbers to strings", () => {
    expect(evalFormula('JOIN("+", 1, 2, 3)')).toBe("1+2+3");
  });

  it("returns #VALUE! with too few args", () => {
    expect(evalFormula('JOIN(",")')).toBe("#VALUE!");
  });

  it("propagates errors", () => {
    expect(evalFormula("JOIN(A1, 1/0)", {})).toBe("#DIV/0!");
  });
});

describe("T", () => {
  it("returns text for text input", () => {
    expect(evalFormula('T("Hello")')).toBe("Hello");
  });

  it("returns empty string for number", () => {
    expect(evalFormula("T(42)")).toBe("");
  });

  it("returns empty string for boolean", () => {
    expect(evalFormula("T(TRUE)")).toBe("");
  });

  it("returns empty string for empty cell", () => {
    expect(evalFormula("T(A1)")).toBe("");
  });
});

describe("N", () => {
  it("returns number for number input", () => {
    expect(evalFormula("N(42)")).toBe(42);
  });

  it("returns 1 for TRUE", () => {
    expect(evalFormula("N(TRUE)")).toBe(1);
  });

  it("returns 0 for FALSE", () => {
    expect(evalFormula("N(FALSE)")).toBe(0);
  });

  it("returns 0 for text", () => {
    expect(evalFormula('N("hello")')).toBe(0);
  });

  it("propagates errors", () => {
    expect(evalFormula("N(1/0)")).toBe("#DIV/0!");
  });
});

describe("FIXED", () => {
  it("formats with 2 decimal places by default", () => {
    expect(evalFormula("FIXED(1234.567)")).toBe("1,234.57");
  });

  it("formats with specified decimal places", () => {
    expect(evalFormula("FIXED(1234.567, 1)")).toBe("1,234.6");
  });

  it("formats with no decimals", () => {
    expect(evalFormula("FIXED(1234.567, 0)")).toBe("1,235");
  });

  it("omits commas when no_commas is TRUE", () => {
    expect(evalFormula("FIXED(1234.567, 2, TRUE)")).toBe("1234.57");
  });

  it("returns #VALUE! for non-numeric input", () => {
    expect(evalFormula('FIXED("abc")')).toBe("#VALUE!");
  });
});

describe("DOLLAR", () => {
  it("formats with 2 decimal places by default", () => {
    expect(evalFormula("DOLLAR(1234.567)")).toBe("$1,234.57");
  });

  it("formats with specified decimal places", () => {
    expect(evalFormula("DOLLAR(1234.567, 0)")).toBe("$1,235");
  });

  it("formats negative numbers with parentheses", () => {
    const result = evalFormula("DOLLAR(-1234.56)");
    expect(result).toBe("($1,234.56)");
  });

  it("returns #VALUE! for non-numeric input", () => {
    expect(evalFormula('DOLLAR("abc")')).toBe("#VALUE!");
  });
});

describe("NUMBERVALUE", () => {
  it("converts standard number string", () => {
    expect(evalFormula('NUMBERVALUE("1,234.56")')).toBe(1234.56);
  });

  it("converts with custom separators", () => {
    expect(evalFormula('NUMBERVALUE("1.234,56", ",", ".")')).toBe(1234.56);
  });

  it("returns #VALUE! for non-numeric text", () => {
    expect(evalFormula('NUMBERVALUE("abc")')).toBe("#VALUE!");
  });

  it("handles simple number string", () => {
    expect(evalFormula('NUMBERVALUE("42")')).toBe(42);
  });
});

describe("ROMAN", () => {
  it("converts 1 to I", () => {
    expect(evalFormula("ROMAN(1)")).toBe("I");
  });

  it("converts 4 to IV", () => {
    expect(evalFormula("ROMAN(4)")).toBe("IV");
  });

  it("converts 9 to IX", () => {
    expect(evalFormula("ROMAN(9)")).toBe("IX");
  });

  it("converts 2024 to MMXXIV", () => {
    expect(evalFormula("ROMAN(2024)")).toBe("MMXXIV");
  });

  it("converts 3999 to MMMCMXCIX", () => {
    expect(evalFormula("ROMAN(3999)")).toBe("MMMCMXCIX");
  });

  it("returns #VALUE! for 0", () => {
    expect(evalFormula("ROMAN(0)")).toBe("#VALUE!");
  });

  it("returns #VALUE! for > 3999", () => {
    expect(evalFormula("ROMAN(4000)")).toBe("#VALUE!");
  });
});

describe("ARABIC", () => {
  it("converts I to 1", () => {
    expect(evalFormula('ARABIC("I")')).toBe(1);
  });

  it("converts IV to 4", () => {
    expect(evalFormula('ARABIC("IV")')).toBe(4);
  });

  it("converts IX to 9", () => {
    expect(evalFormula('ARABIC("IX")')).toBe(9);
  });

  it("converts MMXXIV to 2024", () => {
    expect(evalFormula('ARABIC("MMXXIV")')).toBe(2024);
  });

  it("converts MMMCMXCIX to 3999", () => {
    expect(evalFormula('ARABIC("MMMCMXCIX")')).toBe(3999);
  });

  it("handles lowercase", () => {
    expect(evalFormula('ARABIC("xiv")')).toBe(14);
  });

  it("returns 0 for empty string", () => {
    expect(evalFormula('ARABIC("")')).toBe(0);
  });

  it("returns #VALUE! for invalid characters", () => {
    expect(evalFormula('ARABIC("ABC")')).toBe("#VALUE!");
  });
});

describe("ROMAN and ARABIC roundtrip", () => {
  it("ARABIC(ROMAN(n)) === n for various values", () => {
    for (const n of [1, 14, 42, 99, 500, 1999, 3999]) {
      const roman = evalFormula(`ROMAN(${n})`) as string;
      expect(evalFormula(`ARABIC("${roman}")`)).toBe(n);
    }
  });
});

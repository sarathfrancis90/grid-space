import { describe, it, expect } from "vitest";
import { parseFormula } from "../components/formula/parser";
import { tokenize } from "../components/formula/tokenizer";
import type {
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  CellReference,
  RangeReference,
  BinaryOp,
  UnaryOp,
  FunctionCall,
} from "../types/formula";

describe("Tokenizer", () => {
  it("tokenizes numbers", () => {
    const tokens = tokenize("42");
    expect(tokens[0]).toMatchObject({ type: "NUMBER", value: "42" });
  });

  it("tokenizes decimal numbers", () => {
    const tokens = tokenize("3.14");
    expect(tokens[0]).toMatchObject({ type: "NUMBER", value: "3.14" });
  });

  it("tokenizes strings", () => {
    const tokens = tokenize('"hello"');
    expect(tokens[0]).toMatchObject({ type: "STRING", value: "hello" });
  });

  it("tokenizes booleans", () => {
    expect(tokenize("TRUE")[0]).toMatchObject({
      type: "BOOLEAN",
      value: "TRUE",
    });
    expect(tokenize("FALSE")[0]).toMatchObject({
      type: "BOOLEAN",
      value: "FALSE",
    });
  });

  it("tokenizes cell references", () => {
    const tokens = tokenize("A1");
    expect(tokens[0]).toMatchObject({ type: "CELL_REF", value: "A1" });
  });

  it("tokenizes absolute cell references", () => {
    const tokens = tokenize("$A$1");
    expect(tokens[0]).toMatchObject({ type: "CELL_REF", value: "$A$1" });
  });

  it("tokenizes mixed references", () => {
    expect(tokenize("$A1")[0]).toMatchObject({
      type: "CELL_REF",
      value: "$A1",
    });
    expect(tokenize("A$1")[0]).toMatchObject({
      type: "CELL_REF",
      value: "A$1",
    });
  });

  it("tokenizes operators", () => {
    const tokens = tokenize("1+2");
    expect(tokens[1]).toMatchObject({ type: "OPERATOR", value: "+" });
  });

  it("tokenizes multi-char operators", () => {
    expect(tokenize("1<>2")[1]).toMatchObject({
      type: "OPERATOR",
      value: "<>",
    });
    expect(tokenize("1<=2")[1]).toMatchObject({
      type: "OPERATOR",
      value: "<=",
    });
    expect(tokenize("1>=2")[1]).toMatchObject({
      type: "OPERATOR",
      value: ">=",
    });
  });

  it("tokenizes function names", () => {
    const tokens = tokenize("SUM(");
    expect(tokens[0]).toMatchObject({ type: "FUNCTION_NAME", value: "SUM" });
  });

  it("tokenizes colons for ranges", () => {
    const tokens = tokenize("A1:B5");
    expect(tokens[0]).toMatchObject({ type: "CELL_REF", value: "A1" });
    expect(tokens[1]).toMatchObject({ type: "COLON", value: ":" });
    expect(tokens[2]).toMatchObject({ type: "CELL_REF", value: "B5" });
  });
});

describe("Parser — Literals", () => {
  it("parses integer numbers", () => {
    const ast = parseFormula("42") as NumberLiteral;
    expect(ast.type).toBe("number");
    expect(ast.value).toBe(42);
  });

  it("parses decimal numbers", () => {
    const ast = parseFormula("3.14") as NumberLiteral;
    expect(ast.type).toBe("number");
    expect(ast.value).toBeCloseTo(3.14);
  });

  it("parses string literals", () => {
    const ast = parseFormula('"hello"') as StringLiteral;
    expect(ast.type).toBe("string");
    expect(ast.value).toBe("hello");
  });

  it("parses TRUE boolean", () => {
    const ast = parseFormula("TRUE") as BooleanLiteral;
    expect(ast.type).toBe("boolean");
    expect(ast.value).toBe(true);
  });

  it("parses FALSE boolean", () => {
    const ast = parseFormula("FALSE") as BooleanLiteral;
    expect(ast.type).toBe("boolean");
    expect(ast.value).toBe(false);
  });
});

describe("Parser — Cell References", () => {
  it("parses relative reference A1", () => {
    const ast = parseFormula("A1") as CellReference;
    expect(ast.type).toBe("cell");
    expect(ast.col).toBe(0);
    expect(ast.row).toBe(0);
    expect(ast.absCol).toBe(false);
    expect(ast.absRow).toBe(false);
  });

  it("parses absolute reference $A$1", () => {
    const ast = parseFormula("$A$1") as CellReference;
    expect(ast.type).toBe("cell");
    expect(ast.col).toBe(0);
    expect(ast.row).toBe(0);
    expect(ast.absCol).toBe(true);
    expect(ast.absRow).toBe(true);
  });

  it("parses mixed reference $A1", () => {
    const ast = parseFormula("$A1") as CellReference;
    expect(ast.type).toBe("cell");
    expect(ast.absCol).toBe(true);
    expect(ast.absRow).toBe(false);
  });

  it("parses mixed reference A$1", () => {
    const ast = parseFormula("A$1") as CellReference;
    expect(ast.type).toBe("cell");
    expect(ast.absCol).toBe(false);
    expect(ast.absRow).toBe(true);
  });

  it("parses multi-letter column (AA1)", () => {
    const ast = parseFormula("AA1") as CellReference;
    expect(ast.type).toBe("cell");
    expect(ast.col).toBe(26); // AA = column 26 (0-based)
    expect(ast.row).toBe(0);
  });

  it("parses range reference A1:B5", () => {
    const ast = parseFormula("A1:B5") as RangeReference;
    expect(ast.type).toBe("range");
    expect(ast.start.col).toBe(0);
    expect(ast.start.row).toBe(0);
    expect(ast.end.col).toBe(1);
    expect(ast.end.row).toBe(4);
  });

  it("parses cross-sheet reference Sheet2!A1", () => {
    const ast = parseFormula("Sheet2!A1") as CellReference;
    expect(ast.type).toBe("cell");
    expect(ast.sheet).toBe("Sheet2");
    expect(ast.col).toBe(0);
    expect(ast.row).toBe(0);
  });
});

describe("Parser — Arithmetic", () => {
  it("parses addition 1+2", () => {
    const ast = parseFormula("1+2") as BinaryOp;
    expect(ast.type).toBe("binary");
    expect(ast.op).toBe("+");
    expect((ast.left as NumberLiteral).value).toBe(1);
    expect((ast.right as NumberLiteral).value).toBe(2);
  });

  it("parses subtraction", () => {
    const ast = parseFormula("5-3") as BinaryOp;
    expect(ast.op).toBe("-");
  });

  it("parses multiplication", () => {
    const ast = parseFormula("4*3") as BinaryOp;
    expect(ast.op).toBe("*");
  });

  it("parses division", () => {
    const ast = parseFormula("10/2") as BinaryOp;
    expect(ast.op).toBe("/");
  });

  it("parses exponentiation", () => {
    const ast = parseFormula("2^3") as BinaryOp;
    expect(ast.op).toBe("^");
  });

  it("parses unary minus", () => {
    const ast = parseFormula("-5") as UnaryOp;
    expect(ast.type).toBe("unary");
    expect(ast.op).toBe("-");
    expect((ast.operand as NumberLiteral).value).toBe(5);
  });

  it("parses percent postfix", () => {
    const ast = parseFormula("50%") as BinaryOp;
    expect(ast.type).toBe("binary");
    expect(ast.op).toBe("%");
  });
});

describe("Parser — Operator Precedence (S2-041)", () => {
  it("multiplication before addition: 2+3*4 → +(2, *(3,4))", () => {
    const ast = parseFormula("2+3*4") as BinaryOp;
    expect(ast.op).toBe("+");
    expect((ast.left as NumberLiteral).value).toBe(2);
    const right = ast.right as BinaryOp;
    expect(right.op).toBe("*");
    expect((right.left as NumberLiteral).value).toBe(3);
    expect((right.right as NumberLiteral).value).toBe(4);
  });

  it("parentheses override precedence: (2+3)*4", () => {
    const ast = parseFormula("(2+3)*4") as BinaryOp;
    expect(ast.op).toBe("*");
    const left = ast.left as BinaryOp;
    expect(left.op).toBe("+");
    expect((left.left as NumberLiteral).value).toBe(2);
    expect((left.right as NumberLiteral).value).toBe(3);
    expect((ast.right as NumberLiteral).value).toBe(4);
  });

  it("exponent before multiplication: 2*3^2 → *(2, ^(3,2))", () => {
    const ast = parseFormula("2*3^2") as BinaryOp;
    expect(ast.op).toBe("*");
    const right = ast.right as BinaryOp;
    expect(right.op).toBe("^");
  });

  it("concatenation before comparison: A1&B1=C1 → =(A1&B1, C1)", () => {
    const ast = parseFormula("A1&B1=C1") as BinaryOp;
    expect(ast.op).toBe("=");
    const left = ast.left as BinaryOp;
    expect(left.op).toBe("&");
  });

  it("comparison is lowest arithmetic precedence", () => {
    const ast = parseFormula("1+2>3-1") as BinaryOp;
    expect(ast.op).toBe(">");
    expect((ast.left as BinaryOp).op).toBe("+");
    expect((ast.right as BinaryOp).op).toBe("-");
  });
});

describe("Parser — Function Calls", () => {
  it("parses SUM(A1:A5)", () => {
    const ast = parseFormula("SUM(A1:A5)") as FunctionCall;
    expect(ast.type).toBe("function");
    expect(ast.name).toBe("SUM");
    expect(ast.args).toHaveLength(1);
    expect(ast.args[0].type).toBe("range");
  });

  it("parses IF(A1>0, A1, 0)", () => {
    const ast = parseFormula("IF(A1>0, A1, 0)") as FunctionCall;
    expect(ast.type).toBe("function");
    expect(ast.name).toBe("IF");
    expect(ast.args).toHaveLength(3);
  });

  it("parses nested functions SUM(A1, IF(B1>0, B1, 0))", () => {
    const ast = parseFormula("SUM(A1, IF(B1>0, B1, 0))") as FunctionCall;
    expect(ast.name).toBe("SUM");
    expect(ast.args).toHaveLength(2);
    const ifCall = ast.args[1] as FunctionCall;
    expect(ifCall.name).toBe("IF");
    expect(ifCall.args).toHaveLength(3);
  });

  it("parses function with no args", () => {
    // e.g., TODAY() — parsing should work even without defined function
    const ast = parseFormula("TODAY()") as FunctionCall;
    expect(ast.type).toBe("function");
    expect(ast.name).toBe("TODAY");
    expect(ast.args).toHaveLength(0);
  });
});

describe("Parser — Error Cases", () => {
  it("throws on unclosed parenthesis", () => {
    expect(() => parseFormula("(1+2")).toThrow();
  });

  it("throws on invalid token", () => {
    expect(() => parseFormula("@")).toThrow();
  });

  it("throws on trailing operator", () => {
    expect(() => parseFormula("1+")).toThrow();
  });
});

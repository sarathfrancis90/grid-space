import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  evaluate,
  setNamedFunctionResolver,
  resetLambdaRegistry,
  resetNamedFunctionCallDepth,
} from "../components/formula/evaluator";
import { parseFormula } from "../components/formula/parser";
import type { CellValueGetter } from "../types/formula";
import type { NamedFunction } from "../types/grid";

const emptyCellValue: CellValueGetter = () => null;

function makeCellValueGetter(
  cells: Record<string, string | number | boolean | null>,
): CellValueGetter {
  return (_sheet, col, row) => {
    const key = `${row},${col}`;
    return cells[key] ?? null;
  };
}

function createNamedFn(
  name: string,
  formulaBody: string,
  args: Array<{ name: string; description: string }>,
): NamedFunction {
  return {
    name,
    formulaBody,
    description: "",
    arguments: args,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe("Named Functions in Formula Evaluator", () => {
  const functions = new Map<string, NamedFunction>();

  beforeEach(() => {
    functions.clear();
    resetLambdaRegistry();
    resetNamedFunctionCallDepth();
    setNamedFunctionResolver((name) => functions.get(name.toUpperCase()));
  });

  afterEach(() => {
    setNamedFunctionResolver(null);
  });

  it("evaluates a simple named function with one argument", () => {
    functions.set(
      "DOUBLE",
      createNamedFn("DOUBLE", "x * 2", [{ name: "x", description: "" }]),
    );
    const ast = parseFormula("DOUBLE(5)");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe(10);
  });

  it("evaluates a named function with two arguments", () => {
    functions.set(
      "ADD_MULT",
      createNamedFn("ADD_MULT", "(a + b) * c", [
        { name: "a", description: "" },
        { name: "b", description: "" },
        { name: "c", description: "" },
      ]),
    );
    const ast = parseFormula("ADD_MULT(2, 3, 4)");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe(20);
  });

  it("evaluates a named function with no arguments", () => {
    functions.set("MAGIC_NUMBER", createNamedFn("MAGIC_NUMBER", "42", []));
    const ast = parseFormula("MAGIC_NUMBER()");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe(42);
  });

  it("returns #VALUE! for wrong arity", () => {
    functions.set(
      "DOUBLE",
      createNamedFn("DOUBLE", "x * 2", [{ name: "x", description: "" }]),
    );
    const ast = parseFormula("DOUBLE(1, 2)");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe("#VALUE!");
  });

  it("returns #NAME? for unknown function when no resolver", () => {
    setNamedFunctionResolver(null);
    const ast = parseFormula("UNKNOWN_FN(1)");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe("#NAME?");
  });

  it("named function can use cell references", () => {
    functions.set(
      "CELL_DOUBLE",
      createNamedFn("CELL_DOUBLE", "x * 2", [{ name: "x", description: "" }]),
    );
    const getCellValue = makeCellValueGetter({ "0,0": 7 });
    const ast = parseFormula("CELL_DOUBLE(A1)");
    const result = evaluate(ast, getCellValue);
    expect(result).toBe(14);
  });

  it("named function can use built-in functions in body", () => {
    functions.set(
      "SUM_DOUBLE",
      createNamedFn("SUM_DOUBLE", "SUM(x, y) * 2", [
        { name: "x", description: "" },
        { name: "y", description: "" },
      ]),
    );
    const ast = parseFormula("SUM_DOUBLE(3, 4)");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe(14);
  });

  it("named function can call other named functions", () => {
    functions.set(
      "DOUBLE",
      createNamedFn("DOUBLE", "x * 2", [{ name: "x", description: "" }]),
    );
    functions.set(
      "QUADRUPLE",
      createNamedFn("QUADRUPLE", "DOUBLE(DOUBLE(x))", [
        { name: "x", description: "" },
      ]),
    );
    const ast = parseFormula("QUADRUPLE(3)");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe(12);
  });

  it("prevents infinite recursion with depth limit", () => {
    functions.set(
      "INFINITE",
      createNamedFn("INFINITE", "INFINITE(x)", [
        { name: "x", description: "" },
      ]),
    );
    const ast = parseFormula("INFINITE(1)");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe("#VALUE!");
  });

  it("can be used inside other formulas", () => {
    functions.set(
      "DOUBLE",
      createNamedFn("DOUBLE", "x * 2", [{ name: "x", description: "" }]),
    );
    const ast = parseFormula("DOUBLE(5) + 3");
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe(13);
  });

  it("named function with string concatenation", () => {
    functions.set(
      "GREET",
      createNamedFn("GREET", '"Hello " & name', [
        { name: "name", description: "" },
      ]),
    );
    const ast = parseFormula('GREET("World")');
    const result = evaluate(ast, emptyCellValue);
    expect(result).toBe("Hello World");
  });
});

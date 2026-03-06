import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseFormula } from "../components/formula/parser";
import {
  evaluate,
  setNamedFunctionResolver,
  resetLambdaRegistry,
} from "../components/formula/evaluator";
import type { NamedFunctionDef } from "../components/formula/evaluator";
import type { CellValueGetter, FormulaValue } from "../types/formula";

const emptyCellGetter: CellValueGetter = () => null;

const registry = new Map<string, NamedFunctionDef>();

function resolver(name: string): NamedFunctionDef | undefined {
  return registry.get(name.toUpperCase());
}

describe("Named Function evaluation", () => {
  beforeEach(() => {
    registry.clear();
    resetLambdaRegistry();
    setNamedFunctionResolver(resolver);
  });

  afterEach(() => {
    setNamedFunctionResolver(null);
  });

  it("evaluates a named function with no args", () => {
    registry.set("MAGIC_NUMBER", { formula: "42", argNames: [] });

    const ast = parseFormula("MAGIC_NUMBER()");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe(42);
  });

  it("evaluates a named function with one arg", () => {
    registry.set("DOUBLE", { formula: "x * 2", argNames: ["x"] });

    const ast = parseFormula("DOUBLE(5)");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe(10);
  });

  it("evaluates a named function with multiple args", () => {
    registry.set("ADD_TAX", {
      formula: "price + price * rate",
      argNames: ["price", "rate"],
    });

    const ast = parseFormula("ADD_TAX(100, 0.1)");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe(110);
  });

  it("returns #NAME? for undefined named function", () => {
    const ast = parseFormula("NOPE(1)");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe("#NAME?");
  });

  it("returns #VALUE! for wrong arity", () => {
    registry.set("ONE_ARG", { formula: "x + 1", argNames: ["x"] });

    const ast = parseFormula("ONE_ARG(1, 2)");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe("#VALUE!");
  });

  it("named function can use built-in functions", () => {
    registry.set("ABS_DOUBLE", {
      formula: "ABS(x) * 2",
      argNames: ["x"],
    });

    const ast = parseFormula("ABS_DOUBLE(-5)");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe(10);
  });

  it("named function can reference cells", () => {
    registry.set("ADD_CELL", {
      formula: "x + A1",
      argNames: ["x"],
    });

    const cellGetter: CellValueGetter = (
      _sheet: string | undefined,
      col: number,
      row: number,
    ): FormulaValue => {
      if (col === 0 && row === 0) return 100;
      return null;
    };

    const ast = parseFormula("ADD_CELL(5)");
    const result = evaluate(ast, cellGetter);
    expect(result).toBe(105);
  });

  it("returns #NAME? when resolver is null", () => {
    setNamedFunctionResolver(null);
    const ast = parseFormula("WHATEVER(1)");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe("#NAME?");
  });

  it("supports nesting named functions with built-ins", () => {
    registry.set("CELSIUS_TO_F", {
      formula: "c * 9 / 5 + 32",
      argNames: ["c"],
    });

    const ast = parseFormula("ROUND(CELSIUS_TO_F(100), 0)");
    const result = evaluate(ast, emptyCellGetter);
    expect(result).toBe(212);
  });
});

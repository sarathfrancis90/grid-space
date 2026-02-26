/**
 * Formula evaluator — walks the AST and computes results.
 * Pure module: takes a getCellValue callback to resolve references.
 */
import type {
  ASTNode,
  FormulaValue,
  FormulaError,
  CellValueGetter,
  CellReference,
  RangeReference,
} from "../../types/formula";
import { isFormulaError } from "../../types/formula";
import { getFunction, hasFunction } from "./functions";

export class EvaluationError extends Error {
  constructor(
    message: string,
    public errorType: FormulaError,
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

/**
 * Evaluate an AST node, returning a FormulaValue.
 */
export function evaluate(
  node: ASTNode,
  getCellValue: CellValueGetter,
): FormulaValue {
  switch (node.type) {
    case "number":
      return node.value;
    case "string":
      return node.value;
    case "boolean":
      return node.value;
    case "error":
      return node.error;
    case "cell":
      return getCellValue(node.sheet, node.col, node.row);
    case "range":
      // Ranges should only appear as function arguments.
      // If a bare range is evaluated, return #VALUE!
      return "#VALUE!" as FormulaError;
    case "unary":
      return evaluateUnary(node.op, node.operand, getCellValue);
    case "binary":
      return evaluateBinary(node.op, node.left, node.right, getCellValue);
    case "function":
      return evaluateFunction(node.name, node.args, getCellValue);
  }
}

function evaluateUnary(
  op: string,
  operand: ASTNode,
  getCellValue: CellValueGetter,
): FormulaValue {
  const val = evaluate(operand, getCellValue);
  if (isFormulaError(val)) return val;

  const num = toNumeric(val);
  if (num === null) return "#VALUE!" as FormulaError;

  switch (op) {
    case "-":
      return -num;
    case "+":
      return num;
    default:
      return "#VALUE!" as FormulaError;
  }
}

function evaluateBinary(
  op: string,
  left: ASTNode,
  right: ASTNode,
  getCellValue: CellValueGetter,
): FormulaValue {
  const leftVal = evaluate(left, getCellValue);
  if (isFormulaError(leftVal)) return leftVal;

  const rightVal = evaluate(right, getCellValue);
  if (isFormulaError(rightVal)) return rightVal;

  switch (op) {
    case "+":
      return numericBinary(leftVal, rightVal, (a, b) => a + b);
    case "-":
      return numericBinary(leftVal, rightVal, (a, b) => a - b);
    case "*":
      return numericBinary(leftVal, rightVal, (a, b) => a * b);
    case "/": {
      const divisor = toNumeric(rightVal);
      if (divisor === 0) return "#DIV/0!" as FormulaError;
      return numericBinary(leftVal, rightVal, (a, b) => a / b);
    }
    case "^":
      return numericBinary(leftVal, rightVal, (a, b) => Math.pow(a, b));
    case "%":
      return numericBinary(leftVal, rightVal, (a, b) => a / b);
    case "&":
      return String(leftVal ?? "") + String(rightVal ?? "");
    case "=":
      return compareValues(leftVal, rightVal) === 0;
    case "<>":
      return compareValues(leftVal, rightVal) !== 0;
    case "<":
      return compareValues(leftVal, rightVal) < 0;
    case ">":
      return compareValues(leftVal, rightVal) > 0;
    case "<=":
      return compareValues(leftVal, rightVal) <= 0;
    case ">=":
      return compareValues(leftVal, rightVal) >= 0;
    default:
      return "#VALUE!" as FormulaError;
  }
}

function evaluateFunction(
  name: string,
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  const upperName = name.toUpperCase();

  if (!hasFunction(upperName)) {
    return "#NAME?" as FormulaError;
  }

  const fn = getFunction(upperName);
  if (!fn) return "#NAME?" as FormulaError;

  // Special handling for IFERROR/IFNA — evaluate first arg, catch errors
  if (upperName === "IFERROR") {
    return evaluateIFERROR(argNodes, getCellValue, fn);
  }
  if (upperName === "IFNA") {
    return evaluateIFNA(argNodes, getCellValue, fn);
  }

  // Special handling for IF — short-circuit evaluation
  if (upperName === "IF") {
    return evaluateIF(argNodes, getCellValue, fn);
  }

  // Evaluate arguments, expanding ranges
  const evaluatedArgs = argNodes.map((arg) => evaluateArg(arg, getCellValue));

  try {
    return fn(...evaluatedArgs);
  } catch {
    return "#VALUE!" as FormulaError;
  }
}

/**
 * Evaluate an argument node. If it's a range, expand to array of values.
 */
function evaluateArg(
  node: ASTNode,
  getCellValue: CellValueGetter,
): FormulaValue {
  if (node.type === "range") {
    return expandRange(node, getCellValue) as unknown as FormulaValue;
  }
  return evaluate(node, getCellValue);
}

/**
 * Expand a range reference into a flat array of cell values.
 */
function expandRange(
  range: RangeReference,
  getCellValue: CellValueGetter,
): FormulaValue[] {
  const startCol = Math.min(range.start.col, range.end.col);
  const endCol = Math.max(range.start.col, range.end.col);
  const startRow = Math.min(range.start.row, range.end.row);
  const endRow = Math.max(range.start.row, range.end.row);
  const sheet = range.start.sheet;

  const values: FormulaValue[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      values.push(getCellValue(sheet, col, row));
    }
  }
  return values;
}

/**
 * Special IF evaluation with short-circuit.
 */
function evaluateIF(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  fn: (...args: FormulaValue[]) => FormulaValue,
): FormulaValue {
  if (argNodes.length < 2 || argNodes.length > 3) {
    return "#VALUE!" as FormulaError;
  }

  const condition = evaluate(argNodes[0], getCellValue);
  if (isFormulaError(condition)) return condition;

  const isTruthy = toBoolValue(condition);
  if (isTruthy) {
    return evaluate(argNodes[1], getCellValue);
  }
  if (argNodes.length >= 3) {
    return evaluate(argNodes[2], getCellValue);
  }
  return fn(condition, evaluate(argNodes[1], getCellValue));
}

/**
 * Special IFERROR evaluation — evaluate value, if error return alternative.
 */
function evaluateIFERROR(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  fn: (...args: FormulaValue[]) => FormulaValue,
): FormulaValue {
  if (argNodes.length !== 2) return "#VALUE!" as FormulaError;
  const value = evaluate(argNodes[0], getCellValue);
  const errorVal = evaluate(argNodes[1], getCellValue);
  return fn(value, errorVal);
}

/**
 * Special IFNA evaluation — evaluate value, if #N/A return alternative.
 */
function evaluateIFNA(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  fn: (...args: FormulaValue[]) => FormulaValue,
): FormulaValue {
  if (argNodes.length !== 2) return "#VALUE!" as FormulaError;
  const value = evaluate(argNodes[0], getCellValue);
  const naVal = evaluate(argNodes[1], getCellValue);
  return fn(value, naVal);
}

// --- Helpers ---

function toNumeric(val: FormulaValue): number | null {
  if (val === null || val === "") return 0;
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "string") {
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  return null;
}

function numericBinary(
  left: FormulaValue,
  right: FormulaValue,
  op: (a: number, b: number) => number,
): FormulaValue {
  const a = toNumeric(left);
  const b = toNumeric(right);
  if (a === null || b === null) return "#VALUE!" as FormulaError;
  const result = op(a, b);
  if (!isFinite(result) && isFinite(a) && isFinite(b)) {
    return "#NUM!" as FormulaError;
  }
  return result;
}

function compareValues(a: FormulaValue, b: FormulaValue): number {
  // null/empty comparisons
  if ((a === null || a === "") && (b === null || b === "")) return 0;

  const na = toNumeric(a);
  const nb = toNumeric(b);

  // Both numeric
  if (
    na !== null &&
    nb !== null &&
    typeof a !== "string" &&
    typeof b !== "string"
  ) {
    return na - nb;
  }

  // String comparison is case-insensitive
  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

function toBoolValue(val: FormulaValue): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (val === null) return false;
  return false;
}

/**
 * Extract all cell references from an AST node (for dependency tracking).
 */
export function extractReferences(
  node: ASTNode,
): Array<CellReference | RangeReference> {
  const refs: Array<CellReference | RangeReference> = [];

  function walk(n: ASTNode): void {
    switch (n.type) {
      case "cell":
        refs.push(n);
        break;
      case "range":
        refs.push(n);
        break;
      case "binary":
        walk(n.left);
        walk(n.right);
        break;
      case "unary":
        walk(n.operand);
        break;
      case "function":
        for (const arg of n.args) walk(arg);
        break;
      default:
        break;
    }
  }

  walk(node);
  return refs;
}

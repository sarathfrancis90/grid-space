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
  EvaluationContext,
} from "../../types/formula";
import { isFormulaError } from "../../types/formula";
import { getFunction, hasFunction } from "./functions";
import { parseFormula as parseFormulaImport } from "./parser";
import { colLetterToIndex } from "./cellUtils";
import type { NamedFunction } from "../../types/grid";

let namedFunctionResolver:
  | ((name: string) => NamedFunction | undefined)
  | null = null;

export function setNamedFunctionResolver(
  resolver: ((name: string) => NamedFunction | undefined) | null,
): void {
  namedFunctionResolver = resolver;
}

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
 * An optional context provides the current cell's row/col for functions
 * like ROW(), COLUMN(), OFFSET(), and INDIRECT().
 */
export function evaluate(
  node: ASTNode,
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
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
      return evaluateUnary(node.op, node.operand, getCellValue, context);
    case "binary":
      return evaluateBinary(
        node.op,
        node.left,
        node.right,
        getCellValue,
        context,
      );
    case "function":
      return evaluateFunction(node.name, node.args, getCellValue, context);
  }
}

function evaluateUnary(
  op: string,
  operand: ASTNode,
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  const val = evaluate(operand, getCellValue, context);
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
  context?: EvaluationContext,
): FormulaValue {
  const leftVal = evaluate(left, getCellValue, context);
  if (isFormulaError(leftVal)) return leftVal;

  const rightVal = evaluate(right, getCellValue, context);
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
  context?: EvaluationContext,
): FormulaValue {
  const upperName = name.toUpperCase();

  if (!hasFunction(upperName)) {
    // Check named functions before returning #NAME?
    if (namedFunctionResolver) {
      const namedFn = namedFunctionResolver(upperName);
      if (namedFn) {
        return evaluateNamedFunction(namedFn, argNodes, getCellValue, context);
      }
    }
    return "#NAME?" as FormulaError;
  }

  const fn = getFunction(upperName);
  if (!fn) return "#NAME?" as FormulaError;

  // Special handling for IFERROR/IFNA — evaluate first arg, catch errors
  if (upperName === "IFERROR") {
    return evaluateIFERROR(argNodes, getCellValue, fn, context);
  }
  if (upperName === "IFNA") {
    return evaluateIFNA(argNodes, getCellValue, fn, context);
  }

  // Special handling for IF — short-circuit evaluation
  if (upperName === "IF") {
    return evaluateIF(argNodes, getCellValue, fn, context);
  }

  // Special handling for ARRAYFORMULA — element-wise evaluation over ranges
  if (upperName === "ARRAYFORMULA") {
    return evaluateArrayFormula(argNodes, getCellValue, context);
  }

  // Special handling for LET — sequential name-value binding
  if (upperName === "LET") {
    return evaluateLET(argNodes, getCellValue, context);
  }

  // Special handling for LAMBDA — closure creation
  if (upperName === "LAMBDA") {
    return evaluateLAMBDA(argNodes, getCellValue);
  }

  // Special handling for __CALL__ — invoke a lambda expression
  if (upperName === "__CALL__") {
    return evaluateCall(argNodes, getCellValue, context);
  }

  // Special handling for ROW/COLUMN — need current cell context
  if (upperName === "ROW") {
    return evaluateROW(argNodes, getCellValue, context);
  }
  if (upperName === "COLUMN") {
    return evaluateCOLUMN(argNodes, getCellValue, context);
  }

  // Special handling for OFFSET — dynamic range reference
  if (upperName === "OFFSET") {
    return evaluateOFFSET(argNodes, getCellValue, context);
  }

  // Special handling for INDIRECT — string to cell reference
  if (upperName === "INDIRECT") {
    return evaluateINDIRECT(argNodes, getCellValue, context);
  }

  // Evaluate arguments, expanding ranges
  const evaluatedArgs = argNodes.map((arg) =>
    evaluateArg(arg, getCellValue, context),
  );

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
  context?: EvaluationContext,
): FormulaValue {
  if (node.type === "range") {
    return expandRange(node, getCellValue) as unknown as FormulaValue;
  }
  return evaluate(node, getCellValue, context);
}

/**
 * Expand a range reference into a 2D array of cell values (rows × cols).
 * Aggregate functions flatten this via flattenArgs; lookup functions use 2D.
 */
function expandRange(
  range: RangeReference,
  getCellValue: CellValueGetter,
): FormulaValue[][] {
  const startCol = Math.min(range.start.col, range.end.col);
  const endCol = Math.max(range.start.col, range.end.col);
  const startRow = Math.min(range.start.row, range.end.row);
  const endRow = Math.max(range.start.row, range.end.row);
  const sheet = range.start.sheet;

  const rows: FormulaValue[][] = [];
  for (let row = startRow; row <= endRow; row++) {
    const rowVals: FormulaValue[] = [];
    for (let col = startCol; col <= endCol; col++) {
      rowVals.push(getCellValue(sheet, col, row));
    }
    rows.push(rowVals);
  }
  return rows;
}

/**
 * Special IF evaluation with short-circuit.
 */
function evaluateIF(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  fn: (...args: FormulaValue[]) => FormulaValue,
  context?: EvaluationContext,
): FormulaValue {
  if (argNodes.length < 2 || argNodes.length > 3) {
    return "#VALUE!" as FormulaError;
  }

  const condition = evaluate(argNodes[0], getCellValue, context);
  if (isFormulaError(condition)) return condition;

  const isTruthy = toBoolValue(condition);
  if (isTruthy) {
    return evaluate(argNodes[1], getCellValue, context);
  }
  if (argNodes.length >= 3) {
    return evaluate(argNodes[2], getCellValue, context);
  }
  return fn(condition, evaluate(argNodes[1], getCellValue, context));
}

/**
 * Special IFERROR evaluation — evaluate value, if error return alternative.
 */
function evaluateIFERROR(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  fn: (...args: FormulaValue[]) => FormulaValue,
  context?: EvaluationContext,
): FormulaValue {
  if (argNodes.length !== 2) return "#VALUE!" as FormulaError;
  const value = evaluate(argNodes[0], getCellValue, context);
  const errorVal = evaluate(argNodes[1], getCellValue, context);
  return fn(value, errorVal);
}

/**
 * Special IFNA evaluation — evaluate value, if #N/A return alternative.
 */
function evaluateIFNA(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  fn: (...args: FormulaValue[]) => FormulaValue,
  context?: EvaluationContext,
): FormulaValue {
  if (argNodes.length !== 2) return "#VALUE!" as FormulaError;
  const value = evaluate(argNodes[0], getCellValue, context);
  const naVal = evaluate(argNodes[1], getCellValue, context);
  return fn(value, naVal);
}

// ---------------------------------------------------------------------------
// ROW / COLUMN — return current cell position or reference position
// ---------------------------------------------------------------------------

function evaluateROW(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  if (argNodes.length === 0) {
    // No args → return current cell row (1-based)
    return context ? context.currentRow + 1 : 1;
  }
  if (argNodes.length === 1) {
    const arg = argNodes[0];
    // If the argument is a cell reference, return its row (1-based)
    if (arg.type === "cell") {
      return arg.row + 1;
    }
    // If it's a range, return the start row (1-based)
    if (arg.type === "range") {
      return Math.min(arg.start.row, arg.end.row) + 1;
    }
    // Otherwise evaluate and return #VALUE!
    const val = evaluate(arg, getCellValue, context);
    if (isFormulaError(val)) return val;
    return "#VALUE!" as FormulaError;
  }
  return "#VALUE!" as FormulaError;
}

function evaluateCOLUMN(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  if (argNodes.length === 0) {
    // No args → return current cell column (1-based)
    return context ? context.currentCol + 1 : 1;
  }
  if (argNodes.length === 1) {
    const arg = argNodes[0];
    if (arg.type === "cell") {
      return arg.col + 1;
    }
    if (arg.type === "range") {
      return Math.min(arg.start.col, arg.end.col) + 1;
    }
    const val = evaluate(arg, getCellValue, context);
    if (isFormulaError(val)) return val;
    return "#VALUE!" as FormulaError;
  }
  return "#VALUE!" as FormulaError;
}

// ---------------------------------------------------------------------------
// OFFSET — return a range offset from a starting reference
// ---------------------------------------------------------------------------

function evaluateOFFSET(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  // OFFSET(cell_reference, rows, cols, [height], [width])
  if (argNodes.length < 3 || argNodes.length > 5) {
    return "#VALUE!" as FormulaError;
  }

  // First arg must be a cell or range reference to get the anchor position
  const refNode = argNodes[0];
  let anchorRow: number;
  let anchorCol: number;
  let anchorSheet: string | undefined;
  let baseHeight = 1;
  let baseWidth = 1;

  if (refNode.type === "cell") {
    anchorRow = refNode.row;
    anchorCol = refNode.col;
    anchorSheet = refNode.sheet;
  } else if (refNode.type === "range") {
    anchorRow = Math.min(refNode.start.row, refNode.end.row);
    anchorCol = Math.min(refNode.start.col, refNode.end.col);
    anchorSheet = refNode.start.sheet;
    baseHeight = Math.abs(refNode.end.row - refNode.start.row) + 1;
    baseWidth = Math.abs(refNode.end.col - refNode.start.col) + 1;
  } else {
    return "#VALUE!" as FormulaError;
  }

  // Evaluate rows and cols offset
  const rowsVal = evaluate(argNodes[1], getCellValue, context);
  if (isFormulaError(rowsVal)) return rowsVal;
  const rowsOffset = toNumeric(rowsVal);
  if (rowsOffset === null) return "#VALUE!" as FormulaError;

  const colsVal = evaluate(argNodes[2], getCellValue, context);
  if (isFormulaError(colsVal)) return colsVal;
  const colsOffset = toNumeric(colsVal);
  if (colsOffset === null) return "#VALUE!" as FormulaError;

  // Optional height and width
  let height = baseHeight;
  let width = baseWidth;

  if (argNodes.length >= 4) {
    const hVal = evaluate(argNodes[3], getCellValue, context);
    if (isFormulaError(hVal)) return hVal;
    const h = toNumeric(hVal);
    if (h === null || h < 1) return "#VALUE!" as FormulaError;
    height = Math.floor(h);
  }
  if (argNodes.length >= 5) {
    const wVal = evaluate(argNodes[4], getCellValue, context);
    if (isFormulaError(wVal)) return wVal;
    const w = toNumeric(wVal);
    if (w === null || w < 1) return "#VALUE!" as FormulaError;
    width = Math.floor(w);
  }

  const newRow = anchorRow + Math.floor(rowsOffset);
  const newCol = anchorCol + Math.floor(colsOffset);

  // Bounds check
  if (newRow < 0 || newCol < 0) return "#REF!" as FormulaError;

  // Single cell → return the value directly
  if (height === 1 && width === 1) {
    return getCellValue(anchorSheet, newCol, newRow);
  }

  // Multi-cell → return 2D array
  const rows: FormulaValue[][] = [];
  for (let r = 0; r < height; r++) {
    const rowVals: FormulaValue[] = [];
    for (let c = 0; c < width; c++) {
      rowVals.push(getCellValue(anchorSheet, newCol + c, newRow + r));
    }
    rows.push(rowVals);
  }
  return rows as unknown as FormulaValue;
}

// ---------------------------------------------------------------------------
// INDIRECT — resolve a string cell reference to its value
// ---------------------------------------------------------------------------

function evaluateINDIRECT(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  // INDIRECT(cell_reference_string, [a1_notation])
  if (argNodes.length < 1 || argNodes.length > 2) {
    return "#VALUE!" as FormulaError;
  }

  const refStrVal = evaluate(argNodes[0], getCellValue, context);
  if (isFormulaError(refStrVal)) return refStrVal;
  if (typeof refStrVal !== "string" || !refStrVal) {
    return "#REF!" as FormulaError;
  }

  // Parse the A1-style reference string (e.g. "A1", "Sheet1!A1", "A1:B5")
  const refStr = refStrVal.trim();

  // Check for range reference (contains ":")
  const colonIdx = refStr.indexOf(":");
  if (colonIdx >= 0) {
    const startStr = refStr.substring(0, colonIdx);
    const endStr = refStr.substring(colonIdx + 1);
    const startRef = parseA1Reference(startStr);
    const endRef = parseA1Reference(endStr);
    if (!startRef || !endRef) return "#REF!" as FormulaError;

    // Use sheet from start ref for both
    const sheet = startRef.sheet ?? endRef.sheet;
    const startRow = Math.min(startRef.row, endRef.row);
    const endRow = Math.max(startRef.row, endRef.row);
    const startCol = Math.min(startRef.col, endRef.col);
    const endCol = Math.max(startRef.col, endRef.col);

    const rows: FormulaValue[][] = [];
    for (let r = startRow; r <= endRow; r++) {
      const rowVals: FormulaValue[] = [];
      for (let c = startCol; c <= endCol; c++) {
        rowVals.push(getCellValue(sheet, c, r));
      }
      rows.push(rowVals);
    }

    // Single cell range
    if (rows.length === 1 && rows[0].length === 1) {
      return rows[0][0];
    }
    return rows as unknown as FormulaValue;
  }

  // Single cell reference
  const ref = parseA1Reference(refStr);
  if (!ref) return "#REF!" as FormulaError;

  return getCellValue(ref.sheet, ref.col, ref.row);
}

/**
 * Parse an A1-style cell reference string like "A1", "$A$1", "Sheet1!A1"
 * Returns the parsed components or null if invalid.
 */
function parseA1Reference(
  refStr: string,
): { sheet?: string; col: number; row: number } | null {
  let sheet: string | undefined;
  let cellPart = refStr.trim();

  // Check for sheet reference
  const bangIdx = cellPart.indexOf("!");
  if (bangIdx >= 0) {
    sheet = cellPart.substring(0, bangIdx).replace(/^'|'$/g, "");
    cellPart = cellPart.substring(bangIdx + 1);
  }

  // Strip $ signs for absolute references
  cellPart = cellPart.replace(/\$/g, "");

  // Match column letters + row number
  const match = cellPart.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;

  const col = colLetterToIndex(match[1].toUpperCase());
  const row = parseInt(match[2], 10) - 1; // 0-based

  if (row < 0 || col < 0) return null;

  return { sheet, col, row };
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

// ---------------------------------------------------------------------------
// ARRAYFORMULA — evaluate expression element-wise over ranges
// ---------------------------------------------------------------------------

/**
 * Find all range nodes in an AST.
 */
function findRanges(node: ASTNode): RangeReference[] {
  const ranges: RangeReference[] = [];
  function walk(n: ASTNode): void {
    if (n.type === "range") {
      ranges.push(n);
    } else if (n.type === "binary") {
      walk(n.left);
      walk(n.right);
    } else if (n.type === "unary") {
      walk(n.operand);
    } else if (n.type === "function") {
      for (const arg of n.args) walk(arg);
    }
  }
  walk(node);
  return ranges;
}

/**
 * Replace range nodes in the AST with single cell references at a given offset.
 */
function replaceRangesAtOffset(
  node: ASTNode,
  rowOffset: number,
  colOffset: number,
): ASTNode {
  switch (node.type) {
    case "range": {
      const startRow = Math.min(node.start.row, node.end.row);
      const startCol = Math.min(node.start.col, node.end.col);
      const endRow = Math.max(node.start.row, node.end.row);
      const endCol = Math.max(node.start.col, node.end.col);
      const rangeRows = endRow - startRow + 1;
      const rangeCols = endCol - startCol + 1;
      // Clamp offset to range bounds
      const r = rowOffset < rangeRows ? rowOffset : rangeRows - 1;
      const c = colOffset < rangeCols ? colOffset : rangeCols - 1;
      return {
        type: "cell",
        sheet: node.start.sheet,
        col: startCol + c,
        row: startRow + r,
        absCol: false,
        absRow: false,
        raw: "",
      } as CellReference;
    }
    case "binary":
      return {
        ...node,
        left: replaceRangesAtOffset(node.left, rowOffset, colOffset),
        right: replaceRangesAtOffset(node.right, rowOffset, colOffset),
      };
    case "unary":
      return {
        ...node,
        operand: replaceRangesAtOffset(node.operand, rowOffset, colOffset),
      };
    case "function":
      return {
        ...node,
        args: node.args.map((a) =>
          replaceRangesAtOffset(a, rowOffset, colOffset),
        ),
      };
    default:
      return node;
  }
}

function evaluateArrayFormula(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  if (argNodes.length !== 1) return "#VALUE!" as FormulaError;

  const arg = argNodes[0];

  // First try normal evaluation — if the inner expression already returns an array, use it
  const normalResult = evaluateArg(arg, getCellValue, context);
  if (Array.isArray(normalResult)) {
    return normalResult as FormulaValue;
  }

  // Find range references for element-wise evaluation
  const ranges = findRanges(arg);
  if (ranges.length === 0) {
    return normalResult;
  }

  // Determine output dimensions from the ranges
  let outRows = 1;
  let outCols = 1;
  for (const r of ranges) {
    const rows = Math.abs(r.end.row - r.start.row) + 1;
    const cols = Math.abs(r.end.col - r.start.col) + 1;
    if (rows > outRows) outRows = rows;
    if (cols > outCols) outCols = cols;
  }

  // Evaluate expression for each position
  const result: FormulaValue[][] = [];
  for (let row = 0; row < outRows; row++) {
    const rowValues: FormulaValue[] = [];
    for (let col = 0; col < outCols; col++) {
      const modifiedNode = replaceRangesAtOffset(arg, row, col);
      rowValues.push(evaluate(modifiedNode, getCellValue, context));
    }
    result.push(rowValues);
  }

  // If result is 1x1, return scalar
  if (result.length === 1 && result[0].length === 1) {
    return result[0][0];
  }

  return result as unknown as FormulaValue;
}

// ---------------------------------------------------------------------------
// LET — sequential name-value binding
// ---------------------------------------------------------------------------

function evaluateLET(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  // LET(name1, value1, name2, value2, ..., expression)
  // Must have an odd number of args >= 3
  if (argNodes.length < 3 || argNodes.length % 2 !== 1) {
    return "#VALUE!" as FormulaError;
  }

  const bindings = new Map<string, FormulaValue>();

  // Process name-value pairs sequentially
  for (let i = 0; i < argNodes.length - 1; i += 2) {
    const name = extractIdentifierName(argNodes[i]);
    if (!name) return "#VALUE!" as FormulaError;

    // Evaluate the value expression with current bindings substituted
    const substituted = substituteBindings(argNodes[i + 1], bindings);
    const value = evaluate(substituted, getCellValue, context);
    bindings.set(name.toUpperCase(), value);
  }

  // Evaluate the final expression with all bindings substituted
  const bodySubstituted = substituteBindings(
    argNodes[argNodes.length - 1],
    bindings,
  );
  return evaluate(bodySubstituted, getCellValue, context);
}

/**
 * Extract an identifier name from an AST node.
 * In the parser, unknown identifiers become function call nodes with 0 args.
 */
function extractIdentifierName(node: ASTNode): string | null {
  if (node.type === "function" && node.args.length === 0) {
    return node.name;
  }
  return null;
}

/**
 * Replace bare identifier references (function nodes with 0 args)
 * matching binding names with literal value nodes.
 */
function substituteBindings(
  node: ASTNode,
  bindings: Map<string, FormulaValue>,
): ASTNode {
  if (node.type === "function" && node.args.length === 0) {
    const value = bindings.get(node.name.toUpperCase());
    if (value !== undefined) {
      return valueToASTNode(value);
    }
    return node;
  }
  if (node.type === "binary") {
    return {
      ...node,
      left: substituteBindings(node.left, bindings),
      right: substituteBindings(node.right, bindings),
    };
  }
  if (node.type === "unary") {
    return {
      ...node,
      operand: substituteBindings(node.operand, bindings),
    };
  }
  if (node.type === "function") {
    return {
      ...node,
      args: node.args.map((a) => substituteBindings(a, bindings)),
    };
  }
  return node;
}

/**
 * Convert a FormulaValue into a literal AST node.
 */
function valueToASTNode(value: FormulaValue): ASTNode {
  if (typeof value === "number") return { type: "number", value };
  if (typeof value === "string") {
    if (isFormulaError(value)) return { type: "error", error: value };
    return { type: "string", value };
  }
  if (typeof value === "boolean") return { type: "boolean", value };
  return { type: "number", value: 0 }; // null → 0
}

// ---------------------------------------------------------------------------
// LAMBDA — closure creation and invocation
// ---------------------------------------------------------------------------

/** Module-level registry for lambda closures during evaluation. */
const lambdaRegistry = new Map<
  string,
  { params: string[]; body: ASTNode; getCellValue: CellValueGetter }
>();
let lambdaCounter = 0;

/** Reset lambda registry (call before each top-level evaluation). */
export function resetLambdaRegistry(): void {
  lambdaRegistry.clear();
  lambdaCounter = 0;
}

/**
 * LAMBDA(param1, param2, ..., body)
 * Creates a function closure and stores it in the lambda registry.
 * Returns a unique ID string that __CALL__ can look up.
 */
function evaluateLAMBDA(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  if (argNodes.length < 2) return "#VALUE!" as FormulaError;

  const paramNames: string[] = [];
  for (let i = 0; i < argNodes.length - 1; i++) {
    const name = extractIdentifierName(argNodes[i]);
    if (!name) return "#VALUE!" as FormulaError;
    paramNames.push(name.toUpperCase());
  }

  const body = argNodes[argNodes.length - 1];
  const id = `__LAMBDA_${lambdaCounter++}__`;
  lambdaRegistry.set(id, { params: paramNames, body, getCellValue });
  return id;
}

/**
 * __CALL__(callee, arg1, arg2, ...)
 * Invokes a lambda expression with the given arguments.
 * callee should evaluate to a lambda ID string.
 */
function evaluateCall(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  if (argNodes.length < 1) return "#VALUE!" as FormulaError;

  // Evaluate the callee to get the lambda ID
  const callee = evaluate(argNodes[0], getCellValue, context);

  if (typeof callee !== "string" || !callee.startsWith("__LAMBDA_")) {
    return "#VALUE!" as FormulaError;
  }

  const lambda = lambdaRegistry.get(callee);
  if (!lambda) return "#VALUE!" as FormulaError;

  // Evaluate the call arguments
  const callArgs: FormulaValue[] = [];
  for (let i = 1; i < argNodes.length; i++) {
    callArgs.push(evaluateArg(argNodes[i], getCellValue, context));
  }

  // Check arity
  if (callArgs.length !== lambda.params.length) {
    return "#VALUE!" as FormulaError;
  }

  // Bind parameters to argument values
  const bindings = new Map<string, FormulaValue>();
  for (let i = 0; i < lambda.params.length; i++) {
    bindings.set(lambda.params[i], callArgs[i]);
  }

  // Substitute bindings into the body and evaluate
  const substitutedBody = substituteBindings(lambda.body, bindings);
  return evaluate(substitutedBody, lambda.getCellValue, context);
}

// ---------------------------------------------------------------------------
// Named Functions — user-defined reusable functions (Google Sheets parity)
// ---------------------------------------------------------------------------

let namedFunctionCallDepth = 0;
const MAX_NAMED_FUNCTION_DEPTH = 32;

function evaluateNamedFunction(
  namedFn: NamedFunction,
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
  context?: EvaluationContext,
): FormulaValue {
  // Prevent infinite recursion
  if (namedFunctionCallDepth >= MAX_NAMED_FUNCTION_DEPTH) {
    return "#VALUE!" as FormulaError;
  }

  // Arity check
  if (argNodes.length !== namedFn.arguments.length) {
    return "#VALUE!" as FormulaError;
  }

  // Evaluate call arguments
  const callArgs: FormulaValue[] = [];
  for (const argNode of argNodes) {
    callArgs.push(evaluateArg(argNode, getCellValue, context));
  }

  // Build bindings from parameter names to argument values
  const bindings = new Map<string, FormulaValue>();
  for (let i = 0; i < namedFn.arguments.length; i++) {
    bindings.set(namedFn.arguments[i].name.toUpperCase(), callArgs[i]);
  }

  // Parse the formula body and substitute bindings
  try {
    const bodyAST = parseFormulaImport(namedFn.formulaBody);
    const substituted = substituteBindings(bodyAST, bindings);

    namedFunctionCallDepth++;
    try {
      return evaluate(substituted, getCellValue, context);
    } finally {
      namedFunctionCallDepth--;
    }
  } catch {
    return "#VALUE!" as FormulaError;
  }
}

/** Reset named function call depth (call before each top-level evaluation). */
export function resetNamedFunctionCallDepth(): void {
  namedFunctionCallDepth = 0;
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

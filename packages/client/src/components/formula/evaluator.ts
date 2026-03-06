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
import { parseFormula as parseFormulaImport } from "./parser";
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
    // Check named functions before returning #NAME?
    if (namedFunctionResolver) {
      const namedFn = namedFunctionResolver(upperName);
      if (namedFn) {
        return evaluateNamedFunction(namedFn, argNodes, getCellValue);
      }
    }
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

  // Special handling for ARRAYFORMULA — element-wise evaluation over ranges
  if (upperName === "ARRAYFORMULA") {
    return evaluateArrayFormula(argNodes, getCellValue);
  }

  // Special handling for LET — sequential name-value binding
  if (upperName === "LET") {
    return evaluateLET(argNodes, getCellValue);
  }

  // Special handling for LAMBDA — closure creation
  if (upperName === "LAMBDA") {
    return evaluateLAMBDA(argNodes, getCellValue);
  }

  // Special handling for __CALL__ — invoke a lambda expression
  if (upperName === "__CALL__") {
    return evaluateCall(argNodes, getCellValue);
  }

  // Special handling for __ARRAY_LITERAL__ — return stored array value
  if (upperName === "__ARRAY_LITERAL__") {
    if (argNodes.length === 1 && argNodes[0].type === "string") {
      const stored = arrayLiteralRegistry.get(argNodes[0].value);
      if (stored !== undefined) return stored;
    }
    return "#VALUE!" as FormulaError;
  }

  // Special handling for LAMBDA helper functions (take LAMBDA as argument)
  if (upperName === "MAP") {
    return evaluateMAP(argNodes, getCellValue);
  }
  if (upperName === "REDUCE") {
    return evaluateREDUCE(argNodes, getCellValue);
  }
  if (upperName === "SCAN") {
    return evaluateSCAN(argNodes, getCellValue);
  }
  if (upperName === "MAKEARRAY") {
    return evaluateMAKEARRAY(argNodes, getCellValue);
  }
  if (upperName === "BYROW") {
    return evaluateBYROW(argNodes, getCellValue);
  }
  if (upperName === "BYCOL") {
    return evaluateBYCOL(argNodes, getCellValue);
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
): FormulaValue {
  if (argNodes.length !== 1) return "#VALUE!" as FormulaError;

  const arg = argNodes[0];

  // First try normal evaluation — if the inner expression already returns an array, use it
  const normalResult = evaluateArg(arg, getCellValue);
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
      rowValues.push(evaluate(modifiedNode, getCellValue));
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
    const value = evaluate(substituted, getCellValue);
    bindings.set(name.toUpperCase(), value);
  }

  // Evaluate the final expression with all bindings substituted
  const bodySubstituted = substituteBindings(
    argNodes[argNodes.length - 1],
    bindings,
  );
  return evaluate(bodySubstituted, getCellValue);
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

/** Registry for array literals that can't be represented as simple AST nodes. */
const arrayLiteralRegistry = new Map<string, FormulaValue>();
let arrayLiteralCounter = 0;

/** Reset array literal registry (called alongside resetLambdaRegistry). */
function resetArrayLiteralRegistry(): void {
  arrayLiteralRegistry.clear();
  arrayLiteralCounter = 0;
}

/**
 * Convert a FormulaValue into a literal AST node.
 * For array values, stores in registry and returns a __ARRAY_LITERAL__ function node.
 */
function valueToASTNode(value: FormulaValue): ASTNode {
  if (typeof value === "number") return { type: "number", value };
  if (typeof value === "string") {
    if (isFormulaError(value)) return { type: "error", error: value };
    return { type: "string", value };
  }
  if (typeof value === "boolean") return { type: "boolean", value };
  if (Array.isArray(value)) {
    const id = `__ARR_${arrayLiteralCounter++}__`;
    arrayLiteralRegistry.set(id, value as unknown as FormulaValue);
    return {
      type: "function",
      name: "__ARRAY_LITERAL__",
      args: [{ type: "string", value: id }],
    };
  }
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
  resetArrayLiteralRegistry();
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
): FormulaValue {
  if (argNodes.length < 1) return "#VALUE!" as FormulaError;

  // Evaluate the callee to get the lambda ID
  const callee = evaluate(argNodes[0], getCellValue);

  if (typeof callee !== "string" || !callee.startsWith("__LAMBDA_")) {
    return "#VALUE!" as FormulaError;
  }

  const lambda = lambdaRegistry.get(callee);
  if (!lambda) return "#VALUE!" as FormulaError;

  // Evaluate the call arguments
  const callArgs: FormulaValue[] = [];
  for (let i = 1; i < argNodes.length; i++) {
    callArgs.push(evaluateArg(argNodes[i], getCellValue));
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
  return evaluate(substitutedBody, lambda.getCellValue);
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
    callArgs.push(evaluateArg(argNode, getCellValue));
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
      return evaluate(substituted, getCellValue);
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

// ---------------------------------------------------------------------------
// LAMBDA helper functions — MAP, REDUCE, SCAN, MAKEARRAY, BYROW, BYCOL
// ---------------------------------------------------------------------------

/**
 * Invoke a lambda (by ID string) with the given argument values.
 */
function invokeLambda(
  lambdaId: FormulaValue,
  args: FormulaValue[],
): FormulaValue {
  if (typeof lambdaId !== "string" || !lambdaId.startsWith("__LAMBDA_")) {
    return "#VALUE!" as FormulaError;
  }
  const lambda = lambdaRegistry.get(lambdaId);
  if (!lambda) return "#VALUE!" as FormulaError;
  if (args.length !== lambda.params.length) return "#VALUE!" as FormulaError;

  const bindings = new Map<string, FormulaValue>();
  for (let i = 0; i < lambda.params.length; i++) {
    bindings.set(lambda.params[i], args[i]);
  }
  const substitutedBody = substituteBindings(lambda.body, bindings);
  return evaluate(substitutedBody, lambda.getCellValue);
}

/**
 * Normalize a value into a 2D array for consistent processing.
 */
function to2DArray(val: FormulaValue): FormulaValue[][] {
  if (Array.isArray(val)) {
    const arr = val as unknown as FormulaValue[] | FormulaValue[][];
    if (arr.length > 0 && Array.isArray(arr[0])) {
      return arr as unknown as FormulaValue[][];
    }
    // 1D array → column vector
    return (arr as FormulaValue[]).map((v) => [v]);
  }
  return [[val]];
}

/**
 * MAP(lambda, array1, [array2, ...])
 * Applies LAMBDA to each element of one or more arrays.
 */
function evaluateMAP(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  // MAP(lambda, array1, ...) — first arg is lambda, rest are arrays
  // Google Sheets: MAP(array1, [array2, ...], lambda) — lambda is LAST
  if (argNodes.length < 2) return "#VALUE!" as FormulaError;

  // Evaluate all arguments
  const evaluatedArgs = argNodes.map((arg) => evaluateArg(arg, getCellValue));

  // Lambda is the last argument (Google Sheets convention)
  const lambdaId = evaluatedArgs[evaluatedArgs.length - 1];
  const arrays = evaluatedArgs.slice(0, -1).map(to2DArray);

  // All arrays must have the same dimensions
  const rows = arrays[0].length;
  const cols = arrays[0][0]?.length ?? 0;
  for (const arr of arrays) {
    if (arr.length !== rows || (arr[0]?.length ?? 0) !== cols) {
      return "#VALUE!" as FormulaError;
    }
  }

  const result: FormulaValue[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowResult: FormulaValue[] = [];
    for (let c = 0; c < cols; c++) {
      const lambdaArgs = arrays.map((arr) => arr[r][c]);
      const val = invokeLambda(lambdaId, lambdaArgs);
      if (isFormulaError(val)) return val;
      rowResult.push(val);
    }
    result.push(rowResult);
  }

  if (result.length === 1 && result[0].length === 1) return result[0][0];
  return result as unknown as FormulaValue;
}

/**
 * REDUCE(initial_value, array, lambda)
 * Reduces an array to an accumulated result.
 */
function evaluateREDUCE(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  if (argNodes.length !== 3) return "#VALUE!" as FormulaError;

  const initial = evaluate(argNodes[0], getCellValue);
  if (isFormulaError(initial)) return initial;

  const arrayVal = evaluateArg(argNodes[1], getCellValue);
  const lambdaId = evaluate(argNodes[2], getCellValue);

  const flat = flattenForLambda(arrayVal);
  let accumulator = initial;
  for (const element of flat) {
    const val = invokeLambda(lambdaId, [accumulator, element]);
    if (isFormulaError(val)) return val;
    accumulator = val;
  }

  return accumulator;
}

/**
 * SCAN(initial_value, array, lambda)
 * Like REDUCE but returns intermediate accumulated values.
 */
function evaluateSCAN(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  if (argNodes.length !== 3) return "#VALUE!" as FormulaError;

  const initial = evaluate(argNodes[0], getCellValue);
  if (isFormulaError(initial)) return initial;

  const arrayVal = evaluateArg(argNodes[1], getCellValue);
  const lambdaId = evaluate(argNodes[2], getCellValue);

  const arr2D = to2DArray(arrayVal);
  const rows = arr2D.length;
  const cols = arr2D[0]?.length ?? 0;

  const result: FormulaValue[][] = [];
  let accumulator = initial;
  for (let r = 0; r < rows; r++) {
    const rowResult: FormulaValue[] = [];
    for (let c = 0; c < cols; c++) {
      const val = invokeLambda(lambdaId, [accumulator, arr2D[r][c]]);
      if (isFormulaError(val)) return val;
      accumulator = val;
      rowResult.push(accumulator);
    }
    result.push(rowResult);
  }

  if (result.length === 1 && result[0].length === 1) return result[0][0];
  return result as unknown as FormulaValue;
}

/**
 * MAKEARRAY(rows, cols, lambda)
 * Creates an array using a LAMBDA applied to each (row, col) index.
 */
function evaluateMAKEARRAY(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  if (argNodes.length !== 3) return "#VALUE!" as FormulaError;

  const rowsVal = evaluate(argNodes[0], getCellValue);
  const colsVal = evaluate(argNodes[1], getCellValue);
  const lambdaId = evaluate(argNodes[2], getCellValue);

  if (isFormulaError(rowsVal)) return rowsVal;
  if (isFormulaError(colsVal)) return colsVal;

  const numRows = typeof rowsVal === "number" ? Math.floor(rowsVal) : null;
  const numCols = typeof colsVal === "number" ? Math.floor(colsVal) : null;
  if (numRows === null || numCols === null || numRows < 1 || numCols < 1) {
    return "#VALUE!" as FormulaError;
  }

  const result: FormulaValue[][] = [];
  for (let r = 1; r <= numRows; r++) {
    const rowResult: FormulaValue[] = [];
    for (let c = 1; c <= numCols; c++) {
      const val = invokeLambda(lambdaId, [r, c]);
      if (isFormulaError(val)) return val;
      rowResult.push(val);
    }
    result.push(rowResult);
  }

  if (result.length === 1 && result[0].length === 1) return result[0][0];
  return result as unknown as FormulaValue;
}

/**
 * BYROW(array, lambda)
 * Applies LAMBDA to each row, returns a column of results.
 */
function evaluateBYROW(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  if (argNodes.length !== 2) return "#VALUE!" as FormulaError;

  const arrayVal = evaluateArg(argNodes[0], getCellValue);
  const lambdaId = evaluate(argNodes[1], getCellValue);

  const arr2D = to2DArray(arrayVal);
  const result: FormulaValue[][] = [];

  for (const row of arr2D) {
    const rowAsArray = [row] as unknown as FormulaValue;
    const val = invokeLambda(lambdaId, [rowAsArray]);
    if (isFormulaError(val)) return val;
    result.push([val]);
  }

  if (result.length === 1) return result[0][0];
  return result as unknown as FormulaValue;
}

/**
 * BYCOL(array, lambda)
 * Applies LAMBDA to each column, returns a row of results.
 */
function evaluateBYCOL(
  argNodes: ASTNode[],
  getCellValue: CellValueGetter,
): FormulaValue {
  if (argNodes.length !== 2) return "#VALUE!" as FormulaError;

  const arrayVal = evaluateArg(argNodes[0], getCellValue);
  const lambdaId = evaluate(argNodes[1], getCellValue);

  const arr2D = to2DArray(arrayVal);
  const cols = arr2D[0]?.length ?? 0;
  const rowResult: FormulaValue[] = [];

  for (let c = 0; c < cols; c++) {
    const colArray = arr2D.map((row) => [row[c]]) as unknown as FormulaValue;
    const val = invokeLambda(lambdaId, [colArray]);
    if (isFormulaError(val)) return val;
    rowResult.push(val);
  }

  if (rowResult.length === 1) return rowResult[0];
  return [rowResult] as unknown as FormulaValue;
}

/**
 * Flatten a FormulaValue (possibly 2D array) into a flat list for REDUCE.
 */
function flattenForLambda(val: FormulaValue): FormulaValue[] {
  if (Array.isArray(val)) {
    const result: FormulaValue[] = [];
    for (const item of val as unknown[]) {
      if (Array.isArray(item)) {
        result.push(...(item as FormulaValue[]));
      } else {
        result.push(item as FormulaValue);
      }
    }
    return result;
  }
  return [val];
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

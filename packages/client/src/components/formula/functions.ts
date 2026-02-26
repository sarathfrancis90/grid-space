/**
 * Formula function registry.
 * Maps function names to their implementations.
 * Uses @formulajs/formulajs where possible, with wrappers.
 */
import type { FormulaValue, FormulaError } from "../../types/formula";
import { isFormulaError } from "../../types/formula";

type FormulaFunction = (...args: FormulaValue[]) => FormulaValue;

/**
 * Flatten nested arrays and ranges into a flat array of values.
 */
function flattenArgs(args: FormulaValue[]): FormulaValue[] {
  const result: FormulaValue[] = [];
  for (const arg of args) {
    if (Array.isArray(arg)) {
      result.push(...flattenArgs(arg as FormulaValue[]));
    } else {
      result.push(arg);
    }
  }
  return result;
}

/**
 * Convert a value to a number. Returns null if not convertible.
 * Empty cells (null) → 0 in aggregate functions.
 */
function toNumber(
  val: FormulaValue,
  treatNullAsZero: boolean = true,
): number | null {
  if (val === null || val === "") {
    return treatNullAsZero ? 0 : null;
  }
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "string") {
    if (isFormulaError(val)) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  return null;
}

/**
 * Convert a value to boolean for logical functions.
 */
function toBool(val: FormulaValue): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (val === null) return false;
  if (typeof val === "string") {
    if (val.toUpperCase() === "TRUE") return true;
    if (val.toUpperCase() === "FALSE") return false;
  }
  return false;
}

// --- Math/Statistical functions ---

function fnSUM(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let sum = 0;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = toNumber(val);
    if (n !== null) sum += n;
  }
  return sum;
}

function fnAVERAGE(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let sum = 0;
  let count = 0;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = toNumber(val, false);
    if (n !== null) {
      sum += n;
      count++;
    }
  }
  if (count === 0) return "#DIV/0!" as FormulaError;
  return sum / count;
}

function fnCOUNT(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let count = 0;
  for (const val of flat) {
    if (typeof val === "number") count++;
    else if (typeof val === "string" && !isFormulaError(val) && val !== "") {
      const n = Number(val);
      if (!isNaN(n)) count++;
    }
  }
  return count;
}

function fnCOUNTA(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let count = 0;
  for (const val of flat) {
    if (val !== null && val !== "") count++;
  }
  return count;
}

function fnCOUNTBLANK(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let count = 0;
  for (const val of flat) {
    if (val === null || val === "") count++;
  }
  return count;
}

function fnMIN(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let min = Infinity;
  let found = false;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = toNumber(val, false);
    if (n !== null) {
      if (n < min) min = n;
      found = true;
    }
  }
  return found ? min : 0;
}

function fnMAX(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let max = -Infinity;
  let found = false;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = toNumber(val, false);
    if (n !== null) {
      if (n > max) max = n;
      found = true;
    }
  }
  return found ? max : 0;
}

// --- Logical functions ---

function fnIF(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2 || args.length > 3) return "#VALUE!" as FormulaError;
  const condition = toBool(args[0]);
  if (condition) return args[1];
  return args.length >= 3 ? args[2] : false;
}

function fnIFS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2 || args.length % 2 !== 0)
    return "#VALUE!" as FormulaError;
  for (let i = 0; i < args.length; i += 2) {
    if (toBool(args[i])) return args[i + 1];
  }
  return "#N/A" as FormulaError;
}

function fnSWITCH(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const expr = args[0];
  // SWITCH(expr, val1, result1, val2, result2, ..., [default])
  const hasDefault = args.length % 2 === 0;
  const pairCount = hasDefault ? (args.length - 2) / 2 : (args.length - 1) / 2;

  for (let i = 0; i < pairCount; i++) {
    const val = args[1 + i * 2];
    const result = args[2 + i * 2];
    if (compareValues(expr, val) === 0) return result;
  }

  if (hasDefault) return args[args.length - 1];
  return "#N/A" as FormulaError;
}

function fnAND(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  if (flat.length === 0) return "#VALUE!" as FormulaError;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    if (!toBool(val)) return false;
  }
  return true;
}

function fnOR(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  if (flat.length === 0) return "#VALUE!" as FormulaError;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    if (toBool(val)) return true;
  }
  return false;
}

function fnNOT(...args: FormulaValue[]): FormulaValue {
  if (args.length !== 1) return "#VALUE!" as FormulaError;
  if (isFormulaError(args[0])) return args[0];
  return !toBool(args[0]);
}

function fnXOR(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  if (flat.length === 0) return "#VALUE!" as FormulaError;
  let trueCount = 0;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    if (toBool(val)) trueCount++;
  }
  return trueCount % 2 === 1;
}

function fnIFERROR(...args: FormulaValue[]): FormulaValue {
  if (args.length !== 2) return "#VALUE!" as FormulaError;
  const value = args[0];
  if (isFormulaError(value)) return args[1];
  return value;
}

function fnIFNA(...args: FormulaValue[]): FormulaValue {
  if (args.length !== 2) return "#VALUE!" as FormulaError;
  const value = args[0];
  if (value === "#N/A") return args[1];
  return value;
}

// --- Comparison helper ---

function compareValues(a: FormulaValue, b: FormulaValue): number {
  // null/empty treated as 0 for numeric, "" for string
  const na = toNumber(a, false);
  const nb = toNumber(b, false);

  if (na !== null && nb !== null) {
    return na - nb;
  }

  // String comparison (case-insensitive per Google Sheets behavior)
  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

// --- Function registry ---

const FUNCTION_REGISTRY: Record<string, FormulaFunction> = {
  SUM: fnSUM,
  AVERAGE: fnAVERAGE,
  COUNT: fnCOUNT,
  COUNTA: fnCOUNTA,
  COUNTBLANK: fnCOUNTBLANK,
  MIN: fnMIN,
  MAX: fnMAX,
  IF: fnIF,
  IFS: fnIFS,
  SWITCH: fnSWITCH,
  AND: fnAND,
  OR: fnOR,
  NOT: fnNOT,
  XOR: fnXOR,
  IFERROR: fnIFERROR,
  IFNA: fnIFNA,
};

/**
 * Look up a function by name. Case-insensitive.
 * Returns null if the function is not registered.
 */
export function getFunction(name: string): FormulaFunction | null {
  return FUNCTION_REGISTRY[name.toUpperCase()] ?? null;
}

/**
 * Check if a function name is registered.
 */
export function hasFunction(name: string): boolean {
  return name.toUpperCase() in FUNCTION_REGISTRY;
}

/**
 * Get all registered function names.
 */
export function getFunctionNames(): string[] {
  return Object.keys(FUNCTION_REGISTRY);
}

export { compareValues };

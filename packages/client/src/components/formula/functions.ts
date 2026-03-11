/**
 * Formula function registry.
 * Merges core functions with all domain-specific function modules.
 */
import type { FormulaValue, FormulaError } from "../../types/formula";
import { isFormulaError } from "../../types/formula";
import { mathFunctions } from "./functions/mathFunctions";
import { textFunctions } from "./functions/textFunctions";
import { dateFunctions } from "./functions/dateFunctions";
import { lookupFunctions } from "./functions/lookupFunctions";
import { conditionalFunctions } from "./functions/conditionalFunctions";
import { statisticalFunctions } from "./functions/statisticalFunctions";
import { financialFunctions } from "./functions/financialFunctions";
import { infoFunctions } from "./functions/infoFunctions";
import { arrayFunctions } from "./functions/arrayFunctions";
import { regexFunctions } from "./functions/regexFunctions";
import { queryFunctions } from "./functions/queryFunctions";
import { databaseFunctions } from "./functions/databaseFunctions";

type FormulaFunction = (...args: FormulaValue[]) => FormulaValue;

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

function toNumber(
  val: FormulaValue,
  treatNullAsZero: boolean = true,
): number | null {
  if (val === null || val === "") return treatNullAsZero ? 0 : null;
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "string") {
    if (isFormulaError(val)) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  return null;
}

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

// --- Core aggregate/logical functions (Sprint 2 core) ---

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
      if (!isNaN(Number(val))) count++;
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

function fnIF(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2 || args.length > 3) return "#VALUE!" as FormulaError;
  if (toBool(args[0])) return args[1];
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
  const hasDefault = args.length % 2 === 0;
  const pairCount = hasDefault ? (args.length - 2) / 2 : (args.length - 1) / 2;
  for (let i = 0; i < pairCount; i++) {
    if (compareValues(expr, args[1 + i * 2]) === 0) return args[2 + i * 2];
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
  return isFormulaError(args[0]) ? args[1] : args[0];
}

function fnIFNA(...args: FormulaValue[]): FormulaValue {
  if (args.length !== 2) return "#VALUE!" as FormulaError;
  return args[0] === "#N/A" ? args[1] : args[0];
}

/** SPARKLINE — returns a metadata marker; rendering is handled by the grid.
 *
 * Usage: SPARKLINE(data, [options])
 *   data   — range or array of numeric values
 *   options — object with keys: charttype, color, linewidth, min, max, rtl, empty
 *
 * Chart types: "line" (default), "bar", "column", "winloss"
 */
function fnSPARKLINE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;

  // Extract numeric data from first argument (range/array)
  const rawData = args[0];
  const flat = flattenArgs([rawData]);
  const data: number[] = [];
  for (const v of flat) {
    const n = toNumber(v, false);
    if (n !== null) data.push(n);
  }

  if (data.length === 0) return "#VALUE!" as FormulaError;

  // Parse options from second argument (flattened key-value pairs from Google Sheets
  // array literal syntax: {"charttype","bar","color","red"} → ["charttype","bar","color","red"])
  const opts: Record<string, string | number> = {};
  if (args.length >= 2 && args[1] != null) {
    const optValues = flattenArgs([args[1]]);
    // Pairs: key, value, key, value, ...
    for (let i = 0; i + 1 < optValues.length; i += 2) {
      const key = String(optValues[i] ?? "").toLowerCase();
      const val = optValues[i + 1];
      if (key) {
        opts[key] = typeof val === "number" ? val : String(val ?? "");
      }
    }
  }

  const charttype = String(opts.charttype ?? "line");
  const validTypes = ["line", "bar", "column", "winloss"];
  const type = validTypes.includes(charttype) ? charttype : "line";

  const result: SparklineData = { data, type };
  if (opts.color !== undefined) result.color = String(opts.color);
  if (opts.linewidth !== undefined)
    result.linewidth = Number(opts.linewidth) || 1.5;
  if (opts.min !== undefined) result.min = Number(opts.min);
  if (opts.max !== undefined) result.max = Number(opts.max);
  if (opts.rtl !== undefined)
    result.rtl = opts.rtl === "true" || opts.rtl === 1;
  if (opts.empty !== undefined) result.empty = String(opts.empty);
  if (opts.nan !== undefined) result.nan = String(opts.nan);
  if (opts.highcolor !== undefined) result.highcolor = String(opts.highcolor);
  if (opts.lowcolor !== undefined) result.lowcolor = String(opts.lowcolor);
  if (opts.firstcolor !== undefined)
    result.firstcolor = String(opts.firstcolor);
  if (opts.lastcolor !== undefined) result.lastcolor = String(opts.lastcolor);
  if (opts.negcolor !== undefined) result.negcolor = String(opts.negcolor);

  return `__SPARKLINE__${JSON.stringify(result)}`;
}

/** Shape of serialized sparkline data passed to the renderer. */
interface SparklineData {
  data: number[];
  type: string;
  color?: string;
  linewidth?: number;
  min?: number;
  max?: number;
  rtl?: boolean;
  empty?: string;
  nan?: string;
  highcolor?: string;
  lowcolor?: string;
  firstcolor?: string;
  lastcolor?: string;
  negcolor?: string;
}

/**
 * IMPORTDATA(url) — fetch CSV from URL and parse into cell range.
 * Returns a metadata marker; actual fetch is handled by the grid/store layer.
 */
function fnIMPORTDATA(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const url = String(args[0] ?? "");
  if (!url) return "#VALUE!" as FormulaError;
  return `__IMPORTDATA__${url}`;
}

/**
 * IMPORTRANGE(spreadsheetId, rangeString) — pull data from another spreadsheet.
 * Returns a metadata marker; actual fetch is handled by the grid/store layer.
 */
function fnIMPORTRANGE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const spreadsheetId = String(args[0] ?? "");
  const rangeStr = String(args[1] ?? "");
  if (!spreadsheetId || !rangeStr) return "#VALUE!" as FormulaError;
  return `__IMPORTRANGE__${spreadsheetId}__${rangeStr}`;
}

/**
 * IMAGE(url, [mode], [height], [width]) — display image from URL in cell.
 * Returns a metadata marker; rendering is handled by the grid.
 */
function fnIMAGE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const url = String(args[0] ?? "");
  if (!url) return "#VALUE!" as FormulaError;
  const mode = args.length >= 2 ? toNumber(args[1]) : 1;
  const height = args.length >= 3 ? toNumber(args[2]) : null;
  const width = args.length >= 4 ? toNumber(args[3]) : null;
  return `__IMAGE__${JSON.stringify({ url, mode, height, width })}`;
}

function compareValues(a: FormulaValue, b: FormulaValue): number {
  const na = toNumber(a, false);
  const nb = toNumber(b, false);
  if (na !== null && nb !== null) return na - nb;
  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

// --- Special functions handled by evaluator (stubs for registry presence) ---

function fnARRAYFORMULA(...args: FormulaValue[]): FormulaValue {
  // Actual implementation is in evaluator.ts — this is a stub for the registry
  return args[0] ?? null;
}

function fnLET(...args: FormulaValue[]): FormulaValue {
  // Actual implementation is in evaluator.ts — this is a stub for the registry
  return args[args.length - 1] ?? null;
}

function fnLAMBDA(..._args: FormulaValue[]): FormulaValue {
  // Actual implementation is in evaluator.ts — this is a stub for the registry
  return "#VALUE!" as FormulaError;
}

// Stubs for LAMBDA helper functions — actual implementation is in evaluator.ts
function fnMAP(..._args: FormulaValue[]): FormulaValue {
  return "#VALUE!" as FormulaError;
}
function fnREDUCE(..._args: FormulaValue[]): FormulaValue {
  return "#VALUE!" as FormulaError;
}
function fnSCAN(..._args: FormulaValue[]): FormulaValue {
  return "#VALUE!" as FormulaError;
}
function fnMAKEARRAY(..._args: FormulaValue[]): FormulaValue {
  return "#VALUE!" as FormulaError;
}
function fnBYROW(..._args: FormulaValue[]): FormulaValue {
  return "#VALUE!" as FormulaError;
}
function fnBYCOL(..._args: FormulaValue[]): FormulaValue {
  return "#VALUE!" as FormulaError;
}

// --- Merged registry ---

const FUNCTION_REGISTRY: Record<string, FormulaFunction> = {
  // Core (Sprint 2 core)
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
  SPARKLINE: fnSPARKLINE,
  IMPORTDATA: fnIMPORTDATA,
  IMPORTRANGE: fnIMPORTRANGE,
  IMAGE: fnIMAGE,
  ARRAYFORMULA: fnARRAYFORMULA,
  LET: fnLET,
  LAMBDA: fnLAMBDA,
  __CALL__: fnLAMBDA, // stub — actual handling is in evaluator
  __ARRAY_LITERAL__: fnLAMBDA, // stub — actual handling is in evaluator
  MAP: fnMAP,
  REDUCE: fnREDUCE,
  SCAN: fnSCAN,
  MAKEARRAY: fnMAKEARRAY,
  BYROW: fnBYROW,
  BYCOL: fnBYCOL,
  // Domain modules
  ...mathFunctions,
  ...textFunctions,
  ...dateFunctions,
  ...lookupFunctions,
  ...conditionalFunctions,
  ...statisticalFunctions,
  ...financialFunctions,
  ...infoFunctions,
  ...arrayFunctions,
  ...regexFunctions,
  ...queryFunctions,
  ...databaseFunctions,
};

export function getFunction(name: string): FormulaFunction | null {
  return FUNCTION_REGISTRY[name.toUpperCase()] ?? null;
}

export function hasFunction(name: string): boolean {
  return name.toUpperCase() in FUNCTION_REGISTRY;
}

export function getFunctionNames(): string[] {
  return Object.keys(FUNCTION_REGISTRY);
}

export { compareValues };

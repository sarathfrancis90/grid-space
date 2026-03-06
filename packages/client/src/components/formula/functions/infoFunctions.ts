/**
 * Info functions: ISBLANK, ISERROR, ISNUMBER, ISTEXT, ISLOGICAL, TYPE,
 * ISEVEN, ISODD, ISNA, ISERR, ERROR.TYPE
 *
 * Note: ISREF, ISFORMULA, and CELL require AST-level info and are
 * handled as special cases in the evaluator.
 */
import type { FormulaValue, FormulaError } from "../../../types/formula";
import type { FormulaFunction } from "./helpers";
import { isFormulaError, requireNumber } from "./helpers";

function fnISBLANK(...args: FormulaValue[]): FormulaValue {
  return args[0] === null || args[0] === "";
}

function fnISERROR(...args: FormulaValue[]): FormulaValue {
  return isFormulaError(args[0]);
}

function fnISNUMBER(...args: FormulaValue[]): FormulaValue {
  return typeof args[0] === "number";
}

function fnISTEXT(...args: FormulaValue[]): FormulaValue {
  return typeof args[0] === "string" && !isFormulaError(args[0]);
}

function fnISLOGICAL(...args: FormulaValue[]): FormulaValue {
  return typeof args[0] === "boolean";
}

function fnTYPE(...args: FormulaValue[]): FormulaValue {
  const val = args[0];
  if (typeof val === "number") return 1;
  if (typeof val === "string") return isFormulaError(val) ? 16 : 2;
  if (typeof val === "boolean") return 4;
  if (val === null) return 1; // blank treated as number
  return 1;
}

function fnISEVEN(...args: FormulaValue[]): FormulaValue {
  const n = requireNumber(args[0]);
  if (typeof n === "string") return n; // error passthrough
  return Math.floor(n) % 2 === 0;
}

function fnISODD(...args: FormulaValue[]): FormulaValue {
  const n = requireNumber(args[0]);
  if (typeof n === "string") return n; // error passthrough
  return Math.floor(n) % 2 !== 0;
}

function fnISNA(...args: FormulaValue[]): FormulaValue {
  return args[0] === "#N/A";
}

function fnISERR(...args: FormulaValue[]): FormulaValue {
  return isFormulaError(args[0]) && args[0] !== "#N/A";
}

function fnERROR_TYPE(...args: FormulaValue[]): FormulaValue {
  const val = args[0];
  if (!isFormulaError(val)) return "#N/A" as FormulaError;
  const errorMap: Record<string, number> = {
    "#NULL!": 1,
    "#DIV/0!": 2,
    "#VALUE!": 3,
    "#REF!": 4,
    "#NAME?": 5,
    "#NUM!": 6,
    "#N/A": 7,
    "#SPILL!": 9,
  };
  return errorMap[val] ?? ("#N/A" as FormulaError);
}

export const infoFunctions: Record<string, FormulaFunction> = {
  ISBLANK: fnISBLANK,
  ISERROR: fnISERROR,
  ISNUMBER: fnISNUMBER,
  ISTEXT: fnISTEXT,
  ISLOGICAL: fnISLOGICAL,
  TYPE: fnTYPE,
  ISEVEN: fnISEVEN,
  ISODD: fnISODD,
  ISNA: fnISNA,
  ISERR: fnISERR,
  "ERROR.TYPE": fnERROR_TYPE,
};

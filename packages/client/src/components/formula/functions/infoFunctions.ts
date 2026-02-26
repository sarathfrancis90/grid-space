/**
 * Info functions: ISBLANK, ISERROR, ISNUMBER, ISTEXT, ISLOGICAL, TYPE
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction } from "./helpers";
import { isFormulaError } from "./helpers";

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

export const infoFunctions: Record<string, FormulaFunction> = {
  ISBLANK: fnISBLANK,
  ISERROR: fnISERROR,
  ISNUMBER: fnISNUMBER,
  ISTEXT: fnISTEXT,
  ISLOGICAL: fnISLOGICAL,
  TYPE: fnTYPE,
};

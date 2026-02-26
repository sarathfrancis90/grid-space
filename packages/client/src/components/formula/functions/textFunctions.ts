/**
 * Text functions: CONCATENATE, LEFT, RIGHT, MID, LEN, TRIM,
 * UPPER, LOWER, PROPER, SUBSTITUTE, FIND, SEARCH,
 * TEXT, VALUE, REPT, EXACT, CLEAN, CHAR, CODE
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import {
  requireNumber,
  requireString,
  flattenArgs,
  isFormulaError,
} from "./helpers";

function fnCONCATENATE(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  return flat.map((v) => String(v ?? "")).join("");
}

function fnLEFT(...args: FormulaValue[]): FormulaValue {
  const text = requireString(args[0]);
  const numChars = args.length > 1 ? requireNumber(args[1]) : 1;
  if (isFormulaError(numChars)) return numChars;
  return text.substring(0, numChars as number);
}

function fnRIGHT(...args: FormulaValue[]): FormulaValue {
  const text = requireString(args[0]);
  const numChars = args.length > 1 ? requireNumber(args[1]) : 1;
  if (isFormulaError(numChars)) return numChars;
  return text.substring(Math.max(0, text.length - (numChars as number)));
}

function fnMID(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const text = requireString(args[0]);
  const startPos = requireNumber(args[1]);
  if (isFormulaError(startPos)) return startPos;
  const numChars = requireNumber(args[2]);
  if (isFormulaError(numChars)) return numChars;
  if ((startPos as number) < 1) return "#VALUE!" as FormulaError;
  return text.substring(
    (startPos as number) - 1,
    (startPos as number) - 1 + (numChars as number),
  );
}

function fnLEN(...args: FormulaValue[]): FormulaValue {
  return requireString(args[0]).length;
}

function fnTRIM(...args: FormulaValue[]): FormulaValue {
  return requireString(args[0]).replace(/\s+/g, " ").trim();
}

function fnUPPER(...args: FormulaValue[]): FormulaValue {
  return requireString(args[0]).toUpperCase();
}

function fnLOWER(...args: FormulaValue[]): FormulaValue {
  return requireString(args[0]).toLowerCase();
}

function fnPROPER(...args: FormulaValue[]): FormulaValue {
  return requireString(args[0]).replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );
}

function fnSUBSTITUTE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const text = requireString(args[0]);
  const oldText = requireString(args[1]);
  const newText = requireString(args[2]);
  if (args.length >= 4) {
    const instance = requireNumber(args[3]);
    if (isFormulaError(instance)) return instance;
    let count = 0;
    return text.replace(new RegExp(escapeRegex(oldText), "g"), (match) => {
      count++;
      return count === (instance as number) ? newText : match;
    });
  }
  return text.split(oldText).join(newText);
}

function fnFIND(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const findText = requireString(args[0]);
  const withinText = requireString(args[1]);
  const startPos = args.length > 2 ? requireNumber(args[2]) : 1;
  if (isFormulaError(startPos)) return startPos;
  // FIND is case-sensitive
  const idx = withinText.indexOf(findText, (startPos as number) - 1);
  if (idx === -1) return "#VALUE!" as FormulaError;
  return idx + 1; // 1-based
}

function fnSEARCH(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const findText = requireString(args[0]);
  const withinText = requireString(args[1]);
  const startPos = args.length > 2 ? requireNumber(args[2]) : 1;
  if (isFormulaError(startPos)) return startPos;
  // SEARCH is case-insensitive and supports wildcards
  const regex = findText
    .toLowerCase()
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const match = withinText
    .toLowerCase()
    .substring((startPos as number) - 1)
    .match(new RegExp(regex));
  if (!match || match.index === undefined) return "#VALUE!" as FormulaError;
  return match.index + (startPos as number); // 1-based
}

function fnTEXT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const format = requireString(args[1]);
  // Simple format patterns
  if (format === "0") return String(Math.round(num as number));
  if (format === "0.00") return (num as number).toFixed(2);
  if (format === "0.0") return (num as number).toFixed(1);
  if (format === "#,##0")
    return Math.round(num as number).toLocaleString("en-US");
  if (format === "#,##0.00")
    return (num as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (format === "0%") return Math.round((num as number) * 100) + "%";
  if (format === "0.00%") return ((num as number) * 100).toFixed(2) + "%";
  return String(num);
}

function fnVALUE(...args: FormulaValue[]): FormulaValue {
  const str = requireString(args[0]);
  const cleaned = str.replace(/[$,]/g, "");
  const n = Number(cleaned);
  if (isNaN(n)) return "#VALUE!" as FormulaError;
  return n;
}

function fnREPT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const text = requireString(args[0]);
  const times = requireNumber(args[1]);
  if (isFormulaError(times)) return times;
  if ((times as number) < 0) return "#VALUE!" as FormulaError;
  return text.repeat(Math.floor(times as number));
}

function fnEXACT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  return requireString(args[0]) === requireString(args[1]);
}

function fnCLEAN(...args: FormulaValue[]): FormulaValue {
  // Remove non-printable characters (ASCII 0-31)
  return requireString(args[0]).replace(/[\x00-\x1F]/g, "");
}

function fnCHAR(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return String.fromCharCode(num as number);
}

function fnCODE(...args: FormulaValue[]): FormulaValue {
  const text = requireString(args[0]);
  if (text.length === 0) return "#VALUE!" as FormulaError;
  return text.charCodeAt(0);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const textFunctions: Record<string, FormulaFunction> = {
  CONCATENATE: fnCONCATENATE,
  LEFT: fnLEFT,
  RIGHT: fnRIGHT,
  MID: fnMID,
  LEN: fnLEN,
  TRIM: fnTRIM,
  UPPER: fnUPPER,
  LOWER: fnLOWER,
  PROPER: fnPROPER,
  SUBSTITUTE: fnSUBSTITUTE,
  FIND: fnFIND,
  SEARCH: fnSEARCH,
  TEXT: fnTEXT,
  VALUE: fnVALUE,
  REPT: fnREPT,
  EXACT: fnEXACT,
  CLEAN: fnCLEAN,
  CHAR: fnCHAR,
  CODE: fnCODE,
};

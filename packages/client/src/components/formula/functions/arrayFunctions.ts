/**
 * Array functions: SORT, FILTER, UNIQUE, TRANSPOSE
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import {
  flattenArgs,
  is2DArray,
  requireNumber,
  isFormulaError,
} from "./helpers";

function fnSORT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  if (is2DArray(args[0])) {
    const data = (args[0] as unknown as FormulaValue[][]).map((row) => [
      ...row,
    ]);
    const colIdx = args.length > 1 ? requireNumber(args[1]) : 1;
    if (isFormulaError(colIdx)) return colIdx;
    const ascending =
      args.length > 2 ? args[2] !== false && args[2] !== 0 : true;
    const col = (colIdx as number) - 1;
    data.sort((a, b) => {
      const va = a[col] ?? null;
      const vb = b[col] ?? null;
      const na = typeof va === "number" ? va : NaN;
      const nb = typeof vb === "number" ? vb : NaN;
      if (!isNaN(na) && !isNaN(nb)) return ascending ? na - nb : nb - na;
      const sa = String(va ?? "");
      const sb = String(vb ?? "");
      return ascending ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return data as unknown as FormulaValue;
  }
  // Flat array
  const flat = flattenArgs([args[0]]);
  const ascending = args.length > 2 ? args[2] !== false && args[2] !== 0 : true;
  flat.sort((a, b) => {
    const na = typeof a === "number" ? a : NaN;
    const nb = typeof b === "number" ? b : NaN;
    if (!isNaN(na) && !isNaN(nb)) return ascending ? na - nb : nb - na;
    return ascending
      ? String(a ?? "").localeCompare(String(b ?? ""))
      : String(b ?? "").localeCompare(String(a ?? ""));
  });
  return flat as unknown as FormulaValue;
}

function fnFILTER(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  if (is2DArray(args[0])) {
    const data = args[0] as unknown as FormulaValue[][];
    const include = flattenArgs([args[1]]);
    const result = data.filter(
      (_, i) =>
        i < include.length &&
        include[i] !== false &&
        include[i] !== 0 &&
        include[i] !== null,
    );
    if (result.length === 0) {
      return args.length > 2 ? args[2] : ("#N/A" as FormulaError);
    }
    return result as unknown as FormulaValue;
  }
  const flat = flattenArgs([args[0]]);
  const include = flattenArgs([args[1]]);
  const result = flat.filter(
    (_, i) =>
      i < include.length &&
      include[i] !== false &&
      include[i] !== 0 &&
      include[i] !== null,
  );
  if (result.length === 0) {
    return args.length > 2 ? args[2] : ("#N/A" as FormulaError);
  }
  return result as unknown as FormulaValue;
}

function fnUNIQUE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const flat = flattenArgs([args[0]]);
  const seen = new Set<string>();
  const result: FormulaValue[] = [];
  for (const val of flat) {
    const key = String(val);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(val);
    }
  }
  return result as unknown as FormulaValue;
}

function fnTRANSPOSE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  if (is2DArray(args[0])) {
    const data = args[0] as unknown as FormulaValue[][];
    const rows = data.length;
    const cols = data[0]?.length ?? 0;
    const result: FormulaValue[][] = [];
    for (let c = 0; c < cols; c++) {
      const row: FormulaValue[] = [];
      for (let r = 0; r < rows; r++) {
        row.push(data[r][c] ?? null);
      }
      result.push(row);
    }
    return result as unknown as FormulaValue;
  }
  // Single row/column — just return as-is
  return args[0];
}

export const arrayFunctions: Record<string, FormulaFunction> = {
  SORT: fnSORT,
  FILTER: fnFILTER,
  UNIQUE: fnUNIQUE,
  TRANSPOSE: fnTRANSPOSE,
};

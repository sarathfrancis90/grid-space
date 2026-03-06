/**
 * Database functions: DSUM, DAVERAGE, DCOUNT, DCOUNTA, DGET, DMAX, DMIN,
 * DPRODUCT, DSTDEV, DSTDEVP, DVAR, DVARP
 *
 * All share the (database, field, criteria) signature.
 * - database: a 2D range where the first row contains column headers
 * - field: column label (string) or 1-based column index (number)
 * - criteria: a 2D range where the first row has header names and
 *   subsequent rows contain conditions (rows are OR'd, columns are AND'd)
 */
import type { FormulaValue, FormulaError } from "../../../types/formula";
import type { FormulaFunction } from "./helpers";
import { toNumber, matchesCriteria, is2DArray } from "./helpers";

/**
 * Convert a FormulaValue to a 2D array. If already 2D, return as-is.
 * If 1D, wrap as single row. If scalar, wrap as [[val]].
 */
function to2DArray(val: FormulaValue): FormulaValue[][] {
  if (is2DArray(val)) {
    return val as unknown as FormulaValue[][];
  }
  if (Array.isArray(val)) {
    return [val as FormulaValue[]];
  }
  return [[val]];
}

/**
 * Resolve the field parameter to a 0-based column index.
 * field can be a column label string (matched against header row)
 * or a 1-based column index number.
 */
function resolveFieldIndex(
  headers: FormulaValue[],
  field: FormulaValue,
): number | null {
  if (typeof field === "number") {
    const idx = field - 1;
    if (idx < 0 || idx >= headers.length) return null;
    return idx;
  }
  if (typeof field === "string") {
    const lower = field.toLowerCase();
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i] ?? "").toLowerCase() === lower) return i;
    }
  }
  const n = toNumber(field, false);
  if (n !== null) {
    const idx = n - 1;
    if (idx < 0 || idx >= headers.length) return null;
    return idx;
  }
  return null;
}

/**
 * Check if a database row matches the criteria range.
 * Criteria rows are OR'd — if any criteria row matches, the database row matches.
 * Within a criteria row, all non-empty conditions are AND'd.
 */
function rowMatchesCriteria(
  dbHeaders: FormulaValue[],
  dbRow: FormulaValue[],
  criteriaHeaders: FormulaValue[],
  criteriaRows: FormulaValue[][],
): boolean {
  if (criteriaRows.length === 0) return true;

  for (const critRow of criteriaRows) {
    let allMatch = true;
    for (let c = 0; c < criteriaHeaders.length; c++) {
      const critValue = critRow[c];
      if (critValue === null || critValue === "" || critValue === undefined)
        continue;

      const colIdx = resolveFieldIndex(dbHeaders, criteriaHeaders[c]);
      if (colIdx === null) {
        allMatch = false;
        break;
      }
      const cellValue = dbRow[colIdx] ?? null;
      if (!matchesCriteria(cellValue, critValue)) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

/**
 * Extract matching field values from the database that satisfy criteria.
 * Returns null on argument errors (triggers #VALUE!).
 */
function getMatchingValues(
  args: FormulaValue[],
): FormulaValue[] | FormulaError {
  if (args.length < 3) return "#VALUE!";

  const database = to2DArray(args[0]);
  const field = args[1];
  const criteria = to2DArray(args[2]);

  if (database.length < 2) return "#VALUE!";
  if (criteria.length < 1) return "#VALUE!";

  const dbHeaders = database[0];
  const fieldIdx = resolveFieldIndex(dbHeaders, field);
  if (fieldIdx === null) return "#VALUE!";

  const criteriaHeaders = criteria[0];
  const criteriaRows = criteria.slice(1);

  const values: FormulaValue[] = [];
  for (let r = 1; r < database.length; r++) {
    if (
      rowMatchesCriteria(dbHeaders, database[r], criteriaHeaders, criteriaRows)
    ) {
      values.push(database[r][fieldIdx] ?? null);
    }
  }
  return values;
}

function fnDSUM(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  let sum = 0;
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) sum += n;
  }
  return sum;
}

function fnDAVERAGE(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  let sum = 0;
  let count = 0;
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) {
      sum += n;
      count++;
    }
  }
  if (count === 0) return "#DIV/0!" as FormulaError;
  return sum / count;
}

function fnDCOUNT(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  let count = 0;
  for (const v of result) {
    if (typeof v === "number") {
      count++;
    } else if (typeof v === "string" && v !== "") {
      if (!isNaN(Number(v))) count++;
    }
  }
  return count;
}

function fnDCOUNTA(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  let count = 0;
  for (const v of result) {
    if (v !== null && v !== "") count++;
  }
  return count;
}

function fnDGET(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  if (result.length === 0) return "#VALUE!" as FormulaError;
  if (result.length > 1) return "#NUM!" as FormulaError;
  return result[0];
}

function fnDMAX(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  let max = -Infinity;
  let found = false;
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) {
      if (n > max) max = n;
      found = true;
    }
  }
  return found ? max : 0;
}

function fnDMIN(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  let min = Infinity;
  let found = false;
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) {
      if (n < min) min = n;
      found = true;
    }
  }
  return found ? min : 0;
}

function fnDPRODUCT(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  let product = 1;
  let found = false;
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) {
      product *= n;
      found = true;
    }
  }
  return found ? product : 0;
}

function fnDSTDEV(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  const nums: number[] = [];
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) nums.push(n);
  }
  if (nums.length < 2) return "#DIV/0!" as FormulaError;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance =
    nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function fnDSTDEVP(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  const nums: number[] = [];
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) nums.push(n);
  }
  if (nums.length === 0) return "#DIV/0!" as FormulaError;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance =
    nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function fnDVAR(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  const nums: number[] = [];
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) nums.push(n);
  }
  if (nums.length < 2) return "#DIV/0!" as FormulaError;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  return nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / (nums.length - 1);
}

function fnDVARP(...args: FormulaValue[]): FormulaValue {
  const result = getMatchingValues(args);
  if (typeof result === "string") return result;
  const nums: number[] = [];
  for (const v of result) {
    const n = toNumber(v, false);
    if (n !== null) nums.push(n);
  }
  if (nums.length === 0) return "#DIV/0!" as FormulaError;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  return nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
}

export const databaseFunctions: Record<string, FormulaFunction> = {
  DSUM: fnDSUM,
  DAVERAGE: fnDAVERAGE,
  DCOUNT: fnDCOUNT,
  DCOUNTA: fnDCOUNTA,
  DGET: fnDGET,
  DMAX: fnDMAX,
  DMIN: fnDMIN,
  DPRODUCT: fnDPRODUCT,
  DSTDEV: fnDSTDEV,
  DSTDEVP: fnDSTDEVP,
  DVAR: fnDVAR,
  DVARP: fnDVARP,
};

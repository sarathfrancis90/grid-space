/**
 * Shared helper functions used across all formula function domains.
 */
import type { FormulaValue, FormulaError } from "../../../types/formula";
import { isFormulaError } from "../../../types/formula";

export type FormulaFunction = (...args: FormulaValue[]) => FormulaValue;

/**
 * Flatten nested arrays (from range expansion) into a flat array.
 */
export function flattenArgs(args: FormulaValue[]): FormulaValue[] {
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
 */
export function toNumber(
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
 * Require a number from a FormulaValue — return #VALUE! if not numeric.
 */
export function requireNumber(val: FormulaValue): number | FormulaError {
  if (isFormulaError(val)) return val;
  const n = toNumber(val, true);
  if (n === null) return "#VALUE!";
  return n;
}

/**
 * Require a string from a FormulaValue.
 */
export function requireString(val: FormulaValue): string {
  if (val === null) return "";
  return String(val);
}

/**
 * Convert a value to boolean for logical functions.
 */
export function toBool(val: FormulaValue): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (val === null) return false;
  if (typeof val === "string") {
    if (val.toUpperCase() === "TRUE") return true;
    if (val.toUpperCase() === "FALSE") return false;
  }
  return false;
}

/**
 * Compare two formula values. Returns negative/0/positive.
 * String comparison is case-insensitive per Google Sheets.
 */
export function compareValues(a: FormulaValue, b: FormulaValue): number {
  const na = toNumber(a, false);
  const nb = toNumber(b, false);

  if (na !== null && nb !== null) {
    return na - nb;
  }

  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

/**
 * Check if a value is a 2D array (from range expansion).
 */
export function is2DArray(
  val: FormulaValue,
): val is FormulaValue[][] & FormulaValue {
  return Array.isArray(val) && val.length > 0 && Array.isArray(val[0]);
}

/**
 * Get the number of rows/cols in a 2D range array.
 */
export function rangeShape(
  val: FormulaValue,
): { rows: number; cols: number } | null {
  if (!is2DArray(val)) return null;
  const arr = val as unknown as FormulaValue[][];
  return { rows: arr.length, cols: arr[0]?.length ?? 0 };
}

/**
 * Match a criteria string against a value (for SUMIF, COUNTIF, etc.).
 * Supports: exact match, ">5", ">=5", "<5", "<=5", "<>5", wildcards "*", "?"
 */
export function matchesCriteria(
  value: FormulaValue,
  criteria: FormulaValue,
): boolean {
  if (criteria === null) return value === null || value === "";
  const critStr = String(criteria);

  // Comparison operators
  const compMatch = critStr.match(/^(<>|>=|<=|>|<|=)(.+)$/);
  if (compMatch) {
    const op = compMatch[1];
    const threshold = compMatch[2];
    const numThreshold = Number(threshold);
    const numValue = toNumber(value, false);

    if (!isNaN(numThreshold) && numValue !== null) {
      switch (op) {
        case ">":
          return numValue > numThreshold;
        case "<":
          return numValue < numThreshold;
        case ">=":
          return numValue >= numThreshold;
        case "<=":
          return numValue <= numThreshold;
        case "<>":
          return numValue !== numThreshold;
        case "=":
          return numValue === numThreshold;
      }
    }
    // String comparison for <> and =
    const sv = String(value ?? "").toLowerCase();
    const st = threshold.toLowerCase();
    switch (op) {
      case "<>":
        return sv !== st;
      case "=":
        return sv === st;
      default:
        return false;
    }
  }

  // Wildcard matching (* and ?)
  if (critStr.includes("*") || critStr.includes("?")) {
    const regex = critStr
      .toLowerCase()
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${regex}$`).test(String(value ?? "").toLowerCase());
  }

  // Exact match (case-insensitive for strings, numeric comparison for numbers)
  const numCriteria = Number(critStr);
  const numVal = toNumber(value, false);
  if (!isNaN(numCriteria) && numVal !== null) {
    return numVal === numCriteria;
  }

  return String(value ?? "").toLowerCase() === critStr.toLowerCase();
}

export { isFormulaError };
export type { FormulaError };

/**
 * Smart Fill — advanced pattern inference for adjacent-column auto-fill.
 *
 * Detects patterns beyond basic arithmetic sequences:
 * - Date sequences (daily, weekly, monthly, yearly)
 * - Text+number patterns ("Item1", "Item2", "Item3")
 * - Geometric sequences (2, 4, 8, 16)
 * - Prefix/suffix text patterns ("Q1 2024", "Q2 2024")
 * - Day/month name sequences ("Mon", "Tue", "Wed")
 * - Repeated cycle patterns ("A", "B", "C", "A", "B", "C")
 */

import type { CellData, CellPosition } from "../types/grid";

/** Pattern types that smart fill can detect */
export type SmartFillPatternType =
  | "arithmetic"
  | "geometric"
  | "date-sequence"
  | "text-number"
  | "day-names"
  | "month-names"
  | "prefix-number"
  | "number-suffix"
  | "repeat-cycle"
  | "constant"
  | "unknown";

export interface SmartFillPattern {
  type: SmartFillPatternType;
  confidence: number; // 0-1 score
  description: string;
}

export interface SmartFillSuggestion {
  /** Target cells to fill */
  cells: Array<{ row: number; col: number; value: string | number }>;
  /** The detected pattern */
  pattern: SmartFillPattern;
}

const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function findInCycle(value: string, list: string[]): number {
  const lower = value.toLowerCase();
  return list.findIndex((item) => item.toLowerCase() === lower);
}

function matchesCyclicList(values: string[], list: string[]): boolean {
  if (values.length < 2) return false;
  const startIdx = findInCycle(values[0], list);
  if (startIdx === -1) return false;
  for (let i = 1; i < values.length; i++) {
    const expectedIdx = (startIdx + i) % list.length;
    if (findInCycle(values[i], list) !== expectedIdx) return false;
  }
  return true;
}

function generateCyclicValues(
  values: string[],
  list: string[],
  count: number,
): string[] {
  const startIdx = findInCycle(values[0], list);
  const result: string[] = [];
  // Preserve original casing style (full vs abbreviated)
  const useOriginalCase = values[0].length > 3;
  for (let i = 0; i < count; i++) {
    const idx = (startIdx + values.length + i) % list.length;
    const val = list[idx];
    if (useOriginalCase) {
      result.push(val);
    } else {
      // Match casing of first value
      if (values[0] === values[0].toUpperCase()) {
        result.push(val.toUpperCase());
      } else if (values[0] === values[0].toLowerCase()) {
        result.push(val.toLowerCase());
      } else {
        result.push(val);
      }
    }
  }
  return result;
}

/** Extract text prefix and numeric suffix from a string like "Item3" */
function parseTextNumber(
  value: string,
): { prefix: string; num: number } | null {
  const match = value.match(/^(.+?)(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], num: parseInt(match[2], 10) };
}

/** Extract numeric prefix and text suffix from a string like "1st" */
function parseNumberSuffix(
  value: string,
): { num: number; suffix: string } | null {
  // Suffix must contain at least one non-digit character
  const match = value.match(/^(\d+)(\D.*)$/);
  if (!match) return null;
  return { num: parseInt(match[1], 10), suffix: match[2] };
}

/** Try to parse a date string */
function parseDate(value: string): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  // Try MM/DD/YYYY
  const parts = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const year =
      parts[3].length === 2
        ? 2000 + parseInt(parts[3], 10)
        : parseInt(parts[3], 10);
    return new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return null;
}

/** Detect date sequence step in days */
function detectDateStep(dates: Date[]): number | null {
  if (dates.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24),
    );
    diffs.push(diff);
  }
  // Check if all diffs are equal
  const firstDiff = diffs[0];
  if (diffs.every((d) => d === firstDiff) && firstDiff !== 0) {
    return firstDiff;
  }
  return null;
}

/**
 * Detect the pattern in a list of cell values.
 * Returns the detected pattern with confidence score.
 */
export function detectSmartPattern(values: CellData[]): SmartFillPattern {
  const nonNull = values.filter((v) => v.value != null);
  if (nonNull.length === 0) {
    return { type: "unknown", confidence: 0, description: "No data" };
  }

  const strValues = nonNull.map((v) => String(v.value));

  // 1. Check day names
  if (matchesCyclicList(strValues, DAY_NAMES_FULL)) {
    return {
      type: "day-names",
      confidence: 1,
      description: "Day name sequence",
    };
  }
  if (matchesCyclicList(strValues, DAY_NAMES_SHORT)) {
    return {
      type: "day-names",
      confidence: 1,
      description: "Abbreviated day name sequence",
    };
  }

  // 2. Check month names
  if (matchesCyclicList(strValues, MONTH_NAMES_FULL)) {
    return {
      type: "month-names",
      confidence: 1,
      description: "Month name sequence",
    };
  }
  if (matchesCyclicList(strValues, MONTH_NAMES_SHORT)) {
    return {
      type: "month-names",
      confidence: 1,
      description: "Abbreviated month name sequence",
    };
  }

  // 3. Check date sequences (before numeric, since "2024-01-01" parses as number)
  const dates = strValues.map(parseDate);
  if (dates.every((d): d is Date => d !== null) && dates.length >= 2) {
    // Only treat as date if values contain date separators (not plain numbers)
    const looksLikeDate = strValues.every(
      (v) => /[-/]/.test(v) && /\d/.test(v),
    );
    if (looksLikeDate) {
      const step = detectDateStep(dates);
      if (step !== null) {
        let desc = `Date sequence (every ${step} days)`;
        if (step === 1) desc = "Daily date sequence";
        else if (step === 7) desc = "Weekly date sequence";
        else if (step >= 28 && step <= 31) desc = "Monthly date sequence";
        else if (step >= 365 && step <= 366) desc = "Yearly date sequence";
        return { type: "date-sequence", confidence: 0.95, description: desc };
      }
    }
  }

  // 4. Check text+number patterns ("Item1", "Item2", "Item3")
  const textNums = strValues.map(parseTextNumber);
  if (textNums.every((t): t is { prefix: string; num: number } => t !== null)) {
    const prefix = textNums[0].prefix;
    if (textNums.every((t) => t!.prefix === prefix) && textNums.length >= 2) {
      const numStep = textNums[1].num - textNums[0].num;
      let isSequential = true;
      for (let i = 2; i < textNums.length; i++) {
        if (textNums[i].num - textNums[i - 1].num !== numStep) {
          isSequential = false;
          break;
        }
      }
      if (isSequential) {
        return {
          type: "text-number",
          confidence: 0.9,
          description: `"${prefix}" + number sequence`,
        };
      }
    }
  }

  // 5. Check number+suffix patterns ("1st", "2nd", "3rd") — before numeric check
  const numSuffixes = strValues.map(parseNumberSuffix);
  if (
    numSuffixes.every((t): t is { num: number; suffix: string } => t !== null)
  ) {
    if (numSuffixes.length >= 2) {
      const numStep = numSuffixes[1].num - numSuffixes[0].num;
      let isSequential = true;
      for (let i = 2; i < numSuffixes.length; i++) {
        if (numSuffixes[i].num - numSuffixes[i - 1].num !== numStep) {
          isSequential = false;
          break;
        }
      }
      if (isSequential) {
        return {
          type: "number-suffix",
          confidence: 0.85,
          description: `Number + "${numSuffixes[0].suffix}" sequence`,
        };
      }
    }
  }

  // 6. Check numeric patterns (arithmetic, geometric)
  // Only consider values that are purely numeric (not parseable prefixes like "1st")
  const nums: number[] = [];
  let allNumeric = true;
  for (const v of nonNull) {
    if (typeof v.value === "number") {
      nums.push(v.value);
    } else if (
      typeof v.value === "string" &&
      v.value.trim() !== "" &&
      String(Number(v.value)) === v.value.trim()
    ) {
      nums.push(Number(v.value));
    } else {
      allNumeric = false;
      break;
    }
  }

  if (allNumeric && nums.length >= 2) {
    // Check arithmetic
    const step = nums[1] - nums[0];
    let isArithmetic = true;
    for (let i = 2; i < nums.length; i++) {
      if (Math.abs(nums[i] - nums[i - 1] - step) > 1e-10) {
        isArithmetic = false;
        break;
      }
    }
    if (isArithmetic) {
      return {
        type: "arithmetic",
        confidence: 1,
        description: `Arithmetic sequence (step: ${step})`,
      };
    }

    // Check geometric
    if (nums[0] !== 0) {
      const ratio = nums[1] / nums[0];
      let isGeometric = ratio !== 0 && ratio !== 1;
      for (let i = 2; i < nums.length; i++) {
        if (
          nums[i - 1] === 0 ||
          Math.abs(nums[i] / nums[i - 1] - ratio) > 1e-10
        ) {
          isGeometric = false;
          break;
        }
      }
      if (isGeometric) {
        return {
          type: "geometric",
          confidence: 0.95,
          description: `Geometric sequence (ratio: ${ratio})`,
        };
      }
    }
  }

  // 7. Check constant (all same value)
  if (strValues.every((v) => v === strValues[0])) {
    return {
      type: "constant",
      confidence: 1,
      description: `Constant value: "${strValues[0]}"`,
    };
  }

  // 8. Check repeat cycle
  if (strValues.length >= 4) {
    for (
      let cycleLen = 2;
      cycleLen <= Math.floor(strValues.length / 2);
      cycleLen++
    ) {
      let isCycle = true;
      for (let i = cycleLen; i < strValues.length; i++) {
        if (strValues[i] !== strValues[i % cycleLen]) {
          isCycle = false;
          break;
        }
      }
      if (isCycle) {
        return {
          type: "repeat-cycle",
          confidence: 0.8,
          description: `Repeating cycle of ${cycleLen} values`,
        };
      }
    }
  }

  return { type: "unknown", confidence: 0, description: "No pattern detected" };
}

/**
 * Generate fill values for a detected pattern.
 */
export function generateSmartFillValues(
  sourceValues: CellData[],
  count: number,
): Array<string | number> {
  if (sourceValues.length === 0 || count === 0) return [];

  const pattern = detectSmartPattern(sourceValues);
  const strValues = sourceValues
    .filter((v) => v.value != null)
    .map((v) => String(v.value));
  const len = strValues.length;

  switch (pattern.type) {
    case "day-names": {
      const list = strValues[0].length > 3 ? DAY_NAMES_FULL : DAY_NAMES_SHORT;
      return generateCyclicValues(strValues, list, count);
    }
    case "month-names": {
      const list =
        strValues[0].length > 3 ? MONTH_NAMES_FULL : MONTH_NAMES_SHORT;
      return generateCyclicValues(strValues, list, count);
    }
    case "arithmetic": {
      const nums = sourceValues
        .filter((v) => v.value != null)
        .map((v) =>
          typeof v.value === "number" ? v.value : parseFloat(String(v.value)),
        );
      const step = nums[1] - nums[0];
      const lastVal = nums[nums.length - 1];
      return Array.from({ length: count }, (_, i) => lastVal + step * (i + 1));
    }
    case "geometric": {
      const nums = sourceValues
        .filter((v) => v.value != null)
        .map((v) =>
          typeof v.value === "number" ? v.value : parseFloat(String(v.value)),
        );
      const ratio = nums[1] / nums[0];
      let lastVal = nums[nums.length - 1];
      return Array.from({ length: count }, (_, _i) => {
        lastVal = lastVal * ratio;
        return lastVal;
      });
    }
    case "date-sequence": {
      const dates = strValues
        .map(parseDate)
        .filter((d): d is Date => d !== null);
      const step = detectDateStep(dates);
      if (!step) return [];
      const lastDate = dates[dates.length - 1];
      // Detect format from original values
      const usesSlash = strValues[0].includes("/");
      return Array.from({ length: count }, (_, i) => {
        const d = new Date(lastDate.getTime() + (i + 1) * step * 86400000);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return usesSlash
          ? `${month}/${day}/${year}`
          : `${year}-${month}-${day}`;
      });
    }
    case "text-number": {
      const textNums = strValues.map(parseTextNumber);
      const prefix = textNums[0]!.prefix;
      const step =
        textNums.length >= 2 ? textNums[1]!.num - textNums[0]!.num : 1;
      const lastNum = textNums[textNums.length - 1]!.num;
      return Array.from(
        { length: count },
        (_, i) => `${prefix}${lastNum + step * (i + 1)}`,
      );
    }
    case "number-suffix": {
      const numSuffixes = strValues.map(parseNumberSuffix);
      const step =
        numSuffixes.length >= 2 ? numSuffixes[1]!.num - numSuffixes[0]!.num : 1;
      const lastNum = numSuffixes[numSuffixes.length - 1]!.num;
      return Array.from({ length: count }, (_, i) => {
        const n = lastNum + step * (i + 1);
        // Determine suffix (ordinal for English)
        const suffix = getOrdinalSuffix(n, numSuffixes[0]!.suffix);
        return `${n}${suffix}`;
      });
    }
    case "constant":
      return Array.from({ length: count }, () => strValues[0]);
    case "repeat-cycle": {
      // Find the cycle length
      for (let cycleLen = 2; cycleLen <= Math.floor(len / 2); cycleLen++) {
        let isCycle = true;
        for (let i = cycleLen; i < len; i++) {
          if (strValues[i] !== strValues[i % cycleLen]) {
            isCycle = false;
            break;
          }
        }
        if (isCycle) {
          return Array.from(
            { length: count },
            (_, i) => strValues[(len + i) % cycleLen],
          );
        }
      }
      // Fallback: repeat all
      return Array.from({ length: count }, (_, i) => strValues[i % len]);
    }
    default:
      // Unknown: just repeat
      return Array.from({ length: count }, (_, i) => strValues[i % len]);
  }
}

function getOrdinalSuffix(n: number, originalSuffix: string): string {
  // If all examples use the same suffix (like "st", "nd", "rd", "th"), use ordinal logic
  const ordinalSuffixes = ["st", "nd", "rd", "th"];
  if (ordinalSuffixes.includes(originalSuffix.toLowerCase())) {
    const abs = Math.abs(n) % 100;
    if (abs >= 11 && abs <= 13) return "th";
    const lastDigit = abs % 10;
    if (lastDigit === 1) return "st";
    if (lastDigit === 2) return "nd";
    if (lastDigit === 3) return "rd";
    return "th";
  }
  return originalSuffix;
}

/**
 * Analyze a column range and produce a SmartFillSuggestion for the target range.
 *
 * @param sourceValues - The existing cell values (the pattern source)
 * @param sourceStart - The starting position of source data
 * @param targetStart - Where to start filling
 * @param targetCount - How many rows/cols to fill
 * @param direction - Fill direction
 */
export function generateSmartFillSuggestion(
  sourceValues: CellData[],
  _sourceStart: CellPosition,
  targetStart: CellPosition,
  targetCount: number,
  direction: "down" | "right",
): SmartFillSuggestion | null {
  const pattern = detectSmartPattern(sourceValues);
  if (pattern.type === "unknown") return null;

  const generated = generateSmartFillValues(sourceValues, targetCount);
  if (generated.length === 0) return null;

  const cells = generated.map((value, i) => ({
    row: direction === "down" ? targetStart.row + i : targetStart.row,
    col: direction === "right" ? targetStart.col + i : targetStart.col,
    value,
  }));

  return { cells, pattern };
}

import type { CellData } from "../types/grid";

interface FillPattern {
  type: "repeat" | "arithmetic" | "unknown";
  startValue: number;
  step: number;
}

export function detectPattern(values: CellData[]): FillPattern {
  const nums: number[] = [];
  for (const v of values) {
    if (v.value != null && typeof v.value === "number") {
      nums.push(v.value);
    } else if (v.value != null && typeof v.value === "string") {
      const parsed = parseFloat(v.value);
      if (!isNaN(parsed)) {
        nums.push(parsed);
      } else {
        return { type: "repeat", startValue: 0, step: 0 };
      }
    } else {
      return { type: "repeat", startValue: 0, step: 0 };
    }
  }

  if (nums.length === 0) {
    return { type: "repeat", startValue: 0, step: 0 };
  }

  if (nums.length === 1) {
    return { type: "repeat", startValue: nums[0], step: 0 };
  }

  // Check arithmetic sequence
  const step = nums[1] - nums[0];
  let isArithmetic = true;
  for (let i = 2; i < nums.length; i++) {
    if (Math.abs(nums[i] - nums[i - 1] - step) > 1e-10) {
      isArithmetic = false;
      break;
    }
  }

  if (isArithmetic) {
    return { type: "arithmetic", startValue: nums[0], step };
  }

  return { type: "repeat", startValue: nums[0], step: 0 };
}

export function generateFillValues(
  sourceCells: CellData[],
  count: number,
): CellData[] {
  if (sourceCells.length === 0 || count === 0) return [];

  const pattern = detectPattern(sourceCells);
  const result: CellData[] = [];

  if (pattern.type === "arithmetic") {
    const lastValue =
      pattern.startValue + pattern.step * (sourceCells.length - 1);
    for (let i = 1; i <= count; i++) {
      const newValue = lastValue + pattern.step * i;
      result.push({ value: newValue });
    }
  } else {
    // Repeat pattern: cycle through source cells
    for (let i = 0; i < count; i++) {
      const sourceIdx = i % sourceCells.length;
      const source = sourceCells[sourceIdx];
      result.push({ value: source.value });
    }
  }

  return result;
}

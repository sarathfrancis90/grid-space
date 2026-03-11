import { describe, it, expect } from "vitest";
import { extractBubbleData, buildGaugeData } from "../chartHelpers";

describe("extractBubbleData", () => {
  it("returns empty array when no datasets", () => {
    const result = extractBubbleData([], []);
    expect(result).toEqual([]);
  });

  it("creates bubble points from 3 datasets (x, y, r)", () => {
    const datasets = [
      { data: [1, 2, 3] },
      { data: [4, 5, 6] },
      { data: [10, 20, 30] },
    ];
    const result = extractBubbleData(["a", "b", "c"], datasets);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ x: 1, y: 4, r: 10 });
    expect(result[1]).toEqual({ x: 2, y: 5, r: 20 });
    expect(result[2]).toEqual({ x: 3, y: 6, r: 30 });
  });

  it("clamps negative radius to 1", () => {
    const datasets = [{ data: [1] }, { data: [2] }, { data: [-5] }];
    const result = extractBubbleData(["a"], datasets);
    expect(result[0].r).toBe(5);
  });

  it("creates bubble points from 2 datasets with default radius", () => {
    const datasets = [{ data: [10, 20] }, { data: [30, 40] }];
    const result = extractBubbleData(["a", "b"], datasets);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 10, y: 30, r: 5 });
    expect(result[1]).toEqual({ x: 20, y: 40, r: 5 });
  });

  it("creates bubble points from 1 dataset with index-based x", () => {
    const datasets = [{ data: [100, 200, 300] }];
    const result = extractBubbleData(["a", "b", "c"], datasets);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ x: 0, y: 100, r: 5 });
    expect(result[2]).toEqual({ x: 2, y: 300, r: 5 });
  });
});

describe("buildGaugeData", () => {
  it("returns value and remaining based on first data point", () => {
    const result = buildGaugeData([{ data: [75] }]);
    expect(result.value).toBe(75);
    expect(result.remaining).toBe(25);
    expect(result.max).toBe(100);
  });

  it("uses second data point as max when provided", () => {
    const result = buildGaugeData([{ data: [30, 50] }]);
    expect(result.value).toBe(30);
    expect(result.remaining).toBe(20);
    expect(result.max).toBe(50);
  });

  it("clamps value to max", () => {
    const result = buildGaugeData([{ data: [150, 100] }]);
    expect(result.value).toBe(100);
    expect(result.remaining).toBe(0);
  });

  it("clamps negative value to 0", () => {
    const result = buildGaugeData([{ data: [-10] }]);
    expect(result.value).toBe(0);
    expect(result.remaining).toBe(100);
  });

  it("handles empty datasets", () => {
    const result = buildGaugeData([]);
    expect(result.value).toBe(0);
    expect(result.max).toBe(100);
  });

  it("scales max above 100 when value exceeds it", () => {
    const result = buildGaugeData([{ data: [250] }]);
    expect(result.max).toBe(250);
    expect(result.value).toBe(250);
    expect(result.remaining).toBe(0);
  });
});

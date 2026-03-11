/**
 * Tests for chart helper utilities: histogram binning, trendlines,
 * waterfall data, candlestick extraction.
 */
import { describe, it, expect } from "vitest";
import {
  computeHistogramBins,
  computeLinearTrendline,
  computeExponentialTrendline,
  computePolynomialTrendline,
  computeWaterfallData,
  extractCandlestickData,
  extractBubbleData,
  buildGaugeData,
} from "../utils/chartHelpers";

describe("computeHistogramBins", () => {
  it("returns empty array for empty data", () => {
    expect(computeHistogramBins([])).toEqual([]);
  });

  it("bins data into correct number of bins", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const bins = computeHistogramBins(data, 5);
    expect(bins).toHaveLength(5);
    const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(10);
  });

  it("uses Sturges formula for default bin count", () => {
    const data = Array.from({ length: 32 }, (_, i) => i);
    const bins = computeHistogramBins(data);
    // Sturges: ceil(log2(32) + 1) = ceil(6) = 6
    expect(bins).toHaveLength(6);
  });

  it("handles single-value data", () => {
    const bins = computeHistogramBins([5, 5, 5]);
    expect(bins.length).toBeGreaterThanOrEqual(1);
    const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(3);
  });

  it("each bin has a label with range", () => {
    const bins = computeHistogramBins([1, 2, 3, 4], 2);
    for (const bin of bins) {
      expect(bin.label).toMatch(/\d+\.\d+-\d+\.\d+/);
    }
  });

  it("handles large datasets without stack overflow", () => {
    const data = Array.from({ length: 100000 }, (_, i) => i);
    const bins = computeHistogramBins(data, 10);
    expect(bins).toHaveLength(10);
    const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(100000);
  });
});

describe("computeLinearTrendline", () => {
  it("returns correct linear trend for linear data", () => {
    const data = [2, 4, 6, 8, 10];
    const trend = computeLinearTrendline(data, "Test");
    expect(trend.label).toBe("Test (trend)");
    expect(trend.data).toHaveLength(5);
    // Should closely match original data since it's perfectly linear
    for (let i = 0; i < 5; i++) {
      expect(trend.data[i]).toBeCloseTo(data[i], 5);
    }
  });

  it("handles single data point", () => {
    const trend = computeLinearTrendline([5], "Single");
    expect(trend.data).toEqual([5]);
  });

  it("handles empty data", () => {
    const trend = computeLinearTrendline([], "Empty");
    expect(trend.data).toEqual([]);
  });
});

describe("computeExponentialTrendline", () => {
  it("returns exponential trend data", () => {
    const data = [1, 2, 4, 8, 16];
    const trend = computeExponentialTrendline(data, "Exp");
    expect(trend.label).toBe("Exp (exp trend)");
    expect(trend.data).toHaveLength(5);
    // Values should be positive
    for (const v of trend.data) {
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe("computePolynomialTrendline", () => {
  it("returns polynomial trend for quadratic data", () => {
    const data = [1, 4, 9, 16, 25]; // x^2 for x=1..5
    const trend = computePolynomialTrendline(data, "Poly", 2);
    expect(trend.label).toBe("Poly (poly trend)");
    expect(trend.data).toHaveLength(5);
    // Should approximate the original data
    for (let i = 0; i < 5; i++) {
      expect(trend.data[i]).toBeCloseTo(data[i], 0);
    }
  });

  it("handles insufficient data for degree", () => {
    const data = [1, 2];
    const trend = computePolynomialTrendline(data, "Short", 3);
    // Falls back to copying data
    expect(trend.data).toEqual([1, 2]);
  });
});

describe("computeWaterfallData", () => {
  it("computes running totals correctly", () => {
    const labels = ["Revenue", "Costs", "Tax"];
    const values = [100, -40, -10];
    const result = computeWaterfallData(labels, values);

    expect(result).toHaveLength(4); // 3 items + total
    expect(result[0].runningTotal).toBe(100);
    expect(result[1].runningTotal).toBe(60);
    expect(result[2].runningTotal).toBe(50);
    expect(result[3].isTotal).toBe(true);
    expect(result[3].value).toBe(50);
    expect(result[3].label).toBe("Total");
  });

  it("handles empty data", () => {
    const result = computeWaterfallData([], []);
    expect(result).toHaveLength(1); // Just the total
    expect(result[0].isTotal).toBe(true);
    expect(result[0].value).toBe(0);
  });
});

describe("extractCandlestickData", () => {
  it("extracts OHLC data from 4 datasets", () => {
    const labels = ["Mon", "Tue", "Wed"];
    const datasets = [
      { data: [100, 105, 110] }, // open
      { data: [115, 112, 118] }, // high
      { data: [95, 100, 105] }, // low
      { data: [110, 108, 115] }, // close
    ];
    const result = extractCandlestickData(labels, datasets);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      label: "Mon",
      open: 100,
      high: 115,
      low: 95,
      close: 110,
    });
  });

  it("returns empty array with fewer than 4 datasets", () => {
    const result = extractCandlestickData(
      ["A"],
      [{ data: [1] }, { data: [2] }],
    );
    expect(result).toEqual([]);
  });

  it("handles mismatched lengths by using minimum", () => {
    const labels = ["A", "B", "C"];
    const datasets = [
      { data: [1, 2] },
      { data: [3, 4] },
      { data: [0, 1] },
      { data: [2, 3, 5] },
    ];
    const result = extractCandlestickData(labels, datasets);
    expect(result).toHaveLength(2);
  });
});

describe("extractBubbleData", () => {
  it("returns empty array with fewer than 2 datasets", () => {
    expect(extractBubbleData([{ data: [1, 2] }])).toEqual([]);
  });

  it("extracts bubble data from 3 datasets (x, y, r)", () => {
    const datasets = [
      { data: [10, 20, 30] }, // x
      { data: [5, 15, 25] }, // y
      { data: [100, 50, 100] }, // r (size)
    ];
    const result = extractBubbleData(datasets);
    expect(result).toHaveLength(3);
    expect(result[0].x).toBe(10);
    expect(result[0].y).toBe(5);
    expect(result[0].r).toBeGreaterThan(0);
  });

  it("uses index as x when only 2 datasets provided", () => {
    const datasets = [
      { data: [5, 15, 25] }, // y
      { data: [100, 50, 100] }, // r
    ];
    const result = extractBubbleData(datasets);
    expect(result).toHaveLength(3);
    expect(result[0].x).toBe(0);
    expect(result[1].x).toBe(1);
    expect(result[2].x).toBe(2);
  });

  it("scales bubble radius relative to max", () => {
    const datasets = [
      { data: [0, 1] }, // y
      { data: [50, 100] }, // r
    ];
    const result = extractBubbleData(datasets);
    // The one with max r (100) should get r=30, the smaller should be smaller
    expect(result[1].r).toBe(30);
    expect(result[0].r).toBeLessThan(result[1].r);
  });
});

describe("buildGaugeData", () => {
  it("builds gauge data for 50% value", () => {
    const result = buildGaugeData(50, 0, 100);
    expect(result.value).toBe(50);
    expect(result.percentage).toBe(50);
    // Data segments should sum to 100
    const total = result.data.reduce((sum, v) => sum + v, 0);
    expect(total).toBeCloseTo(100);
  });

  it("clamps value to min/max range", () => {
    const result = buildGaugeData(150, 0, 100);
    expect(result.value).toBe(100);
    expect(result.percentage).toBe(100);
  });

  it("clamps value below min", () => {
    const result = buildGaugeData(-10, 0, 100);
    expect(result.value).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("includes empty portion as gray for partial fill", () => {
    const result = buildGaugeData(30, 0, 100);
    // Last segment should be gray (#e0e0e0)
    const lastColor = result.backgroundColor[result.backgroundColor.length - 1];
    expect(lastColor).toBe("#e0e0e0");
  });

  it("uses custom colors when provided", () => {
    const result = buildGaugeData(50, 0, 100, ["#ff0000", "#00ff00"]);
    expect(result.backgroundColor).toContain("#ff0000");
  });
});

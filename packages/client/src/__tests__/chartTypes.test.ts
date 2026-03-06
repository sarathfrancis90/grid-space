/**
 * Tests for new chart types (histogram, radar, waterfall, candlestick),
 * stacking modes, and trendline support.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useChartStore } from "../stores/chartStore";
import type { ChartType, SelectionRange } from "../types/grid";

function resetStores() {
  useChartStore.setState({
    charts: new Map(),
    selectedChartId: null,
    editorOpen: false,
  });
}

const sel: SelectionRange = {
  start: { row: 0, col: 0 },
  end: { row: 4, col: 3 },
};

describe("New Chart Types", () => {
  beforeEach(resetStores);

  const newTypes: ChartType[] = [
    "histogram",
    "radar",
    "waterfall",
    "candlestick",
  ];

  for (const type of newTypes) {
    it(`creates a ${type} chart from selection`, () => {
      const store = useChartStore.getState();
      const chartId = store.createChartFromSelection("sheet-1", type, sel);
      const chart = store.getChart("sheet-1", chartId);
      expect(chart).toBeDefined();
      expect(chart!.type).toBe(type);
    });
  }

  it("can change type from column to histogram", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.setChartType("sheet-1", chartId, "histogram");
    expect(store.getChart("sheet-1", chartId)!.type).toBe("histogram");
  });

  it("can change type from line to radar", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "line", sel);
    store.setChartType("sheet-1", chartId, "radar");
    expect(store.getChart("sheet-1", chartId)!.type).toBe("radar");
  });
});

describe("Stacking Modes", () => {
  beforeEach(resetStores);

  it("sets stackMode to stacked", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.updateChart("sheet-1", chartId, { stackMode: "stacked" });
    expect(store.getChart("sheet-1", chartId)!.stackMode).toBe("stacked");
  });

  it("sets stackMode to percent (100% stacked)", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "bar", sel);
    store.updateChart("sheet-1", chartId, { stackMode: "percent" });
    expect(store.getChart("sheet-1", chartId)!.stackMode).toBe("percent");
  });

  it("resets stackMode to none", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "area", sel);
    store.updateChart("sheet-1", chartId, { stackMode: "stacked" });
    store.updateChart("sheet-1", chartId, { stackMode: "none" });
    expect(store.getChart("sheet-1", chartId)!.stackMode).toBe("none");
  });
});

describe("Trendline Support", () => {
  beforeEach(resetStores);

  it("sets linear trendline", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "line", sel);
    store.updateChart("sheet-1", chartId, { trendline: "linear" });
    expect(store.getChart("sheet-1", chartId)!.trendline).toBe("linear");
  });

  it("sets exponential trendline", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "scatter", sel);
    store.updateChart("sheet-1", chartId, { trendline: "exponential" });
    expect(store.getChart("sheet-1", chartId)!.trendline).toBe("exponential");
  });

  it("sets polynomial trendline", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.updateChart("sheet-1", chartId, { trendline: "polynomial" });
    expect(store.getChart("sheet-1", chartId)!.trendline).toBe("polynomial");
  });

  it("clears trendline by setting to none", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "line", sel);
    store.updateChart("sheet-1", chartId, { trendline: "linear" });
    store.updateChart("sheet-1", chartId, { trendline: "none" });
    expect(store.getChart("sheet-1", chartId)!.trendline).toBe("none");
  });
});

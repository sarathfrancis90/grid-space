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
    "bubble",
    "gauge",
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

describe("Smooth Line Support", () => {
  beforeEach(resetStores);

  it("sets smoothLine to true", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "line", sel);
    store.updateChart("sheet-1", chartId, { smoothLine: true });
    expect(store.getChart("sheet-1", chartId)!.smoothLine).toBe(true);
  });

  it("toggles smoothLine off", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "area", sel);
    store.updateChart("sheet-1", chartId, { smoothLine: true });
    store.updateChart("sheet-1", chartId, { smoothLine: false });
    expect(store.getChart("sheet-1", chartId)!.smoothLine).toBe(false);
  });
});

describe("Bubble and Gauge Chart Types", () => {
  beforeEach(resetStores);

  it("creates a bubble chart and stores it", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "bubble", sel);
    const chart = store.getChart("sheet-1", chartId);
    expect(chart).toBeDefined();
    expect(chart!.type).toBe("bubble");
  });

  it("creates a gauge chart and stores it", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "gauge", sel);
    const chart = store.getChart("sheet-1", chartId);
    expect(chart).toBeDefined();
    expect(chart!.type).toBe("gauge");
  });

  it("can switch from column to bubble", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.setChartType("sheet-1", chartId, "bubble");
    expect(store.getChart("sheet-1", chartId)!.type).toBe("bubble");
  });

  it("can switch from pie to gauge", () => {
    const store = useChartStore.getState();
    const chartId = store.createChartFromSelection("sheet-1", "pie", sel);
    store.setChartType("sheet-1", chartId, "gauge");
    expect(store.getChart("sheet-1", chartId)!.type).toBe("gauge");
  });
});

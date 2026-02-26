/**
 * Tests for chart store and chart data utilities.
 * Covers S6-001 to S6-018 chart features.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useChartStore } from "../stores/chartStore";
import { useCellStore } from "../stores/cellStore";
import { extractChartData, DEFAULT_COLORS } from "../utils/chartData";
import type { ChartType, SelectionRange } from "../types/grid";

function resetStores() {
  useChartStore.setState({
    charts: new Map(),
    selectedChartId: null,
    editorOpen: false,
  });
  useCellStore.setState({ cells: new Map() });
}

describe("Chart Store", () => {
  beforeEach(resetStores);

  // S6-001 to S6-007: Create charts of each type
  const chartTypes: ChartType[] = [
    "column",
    "bar",
    "line",
    "area",
    "pie",
    "scatter",
    "combo",
  ];

  for (const type of chartTypes) {
    it(`creates a ${type} chart from selection (S6-00${chartTypes.indexOf(type) + 1})`, () => {
      const store = useChartStore.getState();
      const selection: SelectionRange = {
        start: { row: 0, col: 0 },
        end: { row: 3, col: 2 },
      };
      const chartId = store.createChartFromSelection(
        "sheet-1",
        type,
        selection,
      );
      expect(chartId).toBeTruthy();

      const chart = store.getChart("sheet-1", chartId);
      expect(chart).toBeDefined();
      expect(chart!.type).toBe(type);
      expect(chart!.dataRange).toEqual(selection);
      expect(chart!.position).toEqual({ x: 100, y: 100 });
      expect(chart!.size).toEqual({ width: 400, height: 300 });
      expect(chart!.showLegend).toBe(true);
    });
  }

  // S6-008: Change chart type
  it("changes chart type via editor (S6-008)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.setChartType("sheet-1", chartId, "line");

    const chart = store.getChart("sheet-1", chartId);
    expect(chart!.type).toBe("line");
  });

  // S6-009: Set data range
  it("updates chart data range (S6-009)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    const newRange: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 5, col: 3 },
    };
    store.setDataRange("sheet-1", chartId, newRange);

    const chart = store.getChart("sheet-1", chartId);
    expect(chart!.dataRange).toEqual(newRange);
  });

  // S6-010: Title and subtitle
  it("updates chart title and subtitle (S6-010)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.updateChart("sheet-1", chartId, {
      title: "Sales Report",
      subtitle: "Q1 2024",
    });

    const chart = store.getChart("sheet-1", chartId);
    expect(chart!.title).toBe("Sales Report");
    expect(chart!.subtitle).toBe("Q1 2024");
  });

  // S6-011: Legend toggle and position
  it("toggles legend and sets position (S6-011)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);

    store.updateChart("sheet-1", chartId, {
      showLegend: false,
    });
    expect(store.getChart("sheet-1", chartId)!.showLegend).toBe(false);

    store.updateChart("sheet-1", chartId, {
      showLegend: true,
      legendPosition: "right",
    });
    expect(store.getChart("sheet-1", chartId)!.legendPosition).toBe("right");
  });

  // S6-012: Axis labels
  it("updates axis labels (S6-012)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "line", sel);
    store.updateChart("sheet-1", chartId, {
      xAxisLabel: "Month",
      yAxisLabel: "Revenue ($)",
    });

    const chart = store.getChart("sheet-1", chartId);
    expect(chart!.xAxisLabel).toBe("Month");
    expect(chart!.yAxisLabel).toBe("Revenue ($)");
  });

  // S6-013: Colors and styling
  it("updates chart colors (S6-013)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    const customColors = ["#ff0000", "#00ff00", "#0000ff"];
    store.updateChart("sheet-1", chartId, { colors: customColors });

    const chart = store.getChart("sheet-1", chartId);
    expect(chart!.colors).toEqual(customColors);
  });

  // S6-014: Move chart
  it("moves chart by setting position (S6-014)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.moveChart("sheet-1", chartId, 250, 300);

    const chart = store.getChart("sheet-1", chartId);
    expect(chart!.position).toEqual({ x: 250, y: 300 });
  });

  // S6-015: Resize chart
  it("resizes chart (S6-015)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.resizeChart("sheet-1", chartId, 600, 450);

    const chart = store.getChart("sheet-1", chartId);
    expect(chart!.size).toEqual({ width: 600, height: 450 });
  });

  // S6-016: Delete chart
  it("deletes chart (S6-016)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    expect(store.getCharts("sheet-1")).toHaveLength(1);

    store.removeChart("sheet-1", chartId);
    expect(store.getCharts("sheet-1")).toHaveLength(0);
  });

  // S6-016: Delete chart clears selection
  it("deleting selected chart clears selectedChartId (S6-016)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    expect(useChartStore.getState().selectedChartId).toBe(chartId);

    store.removeChart("sheet-1", chartId);
    expect(useChartStore.getState().selectedChartId).toBeNull();
  });

  // S6-017: Chart updates when source data changes
  it("extractChartData reacts to cell data (S6-017)", () => {
    const cellStore = useCellStore.getState();
    cellStore.setCell("sheet-1", 0, 0, { value: "Category" });
    cellStore.setCell("sheet-1", 0, 1, { value: "Sales" });
    cellStore.setCell("sheet-1", 1, 0, { value: "A" });
    cellStore.setCell("sheet-1", 1, 1, { value: 100 });
    cellStore.setCell("sheet-1", 2, 0, { value: "B" });
    cellStore.setCell("sheet-1", 2, 1, { value: 200 });

    const range: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const getCellValue = (row: number, col: number) =>
      useCellStore.getState().getCell("sheet-1", row, col);

    const data = extractChartData(range, getCellValue);
    expect(data.labels).toEqual(["A", "B"]);
    expect(data.datasets).toHaveLength(1);
    expect(data.datasets[0].label).toBe("Sales");
    expect(data.datasets[0].data).toEqual([100, 200]);

    // Update data — re-extract should reflect changes
    cellStore.setCell("sheet-1", 1, 1, { value: 150 });
    const data2 = extractChartData(range, getCellValue);
    expect(data2.datasets[0].data).toEqual([150, 200]);
  });

  // S6-018: Double-click chart opens editor
  it("opens editor when selecting chart and calling openEditor (S6-018)", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    const chartId = store.createChartFromSelection("sheet-1", "column", sel);
    store.selectChart(chartId);
    store.openEditor();

    expect(useChartStore.getState().editorOpen).toBe(true);
    expect(useChartStore.getState().selectedChartId).toBe(chartId);
  });

  it("closes editor (S6-018)", () => {
    const store = useChartStore.getState();
    store.openEditor();
    expect(useChartStore.getState().editorOpen).toBe(true);
    store.closeEditor();
    expect(useChartStore.getState().editorOpen).toBe(false);
  });

  it("getCharts returns empty array for unknown sheet", () => {
    const store = useChartStore.getState();
    expect(store.getCharts("nonexistent")).toEqual([]);
  });

  it("creates multiple charts on same sheet", () => {
    const store = useChartStore.getState();
    const sel: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    };
    store.createChartFromSelection("sheet-1", "column", sel);
    store.createChartFromSelection("sheet-1", "pie", sel);
    expect(store.getCharts("sheet-1")).toHaveLength(2);
  });
});

describe("extractChartData", () => {
  it("handles data without headers", () => {
    const getCellValue = (row: number, col: number) => {
      const data: Record<string, number> = {
        "0,0": 10,
        "0,1": 20,
        "1,0": 30,
        "1,1": 40,
      };
      const val = data[`${row},${col}`];
      return val !== undefined ? { value: val } : undefined;
    };

    const range: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    };
    const result = extractChartData(range, getCellValue);
    expect(result.datasets.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty cells as 0", () => {
    const getCellValue = () => undefined;
    const range: SelectionRange = {
      start: { row: 0, col: 0 },
      end: { row: 1, col: 0 },
    };
    const result = extractChartData(range, getCellValue);
    expect(result.datasets[0].data.every((v) => v === 0)).toBe(true);
  });

  it("DEFAULT_COLORS has at least 8 colors", () => {
    expect(DEFAULT_COLORS.length).toBeGreaterThanOrEqual(8);
  });
});

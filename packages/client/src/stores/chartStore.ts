/**
 * Chart store — manages chart objects per sheet.
 * Charts are positioned as overlays on the grid.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ChartConfig, ChartType, SelectionRange } from "../types/grid";

interface ChartState {
  charts: Map<string, ChartConfig[]>;
  selectedChartId: string | null;
  editorOpen: boolean;

  addChart: (sheetId: string, chart: ChartConfig) => void;
  removeChart: (sheetId: string, chartId: string) => void;
  updateChart: (
    sheetId: string,
    chartId: string,
    updates: Partial<ChartConfig>,
  ) => void;
  getCharts: (sheetId: string) => ChartConfig[];
  getChart: (sheetId: string, chartId: string) => ChartConfig | undefined;
  selectChart: (chartId: string | null) => void;
  openEditor: () => void;
  closeEditor: () => void;
  moveChart: (sheetId: string, chartId: string, x: number, y: number) => void;
  resizeChart: (
    sheetId: string,
    chartId: string,
    width: number,
    height: number,
  ) => void;
  setChartType: (sheetId: string, chartId: string, type: ChartType) => void;
  setDataRange: (
    sheetId: string,
    chartId: string,
    range: SelectionRange,
  ) => void;
  createChartFromSelection: (
    sheetId: string,
    type: ChartType,
    selection: SelectionRange,
  ) => string;
}

export const useChartStore = create<ChartState>()(
  immer((set, get) => ({
    charts: new Map<string, ChartConfig[]>(),
    selectedChartId: null,
    editorOpen: false,

    addChart: (sheetId: string, chart: ChartConfig) => {
      set((state) => {
        if (!state.charts.has(sheetId)) {
          state.charts.set(sheetId, []);
        }
        state.charts.get(sheetId)!.push(chart);
      });
    },

    removeChart: (sheetId: string, chartId: string) => {
      set((state) => {
        const charts = state.charts.get(sheetId);
        if (!charts) return;
        state.charts.set(
          sheetId,
          charts.filter((c) => c.id !== chartId),
        );
        if (state.selectedChartId === chartId) {
          state.selectedChartId = null;
          state.editorOpen = false;
        }
      });
    },

    updateChart: (
      sheetId: string,
      chartId: string,
      updates: Partial<ChartConfig>,
    ) => {
      set((state) => {
        const charts = state.charts.get(sheetId);
        if (!charts) return;
        const chart = charts.find((c) => c.id === chartId);
        if (!chart) return;
        Object.assign(chart, updates);
      });
    },

    getCharts: (sheetId: string) => {
      return get().charts.get(sheetId) ?? [];
    },

    getChart: (sheetId: string, chartId: string) => {
      return get()
        .charts.get(sheetId)
        ?.find((c) => c.id === chartId);
    },

    selectChart: (chartId: string | null) => {
      set((state) => {
        state.selectedChartId = chartId;
      });
    },

    openEditor: () => {
      set((state) => {
        state.editorOpen = true;
      });
    },

    closeEditor: () => {
      set((state) => {
        state.editorOpen = false;
      });
    },

    moveChart: (sheetId: string, chartId: string, x: number, y: number) => {
      set((state) => {
        const charts = state.charts.get(sheetId);
        if (!charts) return;
        const chart = charts.find((c) => c.id === chartId);
        if (chart) {
          chart.position = { x, y };
        }
      });
    },

    resizeChart: (
      sheetId: string,
      chartId: string,
      width: number,
      height: number,
    ) => {
      set((state) => {
        const charts = state.charts.get(sheetId);
        if (!charts) return;
        const chart = charts.find((c) => c.id === chartId);
        if (chart) {
          chart.size = { width, height };
        }
      });
    },

    setChartType: (sheetId: string, chartId: string, type: ChartType) => {
      get().updateChart(sheetId, chartId, { type });
    },

    setDataRange: (sheetId: string, chartId: string, range: SelectionRange) => {
      get().updateChart(sheetId, chartId, { dataRange: range });
    },

    createChartFromSelection: (
      sheetId: string,
      type: ChartType,
      selection: SelectionRange,
    ): string => {
      const id = `chart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const chart: ChartConfig = {
        id,
        sheetId,
        type,
        dataRange: selection,
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        showLegend: true,
        legendPosition: "bottom",
      };
      get().addChart(sheetId, chart);
      set((state) => {
        state.selectedChartId = id;
      });
      return id;
    },
  })),
);

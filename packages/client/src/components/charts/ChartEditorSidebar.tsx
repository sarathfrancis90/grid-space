/**
 * ChartEditorSidebar — edit chart type, data range, title, legend, axis labels, colors.
 */
import { useCallback } from "react";
import { useChartStore } from "../../stores/chartStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import type { ChartType } from "../../types/grid";
import { colToLetter } from "../../utils/coordinates";
import { DEFAULT_COLORS } from "../../utils/chartData";

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "column", label: "Column" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" },
  { value: "combo", label: "Combo" },
];

const LEGEND_POSITIONS = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "none", label: "Hidden" },
] as const;

export function ChartEditorSidebar() {
  const editorOpen = useChartStore((s) => s.editorOpen);
  const selectedChartId = useChartStore((s) => s.selectedChartId);
  const closeEditor = useChartStore((s) => s.closeEditor);
  const updateChart = useChartStore((s) => s.updateChart);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const chart = useChartStore((s) => {
    if (!selectedChartId) return undefined;
    return s.charts.get(sheetId)?.find((c) => c.id === selectedChartId);
  });

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!chart) return;
      updateChart(sheetId, chart.id, {
        type: e.target.value as ChartType,
      });
    },
    [chart, sheetId, updateChart],
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!chart) return;
      updateChart(sheetId, chart.id, { title: e.target.value });
    },
    [chart, sheetId, updateChart],
  );

  const handleSubtitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!chart) return;
      updateChart(sheetId, chart.id, { subtitle: e.target.value });
    },
    [chart, sheetId, updateChart],
  );

  const handleLegendToggle = useCallback(() => {
    if (!chart) return;
    updateChart(sheetId, chart.id, {
      showLegend: !chart.showLegend,
    });
  }, [chart, sheetId, updateChart]);

  const handleLegendPosition = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!chart) return;
      const pos = e.target.value as
        | "top"
        | "bottom"
        | "left"
        | "right"
        | "none";
      updateChart(sheetId, chart.id, {
        legendPosition: pos,
        showLegend: pos !== "none",
      });
    },
    [chart, sheetId, updateChart],
  );

  const handleXAxisLabel = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!chart) return;
      updateChart(sheetId, chart.id, { xAxisLabel: e.target.value });
    },
    [chart, sheetId, updateChart],
  );

  const handleYAxisLabel = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!chart) return;
      updateChart(sheetId, chart.id, { yAxisLabel: e.target.value });
    },
    [chart, sheetId, updateChart],
  );

  const handleDataRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!chart) return;
      // Parse range like "A1:D5"
      const match = e.target.value.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
      if (!match) return;
      const startCol = letterToColNum(match[1]);
      const startRow = parseInt(match[2], 10) - 1;
      const endCol = letterToColNum(match[3]);
      const endRow = parseInt(match[4], 10) - 1;
      updateChart(sheetId, chart.id, {
        dataRange: {
          start: { row: startRow, col: startCol },
          end: { row: endRow, col: endCol },
        },
      });
    },
    [chart, sheetId, updateChart],
  );

  const handleColorChange = useCallback(
    (index: number, color: string) => {
      if (!chart) return;
      const currentColors = chart.colors?.length
        ? [...chart.colors]
        : [...DEFAULT_COLORS];
      currentColors[index] = color;
      updateChart(sheetId, chart.id, { colors: currentColors });
    },
    [chart, sheetId, updateChart],
  );

  if (!editorOpen || !chart) return null;

  const rangeStr = `${colToLetter(chart.dataRange.start.col)}${chart.dataRange.start.row + 1}:${colToLetter(chart.dataRange.end.col)}${chart.dataRange.end.row + 1}`;

  return (
    <div
      data-testid="chart-editor-sidebar"
      className="fixed right-0 top-0 h-full w-72 bg-white border-l border-gray-300 shadow-lg z-30 overflow-y-auto"
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <span className="font-semibold text-sm">Chart Editor</span>
        <button
          data-testid="chart-editor-close"
          onClick={closeEditor}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Chart type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Chart Type
          </label>
          <select
            data-testid="chart-type-select"
            value={chart.type}
            onChange={handleTypeChange}
            className="w-full h-8 border border-gray-300 rounded text-sm px-2"
          >
            {CHART_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Data range */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Data Range
          </label>
          <input
            data-testid="chart-data-range-input"
            type="text"
            defaultValue={rangeStr}
            onBlur={handleDataRangeChange}
            className="w-full h-8 border border-gray-300 rounded text-sm px-2"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Title
          </label>
          <input
            data-testid="chart-title-input"
            type="text"
            value={chart.title ?? ""}
            onChange={handleTitleChange}
            placeholder="Chart title"
            className="w-full h-8 border border-gray-300 rounded text-sm px-2"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Subtitle
          </label>
          <input
            data-testid="chart-subtitle-input"
            type="text"
            value={chart.subtitle ?? ""}
            onChange={handleSubtitleChange}
            placeholder="Chart subtitle"
            className="w-full h-8 border border-gray-300 rounded text-sm px-2"
          />
        </div>

        {/* Legend */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <input
              data-testid="chart-legend-toggle"
              type="checkbox"
              checked={chart.showLegend !== false}
              onChange={handleLegendToggle}
            />
            Show Legend
          </label>
          {chart.showLegend !== false && (
            <select
              data-testid="chart-legend-position"
              value={chart.legendPosition ?? "bottom"}
              onChange={handleLegendPosition}
              className="w-full h-8 border border-gray-300 rounded text-sm px-2 mt-1"
            >
              {LEGEND_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Axis labels */}
        {chart.type !== "pie" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                X Axis Label
              </label>
              <input
                data-testid="chart-x-axis-input"
                type="text"
                value={chart.xAxisLabel ?? ""}
                onChange={handleXAxisLabel}
                className="w-full h-8 border border-gray-300 rounded text-sm px-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Y Axis Label
              </label>
              <input
                data-testid="chart-y-axis-input"
                type="text"
                value={chart.yAxisLabel ?? ""}
                onChange={handleYAxisLabel}
                className="w-full h-8 border border-gray-300 rounded text-sm px-2"
              />
            </div>
          </>
        )}

        {/* S6-013: Colors and styling */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Series Colors
          </label>
          <div
            className="flex flex-wrap gap-1"
            data-testid="chart-color-pickers"
          >
            {(chart.colors?.length ? chart.colors : DEFAULT_COLORS)
              .slice(0, 6)
              .map((color, i) => (
                <input
                  key={i}
                  data-testid={`chart-color-${i}`}
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(i, e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function letterToColNum(letter: string): number {
  let col = 0;
  const upper = letter.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64);
  }
  return col - 1;
}

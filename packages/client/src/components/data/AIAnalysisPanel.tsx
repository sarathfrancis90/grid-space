/**
 * AI Analysis Panel — client-side data analysis sidebar.
 * Shows statistics, distributions, outliers, trends, correlations, and chart suggestions.
 */
import { useState, useMemo, type ReactNode } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useChartStore } from "../../stores/chartStore";
import { analyzeSelection } from "../../utils/dataAnalysis";
import type { AnalysisResult } from "../../utils/dataAnalysis";
import type { ChartType } from "../../types/grid";

function Section({
  title,
  testId,
  defaultOpen = true,
  children,
}: {
  title: string;
  testId: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-3 border-b border-gray-100 pb-2">
      <button
        data-testid={testId}
        className="flex w-full items-center justify-between py-1 text-xs font-semibold text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span>{title}</span>
        <span className="text-[10px] text-gray-400">
          {open ? "\u25BE" : "\u25B8"}
        </span>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
}

const CHART_LABELS: Record<string, string> = {
  column: "Column",
  bar: "Bar",
  line: "Line",
  area: "Area",
  pie: "Pie",
  scatter: "Scatter",
  combo: "Combo",
};

const TYPE_LABELS: Record<string, string> = {
  number: "Numeric",
  text: "Text",
  date: "Date",
  boolean: "Boolean",
  mixed: "Mixed",
  empty: "Empty",
};

function correlationColor(coef: number): string {
  const abs = Math.abs(coef);
  const alpha = Math.round(abs * 0.5 * 255)
    .toString(16)
    .padStart(2, "0");
  return coef >= 0 ? `#22c55e${alpha}` : `#ef4444${alpha}`;
}

export function AIAnalysisPanel() {
  const isOpen = useUIStore((s) => s.isAIAnalysisOpen);
  const close = useUIStore((s) => s.setAIAnalysisOpen);
  const selections = useUIStore((s) => s.selections);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const [refreshKey, setRefreshKey] = useState(0);

  const sel = selections.length > 0 ? selections[0] : null;
  const startRow = sel ? Math.min(sel.start.row, sel.end.row) : 0;
  const endRow = sel ? Math.max(sel.start.row, sel.end.row) : 0;
  const startCol = sel ? Math.min(sel.start.col, sel.end.col) : 0;
  const endCol = sel ? Math.max(sel.start.col, sel.end.col) : 0;
  const hasRange =
    sel !== null && (endRow - startRow > 0 || endCol - startCol > 0);

  const analysis = useMemo<AnalysisResult | null>(() => {
    if (!hasRange) return null;
    const cellGetter = useCellStore.getState().getCell;
    return analyzeSelection(startRow, endRow, startCol, endCol, (r, c) =>
      cellGetter(sheetId, r, c),
    );
    // refreshKey forces recomputation on demand
  }, [hasRange, startRow, endRow, startCol, endCol, sheetId, refreshKey]);

  if (!isOpen) return null;

  const handleCreateChart = (type: ChartType) => {
    if (!sel) return;
    useChartStore.getState().createChartFromSelection(sheetId, type, sel);
  };

  const numericCols = analysis?.columns.filter((c) => c.statistics) ?? [];

  return (
    <div
      data-testid="ai-analysis-panel"
      className="fixed right-0 top-0 z-[200] flex h-screen w-[320px] flex-col border-l border-gray-300 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">Explore Data</h3>
        <div className="flex items-center gap-1">
          <button
            data-testid="ai-analysis-refresh"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            type="button"
            title="Refresh analysis"
          >
            &#8635;
          </button>
          <button
            data-testid="ai-analysis-close"
            onClick={() => close(false)}
            className="rounded p-1 text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            type="button"
          >
            &#10005;
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!analysis ? (
          <div
            className="py-8 text-center text-xs text-gray-400"
            data-testid="ai-analysis-empty"
          >
            Select a range of cells to analyze
          </div>
        ) : (
          <>
            {/* Summary */}
            <Section title="Summary" testId="ai-section-summary">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-gray-500">Rows</span>
                <span className="font-medium">{analysis.rowCount}</span>
                <span className="text-gray-500">Columns</span>
                <span className="font-medium">{analysis.colCount}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {analysis.columns.map((col) => (
                  <span
                    key={col.info.index}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                  >
                    {col.info.label}:{" "}
                    {TYPE_LABELS[col.info.type] ?? col.info.type}
                  </span>
                ))}
              </div>
            </Section>

            {/* Statistics */}
            {numericCols.length > 0 && (
              <Section title="Statistics" testId="ai-section-statistics">
                {numericCols.map((col) => {
                  if (!col.statistics) return null;
                  const s = col.statistics;
                  const entries: [string, number][] = [
                    ["min", s.min],
                    ["max", s.max],
                    ["avg", s.avg],
                    ["median", s.median],
                    ["std", s.stdDev],
                    ["sum", s.sum],
                  ];
                  return (
                    <div key={col.info.index} className="mb-2">
                      <div className="mb-0.5 text-[11px] font-medium text-gray-600">
                        Column {col.info.label}
                      </div>
                      <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[11px]">
                        {entries.map(([label, val]) => (
                          <div key={label} className="flex justify-between">
                            <span className="text-gray-400">{label}</span>
                            <span className="font-mono">{fmt(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Section>
            )}

            {/* Distribution */}
            <Section title="Distribution" testId="ai-section-distribution">
              {analysis.columns.map((col) => (
                <div key={col.info.index} className="mb-2">
                  <div className="mb-0.5 text-[11px] font-medium text-gray-600">
                    {col.info.label}{" "}
                    <span className="font-normal text-gray-400">
                      ({col.info.uniqueCount} unique)
                    </span>
                  </div>
                  {col.topValues.length > 0 ? (
                    <div className="space-y-0.5">
                      {col.topValues.map((tv) => (
                        <div
                          key={tv.value}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span
                            className="truncate text-gray-600"
                            title={tv.value}
                          >
                            {tv.value}
                          </span>
                          <span className="ml-2 flex-shrink-0 text-gray-400">
                            {tv.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400">No values</div>
                  )}
                </div>
              ))}
            </Section>

            {/* Outliers */}
            {numericCols.some((c) => c.outlierIndices.length > 0) && (
              <Section title="Outliers" testId="ai-section-outliers">
                {numericCols
                  .filter((c) => c.outlierIndices.length > 0)
                  .map((col) => (
                    <div key={col.info.index} className="mb-1">
                      <div className="text-[11px] font-medium text-gray-600">
                        Column {col.info.label}{" "}
                        <span className="text-gray-400">
                          ({col.outlierIndices.length} outlier
                          {col.outlierIndices.length > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {col.outlierIndices.slice(0, 10).map((idx) => (
                          <span
                            key={idx}
                            className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] text-yellow-800"
                          >
                            Row {startRow + idx + 1}
                          </span>
                        ))}
                        {col.outlierIndices.length > 10 && (
                          <span className="text-[10px] text-gray-400">
                            +{col.outlierIndices.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </Section>
            )}

            {/* Trends */}
            {numericCols.some((c) => c.trend) && (
              <Section title="Trends" testId="ai-section-trends">
                <div className="space-y-0.5">
                  {numericCols
                    .filter((c) => c.trend)
                    .map((col) => (
                      <div
                        key={col.info.index}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-gray-600">
                          Column {col.info.label}
                        </span>
                        <span
                          className={
                            col.trend === "increasing"
                              ? "text-green-600"
                              : col.trend === "decreasing"
                                ? "text-red-600"
                                : col.trend === "volatile"
                                  ? "text-orange-500"
                                  : "text-gray-500"
                          }
                        >
                          {col.trend}
                        </span>
                      </div>
                    ))}
                </div>
              </Section>
            )}

            {/* Chart Suggestions */}
            {analysis.chartSuggestions.length > 0 && (
              <Section title="Suggested Charts" testId="ai-section-charts">
                <div className="space-y-1.5">
                  {analysis.chartSuggestions.map((sug, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-gray-100 px-2 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-gray-700">
                          {CHART_LABELS[sug.type] ?? sug.type} Chart
                        </div>
                        <div className="truncate text-[10px] text-gray-400">
                          {sug.reason}
                        </div>
                      </div>
                      <button
                        data-testid={`ai-create-chart-${sug.type}`}
                        className="ml-2 flex-shrink-0 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
                        onClick={() => handleCreateChart(sug.type)}
                        type="button"
                      >
                        Create
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Correlation Matrix */}
            {analysis.correlations.length > 0 && (
              <Section
                title="Correlations"
                testId="ai-section-correlations"
                defaultOpen={false}
              >
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr>
                      <th className="p-1" />
                      {numericCols.map((c) => (
                        <th
                          key={c.info.index}
                          className="p-1 font-medium text-gray-500"
                        >
                          {c.info.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {numericCols.map((rowCol) => (
                      <tr key={rowCol.info.index}>
                        <td className="p-1 font-medium text-gray-500">
                          {rowCol.info.label}
                        </td>
                        {numericCols.map((colCol) => {
                          if (rowCol.info.index === colCol.info.index) {
                            return (
                              <td
                                key={colCol.info.index}
                                className="p-1 text-center font-mono"
                                style={{ backgroundColor: "#22c55e40" }}
                              >
                                1.00
                              </td>
                            );
                          }
                          const entry = analysis.correlations.find(
                            (e) =>
                              (e.colA === rowCol.info.index &&
                                e.colB === colCol.info.index) ||
                              (e.colA === colCol.info.index &&
                                e.colB === rowCol.info.index),
                          );
                          const coef = entry?.coefficient ?? 0;
                          return (
                            <td
                              key={colCol.info.index}
                              className="p-1 text-center font-mono"
                              style={{
                                backgroundColor: correlationColor(coef),
                              }}
                            >
                              {coef.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

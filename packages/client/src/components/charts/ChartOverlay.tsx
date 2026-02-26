/**
 * ChartOverlay — renders all charts for the active sheet.
 */
import { useChartStore } from "../../stores/chartStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { ChartContainer } from "./ChartContainer";
import { ChartEditorSidebar } from "./ChartEditorSidebar";
import type { ChartConfig } from "../../types/grid";

const EMPTY_CHARTS: ChartConfig[] = [];

export function ChartOverlay() {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const charts = useChartStore((s) => s.charts.get(sheetId) ?? EMPTY_CHARTS);

  return (
    <>
      {charts.map((chart) => (
        <ChartContainer key={chart.id} chart={chart} sheetId={sheetId} />
      ))}
      <ChartEditorSidebar />
    </>
  );
}

/**
 * ChartOverlay — renders all charts for the active sheet.
 */
import { useChartStore } from "../../stores/chartStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { ChartContainer } from "./ChartContainer";
import { ChartEditorSidebar } from "./ChartEditorSidebar";

export function ChartOverlay() {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const charts = useChartStore((s) => s.charts.get(sheetId) ?? []);

  return (
    <>
      {charts.map((chart) => (
        <ChartContainer key={chart.id} chart={chart} sheetId={sheetId} />
      ))}
      <ChartEditorSidebar />
    </>
  );
}

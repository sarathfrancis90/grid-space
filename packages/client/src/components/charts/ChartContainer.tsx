/**
 * ChartContainer — renders a Chart.js chart in a draggable/resizable overlay.
 */
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { ChartConfig } from "../../types/grid";
import { useChartStore } from "../../stores/chartStore";
import { useCellStore } from "../../stores/cellStore";
import { extractChartData } from "../../utils/chartData";
import { ChartRenderer } from "./ChartRenderer";

interface ChartContainerProps {
  chart: ChartConfig;
  sheetId: string;
}

export function ChartContainer({ chart, sheetId }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const selectedChartId = useChartStore((s) => s.selectedChartId);
  const selectChart = useChartStore((s) => s.selectChart);
  const moveChart = useChartStore((s) => s.moveChart);
  const resizeChart = useChartStore((s) => s.resizeChart);
  const removeChart = useChartStore((s) => s.removeChart);
  const openEditor = useChartStore((s) => s.openEditor);

  const isSelected = selectedChartId === chart.id;

  const getCellValue = useCallback(
    (row: number, col: number) => {
      return useCellStore.getState().getCell(sheetId, row, col);
    },
    [sheetId],
  );

  const chartData = useMemo(
    () => extractChartData(chart.dataRange, getCellValue),
    [chart.dataRange, getCellValue],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectChart(chart.id);

      if (e.detail === 2) {
        openEditor();
        return;
      }

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: chart.position.x,
        posY: chart.position.y,
      };
    },
    [chart.id, chart.position, selectChart, openEditor],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        w: chart.size.width,
        h: chart.size.height,
      };
    },
    [chart.size],
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        moveChart(
          sheetId,
          chart.id,
          Math.max(0, dragStartRef.current.posX + dx),
          Math.max(0, dragStartRef.current.posY + dy),
        );
      }
      if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        resizeChart(
          sheetId,
          chart.id,
          Math.max(200, resizeStartRef.current.w + dx),
          Math.max(150, resizeStartRef.current.h + dy),
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, sheetId, chart.id, moveChart, resizeChart]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        removeChart(sheetId, chart.id);
      }
    },
    [removeChart, sheetId, chart.id],
  );

  return (
    <div
      ref={containerRef}
      data-testid={`chart-container-${chart.id}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      className="group"
      style={{
        position: "absolute",
        left: chart.position.x,
        top: chart.position.y,
        width: chart.size.width,
        height: chart.size.height,
        border: isSelected ? "2px solid #1a73e8" : "1px solid #ddd",
        borderRadius: 4,
        background: "white",
        boxShadow: isSelected
          ? "0 2px 8px rgba(26,115,232,0.3)"
          : "0 1px 3px rgba(0,0,0,0.1)",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isSelected ? 20 : 10,
        outline: "none",
        padding: 8,
      }}
    >
      <ChartRenderer chart={chart} chartData={chartData} />
      {isSelected && (
        <div
          data-testid={`chart-resize-handle-${chart.id}`}
          onMouseDown={handleResizeMouseDown}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 12,
            height: 12,
            cursor: "nwse-resize",
            background: "#1a73e8",
            borderRadius: "0 0 4px 0",
          }}
        />
      )}
    </div>
  );
}

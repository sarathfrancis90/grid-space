/**
 * StatusBar — SUM/AVG/COUNT/MIN/MAX of current selection,
 * zoom display, Explore button, collaboration count, right-click customization.
 * S7-016 to S7-017, #186
 */
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useRealtimeStore } from "../../stores/realtimeStore";
import { getCellKey } from "../../utils/coordinates";

type AggregationType = "sum" | "avg" | "count" | "min" | "max";

const AGGREGATION_LABELS: Record<AggregationType, string> = {
  sum: "SUM",
  avg: "AVG",
  count: "COUNT",
  min: "MIN",
  max: "MAX",
};

const DEFAULT_VISIBLE: AggregationType[] = [
  "sum",
  "avg",
  "count",
  "min",
  "max",
];

export function StatusBar() {
  const selections = useUIStore((s) => s.selections);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const sheetCells = useCellStore((s) => s.cells.get(sheetId));
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const setAIAnalysisOpen = useUIStore((s) => s.setAIAnalysisOpen);
  const connectedUsers = useRealtimeStore((s) => s.connectedUsers);
  const connectionStatus = useRealtimeStore((s) => s.connectionStatus);

  const [visibleAggregations, setVisibleAggregations] =
    useState<AggregationType[]>(DEFAULT_VISIBLE);
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const toggleAggregation = useCallback((agg: AggregationType) => {
    setVisibleAggregations((prev) => {
      if (prev.includes(agg)) {
        return prev.filter((a) => a !== agg);
      }
      return [...prev, agg];
    });
  }, []);

  useEffect(() => {
    if (!contextMenuPos) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenuPos(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenuPos]);

  const stats = useMemo(() => {
    if (selections.length === 0) {
      return { sum: 0, avg: 0, count: 0, min: 0, max: 0, numCount: 0 };
    }

    const sel = selections[selections.length - 1];
    const minRow = Math.min(sel.start.row, sel.end.row);
    const maxRow = Math.max(sel.start.row, sel.end.row);
    const minCol = Math.min(sel.start.col, sel.end.col);
    const maxCol = Math.max(sel.start.col, sel.end.col);
    if (!sheetCells) {
      return { sum: 0, avg: 0, count: 0, min: 0, max: 0, numCount: 0 };
    }

    let sum = 0;
    let count = 0;
    let numCount = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = sheetCells.get(getCellKey(r, c));
        if (!cell || cell.value == null || cell.value === "") continue;
        count++;
        const num = Number(cell.value);
        if (!isNaN(num)) {
          sum += num;
          numCount++;
          if (num < min) min = num;
          if (num > max) max = num;
        }
      }
    }

    return {
      sum,
      avg: numCount > 0 ? sum / numCount : 0,
      count,
      min: numCount > 0 ? min : 0,
      max: numCount > 0 ? max : 0,
      numCount,
    };
  }, [selections, sheetId, sheetCells]);

  const isSingleCell =
    selections.length > 0 &&
    selections[0].start.row === selections[0].end.row &&
    selections[0].start.col === selections[0].end.col;

  const showStats = !isSingleCell && stats.count > 0;

  const fmt = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2);
  };

  const collaboratorCount = connectedUsers.length;

  return (
    <div
      data-testid="status-bar"
      className="flex items-center px-4 text-xs text-gray-600 justify-between"
      style={{ padding: "0 16px", fontSize: "12px" }}
      onContextMenu={handleContextMenu}
    >
      {/* Left section: Explore button */}
      <div className="flex items-center gap-2" style={{ gap: "8px" }}>
        <button
          data-testid="status-bar-explore"
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-200 text-gray-600"
          style={{
            padding: "2px 8px",
            borderRadius: "4px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onClick={() => setAIAnalysisOpen(true)}
          title="Explore data"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Explore
        </button>
      </div>

      {/* Center section: Aggregation stats */}
      <div className="flex items-center gap-5" style={{ gap: "20px" }}>
        {showStats ? (
          <>
            {visibleAggregations.includes("sum") && (
              <span
                data-testid="status-sum"
                className="font-medium"
                style={{ fontWeight: 500 }}
              >
                SUM: {fmt(stats.sum)}
              </span>
            )}
            {visibleAggregations.includes("avg") && (
              <span data-testid="status-average">AVG: {fmt(stats.avg)}</span>
            )}
            {visibleAggregations.includes("count") && (
              <span data-testid="status-count">COUNT: {stats.count}</span>
            )}
            {visibleAggregations.includes("min") && (
              <span data-testid="status-min">MIN: {fmt(stats.min)}</span>
            )}
            {visibleAggregations.includes("max") && (
              <span data-testid="status-max">MAX: {fmt(stats.max)}</span>
            )}
          </>
        ) : (
          <span>Ready</span>
        )}
      </div>

      {/* Right section: Collaboration count + Zoom */}
      <div className="flex items-center gap-3" style={{ gap: "12px" }}>
        {connectionStatus === "connected" && collaboratorCount > 0 && (
          <span
            data-testid="status-bar-collaborators"
            className="flex items-center gap-1"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
            title={`${collaboratorCount} collaborator${collaboratorCount !== 1 ? "s" : ""} online`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {collaboratorCount}
          </span>
        )}

        <div
          data-testid="status-bar-zoom"
          className="flex items-center gap-1"
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <button
            data-testid="status-bar-zoom-out"
            className="hover:bg-gray-200 rounded"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "1px 4px",
              borderRadius: "2px",
              fontSize: "14px",
              lineHeight: "1",
            }}
            onClick={() => setZoom(zoom - 10)}
            title="Zoom out"
            disabled={zoom <= 50}
          >
            −
          </button>
          <span
            data-testid="status-bar-zoom-level"
            style={{ minWidth: "36px", textAlign: "center" }}
          >
            {zoom}%
          </span>
          <button
            data-testid="status-bar-zoom-in"
            className="hover:bg-gray-200 rounded"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "1px 4px",
              borderRadius: "2px",
              fontSize: "14px",
              lineHeight: "1",
            }}
            onClick={() => setZoom(zoom + 10)}
            title="Zoom in"
            disabled={zoom >= 200}
          >
            +
          </button>
        </div>
      </div>

      {/* Right-click context menu for toggling aggregations */}
      {contextMenuPos && (
        <div
          ref={contextMenuRef}
          data-testid="status-bar-context-menu"
          className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-50"
          style={{
            position: "fixed",
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            padding: "4px 0",
            zIndex: 9999,
            minWidth: "160px",
          }}
        >
          <div
            style={{
              padding: "4px 12px",
              fontSize: "11px",
              color: "#9ca3af",
              fontWeight: 600,
            }}
          >
            Show in status bar
          </div>
          {(Object.keys(AGGREGATION_LABELS) as AggregationType[]).map((agg) => (
            <button
              key={agg}
              data-testid={`status-bar-toggle-${agg}`}
              className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2"
              style={{
                width: "100%",
                textAlign: "left",
                padding: "4px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
              }}
              onClick={() => toggleAggregation(agg)}
            >
              <span style={{ width: "16px", display: "inline-block" }}>
                {visibleAggregations.includes(agg) ? "✓" : ""}
              </span>
              {AGGREGATION_LABELS[agg]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

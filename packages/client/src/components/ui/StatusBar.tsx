/**
 * StatusBar — SUM/AVG/COUNT/MIN/MAX of current selection,
 * zoom display, Explore button, collaboration count,
 * and right-click customization for aggregation toggles.
 * S7-016 to S7-017
 */
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useRealtimeStore } from "../../stores/realtimeStore";
import { getCellKey } from "../../utils/coordinates";

type AggregationType = "sum" | "avg" | "count" | "min" | "max";

interface AggregationConfig {
  key: AggregationType;
  label: string;
  testId: string;
}

const ALL_AGGREGATIONS: AggregationConfig[] = [
  { key: "sum", label: "SUM", testId: "status-sum" },
  { key: "avg", label: "AVG", testId: "status-average" },
  { key: "count", label: "COUNT", testId: "status-count" },
  { key: "min", label: "MIN", testId: "status-min" },
  { key: "max", label: "MAX", testId: "status-max" },
];

const DEFAULT_VISIBLE: Set<AggregationType> = new Set([
  "sum",
  "avg",
  "count",
  "min",
  "max",
]);

function loadVisibleAggregations(): Set<AggregationType> {
  try {
    const stored = localStorage.getItem("statusbar-aggregations");
    if (stored) {
      const parsed = JSON.parse(stored) as AggregationType[];
      return new Set(parsed);
    }
  } catch {
    // ignore
  }
  return new Set(DEFAULT_VISIBLE);
}

function saveVisibleAggregations(visible: Set<AggregationType>) {
  localStorage.setItem("statusbar-aggregations", JSON.stringify([...visible]));
}

export function StatusBar() {
  const selections = useUIStore((s) => s.selections);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const sheetCells = useCellStore((s) => s.cells.get(sheetId));
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const setAIAnalysisOpen = useUIStore((s) => s.setAIAnalysisOpen);
  const connectedUsers = useRealtimeStore((s) => s.connectedUsers);

  const [visibleAggregations, setVisibleAggregations] = useState<
    Set<AggregationType>
  >(loadVisibleAggregations);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const toggleAggregation = useCallback((key: AggregationType) => {
    setVisibleAggregations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveVisibleAggregations(next);
      return next;
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        closeContextMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu, closeContextMenu]);

  const handleExploreClick = useCallback(() => {
    setAIAnalysisOpen(true);
  }, [setAIAnalysisOpen]);

  const handleZoomOut = useCallback(() => {
    setZoom(zoom - 10);
  }, [setZoom, zoom]);

  const handleZoomIn = useCallback(() => {
    setZoom(zoom + 10);
  }, [setZoom, zoom]);

  const collaboratorCount = connectedUsers.length;

  return (
    <div
      data-testid="status-bar"
      className="flex items-center px-4 text-xs text-gray-600 select-none"
      style={{ padding: "0 16px", fontSize: "12px", height: "24px" }}
      onContextMenu={handleContextMenu}
    >
      {/* Left section: Explore button */}
      <button
        data-testid="status-bar-explore"
        className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-200 text-gray-600 mr-3"
        style={{ fontSize: "12px" }}
        onClick={handleExploreClick}
        title="Open data exploration panel"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Explore</span>
      </button>

      {/* Center section: Aggregations or Ready */}
      <div className="flex items-center gap-5 flex-1" style={{ gap: "20px" }}>
        {showStats ? (
          ALL_AGGREGATIONS.filter((agg) =>
            visibleAggregations.has(agg.key),
          ).map((agg) => (
            <span
              key={agg.key}
              data-testid={agg.testId}
              className={agg.key === "sum" ? "font-medium" : ""}
              style={agg.key === "sum" ? { fontWeight: 500 } : undefined}
            >
              {agg.label}:{" "}
              {agg.key === "count" ? stats.count : fmt(stats[agg.key])}
            </span>
          ))
        ) : (
          <span>Ready</span>
        )}
      </div>

      {/* Right section: Collaboration count + Zoom */}
      <div className="flex items-center gap-3" style={{ gap: "12px" }}>
        {collaboratorCount > 0 && (
          <span
            data-testid="status-bar-collaborators"
            className="flex items-center gap-1 text-gray-500"
            title={`${collaboratorCount} collaborator${collaboratorCount !== 1 ? "s" : ""} online`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
          className="flex items-center gap-1"
          style={{ gap: "4px" }}
          data-testid="status-bar-zoom"
        >
          <button
            data-testid="status-bar-zoom-out"
            className="px-1 rounded hover:bg-gray-200 text-gray-500"
            onClick={handleZoomOut}
            title="Zoom out"
            disabled={zoom <= 50}
          >
            −
          </button>
          <span
            data-testid="status-bar-zoom-level"
            className="text-gray-500 min-w-[36px] text-center"
            style={{ minWidth: "36px", textAlign: "center" }}
          >
            {zoom}%
          </span>
          <button
            data-testid="status-bar-zoom-in"
            className="px-1 rounded hover:bg-gray-200 text-gray-500"
            onClick={handleZoomIn}
            title="Zoom in"
            disabled={zoom >= 200}
          >
            +
          </button>
        </div>
      </div>

      {/* Right-click context menu for toggling aggregations */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          data-testid="status-bar-context-menu"
          className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: "160px",
          }}
        >
          <div
            className="px-3 py-1 text-xs text-gray-400 font-medium"
            style={{ fontSize: "11px" }}
          >
            Show aggregations
          </div>
          {ALL_AGGREGATIONS.map((agg) => (
            <button
              key={agg.key}
              data-testid={`status-bar-toggle-${agg.key}`}
              className="flex items-center gap-2 w-full px-3 py-1 text-left hover:bg-gray-100 text-xs"
              style={{ fontSize: "12px" }}
              onClick={() => toggleAggregation(agg.key)}
            >
              <span
                className="w-4 text-center"
                style={{ width: "16px", textAlign: "center" }}
              >
                {visibleAggregations.has(agg.key) ? "✓" : ""}
              </span>
              {agg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

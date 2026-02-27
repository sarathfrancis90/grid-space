import { useState, useCallback, useMemo } from "react";
import { useViewStore } from "../../stores/viewStore";
import { useSheetData } from "../../hooks/useSheetData";
import { ViewSetupDialog } from "./ViewSetupDialog";

const AUTO_COLORS = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#ff6d01",
  "#46bdc6",
  "#9334e6",
  "#e8710a",
  "#1a73e8",
  "#d93025",
];

const DAY_MS = 86400000;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const LABEL_WIDTH = 200;

interface TimelineItem {
  row: number;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

function parseDate(val: string | number | boolean | null): Date | null {
  if (val == null || val === "") return null;
  const d = new Date(val as string | number);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TimelineView() {
  const config = useViewStore((s) => s.timelineConfig);
  const setConfig = useViewStore((s) => s.setTimelineConfig);
  const setActiveView = useViewStore((s) => s.setActiveView);
  const { headers, rows } = useSheetData();

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    item: TimelineItem;
  } | null>(null);

  const items: TimelineItem[] = useMemo(() => {
    if (!config) return [];
    const result: TimelineItem[] = [];
    let colorIdx = 0;

    for (const row of rows) {
      const startDate = parseDate(row.values[config.startDateCol]);
      if (!startDate) continue;

      const title = String(row.values[config.titleCol] ?? "");
      let endDate: Date | null = null;
      if (config.endDateCol !== null) {
        endDate = parseDate(row.values[config.endDateCol]);
      }
      if (!endDate) {
        endDate = new Date(startDate.getTime() + DAY_MS);
      }

      let color = "";
      if (config.colorCol !== null) {
        color = String(row.values[config.colorCol] ?? "");
      }
      if (!color) {
        color = AUTO_COLORS[colorIdx % AUTO_COLORS.length];
        colorIdx++;
      }

      result.push({ row: row.row, title, startDate, endDate, color });
    }

    return result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [config, rows]);

  const { minDate, maxDate, totalDays, dayLabels } = useMemo(() => {
    if (items.length === 0) {
      const now = new Date();
      return {
        minDate: now,
        maxDate: now,
        totalDays: 1,
        dayLabels: [] as Date[],
      };
    }
    let min = items[0].startDate;
    let max = items[0].endDate;
    for (const item of items) {
      if (item.startDate < min) min = item.startDate;
      if (item.endDate > max) max = item.endDate;
    }
    const padStart = new Date(min.getTime() - DAY_MS * 2);
    const padEnd = new Date(max.getTime() + DAY_MS * 2);
    const days = Math.max(
      1,
      Math.ceil((padEnd.getTime() - padStart.getTime()) / DAY_MS),
    );
    const labels: Date[] = [];
    for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 15))) {
      labels.push(new Date(padStart.getTime() + i * DAY_MS));
    }
    return {
      minDate: padStart,
      maxDate: padEnd,
      totalDays: days,
      dayLabels: labels,
    };
  }, [items]);

  const timelineWidth = Math.max(800, totalDays * 12);

  const getBarStyle = useCallback(
    (item: TimelineItem) => {
      const startOffset =
        ((item.startDate.getTime() - minDate.getTime()) / DAY_MS / totalDays) *
        timelineWidth;
      const duration = Math.max(
        1,
        (item.endDate.getTime() - item.startDate.getTime()) / DAY_MS,
      );
      const width = (duration / totalDays) * timelineWidth;
      return { left: startOffset, width: Math.max(width, 8) };
    },
    [minDate, totalDays, timelineWidth],
  );

  const todayOffset = useMemo(() => {
    const now = new Date();
    if (now < minDate || now > maxDate) return null;
    return (
      ((now.getTime() - minDate.getTime()) / DAY_MS / totalDays) * timelineWidth
    );
  }, [minDate, maxDate, totalDays, timelineWidth]);

  const handleSetup = useCallback(
    (cfg: Record<string, number | null>) => {
      setConfig({
        startDateCol: cfg.startDateCol as number,
        endDateCol: cfg.endDateCol ?? null,
        titleCol: cfg.titleCol as number,
        colorCol: cfg.colorCol ?? null,
      });
    },
    [setConfig],
  );

  if (!config) {
    return (
      <ViewSetupDialog
        viewType="timeline"
        headers={headers}
        onApply={handleSetup}
        onCancel={() => setActiveView("grid")}
      />
    );
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-white"
      data-testid="timeline-view"
    >
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          No items with valid dates found.
        </div>
      ) : (
        <div className="flex flex-1 overflow-auto">
          {/* Row labels */}
          <div
            className="sticky left-0 z-10 flex-shrink-0 bg-white border-r border-gray-200"
            style={{ width: LABEL_WIDTH }}
          >
            <div
              className="border-b border-gray-200 bg-gray-50"
              style={{ height: HEADER_HEIGHT }}
            />
            {items.map((item) => (
              <div
                key={item.row}
                className="flex items-center truncate border-b border-gray-100 px-3 text-xs text-gray-700"
                style={{ height: ROW_HEIGHT, padding: "0 12px" }}
                title={item.title}
              >
                {item.title || `Row ${item.row + 1}`}
              </div>
            ))}
          </div>

          {/* Timeline area */}
          <div className="flex-1 overflow-x-auto">
            <div
              className="relative"
              style={{
                width: timelineWidth,
                minHeight: HEADER_HEIGHT + items.length * ROW_HEIGHT,
              }}
            >
              {/* Time axis header */}
              <div
                className="sticky top-0 z-[5] flex border-b border-gray-200 bg-gray-50"
                style={{ height: HEADER_HEIGHT }}
              >
                {dayLabels.map((d, i) => {
                  const left =
                    ((d.getTime() - minDate.getTime()) / DAY_MS / totalDays) *
                    timelineWidth;
                  return (
                    <div
                      key={i}
                      className="absolute text-[10px] text-gray-500"
                      style={{ left, top: 12 }}
                    >
                      {formatDate(d)}
                    </div>
                  );
                })}
              </div>

              {/* Bars */}
              {items.map((item, idx) => {
                const bar = getBarStyle(item);
                return (
                  <div
                    key={item.row}
                    className="absolute rounded"
                    style={{
                      top: HEADER_HEIGHT + idx * ROW_HEIGHT + 6,
                      left: bar.left,
                      width: bar.width,
                      height: ROW_HEIGHT - 12,
                      backgroundColor: item.color,
                      opacity: 0.85,
                    }}
                    data-testid={`timeline-bar-${item.row}`}
                    onMouseEnter={(e) =>
                      setTooltip({ x: e.clientX, y: e.clientY, item })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}

              {/* Today marker */}
              {todayOffset !== null && (
                <div
                  className="absolute top-0 w-0.5 bg-red-500"
                  style={{
                    left: todayOffset,
                    height: HEADER_HEIGHT + items.length * ROW_HEIGHT,
                  }}
                  data-testid="timeline-today-marker"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[400] rounded bg-gray-800 px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <div className="font-medium">{tooltip.item.title}</div>
          <div className="mt-0.5 text-gray-300">
            {formatDate(tooltip.item.startDate)} —{" "}
            {formatDate(tooltip.item.endDate)}
          </div>
        </div>
      )}
    </div>
  );
}

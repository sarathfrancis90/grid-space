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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarEvent {
  row: number;
  title: string;
  date: Date;
  color: string;
}

function parseDate(val: string | number | boolean | null): Date | null {
  if (val == null || val === "") return null;
  const d = new Date(val as string | number);
  return isNaN(d.getTime()) ? null : d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarView() {
  const config = useViewStore((s) => s.calendarConfig);
  const setConfig = useViewStore((s) => s.setCalendarConfig);
  const setActiveView = useViewStore((s) => s.setActiveView);
  const { headers, rows } = useSheetData();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);

  const events: CalendarEvent[] = useMemo(() => {
    if (!config) return [];
    const result: CalendarEvent[] = [];
    let colorIdx = 0;

    for (const row of rows) {
      const date = parseDate(row.values[config.dateCol]);
      if (!date) continue;

      const title = String(row.values[config.titleCol] ?? "");
      let color = "";
      if (config.colorCol !== null) {
        color = String(row.values[config.colorCol] ?? "");
      }
      if (!color) {
        color = AUTO_COLORS[colorIdx % AUTO_COLORS.length];
        colorIdx++;
      }

      result.push({ row: row.row, title, date, color });
    }
    return result;
  }, [config, rows]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const key = dateKey(evt.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }
    return days;
  }, [viewDate]);

  const goToday = useCallback(() => setViewDate(new Date()), []);
  const goPrev = useCallback(
    () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)),
    [],
  );
  const goNext = useCallback(
    () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)),
    [],
  );

  const handleSetup = useCallback(
    (cfg: Record<string, number | null>) => {
      setConfig({
        dateCol: cfg.dateCol as number,
        titleCol: cfg.titleCol as number,
        colorCol: cfg.colorCol ?? null,
      });
    },
    [setConfig],
  );

  const today = useMemo(() => new Date(), []);
  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (!config) {
    return (
      <ViewSetupDialog
        viewType="calendar"
        headers={headers}
        onApply={handleSetup}
        onCancel={() => setActiveView("grid")}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-white" data-testid="calendar-view">
      {/* Calendar header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="rounded p-1 text-gray-600 hover:bg-gray-100"
            data-testid="calendar-prev"
          >
            &larr;
          </button>
          <span className="min-w-[160px] text-center text-sm font-semibold text-gray-800">
            {monthLabel}
          </span>
          <button
            onClick={goNext}
            className="rounded p-1 text-gray-600 hover:bg-gray-100"
            data-testid="calendar-next"
          >
            &rarr;
          </button>
        </div>
        <button
          onClick={goToday}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
          data-testid="calendar-today-btn"
        >
          Today
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-gray-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr overflow-y-auto">
        {calendarDays.map((day, i) => {
          const key = dateKey(day.date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = sameDay(day.date, today);

          return (
            <div
              key={i}
              className={`relative border-b border-r border-gray-100 p-1 ${
                day.isCurrentMonth ? "bg-white" : "bg-gray-50"
              }`}
              style={{ padding: "4px", minHeight: "80px" }}
              onClick={() => {
                if (dayEvents.length > 0) setExpandedDay(day.date);
              }}
              data-testid={`calendar-day-${day.date.getDate()}-${day.isCurrentMonth ? "current" : "other"}`}
            >
              <div
                className={`mb-0.5 text-xs font-medium ${
                  isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#1a73e8] text-white"
                    : day.isCurrentMonth
                      ? "text-gray-700"
                      : "text-gray-400"
                }`}
                style={isToday ? { width: "20px", height: "20px" } : undefined}
              >
                {day.date.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.row}
                    className="truncate rounded px-1 text-[10px] text-white"
                    style={{ backgroundColor: evt.color }}
                    title={evt.title}
                  >
                    {evt.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded day popup */}
      {expandedDay && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/20"
          onClick={() => setExpandedDay(null)}
          data-testid="calendar-day-popup-backdrop"
        >
          <div
            className="w-[320px] rounded-lg bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="calendar-day-popup"
          >
            <h4 className="mb-2 text-sm font-semibold text-gray-800">
              {expandedDay.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h4>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {(eventsByDate.get(dateKey(expandedDay)) ?? []).map((evt) => (
                <div
                  key={evt.row}
                  className="flex items-center gap-2 rounded p-2 hover:bg-gray-50"
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: evt.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {evt.title || `Row ${evt.row + 1}`}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400">
                    R{evt.row + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

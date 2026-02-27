import { useState, useCallback, useMemo } from "react";
import { useViewStore } from "../../stores/viewStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
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

interface KanbanCard {
  row: number;
  title: string;
  desc: string;
  color: string;
  status: string;
}

interface Lane {
  name: string;
  cards: KanbanCard[];
}

export function KanbanView() {
  const config = useViewStore((s) => s.kanbanConfig);
  const setConfig = useViewStore((s) => s.setKanbanConfig);
  const setActiveView = useViewStore((s) => s.setActiveView);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const { headers, rows } = useSheetData();

  const [dragRow, setDragRow] = useState<number | null>(null);

  const lanes: Lane[] = useMemo(() => {
    if (!config) return [];
    const laneMap = new Map<string, KanbanCard[]>();
    const colorMap = new Map<string, string>();
    let colorIdx = 0;

    for (const row of rows) {
      const status = String(row.values[config.statusCol] ?? "");
      if (!status) continue;
      const title = String(row.values[config.titleCol] ?? "");
      const desc =
        config.descCol !== null ? String(row.values[config.descCol] ?? "") : "";

      let color = "";
      if (config.colorCol !== null) {
        color = String(row.values[config.colorCol] ?? "");
      }
      if (!color) {
        if (!colorMap.has(status)) {
          colorMap.set(status, AUTO_COLORS[colorIdx % AUTO_COLORS.length]);
          colorIdx++;
        }
        color = colorMap.get(status) ?? AUTO_COLORS[0];
      }

      if (!laneMap.has(status)) {
        laneMap.set(status, []);
      }
      laneMap.get(status)!.push({ row: row.row, title, desc, color, status });
    }

    return Array.from(laneMap.entries()).map(([name, cards]) => ({
      name,
      cards,
    }));
  }, [config, rows]);

  const handleDragStart = useCallback((e: React.DragEvent, row: number) => {
    setDragRow(row);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(row));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetLane: string) => {
      e.preventDefault();
      if (dragRow === null || !config) return;

      const { getCell, setCell } = useCellStore.getState();
      const currentCell = getCell(sheetId, dragRow, config.statusCol);
      const currentStatus =
        currentCell?.value != null ? String(currentCell.value) : "";
      if (currentStatus === targetLane) {
        setDragRow(null);
        return;
      }

      setCell(sheetId, dragRow, config.statusCol, {
        ...currentCell,
        value: targetLane,
      });
      setDragRow(null);
    },
    [dragRow, config, sheetId],
  );

  const handleSetup = useCallback(
    (cfg: Record<string, number | null>) => {
      setConfig({
        statusCol: cfg.statusCol as number,
        titleCol: cfg.titleCol as number,
        descCol: cfg.descCol ?? null,
        colorCol: cfg.colorCol ?? null,
      });
    },
    [setConfig],
  );

  if (!config) {
    return (
      <ViewSetupDialog
        viewType="kanban"
        headers={headers}
        onApply={handleSetup}
        onCancel={() => setActiveView("grid")}
      />
    );
  }

  return (
    <div
      className="flex h-full gap-4 overflow-x-auto bg-gray-50 p-4"
      style={{ padding: "16px", gap: "16px" }}
      data-testid="kanban-view"
    >
      {lanes.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          No data to display. Add rows with status values in your sheet.
        </div>
      )}
      {lanes.map((lane) => (
        <div
          key={lane.name}
          className="flex w-[280px] flex-shrink-0 flex-col rounded-lg bg-gray-100"
          style={{ width: "280px" }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, lane.name)}
          data-testid={`kanban-lane-${lane.name}`}
        >
          <div
            className="flex items-center justify-between rounded-t-lg px-3 py-2"
            style={{ padding: "8px 12px" }}
          >
            <span className="text-sm font-semibold text-gray-700">
              {lane.name}
            </span>
            <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs text-gray-600">
              {lane.cards.length}
            </span>
          </div>
          <div
            className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
            style={{ padding: "8px", gap: "8px" }}
          >
            {lane.cards.length === 0 && (
              <div className="py-4 text-center text-xs text-gray-400">
                No items in this lane
              </div>
            )}
            {lane.cards.map((card) => (
              <div
                key={card.row}
                draggable
                onDragStart={(e) => handleDragStart(e, card.row)}
                className="cursor-grab rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                style={{
                  padding: "12px",
                  borderLeft: `4px solid ${card.color}`,
                }}
                data-testid={`kanban-card-${card.row}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {card.title || "(untitled)"}
                  </span>
                  <span className="ml-2 flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                    R{card.row + 1}
                  </span>
                </div>
                {card.desc && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {card.desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

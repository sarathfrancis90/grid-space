import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTableStore } from "../../stores/tableStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import type { TableStylePreset } from "../../types/grid";
import { getTableStyleColors } from "../../utils/structuredRef";

interface TableManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STYLE_PRESETS: { value: TableStylePreset; label: string }[] = [
  { value: "blue-medium-1", label: "Blue Medium 1" },
  { value: "blue-medium-2", label: "Blue Medium 2" },
  { value: "green-medium-1", label: "Green Medium 1" },
  { value: "green-medium-2", label: "Green Medium 2" },
  { value: "orange-medium-1", label: "Orange Medium 1" },
  { value: "orange-medium-2", label: "Orange Medium 2" },
  { value: "grey-medium-1", label: "Grey Medium 1" },
  { value: "grey-medium-2", label: "Grey Medium 2" },
  { value: "purple-medium-1", label: "Purple Medium 1" },
  { value: "red-medium-1", label: "Red Medium 1" },
];

export function TableManager({ isOpen, onClose }: TableManagerProps) {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const tables = useTableStore(useShallow((s) => s.getTablesForSheet(sheetId)));
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedTable = selectedTableId
    ? useTableStore.getState().getTable(selectedTableId)
    : null;

  const handleDelete = (tableId: string) => {
    useTableStore.getState().deleteTable(tableId);
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }
  };

  const handleStyleChange = (preset: TableStylePreset) => {
    if (!selectedTableId) return;
    useTableStore.getState().setStylePreset(selectedTableId, preset);
  };

  const handleToggleBandedRows = () => {
    if (!selectedTable) return;
    useTableStore
      .getState()
      .setShowBandedRows(selectedTable.id, !selectedTable.showBandedRows);
  };

  const handleToggleBandedCols = () => {
    if (!selectedTable) return;
    useTableStore
      .getState()
      .setShowBandedCols(selectedTable.id, !selectedTable.showBandedCols);
  };

  const handleToggleTotalRow = () => {
    if (!selectedTable) return;
    useTableStore
      .getState()
      .setShowTotalRow(selectedTable.id, !selectedTable.showTotalRow);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      data-testid="table-manager-overlay"
    >
      <div
        className="w-[520px] rounded-lg bg-white p-6 shadow-xl"
        data-testid="table-manager-dialog"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Table Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="table-manager-close"
          >
            &times;
          </button>
        </div>

        {tables.length === 0 ? (
          <p
            className="py-8 text-center text-gray-500"
            data-testid="no-tables-message"
          >
            No tables in this sheet. Select a range and use Insert &gt; Table to
            create one.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="max-h-48 overflow-y-auto rounded border">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                    selectedTableId === table.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedTableId(table.id)}
                  data-testid={`table-item-${table.id}`}
                >
                  <div>
                    <span className="font-medium">{table.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {table.columns.length} cols,{" "}
                      {table.endRow - table.startRow + 1} rows
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(table.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                    data-testid={`delete-table-${table.id}`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {selectedTable && (
              <div
                className="space-y-3 rounded border p-3"
                data-testid="table-options"
              >
                <h3 className="text-sm font-semibold text-gray-700">
                  Table Options: {selectedTable.name}
                </h3>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTable.showBandedRows}
                    onChange={handleToggleBandedRows}
                    data-testid="toggle-banded-rows"
                  />
                  Banded Rows
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTable.showBandedCols}
                    onChange={handleToggleBandedCols}
                    data-testid="toggle-banded-cols"
                  />
                  Banded Columns
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTable.showTotalRow}
                    onChange={handleToggleTotalRow}
                    data-testid="toggle-total-row"
                  />
                  Total Row
                </label>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    Style Preset
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((preset) => {
                      const colors = getTableStyleColors(preset.value);
                      return (
                        <button
                          key={preset.value}
                          title={preset.label}
                          onClick={() => handleStyleChange(preset.value)}
                          className={`h-6 w-6 rounded border-2 ${
                            selectedTable.stylePreset === preset.value
                              ? "border-blue-500"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: colors.headerBg }}
                          data-testid={`style-preset-${preset.value}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
            data-testid="table-manager-done"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

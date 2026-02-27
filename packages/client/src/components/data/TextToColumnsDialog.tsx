/**
 * TextToColumnsDialog — split text in a source column by a delimiter
 * and write results to adjacent columns.
 */
import { useState, useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { useHistoryStore } from "../../stores/historyStore";

type DelimiterType = "comma" | "tab" | "semicolon" | "space" | "custom";

const DELIMITER_MAP: Record<Exclude<DelimiterType, "custom">, string> = {
  comma: ",",
  tab: "\t",
  semicolon: ";",
  space: " ",
};

export function TextToColumnsDialog() {
  const isOpen = useUIStore((s) => s.isTextToColumnsDialogOpen);
  const close = useUIStore((s) => s.setTextToColumnsDialogOpen);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const selections = useUIStore((s) => s.selections);

  const [delimiterType, setDelimiterType] = useState<DelimiterType>("comma");
  const [customDelimiter, setCustomDelimiter] = useState("");

  const delimiter =
    delimiterType === "custom" ? customDelimiter : DELIMITER_MAP[delimiterType];

  // Get source column data from selection
  const sourceData = useMemo(() => {
    if (!sheetId || selections.length === 0) return [];
    const sel = selections[selections.length - 1];
    const col = Math.min(sel.start.col, sel.end.col);
    const startRow = Math.min(sel.start.row, sel.end.row);
    const endRow = Math.max(sel.start.row, sel.end.row);
    const cellStore = useCellStore.getState();
    const data: { row: number; value: string }[] = [];
    for (let r = startRow; r <= endRow; r++) {
      const cell = cellStore.getCell(sheetId, r, col);
      data.push({ row: r, value: String(cell?.value ?? "") });
    }
    return data;
  }, [sheetId, selections]);

  // Preview split
  const preview = useMemo(() => {
    if (!delimiter) return sourceData.map((d) => [d.value]);
    return sourceData.map((d) => d.value.split(delimiter));
  }, [sourceData, delimiter]);

  const maxCols = useMemo(
    () => preview.reduce((max, row) => Math.max(max, row.length), 0),
    [preview],
  );

  if (!isOpen) return null;

  const handleApply = () => {
    if (!sheetId || selections.length === 0 || !delimiter) return;
    const sel = selections[selections.length - 1];
    const srcCol = Math.min(sel.start.col, sel.end.col);

    useHistoryStore.getState().pushUndo();
    const cellStore = useCellStore.getState();

    for (let i = 0; i < sourceData.length; i++) {
      const parts = sourceData[i].value.split(delimiter);
      const row = sourceData[i].row;
      for (let j = 0; j < parts.length; j++) {
        const val = parts[j].trim();
        const numVal = Number(val);
        cellStore.setCell(sheetId, row, srcCol + j, {
          value: val !== "" && !isNaN(numVal) ? numVal : val,
        });
      }
    }

    close(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      data-testid="text-to-columns-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "440px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="text-to-columns-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Text to Columns
        </h2>

        {/* Delimiter selection */}
        <div style={{ marginBottom: "16px" }}>
          <p
            className="text-sm font-medium mb-2"
            style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}
          >
            Separator
          </p>
          {(
            [
              ["comma", "Comma (,)"],
              ["tab", "Tab"],
              ["semicolon", "Semicolon (;)"],
              ["space", "Space"],
              ["custom", "Custom"],
            ] as [DelimiterType, string][]
          ).map(([type, label]) => (
            <label
              key={type}
              className="flex items-center gap-2 py-0.5 cursor-pointer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "2px 0",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="delimiter"
                checked={delimiterType === type}
                onChange={() => setDelimiterType(type)}
                data-testid={`delimiter-${type}`}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          {delimiterType === "custom" && (
            <input
              type="text"
              value={customDelimiter}
              onChange={(e) => setCustomDelimiter(e.target.value)}
              placeholder="Enter delimiter"
              maxLength={5}
              className="mt-1 px-2 py-1 text-sm border border-gray-300 rounded w-32"
              style={{
                marginTop: "4px",
                padding: "4px 8px",
                fontSize: "13px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "128px",
              }}
              data-testid="custom-delimiter-input"
            />
          )}
        </div>

        {/* Preview */}
        <div style={{ marginBottom: "16px" }}>
          <p
            className="text-sm font-medium mb-2"
            style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}
          >
            Preview ({maxCols} column{maxCols !== 1 ? "s" : ""})
          </p>
          <div
            style={{
              maxHeight: "160px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <tbody>
                {preview.slice(0, 10).map((row, ri) => (
                  <tr
                    key={ri}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "4px 8px",
                          borderRight: "1px solid #f3f4f6",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="flex justify-end gap-2"
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
            data-testid="text-to-columns-cancel"
            onClick={() => close(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "4px",
            }}
            data-testid="text-to-columns-apply"
            onClick={handleApply}
          >
            Split
          </button>
        </div>
      </div>
    </div>
  );
}

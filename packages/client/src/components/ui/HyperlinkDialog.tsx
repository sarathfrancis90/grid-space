/**
 * HyperlinkDialog — insert/edit hyperlinks on cells.
 * S7-021 to S7-022
 */
import { useState, useCallback, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

export function HyperlinkDialog() {
  const isOpen = useUIStore((s) => s.isHyperlinkDialogOpen);
  const selectedCell = useUIStore((s) => s.selectedCell);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (isOpen && selectedCell) {
      const cell = useCellStore
        .getState()
        .getCell(sheetId, selectedCell.row, selectedCell.col);
      if (cell?.hyperlink) {
        setUrl(cell.hyperlink.url);
        setLabel(cell.hyperlink.label ?? "");
      } else {
        setUrl("");
        setLabel(String(cell?.value ?? ""));
      }
    }
  }, [isOpen, selectedCell, sheetId]);

  const handleApply = useCallback(() => {
    if (!selectedCell || !url.trim()) return;
    const cs = useCellStore.getState();
    const existing = cs.getCell(sheetId, selectedCell.row, selectedCell.col);
    cs.setCell(sheetId, selectedCell.row, selectedCell.col, {
      value: label.trim() || url.trim(),
      formula: existing?.formula,
      format: existing?.format,
      comment: existing?.comment,
      hyperlink: { url: url.trim(), label: label.trim() || undefined },
      image: existing?.image,
      note: existing?.note,
    });
    useUIStore.getState().setHyperlinkDialogOpen(false);
  }, [selectedCell, sheetId, url, label]);

  const handleRemove = useCallback(() => {
    if (!selectedCell) return;
    const cs = useCellStore.getState();
    const existing = cs.getCell(sheetId, selectedCell.row, selectedCell.col);
    if (existing) {
      cs.setCell(sheetId, selectedCell.row, selectedCell.col, {
        value: existing.value,
        formula: existing.formula,
        format: existing.format,
        comment: existing.comment,
        hyperlink: undefined,
        image: existing.image,
        note: existing.note,
      });
    }
    useUIStore.getState().setHyperlinkDialogOpen(false);
  }, [selectedCell, sheetId]);

  const handleClose = useCallback(() => {
    useUIStore.getState().setHyperlinkDialogOpen(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      data-testid="hyperlink-dialog-overlay"
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        data-testid="hyperlink-dialog"
        className="bg-white rounded-lg shadow-xl w-96 p-6"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "384px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Insert Link
        </h2>
        <div className="space-y-3">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Text to display
            </label>
            <input
              data-testid="hyperlink-label"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
              }}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Link text"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              URL
            </label>
            <input
              data-testid="hyperlink-url"
              type="url"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
              }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
        <div
          className="flex justify-between mt-6"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "24px",
          }}
        >
          <button
            data-testid="hyperlink-remove"
            className="text-sm text-red-500 hover:underline"
            style={{ fontSize: "14px" }}
            onClick={handleRemove}
            type="button"
          >
            Remove link
          </button>
          <div className="flex gap-2" style={{ display: "flex", gap: "8px" }}>
            <button
              data-testid="hyperlink-cancel"
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
            <button
              data-testid="hyperlink-apply"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "4px",
              }}
              onClick={handleApply}
              disabled={!url.trim()}
              type="button"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HyperlinkCell — renders a cell value as a clickable blue underline link.
 * S7-022: click to open link in new tab.
 */
export function HyperlinkCell({ url, label }: { url: string; label?: string }) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [url],
  );

  return (
    <span
      data-testid="hyperlink-cell"
      className="text-blue-600 underline cursor-pointer hover:text-blue-800"
      onClick={handleClick}
      title={url}
    >
      {label || url}
    </span>
  );
}

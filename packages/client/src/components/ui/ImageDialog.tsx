/**
 * ImageDialog — insert image by URL into a cell.
 * S7-023
 */
import { useState, useCallback, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

export function ImageDialog() {
  const isOpen = useUIStore((s) => s.isImageDialogOpen);
  const selectedCell = useUIStore((s) => s.selectedCell);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");

  useEffect(() => {
    if (isOpen && selectedCell) {
      const cell = useCellStore
        .getState()
        .getCell(sheetId, selectedCell.row, selectedCell.col);
      if (cell?.image) {
        setImageUrl(cell.image.url);
        setAltText(cell.image.alt ?? "");
      } else {
        setImageUrl("");
        setAltText("");
      }
    }
  }, [isOpen, selectedCell, sheetId]);

  const handleInsert = useCallback(() => {
    if (!selectedCell || !imageUrl.trim()) return;
    const cs = useCellStore.getState();
    const existing = cs.getCell(sheetId, selectedCell.row, selectedCell.col);
    cs.setCell(sheetId, selectedCell.row, selectedCell.col, {
      value: existing?.value ?? null,
      formula: existing?.formula,
      format: existing?.format,
      comment: existing?.comment,
      hyperlink: existing?.hyperlink,
      image: { url: imageUrl.trim(), alt: altText.trim() || undefined },
      note: existing?.note,
    });
    useUIStore.getState().setImageDialogOpen(false);
  }, [selectedCell, sheetId, imageUrl, altText]);

  const handleClose = useCallback(() => {
    useUIStore.getState().setImageDialogOpen(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      data-testid="image-dialog-overlay"
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
        data-testid="image-dialog"
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
          Insert Image
        </h2>
        <div className="space-y-3">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Image URL
            </label>
            <input
              data-testid="image-url-input"
              type="url"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
              }}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Alt text (optional)
            </label>
            <input
              data-testid="image-alt-input"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
              }}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Description of image"
            />
          </div>
          {imageUrl.trim() && (
            <div
              className="border border-gray-200 rounded p-2"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                padding: "8px",
              }}
            >
              <img
                src={imageUrl}
                alt={altText || "Preview"}
                className="max-w-full max-h-32 object-contain mx-auto"
                style={{
                  maxWidth: "100%",
                  maxHeight: "128px",
                  objectFit: "contain",
                  margin: "0 auto",
                  display: "block",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
        <div
          className="flex justify-end gap-2 mt-6"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          <button
            data-testid="image-cancel"
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
            data-testid="image-insert"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "4px",
            }}
            onClick={handleInsert}
            disabled={!imageUrl.trim()}
            type="button"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

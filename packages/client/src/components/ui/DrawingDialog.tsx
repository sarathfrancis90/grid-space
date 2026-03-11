/**
 * DrawingDialog — placeholder dialog for the Insert > Drawing feature.
 * Opens a canvas area where users can create shapes and diagrams.
 * Currently a stub that shows a placeholder message.
 */
import { useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";

export function DrawingDialog() {
  const isOpen = useUIStore((s) => s.isDrawingDialogOpen);

  const handleClose = useCallback(() => {
    useUIStore.getState().setDrawingDialogOpen(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      data-testid="drawing-dialog-overlay"
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
        data-testid="drawing-dialog"
        className="bg-white rounded-lg shadow-xl p-6"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "480px",
          minHeight: "320px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Insert Drawing
        </h2>
        <div
          className="flex-1 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400"
          style={{
            flex: 1,
            border: "2px dashed #d1d5db",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            minHeight: "200px",
          }}
          data-testid="drawing-canvas-placeholder"
        >
          Drawing canvas coming soon
        </div>
        <div
          className="flex justify-end gap-2 mt-4"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <button
            data-testid="drawing-cancel"
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

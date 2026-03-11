/**
 * AboutDialog — shows version info, credits, and links for GridSpace.
 */
import { useCallback, useEffect } from "react";

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      data-testid="about-dialog-overlay"
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="about-dialog"
        style={{ maxWidth: "420px", borderRadius: "12px" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-gray-200 px-6 py-4"
          style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}
        >
          <h2
            className="text-lg font-semibold text-gray-900"
            style={{ fontSize: "18px", fontWeight: 600 }}
          >
            About GridSpace
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="about-dialog-close"
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
            }}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5" style={{ padding: "20px 24px" }}>
          <div
            className="flex items-center gap-3 mb-4"
            style={{ marginBottom: "16px" }}
          >
            <div
              className="flex items-center justify-center rounded-lg bg-green-100"
              style={{ width: "48px", height: "48px", borderRadius: "8px" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 3v18" />
              </svg>
            </div>
            <div>
              <h3
                className="text-base font-semibold text-gray-900"
                style={{ fontSize: "16px", fontWeight: 600 }}
              >
                GridSpace
              </h3>
              <p
                className="text-sm text-gray-500"
                style={{ fontSize: "13px", color: "#6b7280" }}
                data-testid="about-dialog-version"
              >
                Version 1.0.0
              </p>
            </div>
          </div>

          <p
            className="text-sm text-gray-600 mb-4"
            style={{
              fontSize: "13px",
              lineHeight: "1.5",
              color: "#4b5563",
              marginBottom: "16px",
            }}
          >
            A production-ready spreadsheet application. Full-featured grid
            editing, formulas, charts, real-time collaboration, and more.
          </p>

          <div
            className="text-sm text-gray-500 space-y-1"
            style={{ fontSize: "12px", color: "#6b7280" }}
          >
            <p>Built with React, TypeScript, and Canvas</p>
            <p>Licensed under MIT</p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end border-t border-gray-200 px-6 py-3"
          style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb" }}
        >
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            data-testid="about-dialog-ok"
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              borderRadius: "6px",
              fontWeight: 500,
            }}
            type="button"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

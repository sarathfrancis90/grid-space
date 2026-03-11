/**
 * WhatsNewDialog — shows changelog / release notes for GridSpace.
 */
import { useCallback, useEffect } from "react";

interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
}

const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.0.0",
    date: "2026-03-01",
    changes: [
      "Full spreadsheet grid with Canvas rendering",
      "Formula engine with 80+ functions",
      "Real-time collaboration with CRDT sync",
      "Charts: bar, line, pie, scatter, area, doughnut, radar",
      "CSV and XLSX import/export",
      "Version history with diff view",
      "Sharing with role-based permissions",
      "Conditional formatting and data validation",
      "Keyboard shortcuts (Google Sheets parity)",
      "Dark mode and theme support",
    ],
  },
];

interface WhatsNewDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsNewDialog({ isOpen, onClose }: WhatsNewDialogProps) {
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
      data-testid="whats-new-dialog-overlay"
    >
      <div
        className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="whats-new-dialog"
        style={{ maxHeight: "80vh", maxWidth: "520px", borderRadius: "12px" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4"
          style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}
        >
          <h2
            className="text-lg font-semibold text-gray-900"
            style={{ fontSize: "18px", fontWeight: 600 }}
          >
            {"What's new"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="whats-new-dialog-close"
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
          {RELEASE_NOTES.map((release) => (
            <div
              key={release.version}
              className="mb-6"
              style={{ marginBottom: "24px" }}
            >
              <div
                className="flex items-baseline gap-3 mb-2"
                style={{ marginBottom: "8px" }}
              >
                <span
                  className="text-sm font-semibold text-gray-900"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  v{release.version}
                </span>
                <span
                  className="text-xs text-gray-400"
                  style={{ fontSize: "12px", color: "#9ca3af" }}
                >
                  {release.date}
                </span>
              </div>
              <ul
                className="space-y-1.5"
                style={{ paddingLeft: "16px", listStyleType: "disc" }}
              >
                {release.changes.map((change, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600"
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: "#4b5563",
                    }}
                  >
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

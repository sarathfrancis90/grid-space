/**
 * WhatsNewDialog — Shows changelog / release notes for GridSpace.
 */

interface WhatsNewDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ReleaseEntry {
  version: string;
  date: string;
  changes: string[];
}

const RELEASES: ReleaseEntry[] = [
  {
    version: "0.1.0",
    date: "2026-03-11",
    changes: [
      "Canvas-based grid with virtual scrolling",
      "Formula engine with 80+ functions",
      "Cell formatting, borders, and merge",
      "Charts with Chart.js (7 chart types)",
      "CSV/XLSX import and export",
      "Multi-sheet support with tabs",
      "Real-time collaboration with CRDT sync",
      "Version history with diff view",
      "Share dialog with role-based permissions",
      "Keyboard shortcuts and accessibility",
    ],
  },
];

export function WhatsNewDialog({ open, onClose }: WhatsNewDialogProps) {
  if (!open) return null;

  return (
    <div
      data-testid="whats-new-dialog-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        data-testid="whats-new-dialog"
        className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            What&apos;s New
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recent updates and improvements
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {RELEASES.map((release) => (
            <div key={release.version} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  v{release.version}
                </span>
                <span className="text-xs text-gray-400">{release.date}</span>
              </div>
              <ul className="space-y-1">
                {release.changes.map((change, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-600 flex items-start gap-2"
                  >
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-end p-4 pt-2 border-t border-gray-100">
          <button
            data-testid="whats-new-dialog-close"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

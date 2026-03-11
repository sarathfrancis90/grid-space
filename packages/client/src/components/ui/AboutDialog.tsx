/**
 * AboutDialog — Shows version info and credits for GridSpace.
 */

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  if (!open) return null;

  return (
    <div
      data-testid="about-dialog-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        data-testid="about-dialog"
        className="bg-white rounded-xl shadow-2xl w-[400px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="white" />
              <rect x="14" y="3" width="7" height="7" rx="1" fill="white" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="white" />
              <rect x="14" y="14" width="7" height="7" rx="1" fill="white" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">GridSpace</h2>
            <p className="text-sm text-gray-500">Version 0.1.0</p>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-2 mb-5">
          <p>A production-ready spreadsheet application.</p>
          <p>
            Built with React, TypeScript, and Canvas rendering for
            high-performance editing and real-time collaboration.
          </p>
        </div>

        <div className="text-xs text-gray-400 mb-5">
          <p>&copy; {new Date().getFullYear()} GridSpace Contributors</p>
        </div>

        <div className="flex justify-end">
          <button
            data-testid="about-dialog-close"
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

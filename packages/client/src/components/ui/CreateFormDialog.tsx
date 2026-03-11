/**
 * CreateFormDialog — placeholder dialog for form creation.
 */
import { useUIStore } from "../../stores/uiStore";

export function CreateFormDialog() {
  const isOpen = useUIStore((s) => s.isCreateFormDialogOpen);

  if (!isOpen) return null;

  const handleClose = () => {
    useUIStore.getState().setCreateFormDialogOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
      data-testid="create-form-dialog-backdrop"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="create-form-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create a form</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="create-form-dialog-close"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p
            className="text-sm text-gray-600"
            data-testid="create-form-dialog-message"
          >
            Form creation is coming soon. This feature will allow you to create
            forms linked to your spreadsheet data.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-3">
          <button
            onClick={handleClose}
            className="rounded-lg bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white hover:bg-[#1765cc]"
            data-testid="create-form-dialog-ok"
            type="button"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AddOnsDialog — placeholder dialog for the Add-ons marketplace.
 * Displays a "coming soon" message since add-ons are not yet implemented.
 */
import { useUIStore } from "../../stores/uiStore";

export function AddOnsDialog() {
  const isOpen = useUIStore((s) => s.isAddOnsDialogOpen);
  const close = useUIStore((s) => s.setAddOnsDialogOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="addons-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        data-testid="addons-dialog"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add-ons</h2>
          <button
            onClick={() => close(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="addons-dialog-close"
            type="button"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <svg
              className="h-6 w-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3
            className="text-base font-medium text-gray-900"
            data-testid="addons-dialog-title"
          >
            Add-ons Marketplace
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            The add-ons marketplace is coming soon. You will be able to browse
            and install extensions to enhance your spreadsheet experience.
          </p>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-3">
          <button
            onClick={() => close(false)}
            className="rounded bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
            data-testid="addons-dialog-ok"
            type="button"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

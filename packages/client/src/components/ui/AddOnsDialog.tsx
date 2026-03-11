/**
 * AddOnsDialog — placeholder dialog for the Add-ons feature.
 * Shows a message that add-ons are not yet available.
 */
import { useUIStore } from "../../stores/uiStore";

export function AddOnsDialog() {
  const isOpen = useUIStore((s) => s.isAddOnsDialogOpen);
  const close = useUIStore((s) => s.setAddOnsDialogOpen);

  if (!isOpen) return null;

  return (
    <div
      data-testid="addons-dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={() => close(false)}
    >
      <div
        data-testid="addons-dialog"
        className="bg-white rounded-lg shadow-2xl w-[480px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Add-ons</h2>
          <button
            data-testid="addons-dialog-close"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={() => close(false)}
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">&#x1F9E9;</div>
          <p className="text-gray-600 text-sm">
            Add-ons are not yet available. This feature is coming soon.
          </p>
        </div>
        <div className="flex justify-end px-6 py-3 border-t border-gray-200">
          <button
            data-testid="addons-dialog-ok"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            onClick={() => close(false)}
            type="button"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

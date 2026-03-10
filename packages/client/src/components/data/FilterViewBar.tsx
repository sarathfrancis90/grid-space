/**
 * FilterViewBar — Dark header bar shown when a filter view is active.
 * Displays the active filter view name with save/rename/close controls.
 */
import { useState, useCallback } from "react";
import { useFilterStore } from "../../stores/filterStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

export function FilterViewBar() {
  const activeFilterViewId = useFilterStore((s) => s.activeFilterViewId);
  const filterViews = useFilterStore((s) => s.filterViews);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const activeView = activeFilterViewId
    ? filterViews.get(activeSheetId)?.find((v) => v.id === activeFilterViewId)
    : null;

  const handleSave = useCallback(() => {
    if (activeFilterViewId) {
      useFilterStore
        .getState()
        .saveFilterView(activeSheetId, activeFilterViewId);
    }
  }, [activeSheetId, activeFilterViewId]);

  const handleClose = useCallback(() => {
    useFilterStore.getState().deactivateFilterView();
  }, []);

  const handleDelete = useCallback(() => {
    if (activeFilterViewId) {
      useFilterStore
        .getState()
        .deleteFilterView(activeSheetId, activeFilterViewId);
    }
  }, [activeSheetId, activeFilterViewId]);

  const handleStartRename = useCallback(() => {
    if (activeView) {
      setRenameValue(activeView.name);
      setIsRenaming(true);
    }
  }, [activeView]);

  const handleFinishRename = useCallback(() => {
    if (activeFilterViewId && renameValue.trim()) {
      useFilterStore
        .getState()
        .renameFilterView(
          activeSheetId,
          activeFilterViewId,
          renameValue.trim(),
        );
    }
    setIsRenaming(false);
  }, [activeSheetId, activeFilterViewId, renameValue]);

  if (!activeView) return null;

  return (
    <div
      data-testid="filter-view-bar"
      className="flex items-center gap-3 bg-[#3c4043] px-4 py-1.5 text-white text-[13px]"
      style={{ padding: "6px 16px", gap: "12px" }}
    >
      <span className="text-gray-300 text-[11px] uppercase tracking-wide mr-1">
        Filter view:
      </span>

      {isRenaming ? (
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleFinishRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFinishRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          autoFocus
          className="rounded border border-gray-500 bg-[#535659] px-2 py-0.5 text-white text-[13px] outline-none focus:border-blue-400"
          style={{ padding: "2px 8px" }}
          data-testid="filter-view-rename-input"
        />
      ) : (
        <button
          onClick={handleStartRename}
          className="font-medium hover:underline cursor-pointer"
          data-testid="filter-view-name"
          title="Click to rename"
        >
          {activeView.name}
        </button>
      )}

      <div className="ml-auto flex items-center gap-2" style={{ gap: "8px" }}>
        <button
          onClick={handleSave}
          className="rounded px-2 py-0.5 text-[12px] text-gray-300 hover:bg-[#535659] hover:text-white transition-colors"
          style={{ padding: "2px 8px" }}
          data-testid="filter-view-save"
          title="Save filter view"
        >
          Save
        </button>
        <button
          onClick={handleDelete}
          className="rounded px-2 py-0.5 text-[12px] text-gray-300 hover:bg-[#535659] hover:text-white transition-colors"
          style={{ padding: "2px 8px" }}
          data-testid="filter-view-delete"
          title="Delete filter view"
        >
          Delete
        </button>
        <button
          onClick={handleClose}
          className="rounded p-0.5 text-gray-300 hover:bg-[#535659] hover:text-white transition-colors"
          style={{ padding: "2px" }}
          data-testid="filter-view-close"
          title="Close filter view"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

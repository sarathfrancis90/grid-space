/**
 * FilterViewBar — Dark header bar displayed when a filter view is active.
 * Shows the filter view name with save/rename/close controls.
 */
import { useState, useCallback } from "react";
import { useFilterStore } from "../../stores/filterStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

export function FilterViewBar() {
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const activeFilterViewId = useFilterStore(
    (s) => s.activeFilterViewId.get(activeSheetId) ?? null,
  );
  const filterViews = useFilterStore(
    (s) => s.filterViews.get(activeSheetId) ?? [],
  );
  const activeView = filterViews.find((v) => v.id === activeFilterViewId);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const handleClose = useCallback(() => {
    useFilterStore.getState().deactivateFilterView(activeSheetId);
  }, [activeSheetId]);

  const handleSave = useCallback(() => {
    useFilterStore.getState().saveActiveFilterView(activeSheetId);
  }, [activeSheetId]);

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
        .updateFilterView(
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
      className="flex items-center gap-3 px-4 py-1.5 bg-gray-800 text-white text-[13px]"
      style={{ height: "32px" }}
    >
      <span className="text-gray-400 text-[11px] uppercase tracking-wide">
        Filter view:
      </span>

      {isRenaming ? (
        <input
          data-testid="filter-view-rename-input"
          className="bg-gray-700 text-white px-2 py-0.5 rounded text-[13px] border border-gray-600 outline-none focus:border-blue-400"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleFinishRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFinishRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          autoFocus
        />
      ) : (
        <button
          data-testid="filter-view-name"
          className="font-medium hover:underline cursor-pointer bg-transparent border-none text-white"
          onClick={handleStartRename}
          type="button"
        >
          {activeView.name}
        </button>
      )}

      <div className="flex items-center gap-1 ml-auto">
        <button
          data-testid="filter-view-save"
          className="px-2 py-0.5 rounded text-[12px] bg-gray-700 hover:bg-gray-600 transition-colors"
          onClick={handleSave}
          type="button"
        >
          Save
        </button>
        <button
          data-testid="filter-view-rename"
          className="px-2 py-0.5 rounded text-[12px] bg-gray-700 hover:bg-gray-600 transition-colors"
          onClick={handleStartRename}
          type="button"
        >
          Rename
        </button>
        <button
          data-testid="filter-view-delete"
          className="px-2 py-0.5 rounded text-[12px] bg-gray-700 hover:bg-red-600 transition-colors"
          onClick={handleDelete}
          type="button"
        >
          Delete
        </button>
        <button
          data-testid="filter-view-close"
          className="px-2 py-0.5 rounded text-[12px] bg-gray-700 hover:bg-gray-600 transition-colors ml-2"
          onClick={handleClose}
          type="button"
          title="Close filter view"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

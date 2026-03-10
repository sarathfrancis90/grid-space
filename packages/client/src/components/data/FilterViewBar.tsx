/**
 * FilterViewBar — dark header bar shown when a filter view is active.
 * Displays the filter view name, allows renaming, switching, and closing.
 */
import { useState, useCallback } from "react";
import { useFilterViewStore } from "../../stores/filterViewStore";
import { useFilterStore } from "../../stores/filterStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

export function FilterViewBar() {
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const activeFilterView = useFilterViewStore((s) =>
    s.getActiveFilterView(activeSheetId),
  );
  const filterViews = useFilterViewStore((s) =>
    s.getFilterViews(activeSheetId),
  );
  const deactivateFilterView = useFilterViewStore(
    (s) => s.deactivateFilterView,
  );
  const activateFilterView = useFilterViewStore((s) => s.activateFilterView);
  const renameFilterView = useFilterViewStore((s) => s.renameFilterView);
  const deleteFilterView = useFilterViewStore((s) => s.deleteFilterView);
  const updateFilterView = useFilterViewStore((s) => s.updateFilterView);
  const createFilterView = useFilterViewStore((s) => s.createFilterView);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClose = useCallback(() => {
    deactivateFilterView(activeSheetId);
    // Clear the applied filters from the filter view
    useFilterStore.getState().clearFilters(activeSheetId);
  }, [activeSheetId, deactivateFilterView]);

  const handleStartRename = useCallback(() => {
    if (activeFilterView) {
      setEditName(activeFilterView.name);
      setIsEditing(true);
    }
  }, [activeFilterView]);

  const handleFinishRename = useCallback(() => {
    if (activeFilterView && editName.trim()) {
      renameFilterView(activeSheetId, activeFilterView.id, editName.trim());
    }
    setIsEditing(false);
  }, [activeFilterView, activeSheetId, editName, renameFilterView]);

  const handleSaveCurrentFilters = useCallback(() => {
    if (!activeFilterView) return;
    const currentFilters =
      useFilterStore.getState().columnFilters.get(activeSheetId) ?? [];
    updateFilterView(activeSheetId, activeFilterView.id, {
      columnFilters: [...currentFilters],
    });
  }, [activeFilterView, activeSheetId, updateFilterView]);

  const handleSwitchView = useCallback(
    (viewId: string) => {
      activateFilterView(activeSheetId, viewId);
      const view = useFilterViewStore
        .getState()
        .getFilterViews(activeSheetId)
        .find((v) => v.id === viewId);
      if (view) {
        // Apply the filter view's filters
        useFilterStore.getState().clearFilters(activeSheetId);
        for (const filter of view.columnFilters) {
          useFilterStore.getState().setColumnFilter(activeSheetId, filter);
        }
      }
      setShowDropdown(false);
    },
    [activeSheetId, activateFilterView],
  );

  const handleDelete = useCallback(() => {
    if (activeFilterView) {
      deleteFilterView(activeSheetId, activeFilterView.id);
      useFilterStore.getState().clearFilters(activeSheetId);
    }
  }, [activeFilterView, activeSheetId, deleteFilterView]);

  const handleCreateNew = useCallback(() => {
    const currentFilters =
      useFilterStore.getState().columnFilters.get(activeSheetId) ?? [];
    const name = `Filter View ${filterViews.length + 1}`;
    const viewId = createFilterView(activeSheetId, name, [...currentFilters]);
    activateFilterView(activeSheetId, viewId);
    setShowDropdown(false);
  }, [activeSheetId, filterViews.length, createFilterView, activateFilterView]);

  if (!activeFilterView) return null;

  return (
    <div
      data-testid="filter-view-bar"
      className="flex items-center gap-2 bg-[#3c4043] text-white px-3 h-8 text-sm"
      style={{ height: "32px", padding: "0 12px" }}
    >
      {/* Filter view name / rename input */}
      {isEditing ? (
        <input
          data-testid="filter-view-name-input"
          className="bg-[#5f6368] text-white text-sm px-2 py-0.5 rounded border border-gray-500 outline-none focus:border-blue-400"
          style={{ padding: "2px 8px", fontSize: "13px", width: "200px" }}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleFinishRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFinishRename();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
        />
      ) : (
        <button
          data-testid="filter-view-name"
          className="text-sm font-medium hover:underline cursor-pointer"
          style={{ fontSize: "13px" }}
          onClick={handleStartRename}
          type="button"
        >
          {activeFilterView.name}
        </button>
      )}

      {/* View switcher dropdown */}
      <div className="relative ml-1">
        <button
          data-testid="filter-view-dropdown-toggle"
          className="text-gray-300 hover:text-white px-1"
          onClick={() => setShowDropdown(!showDropdown)}
          type="button"
          title="Switch filter view"
        >
          ▾
        </button>
        {showDropdown && (
          <div
            data-testid="filter-view-dropdown"
            className="absolute left-0 top-full z-50 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-48 mt-1"
          >
            {filterViews.map((view) => (
              <button
                key={view.id}
                data-testid={`filter-view-option-${view.id}`}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 ${
                  view.id === activeFilterView.id
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                }`}
                style={{ padding: "6px 12px", fontSize: "13px" }}
                onClick={() => handleSwitchView(view.id)}
                type="button"
              >
                {view.name}
              </button>
            ))}
            <div className="h-px bg-gray-200 my-1" />
            <button
              data-testid="filter-view-create-new"
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50"
              style={{ padding: "6px 12px", fontSize: "13px" }}
              onClick={handleCreateNew}
              type="button"
            >
              Create new filter view
            </button>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Save current filters to this view */}
      <button
        data-testid="filter-view-save"
        className="text-gray-300 hover:text-white text-xs px-2"
        style={{ fontSize: "12px", padding: "2px 8px" }}
        onClick={handleSaveCurrentFilters}
        type="button"
        title="Save current filters to this view"
      >
        Save
      </button>

      {/* Delete this filter view */}
      <button
        data-testid="filter-view-delete"
        className="text-gray-300 hover:text-white text-xs px-2"
        style={{ fontSize: "12px", padding: "2px 8px" }}
        onClick={handleDelete}
        type="button"
        title="Delete this filter view"
      >
        Delete
      </button>

      {/* Close (deactivate) filter view */}
      <button
        data-testid="filter-view-close"
        className="text-gray-300 hover:text-white ml-1"
        onClick={handleClose}
        type="button"
        title="Close filter view"
      >
        ✕
      </button>
    </div>
  );
}

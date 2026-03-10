/**
 * FilterViewMenu — Dropdown submenu for Data > Filter views.
 * Shows "Create new filter view" and lists existing saved views.
 */
import { useFilterStore } from "../../stores/filterStore";
import type { FilterView } from "../../stores/filterStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCloudStore } from "../../stores/cloudStore";

interface FilterViewMenuProps {
  onClose: () => void;
}

export function FilterViewMenu({ onClose }: FilterViewMenuProps) {
  const filterViews = useFilterStore((s) => s.filterViews);
  const activeFilterViewId = useFilterStore((s) => s.activeFilterViewId);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const spreadsheetId = useCloudStore((s) => s.currentSpreadsheet?.id);

  const handleCreate = () => {
    const name = prompt("Enter filter view name:");
    if (!name?.trim()) return;

    if (spreadsheetId) {
      useFilterStore
        .getState()
        .createFilterView(spreadsheetId, activeSheetId, name.trim());
    } else {
      // Offline mode: apply locally with a temp ID
      const tempView: FilterView = {
        id: `local-${Date.now()}`,
        spreadsheetId: "local",
        sheetId: activeSheetId,
        userId: "local",
        name: name.trim(),
        criteria: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useFilterStore.getState().applyFilterView(tempView, activeSheetId);
    }
    onClose();
  };

  const handleApply = (view: FilterView) => {
    useFilterStore.getState().applyFilterView(view, activeSheetId);
    onClose();
  };

  const handleDelete = (view: FilterView, e: React.MouseEvent) => {
    e.stopPropagation();
    if (spreadsheetId) {
      useFilterStore
        .getState()
        .deleteFilterView(spreadsheetId, view.sheetId, view.id);
    }
  };

  return (
    <div
      data-testid="filter-view-submenu"
      className="absolute left-full top-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-56"
    >
      <button
        data-testid="menu-data-filter-views-create"
        className="w-full flex items-center px-4 py-1.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-gray-900 transition-colors"
        style={{ padding: "6px 16px" }}
        onClick={handleCreate}
        type="button"
      >
        Create new filter view
      </button>

      {filterViews.length > 0 && (
        <>
          <div className="h-px bg-gray-100 my-1 mx-3" />
          {filterViews.map((view) => (
            <div
              key={view.id}
              className="flex items-center justify-between group"
            >
              <button
                data-testid={`filter-view-item-${view.id}`}
                className={`flex-1 text-left px-4 py-1.5 text-[13px] transition-colors ${
                  view.id === activeFilterViewId
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-blue-50 hover:text-gray-900"
                }`}
                style={{ padding: "6px 16px" }}
                onClick={() => handleApply(view)}
                type="button"
              >
                {view.name}
              </button>
              <button
                data-testid={`filter-view-delete-${view.id}`}
                className="px-2 py-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(view, e)}
                title="Delete filter view"
                type="button"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 3l6 6M9 3l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </>
      )}

      {activeFilterViewId && (
        <>
          <div className="h-px bg-gray-100 my-1 mx-3" />
          <button
            data-testid="menu-data-filter-views-close"
            className="w-full flex items-center px-4 py-1.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-gray-900 transition-colors"
            style={{ padding: "6px 16px" }}
            onClick={() => {
              useFilterStore.getState().deactivateFilterView(activeSheetId);
              onClose();
            }}
            type="button"
          >
            Close active filter view
          </button>
        </>
      )}
    </div>
  );
}

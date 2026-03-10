/**
 * FilterViewBar — Dark header bar shown when a filter view is active.
 * Mimics Google Sheets' filter view indicator with name, save, and close controls.
 */
import { useState } from "react";
import { useFilterStore } from "../../stores/filterStore";
import type { FilterView } from "../../stores/filterStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

export function FilterViewBar() {
  const activeFilterViewId = useFilterStore((s) => s.activeFilterViewId);
  const filterViews = useFilterStore((s) => s.filterViews);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const activeView = filterViews.find((v) => v.id === activeFilterViewId);

  if (!activeView) return null;

  return (
    <div
      data-testid="filter-view-bar"
      className="flex items-center justify-between bg-gray-800 text-white px-4 py-1.5 text-sm"
    >
      <div className="flex items-center gap-3">
        <FilterViewIcon />
        <span className="font-medium" data-testid="filter-view-bar-name">
          {activeView.name}
        </span>
        <span className="text-gray-400 text-xs">Filter view active</span>
      </div>
      <div className="flex items-center gap-2">
        <RenameButton view={activeView} />
        <button
          data-testid="filter-view-bar-close"
          className="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 transition-colors"
          onClick={() => {
            useFilterStore.getState().deactivateFilterView(activeSheetId);
          }}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function RenameButton({ view }: { view: FilterView }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(view.name);

  if (!editing) {
    return (
      <button
        data-testid="filter-view-bar-rename"
        className="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 transition-colors"
        onClick={() => {
          setName(view.name);
          setEditing(true);
        }}
        type="button"
      >
        Rename
      </button>
    );
  }

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== view.name) {
      useFilterStore
        .getState()
        .updateFilterView(view.spreadsheetId, view.sheetId, view.id, {
          name: trimmed,
        });
    }
    setEditing(false);
  };

  return (
    <input
      data-testid="filter-view-bar-rename-input"
      className="px-2 py-0.5 rounded text-xs bg-gray-700 text-white border border-gray-500 focus:outline-none focus:border-blue-400"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") setEditing(false);
      }}
      autoFocus
    />
  );
}

function FilterViewIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300"
    >
      <path
        d="M1 3h14M4 8h8M6 13h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

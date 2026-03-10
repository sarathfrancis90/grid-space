/**
 * Editing mode dropdown selector — Editing / Suggesting / Viewing.
 * Displayed in the toolbar area, similar to Google Sheets' top-right mode toggle.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useSuggestionsStore } from "../../stores/suggestionsStore";
import type { EditingMode } from "../../types/suggestions";

const MODE_LABELS: Record<EditingMode, string> = {
  editing: "Editing",
  suggesting: "Suggesting",
  viewing: "Viewing",
};

const MODE_ICONS: Record<EditingMode, string> = {
  editing: "✏",
  suggesting: "💬",
  viewing: "👁",
};

const MODE_DESCRIPTIONS: Record<EditingMode, string> = {
  editing: "Edit directly",
  suggesting: "Suggest changes",
  viewing: "View only",
};

export function EditingModeSelector() {
  const editingMode = useSuggestionsStore((s) => s.editingMode);
  const setEditingMode = useSuggestionsStore((s) => s.setEditingMode);
  const pendingCount = useSuggestionsStore((s) => s.getPendingCount());
  const toggleSidebar = useSuggestionsStore((s) => s.toggleSidebar);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = useCallback(
    (mode: EditingMode) => {
      setEditingMode(mode);
      setIsOpen(false);
    },
    [setEditingMode],
  );

  const modes: EditingMode[] = ["editing", "suggesting", "viewing"];

  return (
    <div
      ref={dropdownRef}
      className="relative"
      data-testid="editing-mode-selector"
    >
      <button
        data-testid="editing-mode-toggle"
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-[13px] transition-colors ${
          editingMode === "suggesting"
            ? "bg-green-50 text-green-700 border border-green-200"
            : editingMode === "viewing"
              ? "bg-gray-100 text-gray-600 border border-gray-200"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
        style={{ padding: "4px 10px" }}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{MODE_ICONS[editingMode]}</span>
        <span>{MODE_LABELS[editingMode]}</span>
        {pendingCount > 0 && (
          <span
            data-testid="suggestions-badge"
            className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center"
          >
            {pendingCount}
          </span>
        )}
        <svg className="w-3 h-3 ml-0.5" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3 5l3 3 3-3H3z" />
        </svg>
      </button>

      {isOpen && (
        <div
          data-testid="editing-mode-dropdown"
          className="absolute right-0 top-full z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-48"
        >
          {modes.map((mode) => (
            <button
              key={mode}
              data-testid={`editing-mode-${mode}`}
              className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors ${
                editingMode === mode
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handleSelect(mode)}
              type="button"
            >
              <span className="text-base">{MODE_ICONS[mode]}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{MODE_LABELS[mode]}</span>
                <span className="text-[11px] text-gray-400">
                  {MODE_DESCRIPTIONS[mode]}
                </span>
              </div>
              {editingMode === mode && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
          <div className="h-px bg-gray-100 my-1 mx-3" />
          <button
            data-testid="view-suggestions-btn"
            className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              toggleSidebar();
              setIsOpen(false);
            }}
            type="button"
          >
            <span className="text-base">📋</span>
            <span>View suggestions</span>
            {pendingCount > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

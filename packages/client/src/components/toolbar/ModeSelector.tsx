/**
 * Mode selector dropdown — Editing / Suggesting / Viewing.
 * Appears in the toolbar and controls the spreadsheet editing mode.
 */
import { useCallback, useState, useRef, useEffect } from "react";
import { useSuggestionStore } from "../../stores/suggestionStore";
import type { SpreadsheetMode } from "../../types/grid";

const MODE_OPTIONS: Array<{
  value: SpreadsheetMode;
  label: string;
  icon: string;
}> = [
  { value: "editing", label: "Editing", icon: "✏" },
  { value: "suggesting", label: "Suggesting", icon: "💬" },
  { value: "viewing", label: "Viewing", icon: "👁" },
];

export function ModeSelector() {
  const mode = useSuggestionStore((s) => s.mode);
  const setMode = useSuggestionStore((s) => s.setMode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = MODE_OPTIONS.find((o) => o.value === mode) ?? MODE_OPTIONS[0];

  const handleSelect = useCallback(
    (value: SpreadsheetMode) => {
      setMode(value);
      setOpen(false);
    },
    [setMode],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative" data-testid="mode-selector">
      <button
        data-testid="mode-selector-button"
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium border transition-colors ${
          mode === "suggesting"
            ? "bg-green-50 border-green-300 text-green-700"
            : mode === "viewing"
              ? "bg-gray-50 border-gray-300 text-gray-600"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
        onClick={() => setOpen(!open)}
        title={`Current mode: ${current.label}`}
      >
        <span>{current.icon}</span>
        <span>{current.label}</span>
        <svg className="w-3 h-3 ml-1" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3 5l3 3 3-3H3z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              data-testid={`mode-option-${option.value}`}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                mode === option.value
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700"
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

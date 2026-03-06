/**
 * SuggestionPanel — sidebar panel showing pending suggestions with Accept/Reject controls.
 */
import { useCallback, useMemo } from "react";
import { useSuggestionStore } from "../../stores/suggestionStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { parseCellKey } from "../../utils/coordinates";
import type { Suggestion } from "../../types/grid";

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayValue(val: string | number | boolean | null): string {
  if (val === null || val === undefined) return "(empty)";
  return String(val);
}

interface SuggestionItemProps {
  suggestion: Suggestion;
  onAccept: (s: Suggestion) => void;
  onReject: (s: Suggestion) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function SuggestionItem({
  suggestion,
  onAccept,
  onReject,
  isSelected,
  onSelect,
}: SuggestionItemProps) {
  return (
    <div
      data-testid={`suggestion-item-${suggestion.id}`}
      className={`border rounded-lg p-3 mb-2 cursor-pointer transition-colors ${
        isSelected
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
      onClick={() => onSelect(suggestion.id)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">
          Cell {suggestion.cellKey}
        </span>
        <span className="text-xs text-gray-400">
          {formatTimestamp(suggestion.createdAt)}
        </span>
      </div>
      <div className="text-sm mb-1">
        <span className="text-gray-500">by </span>
        <span className="font-medium text-gray-700">
          {suggestion.authorName}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm mb-2">
        <span className="line-through text-red-500 bg-red-50 px-1 rounded">
          {displayValue(suggestion.oldValue)}
        </span>
        <span className="text-gray-400">&rarr;</span>
        <span className="text-green-600 bg-green-50 px-1 rounded">
          {displayValue(suggestion.newValue)}
        </span>
      </div>
      {suggestion.status === "pending" && (
        <div className="flex gap-2">
          <button
            data-testid={`accept-suggestion-${suggestion.id}`}
            className="flex-1 px-2 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAccept(suggestion);
            }}
          >
            Accept
          </button>
          <button
            data-testid={`reject-suggestion-${suggestion.id}`}
            className="flex-1 px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onReject(suggestion);
            }}
          >
            Reject
          </button>
        </div>
      )}
      {suggestion.status !== "pending" && (
        <div
          className={`text-xs font-medium ${
            suggestion.status === "accepted" ? "text-green-600" : "text-red-600"
          }`}
        >
          {suggestion.status === "accepted" ? "Accepted" : "Rejected"}
        </div>
      )}
    </div>
  );
}

export function SuggestionPanel() {
  const suggestions = useSuggestionStore((s) => s.suggestions);
  const selectedId = useSuggestionStore((s) => s.selectedSuggestionId);
  const selectSuggestion = useSuggestionStore((s) => s.selectSuggestion);
  const setSuggestionStatus = useSuggestionStore((s) => s.setSuggestionStatus);
  const acceptAll = useSuggestionStore((s) => s.acceptAll);
  const rejectAll = useSuggestionStore((s) => s.rejectAll);

  const pendingSuggestions = useMemo(() => {
    const result: Suggestion[] = [];
    suggestions.forEach((s) => {
      if (s.status === "pending") {
        result.push(s);
      }
    });
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [suggestions]);

  const handleAccept = useCallback(
    (suggestion: Suggestion) => {
      const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!activeSheetId) return;

      // Apply the suggested value to the cell
      const parsed = parseCellKey(suggestion.cellKey);
      if (parsed) {
        const cellStore = useCellStore.getState();
        const existing = cellStore.getCell(
          activeSheetId,
          parsed.row,
          parsed.col,
        );
        cellStore.setCell(activeSheetId, parsed.row, parsed.col, {
          ...existing,
          value: suggestion.newValue,
          formula: suggestion.newFormula,
        });
      }

      setSuggestionStatus(suggestion.id, "accepted", "current-user");
    },
    [setSuggestionStatus],
  );

  const handleReject = useCallback(
    (suggestion: Suggestion) => {
      setSuggestionStatus(suggestion.id, "rejected", "current-user");
    },
    [setSuggestionStatus],
  );

  const handleAcceptAll = useCallback(() => {
    // Apply all pending suggestions
    const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
    if (!activeSheetId) return;

    const cellStore = useCellStore.getState();
    suggestions.forEach((s) => {
      if (s.status === "pending") {
        const parsed = parseCellKey(s.cellKey);
        if (parsed) {
          const existing = cellStore.getCell(
            activeSheetId,
            parsed.row,
            parsed.col,
          );
          cellStore.setCell(activeSheetId, parsed.row, parsed.col, {
            ...existing,
            value: s.newValue,
            formula: s.newFormula,
          });
        }
      }
    });

    acceptAll("current-user");
  }, [suggestions, acceptAll]);

  const handleRejectAll = useCallback(() => {
    rejectAll("current-user");
  }, [rejectAll]);

  if (pendingSuggestions.length === 0) {
    return (
      <div
        data-testid="suggestion-panel"
        className="p-4 text-center text-gray-400 text-sm"
      >
        No pending suggestions
      </div>
    );
  }

  return (
    <div data-testid="suggestion-panel" className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">
          Suggestions ({pendingSuggestions.length})
        </h3>
        <div className="flex gap-1">
          <button
            data-testid="accept-all-suggestions"
            className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
            onClick={handleAcceptAll}
          >
            Accept All
          </button>
          <button
            data-testid="reject-all-suggestions"
            className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
            onClick={handleRejectAll}
          >
            Reject All
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {pendingSuggestions.map((s) => (
          <SuggestionItem
            key={s.id}
            suggestion={s}
            onAccept={handleAccept}
            onReject={handleReject}
            isSelected={selectedId === s.id}
            onSelect={selectSuggestion}
          />
        ))}
      </div>
    </div>
  );
}

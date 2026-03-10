/**
 * Suggestions sidebar — lists all suggestions with accept/reject controls.
 * Follows the same pattern as VersionHistorySidebar.
 */
import React, { useEffect, useCallback } from "react";
import { useSuggestionsStore } from "../../stores/suggestionsStore";
import { useCellStore } from "../../stores/cellStore";
import { useHistoryStore } from "../../stores/historyStore";
import type { SuggestionFilter } from "../../types/suggestions";
import { SuggestionCard } from "./SuggestionCard";

export const SuggestionsSidebar: React.FC = React.memo(() => {
  const isOpen = useSuggestionsStore((s) => s.isSidebarOpen);
  const filter = useSuggestionsStore((s) => s.filter);
  const setFilter = useSuggestionsStore((s) => s.setFilter);
  const close = useSuggestionsStore((s) => s.closeSidebar);
  const acceptAll = useSuggestionsStore((s) => s.acceptAll);
  const rejectAll = useSuggestionsStore((s) => s.rejectAll);
  const acceptSuggestion = useSuggestionsStore((s) => s.acceptSuggestion);
  const rejectSuggestion = useSuggestionsStore((s) => s.rejectSuggestion);
  const suggestions = useSuggestionsStore((s) => s.getFilteredSuggestions());
  const pendingCount = useSuggestionsStore((s) => s.getPendingCount());

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  const handleAccept = useCallback(
    (id: string) => {
      const suggestion = useSuggestionsStore
        .getState()
        .suggestions.find((s) => s.id === id);
      if (!suggestion || suggestion.status !== "pending") return;

      useHistoryStore.getState().pushUndo();
      const [row, col] = suggestion.cellRef.split(",").map(Number);
      const existing = useCellStore
        .getState()
        .getCell(suggestion.sheetId, row, col);
      useCellStore.getState().setCell(suggestion.sheetId, row, col, {
        ...existing,
        value: suggestion.newValue,
      });
      acceptSuggestion(id);
    },
    [acceptSuggestion],
  );

  const handleReject = useCallback(
    (id: string) => {
      rejectSuggestion(id);
    },
    [rejectSuggestion],
  );

  const handleAcceptAll = useCallback(() => {
    const pending = useSuggestionsStore
      .getState()
      .suggestions.filter((s) => s.status === "pending");
    if (pending.length === 0) return;

    useHistoryStore.getState().pushUndo();
    for (const suggestion of pending) {
      const [row, col] = suggestion.cellRef.split(",").map(Number);
      const existing = useCellStore
        .getState()
        .getCell(suggestion.sheetId, row, col);
      useCellStore.getState().setCell(suggestion.sheetId, row, col, {
        ...existing,
        value: suggestion.newValue,
      });
    }
    acceptAll();
  }, [acceptAll]);

  const handleRejectAll = useCallback(() => {
    rejectAll();
  }, [rejectAll]);

  if (!isOpen) return null;

  const filters: Array<{ key: SuggestionFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div
      data-testid="suggestions-sidebar"
      className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Suggestions</h2>
          {pendingCount > 0 && (
            <span
              data-testid="sidebar-pending-count"
              className="bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none"
            >
              {pendingCount} pending
            </span>
          )}
        </div>
        <button
          data-testid="close-suggestions-sidebar"
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          onClick={close}
          type="button"
          aria-label="Close suggestions sidebar"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 px-2">
        {filters.map((f) => (
          <button
            key={f.key}
            data-testid={`filter-${f.key}`}
            className={`px-3 py-2 text-[12px] font-medium transition-colors border-b-2 ${
              filter === f.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFilter(f.key)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {pendingCount > 0 && (
        <div className="flex gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
          <button
            data-testid="accept-all-btn"
            className="flex-1 text-[12px] py-1.5 px-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            onClick={handleAcceptAll}
            type="button"
          >
            Accept all ({pendingCount})
          </button>
          <button
            data-testid="reject-all-btn"
            className="flex-1 text-[12px] py-1.5 px-3 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
            onClick={handleRejectAll}
            type="button"
          >
            Reject all
          </button>
        </div>
      )}

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg
              className="w-12 h-12 mb-3"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="6" y="6" width="36" height="36" rx="4" />
              <path d="M16 18h16M16 24h10M16 30h13" />
            </svg>
            <p className="text-[13px]">No suggestions yet</p>
            <p className="text-[11px] mt-1">
              Switch to Suggesting mode to start
            </p>
          </div>
        ) : (
          <div className="py-1">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

SuggestionsSidebar.displayName = "SuggestionsSidebar";

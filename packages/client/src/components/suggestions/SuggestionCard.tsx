/**
 * Individual suggestion card — shows old/new value with accept/reject buttons.
 */
import React, { useCallback } from "react";
import type { Suggestion } from "../../types/suggestions";
import { colToLetter } from "../../utils/coordinates";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

function formatCellRef(cellRef: string): string {
  const parts = cellRef.split(",");
  if (parts.length !== 2) return cellRef;
  const row = parseInt(parts[0], 10);
  const col = parseInt(parts[1], 10);
  if (isNaN(row) || isNaN(col)) return cellRef;
  return `${colToLetter(col)}${row + 1}`;
}

function formatValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "(empty)";
  if (value === "") return "(empty)";
  return String(value);
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const SuggestionCard: React.FC<SuggestionCardProps> = React.memo(
  ({ suggestion, onAccept, onReject }) => {
    const handleAccept = useCallback(
      () => onAccept(suggestion.id),
      [onAccept, suggestion.id],
    );
    const handleReject = useCallback(
      () => onReject(suggestion.id),
      [onReject, suggestion.id],
    );

    const isPending = suggestion.status === "pending";
    const isAccepted = suggestion.status === "accepted";

    return (
      <div
        data-testid={`suggestion-card-${suggestion.id}`}
        className={`mx-3 my-2 p-3 rounded-lg border transition-colors ${
          isPending
            ? "border-orange-200 bg-orange-50/50"
            : isAccepted
              ? "border-green-200 bg-green-50/30"
              : "border-red-200 bg-red-50/30"
        }`}
      >
        {/* Header: cell ref + user + time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
              {formatCellRef(suggestion.cellRef)}
            </span>
            <span className="text-[11px] text-gray-500">
              {suggestion.proposedBy}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {formatTimestamp(suggestion.createdAt)}
          </span>
        </div>

        {/* Value change */}
        <div className="flex items-center gap-2 text-[12px] mb-2">
          <span className="line-through text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
            {formatValue(suggestion.oldValue)}
          </span>
          <svg
            className="w-3 h-3 text-gray-400 flex-shrink-0"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
          <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium">
            {formatValue(suggestion.newValue)}
          </span>
        </div>

        {/* Comment */}
        {suggestion.comment && (
          <p className="text-[11px] text-gray-500 italic mb-2">
            &quot;{suggestion.comment}&quot;
          </p>
        )}

        {/* Status badge or action buttons */}
        {isPending ? (
          <div className="flex gap-2">
            <button
              data-testid={`accept-suggestion-${suggestion.id}`}
              className="flex-1 text-[11px] py-1 px-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              onClick={handleAccept}
              type="button"
            >
              Accept
            </button>
            <button
              data-testid={`reject-suggestion-${suggestion.id}`}
              className="flex-1 text-[11px] py-1 px-2 bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
              onClick={handleReject}
              type="button"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isAccepted
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isAccepted ? "Accepted" : "Rejected"}
            </span>
            {suggestion.resolvedBy && (
              <span className="text-[10px] text-gray-400">
                by {suggestion.resolvedBy}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

SuggestionCard.displayName = "SuggestionCard";

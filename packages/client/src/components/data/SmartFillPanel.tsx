/**
 * SmartFillPanel — shows smart fill preview and accept/reject controls.
 * Also includes sheet organization suggestions.
 */
import React, { useCallback } from "react";
import { useSmartFillStore } from "../../stores/smartFillStore";
import { useCellStore } from "../../stores/cellStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import type { CellData } from "../../types/grid";

interface SmartFillPreviewProps {
  onClose: () => void;
}

export const SmartFillPreview: React.FC<SmartFillPreviewProps> = React.memo(
  function SmartFillPreview({ onClose }) {
    const suggestion = useSmartFillStore((s) => s.suggestion);
    const isVisible = useSmartFillStore((s) => s.isPreviewVisible);

    const handleAccept = useCallback(() => {
      if (!suggestion) return;

      const sheetId = useSpreadsheetStore.getState().activeSheetId;
      if (!sheetId) return;

      useHistoryStore.getState().pushUndo();

      const updates: Array<{ row: number; col: number; data: CellData }> =
        suggestion.cells.map((cell) => ({
          row: cell.row,
          col: cell.col,
          data: { value: cell.value },
        }));

      useCellStore.getState().setCellBatch(sheetId, updates);
      useSmartFillStore.getState().acceptSuggestion();
      onClose();
    }, [suggestion, onClose]);

    const handleReject = useCallback(() => {
      useSmartFillStore.getState().rejectSuggestion();
      onClose();
    }, [onClose]);

    if (!isVisible || !suggestion) return null;

    const { pattern, cells } = suggestion;
    const previewCount = Math.min(cells.length, 5);
    const previewCells = cells.slice(0, previewCount);
    const remaining = cells.length - previewCount;

    return (
      <div
        className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-72"
        data-testid="smart-fill-preview"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Smart Fill Suggestion
          </h3>
          <button
            onClick={handleReject}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            data-testid="smart-fill-close"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="text-xs text-gray-500 mb-2">
          Pattern: {pattern.description}
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Preview:</div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 space-y-1">
            {previewCells.map((cell, i) => (
              <div
                key={i}
                className="text-sm text-blue-700 font-mono"
                data-testid={`smart-fill-preview-value-${i}`}
              >
                {String(cell.value)}
              </div>
            ))}
            {remaining > 0 && (
              <div className="text-xs text-blue-400">
                ...and {remaining} more
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 bg-blue-600 text-white text-sm py-1.5 px-3 rounded hover:bg-blue-700 transition-colors"
            data-testid="smart-fill-accept"
          >
            Accept ({cells.length} cells)
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-gray-100 text-gray-700 text-sm py-1.5 px-3 rounded hover:bg-gray-200 transition-colors"
            data-testid="smart-fill-reject"
          >
            Reject
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-400">
          Confidence: {Math.round(pattern.confidence * 100)}%
        </div>
      </div>
    );
  },
);

interface OrganizePanelProps {
  onClose: () => void;
}

export const OrganizePanel: React.FC<OrganizePanelProps> = React.memo(
  function OrganizePanel({ onClose }) {
    const suggestions = useSmartFillStore((s) => s.organizeSuggestions);
    const isOpen = useSmartFillStore((s) => s.isOrganizePanelOpen);

    const handleDismiss = useCallback(
      (index: number) => {
        useSmartFillStore.getState().dismissOrganizeSuggestion(index);
        const remaining =
          useSmartFillStore.getState().organizeSuggestions.length;
        if (remaining === 0) {
          onClose();
        }
      },
      [onClose],
    );

    if (!isOpen || suggestions.length === 0) return null;

    return (
      <div
        className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-80 right-4 top-16"
        data-testid="organize-panel"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Organization Suggestions
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            data-testid="organize-panel-close"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="space-y-2">
          {suggestions.map((suggestion, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200"
              data-testid={`organize-suggestion-${i}`}
            >
              <div className="flex-1">
                <div className="text-sm text-gray-700">
                  {suggestion.description}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {suggestion.type.replace(/-/g, " ")}
                </div>
              </div>
              <button
                onClick={() => handleDismiss(i)}
                className="text-gray-300 hover:text-gray-500 text-sm"
                data-testid={`organize-dismiss-${i}`}
                aria-label="Dismiss suggestion"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

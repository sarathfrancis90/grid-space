import React from "react";
import type { VersionDiff, VersionDiffChange } from "../../stores/versionStore";

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return String(obj.value ?? "(empty)");
    return JSON.stringify(value);
  }
  return String(value);
}

interface VersionDiffViewProps {
  diffs: VersionDiff[];
  mode?: "default" | "compare";
}

export const VersionDiffView: React.FC<VersionDiffViewProps> = React.memo(
  ({ diffs, mode = "default" }) => {
    if (diffs.length === 0) {
      return (
        <div
          data-testid="version-diff-empty"
          className="p-4 text-sm text-gray-500 text-center"
        >
          No changes in this version
        </div>
      );
    }

    const isCompare = mode === "compare";

    return (
      <div data-testid="version-diff-view" className="p-3">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
            isCompare ? "text-purple-600" : "text-gray-500"
          }`}
        >
          {isCompare ? "Side-by-side comparison" : "Changes"}
        </h3>
        {diffs.map((diff) => (
          <SheetDiff key={diff.sheetId} diff={diff} mode={mode} />
        ))}
      </div>
    );
  },
);

VersionDiffView.displayName = "VersionDiffView";

interface SheetDiffProps {
  diff: VersionDiff;
  mode?: "default" | "compare";
}

const SheetDiff: React.FC<SheetDiffProps> = React.memo(
  ({ diff, mode = "default" }) => {
    const isCompare = mode === "compare";
    const displayChanges = diff.changes.slice(0, 50);

    if (isCompare) {
      return (
        <div
          data-testid={`version-diff-sheet-${diff.sheetId}`}
          className="mb-3"
        >
          <div className="text-sm font-medium text-gray-700 mb-1">
            {diff.sheetName}
          </div>
          <div className="border border-gray-200 rounded overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
              <div className="px-2 py-1">Cell</div>
              <div className="px-2 py-1 border-l border-gray-200 text-red-600">
                Before
              </div>
              <div className="px-2 py-1 border-l border-gray-200 text-green-600">
                After
              </div>
            </div>
            {displayChanges.map((change) => (
              <SideBySideCellChange key={change.cellKey} change={change} />
            ))}
            {diff.changes.length > 50 && (
              <div className="text-xs text-gray-400 px-2 py-1 border-t border-gray-200">
                ...and {diff.changes.length - 50} more changes
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div data-testid={`version-diff-sheet-${diff.sheetId}`} className="mb-3">
        <div className="text-sm font-medium text-gray-700 mb-1">
          {diff.sheetName}
        </div>
        <div className="space-y-1">
          {displayChanges.map((change) => (
            <CellChange key={change.cellKey} change={change} />
          ))}
          {diff.changes.length > 50 && (
            <div className="text-xs text-gray-400 pl-2">
              ...and {diff.changes.length - 50} more changes
            </div>
          )}
        </div>
      </div>
    );
  },
);

SheetDiff.displayName = "SheetDiff";

interface CellChangeProps {
  change: VersionDiffChange;
}

const CellChange: React.FC<CellChangeProps> = React.memo(({ change }) => {
  const isAdded = change.oldValue === null;
  const isRemoved = change.newValue === null;

  return (
    <div
      data-testid={`version-diff-cell-${change.cellKey}`}
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
        isAdded
          ? "bg-green-50 text-green-700"
          : isRemoved
            ? "bg-red-50 text-red-700"
            : "bg-yellow-50 text-yellow-700"
      }`}
    >
      <span className="font-mono font-medium w-12 flex-shrink-0">
        {change.cellKey}
      </span>
      {!isAdded && (
        <span className="line-through text-gray-400 truncate max-w-24">
          {formatCellValue(change.oldValue)}
        </span>
      )}
      {!isAdded && !isRemoved && (
        <span className="text-gray-400 flex-shrink-0">&rarr;</span>
      )}
      {!isRemoved && (
        <span className="font-medium truncate max-w-24">
          {formatCellValue(change.newValue)}
        </span>
      )}
    </div>
  );
});

CellChange.displayName = "CellChange";

const SideBySideCellChange: React.FC<CellChangeProps> = React.memo(
  ({ change }) => {
    const isAdded = change.oldValue === null;
    const isRemoved = change.newValue === null;

    return (
      <div
        data-testid={`version-compare-cell-${change.cellKey}`}
        className="grid grid-cols-3 text-xs border-t border-gray-100"
      >
        <div className="px-2 py-1 font-mono font-medium text-gray-600">
          {change.cellKey}
        </div>
        <div
          className={`px-2 py-1 border-l border-gray-200 truncate ${
            isAdded ? "text-gray-300" : "bg-red-50 text-red-700"
          }`}
        >
          {isAdded ? "(empty)" : formatCellValue(change.oldValue)}
        </div>
        <div
          className={`px-2 py-1 border-l border-gray-200 truncate ${
            isRemoved ? "text-gray-300" : "bg-green-50 text-green-700"
          }`}
        >
          {isRemoved ? "(empty)" : formatCellValue(change.newValue)}
        </div>
      </div>
    );
  },
);

SideBySideCellChange.displayName = "SideBySideCellChange";

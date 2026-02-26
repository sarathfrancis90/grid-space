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
}

export const VersionDiffView: React.FC<VersionDiffViewProps> = React.memo(
  ({ diffs }) => {
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

    return (
      <div data-testid="version-diff-view" className="p-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Changes
        </h3>
        {diffs.map((diff) => (
          <SheetDiff key={diff.sheetId} diff={diff} />
        ))}
      </div>
    );
  },
);

VersionDiffView.displayName = "VersionDiffView";

interface SheetDiffProps {
  diff: VersionDiff;
}

const SheetDiff: React.FC<SheetDiffProps> = React.memo(({ diff }) => {
  return (
    <div data-testid={`version-diff-sheet-${diff.sheetId}`} className="mb-3">
      <div className="text-sm font-medium text-gray-700 mb-1">
        {diff.sheetName}
      </div>
      <div className="space-y-1">
        {diff.changes.slice(0, 50).map((change) => (
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
});

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

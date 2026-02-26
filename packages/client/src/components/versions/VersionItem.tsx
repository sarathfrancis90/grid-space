import React, { useState, useCallback } from "react";
import type { VersionSummary } from "../../stores/versionStore";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface VersionItemProps {
  version: VersionSummary;
  isSelected: boolean;
  onSelect: (versionId: string) => void;
  onRestore: (versionId: string) => Promise<void>;
  onName: (versionId: string, name: string) => Promise<void>;
  onCopy: (versionId: string) => Promise<{ id: string; title: string }>;
}

export const VersionItem: React.FC<VersionItemProps> = React.memo(
  ({ version, isSelected, onSelect, onRestore, onName, onCopy }) => {
    const [isNaming, setIsNaming] = useState(false);
    const [nameValue, setNameValue] = useState(version.name ?? "");
    const [showMenu, setShowMenu] = useState(false);

    const handleClick = useCallback(() => {
      onSelect(version.id);
    }, [version.id, onSelect]);

    const handleNameSubmit = useCallback(async () => {
      if (nameValue.trim()) {
        await onName(version.id, nameValue.trim());
      }
      setIsNaming(false);
    }, [version.id, nameValue, onName]);

    const handleNameKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleNameSubmit();
        } else if (e.key === "Escape") {
          setIsNaming(false);
          setNameValue(version.name ?? "");
        }
      },
      [handleNameSubmit, version.name],
    );

    const handleRestore = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        await onRestore(version.id);
      },
      [version.id, onRestore],
    );

    const handleCopy = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        await onCopy(version.id);
      },
      [version.id, onCopy],
    );

    const handleStartNaming = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        setNameValue(version.name ?? "");
        setIsNaming(true);
      },
      [version.name],
    );

    const toggleMenu = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu((prev) => !prev);
    }, []);

    const initials = version.createdBy.name
      ? version.createdBy.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

    return (
      <div
        data-testid={`version-item-${version.id}`}
        onClick={handleClick}
        className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
          isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {version.createdBy.avatarUrl ? (
              <img
                src={version.createdBy.avatarUrl}
                alt={version.createdBy.name ?? "User"}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div
                data-testid={`version-avatar-${version.id}`}
                className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium"
              >
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isNaming ? (
              <input
                data-testid={`version-name-input-${version.id}`}
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleNameKeyDown}
                className="w-full text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                placeholder="Name this version..."
              />
            ) : (
              <div className="text-sm font-medium text-gray-800 truncate">
                {version.name ?? formatFullDate(version.createdAt)}
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span
                data-testid={`version-author-${version.id}`}
                className="text-xs text-gray-500"
              >
                {version.createdBy.name ?? "Unknown user"}
              </span>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(version.createdAt)}
              </span>
            </div>

            {version.hasChangeset && (
              <span className="inline-block mt-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                Has changes
              </span>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <button
              data-testid={`version-menu-btn-${version.id}`}
              onClick={toggleMenu}
              className="p-1 rounded hover:bg-gray-200 text-gray-400"
              aria-label="Version actions"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div
                data-testid={`version-menu-${version.id}`}
                className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
              >
                <button
                  data-testid={`version-restore-menu-${version.id}`}
                  onClick={handleRestore}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Restore this version
                </button>
                <button
                  data-testid={`version-name-menu-${version.id}`}
                  onClick={handleStartNaming}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Name this version
                </button>
                <button
                  data-testid={`version-copy-menu-${version.id}`}
                  onClick={handleCopy}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Copy as new spreadsheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

VersionItem.displayName = "VersionItem";

export { formatRelativeTime, formatFullDate };

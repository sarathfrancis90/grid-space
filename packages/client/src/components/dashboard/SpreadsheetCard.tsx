import { useState } from "react";

interface SpreadsheetSummary {
  id: string;
  title: string;
  isStarred: boolean;
  updatedAt: string;
  owner: { id: string; name: string | null; avatarUrl: string | null };
  role: string;
}

interface SpreadsheetCardProps {
  spreadsheet: SpreadsheetSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onToggleStar: (id: string) => Promise<void>;
  onRename: (id: string, title: string) => Promise<void>;
}

export function SpreadsheetCard({
  spreadsheet,
  onOpen,
  onDelete,
  onDuplicate,
  onToggleStar,
  onRename,
}: SpreadsheetCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(spreadsheet.title);

  const handleRename = async () => {
    if (newTitle.trim() && newTitle !== spreadsheet.title) {
      await onRename(spreadsheet.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const timeAgo = formatTimeAgo(spreadsheet.updatedAt);

  return (
    <div
      className="group relative rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md"
      data-testid={`spreadsheet-card-${spreadsheet.id}`}
    >
      {/* Preview area */}
      <div
        className="mb-3 flex h-32 cursor-pointer items-center justify-center rounded bg-gray-100"
        onClick={() => onOpen(spreadsheet.id)}
        data-testid={`open-spreadsheet-${spreadsheet.id}`}
      >
        <svg
          className="h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 10h18M3 14h18M3 6h18M3 18h18"
          />
        </svg>
      </div>

      {/* Title */}
      {isRenaming ? (
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          autoFocus
          className="w-full rounded border border-blue-500 px-1 py-0.5 text-sm"
          data-testid={`rename-input-${spreadsheet.id}`}
        />
      ) : (
        <h3
          className="cursor-pointer truncate text-sm font-medium text-gray-900"
          onClick={() => onOpen(spreadsheet.id)}
          title={spreadsheet.title}
        >
          {spreadsheet.title}
        </h3>
      )}

      {/* Metadata */}
      <p className="mt-1 text-xs text-gray-500">
        {timeAgo}
        {spreadsheet.role !== "owner" && (
          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">
            {spreadsheet.role}
          </span>
        )}
      </p>

      {/* Star button */}
      <button
        onClick={() => onToggleStar(spreadsheet.id)}
        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-yellow-500"
        data-testid={`star-btn-${spreadsheet.id}`}
      >
        {spreadsheet.isStarred ? (
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        )}
      </button>

      {/* Menu button */}
      <div className="absolute right-2 bottom-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 group-hover:opacity-100"
          data-testid={`menu-btn-${spreadsheet.id}`}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 bottom-8 z-10 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            data-testid={`menu-${spreadsheet.id}`}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onOpen(spreadsheet.id);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Open
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setIsRenaming(true);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              data-testid={`rename-btn-${spreadsheet.id}`}
            >
              Rename
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onDuplicate(spreadsheet.id);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              data-testid={`duplicate-btn-${spreadsheet.id}`}
            >
              Make a copy
            </button>
            {spreadsheet.role === "owner" && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(spreadsheet.id);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                data-testid={`delete-btn-${spreadsheet.id}`}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

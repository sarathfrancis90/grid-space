import { useState } from "react";

interface SpreadsheetSummary {
  id: string;
  title: string;
  isStarred: boolean;
  updatedAt: string;
  owner: { id: string; name: string | null; avatarUrl: string | null };
  role: string;
}

interface SpreadsheetListItemProps {
  spreadsheet: SpreadsheetSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onToggleStar: (id: string) => Promise<void>;
  onRename: (id: string, title: string) => Promise<void>;
}

export function SpreadsheetListItem({
  spreadsheet,
  onOpen,
  onDelete,
  onDuplicate,
  onToggleStar,
  onRename,
}: SpreadsheetListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(spreadsheet.title);

  const handleRename = async () => {
    if (newTitle.trim() && newTitle !== spreadsheet.title) {
      await onRename(spreadsheet.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div
      className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50"
      style={{ padding: "12px 20px" }}
      data-testid={`spreadsheet-list-item-${spreadsheet.id}`}
    >
      {/* Spreadsheet icon */}
      <svg
        width="16"
        height="20"
        viewBox="0 0 18 22"
        fill="none"
        className="flex-shrink-0"
      >
        <path
          d="M1 3a2 2 0 012-2h8l6 6v12a2 2 0 01-2 2H3a2 2 0 01-2-2V3z"
          fill="#0f9d58"
        />
        <path d="M11 1l6 6h-4a2 2 0 01-2-2V1z" fill="#87ceab" />
        <rect
          x="4"
          y="10"
          width="10"
          height="1.5"
          rx="0.5"
          fill="white"
          opacity="0.7"
        />
        <rect
          x="4"
          y="13"
          width="10"
          height="1.5"
          rx="0.5"
          fill="white"
          opacity="0.7"
        />
        <rect
          x="4"
          y="16"
          width="6"
          height="1.5"
          rx="0.5"
          fill="white"
          opacity="0.7"
        />
      </svg>

      {/* Star */}
      <button
        onClick={() => onToggleStar(spreadsheet.id)}
        className="flex-shrink-0 text-gray-300 transition-colors hover:text-yellow-500"
        data-testid={`list-star-btn-${spreadsheet.id}`}
      >
        {spreadsheet.isStarred ? (
          <svg
            className="h-4 w-4 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
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

      {/* Title */}
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => onOpen(spreadsheet.id)}
      >
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
            onClick={(e) => e.stopPropagation()}
            data-testid={`list-rename-input-${spreadsheet.id}`}
          />
        ) : (
          <p className="truncate text-sm font-medium text-gray-900">
            {spreadsheet.title}
          </p>
        )}
      </div>

      {/* Owner */}
      <span className="flex-shrink-0 text-xs text-gray-500">
        {spreadsheet.owner.name ?? "Unknown"}
      </span>

      {/* Date */}
      <span className="flex-shrink-0 text-xs text-gray-500">
        {new Date(spreadsheet.updatedAt).toLocaleDateString()}
      </span>

      {/* Role badge */}
      {spreadsheet.role !== "owner" && (
        <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
          {spreadsheet.role}
        </span>
      )}

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsRenaming(true);
          }}
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Rename"
          data-testid={`list-rename-btn-${spreadsheet.id}`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(spreadsheet.id);
          }}
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Duplicate"
          data-testid={`list-duplicate-btn-${spreadsheet.id}`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
        {spreadsheet.role === "owner" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(spreadsheet.id);
            }}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete"
            data-testid={`list-delete-btn-${spreadsheet.id}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

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

const PREVIEW_PALETTES = [
  { accent: "#4285f4", light: "#e8f0fe" }, // Blue
  { accent: "#0f9d58", light: "#e6f4ea" }, // Green
  { accent: "#f4b400", light: "#fef7e0" }, // Amber
  { accent: "#db4437", light: "#fce8e6" }, // Red
  { accent: "#ab47bc", light: "#f3e8f4" }, // Purple
  { accent: "#00acc1", light: "#e0f7fa" }, // Teal
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
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
  const palette =
    PREVIEW_PALETTES[hashString(spreadsheet.id) % PREVIEW_PALETTES.length];

  return (
    <div
      className="group relative rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg hover:border-gray-300"
      data-testid={`spreadsheet-card-${spreadsheet.id}`}
    >
      {/* Preview area — mini spreadsheet visualization */}
      <div
        className="cursor-pointer overflow-hidden rounded-t-xl"
        style={{ height: 140, backgroundColor: palette.light }}
        onClick={() => onOpen(spreadsheet.id)}
        data-testid={`open-spreadsheet-${spreadsheet.id}`}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 140"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Colored header row */}
          <rect
            x="0"
            y="0"
            width="200"
            height="26"
            fill={palette.accent}
            opacity="0.13"
          />
          <rect
            x="14"
            y="7"
            width="36"
            height="11"
            rx="2"
            fill={palette.accent}
            opacity="0.32"
          />
          <rect
            x="60"
            y="7"
            width="28"
            height="11"
            rx="2"
            fill={palette.accent}
            opacity="0.22"
          />
          <rect
            x="98"
            y="7"
            width="34"
            height="11"
            rx="2"
            fill={palette.accent}
            opacity="0.22"
          />
          <rect
            x="142"
            y="7"
            width="40"
            height="11"
            rx="2"
            fill={palette.accent}
            opacity="0.22"
          />
          {/* Horizontal grid lines */}
          <line
            x1="0"
            y1="26"
            x2="200"
            y2="26"
            stroke={palette.accent}
            strokeWidth="0.6"
            opacity="0.18"
          />
          {[50, 74, 98, 122].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="200"
              y2={y}
              stroke="#d1d5db"
              strokeWidth="0.5"
              opacity="0.6"
            />
          ))}
          {/* Vertical grid lines */}
          {[52, 90, 134].map((x) => (
            <line
              key={x}
              x1={x}
              y1="0"
              x2={x}
              y2="140"
              stroke="#d1d5db"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}
          {/* Row data — row 1 */}
          <rect
            x="14"
            y="33"
            width="26"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.3"
          />
          <rect
            x="60"
            y="33"
            width="20"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.25"
          />
          <rect
            x="98"
            y="33"
            width="28"
            height="9"
            rx="1.5"
            fill={palette.accent}
            opacity="0.14"
          />
          <rect
            x="142"
            y="33"
            width="18"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.22"
          />
          {/* Row data — row 2 */}
          <rect
            x="14"
            y="57"
            width="30"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.28"
          />
          <rect
            x="60"
            y="57"
            width="16"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.22"
          />
          <rect
            x="98"
            y="57"
            width="24"
            height="9"
            rx="1.5"
            fill={palette.accent}
            opacity="0.12"
          />
          <rect
            x="142"
            y="57"
            width="24"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.25"
          />
          {/* Row data — row 3 */}
          <rect
            x="14"
            y="81"
            width="22"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.25"
          />
          <rect
            x="60"
            y="81"
            width="24"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.2"
          />
          <rect
            x="98"
            y="81"
            width="20"
            height="9"
            rx="1.5"
            fill={palette.accent}
            opacity="0.16"
          />
          <rect
            x="142"
            y="81"
            width="30"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.2"
          />
          {/* Row data — row 4 */}
          <rect
            x="14"
            y="105"
            width="34"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.22"
          />
          <rect
            x="60"
            y="105"
            width="18"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.18"
          />
          <rect
            x="98"
            y="105"
            width="22"
            height="9"
            rx="1.5"
            fill={palette.accent}
            opacity="0.1"
          />
          <rect
            x="142"
            y="105"
            width="14"
            height="9"
            rx="1.5"
            fill="#9ca3af"
            opacity="0.18"
          />
        </svg>
      </div>

      {/* Card body */}
      <div className="px-4 py-3" style={{ padding: "12px 16px" }}>
        <div className="flex items-start gap-2.5">
          {/* Green spreadsheet icon */}
          <svg
            width="18"
            height="22"
            viewBox="0 0 18 22"
            fill="none"
            className="mt-0.5 flex-shrink-0"
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
          <div className="min-w-0 flex-1">
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
                className="w-full rounded border border-[#1a73e8] px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a73e8]/30"
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
            <p className="mt-1 flex items-center text-xs text-gray-400">
              {timeAgo}
              {spreadsheet.role !== "owner" && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {spreadsheet.role}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Star button */}
      <button
        onClick={() => onToggleStar(spreadsheet.id)}
        className="absolute right-10 top-2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/80 hover:text-yellow-500"
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
      <div className="absolute right-2 top-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-full p-1.5 text-gray-400 opacity-0 transition-all hover:bg-white/80 hover:text-gray-600 group-hover:opacity-100"
          data-testid={`menu-btn-${spreadsheet.id}`}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
            data-testid={`menu-${spreadsheet.id}`}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onOpen(spreadsheet.id);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Open
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setIsRenaming(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              data-testid={`rename-btn-${spreadsheet.id}`}
            >
              Rename
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onDuplicate(spreadsheet.id);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              data-testid={`duplicate-btn-${spreadsheet.id}`}
            >
              Make a copy
            </button>
            {spreadsheet.role === "owner" && (
              <>
                <div className="my-1 border-t border-gray-100" />
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
              </>
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

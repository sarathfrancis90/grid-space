import { useEffect, useCallback } from "react";
import { useCloudStore } from "../../stores/cloudStore";

interface TrashItem {
  id: string;
  title: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; avatarUrl: string | null };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function daysUntilPurge(deletedAt: string): number {
  const deleted = new Date(deletedAt);
  const purgeDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

interface TrashItemRowProps {
  item: TrashItem;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

function TrashItemRow({
  item,
  onRestore,
  onPermanentDelete,
}: TrashItemRowProps) {
  const remaining = daysUntilPurge(item.deletedAt);

  return (
    <div
      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
      style={{ padding: "12px 20px" }}
      data-testid={`trash-item-${item.id}`}
    >
      {/* Trash icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d="M3 5h12M6 5V3.5A1.5 1.5 0 017.5 2h3A1.5 1.5 0 0112 3.5V5M14 5v10a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 014 15V5" />
        <line x1="7.5" y1="8" x2="7.5" y2="13" />
        <line x1="10.5" y1="8" x2="10.5" y2="13" />
      </svg>

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
        {item.title}
      </span>

      {/* Deleted date */}
      <span className="flex-shrink-0 text-xs text-gray-400">
        Deleted {formatDate(item.deletedAt)}
      </span>

      {/* Days remaining */}
      <span className="flex-shrink-0 text-xs text-gray-400">
        {remaining > 0 ? `${remaining}d left` : "Expiring"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onRestore(item.id)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-[#1a73e8] transition-colors hover:bg-blue-50"
          style={{ padding: "6px 12px" }}
          data-testid={`restore-btn-${item.id}`}
        >
          Restore
        </button>
        <button
          onClick={() => onPermanentDelete(item.id)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
          style={{ padding: "6px 12px" }}
          data-testid={`permanent-delete-btn-${item.id}`}
        >
          Delete forever
        </button>
      </div>
    </div>
  );
}

export function TrashView() {
  const trashItems = useCloudStore((s) => s.trashItems);
  const isTrashLoading = useCloudStore((s) => s.isTrashLoading);
  const trashPage = useCloudStore((s) => s.trashPage);
  const trashTotalPages = useCloudStore((s) => s.trashTotalPages);
  const fetchTrash = useCloudStore((s) => s.fetchTrash);
  const restoreSpreadsheet = useCloudStore((s) => s.restoreSpreadsheet);
  const permanentlyDeleteSpreadsheet = useCloudStore(
    (s) => s.permanentlyDeleteSpreadsheet,
  );
  const setTrashPage = useCloudStore((s) => s.setTrashPage);
  const error = useCloudStore((s) => s.error);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash, trashPage]);

  const handleRestore = useCallback(
    async (id: string) => {
      await restoreSpreadsheet(id);
    },
    [restoreSpreadsheet],
  );

  const handlePermanentDelete = useCallback(
    async (id: string) => {
      await permanentlyDeleteSpreadsheet(id);
    },
    [permanentlyDeleteSpreadsheet],
  );

  if (isTrashLoading) {
    return (
      <div
        className="py-12 text-center text-sm text-gray-400"
        data-testid="trash-loading"
      >
        Loading trash...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600"
        data-testid="trash-error"
      >
        {error}
      </div>
    );
  }

  if (trashItems.length === 0) {
    return (
      <div
        className="flex flex-col items-center py-24"
        data-testid="trash-empty"
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="mb-6"
        >
          <path
            d="M12 20h40M20 20V14a6 6 0 016-6h12a6 6 0 016 6v6M50 20v32a6 6 0 01-6 6H20a6 6 0 01-6-6V20"
            stroke="#d1d5db"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="26"
            y1="28"
            x2="26"
            y2="48"
            stroke="#d1d5db"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="38"
            y1="28"
            x2="38"
            y2="48"
            stroke="#d1d5db"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <p className="mb-2 text-lg font-semibold text-gray-700">
          Trash is empty
        </p>
        <p className="text-sm text-gray-400">
          Items you delete will appear here for 30 days before being permanently
          removed.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="trash-view">
      <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
        Items in trash are automatically deleted after 30 days.
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div
          className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-2"
          style={{ padding: "8px 20px" }}
        >
          <span className="w-[18px] flex-shrink-0" />
          <span className="min-w-0 flex-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Name
          </span>
          <span className="flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Deleted
          </span>
          <span className="flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Expires
          </span>
          <span className="w-[180px] flex-shrink-0" />
        </div>

        <div className="divide-y divide-gray-100">
          {trashItems.map((item) => (
            <TrashItemRow
              key={item.id}
              item={item}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {trashTotalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setTrashPage(Math.max(1, trashPage - 1))}
            disabled={trashPage <= 1}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
            style={{ padding: "8px 16px" }}
            data-testid="trash-prev-page-btn"
          >
            Previous
          </button>
          <span
            className="px-3 text-sm text-gray-500"
            data-testid="trash-page-info"
          >
            Page {trashPage} of {trashTotalPages}
          </span>
          <button
            onClick={() =>
              setTrashPage(Math.min(trashTotalPages, trashPage + 1))
            }
            disabled={trashPage >= trashTotalPages}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
            style={{ padding: "8px 16px" }}
            data-testid="trash-next-page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

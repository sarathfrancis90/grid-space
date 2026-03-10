import { useEffect, useCallback } from "react";
import { useCloudStore } from "../../stores/cloudStore";
import { DashboardSkeleton } from "./DashboardSkeleton";

function formatDeletedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function daysUntilPurge(dateStr: string): number {
  const deletedDate = new Date(dateStr);
  const purgeDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export function TrashView() {
  const trashItems = useCloudStore((s) => s.trashItems);
  const isTrashLoading = useCloudStore((s) => s.isTrashLoading);
  const trashPage = useCloudStore((s) => s.trashPage);
  const trashTotalPages = useCloudStore((s) => s.trashTotalPages);
  const error = useCloudStore((s) => s.error);
  const fetchTrash = useCloudStore((s) => s.fetchTrash);
  const restoreSpreadsheet = useCloudStore((s) => s.restoreSpreadsheet);
  const permanentDeleteSpreadsheet = useCloudStore(
    (s) => s.permanentDeleteSpreadsheet,
  );
  const emptyTrash = useCloudStore((s) => s.emptyTrash);
  const setTrashPage = useCloudStore((s) => s.setTrashPage);

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
      await permanentDeleteSpreadsheet(id);
    },
    [permanentDeleteSpreadsheet],
  );

  const handleEmptyTrash = useCallback(async () => {
    await emptyTrash();
  }, [emptyTrash]);

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

  if (isTrashLoading) {
    return <DashboardSkeleton viewMode="list" />;
  }

  if (trashItems.length === 0) {
    return (
      <div
        className="flex flex-col items-center py-24"
        data-testid="trash-empty-state"
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          className="mb-8"
        >
          <rect
            x="24"
            y="20"
            width="48"
            height="56"
            rx="4"
            fill="#f3f4f6"
            stroke="#9ca3af"
            strokeWidth="2"
          />
          <path
            d="M20 28h56"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M38 20v-4a2 2 0 012-2h16a2 2 0 012 2v4"
            stroke="#9ca3af"
            strokeWidth="2"
          />
          <line
            x1="40"
            y1="36"
            x2="40"
            y2="64"
            stroke="#d1d5db"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="48"
            y1="36"
            x2="48"
            y2="64"
            stroke="#d1d5db"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="56"
            y1="36"
            x2="56"
            y2="64"
            stroke="#d1d5db"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <p className="mb-2 text-xl font-semibold text-gray-800">
          Trash is empty
        </p>
        <p className="text-sm text-gray-500">
          Items you delete will appear here for 30 days before being permanently
          removed
        </p>
      </div>
    );
  }

  return (
    <div data-testid="trash-view">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Items in trash are automatically deleted after 30 days
        </p>
        <button
          onClick={handleEmptyTrash}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          style={{ padding: "8px 16px" }}
          data-testid="empty-trash-btn"
        >
          Empty trash
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-2"
          style={{ padding: "8px 20px" }}
        >
          <span className="min-w-0 flex-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Name
          </span>
          <span className="w-28 flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Deleted
          </span>
          <span className="w-28 flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Auto-purge
          </span>
          <span className="w-40 flex-shrink-0" />
        </div>
        <div className="divide-y divide-gray-100">
          {trashItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50"
              style={{ padding: "12px 20px" }}
              data-testid={`trash-item-${item.id}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-700">
                  {item.title}
                </p>
              </div>
              <span className="w-28 flex-shrink-0 text-xs text-gray-500">
                {formatDeletedDate(item.deletedAt)}
              </span>
              <span className="w-28 flex-shrink-0 text-xs text-gray-500">
                {daysUntilPurge(item.deletedAt)} days left
              </span>
              <div className="flex w-40 flex-shrink-0 items-center justify-end gap-2">
                <button
                  onClick={() => handleRestore(item.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#1a73e8] transition-colors hover:bg-blue-50"
                  style={{ padding: "6px 12px" }}
                  data-testid={`restore-btn-${item.id}`}
                >
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(item.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  style={{ padding: "6px 12px" }}
                  data-testid={`permanent-delete-btn-${item.id}`}
                >
                  Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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

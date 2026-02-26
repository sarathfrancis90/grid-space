/**
 * CommentsSidebar — list all comments in a sidebar panel with filters.
 * S15-006: Comments panel — list all comments in sidebar
 * S15-007: Filter comments: All, For you, Open, Resolved
 */
import { useMemo, useCallback } from "react";
import { useCommentStore, type CommentFilter } from "../../stores/commentStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

const FILTERS: Array<{ label: string; value: CommentFilter }> = [
  { label: "All", value: "all" },
  { label: "For you", value: "for-you" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
];

export function CommentsSidebar({ currentUserId }: { currentUserId?: string }) {
  const isPanelOpen = useCommentStore((s) => s.isPanelOpen);
  const filter = useCommentStore((s) => s.filter);
  const closePanel = useCommentStore((s) => s.closePanel);
  const setFilter = useCommentStore((s) => s.setFilter);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const filteredComments = useMemo(() => {
    if (!sheetId) return [];
    return useCommentStore
      .getState()
      .getFilteredComments(sheetId, currentUserId);
  }, [sheetId, currentUserId, filter]);

  const handleSetActive = useCallback(
    (cellKey: string) => {
      if (sheetId) {
        useCommentStore.getState().setActiveCommentCell(sheetId, cellKey);
      }
    },
    [sheetId],
  );

  const handleResolve = useCallback(
    (commentId: string) => {
      if (sheetId) {
        useCommentStore.getState().resolveComment(sheetId, commentId);
      }
    },
    [sheetId],
  );

  const handleUnresolve = useCallback(
    (commentId: string) => {
      if (sheetId) {
        useCommentStore.getState().unresolveComment(sheetId, commentId);
      }
    },
    [sheetId],
  );

  if (!isPanelOpen) return null;

  return (
    <div
      data-testid="comments-sidebar"
      className="absolute right-0 top-0 w-80 bg-white border-l border-gray-300 shadow-lg z-40 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-sm font-semibold">Comments</span>
        <button
          data-testid="comments-sidebar-close"
          className="text-gray-400 hover:text-gray-600 text-lg"
          onClick={closePanel}
          type="button"
        >
          &times;
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`flex-1 px-2 py-1.5 text-xs font-medium border-b-2 ${
              filter === f.value
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFilter(f.value)}
            data-testid={`comment-filter-${f.value}`}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredComments.length === 0 ? (
          <div
            className="text-center text-sm text-gray-400 py-8"
            data-testid="no-comments"
          >
            No comments
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg border p-2 text-sm cursor-pointer hover:bg-gray-50 ${
                comment.resolved
                  ? "border-green-200 bg-green-50/50"
                  : "border-gray-200"
              }`}
              onClick={() => handleSetActive(comment.cellKey)}
              data-testid={`sidebar-comment-${comment.id}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800 text-xs">
                  {comment.author}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {comment.cellKey}
                  </span>
                  {comment.resolved ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnresolve(comment.id);
                      }}
                      className="text-xs text-green-600 hover:underline"
                      data-testid={`sidebar-unresolve-${comment.id}`}
                      type="button"
                    >
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(comment.id);
                      }}
                      className="text-xs text-blue-500 hover:underline"
                      data-testid={`sidebar-resolve-${comment.id}`}
                      type="button"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-xs line-clamp-2">
                {comment.text}
              </p>
              {comment.replies && comment.replies.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {comment.replies.length}{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

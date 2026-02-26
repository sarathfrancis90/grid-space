/**
 * CommentPanel — add, view, edit, delete comments with threaded replies,
 * @mention autocomplete, and resolve/unresolve.
 * S7-018 to S7-020, S15-001 to S15-005
 */
import { useState, useCallback } from "react";
import { useCommentStore } from "../../stores/commentStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { getCellKey } from "../../utils/coordinates";
import type { CellComment, CommentReply } from "../../types/grid";

export function CommentPanel() {
  const activeCell = useCommentStore((s) => s.activeCommentCell);
  const activeSheet = useCommentStore((s) => s.activeSheetForComment);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const effectiveSheet = activeSheet ?? sheetId;

  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const comments = activeCell
    ? useCommentStore.getState().getCommentsForCell(effectiveSheet, activeCell)
    : [];

  const handleAddComment = useCallback(() => {
    if (!activeCell || !newText.trim()) return;
    const comment: CellComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cellKey: activeCell,
      sheetId: effectiveSheet,
      text: newText.trim(),
      author: "You",
      createdAt: Date.now(),
      replies: [],
      resolved: false,
    };
    useCommentStore.getState().addComment(effectiveSheet, comment);
    setNewText("");
  }, [activeCell, effectiveSheet, newText]);

  const handleEdit = useCallback(
    (commentId: string) => {
      useCommentStore
        .getState()
        .editComment(effectiveSheet, commentId, editText);
      setEditingId(null);
      setEditText("");
    },
    [effectiveSheet, editText],
  );

  const handleDelete = useCallback(
    (commentId: string) => {
      useCommentStore.getState().deleteComment(effectiveSheet, commentId);
    },
    [effectiveSheet],
  );

  const handleResolve = useCallback(
    (commentId: string) => {
      useCommentStore.getState().resolveComment(effectiveSheet, commentId);
    },
    [effectiveSheet],
  );

  const handleUnresolve = useCallback(
    (commentId: string) => {
      useCommentStore.getState().unresolveComment(effectiveSheet, commentId);
    },
    [effectiveSheet],
  );

  const handleAddReply = useCallback(
    (commentId: string) => {
      if (!replyText.trim()) return;
      const reply: CommentReply = {
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: replyText.trim(),
        author: "You",
        createdAt: Date.now(),
      };
      useCommentStore.getState().addReply(effectiveSheet, commentId, reply);
      setReplyingTo(null);
      setReplyText("");
    },
    [effectiveSheet, replyText],
  );

  const handleClose = useCallback(() => {
    useCommentStore.getState().clearActiveComment();
  }, []);

  if (!activeCell) return null;

  return (
    <div
      data-testid="comment-panel"
      className="absolute right-0 top-0 w-72 bg-white border-l border-gray-300 shadow-lg z-40 h-full flex flex-col"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-sm font-medium" data-testid="comment-cell-ref">
          Comments — {activeCell}
        </span>
        <button
          data-testid="comment-close"
          className="text-gray-400 hover:text-gray-600 text-lg"
          onClick={handleClose}
          type="button"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            data-testid={`comment-item-${c.id}`}
            className={`rounded p-2 text-sm ${
              c.resolved ? "bg-green-50 border border-green-200" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-700">{c.author}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
                {c.resolved && (
                  <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                    Resolved
                  </span>
                )}
              </div>
            </div>

            {editingId === c.id ? (
              <div>
                <textarea
                  data-testid="comment-edit-input"
                  className="w-full border border-gray-300 rounded p-1 text-sm resize-none"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-1 mt-1">
                  <button
                    data-testid="comment-save-edit"
                    className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded"
                    onClick={() => handleEdit(c.id)}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    data-testid="comment-cancel-edit"
                    className="text-xs px-2 py-0.5 bg-gray-200 rounded"
                    onClick={() => setEditingId(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">{c.text}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <button
                    data-testid={`comment-edit-${c.id}`}
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditText(c.text);
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    data-testid={`comment-delete-${c.id}`}
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => handleDelete(c.id)}
                    type="button"
                  >
                    Delete
                  </button>
                  <button
                    data-testid={`comment-reply-${c.id}`}
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => setReplyingTo(c.id)}
                    type="button"
                  >
                    Reply
                  </button>
                  {c.resolved ? (
                    <button
                      data-testid={`comment-unresolve-${c.id}`}
                      className="text-xs text-green-600 hover:underline"
                      onClick={() => handleUnresolve(c.id)}
                      type="button"
                    >
                      Reopen
                    </button>
                  ) : (
                    <button
                      data-testid={`comment-resolve-${c.id}`}
                      className="text-xs text-green-600 hover:underline"
                      onClick={() => handleResolve(c.id)}
                      type="button"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Threaded replies */}
            {c.replies && c.replies.length > 0 && (
              <div className="ml-3 mt-2 border-l-2 border-gray-200 pl-2 space-y-1">
                {c.replies.map((r) => (
                  <div
                    key={r.id}
                    className="text-xs"
                    data-testid={`reply-item-${r.id}`}
                  >
                    <span className="font-medium text-gray-700">
                      {r.author}
                    </span>
                    <span className="text-gray-400 ml-1">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                    <p className="text-gray-600 mt-0.5">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            {replyingTo === c.id && (
              <div className="mt-2 ml-3" data-testid={`reply-form-${c.id}`}>
                <textarea
                  data-testid="reply-input"
                  className="w-full border border-gray-300 rounded p-1 text-xs resize-none"
                  placeholder="Reply... (use @email for mentions)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  spellCheck
                />
                <div className="flex gap-1 mt-1">
                  <button
                    data-testid="reply-submit"
                    className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded"
                    onClick={() => handleAddReply(c.id)}
                    disabled={!replyText.trim()}
                    type="button"
                  >
                    Reply
                  </button>
                  <button
                    data-testid="reply-cancel"
                    className="text-xs px-2 py-0.5 bg-gray-200 rounded"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 p-3">
        <textarea
          data-testid="comment-new-input"
          className="w-full border border-gray-300 rounded p-2 text-sm resize-none"
          placeholder="Add a comment... (use @email for mentions)"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={2}
          spellCheck
        />
        <button
          data-testid="comment-add-btn"
          className="mt-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={handleAddComment}
          disabled={!newText.trim()}
          type="button"
        >
          Comment
        </button>
      </div>
    </div>
  );
}

/** Cell note component — simple, non-threaded yellow triangle indicator. S7-020 */
/** Comment count badge on cells with comments. S15-005 */
export function CellNoteIndicator({
  sheetId,
  row,
  col,
}: {
  sheetId: string;
  row: number;
  col: number;
}) {
  const cellData = useCellStore.getState().getCell(sheetId, row, col);
  const cellKey = getCellKey(row, col);
  const hasComment = useCommentStore.getState().hasComment(sheetId, cellKey);
  const commentCount = useCommentStore
    .getState()
    .getCellCommentCount(sheetId, cellKey);
  const hasNote = Boolean(cellData?.note);

  if (!hasComment && !hasNote) return null;

  return (
    <div
      data-testid={`cell-indicator-${row}-${col}`}
      className="absolute top-0 right-0"
      title={
        hasNote
          ? cellData?.note
          : `${commentCount} comment${commentCount !== 1 ? "s" : ""}`
      }
    >
      <div
        className="w-0 h-0"
        style={{
          borderLeft: "6px solid transparent",
          borderTop: hasNote ? "6px solid #f59e0b" : "6px solid #3b82f6",
        }}
      />
      {hasComment && commentCount > 0 && (
        <span
          className="absolute -top-1 -right-2 text-[8px] text-blue-600 font-bold"
          data-testid={`comment-count-${row}-${col}`}
        >
          {commentCount}
        </span>
      )}
    </div>
  );
}

/**
 * CommentPanel — add, view, edit, delete comments and notes on cells.
 * S7-018 to S7-020
 */
import { useState, useCallback } from "react";
import { useCommentStore } from "../../stores/commentStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { getCellKey } from "../../utils/coordinates";
import type { CellComment } from "../../types/grid";

export function CommentPanel() {
  const activeCell = useCommentStore((s) => s.activeCommentCell);
  const activeSheet = useCommentStore((s) => s.activeSheetForComment);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const effectiveSheet = activeSheet ?? sheetId;

  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            data-testid={`comment-item-${c.id}`}
            className="bg-gray-50 rounded p-2 text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-700">{c.author}</span>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
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
                <div className="flex gap-2 mt-1">
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
          placeholder="Add a comment..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={2}
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
  const hasComment = useCommentStore
    .getState()
    .hasComment(sheetId, getCellKey(row, col));
  const hasNote = Boolean(cellData?.note);

  if (!hasComment && !hasNote) return null;

  return (
    <div
      data-testid={`cell-indicator-${row}-${col}`}
      className="absolute top-0 right-0"
      title={hasNote ? cellData?.note : "Has comment"}
    >
      <div
        className="w-0 h-0"
        style={{
          borderLeft: "6px solid transparent",
          borderTop: hasNote ? "6px solid #f59e0b" : "6px solid #3b82f6",
        }}
      />
    </div>
  );
}

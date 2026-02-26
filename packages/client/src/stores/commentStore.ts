/**
 * Comment store — manages cell comments per sheet.
 * Supports threaded replies, @mentions, resolving, comment panel with filters.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellComment, CommentReply } from "../types/grid";

export type CommentFilter = "all" | "for-you" | "open" | "resolved";

interface CommentState {
  comments: Map<string, CellComment[]>;
  activeCommentCell: string | null;
  activeSheetForComment: string | null;
  isPanelOpen: boolean;
  filter: CommentFilter;

  addComment: (sheetId: string, comment: CellComment) => void;
  editComment: (sheetId: string, commentId: string, text: string) => void;
  deleteComment: (sheetId: string, commentId: string) => void;
  getCommentsForCell: (sheetId: string, cellKey: string) => CellComment[];
  getCommentCount: (sheetId: string) => number;
  getCellCommentCount: (sheetId: string, cellKey: string) => number;
  hasComment: (sheetId: string, cellKey: string) => boolean;
  setActiveCommentCell: (
    sheetId: string | null,
    cellKey: string | null,
  ) => void;
  clearActiveComment: () => void;

  // Thread operations
  addReply: (sheetId: string, commentId: string, reply: CommentReply) => void;
  resolveComment: (sheetId: string, commentId: string) => void;
  unresolveComment: (sheetId: string, commentId: string) => void;

  // Panel
  openPanel: () => void;
  closePanel: () => void;
  setFilter: (filter: CommentFilter) => void;
  getFilteredComments: (
    sheetId: string,
    currentUserId?: string,
  ) => CellComment[];
  getAllComments: (sheetId: string) => CellComment[];
}

export const useCommentStore = create<CommentState>()(
  immer((set, get) => ({
    comments: new Map<string, CellComment[]>(),
    activeCommentCell: null,
    activeSheetForComment: null,
    isPanelOpen: false,
    filter: "all" as CommentFilter,

    addComment: (sheetId: string, comment: CellComment) => {
      set((state) => {
        if (!state.comments.has(sheetId)) {
          state.comments.set(sheetId, []);
        }
        const c = {
          ...comment,
          replies: comment.replies ?? [],
          resolved: comment.resolved ?? false,
        };
        state.comments.get(sheetId)!.push(c);
      });
    },

    editComment: (sheetId: string, commentId: string, text: string) => {
      set((state) => {
        const comments = state.comments.get(sheetId);
        if (!comments) return;
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          comment.text = text;
          comment.updatedAt = Date.now();
        }
      });
    },

    deleteComment: (sheetId: string, commentId: string) => {
      set((state) => {
        const comments = state.comments.get(sheetId);
        if (!comments) return;
        state.comments.set(
          sheetId,
          comments.filter((c) => c.id !== commentId),
        );
      });
    },

    getCommentsForCell: (sheetId: string, cellKey: string) => {
      return (
        get()
          .comments.get(sheetId)
          ?.filter((c) => c.cellKey === cellKey) ?? []
      );
    },

    getCommentCount: (sheetId: string) => {
      return get().comments.get(sheetId)?.length ?? 0;
    },

    getCellCommentCount: (sheetId: string, cellKey: string) => {
      return (
        get()
          .comments.get(sheetId)
          ?.filter((c) => c.cellKey === cellKey).length ?? 0
      );
    },

    hasComment: (sheetId: string, cellKey: string) => {
      return (
        get()
          .comments.get(sheetId)
          ?.some((c) => c.cellKey === cellKey) ?? false
      );
    },

    setActiveCommentCell: (sheetId: string | null, cellKey: string | null) => {
      set((state) => {
        state.activeCommentCell = cellKey;
        state.activeSheetForComment = sheetId;
      });
    },

    clearActiveComment: () => {
      set((state) => {
        state.activeCommentCell = null;
        state.activeSheetForComment = null;
      });
    },

    // Thread operations
    addReply: (sheetId: string, commentId: string, reply: CommentReply) => {
      set((state) => {
        const comments = state.comments.get(sheetId);
        if (!comments) return;
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          if (!comment.replies) comment.replies = [];
          comment.replies.push(reply);
        }
      });
    },

    resolveComment: (sheetId: string, commentId: string) => {
      set((state) => {
        const comments = state.comments.get(sheetId);
        if (!comments) return;
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          comment.resolved = true;
        }
      });
    },

    unresolveComment: (sheetId: string, commentId: string) => {
      set((state) => {
        const comments = state.comments.get(sheetId);
        if (!comments) return;
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          comment.resolved = false;
        }
      });
    },

    // Panel
    openPanel: () => {
      set((state) => {
        state.isPanelOpen = true;
      });
    },

    closePanel: () => {
      set((state) => {
        state.isPanelOpen = false;
      });
    },

    setFilter: (filter: CommentFilter) => {
      set((state) => {
        state.filter = filter;
      });
    },

    getFilteredComments: (sheetId: string, currentUserId?: string) => {
      const state = get();
      const all = state.comments.get(sheetId) ?? [];
      switch (state.filter) {
        case "open":
          return all.filter((c) => !c.resolved);
        case "resolved":
          return all.filter((c) => c.resolved);
        case "for-you":
          if (!currentUserId) return all;
          return all.filter(
            (c) =>
              c.authorId === currentUserId ||
              c.replies?.some((r) => r.authorId === currentUserId) ||
              c.text.includes(`@${currentUserId}`),
          );
        default:
          return all;
      }
    },

    getAllComments: (sheetId: string) => {
      return get().comments.get(sheetId) ?? [];
    },
  })),
);

import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import type { CellComment } from "../types/grid";

describe("commentStore — emoji reactions", () => {
  beforeEach(() => {
    useCommentStore.setState({
      comments: new Map(),
      activeCommentCell: null,
      activeSheetForComment: null,
      isPanelOpen: false,
      filter: "all",
    });
  });

  function addTestComment(sheetId: string, commentId: string): void {
    const comment: CellComment = {
      id: commentId,
      cellKey: "A1",
      sheetId,
      text: "Test comment",
      author: "Alice",
      authorId: "user-1",
      createdAt: Date.now(),
      replies: [],
      resolved: false,
      reactions: [],
    };
    useCommentStore.getState().addComment(sheetId, comment);
  }

  it("adds a new emoji reaction to a comment", () => {
    addTestComment("sheet-1", "c1");
    useCommentStore
      .getState()
      .toggleReaction("sheet-1", "c1", "\u{1F44D}", "user-1", "Alice");

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(1);
    expect(comments[0].reactions![0].emoji).toBe("\u{1F44D}");
    expect(comments[0].reactions![0].userIds).toEqual(["user-1"]);
    expect(comments[0].reactions![0].userNames).toEqual(["Alice"]);
  });

  it("removes a reaction when the same user toggles the same emoji", () => {
    addTestComment("sheet-1", "c1");
    const store = useCommentStore.getState();
    store.toggleReaction("sheet-1", "c1", "\u{1F44D}", "user-1", "Alice");
    store.toggleReaction("sheet-1", "c1", "\u{1F44D}", "user-1", "Alice");

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(0);
  });

  it("allows multiple users to react with the same emoji", () => {
    addTestComment("sheet-1", "c1");
    const store = useCommentStore.getState();
    store.toggleReaction("sheet-1", "c1", "\u{1F44D}", "user-1", "Alice");
    store.toggleReaction("sheet-1", "c1", "\u{1F44D}", "user-2", "Bob");

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(1);
    expect(comments[0].reactions![0].userIds).toEqual(["user-1", "user-2"]);
    expect(comments[0].reactions![0].userNames).toEqual(["Alice", "Bob"]);
  });

  it("supports multiple different emoji reactions", () => {
    addTestComment("sheet-1", "c1");
    const store = useCommentStore.getState();
    store.toggleReaction("sheet-1", "c1", "\u{1F44D}", "user-1", "Alice");
    store.toggleReaction("sheet-1", "c1", "\u{2764}\u{FE0F}", "user-2", "Bob");

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(2);
    expect(comments[0].reactions![0].emoji).toBe("\u{1F44D}");
    expect(comments[0].reactions![1].emoji).toBe("\u{2764}\u{FE0F}");
  });

  it("sets reactions directly via setReactions", () => {
    addTestComment("sheet-1", "c1");
    useCommentStore.getState().setReactions("sheet-1", "c1", [
      {
        emoji: "\u{1F525}",
        userIds: ["user-1", "user-2"],
        userNames: ["Alice", "Bob"],
      },
    ]);

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(1);
    expect(comments[0].reactions![0].emoji).toBe("\u{1F525}");
    expect(comments[0].reactions![0].userIds).toHaveLength(2);
  });

  it("does nothing when toggling reaction on non-existent comment", () => {
    addTestComment("sheet-1", "c1");
    useCommentStore
      .getState()
      .toggleReaction("sheet-1", "nonexistent", "\u{1F44D}", "user-1", "Alice");

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(0);
  });

  it("initializes reactions as empty array in addComment", () => {
    const comment: CellComment = {
      id: "c-no-reactions",
      cellKey: "B2",
      sheetId: "sheet-1",
      text: "No reactions specified",
      author: "Bob",
      createdAt: Date.now(),
    };
    useCommentStore.getState().addComment("sheet-1", comment);

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "B2");
    expect(comments[0].reactions).toEqual([]);
  });
});

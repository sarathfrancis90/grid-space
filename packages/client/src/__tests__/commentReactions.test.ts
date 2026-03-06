import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import type { CellComment } from "../types/grid";

describe("commentStore — emoji reactions", () => {
  const sheetId = "sheet-1";

  const makeComment = (id: string): CellComment => ({
    id,
    cellKey: "A1",
    sheetId,
    text: "Test comment",
    author: "User",
    authorId: "user-1",
    createdAt: Date.now(),
    replies: [],
    resolved: false,
    reactions: [],
  });

  beforeEach(() => {
    useCommentStore.setState({
      comments: new Map(),
      activeCommentCell: null,
      activeSheetForComment: null,
      isPanelOpen: false,
      filter: "all",
    });
  });

  it("adds a reaction to a comment", () => {
    const store = useCommentStore.getState();
    store.addComment(sheetId, makeComment("c-1"));
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-1");

    const reactions = useCommentStore.getState().getReactions(sheetId, "c-1");
    expect(reactions).toHaveLength(1);
    expect(reactions[0].emoji).toBe("\u{1F44D}");
    expect(reactions[0].count).toBe(1);
    expect(reactions[0].userIds).toEqual(["user-1"]);
  });

  it("removes a reaction when toggled again by same user", () => {
    const store = useCommentStore.getState();
    store.addComment(sheetId, makeComment("c-1"));
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-1");
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-1");

    const reactions = useCommentStore.getState().getReactions(sheetId, "c-1");
    expect(reactions).toHaveLength(0);
  });

  it("allows multiple users to react with same emoji", () => {
    const store = useCommentStore.getState();
    store.addComment(sheetId, makeComment("c-1"));
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-1");
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-2");

    const reactions = useCommentStore.getState().getReactions(sheetId, "c-1");
    expect(reactions).toHaveLength(1);
    expect(reactions[0].count).toBe(2);
    expect(reactions[0].userIds).toEqual(["user-1", "user-2"]);
  });

  it("supports multiple different emojis on same comment", () => {
    const store = useCommentStore.getState();
    store.addComment(sheetId, makeComment("c-1"));
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-1");
    store.toggleReaction(sheetId, "c-1", "\u{2764}\u{FE0F}", "user-2");

    const reactions = useCommentStore.getState().getReactions(sheetId, "c-1");
    expect(reactions).toHaveLength(2);
    expect(reactions.map((r: { emoji: string }) => r.emoji)).toContain("\u{1F44D}");
    expect(reactions.map((r: { emoji: string }) => r.emoji)).toContain("\u{2764}\u{FE0F}");
  });

  it("returns empty array for non-existent comment", () => {
    const reactions = useCommentStore
      .getState()
      .getReactions(sheetId, "nonexistent");
    expect(reactions).toEqual([]);
  });

  it("does nothing when toggling reaction on non-existent comment", () => {
    const store = useCommentStore.getState();
    store.toggleReaction(sheetId, "nonexistent", "\u{1F44D}", "user-1");
    // Should not throw
  });

  it("initializes reactions as empty array when adding comment without reactions", () => {
    const store = useCommentStore.getState();
    const comment: CellComment = {
      id: "c-no-reactions",
      cellKey: "A1",
      sheetId,
      text: "No reactions field",
      author: "User",
      createdAt: Date.now(),
    };
    store.addComment(sheetId, comment);

    const comments = store.getCommentsForCell(sheetId, "A1");
    expect(comments[0].reactions).toEqual([]);
  });

  it("one user removing reaction does not affect other users", () => {
    const store = useCommentStore.getState();
    store.addComment(sheetId, makeComment("c-1"));
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-1");
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-2");
    store.toggleReaction(sheetId, "c-1", "\u{1F44D}", "user-1");

    const reactions = useCommentStore.getState().getReactions(sheetId, "c-1");
    expect(reactions).toHaveLength(1);
    expect(reactions[0].count).toBe(1);
    expect(reactions[0].userIds).toEqual(["user-2"]);
  });
});

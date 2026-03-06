import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import type {
  CellComment,
  CommentReaction,
  ReactionSummary,
} from "../types/grid";

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

  const makeComment = (overrides: Partial<CellComment> = {}): CellComment => ({
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cellKey: "A1",
    sheetId: "sheet-1",
    text: "Test comment",
    author: "Alice",
    authorId: "user-1",
    createdAt: Date.now(),
    replies: [],
    resolved: false,
    reactions: [],
    ...overrides,
  });

  it("toggleReaction adds a reaction to a comment", () => {
    const comment = makeComment({ id: "c-1" });
    useCommentStore.getState().addComment("sheet-1", comment);

    const reaction: CommentReaction = {
      emoji: "\u{1F44D}",
      userId: "user-1",
      userName: "Alice",
    };
    useCommentStore.getState().toggleReaction("sheet-1", "c-1", reaction);

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(1);
    expect(comments[0].reactions![0].emoji).toBe("\u{1F44D}");
    expect(comments[0].reactions![0].userId).toBe("user-1");
  });

  it("toggleReaction removes an existing reaction", () => {
    const comment = makeComment({ id: "c-2" });
    useCommentStore.getState().addComment("sheet-1", comment);

    const reaction: CommentReaction = {
      emoji: "\u{1F44D}",
      userId: "user-1",
      userName: "Alice",
    };

    // Add reaction
    useCommentStore.getState().toggleReaction("sheet-1", "c-2", reaction);
    expect(
      useCommentStore.getState().getCommentsForCell("sheet-1", "A1")[0]
        .reactions,
    ).toHaveLength(1);

    // Toggle same reaction off
    useCommentStore.getState().toggleReaction("sheet-1", "c-2", reaction);
    expect(
      useCommentStore.getState().getCommentsForCell("sheet-1", "A1")[0]
        .reactions,
    ).toHaveLength(0);
  });

  it("supports multiple different emoji reactions on the same comment", () => {
    const comment = makeComment({ id: "c-3" });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().toggleReaction("sheet-1", "c-3", {
      emoji: "\u{1F44D}",
      userId: "user-1",
      userName: "Alice",
    });
    useCommentStore.getState().toggleReaction("sheet-1", "c-3", {
      emoji: "\u{2764}\u{FE0F}",
      userId: "user-1",
      userName: "Alice",
    });

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(2);
  });

  it("supports multiple users reacting with the same emoji", () => {
    const comment = makeComment({ id: "c-4" });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().toggleReaction("sheet-1", "c-4", {
      emoji: "\u{1F44D}",
      userId: "user-1",
      userName: "Alice",
    });
    useCommentStore.getState().toggleReaction("sheet-1", "c-4", {
      emoji: "\u{1F44D}",
      userId: "user-2",
      userName: "Bob",
    });

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(2);
  });

  it("getReactionSummary groups reactions by emoji", () => {
    const comment = makeComment({ id: "c-5" });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().toggleReaction("sheet-1", "c-5", {
      emoji: "\u{1F44D}",
      userId: "user-1",
      userName: "Alice",
    });
    useCommentStore.getState().toggleReaction("sheet-1", "c-5", {
      emoji: "\u{1F44D}",
      userId: "user-2",
      userName: "Bob",
    });
    useCommentStore.getState().toggleReaction("sheet-1", "c-5", {
      emoji: "\u{2764}\u{FE0F}",
      userId: "user-1",
      userName: "Alice",
    });

    const summary = useCommentStore
      .getState()
      .getReactionSummary("sheet-1", "c-5", "user-1");

    expect(summary).toHaveLength(2);

    const thumbsUp = summary.find(
      (s: ReactionSummary) => s.emoji === "\u{1F44D}",
    );
    expect(thumbsUp).toBeDefined();
    expect(thumbsUp!.count).toBe(2);
    expect(thumbsUp!.currentUserReacted).toBe(true);
    expect(thumbsUp!.users).toHaveLength(2);

    const heart = summary.find(
      (s: ReactionSummary) => s.emoji === "\u{2764}\u{FE0F}",
    );
    expect(heart).toBeDefined();
    expect(heart!.count).toBe(1);
    expect(heart!.currentUserReacted).toBe(true);
  });

  it("getReactionSummary shows currentUserReacted correctly", () => {
    const comment = makeComment({ id: "c-6" });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().toggleReaction("sheet-1", "c-6", {
      emoji: "\u{1F44D}",
      userId: "user-2",
      userName: "Bob",
    });

    const summary = useCommentStore
      .getState()
      .getReactionSummary("sheet-1", "c-6", "user-1");

    expect(summary).toHaveLength(1);
    expect(summary[0].currentUserReacted).toBe(false);
  });

  it("getReactionSummary returns empty array for comment without reactions", () => {
    const comment = makeComment({ id: "c-7" });
    useCommentStore.getState().addComment("sheet-1", comment);

    const summary = useCommentStore
      .getState()
      .getReactionSummary("sheet-1", "c-7", "user-1");

    expect(summary).toHaveLength(0);
  });

  it("getReactionSummary returns empty array for non-existent comment", () => {
    const summary = useCommentStore
      .getState()
      .getReactionSummary("sheet-1", "non-existent", "user-1");

    expect(summary).toHaveLength(0);
  });

  it("toggleReaction does nothing for non-existent sheet", () => {
    useCommentStore.getState().toggleReaction("non-existent", "c-1", {
      emoji: "\u{1F44D}",
      userId: "user-1",
      userName: "Alice",
    });

    // Should not throw
    expect(useCommentStore.getState().comments.size).toBe(0);
  });

  it("toggleReaction does nothing for non-existent comment", () => {
    const comment = makeComment({ id: "c-8" });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().toggleReaction("sheet-1", "non-existent", {
      emoji: "\u{1F44D}",
      userId: "user-1",
      userName: "Alice",
    });

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].reactions).toHaveLength(0);
  });
});

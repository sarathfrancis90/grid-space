import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import type { CellComment, CommentReply } from "../types/grid";

describe("commentStore — Sprint 15 features", () => {
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
    ...overrides,
  });

  // S15-001: Threaded comment replies
  it("addReply adds a reply to a comment thread", () => {
    const comment = makeComment({ id: "c-1" });
    useCommentStore.getState().addComment("sheet-1", comment);

    const reply: CommentReply = {
      id: "r-1",
      text: "Great point!",
      author: "Bob",
      authorId: "user-2",
      createdAt: Date.now(),
    };

    useCommentStore.getState().addReply("sheet-1", "c-1", reply);

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].replies).toHaveLength(1);
    expect(comments[0].replies![0].text).toBe("Great point!");
  });

  it("supports multiple replies on same comment", () => {
    const comment = makeComment({ id: "c-multi" });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().addReply("sheet-1", "c-multi", {
      id: "r-1",
      text: "Reply 1",
      author: "Bob",
      createdAt: Date.now(),
    });
    useCommentStore.getState().addReply("sheet-1", "c-multi", {
      id: "r-2",
      text: "Reply 2",
      author: "Carol",
      createdAt: Date.now(),
    });

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].replies).toHaveLength(2);
  });

  // S15-002/003: @mention parsing (frontend just stores it; parsing is server-side)
  it("stores comment text with @mentions", () => {
    const comment = makeComment({
      id: "c-mention",
      text: "Hey @alice@example.com check this out",
    });
    useCommentStore.getState().addComment("sheet-1", comment);

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].text).toContain("@alice@example.com");
  });

  // S15-004: Resolve/unresolve comment thread
  it("resolveComment sets resolved to true", () => {
    const comment = makeComment({ id: "c-resolve" });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().resolveComment("sheet-1", "c-resolve");

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].resolved).toBe(true);
  });

  it("unresolveComment sets resolved to false", () => {
    const comment = makeComment({ id: "c-unresolve", resolved: true });
    useCommentStore.getState().addComment("sheet-1", comment);

    useCommentStore.getState().unresolveComment("sheet-1", "c-unresolve");

    const comments = useCommentStore
      .getState()
      .getCommentsForCell("sheet-1", "A1");
    expect(comments[0].resolved).toBe(false);
  });

  // S15-005: Comment count badge
  it("getCellCommentCount returns count per cell", () => {
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ cellKey: "A1" }));
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ cellKey: "A1" }));
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ cellKey: "B2" }));

    expect(
      useCommentStore.getState().getCellCommentCount("sheet-1", "A1"),
    ).toBe(2);
    expect(
      useCommentStore.getState().getCellCommentCount("sheet-1", "B2"),
    ).toBe(1);
    expect(
      useCommentStore.getState().getCellCommentCount("sheet-1", "C3"),
    ).toBe(0);
  });

  // S15-006: Comments panel
  it("openPanel/closePanel toggles isPanelOpen", () => {
    expect(useCommentStore.getState().isPanelOpen).toBe(false);

    useCommentStore.getState().openPanel();
    expect(useCommentStore.getState().isPanelOpen).toBe(true);

    useCommentStore.getState().closePanel();
    expect(useCommentStore.getState().isPanelOpen).toBe(false);
  });

  // S15-007: Filter comments
  it("getFilteredComments returns all when filter is 'all'", () => {
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ resolved: false }));
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ resolved: true }));

    useCommentStore.getState().setFilter("all");
    const all = useCommentStore.getState().getFilteredComments("sheet-1");
    expect(all).toHaveLength(2);
  });

  it("getFilteredComments returns only open when filter is 'open'", () => {
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ resolved: false }));
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ resolved: true }));

    useCommentStore.getState().setFilter("open");
    const open = useCommentStore.getState().getFilteredComments("sheet-1");
    expect(open).toHaveLength(1);
    expect(open[0].resolved).toBe(false);
  });

  it("getFilteredComments returns only resolved when filter is 'resolved'", () => {
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ resolved: false }));
    useCommentStore
      .getState()
      .addComment("sheet-1", makeComment({ resolved: true }));

    useCommentStore.getState().setFilter("resolved");
    const resolved = useCommentStore.getState().getFilteredComments("sheet-1");
    expect(resolved).toHaveLength(1);
    expect(resolved[0].resolved).toBe(true);
  });

  it("getFilteredComments returns 'for-you' comments", () => {
    useCommentStore.getState().addComment(
      "sheet-1",
      makeComment({
        authorId: "user-1",
        text: "My comment",
      }),
    );
    useCommentStore.getState().addComment(
      "sheet-1",
      makeComment({
        authorId: "user-2",
        text: "Someone else comment",
      }),
    );
    useCommentStore.getState().addComment(
      "sheet-1",
      makeComment({
        authorId: "user-3",
        text: "Mentions @user-1",
      }),
    );

    useCommentStore.getState().setFilter("for-you");
    const forYou = useCommentStore
      .getState()
      .getFilteredComments("sheet-1", "user-1");
    expect(forYou).toHaveLength(2); // authored by user-1 + mentions user-1
  });

  // S15-006: getAllComments
  it("getAllComments returns all comments for a sheet", () => {
    useCommentStore.getState().addComment("sheet-1", makeComment());
    useCommentStore.getState().addComment("sheet-1", makeComment());
    useCommentStore.getState().addComment("sheet-2", makeComment());

    expect(useCommentStore.getState().getAllComments("sheet-1")).toHaveLength(
      2,
    );
    expect(useCommentStore.getState().getAllComments("sheet-2")).toHaveLength(
      1,
    );
  });
});

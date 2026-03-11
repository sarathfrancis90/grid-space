import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import type { CellComment } from "../types/grid";

describe("commentStore — enhanced comments (issue #207)", () => {
  beforeEach(() => {
    useCommentStore.setState({
      comments: new Map(),
      activeCommentCell: null,
      activeSheetForComment: null,
      isPanelOpen: false,
      filter: "all",
      sortOrder: "newest",
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

  describe("assignComment", () => {
    it("assigns a comment to a person", () => {
      const comment = makeComment({ id: "c-assign-1" });
      const store = useCommentStore.getState();
      store.addComment("sheet-1", comment);

      store.assignComment("sheet-1", "c-assign-1", "user-bob", "Bob");

      const updated = store.getCommentsForCell("sheet-1", "A1");
      expect(updated[0].assignee).toBe("user-bob");
      expect(updated[0].assigneeName).toBe("Bob");
    });

    it("unassigns a comment when assignee is undefined", () => {
      const comment = makeComment({
        id: "c-assign-2",
        assignee: "user-bob",
        assigneeName: "Bob",
      });
      const store = useCommentStore.getState();
      store.addComment("sheet-1", comment);

      store.assignComment("sheet-1", "c-assign-2", undefined, undefined);

      const updated = store.getCommentsForCell("sheet-1", "A1");
      expect(updated[0].assignee).toBeUndefined();
      expect(updated[0].assigneeName).toBeUndefined();
    });
  });

  describe("getSortedComments", () => {
    it("sorts by newest first", () => {
      const store = useCommentStore.getState();
      store.addComment(
        "sheet-1",
        makeComment({ id: "c-old", createdAt: 1000 }),
      );
      store.addComment(
        "sheet-1",
        makeComment({ id: "c-new", createdAt: 2000 }),
      );

      useCommentStore.getState().setSortOrder("newest");
      const comments = useCommentStore
        .getState()
        .getCommentsForCell("sheet-1", "A1");
      const sorted = useCommentStore.getState().getSortedComments(comments);

      expect(sorted[0].id).toBe("c-new");
      expect(sorted[1].id).toBe("c-old");
    });

    it("sorts by oldest first", () => {
      const store = useCommentStore.getState();
      store.addComment(
        "sheet-1",
        makeComment({ id: "c-old", createdAt: 1000 }),
      );
      store.addComment(
        "sheet-1",
        makeComment({ id: "c-new", createdAt: 2000 }),
      );

      useCommentStore.getState().setSortOrder("oldest");
      const comments = useCommentStore
        .getState()
        .getCommentsForCell("sheet-1", "A1");
      const sorted = useCommentStore.getState().getSortedComments(comments);

      expect(sorted[0].id).toBe("c-old");
      expect(sorted[1].id).toBe("c-new");
    });

    it("sorts unresolved first", () => {
      const store = useCommentStore.getState();
      store.addComment(
        "sheet-1",
        makeComment({ id: "c-resolved", resolved: true, createdAt: 2000 }),
      );
      store.addComment(
        "sheet-1",
        makeComment({ id: "c-open", resolved: false, createdAt: 1000 }),
      );

      useCommentStore.getState().setSortOrder("unresolved-first");
      const comments = useCommentStore
        .getState()
        .getCommentsForCell("sheet-1", "A1");
      const sorted = useCommentStore.getState().getSortedComments(comments);

      expect(sorted[0].id).toBe("c-open");
      expect(sorted[1].id).toBe("c-resolved");
    });
  });

  describe("cell comment count", () => {
    it("returns correct count for multiple comments on same cell", () => {
      const store = useCommentStore.getState();
      store.addComment("sheet-1", makeComment({ id: "c-1", cellKey: "B2" }));
      store.addComment("sheet-1", makeComment({ id: "c-2", cellKey: "B2" }));
      store.addComment("sheet-1", makeComment({ id: "c-3", cellKey: "B2" }));

      expect(store.getCellCommentCount("sheet-1", "B2")).toBe(3);
    });

    it("hasComment returns true when cell has comments", () => {
      const store = useCommentStore.getState();
      store.addComment("sheet-1", makeComment({ id: "c-1", cellKey: "C3" }));

      expect(store.hasComment("sheet-1", "C3")).toBe(true);
      expect(store.hasComment("sheet-1", "D4")).toBe(false);
    });
  });

  describe("setSortOrder", () => {
    it("updates the sort order state", () => {
      useCommentStore.getState().setSortOrder("oldest");
      expect(useCommentStore.getState().sortOrder).toBe("oldest");

      useCommentStore.getState().setSortOrder("unresolved-first");
      expect(useCommentStore.getState().sortOrder).toBe("unresolved-first");
    });
  });
});

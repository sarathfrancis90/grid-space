import { describe, it, expect, beforeEach } from "vitest";
import { useCommentStore } from "../stores/commentStore";
import type { CellComment } from "../types/grid";

describe("commentStore — enhancements (issue #207)", () => {
  beforeEach(() => {
    useCommentStore.setState({
      comments: new Map(),
      activeCommentCell: null,
      activeSheetForComment: null,
      isPanelOpen: false,
      filter: "all",
      sortBy: "newest",
    });
  });

  const makeComment = (overrides: Partial<CellComment> = {}): CellComment => ({
    id: `c-${Math.random().toString(36).slice(2, 8)}`,
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
    it("assigns a user to a comment", () => {
      const store = useCommentStore.getState();
      const comment = makeComment({ id: "c-assign-1" });
      store.addComment("sheet-1", comment);

      store.assignComment("sheet-1", "c-assign-1", "user-2", "Bob");

      const comments = store.getCommentsForCell("sheet-1", "A1");
      expect(comments[0].assignee).toBe("user-2");
      expect(comments[0].assigneeName).toBe("Bob");
    });

    it("unassigns a comment when called with undefined", () => {
      const store = useCommentStore.getState();
      const comment = makeComment({
        id: "c-assign-2",
        assignee: "user-2",
        assigneeName: "Bob",
      });
      store.addComment("sheet-1", comment);

      store.assignComment("sheet-1", "c-assign-2", undefined, undefined);

      const comments = store.getCommentsForCell("sheet-1", "A1");
      expect(comments[0].assignee).toBeUndefined();
      expect(comments[0].assigneeName).toBeUndefined();
    });
  });

  describe("setSortBy and getSortedComments", () => {
    it("sorts by newest first (default)", () => {
      const store = useCommentStore.getState();
      const c1 = makeComment({ id: "c-s1", createdAt: 1000 });
      const c2 = makeComment({ id: "c-s2", createdAt: 3000 });
      const c3 = makeComment({ id: "c-s3", createdAt: 2000 });

      store.addComment("sheet-1", c1);
      store.addComment("sheet-1", c2);
      store.addComment("sheet-1", c3);

      const sorted = store.getSortedComments(
        store.getCommentsForCell("sheet-1", "A1"),
      );
      expect(sorted.map((c: CellComment) => c.id)).toEqual([
        "c-s2",
        "c-s3",
        "c-s1",
      ]);
    });

    it("sorts by oldest first", () => {
      const store = useCommentStore.getState();
      const c1 = makeComment({ id: "c-o1", createdAt: 1000 });
      const c2 = makeComment({ id: "c-o2", createdAt: 3000 });
      const c3 = makeComment({ id: "c-o3", createdAt: 2000 });

      store.addComment("sheet-1", c1);
      store.addComment("sheet-1", c2);
      store.addComment("sheet-1", c3);

      store.setSortBy("oldest");
      const sorted = store.getSortedComments(
        store.getCommentsForCell("sheet-1", "A1"),
      );
      expect(sorted.map((c: CellComment) => c.id)).toEqual([
        "c-o1",
        "c-o3",
        "c-o2",
      ]);
    });

    it("sorts unresolved first", () => {
      const store = useCommentStore.getState();
      const c1 = makeComment({
        id: "c-u1",
        createdAt: 1000,
        resolved: true,
      });
      const c2 = makeComment({
        id: "c-u2",
        createdAt: 3000,
        resolved: false,
      });
      const c3 = makeComment({
        id: "c-u3",
        createdAt: 2000,
        resolved: false,
      });

      store.addComment("sheet-1", c1);
      store.addComment("sheet-1", c2);
      store.addComment("sheet-1", c3);

      store.setSortBy("unresolved-first");
      const sorted = store.getSortedComments(
        store.getCommentsForCell("sheet-1", "A1"),
      );
      // Unresolved first (newest among unresolved), then resolved
      expect(sorted.map((c: CellComment) => c.id)).toEqual([
        "c-u2",
        "c-u3",
        "c-u1",
      ]);
    });
  });

  describe("getCellCommentCount", () => {
    it("returns correct count for multiple comments on a cell", () => {
      const store = useCommentStore.getState();
      store.addComment("sheet-1", makeComment({ id: "c-cnt1" }));
      store.addComment("sheet-1", makeComment({ id: "c-cnt2" }));
      store.addComment("sheet-1", makeComment({ id: "c-cnt3", cellKey: "B2" }));

      expect(store.getCellCommentCount("sheet-1", "A1")).toBe(2);
      expect(store.getCellCommentCount("sheet-1", "B2")).toBe(1);
    });
  });

  describe("comment with assignee in addComment", () => {
    it("preserves assignee fields when adding comment", () => {
      const store = useCommentStore.getState();
      const comment = makeComment({
        id: "c-with-assign",
        assignee: "user-3",
        assigneeName: "Charlie",
      });
      store.addComment("sheet-1", comment);

      const comments = store.getCommentsForCell("sheet-1", "A1");
      expect(comments[0].assignee).toBe("user-3");
      expect(comments[0].assigneeName).toBe("Charlie");
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { useRealtimeStore, assignColor } from "../stores/realtimeStore";
import type { PresenceUser, CursorPosition } from "../stores/realtimeStore";

function resetStore() {
  useRealtimeStore.getState().reset();
}

describe("realtimeStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("connection status", () => {
    it("starts disconnected", () => {
      expect(useRealtimeStore.getState().connectionStatus).toBe("disconnected");
    });

    it("sets connection status", () => {
      useRealtimeStore.getState().setConnectionStatus("connected");
      expect(useRealtimeStore.getState().connectionStatus).toBe("connected");
    });

    it("cycles through statuses", () => {
      const store = useRealtimeStore.getState();
      store.setConnectionStatus("connecting");
      expect(useRealtimeStore.getState().connectionStatus).toBe("connecting");
      store.setConnectionStatus("connected");
      expect(useRealtimeStore.getState().connectionStatus).toBe("connected");
      store.setConnectionStatus("disconnected");
      expect(useRealtimeStore.getState().connectionStatus).toBe("disconnected");
    });
  });

  describe("presence", () => {
    const alice: PresenceUser = {
      userId: "u1",
      name: "Alice",
      avatarUrl: null,
      color: "#4285F4",
      activeSheet: "sheet-1",
      cursorCell: null,
      selectionRange: null,
      tabId: "tab-1",
    };

    const bob: PresenceUser = {
      userId: "u2",
      name: "Bob",
      avatarUrl: "https://example.com/bob.png",
      color: "#EA4335",
      activeSheet: "sheet-1",
      cursorCell: null,
      selectionRange: null,
      tabId: "tab-2",
    };

    it("sets presence list", () => {
      useRealtimeStore.getState().setPresenceList([alice, bob]);
      expect(useRealtimeStore.getState().connectedUsers).toHaveLength(2);
    });

    it("adds a user", () => {
      useRealtimeStore.getState().addUser(alice);
      expect(useRealtimeStore.getState().connectedUsers).toHaveLength(1);
      expect(useRealtimeStore.getState().connectedUsers[0].name).toBe("Alice");
    });

    it("avoids duplicate user+tab entries", () => {
      useRealtimeStore.getState().addUser(alice);
      useRealtimeStore.getState().addUser({ ...alice, name: "Alice Updated" });
      const users = useRealtimeStore.getState().connectedUsers;
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("Alice Updated");
    });

    it("handles multiple tabs for same user", () => {
      useRealtimeStore.getState().addUser(alice);
      useRealtimeStore.getState().addUser({ ...alice, tabId: "tab-99" });
      expect(useRealtimeStore.getState().connectedUsers).toHaveLength(2);
    });

    it("removes user by userId+tabId", () => {
      useRealtimeStore.getState().setPresenceList([alice, bob]);
      useRealtimeStore.getState().removeUser("u1", "tab-1");
      const users = useRealtimeStore.getState().connectedUsers;
      expect(users).toHaveLength(1);
      expect(users[0].userId).toBe("u2");
    });

    it("also removes cursors when user leaves", () => {
      useRealtimeStore.getState().addUser(alice);
      const cursor: CursorPosition = {
        userId: "u1",
        sheetId: "sheet-1",
        cell: "A1",
        range: null,
        color: "#4285F4",
        name: "Alice",
        tabId: "tab-1",
      };
      useRealtimeStore.getState().updateCursor(cursor);
      expect(useRealtimeStore.getState().activeCursors).toHaveLength(1);

      useRealtimeStore.getState().removeUser("u1", "tab-1");
      expect(useRealtimeStore.getState().activeCursors).toHaveLength(0);
    });

    it("updates user active sheet", () => {
      useRealtimeStore.getState().addUser(alice);
      useRealtimeStore.getState().updateUserSheet("u1", "sheet-2");
      expect(useRealtimeStore.getState().connectedUsers[0].activeSheet).toBe(
        "sheet-2",
      );
    });
  });

  describe("cursors", () => {
    it("adds and updates cursor", () => {
      const cursor: CursorPosition = {
        userId: "u1",
        sheetId: "sheet-1",
        cell: "A1",
        range: null,
        color: "#4285F4",
        name: "Alice",
        tabId: "tab-1",
      };
      useRealtimeStore.getState().updateCursor(cursor);
      expect(useRealtimeStore.getState().activeCursors).toHaveLength(1);

      // Update same cursor
      useRealtimeStore.getState().updateCursor({ ...cursor, cell: "B2" });
      const cursors = useRealtimeStore.getState().activeCursors;
      expect(cursors).toHaveLength(1);
      expect(cursors[0].cell).toBe("B2");
    });

    it("removes cursor", () => {
      const cursor: CursorPosition = {
        userId: "u1",
        sheetId: "sheet-1",
        cell: "A1",
        range: null,
        color: "#4285F4",
        name: "Alice",
        tabId: "tab-1",
      };
      useRealtimeStore.getState().updateCursor(cursor);
      useRealtimeStore.getState().removeCursor("u1", "tab-1");
      expect(useRealtimeStore.getState().activeCursors).toHaveLength(0);
    });
  });

  describe("cell locks", () => {
    it("locks and unlocks cells", () => {
      useRealtimeStore.getState().lockCell("sheet-1:A1", "u1");
      expect(useRealtimeStore.getState().lockedCells["sheet-1:A1"]).toBe("u1");

      useRealtimeStore.getState().unlockCell("sheet-1:A1");
      expect(
        useRealtimeStore.getState().lockedCells["sheet-1:A1"],
      ).toBeUndefined();
    });

    it("sets all locked cells at once", () => {
      useRealtimeStore
        .getState()
        .setLockedCells({ "sheet-1:A1": "u1", "sheet-1:B2": "u2" });
      const locks = useRealtimeStore.getState().lockedCells;
      expect(locks["sheet-1:A1"]).toBe("u1");
      expect(locks["sheet-1:B2"]).toBe("u2");
    });
  });

  describe("typing indicators", () => {
    it("adds typing indicator", () => {
      useRealtimeStore.getState().addTyping({
        userId: "u1",
        sheetId: "sheet-1",
        cell: "A1",
      });
      expect(useRealtimeStore.getState().typingCells).toHaveLength(1);
    });

    it("prevents duplicate typing indicators", () => {
      const indicator = { userId: "u1", sheetId: "sheet-1", cell: "A1" };
      useRealtimeStore.getState().addTyping(indicator);
      useRealtimeStore.getState().addTyping(indicator);
      expect(useRealtimeStore.getState().typingCells).toHaveLength(1);
    });

    it("removes typing indicator", () => {
      useRealtimeStore.getState().addTyping({
        userId: "u1",
        sheetId: "sheet-1",
        cell: "A1",
      });
      useRealtimeStore.getState().removeTyping("u1", "A1");
      expect(useRealtimeStore.getState().typingCells).toHaveLength(0);
    });
  });

  describe("reset", () => {
    it("resets all state", () => {
      useRealtimeStore.getState().setConnectionStatus("connected");
      useRealtimeStore.getState().addUser({
        userId: "u1",
        name: "Alice",
        avatarUrl: null,
        color: "#4285F4",
        activeSheet: "sheet-1",
        cursorCell: null,
        selectionRange: null,
        tabId: "tab-1",
      });
      useRealtimeStore.getState().lockCell("sheet-1:A1", "u1");
      useRealtimeStore.getState().setCurrentSpreadsheet("sp1");

      useRealtimeStore.getState().reset();

      const state = useRealtimeStore.getState();
      expect(state.connectionStatus).toBe("disconnected");
      expect(state.connectedUsers).toHaveLength(0);
      expect(state.activeCursors).toHaveLength(0);
      expect(Object.keys(state.lockedCells)).toHaveLength(0);
      expect(state.currentSpreadsheetId).toBeNull();
    });
  });

  describe("tabId", () => {
    it("generates a tab ID", () => {
      const tabId = useRealtimeStore.getState().tabId;
      expect(tabId).toMatch(/^tab-/);
    });
  });
});

describe("assignColor", () => {
  it("returns a hex color", () => {
    expect(assignColor("user-1")).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("is deterministic", () => {
    expect(assignColor("user-abc")).toBe(assignColor("user-abc"));
  });

  it("produces different colors for different users", () => {
    const c1 = assignColor("alice");
    const c2 = assignColor("bob");
    const c3 = assignColor("charlie");
    // At least 2 of 3 should differ
    expect(new Set([c1, c2, c3]).size).toBeGreaterThanOrEqual(2);
  });
});

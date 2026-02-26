import { describe, it, expect, beforeEach } from "vitest";
import * as presence from "../websocket/presence";
import * as cellLocks from "../websocket/cellLocks";
import {
  checkRateLimit,
  removeClient,
  clearAll as clearRateLimit,
} from "../websocket/rateLimit";
import { assignColor } from "../websocket/presence";

describe("Presence", () => {
  beforeEach(() => {
    presence.clearAll();
  });

  it("adds a user and returns presence info", () => {
    const user = presence.addUser(
      "sp1",
      "u1",
      "Alice",
      null,
      "sheet-1",
      "tab-1",
    );
    expect(user.userId).toBe("u1");
    expect(user.name).toBe("Alice");
    expect(user.activeSheet).toBe("sheet-1");
    expect(user.tabId).toBe("tab-1");
    expect(typeof user.color).toBe("string");
    expect(user.color).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("lists all users in a room", () => {
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-1");
    presence.addUser("sp1", "u2", "Bob", null, "sheet-1", "tab-2");
    const users = presence.getUsers("sp1");
    expect(users).toHaveLength(2);
  });

  it("handles multiple tabs for same user", () => {
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-1");
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-2");
    const users = presence.getUsers("sp1");
    expect(users).toHaveLength(2);
  });

  it("removes a user by userId+tabId", () => {
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-1");
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-2");
    presence.removeUser("sp1", "u1", "tab-1");
    const users = presence.getUsers("sp1");
    expect(users).toHaveLength(1);
    expect(users[0].tabId).toBe("tab-2");
  });

  it("removes room when last user leaves", () => {
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-1");
    presence.removeUser("sp1", "u1", "tab-1");
    expect(presence.getUsers("sp1")).toHaveLength(0);
    expect(presence.getRoomSize("sp1")).toBe(0);
  });

  it("updates cursor position", () => {
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-1");
    presence.updateCursor("sp1", "u1", "tab-1", "B5", "B5:D10");
    const users = presence.getUsers("sp1");
    expect(users[0].cursorCell).toBe("B5");
    expect(users[0].selectionRange).toBe("B5:D10");
  });

  it("updates active sheet", () => {
    presence.addUser("sp1", "u1", "Alice", null, "sheet-1", "tab-1");
    presence.updateActiveSheet("sp1", "u1", "tab-1", "sheet-2");
    const users = presence.getUsers("sp1");
    expect(users[0].activeSheet).toBe("sheet-2");
  });

  it("returns empty array for non-existent room", () => {
    expect(presence.getUsers("nonexistent")).toEqual([]);
  });
});

describe("Color Assignment", () => {
  it("returns a hex color string", () => {
    const color = assignColor("user-123");
    expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("is deterministic for same userId", () => {
    expect(assignColor("user-123")).toBe(assignColor("user-123"));
  });

  it("assigns different colors for different userIds", () => {
    const colors = new Set(
      ["user-1", "user-2", "user-3", "user-4", "user-5"].map(assignColor),
    );
    // Not guaranteed all different, but should get at least 2 different
    expect(colors.size).toBeGreaterThanOrEqual(2);
  });
});

describe("Cell Locks", () => {
  beforeEach(() => {
    cellLocks.clearAll();
  });

  it("locks a cell for a user", () => {
    const ok = cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    expect(ok).toBe(true);
  });

  it("prevents locking by different user", () => {
    cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    const ok = cellLocks.lockCell("sp1", "sheet-1", "A1", "u2", "tab-2");
    expect(ok).toBe(false);
  });

  it("allows re-lock by same user", () => {
    cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    const ok = cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    expect(ok).toBe(true);
  });

  it("unlocks a cell", () => {
    cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    const ok = cellLocks.unlockCell("sp1", "sheet-1", "A1", "u1");
    expect(ok).toBe(true);

    // Now another user can lock it
    const ok2 = cellLocks.lockCell("sp1", "sheet-1", "A1", "u2", "tab-2");
    expect(ok2).toBe(true);
  });

  it("does not unlock for wrong user", () => {
    cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    const ok = cellLocks.unlockCell("sp1", "sheet-1", "A1", "u2");
    expect(ok).toBe(false);
  });

  it("unlocks all cells for a user+tab on disconnect", () => {
    cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    cellLocks.lockCell("sp1", "sheet-1", "B2", "u1", "tab-1");
    cellLocks.lockCell("sp1", "sheet-1", "C3", "u2", "tab-2");

    const unlocked = cellLocks.unlockAllForUser("sp1", "u1", "tab-1");
    expect(unlocked).toHaveLength(2);

    // u2's lock should remain
    const locks = cellLocks.getLockedCells("sp1");
    expect(Object.keys(locks)).toHaveLength(1);
    expect(locks["sheet-1:C3"]).toBe("u2");
  });

  it("returns locked cells map", () => {
    cellLocks.lockCell("sp1", "sheet-1", "A1", "u1", "tab-1");
    cellLocks.lockCell("sp1", "sheet-2", "B2", "u2", "tab-2");

    const locks = cellLocks.getLockedCells("sp1");
    expect(locks["sheet-1:A1"]).toBe("u1");
    expect(locks["sheet-2:B2"]).toBe("u2");
  });
});

describe("Rate Limiter", () => {
  beforeEach(() => {
    clearRateLimit();
  });

  it("allows events under the limit", () => {
    for (let i = 0; i < 50; i++) {
      expect(checkRateLimit("socket-1")).toBe(true);
    }
  });

  it("blocks events over the limit", () => {
    for (let i = 0; i < 50; i++) {
      checkRateLimit("socket-1");
    }
    expect(checkRateLimit("socket-1")).toBe(false);
  });

  it("tracks clients independently", () => {
    for (let i = 0; i < 50; i++) {
      checkRateLimit("socket-1");
    }
    expect(checkRateLimit("socket-1")).toBe(false);
    expect(checkRateLimit("socket-2")).toBe(true);
  });

  it("removes client tracking", () => {
    checkRateLimit("socket-1");
    removeClient("socket-1");
    // Should start fresh
    expect(checkRateLimit("socket-1")).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseMentions } from "../services/comment.service";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    spreadsheet: {
      findUnique: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
    },
    commentReaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock logger to suppress output
vi.mock("../utils/logger", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import prisma from "../models/prisma";
import { toggleReaction } from "../services/comment.service";

const mockPrisma = prisma as unknown as {
  spreadsheet: { findUnique: ReturnType<typeof vi.fn> };
  comment: { findUnique: ReturnType<typeof vi.fn> };
  commentReaction: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const mockComment = {
  id: "comment-1",
  spreadsheetId: "ss-1",
  sheetId: "sh-1",
  cellKey: "A1",
  text: "Test comment",
  resolved: false,
  mentions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    avatarUrl: null,
  },
  replies: [],
  reactions: [],
};

describe("comment.service — toggleReaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a reaction when none exists (toggle-add)", async () => {
    // checkAccess: user is owner
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });

    // comment exists
    mockPrisma.comment.findUnique.mockResolvedValue({
      spreadsheetId: "ss-1",
    });

    // transaction executes the callback
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          commentReaction: {
            findUnique: vi.fn().mockResolvedValue(null), // no existing reaction
            create: vi.fn().mockResolvedValue({
              id: "reaction-1",
              commentId: "comment-1",
              userId: "user-1",
              emoji: "👍",
            }),
          },
          comment: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockComment,
              reactions: [
                {
                  id: "reaction-1",
                  emoji: "👍",
                  userId: "user-1",
                  createdAt: new Date(),
                  user: { name: "Test User" },
                },
              ],
            }),
          },
        };
        return fn(tx);
      },
    );

    const result = await toggleReaction("ss-1", "user-1", "comment-1", "👍");

    expect(result.added).toBe(true);
    expect(result.comment.reactions).toHaveLength(1);
    expect(result.comment.reactions[0].emoji).toBe("👍");
    expect(result.comment.reactions[0].userId).toBe("user-1");
  });

  it("removes a reaction when it already exists (toggle-remove)", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });

    mockPrisma.comment.findUnique.mockResolvedValue({
      spreadsheetId: "ss-1",
    });

    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          commentReaction: {
            findUnique: vi.fn().mockResolvedValue({
              id: "reaction-1",
              commentId: "comment-1",
              userId: "user-1",
              emoji: "👍",
            }),
            delete: vi.fn().mockResolvedValue({}),
          },
          comment: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockComment,
              reactions: [], // reaction removed
            }),
          },
        };
        return fn(tx);
      },
    );

    const result = await toggleReaction("ss-1", "user-1", "comment-1", "👍");

    expect(result.added).toBe(false);
    expect(result.comment.reactions).toHaveLength(0);
  });

  it("allows different users to react with the same emoji", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [{ role: "editor" }],
    });

    mockPrisma.comment.findUnique.mockResolvedValue({
      spreadsheetId: "ss-1",
    });

    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          commentReaction: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: "reaction-2",
              commentId: "comment-1",
              userId: "user-2",
              emoji: "👍",
            }),
          },
          comment: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockComment,
              reactions: [
                {
                  id: "reaction-1",
                  emoji: "👍",
                  userId: "user-1",
                  createdAt: new Date(),
                  user: { name: "User One" },
                },
                {
                  id: "reaction-2",
                  emoji: "👍",
                  userId: "user-2",
                  createdAt: new Date(),
                  user: { name: "User Two" },
                },
              ],
            }),
          },
        };
        return fn(tx);
      },
    );

    // user-2 has access via the access list (not owner)
    mockPrisma.spreadsheet.findUnique.mockResolvedValueOnce({
      ownerId: "user-1",
      access: [{ role: "editor" }],
    });

    const result = await toggleReaction("ss-1", "user-2", "comment-1", "👍");

    expect(result.added).toBe(true);
    expect(result.comment.reactions).toHaveLength(2);
    expect(result.comment.reactions.map((r) => r.userId)).toContain("user-1");
    expect(result.comment.reactions.map((r) => r.userId)).toContain("user-2");
  });

  it("throws NotFoundError when comment does not exist", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });

    mockPrisma.comment.findUnique.mockResolvedValue(null);

    await expect(
      toggleReaction("ss-1", "user-1", "nonexistent", "👍"),
    ).rejects.toThrow("Comment not found");
  });

  it("throws ForbiddenError when user has no access", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "other-user",
      access: [], // no access entry for requesting user
    });

    await expect(
      toggleReaction("ss-1", "user-1", "comment-1", "👍"),
    ).rejects.toThrow("Access denied");
  });

  it("uses $transaction for atomicity", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });

    mockPrisma.comment.findUnique.mockResolvedValue({
      spreadsheetId: "ss-1",
    });

    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          commentReaction: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
          },
          comment: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockComment,
              reactions: [
                {
                  id: "r-1",
                  emoji: "❤️",
                  userId: "user-1",
                  createdAt: new Date(),
                  user: { name: "Test User" },
                },
              ],
            }),
          },
        };
        return fn(tx);
      },
    );

    await toggleReaction("ss-1", "user-1", "comment-1", "❤️");

    // Verify $transaction was called (atomicity)
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });
});

describe("comment.service — parseMentions with emoji characters", () => {
  it("parseMentions still works alongside reaction feature", () => {
    const text = "Great work @alice@example.com! 👍";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["alice@example.com"]);
  });

  it("handles text with emoji characters in mentions parsing", () => {
    const text = "🔥 @bob@test.org this is fire";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["bob@test.org"]);
  });

  it("handles text with no mentions but emojis", () => {
    const text = "👍 ❤️ 🎉";
    const mentions = parseMentions(text);
    expect(mentions).toEqual([]);
  });
});

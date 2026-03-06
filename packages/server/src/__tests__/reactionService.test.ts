import { describe, it, expect } from "vitest";

describe("reaction.service — aggregation logic", () => {
  function aggregateReactions(
    reactions: Array<{ emoji: string; userId: string }>,
  ): Array<{ emoji: string; count: number; userIds: string[] }> {
    const map = new Map<string, string[]>();
    for (const r of reactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.push(r.userId);
      } else {
        map.set(r.emoji, [r.userId]);
      }
    }
    const result: Array<{ emoji: string; count: number; userIds: string[] }> = [];
    for (const [emoji, userIds] of map) {
      result.push({ emoji, count: userIds.length, userIds });
    }
    return result;
  }

  it("aggregates reactions by emoji", () => {
    const reactions = [
      { emoji: "\u{1F44D}", userId: "user-1" },
      { emoji: "\u{1F44D}", userId: "user-2" },
      { emoji: "\u{2764}\u{FE0F}", userId: "user-1" },
    ];
    const result = aggregateReactions(reactions);
    expect(result).toHaveLength(2);

    const thumbsUp = result.find((r) => r.emoji === "\u{1F44D}");
    expect(thumbsUp?.count).toBe(2);
    expect(thumbsUp?.userIds).toEqual(["user-1", "user-2"]);

    const heart = result.find((r) => r.emoji === "\u{2764}\u{FE0F}");
    expect(heart?.count).toBe(1);
  });

  it("returns empty array for no reactions", () => {
    const result = aggregateReactions([]);
    expect(result).toEqual([]);
  });

  it("handles single reaction", () => {
    const result = aggregateReactions([
      { emoji: "\u{1F525}", userId: "user-1" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      emoji: "\u{1F525}",
      count: 1,
      userIds: ["user-1"],
    });
  });
});

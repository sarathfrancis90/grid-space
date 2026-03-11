import { describe, it, expect } from "vitest";
import { groupByDate, formatLastOpened } from "../dateGrouping";

describe("groupByDate", () => {
  const now = new Date("2026-03-11T12:00:00Z");

  it("groups items into Today", () => {
    const items = [{ id: "1", date: "2026-03-11T10:00:00Z" }];
    const result = groupByDate(items, (i) => i.date, now);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Today");
    expect(result[0].items).toHaveLength(1);
  });

  it("groups items into Yesterday", () => {
    const items = [{ id: "1", date: "2026-03-10T15:00:00Z" }];
    const result = groupByDate(items, (i) => i.date, now);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Yesterday");
  });

  it("groups items into Previous 7 days", () => {
    const items = [{ id: "1", date: "2026-03-07T10:00:00Z" }];
    const result = groupByDate(items, (i) => i.date, now);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Previous 7 days");
  });

  it("groups items into Previous 30 days", () => {
    const items = [{ id: "1", date: "2026-02-20T10:00:00Z" }];
    const result = groupByDate(items, (i) => i.date, now);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Previous 30 days");
  });

  it("groups items into Earlier", () => {
    const items = [{ id: "1", date: "2025-01-01T10:00:00Z" }];
    const result = groupByDate(items, (i) => i.date, now);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Earlier");
  });

  it("returns groups in chronological order", () => {
    const items = [
      { id: "1", date: "2025-01-01T10:00:00Z" },
      { id: "2", date: "2026-03-11T10:00:00Z" },
      { id: "3", date: "2026-03-07T10:00:00Z" },
      { id: "4", date: "2026-03-10T10:00:00Z" },
    ];
    const result = groupByDate(items, (i) => i.date, now);
    expect(result.map((g) => g.label)).toEqual([
      "Today",
      "Yesterday",
      "Previous 7 days",
      "Earlier",
    ]);
  });

  it("returns empty array for no items", () => {
    const result = groupByDate([], (i: { date: string }) => i.date, now);
    expect(result).toEqual([]);
  });

  it("groups multiple items in the same date range together", () => {
    const items = [
      { id: "1", date: "2026-03-11T08:00:00Z" },
      { id: "2", date: "2026-03-11T10:00:00Z" },
    ];
    const result = groupByDate(items, (i) => i.date, now);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Today");
    expect(result[0].items).toHaveLength(2);
  });
});

describe("formatLastOpened", () => {
  it("returns 'Just now' for very recent dates", () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 5 * 60000); // 5 minutes ago
    expect(formatLastOpened(recent.toISOString())).toBe("Just now");
  });

  it("returns hours ago for same-day dates", () => {
    const now = new Date();
    const hoursAgo = new Date(now.getTime() - 3 * 3600000); // 3 hours ago
    expect(formatLastOpened(hoursAgo.toISOString())).toBe("3h ago");
  });

  it("returns 'Yesterday' for yesterday's dates", () => {
    const now = new Date();
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      12,
      0,
      0,
    );
    expect(formatLastOpened(yesterday.toISOString())).toBe("Yesterday");
  });
});

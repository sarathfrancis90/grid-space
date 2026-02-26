import { describe, it, expect } from "vitest";
import { parseMentions } from "../services/comment.service";

describe("comment.service — parseMentions", () => {
  it("extracts email mentions from text", () => {
    const text = "Hey @alice@example.com check this cell";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["alice@example.com"]);
  });

  it("extracts multiple mentions", () => {
    const text = "cc @alice@example.com and @bob@test.org";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["alice@example.com", "bob@test.org"]);
  });

  it("deduplicates mentions", () => {
    const text = "@alice@example.com already notified @alice@example.com";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["alice@example.com"]);
  });

  it("returns empty array when no mentions", () => {
    const text = "Just a regular comment";
    const mentions = parseMentions(text);
    expect(mentions).toEqual([]);
  });

  it("handles mentions at the start/end of text", () => {
    const text = "@start@test.com hello @end@test.com";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["start@test.com", "end@test.com"]);
  });
});

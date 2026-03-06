import { describe, it, expect } from "vitest";
import { parseMentions } from "../services/comment.service";

describe("comment.service — reaction support", () => {
  it("parseMentions still works alongside reaction feature", () => {
    const text = "Great work @alice@example.com! \u{1F44D}";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["alice@example.com"]);
  });

  it("handles text with emoji characters in mentions parsing", () => {
    const text = "\u{1F525} @bob@test.org this is fire";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["bob@test.org"]);
  });

  it("handles text with no mentions but emojis", () => {
    const text = "\u{1F44D} \u{2764}\u{FE0F} \u{1F389}";
    const mentions = parseMentions(text);
    expect(mentions).toEqual([]);
  });
});

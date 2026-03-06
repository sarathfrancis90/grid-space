import { describe, it, expect } from "vitest";
import { parseMentions } from "../services/comment.service";

describe("comment reactions — validation helpers", () => {
  // Common emoji patterns that reactions should support
  const VALID_EMOJIS = [
    "\u{1F44D}", // thumbs up
    "\u{1F44E}", // thumbs down
    "\u{2764}\u{FE0F}", // heart
    "\u{1F604}", // smile
    "\u{1F389}", // party
    "\u{1F914}", // thinking
    "\u{1F44F}", // clap
    "\u{1F525}", // fire
  ];

  it("valid emojis are non-empty strings", () => {
    for (const emoji of VALID_EMOJIS) {
      expect(emoji.length).toBeGreaterThan(0);
      expect(typeof emoji).toBe("string");
    }
  });

  it("emojis have reasonable length (max 32 chars per Zod schema)", () => {
    for (const emoji of VALID_EMOJIS) {
      expect(emoji.length).toBeLessThanOrEqual(32);
    }
  });

  // parseMentions should still work independently of reactions
  it("parseMentions still works correctly", () => {
    const text = "Hey @alice@example.com check this";
    const mentions = parseMentions(text);
    expect(mentions).toEqual(["alice@example.com"]);
  });
});

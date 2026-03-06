import { describe, it, expect } from "vitest";
import { WS_EVENTS } from "../websocket/types";
import type {
  SuggestionCreatedPayload,
  SuggestionReviewedPayload,
} from "../websocket/types";

describe("Suggestion WebSocket types", () => {
  it("has suggestion event constants defined", () => {
    expect(WS_EVENTS.SUGGESTION_CREATED).toBe("suggestion-created");
    expect(WS_EVENTS.SUGGESTION_REVIEWED).toBe("suggestion-reviewed");
    expect(WS_EVENTS.SUGGESTION_SYNC).toBe("suggestion-sync");
  });

  it("SuggestionCreatedPayload has correct shape", () => {
    const payload: SuggestionCreatedPayload = {
      spreadsheetId: "sp1",
      sheetId: "sheet1",
      cellKey: "0,0",
      suggestionId: "sug-1",
      oldValue: "hello",
      newValue: "world",
      oldFormula: undefined,
      newFormula: undefined,
    };
    expect(payload.spreadsheetId).toBe("sp1");
    expect(payload.cellKey).toBe("0,0");
    expect(payload.oldValue).toBe("hello");
    expect(payload.newValue).toBe("world");
  });

  it("SuggestionReviewedPayload has correct shape", () => {
    const payload: SuggestionReviewedPayload = {
      spreadsheetId: "sp1",
      suggestionId: "sug-1",
      action: "accepted",
    };
    expect(payload.action).toBe("accepted");

    const rejected: SuggestionReviewedPayload = {
      spreadsheetId: "sp1",
      suggestionId: "sug-2",
      action: "rejected",
    };
    expect(rejected.action).toBe("rejected");
  });
});

describe("Suggestion API routes exist", () => {
  it("suggestion routes module exports default router", async () => {
    const mod = await import("../routes/suggestion.routes");
    expect(mod.default).toBeDefined();
  });

  it("suggestion controller exports expected functions", async () => {
    const mod = await import("../controllers/suggestion.controller");
    expect(typeof mod.listSuggestions).toBe("function");
    expect(typeof mod.createSuggestion).toBe("function");
    expect(typeof mod.reviewSuggestion).toBe("function");
    expect(typeof mod.bulkReview).toBe("function");
  });

  it("suggestion service exports expected functions", async () => {
    const mod = await import("../services/suggestion.service");
    expect(typeof mod.listSuggestions).toBe("function");
    expect(typeof mod.createSuggestion).toBe("function");
    expect(typeof mod.reviewSuggestion).toBe("function");
    expect(typeof mod.bulkReview).toBe("function");
  });
});

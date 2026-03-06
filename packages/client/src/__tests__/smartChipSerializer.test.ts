import { describe, it, expect } from "vitest";
import {
  chipToPlainText,
  chipToJSON,
  chipFromJSON,
  chipsToExportText,
  chipsToJSONArray,
  chipsFromJSONArray,
} from "../utils/smartChipSerializer";
import type {
  PersonChip,
  FileChip,
  DateChip,
  EventChip,
  PlaceChip,
  FinanceChip,
  CustomChip,
} from "../types/grid";

const personChip: PersonChip = {
  id: "p1",
  type: "person",
  displayText: "John Doe",
  email: "john@example.com",
  name: "John Doe",
};

const fileChip: FileChip = {
  id: "f1",
  type: "file",
  displayText: "Budget.xlsx",
  fileId: "file-123",
  fileName: "Budget.xlsx",
  mimeType: "application/xlsx",
};

const dateChip: DateChip = {
  id: "d1",
  type: "date",
  displayText: "March 6, 2026",
  date: "2026-03-06",
};

const eventChip: EventChip = {
  id: "e1",
  type: "event",
  displayText: "Team Standup",
  eventId: "evt-456",
  title: "Team Standup",
  startDate: "2026-03-06T09:00:00Z",
};

const placeChip: PlaceChip = {
  id: "pl1",
  type: "place",
  displayText: "Googleplex",
  placeId: "place-789",
  placeName: "Googleplex",
  address: "1600 Amphitheatre Parkway",
};

const financeChip: FinanceChip = {
  id: "fi1",
  type: "finance",
  displayText: "GOOGL",
  ticker: "GOOGL",
  exchange: "NASDAQ",
};

const customChip: CustomChip = {
  id: "c1",
  type: "custom",
  displayText: "Priority: High",
};

describe("chipToPlainText", () => {
  it("formats person chip with name and email", () => {
    expect(chipToPlainText(personChip)).toBe("John Doe <john@example.com>");
  });

  it("formats file chip with fileName", () => {
    expect(chipToPlainText(fileChip)).toBe("Budget.xlsx");
  });

  it("formats date chip with date string", () => {
    expect(chipToPlainText(dateChip)).toBe("2026-03-06");
  });

  it("formats event chip with title", () => {
    expect(chipToPlainText(eventChip)).toBe("Team Standup");
  });

  it("formats place chip with placeName", () => {
    expect(chipToPlainText(placeChip)).toBe("Googleplex");
  });

  it("formats finance chip with ticker:exchange", () => {
    expect(chipToPlainText(financeChip)).toBe("GOOGL:NASDAQ");
  });

  it("formats finance chip without exchange as just ticker", () => {
    const noExchange: FinanceChip = {
      ...financeChip,
      exchange: undefined,
    };
    expect(chipToPlainText(noExchange)).toBe("GOOGL");
  });

  it("formats custom chip with displayText", () => {
    expect(chipToPlainText(customChip)).toBe("Priority: High");
  });
});

describe("chipToJSON / chipFromJSON roundtrip", () => {
  const allChips = [
    personChip,
    fileChip,
    dateChip,
    eventChip,
    placeChip,
    financeChip,
    customChip,
  ];

  it("roundtrips all chip types", () => {
    for (const chip of allChips) {
      const json = chipToJSON(chip);
      const restored = chipFromJSON(json);
      expect(restored).toEqual(chip);
    }
  });

  it("returns null for invalid JSON", () => {
    expect(chipFromJSON("not json")).toBeNull();
  });

  it("returns null for missing required fields", () => {
    expect(chipFromJSON('{"id":"x"}')).toBeNull();
    expect(chipFromJSON('{"id":"x","type":"person"}')).toBeNull();
  });

  it("returns null for invalid chip type", () => {
    expect(
      chipFromJSON('{"id":"x","type":"invalid","displayText":"test"}'),
    ).toBeNull();
  });
});

describe("chipsToExportText", () => {
  it("joins multiple chips with comma separator", () => {
    const result = chipsToExportText([personChip, fileChip]);
    expect(result).toBe("John Doe <john@example.com>, Budget.xlsx");
  });

  it("handles single chip", () => {
    expect(chipsToExportText([dateChip])).toBe("2026-03-06");
  });

  it("handles empty array", () => {
    expect(chipsToExportText([])).toBe("");
  });
});

describe("chipsToJSONArray / chipsFromJSONArray roundtrip", () => {
  it("roundtrips an array of chips", () => {
    const chips = [personChip, fileChip, dateChip];
    const json = chipsToJSONArray(chips);
    const restored = chipsFromJSONArray(json);
    expect(restored).toEqual(chips);
  });

  it("returns empty array for invalid JSON", () => {
    expect(chipsFromJSONArray("not json")).toEqual([]);
  });

  it("returns empty array for non-array JSON", () => {
    expect(chipsFromJSONArray('{"foo":"bar"}')).toEqual([]);
  });

  it("filters out items missing required fields", () => {
    const json = JSON.stringify([personChip, { foo: "bar" }, fileChip]);
    const restored = chipsFromJSONArray(json);
    expect(restored).toHaveLength(2);
  });
});

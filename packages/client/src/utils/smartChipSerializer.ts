import type { SmartChip, SmartChipType } from "../types/grid";

/**
 * Serialize a SmartChip to a plain text fallback for export (CSV/XLSX).
 * This preserves the display text and encodes the chip metadata in a comment-safe format.
 */
export function chipToPlainText(chip: SmartChip): string {
  switch (chip.type) {
    case "person":
      return `${chip.name} <${chip.email}>`;
    case "file":
      return chip.fileName;
    case "date":
      return chip.date;
    case "event":
      return chip.title;
    case "place":
      return chip.placeName;
    case "finance":
      return chip.exchange ? `${chip.ticker}:${chip.exchange}` : chip.ticker;
    case "custom":
      return chip.displayText;
  }
}

/**
 * Serialize a SmartChip to a JSON string for internal storage / rich export.
 */
export function chipToJSON(chip: SmartChip): string {
  return JSON.stringify(chip);
}

/**
 * Deserialize a SmartChip from a JSON string.
 * Returns null if the JSON is invalid or missing required fields.
 */
export function chipFromJSON(json: string): SmartChip | null {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.type !== "string" ||
      typeof parsed.displayText !== "string"
    ) {
      return null;
    }

    const validTypes: SmartChipType[] = [
      "person",
      "file",
      "date",
      "event",
      "place",
      "finance",
      "custom",
    ];
    if (!validTypes.includes(parsed.type as SmartChipType)) {
      return null;
    }

    return parsed as unknown as SmartChip;
  } catch {
    return null;
  }
}

/**
 * Serialize an array of SmartChips to a flat-text representation for cells
 * that get exported as CSV/XLSX. Chips are separated by ", ".
 */
export function chipsToExportText(chips: SmartChip[]): string {
  return chips.map(chipToPlainText).join(", ");
}

/**
 * Serialize an array of SmartChips for internal JSON storage.
 */
export function chipsToJSONArray(chips: SmartChip[]): string {
  return JSON.stringify(chips);
}

/**
 * Deserialize an array of SmartChips from internal JSON storage.
 */
export function chipsFromJSONArray(json: string): SmartChip[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "type" in item &&
        "displayText" in item,
    ) as SmartChip[];
  } catch {
    return [];
  }
}

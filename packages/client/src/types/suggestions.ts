/** Types for the Suggestions / Track Changes editing mode */

export type EditingMode = "editing" | "suggesting" | "viewing";

export type SuggestionStatus = "pending" | "accepted" | "rejected";

export interface Suggestion {
  id: string;
  sheetId: string;
  cellRef: string; // e.g. "2,3" (row,col key)
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  proposedBy: string; // user display name
  proposedById: string;
  status: SuggestionStatus;
  comment?: string;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export type SuggestionFilter = "all" | "pending" | "accepted" | "rejected";

import type { TableConfig } from "../types/grid";

export interface StructuredRefParts {
  tableName: string;
  specifier: string;
}

/**
 * Parse a structured reference string like `TableName[#Data]` or `TableName[Column1]`.
 * Returns null if the string is not a valid structured reference.
 *
 * Supported forms:
 *  - TableName[#All]
 *  - TableName[#Data]
 *  - TableName[#Headers]
 *  - TableName[#Totals]
 *  - TableName[#This Row]
 *  - TableName[@]
 *  - TableName[@ColumnName]   (alias for [#This Row] intersected with column)
 *  - TableName[ColumnName]
 */
export function parseStructuredRef(ref: string): StructuredRefParts | null {
  const trimmed = ref.trim();
  const bracketOpen = trimmed.indexOf("[");
  if (bracketOpen < 1) return null;
  if (!trimmed.endsWith("]")) return null;

  const tableName = trimmed.slice(0, bracketOpen).trim();
  const specifier = trimmed.slice(bracketOpen + 1, -1).trim();

  if (tableName.length === 0 || specifier.length === 0) return null;

  return { tableName, specifier };
}

/**
 * Resolve a column-scoped @ reference like `@ColumnName`.
 * Returns the column index (0-based from table start) or -1 if not found.
 */
export function resolveAtColumnRef(
  specifier: string,
  table: TableConfig,
): number {
  if (!specifier.startsWith("@")) return -1;
  const colName = specifier.slice(1).trim();
  if (colName.length === 0) return -1;
  const normalized = colName.toLowerCase();
  return table.columns.findIndex(
    (c) => c.headerName.toLowerCase() === normalized,
  );
}

/**
 * Get the table formatting colors for a given style preset.
 */
export function getTableStyleColors(preset: string): {
  headerBg: string;
  headerText: string;
  bandColor: string;
  borderColor: string;
} {
  const styles: Record<
    string,
    {
      headerBg: string;
      headerText: string;
      bandColor: string;
      borderColor: string;
    }
  > = {
    "blue-medium-1": {
      headerBg: "#4472C4",
      headerText: "#FFFFFF",
      bandColor: "#D6E4F0",
      borderColor: "#8FAADC",
    },
    "blue-medium-2": {
      headerBg: "#2F5597",
      headerText: "#FFFFFF",
      bandColor: "#B4C7E7",
      borderColor: "#2F5597",
    },
    "green-medium-1": {
      headerBg: "#70AD47",
      headerText: "#FFFFFF",
      bandColor: "#E2EFDA",
      borderColor: "#A9D18E",
    },
    "green-medium-2": {
      headerBg: "#548235",
      headerText: "#FFFFFF",
      bandColor: "#C5E0B4",
      borderColor: "#548235",
    },
    "orange-medium-1": {
      headerBg: "#ED7D31",
      headerText: "#FFFFFF",
      bandColor: "#FCE4D6",
      borderColor: "#F4B183",
    },
    "orange-medium-2": {
      headerBg: "#C55A11",
      headerText: "#FFFFFF",
      bandColor: "#F8CBAD",
      borderColor: "#C55A11",
    },
    "grey-medium-1": {
      headerBg: "#A5A5A5",
      headerText: "#FFFFFF",
      bandColor: "#EDEDED",
      borderColor: "#C0C0C0",
    },
    "grey-medium-2": {
      headerBg: "#7B7B7B",
      headerText: "#FFFFFF",
      bandColor: "#DBDBDB",
      borderColor: "#7B7B7B",
    },
    "purple-medium-1": {
      headerBg: "#7030A0",
      headerText: "#FFFFFF",
      bandColor: "#E2D1F0",
      borderColor: "#9B59B6",
    },
    "red-medium-1": {
      headerBg: "#FF0000",
      headerText: "#FFFFFF",
      bandColor: "#FFC7CE",
      borderColor: "#FF6666",
    },
  };

  return (
    styles[preset] ?? {
      headerBg: "#4472C4",
      headerText: "#FFFFFF",
      bandColor: "#D6E4F0",
      borderColor: "#8FAADC",
    }
  );
}

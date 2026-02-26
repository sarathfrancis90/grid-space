export interface CellData {
  value: string | number | boolean | null;
  formula?: string;
  format?: CellFormat;
  comment?: string;
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  horizontalAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  numberFormat?: string;
  wrapText?: boolean;
  borders?: BorderStyle;
}

export interface BorderStyle {
  top?: BorderSide;
  right?: BorderSide;
  bottom?: BorderSide;
  left?: BorderSide;
}

export interface BorderSide {
  style: "thin" | "medium" | "thick" | "dashed" | "dotted";
  color: string;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SheetData {
  id: string;
  name: string;
  cells: Map<string, CellData>;
  columnWidths: Map<number, number>;
  rowHeights: Map<number, number>;
  frozenRows: number;
  frozenCols: number;
  hiddenRows: Set<number>;
  hiddenCols: Set<number>;
}

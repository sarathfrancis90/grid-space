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
  wrapText?: "overflow" | "wrap" | "clip";
  textRotation?: number;
  indent?: number;
  borders?: BorderStyle;
}

export interface MergedRegion {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface ConditionalRule {
  id: string;
  range: { startRow: number; startCol: number; endRow: number; endCol: number };
  type: "value" | "text" | "colorScale";
  condition: string;
  values: string[];
  format: Partial<CellFormat>;
  priority: number;
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
  tabColor?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortCriterion {
  col: number;
  direction: SortDirection;
}

export type FilterConditionOp =
  | "equals"
  | "not-equals"
  | "greater-than"
  | "less-than"
  | "greater-equal"
  | "less-equal"
  | "contains"
  | "not-contains"
  | "starts-with"
  | "ends-with"
  | "is-empty"
  | "not-empty";

export interface FilterCondition {
  op: FilterConditionOp;
  value: string;
}

export interface ColumnFilter {
  col: number;
  allowedValues?: Set<string>;
  condition?: FilterCondition;
  filterByColor?: string;
}

// Data Validation
export type ValidationRuleType =
  | "number-range"
  | "text-length"
  | "date-range"
  | "dropdown-list"
  | "checkbox"
  | "custom-formula";

export interface ValidationRule {
  type: ValidationRuleType;
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
  listValues?: string[];
  formula?: string;
  allowBlank?: boolean;
  errorMessage?: string;
}

// Named Ranges
export interface NamedRange {
  name: string;
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// Pivot Tables
export type PivotAggregation = "SUM" | "COUNT" | "AVERAGE" | "MIN" | "MAX";

export interface PivotFieldConfig {
  col: number;
  label: string;
}

export interface PivotValueConfig {
  col: number;
  label: string;
  aggregation: PivotAggregation;
}

export interface PivotFilterConfig {
  col: number;
  allowedValues: Set<string>;
}

export interface PivotConfig {
  id: string;
  sourceSheetId: string;
  sourceRange: SelectionRange;
  rowFields: PivotFieldConfig[];
  colFields: PivotFieldConfig[];
  valueFields: PivotValueConfig[];
  filters: PivotFilterConfig[];
  targetSheetId: string;
  targetCell: CellPosition;
}

// Row/Column Grouping
export interface GroupRange {
  start: number;
  end: number;
  collapsed: boolean;
}

// Protected Ranges
export interface ProtectedRange {
  id: string;
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  description?: string;
}

// Slicer
export interface SlicerConfig {
  id: string;
  sheetId: string;
  targetCol: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selectedValues: Set<string>;
}

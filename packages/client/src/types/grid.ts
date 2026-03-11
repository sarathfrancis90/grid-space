export interface CellData {
  value: string | number | boolean | null;
  formula?: string;
  format?: CellFormat;
  comment?: string;
  hyperlink?: CellHyperlink;
  image?: CellImage;
  note?: string;
  smartChips?: SmartChip[];
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

export type IconSetStyle =
  | "3-arrows"
  | "3-flags"
  | "3-traffic-lights"
  | "4-arrows"
  | "5-arrows";

export interface DataBarConfig {
  color: string;
  fillType: "solid" | "gradient";
  minValue?: number;
  maxValue?: number;
  showNegative?: boolean;
  negativeColor?: string;
}

export interface IconSetConfig {
  style: IconSetStyle;
  thresholds: number[];
}

export interface ConditionalRule {
  id: string;
  range: { startRow: number; startCol: number; endRow: number; endCol: number };
  type:
    | "value"
    | "text"
    | "colorScale"
    | "blank"
    | "date"
    | "customFormula"
    | "dataBar"
    | "iconSet";
  condition: string;
  values: string[];
  format: Partial<CellFormat>;
  priority: number;
  /** For customFormula type: the formula string to evaluate */
  formula?: string;
  /** For dataBar type: bar configuration */
  dataBarConfig?: DataBarConfig;
  /** For iconSet type: icon set configuration */
  iconSetConfig?: IconSetConfig;
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
  | "whole-number"
  | "text-length"
  | "date-range"
  | "dropdown-list"
  | "list-from-range"
  | "checkbox"
  | "custom-formula"
  | "email"
  | "url";

export type ValidationMode = "strict" | "warning";

export interface ValidationRule {
  type: ValidationRuleType;
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
  listValues?: string[];
  listRange?: string;
  formula?: string;
  allowBlank?: boolean;
  errorMessage?: string;
  inputMessage?: string;
  mode?: ValidationMode;
  showDropdownArrow?: boolean;
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

// Named Functions (Google Sheets parity)
export interface NamedFunctionArgument {
  name: string;
  description: string;
}

export interface NamedFunction {
  name: string;
  formulaBody: string;
  description: string;
  arguments: NamedFunctionArgument[];
  createdAt: number;
  updatedAt: number;
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

// Charts
export type ChartType =
  | "column"
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "scatter"
  | "combo"
  | "histogram"
  | "radar"
  | "waterfall"
  | "candlestick"
  | "bubble"
  | "gauge";

export type StackMode = "none" | "stacked" | "percent";

export type TrendlineType = "none" | "linear" | "exponential" | "polynomial";

export interface ChartConfig {
  id: string;
  sheetId: string;
  type: ChartType;
  dataRange: SelectionRange;
  position: { x: number; y: number };
  size: { width: number; height: number };
  title?: string;
  subtitle?: string;
  legendPosition?: "top" | "bottom" | "left" | "right" | "none";
  showLegend?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  stackMode?: StackMode;
  trendline?: TrendlineType;
  smoothLine?: boolean;
}

// Comments
export interface CellComment {
  id: string;
  cellKey: string;
  sheetId: string;
  text: string;
  author: string;
  authorId?: string;
  assignee?: string;
  assigneeName?: string;
  createdAt: number;
  updatedAt?: number;
  resolved?: boolean;
  replies?: CommentReply[];
  reactions?: CommentReaction[];
}

export interface CommentReply {
  id: string;
  text: string;
  author: string;
  authorId?: string;
  createdAt: number;
}

export interface CommentReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: Array<{ userId: string; userName: string }>;
  currentUserReacted: boolean;
}

// Tables (first-class table entities like Google Sheets)
export type TableStylePreset =
  | "blue-medium-1"
  | "blue-medium-2"
  | "green-medium-1"
  | "green-medium-2"
  | "orange-medium-1"
  | "orange-medium-2"
  | "grey-medium-1"
  | "grey-medium-2"
  | "purple-medium-1"
  | "red-medium-1";

export interface TableColumn {
  id: string;
  headerName: string;
}

export interface TableConfig {
  id: string;
  name: string;
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  columns: TableColumn[];
  showHeaderRow: boolean;
  showTotalRow: boolean;
  showBandedRows: boolean;
  showBandedCols: boolean;
  stylePreset: TableStylePreset;
}

// Hyperlinks
export interface CellHyperlink {
  url: string;
  label?: string;
}

// Image in cell
export interface CellImage {
  url: string;
  alt?: string;
}

// Smart Chips (Google Sheets parity)
export type SmartChipType =
  | "person"
  | "file"
  | "date"
  | "event"
  | "place"
  | "finance"
  | "custom";

export interface SmartChipBase {
  id: string;
  type: SmartChipType;
  displayText: string;
}

export interface PersonChip extends SmartChipBase {
  type: "person";
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface FileChip extends SmartChipBase {
  type: "file";
  fileId: string;
  fileName: string;
  mimeType?: string;
  url?: string;
}

export interface DateChip extends SmartChipBase {
  type: "date";
  date: string;
  format?: string;
}

export interface EventChip extends SmartChipBase {
  type: "event";
  eventId: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

export interface PlaceChip extends SmartChipBase {
  type: "place";
  placeId: string;
  placeName: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface FinanceChip extends SmartChipBase {
  type: "finance";
  ticker: string;
  exchange?: string;
}

export interface CustomChip extends SmartChipBase {
  type: "custom";
  icon?: string;
  color?: string;
  metadata?: Record<string, string>;
}

export type SmartChip =
  | PersonChip
  | FileChip
  | DateChip
  | EventChip
  | PlaceChip
  | FinanceChip
  | CustomChip;

export interface SmartChipSuggestion {
  chip: SmartChip;
  score: number;
}

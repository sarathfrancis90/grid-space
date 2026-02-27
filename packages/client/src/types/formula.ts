// Formula value types
export type FormulaValue = string | number | boolean | null | FormulaError;

export type FormulaError =
  | "#DIV/0!"
  | "#VALUE!"
  | "#NAME?"
  | "#N/A"
  | "#NUM!"
  | "#NULL!"
  | "#REF!"
  | "#SPILL!";

const FORMULA_ERRORS: ReadonlySet<string> = new Set([
  "#DIV/0!",
  "#VALUE!",
  "#NAME?",
  "#N/A",
  "#NUM!",
  "#NULL!",
  "#REF!",
  "#SPILL!",
]);

export function isFormulaError(value: unknown): value is FormulaError {
  return typeof value === "string" && FORMULA_ERRORS.has(value);
}

// Token types for the lexer
export type TokenType =
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "CELL_REF"
  | "OPERATOR"
  | "FUNCTION_NAME"
  | "PAREN_OPEN"
  | "PAREN_CLOSE"
  | "COMMA"
  | "COLON"
  | "EXCLAMATION"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// AST node types
export type ASTNode =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | CellReference
  | RangeReference
  | BinaryOp
  | UnaryOp
  | FunctionCall
  | ErrorNode;

export interface NumberLiteral {
  type: "number";
  value: number;
}

export interface StringLiteral {
  type: "string";
  value: string;
}

export interface BooleanLiteral {
  type: "boolean";
  value: boolean;
}

export interface CellReference {
  type: "cell";
  sheet?: string;
  col: number;
  row: number;
  absCol: boolean;
  absRow: boolean;
  raw: string;
}

export interface RangeReference {
  type: "range";
  start: CellReference;
  end: CellReference;
}

export interface BinaryOp {
  type: "binary";
  op: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOp {
  type: "unary";
  op: string;
  operand: ASTNode;
}

export interface FunctionCall {
  type: "function";
  name: string;
  args: ASTNode[];
}

export interface ErrorNode {
  type: "error";
  error: FormulaError;
}

// Callback type for resolving cell values during evaluation
export type CellValueGetter = (
  sheet: string | undefined,
  col: number,
  row: number,
) => FormulaValue;

/**
 * Recursive descent parser for spreadsheet formulas.
 * Produces an AST from a token stream.
 *
 * Grammar (precedence low→high):
 *   Expression    → Comparison
 *   Comparison    → Concatenation (("=" | "<>" | "<" | ">" | "<=" | ">=") Concatenation)*
 *   Concatenation → Addition ("&" Addition)*
 *   Addition      → Multiplication (("+" | "-") Multiplication)*
 *   Multiplication → Unary (("*" | "/") Unary)*
 *   Unary         → ("-" | "+")? Power
 *   Power         → Postfix ("^" Postfix)*
 *   Postfix       → Primary ("%")?
 *   Primary       → NUMBER | STRING | BOOLEAN | CellRef | Range | FunctionCall | "(" Expression ")"
 */
import type { Token, ASTNode, CellReference } from "../../types/formula";
import { tokenize } from "./tokenizer";
import { colLetterToIndex } from "./cellUtils";

export class ParseError extends Error {
  constructor(
    message: string,
    public position: number,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: Token["type"], value?: string): Token {
    const token = this.current();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new ParseError(
        `Expected ${type}${value ? ` '${value}'` : ""} but got ${token.type} '${token.value}'`,
        token.position,
      );
    }
    return this.advance();
  }

  parse(): ASTNode {
    const node = this.expression();
    if (this.current().type !== "EOF") {
      throw new ParseError(
        `Unexpected token: ${this.current().value}`,
        this.current().position,
      );
    }
    return node;
  }

  private expression(): ASTNode {
    return this.comparison();
  }

  private comparison(): ASTNode {
    let left = this.concatenation();
    while (
      this.current().type === "OPERATOR" &&
      ["=", "<>", "<", ">", "<=", ">="].includes(this.current().value)
    ) {
      const op = this.advance().value;
      const right = this.concatenation();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private concatenation(): ASTNode {
    let left = this.addition();
    while (this.current().type === "OPERATOR" && this.current().value === "&") {
      this.advance();
      const right = this.addition();
      left = { type: "binary", op: "&", left, right };
    }
    return left;
  }

  private addition(): ASTNode {
    let left = this.multiplication();
    while (
      this.current().type === "OPERATOR" &&
      (this.current().value === "+" || this.current().value === "-")
    ) {
      const op = this.advance().value;
      const right = this.multiplication();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private multiplication(): ASTNode {
    let left = this.unary();
    while (
      this.current().type === "OPERATOR" &&
      (this.current().value === "*" || this.current().value === "/")
    ) {
      const op = this.advance().value;
      const right = this.unary();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private unary(): ASTNode {
    if (
      this.current().type === "OPERATOR" &&
      (this.current().value === "-" || this.current().value === "+")
    ) {
      const op = this.advance().value;
      const operand = this.power();
      return { type: "unary", op, operand };
    }
    return this.power();
  }

  private power(): ASTNode {
    let left = this.postfix();
    while (this.current().type === "OPERATOR" && this.current().value === "^") {
      this.advance();
      const right = this.postfix();
      left = { type: "binary", op: "^", left, right };
    }
    return left;
  }

  private postfix(): ASTNode {
    let node = this.primary();
    if (this.current().type === "OPERATOR" && this.current().value === "%") {
      this.advance();
      node = {
        type: "binary",
        op: "%",
        left: node,
        right: { type: "number", value: 100 },
      };
    }
    return node;
  }

  private primary(): ASTNode {
    const token = this.current();

    // Number
    if (token.type === "NUMBER") {
      this.advance();
      return { type: "number", value: parseFloat(token.value) };
    }

    // String
    if (token.type === "STRING") {
      this.advance();
      return { type: "string", value: token.value };
    }

    // Boolean
    if (token.type === "BOOLEAN") {
      this.advance();
      return { type: "boolean", value: token.value === "TRUE" };
    }

    // Function call
    if (token.type === "FUNCTION_NAME") {
      return this.functionCall();
    }

    // Cell reference (may become range with :)
    if (token.type === "CELL_REF") {
      return this.cellRefOrRange();
    }

    // Parenthesized expression
    if (token.type === "PAREN_OPEN") {
      this.advance();
      const expr = this.expression();
      this.expect("PAREN_CLOSE");
      return expr;
    }

    throw new ParseError(
      `Unexpected token: ${token.type} '${token.value}'`,
      token.position,
    );
  }

  private functionCall(): ASTNode {
    const nameToken = this.advance(); // FUNCTION_NAME
    this.expect("PAREN_OPEN");
    const args: ASTNode[] = [];
    if (this.current().type !== "PAREN_CLOSE") {
      args.push(this.expression());
      while (this.current().type === "COMMA") {
        this.advance();
        args.push(this.expression());
      }
    }
    this.expect("PAREN_CLOSE");
    return { type: "function", name: nameToken.value, args };
  }

  private cellRefOrRange(): ASTNode {
    const cellRef = this.parseCellRef();

    // Check for range operator ':'
    if (this.current().type === "COLON") {
      this.advance();
      const endRef = this.parseCellRef();
      return { type: "range", start: cellRef, end: endRef };
    }

    return cellRef;
  }

  private parseCellRef(): CellReference {
    const token = this.advance(); // CELL_REF
    let raw = token.value;

    // Check for cross-sheet reference: SheetName!CellRef
    // The token might be the sheet name if followed by !
    if (this.current().type === "EXCLAMATION") {
      this.advance(); // consume !
      const nextToken = this.advance(); // the actual cell ref
      const sheet = raw;
      raw = nextToken.value;
      return this.buildCellRef(raw, sheet);
    }

    return this.buildCellRef(raw);
  }

  private buildCellRef(raw: string, sheet?: string): CellReference {
    // Parse patterns: A1, $A1, A$1, $A$1
    const match = raw.match(/^(\$?)([A-Za-z]+)(\$?)(\d+)$/);
    if (!match) {
      throw new ParseError(`Invalid cell reference: ${raw}`, this.pos);
    }

    const absCol = match[1] === "$";
    const colStr = match[2].toUpperCase();
    const absRow = match[3] === "$";
    const rowStr = match[4];

    return {
      type: "cell",
      sheet,
      col: colLetterToIndex(colStr),
      row: parseInt(rowStr, 10) - 1, // 0-based
      absCol,
      absRow,
      raw: `${absCol ? "$" : ""}${colStr}${absRow ? "$" : ""}${rowStr}`,
    };
  }
}

/**
 * Parse a formula string into an AST.
 * The formula should NOT include the leading '=' sign.
 */
export function parseFormula(formula: string): ASTNode {
  const tokens = tokenize(formula);
  const parser = new Parser(tokens);
  return parser.parse();
}

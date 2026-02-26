/**
 * Formula tokenizer — breaks a formula string into tokens.
 * Pure function, no side effects.
 */
import type { Token, TokenType } from "../../types/formula";

export class TokenizerError extends Error {
  constructor(
    message: string,
    public position: number,
  ) {
    super(message);
    this.name = "TokenizerError";
  }
}

const OPERATORS = new Set(["+", "-", "*", "/", "^", "&", "%", "=", "<", ">"]);

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isAlpha(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

/**
 * Tokenize a formula string (without leading '=').
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  function peek(): string {
    return pos < input.length ? input[pos] : "";
  }

  function advance(): string {
    return input[pos++];
  }

  function addToken(type: TokenType, value: string, startPos: number): void {
    tokens.push({ type, value, position: startPos });
  }

  while (pos < input.length) {
    const ch = peek();
    const startPos = pos;

    // Skip whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance();
      continue;
    }

    // String literal
    if (ch === '"') {
      advance(); // skip opening quote
      let str = "";
      while (pos < input.length && peek() !== '"') {
        if (peek() === "\\" && pos + 1 < input.length) {
          advance();
          str += advance();
        } else {
          str += advance();
        }
      }
      if (pos >= input.length) {
        throw new TokenizerError("Unterminated string", startPos);
      }
      advance(); // skip closing quote
      addToken("STRING", str, startPos);
      continue;
    }

    // Number literal (including decimals)
    if (
      isDigit(ch) ||
      (ch === "." && pos + 1 < input.length && isDigit(input[pos + 1]))
    ) {
      let num = "";
      while (pos < input.length && isDigit(peek())) {
        num += advance();
      }
      if (pos < input.length && peek() === ".") {
        num += advance();
        while (pos < input.length && isDigit(peek())) {
          num += advance();
        }
      }
      // Handle scientific notation
      if (pos < input.length && (peek() === "e" || peek() === "E")) {
        num += advance();
        if (pos < input.length && (peek() === "+" || peek() === "-")) {
          num += advance();
        }
        while (pos < input.length && isDigit(peek())) {
          num += advance();
        }
      }
      addToken("NUMBER", num, startPos);
      continue;
    }

    // Parentheses
    if (ch === "(") {
      advance();
      addToken("PAREN_OPEN", "(", startPos);
      continue;
    }
    if (ch === ")") {
      advance();
      addToken("PAREN_CLOSE", ")", startPos);
      continue;
    }

    // Comma
    if (ch === ",") {
      advance();
      addToken("COMMA", ",", startPos);
      continue;
    }

    // Colon
    if (ch === ":") {
      advance();
      addToken("COLON", ":", startPos);
      continue;
    }

    // Exclamation mark (for cross-sheet refs)
    if (ch === "!") {
      advance();
      addToken("EXCLAMATION", "!", startPos);
      continue;
    }

    // Operators: multi-char first (<>, <=, >=)
    if (ch === "<") {
      advance();
      if (peek() === ">") {
        advance();
        addToken("OPERATOR", "<>", startPos);
      } else if (peek() === "=") {
        advance();
        addToken("OPERATOR", "<=", startPos);
      } else {
        addToken("OPERATOR", "<", startPos);
      }
      continue;
    }
    if (ch === ">") {
      advance();
      if (peek() === "=") {
        advance();
        addToken("OPERATOR", ">=", startPos);
      } else {
        addToken("OPERATOR", ">", startPos);
      }
      continue;
    }
    if (OPERATORS.has(ch)) {
      advance();
      addToken("OPERATOR", ch, startPos);
      continue;
    }

    // Dollar sign — start of absolute cell reference
    if (ch === "$") {
      // This is part of a cell reference like $A$1, $A1, etc.
      let ref = "";
      // Consume the full cell reference with $ markers
      while (
        pos < input.length &&
        (peek() === "$" || isAlpha(peek()) || isDigit(peek()))
      ) {
        ref += advance();
      }
      addToken("CELL_REF", ref, startPos);
      continue;
    }

    // Identifier: could be boolean, function name, or cell reference
    if (isAlpha(ch)) {
      let ident = "";
      while (pos < input.length && isAlphaNumeric(peek())) {
        ident += advance();
      }

      const upper = ident.toUpperCase();

      // Check for boolean
      if (upper === "TRUE" || upper === "FALSE") {
        addToken("BOOLEAN", upper, startPos);
        continue;
      }

      // Check if it's a function call (followed by open paren)
      if (peek() === "(") {
        addToken("FUNCTION_NAME", upper, startPos);
        continue;
      }

      // Check for mixed reference like A$1 (letters followed by $ then digits)
      if (peek() === "$" && pos + 1 < input.length && isDigit(input[pos + 1])) {
        let ref = ident.toUpperCase();
        ref += advance(); // consume $
        while (pos < input.length && isDigit(peek())) {
          ref += advance();
        }
        addToken("CELL_REF", ref, startPos);
        continue;
      }

      // Could be a sheet name (followed by !) — check before cell ref
      // Preserve original case for sheet names
      if (peek() === "!") {
        addToken("CELL_REF", ident, startPos);
        continue;
      }

      // Check if it looks like a cell reference: letters followed by digits
      const cellMatch = ident.match(/^([A-Za-z]+)(\d+)$/);
      if (cellMatch) {
        addToken("CELL_REF", ident.toUpperCase(), startPos);
        continue;
      }

      // Unknown identifier — treat as function name for #NAME? error
      addToken("FUNCTION_NAME", upper, startPos);
      continue;
    }

    throw new TokenizerError(`Unexpected character: ${ch}`, pos);
  }

  addToken("EOF", "", pos);
  return tokens;
}

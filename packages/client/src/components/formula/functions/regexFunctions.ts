/**
 * Regex functions: REGEXMATCH, REGEXEXTRACT, REGEXREPLACE
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import { requireString } from "./helpers";

function buildRegex(pattern: string, flags?: string): RegExp | FormulaError {
  try {
    return new RegExp(pattern, flags);
  } catch {
    return "#VALUE!" as FormulaError;
  }
}

/**
 * REGEXMATCH(text, regular_expression)
 * Returns true if text matches the regular expression.
 */
function fnREGEXMATCH(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const text = requireString(args[0]);
  const pattern = requireString(args[1]);
  const regex = buildRegex(pattern);
  if (typeof regex === "string") return regex;
  return regex.test(text);
}

/**
 * REGEXEXTRACT(text, regular_expression)
 * Returns the first match of the regular expression in text.
 */
function fnREGEXEXTRACT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const text = requireString(args[0]);
  const pattern = requireString(args[1]);
  const regex = buildRegex(pattern);
  if (typeof regex === "string") return regex;
  const match = text.match(regex);
  if (!match) return "#N/A" as FormulaError;
  // Return first capture group if present, otherwise the full match
  return match[1] ?? match[0];
}

/**
 * REGEXREPLACE(text, regular_expression, replacement)
 * Replaces all matches of the regular expression in text with replacement.
 */
function fnREGEXREPLACE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const text = requireString(args[0]);
  const pattern = requireString(args[1]);
  const replacement = requireString(args[2]);
  const regex = buildRegex(pattern, "g");
  if (typeof regex === "string") return regex;
  return text.replace(regex, replacement);
}

export const regexFunctions: Record<string, FormulaFunction> = {
  REGEXMATCH: fnREGEXMATCH,
  REGEXEXTRACT: fnREGEXEXTRACT,
  REGEXREPLACE: fnREGEXREPLACE,
};

/**
 * Web and import functions: ENCODEURL, ISURL, IMPORTHTML, IMPORTXML,
 * IMPORTFEED, FINANCE, TRANSLATE.
 *
 * Pure functions return either a computed value (ENCODEURL, ISURL) or a
 * metadata marker that the grid/store layer resolves asynchronously via
 * the server-side proxy endpoint.
 */
import type { FormulaValue, FormulaError } from "../../../types/formula";
import type { FormulaFunction } from "./helpers";

/**
 * ENCODEURL(text) — URL-encodes a string.
 */
function fnENCODEURL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const text = args[0];
  if (text === null) return "";
  return encodeURIComponent(String(text));
}

/**
 * ISURL(value) — Checks if a string is a valid URL.
 */
function fnISURL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const value = args[0];
  if (value === null || value === "") return false;
  const str = String(value);
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * IMPORTHTML(url, query, index) — Imports data from HTML tables or lists.
 * query is "table" or "list", index selects which one (1-based).
 * Returns a metadata marker; actual fetch is handled by the grid/store layer.
 */
function fnIMPORTHTML(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const url = String(args[0] ?? "");
  if (!url) return "#VALUE!" as FormulaError;
  const query = String(args[1] ?? "").toLowerCase();
  if (query !== "table" && query !== "list") return "#VALUE!" as FormulaError;
  const index = Number(args[2]);
  if (isNaN(index) || index < 1) return "#VALUE!" as FormulaError;
  return `__IMPORTHTML__${JSON.stringify({ url, query, index })}`;
}

/**
 * IMPORTXML(url, xpath) — Imports data from XML using XPath queries.
 * Returns a metadata marker; actual fetch is handled by the grid/store layer.
 */
function fnIMPORTXML(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const url = String(args[0] ?? "");
  const xpath = String(args[1] ?? "");
  if (!url || !xpath) return "#VALUE!" as FormulaError;
  return `__IMPORTXML__${JSON.stringify({ url, xpath })}`;
}

/**
 * IMPORTFEED(url, [query], [headers], [num_items]) — Imports RSS/Atom feed data.
 * Returns a metadata marker; actual fetch is handled by the grid/store layer.
 */
function fnIMPORTFEED(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const url = String(args[0] ?? "");
  if (!url) return "#VALUE!" as FormulaError;
  const query = args.length >= 2 ? String(args[1] ?? "") : "";
  const headers = args.length >= 3 ? Boolean(args[2]) : false;
  const numItems = args.length >= 4 ? Number(args[3]) : 0;
  return `__IMPORTFEED__${JSON.stringify({ url, query, headers, numItems: isNaN(numItems) ? 0 : numItems })}`;
}

/**
 * FINANCE(ticker, [attribute], [startDate], [endDate]) — Fetch stock/fund/currency data.
 * Returns a metadata marker; actual fetch is handled by the grid/store layer
 * via a free financial data API.
 */
function fnFINANCE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const ticker = String(args[0] ?? "").toUpperCase();
  if (!ticker) return "#VALUE!" as FormulaError;
  const attribute = args.length >= 2 ? String(args[1] ?? "price") : "price";
  const startDate = args.length >= 3 ? String(args[2] ?? "") : "";
  const endDate = args.length >= 4 ? String(args[3] ?? "") : "";
  return `__FINANCE__${JSON.stringify({ ticker, attribute, startDate, endDate })}`;
}

/**
 * TRANSLATE(text, sourceLang, targetLang) — Translation function.
 * Returns a metadata marker; actual translation is handled by the grid/store layer.
 */
function fnTRANSLATE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const text = String(args[0] ?? "");
  const sourceLang = String(args[1] ?? "");
  const targetLang = String(args[2] ?? "");
  if (!text || !sourceLang || !targetLang) return "#VALUE!" as FormulaError;
  return `__TRANSLATE__${JSON.stringify({ text, sourceLang, targetLang })}`;
}

export const webFunctions: Record<string, FormulaFunction> = {
  ENCODEURL: fnENCODEURL,
  ISURL: fnISURL,
  IMPORTHTML: fnIMPORTHTML,
  IMPORTXML: fnIMPORTXML,
  IMPORTFEED: fnIMPORTFEED,
  FINANCE: fnFINANCE,
  TRANSLATE: fnTRANSLATE,
};

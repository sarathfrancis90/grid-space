/**
 * QUERY function — Google Sheets-style SQL-like queries on ranges.
 *
 * QUERY(data, query_string, [headers])
 *
 * Supports:
 *   SELECT (column letters/numbers)
 *   WHERE (=, !=, <>, >, <, >=, <=, CONTAINS, LIKE, STARTS WITH, ENDS WITH)
 *   ORDER BY (ASC/DESC)
 *   LIMIT
 *   GROUP BY with aggregations (SUM, AVG, COUNT, MIN, MAX)
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import { is2DArray, flattenArgs, toNumber } from "./helpers";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ParsedQuery {
  select: SelectClause[];
  where: WhereClause | null;
  orderBy: OrderByClause[];
  limit: number | null;
  groupBy: number[];
}

interface SelectClause {
  col: number; // -1 for aggregation on all
  agg: AggType | null;
}

type AggType = "SUM" | "AVG" | "COUNT" | "MIN" | "MAX";

interface WhereClause {
  type: "condition" | "and" | "or";
  left?: WhereClause;
  right?: WhereClause;
  col?: number;
  op?: string;
  value?: FormulaValue;
}

interface OrderByClause {
  col: number;
  desc: boolean;
}

// ---------------------------------------------------------------------------
// Query parser
// ---------------------------------------------------------------------------

function colLetterToIndex(letter: string): number {
  const upper = letter.toUpperCase();
  let idx = 0;
  for (let i = 0; i < upper.length; i++) {
    idx = idx * 26 + (upper.charCodeAt(i) - 64);
  }
  return idx - 1; // 0-based
}

function parseColRef(token: string): number {
  // Could be a letter (A, B, C...) or Col followed by a number (Col1, Col2...)
  const colMatch = token.match(/^Col(\d+)$/i);
  if (colMatch) return parseInt(colMatch[1], 10) - 1; // 0-based
  // Try letter-based
  if (/^[A-Za-z]+$/.test(token)) return colLetterToIndex(token);
  return -1;
}

function parseValue(token: string): FormulaValue {
  // String literal
  if (
    (token.startsWith("'") && token.endsWith("'")) ||
    (token.startsWith('"') && token.endsWith('"'))
  ) {
    return token.slice(1, -1);
  }
  // Number
  const n = Number(token);
  if (!isNaN(n) && token !== "") return n;
  // Boolean
  if (token.toUpperCase() === "TRUE") return true;
  if (token.toUpperCase() === "FALSE") return false;
  if (token.toUpperCase() === "NULL") return null;
  // Treat as string
  return token;
}

function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < query.length) {
    // Skip whitespace
    if (/\s/.test(query[i])) {
      i++;
      continue;
    }
    // Quoted string
    if (query[i] === "'" || query[i] === '"') {
      const quote = query[i];
      let str = quote;
      i++;
      while (i < query.length && query[i] !== quote) {
        str += query[i];
        i++;
      }
      if (i < query.length) {
        str += query[i];
        i++;
      }
      tokens.push(str);
      continue;
    }
    // Operators: !=, <>, >=, <=, =, <, >
    if (query[i] === "!" && i + 1 < query.length && query[i + 1] === "=") {
      tokens.push("!=");
      i += 2;
      continue;
    }
    if (query[i] === "<" && i + 1 < query.length && query[i + 1] === ">") {
      tokens.push("<>");
      i += 2;
      continue;
    }
    if (query[i] === ">" && i + 1 < query.length && query[i + 1] === "=") {
      tokens.push(">=");
      i += 2;
      continue;
    }
    if (query[i] === "<" && i + 1 < query.length && query[i + 1] === "=") {
      tokens.push("<=");
      i += 2;
      continue;
    }
    if (query[i] === "=" || query[i] === "<" || query[i] === ">") {
      tokens.push(query[i]);
      i++;
      continue;
    }
    // Comma
    if (query[i] === ",") {
      tokens.push(",");
      i++;
      continue;
    }
    // Parentheses
    if (query[i] === "(" || query[i] === ")") {
      tokens.push(query[i]);
      i++;
      continue;
    }
    // Asterisk
    if (query[i] === "*") {
      tokens.push("*");
      i++;
      continue;
    }
    // Word or number
    let word = "";
    while (i < query.length && !/[\s,()=<>!*]/.test(query[i])) {
      word += query[i];
      i++;
    }
    if (word) tokens.push(word);
  }
  return tokens;
}

function parseQuery(queryStr: string, numCols: number): ParsedQuery {
  const tokens = tokenizeQuery(queryStr.trim());
  let pos = 0;

  function peek(): string {
    return pos < tokens.length ? tokens[pos] : "";
  }

  function advance(): string {
    return tokens[pos++] ?? "";
  }

  function expectUpper(expected: string): void {
    const t = advance().toUpperCase();
    if (t !== expected) {
      throw new Error(`Expected '${expected}', got '${t}'`);
    }
  }

  const result: ParsedQuery = {
    select: [],
    where: null,
    orderBy: [],
    limit: null,
    groupBy: [],
  };

  // Parse SELECT
  if (peek().toUpperCase() !== "SELECT") {
    // Default: select all columns
    for (let i = 0; i < numCols; i++) {
      result.select.push({ col: i, agg: null });
    }
  } else {
    expectUpper("SELECT");
    if (peek() === "*") {
      advance();
      for (let i = 0; i < numCols; i++) {
        result.select.push({ col: i, agg: null });
      }
    } else {
      result.select = parseSelectList();
    }
  }

  // Parse optional clauses
  while (pos < tokens.length) {
    const keyword = peek().toUpperCase();
    if (keyword === "WHERE") {
      advance();
      result.where = parseWhereExpr();
    } else if (keyword === "ORDER") {
      advance();
      if (peek().toUpperCase() === "BY") advance();
      result.orderBy = parseOrderByList();
    } else if (keyword === "LIMIT") {
      advance();
      result.limit = parseInt(advance(), 10);
    } else if (keyword === "GROUP") {
      advance();
      if (peek().toUpperCase() === "BY") advance();
      result.groupBy = parseGroupByList();
    } else {
      advance(); // skip unknown tokens
    }
  }

  return result;

  function parseSelectList(): SelectClause[] {
    const clauses: SelectClause[] = [];
    clauses.push(parseSelectItem());
    while (peek() === ",") {
      advance();
      clauses.push(parseSelectItem());
    }
    return clauses;
  }

  function parseSelectItem(): SelectClause {
    const token = peek().toUpperCase();
    // Check for aggregation: SUM(A), AVG(B), COUNT(C), MIN(D), MAX(E)
    if (
      (token === "SUM" ||
        token === "AVG" ||
        token === "COUNT" ||
        token === "MIN" ||
        token === "MAX") &&
      pos + 1 < tokens.length &&
      tokens[pos + 1] === "("
    ) {
      const agg = advance().toUpperCase() as AggType;
      advance(); // (
      const colToken = advance();
      const col = parseColRef(colToken);
      if (peek() === ")") advance();
      return { col, agg };
    }
    const colToken = advance();
    const col = parseColRef(colToken);
    return { col: col >= 0 ? col : 0, agg: null };
  }

  function parseWhereExpr(): WhereClause {
    let left = parseWhereCondition();
    while (peek().toUpperCase() === "AND" || peek().toUpperCase() === "OR") {
      const connective = advance().toUpperCase();
      const right = parseWhereCondition();
      left = {
        type: connective === "AND" ? "and" : "or",
        left,
        right,
      };
    }
    return left;
  }

  function parseWhereCondition(): WhereClause {
    const colToken = advance();
    const col = parseColRef(colToken);

    // Multi-word operators
    const opToken = peek().toUpperCase();
    let op: string;

    if (opToken === "CONTAINS") {
      op = "CONTAINS";
      advance();
    } else if (opToken === "LIKE") {
      op = "LIKE";
      advance();
    } else if (opToken === "STARTS") {
      advance();
      if (peek().toUpperCase() === "WITH") advance();
      op = "STARTS WITH";
    } else if (opToken === "ENDS") {
      advance();
      if (peek().toUpperCase() === "WITH") advance();
      op = "ENDS WITH";
    } else if (
      opToken === "IS" &&
      pos + 1 < tokens.length &&
      tokens[pos + 1].toUpperCase() === "NOT"
    ) {
      advance(); // IS
      advance(); // NOT
      if (peek().toUpperCase() === "NULL") advance();
      op = "IS NOT NULL";
    } else if (opToken === "IS") {
      advance();
      if (peek().toUpperCase() === "NULL") advance();
      op = "IS NULL";
    } else {
      op = advance(); // =, !=, <>, <, >, <=, >=
    }

    let value: FormulaValue = null;
    if (op !== "IS NULL" && op !== "IS NOT NULL") {
      value = parseValue(advance());
    }

    return { type: "condition", col, op, value };
  }

  function parseOrderByList(): OrderByClause[] {
    const clauses: OrderByClause[] = [];
    const colToken = advance();
    let desc = false;
    if (peek().toUpperCase() === "ASC" || peek().toUpperCase() === "DESC") {
      desc = advance().toUpperCase() === "DESC";
    }
    clauses.push({ col: parseColRef(colToken), desc });
    while (peek() === ",") {
      advance();
      const ct = advance();
      let d = false;
      if (peek().toUpperCase() === "ASC" || peek().toUpperCase() === "DESC") {
        d = advance().toUpperCase() === "DESC";
      }
      clauses.push({ col: parseColRef(ct), desc: d });
    }
    return clauses;
  }

  function parseGroupByList(): number[] {
    const cols: number[] = [];
    cols.push(parseColRef(advance()));
    while (peek() === ",") {
      advance();
      cols.push(parseColRef(advance()));
    }
    return cols;
  }
}

// ---------------------------------------------------------------------------
// Query execution
// ---------------------------------------------------------------------------

function evaluateWhere(row: FormulaValue[], clause: WhereClause): boolean {
  if (clause.type === "and") {
    return (
      evaluateWhere(row, clause.left!) && evaluateWhere(row, clause.right!)
    );
  }
  if (clause.type === "or") {
    return (
      evaluateWhere(row, clause.left!) || evaluateWhere(row, clause.right!)
    );
  }

  const colVal: FormulaValue =
    clause.col !== undefined && clause.col >= 0
      ? (row[clause.col] ?? null)
      : null;
  const cmpVal: FormulaValue = clause.value ?? null;

  switch (clause.op) {
    case "=":
      return compareEq(colVal, cmpVal);
    case "!=":
    case "<>":
      return !compareEq(colVal, cmpVal);
    case ">":
      return compareLt(cmpVal, colVal);
    case "<":
      return compareLt(colVal, cmpVal);
    case ">=":
      return compareEq(colVal, cmpVal) || compareLt(cmpVal, colVal);
    case "<=":
      return compareEq(colVal, cmpVal) || compareLt(colVal, cmpVal);
    case "CONTAINS":
      return String(colVal ?? "")
        .toLowerCase()
        .includes(String(cmpVal ?? "").toLowerCase());
    case "LIKE": {
      const pattern = String(cmpVal ?? "")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*")
        .replace(/_/g, ".");
      return new RegExp(`^${pattern}$`, "i").test(String(colVal ?? ""));
    }
    case "STARTS WITH":
      return String(colVal ?? "")
        .toLowerCase()
        .startsWith(String(cmpVal ?? "").toLowerCase());
    case "ENDS WITH":
      return String(colVal ?? "")
        .toLowerCase()
        .endsWith(String(cmpVal ?? "").toLowerCase());
    case "IS NULL":
      return colVal === null || colVal === "";
    case "IS NOT NULL":
      return colVal !== null && colVal !== "";
    default:
      return true;
  }
}

function compareEq(a: FormulaValue, b: FormulaValue): boolean {
  if (a === b) return true;
  const na = toNumber(a, false);
  const nb = toNumber(b, false);
  if (na !== null && nb !== null) return na === nb;
  return String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();
}

function compareLt(a: FormulaValue, b: FormulaValue): boolean {
  const na = toNumber(a, false);
  const nb = toNumber(b, false);
  if (na !== null && nb !== null) return na < nb;
  return String(a ?? "").toLowerCase() < String(b ?? "").toLowerCase();
}

function executeQuery(
  data: FormulaValue[][],
  query: ParsedQuery,
): FormulaValue[][] {
  let rows = data.map((r) => [...r]);

  // WHERE
  if (query.where) {
    rows = rows.filter((row) => evaluateWhere(row, query.where!));
  }

  // GROUP BY
  if (query.groupBy.length > 0) {
    rows = executeGroupBy(rows, query);
  }

  // ORDER BY
  if (query.orderBy.length > 0) {
    rows.sort((a, b) => {
      for (const ob of query.orderBy) {
        const va = ob.col >= 0 ? a[ob.col] : null;
        const vb = ob.col >= 0 ? b[ob.col] : null;
        const na = toNumber(va, false);
        const nb = toNumber(vb, false);
        let cmp = 0;
        if (na !== null && nb !== null) {
          cmp = na - nb;
        } else {
          const sa = String(va ?? "");
          const sb = String(vb ?? "");
          cmp = sa.localeCompare(sb);
        }
        if (cmp !== 0) return ob.desc ? -cmp : cmp;
      }
      return 0;
    });
  }

  // LIMIT
  if (query.limit !== null && query.limit >= 0) {
    rows = rows.slice(0, query.limit);
  }

  // SELECT projection (only if no GROUP BY, since groupBy already projected)
  if (query.groupBy.length === 0) {
    rows = rows.map((row) =>
      query.select.map((sel) => {
        if (sel.col >= 0 && sel.col < row.length) return row[sel.col];
        return null;
      }),
    );
  }

  return rows;
}

function executeGroupBy(
  rows: FormulaValue[][],
  query: ParsedQuery,
): FormulaValue[][] {
  // Group rows by groupBy columns
  const groups = new Map<string, FormulaValue[][]>();
  for (const row of rows) {
    const key = query.groupBy.map((col) => String(row[col] ?? "")).join("\x00");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // For each group, compute aggregate values per select clause
  const result: FormulaValue[][] = [];
  for (const groupRows of groups.values()) {
    const outputRow: FormulaValue[] = [];
    for (const sel of query.select) {
      if (!sel.agg) {
        // Non-aggregated column — take value from first row
        outputRow.push(sel.col >= 0 ? groupRows[0][sel.col] : null);
      } else {
        outputRow.push(computeAggregate(groupRows, sel.col, sel.agg));
      }
    }
    result.push(outputRow);
  }
  return result;
}

function computeAggregate(
  rows: FormulaValue[][],
  col: number,
  agg: AggType,
): FormulaValue {
  const values = rows
    .map((r) => (col >= 0 ? r[col] : null))
    .map((v) => toNumber(v, false))
    .filter((n): n is number => n !== null);

  switch (agg) {
    case "COUNT":
      return values.length;
    case "SUM":
      return values.reduce((a, b) => a + b, 0);
    case "AVG":
      return values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    case "MIN":
      return values.length > 0 ? Math.min(...values) : 0;
    case "MAX":
      return values.length > 0 ? Math.max(...values) : 0;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Exported function
// ---------------------------------------------------------------------------

function fnQUERY(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;

  // Normalize data to 2D array
  let data: FormulaValue[][];
  if (is2DArray(args[0])) {
    data = (args[0] as unknown as FormulaValue[][]).map((row) => [...row]);
  } else if (Array.isArray(args[0])) {
    // Flat array — treat as single column
    data = flattenArgs([args[0]]).map((v) => [v]);
  } else {
    return "#VALUE!" as FormulaError;
  }

  const queryStr = String(args[1] ?? "");
  if (!queryStr) return "#VALUE!" as FormulaError;

  // Headers flag: 1 means first row is headers, 0 means no headers
  const hasHeaders = args.length >= 3 && toNumber(args[2]) === 1;

  let headerRow: FormulaValue[] | null = null;
  let dataRows: FormulaValue[][];
  if (hasHeaders && data.length > 0) {
    headerRow = data[0];
    dataRows = data.slice(1);
  } else {
    dataRows = data;
  }

  const numCols = data[0]?.length ?? 0;

  try {
    const parsed = parseQuery(queryStr, numCols);
    const resultRows = executeQuery(dataRows, parsed);

    // Prepend header row if headers were specified and SELECT didn't change
    if (headerRow && resultRows.length > 0) {
      const headerResult = parsed.select.map((sel) => {
        if (sel.agg) {
          const colLabel =
            sel.col >= 0 && headerRow && sel.col < headerRow.length
              ? String(headerRow[sel.col] ?? "")
              : "";
          return `${sel.agg.toLowerCase()}(${colLabel})`;
        }
        return sel.col >= 0 && headerRow && sel.col < headerRow.length
          ? headerRow[sel.col]
          : null;
      });
      return [headerResult, ...resultRows] as unknown as FormulaValue;
    }

    if (resultRows.length === 0) return "#N/A" as FormulaError;
    if (resultRows.length === 1 && resultRows[0].length === 1) {
      return resultRows[0][0];
    }
    return resultRows as unknown as FormulaValue;
  } catch {
    return "#VALUE!" as FormulaError;
  }
}

export const queryFunctions: Record<string, FormulaFunction> = {
  QUERY: fnQUERY,
};

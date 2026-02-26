/**
 * FormulaAutocomplete — dropdown showing matching formula function names.
 * S2-002: Formula autocomplete dropdown
 */
import { useState, useEffect, useCallback, useRef } from "react";

const FORMULA_FUNCTIONS = [
  "ABS",
  "ACOS",
  "ASIN",
  "ATAN",
  "ATAN2",
  "AVERAGE",
  "AVERAGEIF",
  "CEILING",
  "CHAR",
  "CHOOSE",
  "CLEAN",
  "CODE",
  "COLUMN",
  "COLUMNS",
  "CONCAT",
  "CONCATENATE",
  "COS",
  "COUNT",
  "COUNTA",
  "COUNTBLANK",
  "COUNTIF",
  "COUNTIFS",
  "DATE",
  "DATEVALUE",
  "DAY",
  "DAYS",
  "EDATE",
  "EOMONTH",
  "EVEN",
  "EXP",
  "FACT",
  "FIND",
  "FLOOR",
  "HLOOKUP",
  "HOUR",
  "IF",
  "IFERROR",
  "IFNA",
  "INDEX",
  "INT",
  "ISBLANK",
  "ISERROR",
  "ISEVEN",
  "ISNA",
  "ISNUMBER",
  "ISODD",
  "ISTEXT",
  "LARGE",
  "LEFT",
  "LEN",
  "LN",
  "LOG",
  "LOG10",
  "LOWER",
  "MATCH",
  "MAX",
  "MAXIFS",
  "MEDIAN",
  "MID",
  "MIN",
  "MINIFS",
  "MINUTE",
  "MOD",
  "MONTH",
  "NOT",
  "NOW",
  "ODD",
  "OR",
  "PERCENTILE",
  "PI",
  "POWER",
  "PRODUCT",
  "PROPER",
  "QUOTIENT",
  "RAND",
  "RANDBETWEEN",
  "RANK",
  "REPLACE",
  "REPT",
  "RIGHT",
  "ROUND",
  "ROUNDDOWN",
  "ROUNDUP",
  "ROW",
  "ROWS",
  "SEARCH",
  "SECOND",
  "SIGN",
  "SIN",
  "SMALL",
  "SORT",
  "SQRT",
  "STDEV",
  "SUBSTITUTE",
  "SUM",
  "SUMIF",
  "SUMIFS",
  "SUMPRODUCT",
  "TAN",
  "TEXT",
  "TEXTJOIN",
  "TIME",
  "TIMEVALUE",
  "TODAY",
  "TRANSPOSE",
  "TRIM",
  "TRUNC",
  "UPPER",
  "VALUE",
  "VAR",
  "VLOOKUP",
  "WEEKDAY",
  "WEEKNUM",
  "YEAR",
];

interface FormulaAutocompleteProps {
  input: string;
  position: { x: number; y: number };
  onSelect: (funcName: string) => void;
  visible: boolean;
}

export function FormulaAutocomplete({
  input,
  position,
  onSelect,
  visible,
}: FormulaAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Extract the function name being typed (after last operator or open paren)
  const getPrefix = useCallback((): string => {
    const stripped = input.startsWith("=") ? input.slice(1) : input;
    const match = stripped.match(/([A-Z]+)$/i);
    return match ? match[1].toUpperCase() : "";
  }, [input]);

  const prefix = getPrefix();
  const matches =
    prefix.length > 0
      ? FORMULA_FUNCTIONS.filter((f) => f.startsWith(prefix))
      : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [prefix]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || matches.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, matches.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Tab" || e.key === "Enter") {
        if (matches.length > 0) {
          e.preventDefault();
          onSelect(matches[selectedIndex]);
        }
      }
    },
    [visible, matches, selectedIndex, onSelect],
  );

  useEffect(() => {
    if (visible) {
      window.addEventListener("keydown", handleKeyDown, true);
      return () => window.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [visible, handleKeyDown]);

  if (!visible || matches.length === 0) return null;

  return (
    <div
      ref={listRef}
      data-testid="formula-autocomplete"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + 25,
        zIndex: 50,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        maxHeight: 200,
        overflowY: "auto",
        minWidth: 180,
      }}
    >
      {matches.slice(0, 10).map((func, idx) => (
        <div
          key={func}
          data-testid={`autocomplete-item-${func}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(func);
          }}
          style={{
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 13,
            backgroundColor: idx === selectedIndex ? "#e8f0fe" : "white",
            fontFamily: "monospace",
          }}
        >
          {func}
        </div>
      ))}
    </div>
  );
}

export { FORMULA_FUNCTIONS };

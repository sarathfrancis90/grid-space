/**
 * FunctionPicker — searchable dropdown for inserting formula functions.
 * Opened via the fx button in the formula bar.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { BUILTIN_FORMULA_FUNCTIONS } from "../formula/FormulaAutocomplete";

interface FunctionCategory {
  name: string;
  functions: string[];
}

const CATEGORIES: FunctionCategory[] = [
  {
    name: "Math",
    functions: [
      "ABS",
      "ACOS",
      "ASIN",
      "ATAN",
      "ATAN2",
      "CEILING",
      "COS",
      "EVEN",
      "EXP",
      "FACT",
      "FLOOR",
      "INT",
      "LN",
      "LOG",
      "LOG10",
      "MOD",
      "ODD",
      "PI",
      "POWER",
      "PRODUCT",
      "QUOTIENT",
      "RAND",
      "RANDBETWEEN",
      "ROUND",
      "ROUNDDOWN",
      "ROUNDUP",
      "SIGN",
      "SIN",
      "SQRT",
      "SUM",
      "SUMPRODUCT",
      "TAN",
      "TRUNC",
    ],
  },
  {
    name: "Text",
    functions: [
      "CHAR",
      "CLEAN",
      "CODE",
      "CONCAT",
      "CONCATENATE",
      "FIND",
      "LEFT",
      "LEN",
      "LOWER",
      "MID",
      "PROPER",
      "REPLACE",
      "REPT",
      "RIGHT",
      "SEARCH",
      "SUBSTITUTE",
      "TEXT",
      "TEXTJOIN",
      "TRIM",
      "UPPER",
      "VALUE",
    ],
  },
  {
    name: "Logical",
    functions: ["IF", "IFERROR", "IFNA", "NOT", "OR"],
  },
  {
    name: "Lookup",
    functions: ["CHOOSE", "HLOOKUP", "INDEX", "MATCH", "VLOOKUP"],
  },
  {
    name: "Date & Time",
    functions: [
      "DATE",
      "DATEVALUE",
      "DAY",
      "DAYS",
      "EDATE",
      "EOMONTH",
      "HOUR",
      "MINUTE",
      "MONTH",
      "NOW",
      "SECOND",
      "TIME",
      "TIMEVALUE",
      "TODAY",
      "WEEKDAY",
      "WEEKNUM",
      "YEAR",
    ],
  },
  {
    name: "Statistical",
    functions: [
      "AVERAGE",
      "AVERAGEIF",
      "COUNT",
      "COUNTA",
      "COUNTBLANK",
      "COUNTIF",
      "COUNTIFS",
      "LARGE",
      "MAX",
      "MAXIFS",
      "MEDIAN",
      "MIN",
      "MINIFS",
      "PERCENTILE",
      "RANK",
      "SMALL",
      "STDEV",
      "SUMIF",
      "SUMIFS",
      "VAR",
    ],
  },
  {
    name: "Info",
    functions: [
      "COLUMN",
      "COLUMNS",
      "ISBLANK",
      "ISERROR",
      "ISEVEN",
      "ISNA",
      "ISNUMBER",
      "ISODD",
      "ISTEXT",
      "ROW",
      "ROWS",
    ],
  },
  {
    name: "Array",
    functions: ["SORT", "TRANSPOSE"],
  },
];

interface FunctionPickerProps {
  onSelect: (funcName: string) => void;
  onClose: () => void;
}

export function FunctionPicker({ onSelect, onClose }: FunctionPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filteredFunctions = useMemo(() => {
    const query = search.toUpperCase();
    let pool: string[];

    if (selectedCategory === "All") {
      pool = BUILTIN_FORMULA_FUNCTIONS;
    } else {
      const cat = CATEGORIES.find((c) => c.name === selectedCategory);
      pool = cat ? cat.functions : BUILTIN_FORMULA_FUNCTIONS;
    }

    if (!query) return pool;
    return pool.filter((f) => f.includes(query));
  }, [search, selectedCategory]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredFunctions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) =>
          Math.min(i + 1, filteredFunctions.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filteredFunctions.length > 0) {
        e.preventDefault();
        onSelect(filteredFunctions[highlightedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filteredFunctions, highlightedIndex, onSelect, onClose],
  );

  // Scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex] as HTMLElement | undefined;
    if (item && typeof item.scrollIntoView === "function") {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  return (
    <div
      data-testid="function-picker"
      className="absolute z-50 bg-white border border-gray-300 rounded shadow-lg"
      style={{ top: "100%", left: 0, width: 320, maxHeight: 360 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-200">
        <input
          ref={searchRef}
          data-testid="function-picker-search"
          type="text"
          placeholder="Search functions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:border-blue-500"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200">
        {["All", ...CATEGORIES.map((c) => c.name)].map((cat) => (
          <button
            key={cat}
            data-testid={`function-picker-category-${cat}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setSelectedCategory(cat);
            }}
            className={`px-2 py-0.5 text-xs rounded ${
              selectedCategory === cat
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Function list */}
      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 220 }}>
        {filteredFunctions.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            No matching functions
          </div>
        ) : (
          filteredFunctions.map((func, idx) => (
            <div
              key={func}
              data-testid={`function-picker-item-${func}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(func);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer font-mono ${
                idx === highlightedIndex
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {func}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { CATEGORIES as FUNCTION_CATEGORIES };

/**
 * FunctionPicker — searchable function picker dialog opened from the fx button.
 * Groups functions by category with search filtering.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from "react";

interface FunctionInfo {
  name: string;
  category: string;
  description: string;
}

const FUNCTION_DATABASE: FunctionInfo[] = [
  // Math
  { name: "SUM", category: "Math", description: "Adds all numbers in a range" },
  {
    name: "AVERAGE",
    category: "Math",
    description: "Returns the average of numbers",
  },
  { name: "MIN", category: "Math", description: "Returns the smallest number" },
  { name: "MAX", category: "Math", description: "Returns the largest number" },
  {
    name: "COUNT",
    category: "Math",
    description: "Counts cells containing numbers",
  },
  {
    name: "ROUND",
    category: "Math",
    description: "Rounds a number to a given precision",
  },
  { name: "ABS", category: "Math", description: "Returns absolute value" },
  { name: "SQRT", category: "Math", description: "Returns the square root" },
  {
    name: "POWER",
    category: "Math",
    description: "Returns number raised to a power",
  },
  {
    name: "MOD",
    category: "Math",
    description: "Returns the remainder after division",
  },
  {
    name: "CEILING",
    category: "Math",
    description: "Rounds up to nearest multiple",
  },
  {
    name: "FLOOR",
    category: "Math",
    description: "Rounds down to nearest multiple",
  },
  {
    name: "LOG",
    category: "Math",
    description: "Returns logarithm of a number",
  },
  { name: "EXP", category: "Math", description: "Returns e raised to a power" },
  { name: "PI", category: "Math", description: "Returns the value of Pi" },
  {
    name: "RAND",
    category: "Math",
    description: "Returns a random number between 0 and 1",
  },
  {
    name: "PRODUCT",
    category: "Math",
    description: "Multiplies all numbers in a range",
  },
  {
    name: "SUMPRODUCT",
    category: "Math",
    description: "Returns sum of products of ranges",
  },
  // Text
  {
    name: "CONCATENATE",
    category: "Text",
    description: "Joins text strings together",
  },
  {
    name: "LEFT",
    category: "Text",
    description: "Returns leftmost characters",
  },
  {
    name: "RIGHT",
    category: "Text",
    description: "Returns rightmost characters",
  },
  {
    name: "MID",
    category: "Text",
    description: "Returns characters from the middle",
  },
  { name: "LEN", category: "Text", description: "Returns length of text" },
  { name: "TRIM", category: "Text", description: "Removes extra spaces" },
  {
    name: "UPPER",
    category: "Text",
    description: "Converts text to uppercase",
  },
  {
    name: "LOWER",
    category: "Text",
    description: "Converts text to lowercase",
  },
  {
    name: "PROPER",
    category: "Text",
    description: "Capitalizes first letter of each word",
  },
  {
    name: "SUBSTITUTE",
    category: "Text",
    description: "Replaces text in a string",
  },
  {
    name: "FIND",
    category: "Text",
    description: "Finds position of text (case-sensitive)",
  },
  {
    name: "SEARCH",
    category: "Text",
    description: "Finds position of text (case-insensitive)",
  },
  { name: "TEXT", category: "Text", description: "Formats number as text" },
  { name: "VALUE", category: "Text", description: "Converts text to number" },
  // Logical
  {
    name: "IF",
    category: "Logical",
    description: "Returns value based on condition",
  },
  {
    name: "IFS",
    category: "Logical",
    description: "Checks multiple conditions",
  },
  {
    name: "AND",
    category: "Logical",
    description: "Returns TRUE if all conditions are TRUE",
  },
  {
    name: "OR",
    category: "Logical",
    description: "Returns TRUE if any condition is TRUE",
  },
  { name: "NOT", category: "Logical", description: "Reverses a logical value" },
  {
    name: "IFERROR",
    category: "Logical",
    description: "Returns value if no error, else alternate",
  },
  {
    name: "SWITCH",
    category: "Logical",
    description: "Matches value against list of cases",
  },
  // Lookup
  {
    name: "VLOOKUP",
    category: "Lookup",
    description: "Vertical lookup in first column of range",
  },
  {
    name: "HLOOKUP",
    category: "Lookup",
    description: "Horizontal lookup in first row of range",
  },
  {
    name: "INDEX",
    category: "Lookup",
    description: "Returns value at row/column intersection",
  },
  {
    name: "MATCH",
    category: "Lookup",
    description: "Returns position of a value in range",
  },
  {
    name: "CHOOSE",
    category: "Lookup",
    description: "Chooses value from a list by index",
  },
  // Conditional
  {
    name: "SUMIF",
    category: "Conditional",
    description: "Sums cells matching a condition",
  },
  {
    name: "COUNTIF",
    category: "Conditional",
    description: "Counts cells matching a condition",
  },
  {
    name: "AVERAGEIF",
    category: "Conditional",
    description: "Averages cells matching a condition",
  },
  {
    name: "SUMIFS",
    category: "Conditional",
    description: "Sums cells matching multiple conditions",
  },
  {
    name: "COUNTIFS",
    category: "Conditional",
    description: "Counts cells matching multiple conditions",
  },
  // Date
  { name: "TODAY", category: "Date", description: "Returns today's date" },
  {
    name: "NOW",
    category: "Date",
    description: "Returns current date and time",
  },
  {
    name: "DATE",
    category: "Date",
    description: "Creates a date from year, month, day",
  },
  { name: "YEAR", category: "Date", description: "Extracts year from a date" },
  {
    name: "MONTH",
    category: "Date",
    description: "Extracts month from a date",
  },
  { name: "DAY", category: "Date", description: "Extracts day from a date" },
  // Statistical
  {
    name: "STDEV",
    category: "Statistical",
    description: "Returns standard deviation",
  },
  { name: "VAR", category: "Statistical", description: "Returns variance" },
  {
    name: "MEDIAN",
    category: "Statistical",
    description: "Returns the median value",
  },
  {
    name: "LARGE",
    category: "Statistical",
    description: "Returns the k-th largest value",
  },
  {
    name: "SMALL",
    category: "Statistical",
    description: "Returns the k-th smallest value",
  },
  {
    name: "RANK",
    category: "Statistical",
    description: "Returns rank of a number in a list",
  },
  // Financial
  {
    name: "PMT",
    category: "Financial",
    description: "Calculates loan payment",
  },
  {
    name: "FV",
    category: "Financial",
    description: "Returns future value of investment",
  },
  { name: "PV", category: "Financial", description: "Returns present value" },
  {
    name: "NPV",
    category: "Financial",
    description: "Returns net present value",
  },
  {
    name: "IRR",
    category: "Financial",
    description: "Returns internal rate of return",
  },
  // Info
  { name: "ISBLANK", category: "Info", description: "Tests if cell is empty" },
  {
    name: "ISERROR",
    category: "Info",
    description: "Tests if value is an error",
  },
  {
    name: "ISNUMBER",
    category: "Info",
    description: "Tests if value is a number",
  },
  { name: "ISTEXT", category: "Info", description: "Tests if value is text" },
  {
    name: "ROW",
    category: "Info",
    description: "Returns row number of a reference",
  },
  {
    name: "COLUMN",
    category: "Info",
    description: "Returns column number of a reference",
  },
];

const CATEGORIES = [
  "All",
  "Math",
  "Text",
  "Logical",
  "Lookup",
  "Conditional",
  "Date",
  "Statistical",
  "Financial",
  "Info",
];

interface FunctionPickerProps {
  onSelect: (funcName: string) => void;
  onClose: () => void;
}

export function FunctionPicker({ onSelect, onClose }: FunctionPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    let fns = FUNCTION_DATABASE;
    if (selectedCategory !== "All") {
      fns = fns.filter((f) => f.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      fns = fns.filter(
        (f) => f.name.includes(q) || f.description.toUpperCase().includes(q),
      );
    }
    return fns;
  }, [search, selectedCategory]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, selectedCategory]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        onSelect(filtered[selectedIndex].name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filtered, selectedIndex, onSelect, onClose],
  );

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div
      data-testid="function-picker"
      className="absolute left-0 top-full z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
      style={{ width: 360, maxHeight: 400 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Search input */}
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
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            data-testid={`function-category-${cat.toLowerCase()}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-0.5 text-xs rounded ${
              selectedCategory === cat
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Function list */}
      <div
        ref={listRef}
        data-testid="function-picker-list"
        className="overflow-y-auto"
        style={{ maxHeight: 280 }}
      >
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            No functions found
          </div>
        ) : (
          filtered.map((fn, idx) => (
            <div
              key={fn.name}
              data-testid={`function-item-${fn.name}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(fn.name);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 cursor-pointer ${
                idx === selectedIndex ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-medium">{fn.name}</span>
                <span className="text-xs text-gray-400">{fn.category}</span>
              </div>
              <div className="text-xs text-gray-500">{fn.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

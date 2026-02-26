/**
 * Number format utility for cell display values.
 * Supports: General, Number, Currency, Percent, Date, Time, Scientific, Custom.
 */

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Excel serial date epoch: Dec 30, 1899 */
function serialToDate(serial: number): Date {
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + serial * 86400000);
}

function padZero(n: number, len: number = 2): string {
  return String(n).padStart(len, "0");
}

function formatDateToken(d: Date, token: string): string {
  switch (token) {
    case "yyyy":
      return String(d.getFullYear());
    case "yy":
      return String(d.getFullYear()).slice(-2);
    case "mmmm":
      return MONTHS_LONG[d.getMonth()];
    case "mmm":
      return MONTHS_SHORT[d.getMonth()];
    case "mm":
      return padZero(d.getMonth() + 1);
    case "m":
      return String(d.getMonth() + 1);
    case "dd":
      return padZero(d.getDate());
    case "d":
      return String(d.getDate());
    case "hh":
      return padZero(d.getHours());
    case "h":
      return String(d.getHours());
    case "nn":
    case "ss": // handled by context
      return padZero(d.getMinutes());
    case "n":
      return String(d.getMinutes());
    case "AM/PM": {
      return d.getHours() >= 12 ? "PM" : "AM";
    }
    default:
      return token;
  }
}

function isDateFormat(fmt: string): boolean {
  const lower = fmt.toLowerCase();
  return /[ymd]/.test(lower) && !/[#0]/.test(fmt);
}

function isTimeFormat(fmt: string): boolean {
  const lower = fmt.toLowerCase();
  return /[hn]/.test(lower) && /[:]/.test(lower) && !/[#0]/.test(fmt);
}

function formatDate(value: number, fmt: string): string {
  const d = serialToDate(value);
  // Tokenize the format string
  const tokens = fmt.match(
    /yyyy|yy|mmmm|mmm|mm|m|dd|d|hh|h|nn|n|ss|s|AM\/PM|[^a-zA-Z]+/gi,
  );
  if (!tokens) return String(value);

  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const lower = t.toLowerCase();
    if (lower === "ss" || lower === "s") {
      result +=
        lower === "ss" ? padZero(d.getSeconds()) : String(d.getSeconds());
    } else if (lower === "nn" || lower === "n") {
      result +=
        lower === "nn" ? padZero(d.getMinutes()) : String(d.getMinutes());
    } else if (lower === "hh" || lower === "h") {
      // Check if AM/PM format
      const hasAMPM = tokens.some((tk) => tk.toUpperCase() === "AM/PM");
      let hours = d.getHours();
      if (hasAMPM) {
        hours = hours % 12 || 12;
      }
      result += lower === "hh" ? padZero(hours) : String(hours);
    } else if (t.toUpperCase() === "AM/PM") {
      result += d.getHours() >= 12 ? "PM" : "AM";
    } else if (/^(yyyy|yy|mmmm|mmm|mm|m|dd|d)$/i.test(lower)) {
      result += formatDateToken(d, lower);
    } else {
      result += t;
    }
  }
  return result;
}

function formatNumberPattern(value: number, fmt: string): string {
  const isPercent = fmt.includes("%");
  const num = isPercent ? value * 100 : value;

  // Count decimal places from format
  const dotIdx = fmt.indexOf(".");
  let decimals = 0;
  if (dotIdx >= 0) {
    const afterDot = fmt.slice(dotIdx + 1).replace(/[^0#]/g, "");
    decimals = afterDot.length;
  }

  const useThousands = fmt.includes(",");

  // Build the number string
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");

  let intStr = intPart;
  if (useThousands) {
    intStr = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  let result = num < 0 ? "-" : "";
  result += intStr;
  if (decimals > 0 && decPart) {
    result += "." + decPart;
  }

  // Add prefix/suffix from format
  const prefix = fmt.match(/^([^#0.,%-]*)/)?.[1] ?? "";
  const suffix = fmt.match(/([^#0.,%]*)$/)?.[1] ?? "";

  return prefix + result + (isPercent ? "%" : "") + suffix;
}

/**
 * Format a cell value using a format string.
 * Returns the formatted string for display.
 */
export function formatCellValue(
  value: string | number | boolean | null,
  format?: string,
): string {
  if (value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";

  if (!format || format === "General") {
    return String(value);
  }

  const numValue = typeof value === "number" ? value : Number(value);
  if (isNaN(numValue) && typeof value === "string") {
    return value;
  }

  const fmt = format;

  // Date/time formats
  if (isDateFormat(fmt)) {
    return formatDate(numValue, fmt);
  }
  if (isTimeFormat(fmt)) {
    return formatDate(numValue, fmt);
  }

  // Scientific notation
  if (fmt.toUpperCase().includes("E+") || fmt.toUpperCase().includes("E-")) {
    const match = fmt.match(/([#0]*\.?[#0]*)E[+-]/i);
    const decimals = match?.[1]?.split(".")[1]?.length ?? 2;
    return numValue.toExponential(decimals).toUpperCase();
  }

  // Number pattern (handles $, %, #,##0, etc.)
  return formatNumberPattern(numValue, fmt);
}

/** Preset format strings for the dropdown */
export const NUMBER_FORMATS = {
  General: "General",
  Number: "#,##0.00",
  Currency: "$#,##0.00",
  Percent: "0.00%",
  Date: "yyyy-mm-dd",
  DateLong: "mmmm d, yyyy",
  Time: "hh:nn:ss",
  Time12: "h:nn:ss AM/PM",
  Scientific: "0.00E+0",
} as const;

export type NumberFormatKey = keyof typeof NUMBER_FORMATS;

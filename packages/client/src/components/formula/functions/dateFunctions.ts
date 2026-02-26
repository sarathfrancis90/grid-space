/**
 * Date functions: TODAY, NOW, DATE, YEAR, MONTH, DAY,
 * HOUR, MINUTE, SECOND, DATEDIF, EDATE, EOMONTH,
 * WEEKDAY, WEEKNUM, WORKDAY, NETWORKDAYS
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import { requireNumber, isFormulaError } from "./helpers";

/** Convert a serial date number to a JS Date (Excel epoch: Jan 0, 1900). */
function serialToDate(serial: number): Date {
  // Excel serial date: day 1 = Jan 1, 1900
  const epoch = new Date(1899, 11, 30); // Dec 30, 1899
  return new Date(epoch.getTime() + serial * 86400000);
}

/** Convert a JS Date to a serial date number. */
function dateToSerial(date: Date): number {
  const epoch = new Date(1899, 11, 30);
  return Math.round((date.getTime() - epoch.getTime()) / 86400000);
}

/** Parse a FormulaValue as a Date (accepts serial number or Date-like value). */
function toDate(val: FormulaValue): Date | null {
  if (typeof val === "number") return serialToDate(val);
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function fnTODAY(): FormulaValue {
  const now = new Date();
  return dateToSerial(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  );
}

function fnNOW(): FormulaValue {
  const now = new Date();
  const serial = dateToSerial(now);
  const fraction =
    (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
  return serial + fraction;
}

function fnDATE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const year = requireNumber(args[0]);
  if (isFormulaError(year)) return year;
  const month = requireNumber(args[1]);
  if (isFormulaError(month)) return month;
  const day = requireNumber(args[2]);
  if (isFormulaError(day)) return day;
  const d = new Date(year as number, (month as number) - 1, day as number);
  if ((year as number) < 100) d.setFullYear(year as number);
  return dateToSerial(d);
}

function fnYEAR(...args: FormulaValue[]): FormulaValue {
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  return d.getFullYear();
}

function fnMONTH(...args: FormulaValue[]): FormulaValue {
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  return d.getMonth() + 1;
}

function fnDAY(...args: FormulaValue[]): FormulaValue {
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  return d.getDate();
}

function fnHOUR(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const frac = (num as number) - Math.floor(num as number);
  return Math.floor(frac * 24);
}

function fnMINUTE(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const frac = (num as number) - Math.floor(num as number);
  return Math.floor((frac * 24 * 60) % 60);
}

function fnSECOND(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const frac = (num as number) - Math.floor(num as number);
  return Math.floor((frac * 24 * 60 * 60) % 60);
}

function fnDATEDIF(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const start = toDate(args[0]);
  const end = toDate(args[1]);
  if (!start || !end) return "#VALUE!" as FormulaError;
  const unit = String(args[2]).toUpperCase();

  if (start > end) return "#NUM!" as FormulaError;

  switch (unit) {
    case "Y":
      return (
        end.getFullYear() -
        start.getFullYear() -
        (end.getMonth() < start.getMonth() ||
        (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
          ? 1
          : 0)
      );
    case "M": {
      let months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      if (end.getDate() < start.getDate()) months--;
      return months;
    }
    case "D":
      return Math.floor((end.getTime() - start.getTime()) / 86400000);
    default:
      return "#NUM!" as FormulaError;
  }
}

function fnEDATE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  const months = requireNumber(args[1]);
  if (isFormulaError(months)) return months;
  const result = new Date(d);
  result.setMonth(result.getMonth() + (months as number));
  return dateToSerial(result);
}

function fnEOMONTH(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  const months = requireNumber(args[1]);
  if (isFormulaError(months)) return months;
  const result = new Date(
    d.getFullYear(),
    d.getMonth() + (months as number) + 1,
    0,
  );
  return dateToSerial(result);
}

function fnWEEKDAY(...args: FormulaValue[]): FormulaValue {
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  const returnType = args.length > 1 ? requireNumber(args[1]) : 1;
  if (isFormulaError(returnType)) return returnType;
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (returnType === 1) return day + 1; // 1=Sun, 7=Sat
  if (returnType === 2) return day === 0 ? 7 : day; // 1=Mon, 7=Sun
  if (returnType === 3) return day === 0 ? 6 : day - 1; // 0=Mon, 6=Sun
  return "#NUM!" as FormulaError;
}

function fnWEEKNUM(...args: FormulaValue[]): FormulaValue {
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function fnWORKDAY(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  const days = requireNumber(args[1]);
  if (isFormulaError(days)) return days;
  let remaining = Math.abs(days as number);
  const direction = (days as number) >= 0 ? 1 : -1;
  const current = new Date(d);
  while (remaining > 0) {
    current.setDate(current.getDate() + direction);
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return dateToSerial(current);
}

function fnNETWORKDAYS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const startD = toDate(args[0]);
  const endD = toDate(args[1]);
  if (!startD || !endD) return "#VALUE!" as FormulaError;
  let count = 0;
  const direction = endD >= startD ? 1 : -1;
  const current = new Date(startD);
  while (direction > 0 ? current <= endD : current >= endD) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
    current.setDate(current.getDate() + direction);
  }
  return direction > 0 ? count : -count;
}

export const dateFunctions: Record<string, FormulaFunction> = {
  TODAY: fnTODAY,
  NOW: fnNOW,
  DATE: fnDATE,
  YEAR: fnYEAR,
  MONTH: fnMONTH,
  DAY: fnDAY,
  HOUR: fnHOUR,
  MINUTE: fnMINUTE,
  SECOND: fnSECOND,
  DATEDIF: fnDATEDIF,
  EDATE: fnEDATE,
  EOMONTH: fnEOMONTH,
  WEEKDAY: fnWEEKDAY,
  WEEKNUM: fnWEEKNUM,
  WORKDAY: fnWORKDAY,
  NETWORKDAYS: fnNETWORKDAYS,
};

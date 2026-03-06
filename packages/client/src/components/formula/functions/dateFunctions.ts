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

function fnDATEVALUE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const str = String(args[0]);
  const d = new Date(str);
  if (isNaN(d.getTime())) return "#VALUE!" as FormulaError;
  return dateToSerial(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
}

function fnTIMEVALUE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const str = String(args[0]);
  // Try parsing as a time string (e.g., "12:30:00", "2:30 PM")
  const d = new Date(`1970-01-01T${str}`);
  if (!isNaN(d.getTime())) {
    return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
  }
  // Try full date-time string and extract time portion
  const d2 = new Date(str);
  if (!isNaN(d2.getTime())) {
    return (
      (d2.getHours() * 3600 + d2.getMinutes() * 60 + d2.getSeconds()) / 86400
    );
  }
  return "#VALUE!" as FormulaError;
}

function fnTIME(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const hour = requireNumber(args[0]);
  if (isFormulaError(hour)) return hour;
  const minute = requireNumber(args[1]);
  if (isFormulaError(minute)) return minute;
  const second = requireNumber(args[2]);
  if (isFormulaError(second)) return second;
  const totalSeconds =
    (hour as number) * 3600 + (minute as number) * 60 + (second as number);
  if (totalSeconds < 0) return "#NUM!" as FormulaError;
  return totalSeconds / 86400;
}

function fnDAYS(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const endD = toDate(args[0]);
  const startD = toDate(args[1]);
  if (!endD || !startD) return "#VALUE!" as FormulaError;
  return Math.round((endD.getTime() - startD.getTime()) / 86400000);
}

function fnDAYS360(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const startD = toDate(args[0]);
  const endD = toDate(args[1]);
  if (!startD || !endD) return "#VALUE!" as FormulaError;
  const method = args.length > 2 ? Boolean(args[2]) : false;

  let startDay = startD.getDate();
  let startMonth = startD.getMonth() + 1;
  let startYear = startD.getFullYear();
  let endDay = endD.getDate();
  let endMonth = endD.getMonth() + 1;
  let endYear = endD.getFullYear();

  if (method) {
    // European method: clamp days to 30
    if (startDay === 31) startDay = 30;
    if (endDay === 31) endDay = 30;
  } else {
    // US/NASD method
    if (startDay === 31) startDay = 30;
    if (endDay === 31 && startDay >= 30) endDay = 30;
  }

  return (
    (endYear - startYear) * 360 +
    (endMonth - startMonth) * 30 +
    (endDay - startDay)
  );
}

function fnISOWEEKNUM(...args: FormulaValue[]): FormulaValue {
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  // ISO week: week 1 contains the first Thursday of the year
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const jan4 = new Date(target.getFullYear(), 0, 4);
  jan4.setDate(jan4.getDate() + 3 - ((jan4.getDay() + 6) % 7));
  const diff = target.getTime() - jan4.getTime();
  return 1 + Math.round(diff / (7 * 86400000));
}

function fnYEARFRAC(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const startD = toDate(args[0]);
  const endD = toDate(args[1]);
  if (!startD || !endD) return "#VALUE!" as FormulaError;
  const basis = args.length > 2 ? requireNumber(args[2]) : 0;
  if (isFormulaError(basis)) return basis;

  const sy = startD.getFullYear();
  const sm = startD.getMonth();
  const sd = startD.getDate();
  const ey = endD.getFullYear();
  const em = endD.getMonth();
  const ed = endD.getDate();

  const daysDiff = Math.abs(
    Math.round((endD.getTime() - startD.getTime()) / 86400000),
  );

  switch (basis as number) {
    case 0: {
      // US (NASD) 30/360
      let d1 = sd;
      let d2 = ed;
      if (d1 === 31) d1 = 30;
      if (d2 === 31 && d1 >= 30) d2 = 30;
      const days360 = (ey - sy) * 360 + (em - sm) * 30 + (d2 - d1);
      return Math.abs(days360) / 360;
    }
    case 1:
      // Actual/actual
      if (sy === ey) return daysDiff / daysInYear(sy);
      else {
        const totalYears = ey - sy + 1;
        let totalDays = 0;
        for (let y = sy; y <= ey; y++) totalDays += daysInYear(y);
        const avgDays = totalDays / totalYears;
        return daysDiff / avgDays;
      }
    case 2:
      // Actual/360
      return daysDiff / 360;
    case 3:
      // Actual/365
      return daysDiff / 365;
    case 4: {
      // European 30/360
      let d1e = sd;
      let d2e = ed;
      if (d1e === 31) d1e = 30;
      if (d2e === 31) d2e = 30;
      const days360e = (ey - sy) * 360 + (em - sm) * 30 + (d2e - d1e);
      return Math.abs(days360e) / 360;
    }
    default:
      return "#NUM!" as FormulaError;
  }
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/** Parse weekend parameter for INTL functions. Returns set of day-of-week (0=Sun). */
function parseWeekend(weekend: FormulaValue | undefined): Set<number> | null {
  if (weekend === undefined || weekend === null) return new Set([0, 6]);
  if (typeof weekend === "number") {
    const weekendMap: Record<number, number[]> = {
      1: [0, 6],
      2: [0, 1],
      3: [1, 2],
      4: [2, 3],
      5: [3, 4],
      6: [4, 5],
      7: [5, 6],
      11: [0],
      12: [1],
      13: [2],
      14: [3],
      15: [4],
      16: [5],
      17: [6],
    };
    const mapping = weekendMap[weekend];
    if (!mapping) return null;
    return new Set(mapping);
  }
  if (typeof weekend === "string" && weekend.length === 7) {
    const days = new Set<number>();
    for (let i = 0; i < 7; i++) {
      if (weekend[i] === "1") days.add((i + 1) % 7); // string is Mon-Sun, getDay is Sun=0
    }
    if (days.size === 7) return null; // all days are weekends
    return days;
  }
  return null;
}

/** Parse holidays array from args (flat list of date values). */
function parseHolidays(args: FormulaValue[], startIdx: number): Set<number> {
  const holidays = new Set<number>();
  for (let i = startIdx; i < args.length; i++) {
    const val = args[i];
    if (Array.isArray(val)) {
      for (const item of val as FormulaValue[]) {
        const d = toDate(item as FormulaValue);
        if (d) holidays.add(dateToSerial(d));
      }
    } else {
      const d = toDate(val);
      if (d) holidays.add(dateToSerial(d));
    }
  }
  return holidays;
}

function fnWORKDAY_INTL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const d = toDate(args[0]);
  if (!d) return "#VALUE!" as FormulaError;
  const days = requireNumber(args[1]);
  if (isFormulaError(days)) return days;
  const weekendDays = parseWeekend(args[2]);
  if (!weekendDays) return "#VALUE!" as FormulaError;
  const holidays = parseHolidays(args, 3);

  let remaining = Math.abs(days as number);
  const direction = (days as number) >= 0 ? 1 : -1;
  const current = new Date(d);
  while (remaining > 0) {
    current.setDate(current.getDate() + direction);
    const dow = current.getDay();
    const serial = dateToSerial(current);
    if (!weekendDays.has(dow) && !holidays.has(serial)) remaining--;
  }
  return dateToSerial(current);
}

function fnNETWORKDAYS_INTL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const startD = toDate(args[0]);
  const endD = toDate(args[1]);
  if (!startD || !endD) return "#VALUE!" as FormulaError;
  const weekendDays = parseWeekend(args[2]);
  if (!weekendDays) return "#VALUE!" as FormulaError;
  const holidays = parseHolidays(args, 3);

  let count = 0;
  const direction = endD >= startD ? 1 : -1;
  const current = new Date(startD);
  while (direction > 0 ? current <= endD : current >= endD) {
    const dow = current.getDay();
    const serial = dateToSerial(current);
    if (!weekendDays.has(dow) && !holidays.has(serial)) count++;
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
  DATEVALUE: fnDATEVALUE,
  TIMEVALUE: fnTIMEVALUE,
  TIME: fnTIME,
  DAYS: fnDAYS,
  DAYS360: fnDAYS360,
  ISOWEEKNUM: fnISOWEEKNUM,
  YEARFRAC: fnYEARFRAC,
  "WORKDAY.INTL": fnWORKDAY_INTL,
  "NETWORKDAYS.INTL": fnNETWORKDAYS_INTL,
};

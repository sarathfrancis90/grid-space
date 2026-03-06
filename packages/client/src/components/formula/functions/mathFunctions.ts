/**
 * Math functions: ROUND, ROUNDUP, ROUNDDOWN, ABS, SQRT, POWER, MOD,
 * CEILING, FLOOR, LOG, LOG10, EXP, PI, RAND, RANDBETWEEN,
 * SUMPRODUCT, PRODUCT, INT, TRUNC, SIGN, SUBTOTAL,
 * EVEN, ODD, FACT, COMBIN, PERMUT, GCD, LCM, MROUND, QUOTIENT,
 * SIN, COS, TAN, ASIN, ACOS, ATAN, ATAN2, RADIANS, DEGREES, LN,
 * SINH, COSH, TANH, SQRTPI, MULTINOMIAL, SERIESSUM, SUMSQ
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import {
  requireNumber,
  isFormulaError,
  flattenArgs,
  toNumber,
} from "./helpers";

function fnROUND(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const digits = args.length > 1 ? requireNumber(args[1]) : 0;
  if (isFormulaError(digits)) return digits;
  const factor = Math.pow(10, digits as number);
  return Math.round((num as number) * factor) / factor;
}

function fnROUNDUP(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const digits = args.length > 1 ? requireNumber(args[1]) : 0;
  if (isFormulaError(digits)) return digits;
  const factor = Math.pow(10, digits as number);
  const sign = (num as number) >= 0 ? 1 : -1;
  return (sign * Math.ceil(Math.abs(num as number) * factor)) / factor;
}

function fnROUNDDOWN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const digits = args.length > 1 ? requireNumber(args[1]) : 0;
  if (isFormulaError(digits)) return digits;
  const factor = Math.pow(10, digits as number);
  const sign = (num as number) >= 0 ? 1 : -1;
  return (sign * Math.floor(Math.abs(num as number) * factor)) / factor;
}

function fnABS(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.abs(num as number);
}

function fnSQRT(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  if ((num as number) < 0) return "#NUM!" as FormulaError;
  return Math.sqrt(num as number);
}

function fnPOWER(...args: FormulaValue[]): FormulaValue {
  const base = requireNumber(args[0]);
  if (isFormulaError(base)) return base;
  const exp = requireNumber(args[1]);
  if (isFormulaError(exp)) return exp;
  return Math.pow(base as number, exp as number);
}

function fnMOD(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const divisor = requireNumber(args[1]);
  if (isFormulaError(divisor)) return divisor;
  if ((divisor as number) === 0) return "#DIV/0!" as FormulaError;
  // Google Sheets MOD: result has same sign as divisor
  const result =
    (((num as number) % (divisor as number)) + (divisor as number)) %
    (divisor as number);
  return result;
}

function fnCEILING(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const significance = args.length > 1 ? requireNumber(args[1]) : 1;
  if (isFormulaError(significance)) return significance;
  if ((significance as number) === 0) return 0;
  return (
    Math.ceil((num as number) / (significance as number)) *
    (significance as number)
  );
}

function fnFLOOR(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const significance = args.length > 1 ? requireNumber(args[1]) : 1;
  if (isFormulaError(significance)) return significance;
  if ((significance as number) === 0) return 0;
  return (
    Math.floor((num as number) / (significance as number)) *
    (significance as number)
  );
}

function fnLOG(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  if ((num as number) <= 0) return "#NUM!" as FormulaError;
  const base = args.length > 1 ? requireNumber(args[1]) : 10;
  if (isFormulaError(base)) return base;
  if ((base as number) <= 0 || (base as number) === 1)
    return "#NUM!" as FormulaError;
  return Math.log(num as number) / Math.log(base as number);
}

function fnLOG10(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  if ((num as number) <= 0) return "#NUM!" as FormulaError;
  return Math.log10(num as number);
}

function fnEXP(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.exp(num as number);
}

function fnPI(): FormulaValue {
  return Math.PI;
}

function fnRAND(): FormulaValue {
  return Math.random();
}

function fnRANDBETWEEN(...args: FormulaValue[]): FormulaValue {
  const low = requireNumber(args[0]);
  if (isFormulaError(low)) return low;
  const high = requireNumber(args[1]);
  if (isFormulaError(high)) return high;
  if ((low as number) > (high as number)) return "#NUM!" as FormulaError;
  const lo = Math.ceil(low as number);
  const hi = Math.floor(high as number);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

// --- P0/P1 functions ---

function fnSUMPRODUCT(...args: FormulaValue[]): FormulaValue {
  if (args.length === 0) return "#VALUE!" as FormulaError;
  // Each arg should be an array (range). Flatten 2D arrays to 1D.
  const arrays: number[][] = [];
  for (const arg of args) {
    const flat = flattenArgs(
      Array.isArray(arg) ? (arg as FormulaValue[]) : [arg],
    );
    const nums: number[] = [];
    for (const v of flat) {
      if (isFormulaError(v)) return v;
      const n = toNumber(v, true);
      nums.push(n ?? 0);
    }
    arrays.push(nums);
  }
  // All arrays must be the same length
  const len = arrays[0].length;
  for (const arr of arrays) {
    if (arr.length !== len) return "#VALUE!" as FormulaError;
  }
  let sum = 0;
  for (let i = 0; i < len; i++) {
    let product = 1;
    for (const arr of arrays) {
      product *= arr[i];
    }
    sum += product;
  }
  return sum;
}

function fnPRODUCT(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let product = 1;
  let found = false;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = toNumber(val, false);
    if (n !== null) {
      product *= n;
      found = true;
    }
  }
  return found ? product : 0;
}

function fnINT(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.floor(num as number);
}

function fnTRUNC(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const digits = args.length > 1 ? requireNumber(args[1]) : 0;
  if (isFormulaError(digits)) return digits;
  const factor = Math.pow(10, digits as number);
  return Math.trunc((num as number) * factor) / factor;
}

function fnSIGN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.sign(num as number);
}

function fnSUBTOTAL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const fnNum = requireNumber(args[0]);
  if (isFormulaError(fnNum)) return fnNum;
  const code = fnNum as number;
  const data = args.slice(1);
  const flat = flattenArgs(data);

  // Function codes 1-11 (include hidden) and 101-111 (exclude hidden)
  // Since we don't track hidden rows, both behave the same
  const baseCode = code > 100 ? code - 100 : code;

  switch (baseCode) {
    case 1: {
      // AVERAGE
      let sum = 0;
      let count = 0;
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) {
          sum += n;
          count++;
        }
      }
      return count === 0 ? ("#DIV/0!" as FormulaError) : sum / count;
    }
    case 2: {
      // COUNT
      let count = 0;
      for (const v of flat) {
        if (typeof v === "number") count++;
        else if (
          typeof v === "string" &&
          !isFormulaError(v) &&
          v !== "" &&
          !isNaN(Number(v))
        )
          count++;
      }
      return count;
    }
    case 3: {
      // COUNTA
      let count = 0;
      for (const v of flat) {
        if (v !== null && v !== "") count++;
      }
      return count;
    }
    case 4: {
      // MAX
      let max = -Infinity;
      let found = false;
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) {
          if (n > max) max = n;
          found = true;
        }
      }
      return found ? max : 0;
    }
    case 5: {
      // MIN
      let min = Infinity;
      let found = false;
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) {
          if (n < min) min = n;
          found = true;
        }
      }
      return found ? min : 0;
    }
    case 6: {
      // PRODUCT
      let product = 1;
      let found = false;
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) {
          product *= n;
          found = true;
        }
      }
      return found ? product : 0;
    }
    case 7: {
      // STDEV
      const nums: number[] = [];
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) nums.push(n);
      }
      if (nums.length < 2) return "#DIV/0!" as FormulaError;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance =
        nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length - 1);
      return Math.sqrt(variance);
    }
    case 8: {
      // STDEVP
      const nums: number[] = [];
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) nums.push(n);
      }
      if (nums.length === 0) return "#DIV/0!" as FormulaError;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance =
        nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
      return Math.sqrt(variance);
    }
    case 9: {
      // SUM
      let sum = 0;
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v);
        if (n !== null) sum += n;
      }
      return sum;
    }
    case 10: {
      // VAR
      const nums: number[] = [];
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) nums.push(n);
      }
      if (nums.length < 2) return "#DIV/0!" as FormulaError;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length - 1);
    }
    case 11: {
      // VARP
      const nums: number[] = [];
      for (const v of flat) {
        if (isFormulaError(v)) return v;
        const n = toNumber(v, false);
        if (n !== null) nums.push(n);
      }
      if (nums.length === 0) return "#DIV/0!" as FormulaError;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
    }
    default:
      return "#VALUE!" as FormulaError;
  }
}

// --- P2 functions ---

function fnEVEN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const n = num as number;
  const sign = n >= 0 ? 1 : -1;
  const ceil = Math.ceil(Math.abs(n));
  return sign * (ceil % 2 === 0 ? ceil : ceil + 1);
}

function fnODD(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const n = num as number;
  if (n === 0) return 1;
  const sign = n >= 0 ? 1 : -1;
  const ceil = Math.ceil(Math.abs(n));
  return sign * (ceil % 2 === 1 ? ceil : ceil + 1);
}

function fnFACT(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const n = Math.floor(num as number);
  if (n < 0) return "#NUM!" as FormulaError;
  if (n === 0) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function fnCOMBIN(...args: FormulaValue[]): FormulaValue {
  const nVal = requireNumber(args[0]);
  if (isFormulaError(nVal)) return nVal;
  const kVal = requireNumber(args[1]);
  if (isFormulaError(kVal)) return kVal;
  const n = Math.floor(nVal as number);
  const k = Math.floor(kVal as number);
  if (n < 0 || k < 0 || k > n) return "#NUM!" as FormulaError;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

function fnPERMUT(...args: FormulaValue[]): FormulaValue {
  const nVal = requireNumber(args[0]);
  if (isFormulaError(nVal)) return nVal;
  const kVal = requireNumber(args[1]);
  if (isFormulaError(kVal)) return kVal;
  const n = Math.floor(nVal as number);
  const k = Math.floor(kVal as number);
  if (n < 0 || k < 0 || k > n) return "#NUM!" as FormulaError;
  let result = 1;
  for (let i = 0; i < k; i++) result *= n - i;
  return result;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function fnGCD(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let result = 0;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = requireNumber(val);
    if (isFormulaError(n)) return n;
    if ((n as number) < 0) return "#NUM!" as FormulaError;
    result = gcd(result, Math.floor(n as number));
  }
  return result;
}

function fnLCM(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let result = 1;
  let found = false;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = requireNumber(val);
    if (isFormulaError(n)) return n;
    if ((n as number) < 0) return "#NUM!" as FormulaError;
    const intN = Math.floor(n as number);
    if (intN === 0) return 0;
    result = (result * intN) / gcd(result, intN);
    found = true;
  }
  return found ? result : 0;
}

function fnMROUND(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const multiple = requireNumber(args[1]);
  if (isFormulaError(multiple)) return multiple;
  if ((multiple as number) === 0) return 0;
  if ((num as number) > 0 && (multiple as number) < 0)
    return "#NUM!" as FormulaError;
  if ((num as number) < 0 && (multiple as number) > 0)
    return "#NUM!" as FormulaError;
  return (
    Math.round((num as number) / (multiple as number)) * (multiple as number)
  );
}

function fnQUOTIENT(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  const divisor = requireNumber(args[1]);
  if (isFormulaError(divisor)) return divisor;
  if ((divisor as number) === 0) return "#DIV/0!" as FormulaError;
  return Math.trunc((num as number) / (divisor as number));
}

// Trig functions
function fnSIN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.sin(num as number);
}

function fnCOS(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.cos(num as number);
}

function fnTAN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.tan(num as number);
}

function fnASIN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  if ((num as number) < -1 || (num as number) > 1)
    return "#NUM!" as FormulaError;
  return Math.asin(num as number);
}

function fnACOS(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  if ((num as number) < -1 || (num as number) > 1)
    return "#NUM!" as FormulaError;
  return Math.acos(num as number);
}

function fnATAN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.atan(num as number);
}

function fnATAN2(...args: FormulaValue[]): FormulaValue {
  const x = requireNumber(args[0]);
  if (isFormulaError(x)) return x;
  const y = requireNumber(args[1]);
  if (isFormulaError(y)) return y;
  if ((x as number) === 0 && (y as number) === 0)
    return "#DIV/0!" as FormulaError;
  return Math.atan2(y as number, x as number);
}

function fnRADIANS(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return ((num as number) * Math.PI) / 180;
}

function fnDEGREES(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return ((num as number) * 180) / Math.PI;
}

function fnLN(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  if ((num as number) <= 0) return "#NUM!" as FormulaError;
  return Math.log(num as number);
}

// --- P3 functions ---

function fnSINH(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.sinh(num as number);
}

function fnCOSH(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.cosh(num as number);
}

function fnTANH(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  return Math.tanh(num as number);
}

function fnSQRTPI(...args: FormulaValue[]): FormulaValue {
  const num = requireNumber(args[0]);
  if (isFormulaError(num)) return num;
  if ((num as number) < 0) return "#NUM!" as FormulaError;
  return Math.sqrt((num as number) * Math.PI);
}

function fnMULTINOMIAL(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let sum = 0;
  let numerator = 1;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = requireNumber(val);
    if (isFormulaError(n)) return n;
    const intN = Math.floor(n as number);
    if (intN < 0) return "#NUM!" as FormulaError;
    sum += intN;
    let denom = 1;
    for (let i = 2; i <= intN; i++) denom *= i;
    numerator *= denom;
  }
  let totalFact = 1;
  for (let i = 2; i <= sum; i++) totalFact *= i;
  return totalFact / numerator;
}

function fnSERIESSUM(...args: FormulaValue[]): FormulaValue {
  if (args.length < 4) return "#VALUE!" as FormulaError;
  const x = requireNumber(args[0]);
  if (isFormulaError(x)) return x;
  const n = requireNumber(args[1]);
  if (isFormulaError(n)) return n;
  const m = requireNumber(args[2]);
  if (isFormulaError(m)) return m;
  const coeffs = flattenArgs(
    Array.isArray(args[3]) ? (args[3] as FormulaValue[]) : [args[3]],
  );
  let sum = 0;
  for (let i = 0; i < coeffs.length; i++) {
    const c = requireNumber(coeffs[i]);
    if (isFormulaError(c)) return c;
    sum +=
      (c as number) * Math.pow(x as number, (n as number) + i * (m as number));
  }
  return sum;
}

function fnSUMSQ(...args: FormulaValue[]): FormulaValue {
  const flat = flattenArgs(args);
  let sum = 0;
  for (const val of flat) {
    if (isFormulaError(val)) return val;
    const n = toNumber(val, false);
    if (n !== null) sum += n * n;
  }
  return sum;
}

export const mathFunctions: Record<string, FormulaFunction> = {
  ROUND: fnROUND,
  ROUNDUP: fnROUNDUP,
  ROUNDDOWN: fnROUNDDOWN,
  ABS: fnABS,
  SQRT: fnSQRT,
  POWER: fnPOWER,
  MOD: fnMOD,
  CEILING: fnCEILING,
  FLOOR: fnFLOOR,
  LOG: fnLOG,
  LOG10: fnLOG10,
  EXP: fnEXP,
  PI: fnPI,
  RAND: fnRAND,
  RANDBETWEEN: fnRANDBETWEEN,
  // P0/P1
  SUMPRODUCT: fnSUMPRODUCT,
  PRODUCT: fnPRODUCT,
  INT: fnINT,
  TRUNC: fnTRUNC,
  SIGN: fnSIGN,
  SUBTOTAL: fnSUBTOTAL,
  // P2
  EVEN: fnEVEN,
  ODD: fnODD,
  FACT: fnFACT,
  COMBIN: fnCOMBIN,
  PERMUT: fnPERMUT,
  GCD: fnGCD,
  LCM: fnLCM,
  MROUND: fnMROUND,
  QUOTIENT: fnQUOTIENT,
  SIN: fnSIN,
  COS: fnCOS,
  TAN: fnTAN,
  ASIN: fnASIN,
  ACOS: fnACOS,
  ATAN: fnATAN,
  ATAN2: fnATAN2,
  RADIANS: fnRADIANS,
  DEGREES: fnDEGREES,
  LN: fnLN,
  // P3
  SINH: fnSINH,
  COSH: fnCOSH,
  TANH: fnTANH,
  SQRTPI: fnSQRTPI,
  MULTINOMIAL: fnMULTINOMIAL,
  SERIESSUM: fnSERIESSUM,
  SUMSQ: fnSUMSQ,
};

/**
 * Math functions: ROUND, ROUNDUP, ROUNDDOWN, ABS, SQRT, POWER, MOD,
 * CEILING, FLOOR, LOG, LOG10, EXP, PI, RAND, RANDBETWEEN
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import { requireNumber, isFormulaError } from "./helpers";

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
};

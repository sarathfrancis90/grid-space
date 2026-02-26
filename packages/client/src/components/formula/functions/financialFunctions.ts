/**
 * Financial functions: PMT, FV, PV, NPV, IRR, RATE, NPER
 */
import type { FormulaValue } from "../../../types/formula";
import type { FormulaFunction, FormulaError } from "./helpers";
import {
  requireNumber,
  flattenArgs,
  toNumber,
  isFormulaError,
} from "./helpers";

function fnPMT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const nper = requireNumber(args[1]);
  if (isFormulaError(nper)) return nper;
  const pv = requireNumber(args[2]);
  if (isFormulaError(pv)) return pv;
  const fv = args.length > 3 ? requireNumber(args[3]) : 0;
  if (isFormulaError(fv)) return fv;
  const type = args.length > 4 ? requireNumber(args[4]) : 0;
  if (isFormulaError(type)) return type;

  const r = rate as number;
  const n = nper as number;
  const p = pv as number;
  const f = fv as number;
  const t = type as number;

  if (r === 0) {
    return -(p + f) / n;
  }

  const pow = Math.pow(1 + r, n);
  return -(r * (p * pow + f)) / ((1 + r * t) * (pow - 1));
}

function fnFV(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const nper = requireNumber(args[1]);
  if (isFormulaError(nper)) return nper;
  const pmt = requireNumber(args[2]);
  if (isFormulaError(pmt)) return pmt;
  const pv = args.length > 3 ? requireNumber(args[3]) : 0;
  if (isFormulaError(pv)) return pv;
  const type = args.length > 4 ? requireNumber(args[4]) : 0;
  if (isFormulaError(type)) return type;

  const r = rate as number;
  const n = nper as number;
  const p = pmt as number;
  const v = pv as number;
  const t = type as number;

  if (r === 0) {
    return -(v + p * n);
  }

  const pow = Math.pow(1 + r, n);
  return -(v * pow + (p * (1 + r * t) * (pow - 1)) / r);
}

function fnPV(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const nper = requireNumber(args[1]);
  if (isFormulaError(nper)) return nper;
  const pmt = requireNumber(args[2]);
  if (isFormulaError(pmt)) return pmt;
  const fv = args.length > 3 ? requireNumber(args[3]) : 0;
  if (isFormulaError(fv)) return fv;
  const type = args.length > 4 ? requireNumber(args[4]) : 0;
  if (isFormulaError(type)) return type;

  const r = rate as number;
  const n = nper as number;
  const p = pmt as number;
  const f = fv as number;
  const t = type as number;

  if (r === 0) {
    return -(f + p * n);
  }

  const pow = Math.pow(1 + r, n);
  return -(f / pow + (p * (1 + r * t) * (pow - 1)) / (r * pow));
}

function fnNPV(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const cashflows = flattenArgs(args.slice(1));

  const r = rate as number;
  let npv = 0;
  for (let i = 0; i < cashflows.length; i++) {
    const cf = toNumber(cashflows[i]);
    if (cf !== null) {
      npv += cf / Math.pow(1 + r, i + 1);
    }
  }
  return npv;
}

function fnIRR(...args: FormulaValue[]): FormulaValue {
  if (args.length < 1) return "#VALUE!" as FormulaError;
  const cashflows = flattenArgs([args[0]]).map((v) => toNumber(v) ?? 0);
  let guess = args.length > 1 ? requireNumber(args[1]) : 0.1;
  if (isFormulaError(guess)) return guess;

  let rate = guess as number;
  // Newton-Raphson method
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let i = 0; i < cashflows.length; i++) {
      const pow = Math.pow(1 + rate, i);
      npv += cashflows[i] / pow;
      dnpv -= (i * cashflows[i]) / (pow * (1 + rate));
    }
    if (Math.abs(npv) < 1e-10) return rate;
    if (dnpv === 0) return "#NUM!" as FormulaError;
    rate = rate - npv / dnpv;
  }
  return "#NUM!" as FormulaError;
}

function fnRATE(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const nper = requireNumber(args[0]);
  if (isFormulaError(nper)) return nper;
  const pmt = requireNumber(args[1]);
  if (isFormulaError(pmt)) return pmt;
  const pv = requireNumber(args[2]);
  if (isFormulaError(pv)) return pv;
  const fv = args.length > 3 ? requireNumber(args[3]) : 0;
  if (isFormulaError(fv)) return fv;
  let guess = args.length > 5 ? requireNumber(args[5]) : 0.1;
  if (isFormulaError(guess)) return guess;

  const n = nper as number;
  const p = pmt as number;
  const v = pv as number;
  const f = fv as number;
  let rate = guess as number;

  for (let iter = 0; iter < 100; iter++) {
    const pow = Math.pow(1 + rate, n);
    const y = v * pow + (p * (pow - 1)) / rate + f;
    const dy =
      v * n * Math.pow(1 + rate, n - 1) +
      p * ((n * Math.pow(1 + rate, n - 1) * rate - (pow - 1)) / (rate * rate));
    if (Math.abs(y) < 1e-10) return rate;
    if (dy === 0) return "#NUM!" as FormulaError;
    rate = rate - y / dy;
  }
  return "#NUM!" as FormulaError;
}

function fnNPER(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const pmt = requireNumber(args[1]);
  if (isFormulaError(pmt)) return pmt;
  const pv = requireNumber(args[2]);
  if (isFormulaError(pv)) return pv;
  const fv = args.length > 3 ? requireNumber(args[3]) : 0;
  if (isFormulaError(fv)) return fv;

  const r = rate as number;
  const p = pmt as number;
  const v = pv as number;
  const f = fv as number;

  if (r === 0) {
    if (p === 0) return "#NUM!" as FormulaError;
    return -(v + f) / p;
  }

  const num = p - f * r;
  const den = v * r + p;
  if (num / den <= 0) return "#NUM!" as FormulaError;
  return Math.log(num / den) / Math.log(1 + r);
}

export const financialFunctions: Record<string, FormulaFunction> = {
  PMT: fnPMT,
  FV: fnFV,
  PV: fnPV,
  NPV: fnNPV,
  IRR: fnIRR,
  RATE: fnRATE,
  NPER: fnNPER,
};

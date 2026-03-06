/**
 * Financial functions: PMT, FV, PV, NPV, IRR, RATE, NPER,
 * PPMT, IPMT, CUMPRINC, CUMIPMT, XNPV, XIRR, MIRR,
 * SLN, SYD, DB, DDB, EFFECT, NOMINAL
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

/** Helper: compute PMT value (reused by PPMT/IPMT/CUMPRINC/CUMIPMT) */
function computePMT(
  r: number,
  n: number,
  pv: number,
  fv: number,
  t: number,
): number {
  if (r === 0) {
    return -(pv + fv) / n;
  }
  const pow = Math.pow(1 + r, n);
  return -(r * (pv * pow + fv)) / ((1 + r * t) * (pow - 1));
}

function fnIPMT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 4) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const per = requireNumber(args[1]);
  if (isFormulaError(per)) return per;
  const nper = requireNumber(args[2]);
  if (isFormulaError(nper)) return nper;
  const pv = requireNumber(args[3]);
  if (isFormulaError(pv)) return pv;
  const fv = args.length > 4 ? requireNumber(args[4]) : 0;
  if (isFormulaError(fv)) return fv;
  const type = args.length > 5 ? requireNumber(args[5]) : 0;
  if (isFormulaError(type)) return type;

  const r = rate as number;
  const p = per as number;
  const n = nper as number;
  const v = pv as number;
  const f = fv as number;
  const t = type as number;

  if (p < 1 || p > n) return "#NUM!" as FormulaError;

  const pmt = computePMT(r, n, v, f, t);

  if (r === 0) return 0;

  let ipmt: number;
  if (t === 0) {
    // IPMT = FV(rate, per-1, pmt, pv, 0) * rate
    // FV(r, n, pmt, pv, 0) = -(pv*(1+r)^n + pmt*((1+r)^n-1)/r)
    const fvPrev = -(
      v * Math.pow(1 + r, p - 1) +
      (pmt * (Math.pow(1 + r, p - 1) - 1)) / r
    );
    ipmt = fvPrev * r;
  } else {
    // Beginning of period
    if (p === 1) return 0;
    // IPMT = FV(rate, per-2, pmt, pv, 1) * rate
    // FV(r, n, pmt, pv, 1) = -(pv*(1+r)^n + pmt*(1+r)*((1+r)^n-1)/r)
    const fvPrev = -(
      v * Math.pow(1 + r, p - 2) +
      (pmt * (1 + r) * (Math.pow(1 + r, p - 2) - 1)) / r
    );
    ipmt = fvPrev * r;
  }
  return ipmt;
}

function fnPPMT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 4) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const per = requireNumber(args[1]);
  if (isFormulaError(per)) return per;
  const nper = requireNumber(args[2]);
  if (isFormulaError(nper)) return nper;
  const pv = requireNumber(args[3]);
  if (isFormulaError(pv)) return pv;
  const fv = args.length > 4 ? requireNumber(args[4]) : 0;
  if (isFormulaError(fv)) return fv;
  const type = args.length > 5 ? requireNumber(args[5]) : 0;
  if (isFormulaError(type)) return type;

  const r = rate as number;
  const p = per as number;
  const n = nper as number;
  const v = pv as number;
  const f = fv as number;
  const t = type as number;

  if (p < 1 || p > n) return "#NUM!" as FormulaError;

  const pmt = computePMT(r, n, v, f, t);
  const ipmt = fnIPMT(r, p, n, v, f, t);
  if (isFormulaError(ipmt)) return ipmt;

  return pmt - (ipmt as number);
}

function fnCUMIPMT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 6) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const nper = requireNumber(args[1]);
  if (isFormulaError(nper)) return nper;
  const pv = requireNumber(args[2]);
  if (isFormulaError(pv)) return pv;
  const startPeriod = requireNumber(args[3]);
  if (isFormulaError(startPeriod)) return startPeriod;
  const endPeriod = requireNumber(args[4]);
  if (isFormulaError(endPeriod)) return endPeriod;
  const type = requireNumber(args[5]);
  if (isFormulaError(type)) return type;

  const r = rate as number;
  const n = nper as number;
  const v = pv as number;
  const sp = startPeriod as number;
  const ep = endPeriod as number;
  const t = type as number;

  if (
    r <= 0 ||
    n <= 0 ||
    v <= 0 ||
    sp < 1 ||
    ep < 1 ||
    sp > ep ||
    (t !== 0 && t !== 1)
  ) {
    return "#NUM!" as FormulaError;
  }

  let cumipmt = 0;
  for (let per = sp; per <= ep; per++) {
    const ipmt = fnIPMT(r, per, n, v, 0, t);
    if (isFormulaError(ipmt)) return ipmt;
    cumipmt += ipmt as number;
  }
  return cumipmt;
}

function fnCUMPRINC(...args: FormulaValue[]): FormulaValue {
  if (args.length < 6) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const nper = requireNumber(args[1]);
  if (isFormulaError(nper)) return nper;
  const pv = requireNumber(args[2]);
  if (isFormulaError(pv)) return pv;
  const startPeriod = requireNumber(args[3]);
  if (isFormulaError(startPeriod)) return startPeriod;
  const endPeriod = requireNumber(args[4]);
  if (isFormulaError(endPeriod)) return endPeriod;
  const type = requireNumber(args[5]);
  if (isFormulaError(type)) return type;

  const r = rate as number;
  const n = nper as number;
  const v = pv as number;
  const sp = startPeriod as number;
  const ep = endPeriod as number;
  const t = type as number;

  if (
    r <= 0 ||
    n <= 0 ||
    v <= 0 ||
    sp < 1 ||
    ep < 1 ||
    sp > ep ||
    (t !== 0 && t !== 1)
  ) {
    return "#NUM!" as FormulaError;
  }

  let cumprinc = 0;
  for (let per = sp; per <= ep; per++) {
    const ppmt = fnPPMT(r, per, n, v, 0, t);
    if (isFormulaError(ppmt)) return ppmt;
    cumprinc += ppmt as number;
  }
  return cumprinc;
}

function fnXNPV(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const rate = requireNumber(args[0]);
  if (isFormulaError(rate)) return rate;
  const values = flattenArgs([args[1]]);
  const dates = flattenArgs([args[2]]);

  if (values.length !== dates.length || values.length === 0)
    return "#NUM!" as FormulaError;

  const r = rate as number;
  const d0 = parseDateValue(dates[0]);
  if (d0 === null) return "#VALUE!" as FormulaError;

  let xnpv = 0;
  for (let i = 0; i < values.length; i++) {
    const cf = requireNumber(values[i]);
    if (isFormulaError(cf)) return cf;
    const di = parseDateValue(dates[i]);
    if (di === null) return "#VALUE!" as FormulaError;
    const yearFrac = (di - d0) / 365;
    xnpv += (cf as number) / Math.pow(1 + r, yearFrac);
  }
  return xnpv;
}

function fnXIRR(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const values = flattenArgs([args[0]]);
  const dates = flattenArgs([args[1]]);
  let guess = args.length > 2 ? requireNumber(args[2]) : 0.1;
  if (isFormulaError(guess)) return guess;

  if (values.length !== dates.length || values.length === 0)
    return "#NUM!" as FormulaError;

  const cashflows: number[] = [];
  const dayOffsets: number[] = [];
  const d0 = parseDateValue(dates[0]);
  if (d0 === null) return "#VALUE!" as FormulaError;

  for (let i = 0; i < values.length; i++) {
    const cf = requireNumber(values[i]);
    if (isFormulaError(cf)) return cf;
    cashflows.push(cf as number);
    const di = parseDateValue(dates[i]);
    if (di === null) return "#VALUE!" as FormulaError;
    dayOffsets.push((di - d0) / 365);
  }

  let rate = guess as number;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let i = 0; i < cashflows.length; i++) {
      const pow = Math.pow(1 + rate, dayOffsets[i]);
      npv += cashflows[i] / pow;
      if (dayOffsets[i] !== 0) {
        dnpv -= (dayOffsets[i] * cashflows[i]) / (pow * (1 + rate));
      }
    }
    if (Math.abs(npv) < 1e-10) return rate;
    if (dnpv === 0) return "#NUM!" as FormulaError;
    rate = rate - npv / dnpv;
  }
  return "#NUM!" as FormulaError;
}

function fnMIRR(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const values = flattenArgs([args[0]]);
  const financeRate = requireNumber(args[1]);
  if (isFormulaError(financeRate)) return financeRate;
  const reinvestRate = requireNumber(args[2]);
  if (isFormulaError(reinvestRate)) return reinvestRate;

  const fr = financeRate as number;
  const rr = reinvestRate as number;
  const n = values.length;

  let npvNeg = 0;
  let npvPos = 0;

  for (let i = 0; i < n; i++) {
    const cf = requireNumber(values[i]);
    if (isFormulaError(cf)) return cf;
    const v = cf as number;
    if (v >= 0) {
      npvPos += v * Math.pow(1 + rr, n - 1 - i);
    } else {
      npvNeg += v / Math.pow(1 + fr, i);
    }
  }

  if (npvNeg === 0 || npvPos === 0) return "#DIV/0!" as FormulaError;

  return Math.pow(-npvPos / npvNeg, 1 / (n - 1)) - 1;
}

function fnSLN(...args: FormulaValue[]): FormulaValue {
  if (args.length < 3) return "#VALUE!" as FormulaError;
  const cost = requireNumber(args[0]);
  if (isFormulaError(cost)) return cost;
  const salvage = requireNumber(args[1]);
  if (isFormulaError(salvage)) return salvage;
  const life = requireNumber(args[2]);
  if (isFormulaError(life)) return life;

  const l = life as number;
  if (l === 0) return "#DIV/0!" as FormulaError;

  return ((cost as number) - (salvage as number)) / l;
}

function fnSYD(...args: FormulaValue[]): FormulaValue {
  if (args.length < 4) return "#VALUE!" as FormulaError;
  const cost = requireNumber(args[0]);
  if (isFormulaError(cost)) return cost;
  const salvage = requireNumber(args[1]);
  if (isFormulaError(salvage)) return salvage;
  const life = requireNumber(args[2]);
  if (isFormulaError(life)) return life;
  const per = requireNumber(args[3]);
  if (isFormulaError(per)) return per;

  const l = life as number;
  const p = per as number;
  if (l <= 0 || p <= 0 || p > l) return "#NUM!" as FormulaError;

  const sumYears = (l * (l + 1)) / 2;
  return (((cost as number) - (salvage as number)) * (l - p + 1)) / sumYears;
}

function fnDB(...args: FormulaValue[]): FormulaValue {
  if (args.length < 4) return "#VALUE!" as FormulaError;
  const cost = requireNumber(args[0]);
  if (isFormulaError(cost)) return cost;
  const salvage = requireNumber(args[1]);
  if (isFormulaError(salvage)) return salvage;
  const life = requireNumber(args[2]);
  if (isFormulaError(life)) return life;
  const period = requireNumber(args[3]);
  if (isFormulaError(period)) return period;
  const month = args.length > 4 ? requireNumber(args[4]) : 12;
  if (isFormulaError(month)) return month;

  const c = cost as number;
  const s = salvage as number;
  const l = life as number;
  const p = period as number;
  const m = month as number;

  if (l <= 0 || p <= 0 || p > l + 1 || c < 0 || s < 0 || m < 1 || m > 12) {
    return "#NUM!" as FormulaError;
  }

  // Fixed-declining balance rate, rounded to 3 decimal places
  const rate =
    c === 0 ? 0 : Math.round((1 - Math.pow(s / c, 1 / l)) * 1000) / 1000;

  let totalDepreciation = 0;
  for (let i = 1; i <= p; i++) {
    let depreciation: number;
    if (i === 1) {
      depreciation = (c * rate * m) / 12;
    } else if (i === Math.floor(l) + 1) {
      depreciation = ((c - totalDepreciation) * rate * (12 - m)) / 12;
    } else {
      depreciation = (c - totalDepreciation) * rate;
    }
    if (i === p) return depreciation;
    totalDepreciation += depreciation;
  }
  return 0;
}

function fnDDB(...args: FormulaValue[]): FormulaValue {
  if (args.length < 4) return "#VALUE!" as FormulaError;
  const cost = requireNumber(args[0]);
  if (isFormulaError(cost)) return cost;
  const salvage = requireNumber(args[1]);
  if (isFormulaError(salvage)) return salvage;
  const life = requireNumber(args[2]);
  if (isFormulaError(life)) return life;
  const period = requireNumber(args[3]);
  if (isFormulaError(period)) return period;
  const factor = args.length > 4 ? requireNumber(args[4]) : 2;
  if (isFormulaError(factor)) return factor;

  const c = cost as number;
  const s = salvage as number;
  const l = life as number;
  const p = period as number;
  const f = factor as number;

  if (l <= 0 || p <= 0 || p > l || c < 0 || s < 0 || f <= 0) {
    return "#NUM!" as FormulaError;
  }

  let totalDepreciation = 0;
  for (let i = 1; i <= p; i++) {
    const remaining = c - totalDepreciation;
    let depreciation = remaining * (f / l);
    // Don't depreciate below salvage
    if (remaining - depreciation < s) {
      depreciation = remaining - s;
    }
    if (depreciation < 0) depreciation = 0;
    if (i === p) return depreciation;
    totalDepreciation += depreciation;
  }
  return 0;
}

function fnEFFECT(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const nominalRate = requireNumber(args[0]);
  if (isFormulaError(nominalRate)) return nominalRate;
  const npery = requireNumber(args[1]);
  if (isFormulaError(npery)) return npery;

  const r = nominalRate as number;
  const n = Math.floor(npery as number);

  if (r <= 0 || n < 1) return "#NUM!" as FormulaError;

  return Math.pow(1 + r / n, n) - 1;
}

function fnNOMINAL(...args: FormulaValue[]): FormulaValue {
  if (args.length < 2) return "#VALUE!" as FormulaError;
  const effectRate = requireNumber(args[0]);
  if (isFormulaError(effectRate)) return effectRate;
  const npery = requireNumber(args[1]);
  if (isFormulaError(npery)) return npery;

  const r = effectRate as number;
  const n = Math.floor(npery as number);

  if (r <= 0 || n < 1) return "#NUM!" as FormulaError;

  return n * (Math.pow(1 + r, 1 / n) - 1);
}

const MS_PER_DAY = 86400000;

/** Parse a date value to days since epoch (for yearFrac calculations). */
function parseDateValue(val: FormulaValue): number | null {
  if (typeof val === "number") {
    // Assume Excel serial date number: days since 1900-01-01 (with the 1900 bug)
    const epochDays = new Date(1899, 11, 30).getTime() / MS_PER_DAY;
    return epochDays + val;
  }
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.getTime() / MS_PER_DAY;
  }
  return null;
}

export const financialFunctions: Record<string, FormulaFunction> = {
  PMT: fnPMT,
  FV: fnFV,
  PV: fnPV,
  NPV: fnNPV,
  IRR: fnIRR,
  RATE: fnRATE,
  NPER: fnNPER,
  PPMT: fnPPMT,
  IPMT: fnIPMT,
  CUMPRINC: fnCUMPRINC,
  CUMIPMT: fnCUMIPMT,
  XNPV: fnXNPV,
  XIRR: fnXIRR,
  MIRR: fnMIRR,
  SLN: fnSLN,
  SYD: fnSYD,
  DB: fnDB,
  DDB: fnDDB,
  EFFECT: fnEFFECT,
  NOMINAL: fnNOMINAL,
};

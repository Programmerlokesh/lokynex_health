import { BloodParameterDto, ResultFlag } from "@/types/blood-report";

/** "13.5" -> 13.5. "<0.5", ">100", "abc" -> null (cannot be flagged). */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/,/g, "");
  if (!s || s.startsWith("<") || s.startsWith(">")) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Same rules as the server (BloodReportRules.ComputeFlag). */
export function computeFlag(p: BloodParameterDto, raw: string): ResultFlag {
  const v = parseNumber(raw);
  if (v === null) return "Normal";
  if (p.criticalLow !== null && v < p.criticalLow) return "Critical";
  if (p.criticalHigh !== null && v > p.criticalHigh) return "Critical";
  if (p.low !== null && v < p.low) return "Low";
  if (p.high !== null && v > p.high) return "High";
  return "Normal";
}

const TITRE_VALUE = /^1\s*[:/]\s*(\d+)$/;
const TITRE_LIMIT = /^<\s*1\s*:\s*(\d+)/;
const NEGATIVE_REF =
  /^(non[\s-]*reactive|not[\s-]*detected|negative|absent|nil)\b/i;
const NEGATIVE_VALUE =
  /^(non[\s-]*reactive|not[\s-]*detected|not[\s-]*seen|negative|neg|nil|absent|normal|no)\b/i;
const POSITIVE_VALUE = /(reactive|positive|detected|present|seen|\bpos\b|\+)/i;

/**
 * Auto flag for NON-numeric results (same rules as the server,
 * BloodReportRules.ComputeTextFlag). "Abnormal" only when it is clearly outside
 * the reference text, e.g. "Non-Reactive" vs "Reactive", or "< 1:80" vs "1:160".
 */
export function computeTextFlag(
  raw: string,
  referenceText: string | null,
): ResultFlag {
  const v = raw.trim();
  const r = (referenceText ?? "").trim();
  if (!v || !r) return "Normal";

  const limit = TITRE_LIMIT.exec(r);
  if (limit) {
    const t = TITRE_VALUE.exec(v);
    if (t) return Number(t[1]) >= Number(limit[1]) ? "Abnormal" : "Normal";
    return "Normal";
  }

  if (!NEGATIVE_REF.test(r)) return "Normal";
  if (NEGATIVE_VALUE.test(v)) return "Normal";
  return POSITIVE_VALUE.test(v) ? "Abnormal" : "Normal";
}

/** Numeric results are flagged automatically. Text results: a manual flag wins, else decided from the reference text. */
export function resolveFlag(
  p: BloodParameterDto,
  raw: string,
  manual: ResultFlag,
): ResultFlag {
  if (!raw.trim()) return "Normal";
  const numericParam = p.resultType !== "Text" && parseNumber(raw) !== null;
  if (numericParam) return computeFlag(p, raw);
  if (manual === "Low" || manual === "High" || manual === "Abnormal")
    return manual;
  return computeTextFlag(raw, p.referenceText);
}

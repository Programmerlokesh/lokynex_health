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

/** Numeric results are flagged automatically, text results use the manual flag. */
export function resolveFlag(
  p: BloodParameterDto,
  raw: string,
  manual: ResultFlag,
): ResultFlag {
  if (!raw.trim()) return "Normal";
  const numericParam = p.resultType !== "Text" && parseNumber(raw) !== null;
  if (numericParam) return computeFlag(p, raw);
  return manual === "Low" || manual === "High" ? manual : "Normal";
}
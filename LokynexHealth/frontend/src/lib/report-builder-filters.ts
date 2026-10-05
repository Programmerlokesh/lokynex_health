import { toDateInputValue } from "@/lib/format";
import { ReportDocumentDto, ReportTemplateDto } from "@/types/report-builder";

export type QuickRange = "today" | "yesterday" | "week" | "month";
export type SourceFilter = "Any" | "Manual" | "UploadedDocument";

export interface ReportFilterState {
  dateFrom: string;
  dateTo: string;
  /** Documents: order # / patient / test. Templates: template name. */
  search: string;
  /** Templates only. */
  source: SourceFilter;
}

export const initialReportFilters: ReportFilterState = {
  dateFrom: "",
  dateTo: "",
  search: "",
  source: "Any",
};

/** Date range for a quick pill. Week starts on Monday. */
export function rangeFor(range: QuickRange): {
  dateFrom: string;
  dateTo: string;
} {
  const now = new Date();
  const day = (d: Date) => toDateInputValue(d);

  if (range === "today") return { dateFrom: day(now), dateTo: day(now) };

  if (range === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { dateFrom: day(y), dateTo: day(y) };
  }

  if (range === "week") {
    const start = new Date(now);
    const diff = (start.getDay() + 6) % 7; // Mon = 0
    start.setDate(start.getDate() - diff);
    return { dateFrom: day(start), dateTo: day(now) };
  }

  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { dateFrom: day(first), dateTo: day(now) };
}

/** Which quick pill (if any) matches the current dates. */
export function activeRange(f: ReportFilterState): QuickRange | null {
  const all: QuickRange[] = ["today", "yesterday", "week", "month"];
  for (const r of all) {
    const v = rangeFor(r);
    if (v.dateFrom === f.dateFrom && v.dateTo === f.dateTo) return r;
  }
  return null;
}

export function countActiveFilters(
  f: ReportFilterState,
  withSource: boolean,
): number {
  let n = 0;
  if (f.dateFrom || f.dateTo) n++;
  if (f.search.trim()) n++;
  if (withSource && f.source !== "Any") n++;
  return n;
}

function inRange(iso: string, f: ReportFilterState): boolean {
  if (!f.dateFrom && !f.dateTo) return true;
  const d = toDateInputValue(new Date(iso));
  if (f.dateFrom && d < f.dateFrom) return false;
  if (f.dateTo && d > f.dateTo) return false;
  return true;
}

export function filterDocuments(
  rows: ReportDocumentDto[],
  f: ReportFilterState,
): ReportDocumentDto[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (!inRange(r.createdAt, f)) return false;
    if (!q) return true;
    return (
      r.orderNumber.toLowerCase().includes(q) ||
      r.testName.toLowerCase().includes(q) ||
      r.patientName.toLowerCase().includes(q)
    );
  });
}

export function filterTemplates(
  rows: ReportTemplateDto[],
  f: ReportFilterState,
): ReportTemplateDto[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (!inRange(r.createdAt, f)) return false;
    if (f.source !== "Any" && r.sourceType !== f.source) return false;
    if (!q) return true;
    return r.name.toLowerCase().includes(q);
  });
}

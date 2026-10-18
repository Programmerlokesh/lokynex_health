import { toDateInputValue } from "@/lib/format";
import {
  OwnerLedgerEntryDto,
  OwnerLedgerSeriesPoint,
  OwnerLedgerTotals,
} from "@/types/owner";

export type PresetKey =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "lastMonth"
  | "quarter"
  | "year"
  | "all"
  | "custom";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "month", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
];

/** Date range for a preset. "all" returns empty strings (server uses first..last entry). */
export function presetRange(key: PresetKey, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = (d: Date) => toDateInputValue(d);
  switch (key) {
    case "today":
      return { from: day(now), to: day(now) };
    case "7d":
      return { from: day(new Date(y, m, now.getDate() - 6)), to: day(now) };
    case "30d":
      return { from: day(new Date(y, m, now.getDate() - 29)), to: day(now) };
    case "month":
      return { from: day(new Date(y, m, 1)), to: day(new Date(y, m + 1, 0)) };
    case "lastMonth":
      return { from: day(new Date(y, m - 1, 1)), to: day(new Date(y, m, 0)) };
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      return { from: day(new Date(y, q, 1)), to: day(new Date(y, q + 3, 0)) };
    }
    case "year":
      return { from: day(new Date(y, 0, 1)), to: day(new Date(y, 11, 31)) };
    default:
      return { from: "", to: "" };
  }
}

/** % change vs previous period. null when there is nothing to compare with. */
export function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export const netRevenue = (t: OwnerLedgerTotals) => t.income - t.refund;
export const totalExpenses = (t: OwnerLedgerTotals) =>
  t.expense + t.commissionPayout;
export const marginPct = (t: OwnerLedgerTotals) => {
  const rev = netRevenue(t);
  return rev > 0 ? (t.net / rev) * 100 : null;
};

/** "12 Mar" (day/week), "Mar 26" (month) — short label for chart axes. */
export function bucketLabel(bucket: string, granularity: string): string {
  const d = new Date(`${bucket}T00:00:00`);
  return granularity === "month"
    ? d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Best / worst bucket by net, in one pass. */
export function bestAndWorst(series: OwnerLedgerSeriesPoint[]) {
  let best: OwnerLedgerSeriesPoint | null = null;
  let worst: OwnerLedgerSeriesPoint | null = null;
  for (const p of series) {
    if (p.income === 0 && p.net === 0) continue; // skip empty buckets
    if (!best || p.net > best.net) best = p;
    if (!worst || p.net < worst.net) worst = p;
  }
  return { best, worst };
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Downloads entries as an Excel-friendly CSV (UTF-8 BOM). */
export function downloadEntriesCsv(
  rows: OwnerLedgerEntryDto[],
  fileName: string,
) {
  const head = [
    "Date",
    "Type",
    "Category",
    "Lab",
    "Lab Code",
    "Amount (INR)",
    "Source",
    "Payment Method",
    "Reference",
    "Description",
  ];
  const lines = rows.map((r) =>
    [
      r.entryDate,
      r.entryType,
      r.category,
      r.labName,
      r.labCode,
      r.entryType === "Income" ? r.amount : -r.amount,
      r.source,
      r.paymentMethod,
      r.referenceNo,
      r.description,
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export const TYPE_META: Record<
  string,
  { label: string; color: string; sign: 1 | -1 }
> = {
  Income: { label: "Income", color: "#16A34A", sign: 1 },
  Expense: { label: "Expense", color: "#DC2626", sign: -1 },
  Refund: { label: "Refund", color: "#F59E0B", sign: -1 },
  CommissionPayout: { label: "Commission", color: "#7C3AED", sign: -1 },
};

export const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  Income: ["Software Sale", "Renewal", "Setup Fee", "Training", "Other Income"],
  Expense: [
    "Marketing",
    "Travel",
    "Salary",
    "Software & Tools",
    "Office",
    "Other Expense",
  ],
  Refund: ["Subscription Refund"],
  CommissionPayout: ["Sales Commission", "Referral Commission"],
};

export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cheque",
  "Other",
];

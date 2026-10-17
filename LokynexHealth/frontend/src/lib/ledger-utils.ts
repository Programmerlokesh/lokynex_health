import { brand } from "@/components/providers/mui-theme-provider";
import { toDateInputValue } from "@/lib/format";
import type {
  Granularity,
  LedgerEntryType,
  LedgerPeriodTotals,
  LedgerSeriesPoint,
} from "@/types/ledger";

export const ENTRY_TYPES: LedgerEntryType[] = [
  "Income",
  "Expense",
  "CommissionPayout",
  "Refund",
];

export const TYPE_META: Record<
  LedgerEntryType,
  { label: string; color: string; inflow: boolean; hint: string }
> = {
  Income: {
    label: "Income",
    color: brand.teal,
    inflow: true,
    hint: "Money received",
  },
  Expense: {
    label: "Expense",
    color: "#EF4444",
    inflow: false,
    hint: "Rent, salary, supplies…",
  },
  CommissionPayout: {
    label: "Commission",
    color: brand.orange,
    inflow: false,
    hint: "Doctor / referral payout",
  },
  Refund: {
    label: "Refund",
    color: "#F59E0B",
    inflow: false,
    hint: "Money returned",
  },
};

export function typeMeta(type: string) {
  return (
    TYPE_META[type as LedgerEntryType] ?? {
      label: type,
      color: brand.blue,
      inflow: false,
      hint: "",
    }
  );
}

export const EMPTY_TOTALS: LedgerPeriodTotals = {
  income: 0,
  refund: 0,
  commissionPayout: 0,
  expense: 0,
  net: 0,
  entryCount: 0,
};

export const totalOutflow = (t: LedgerPeriodTotals) =>
  t.refund + t.commissionPayout + t.expense;

/* ---------- money ---------- */
export function formatINR(value: number, withSign = false): string {
  const v = Number.isFinite(value) ? value : 0;
  const body = Math.abs(v).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const sign = v < 0 ? "−" : withSign && v > 0 ? "+" : "";
  return `${sign}₹${body}`;
}

/** ₹1.2K · ₹3.4L · ₹1.5Cr (Indian short units) */
export function compactINR(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 1e7) return `${sign}₹${+(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${+(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}₹${+(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/* ---------- dates ---------- */
function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDisplayDate(ymd: string): string {
  if (!ymd) return "";
  return parseYmd(ymd).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function bucketLabel(
  bucket: string,
  g: Granularity,
  long = false,
): string {
  const d = parseYmd(bucket);
  if (g === "month")
    return d.toLocaleDateString(
      "en-IN",
      long
        ? { month: "long", year: "numeric" }
        : { month: "short", year: "2-digit" },
    );
  if (g === "week")
    return long
      ? `Week of ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return long
    ? d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const GRANULARITY_WORD: Record<Granularity, string> = {
  day: "day",
  week: "week",
  month: "month",
};

export type PresetId =
  | "today"
  | "7d"
  | "30d"
  | "thisMonth"
  | "lastMonth"
  | "thisFy"
  | "lastFy"
  | "all";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "thisFy", label: "This FY" },
  { id: "lastFy", label: "Last FY" },
  { id: "all", label: "All time" },
];

/** Indian financial year = 1 Apr → 31 Mar. "all" returns empty strings (= no date filter). */
export function getPresetRange(
  id: PresetId,
  now: Date = new Date(),
): { dateFrom: string; dateTo: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const fmt = toDateInputValue;
  switch (id) {
    case "today":
      return { dateFrom: fmt(now), dateTo: fmt(now) };
    case "7d":
      return { dateFrom: fmt(new Date(y, m, d - 6)), dateTo: fmt(now) };
    case "30d":
      return { dateFrom: fmt(new Date(y, m, d - 29)), dateTo: fmt(now) };
    case "thisMonth":
      return { dateFrom: fmt(new Date(y, m, 1)), dateTo: fmt(now) };
    case "lastMonth":
      return {
        dateFrom: fmt(new Date(y, m - 1, 1)),
        dateTo: fmt(new Date(y, m, 0)),
      };
    case "thisFy": {
      const fy = m >= 3 ? y : y - 1;
      return { dateFrom: fmt(new Date(fy, 3, 1)), dateTo: fmt(now) };
    }
    case "lastFy": {
      const fy = (m >= 3 ? y : y - 1) - 1;
      return {
        dateFrom: fmt(new Date(fy, 3, 1)),
        dateTo: fmt(new Date(fy + 1, 2, 31)),
      };
    }
    default:
      return { dateFrom: "", dateTo: "" };
  }
}

/* ---------- insights ---------- */
export function computeInsights(
  series: LedgerSeriesPoint[],
  totals: LedgerPeriodTotals,
) {
  const active = series.filter(
    (p) =>
      p.income > 0 || p.refund > 0 || p.commissionPayout > 0 || p.expense > 0,
  );
  let best: LedgerSeriesPoint | null = null;
  let worst: LedgerSeriesPoint | null = null;
  for (const p of active) {
    if (!best || p.net > best.net) best = p;
    if (!worst || p.net < worst.net) worst = p;
  }
  return {
    best,
    worst,
    profitable: active.filter((p) => p.net > 0).length,
    activeCount: active.length,
    outflowPer100:
      totals.income > 0 ? (totalOutflow(totals) / totals.income) * 100 : null,
  };
}

/* ---------- CSV ---------- */
export function downloadCsv(
  filename: string,
  rows: (string | number | null | undefined)[][],
) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

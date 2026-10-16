import { formatDateTime, formatMoney, toDateInputValue } from "@/lib/format";
import {
  CommissionReportParams,
  CommissionReportRow,
  EntityOption,
  PayoutEntityType,
  StatusFilter,
  WiseMode,
} from "@/types/commission-report";

/* ------------------------------------------------------------------ */
/* Filter state                                                         */
/* ------------------------------------------------------------------ */

export interface ReportFilterState {
  dateFrom: string; // yyyy-mm-dd (local)
  dateTo: string;
  entityType: PayoutEntityType;
  /** null = "All" */
  entity: EntityOption | null;
  status: StatusFilter;
  wise: WiseMode;
  phone: string;
  email: string;
  address: string;
}

export function defaultFilters(): ReportFilterState {
  const now = new Date();
  return {
    dateFrom: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: toDateInputValue(now),
    entityType: "Referral",
    entity: null,
    status: "All",
    wise: "Month",
    phone: "",
    email: "",
    address: "",
  };
}

/** `wise` is display-only (grouping happens in the browser), so it is NOT sent to the server. */
export function toReportParams(f: ReportFilterState): CommissionReportParams {
  return {
    dateFrom: f.dateFrom || undefined,
    dateTo: f.dateTo || undefined,
    tzOffsetMinutes: -new Date().getTimezoneOffset(),
    entityType: f.entityType,
    entityId: f.entity?.id || undefined,
    status: f.status,
    phone: f.phone.trim() || undefined,
    email: f.email.trim() || undefined,
    address: f.address.trim() || undefined,
  };
}

export const commissionLabel = (t: PayoutEntityType) => `${t} Commission`;

/* ------------------------------------------------------------------ */
/* Totals + grouping (single O(n) passes)                               */
/* ------------------------------------------------------------------ */

export interface Totals {
  tests: number;
  orders: number;
  amount: number;
  less: number;
  paid: number;
  due: number;
  commission: number;
  paidComm: number;
  unpaidComm: number;
}

export function sumRows(rows: readonly CommissionReportRow[]): Totals {
  const orders = new Set<string>();
  const t: Totals = {
    tests: rows.length,
    orders: 0,
    amount: 0,
    less: 0,
    paid: 0,
    due: 0,
    commission: 0,
    paidComm: 0,
    unpaidComm: 0,
  };
  for (const r of rows) {
    orders.add(r.orderId);
    t.amount += r.testAmount;
    t.less += r.less;
    t.paid += r.paid;
    t.due += r.due;
    t.commission += r.commissionAmount;
    if (r.status === "Paid") t.paidComm += r.commissionAmount;
    else t.unpaidComm += r.commissionAmount;
  }
  t.orders = orders.size;
  return t;
}

export interface ReportGroup {
  key: string;
  label: string;
  rows: CommissionReportRow[];
  totals: Totals;
}

const dmy = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const dmyIso = (iso: string) => dmy(new Date(`${iso}T00:00:00`));

/** Group key + label of one date for Day / Week (Mon-Sun) / Month wise. */
function bucketOf(iso: string, wise: WiseMode): { key: string; label: string } {
  const d = new Date(iso);
  if (wise === "Day") {
    return { key: toDateInputValue(d), label: dmy(d) };
  }
  if (wise === "Week") {
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      key: toDateInputValue(mon),
      label: `Week: ${dmy(mon)} – ${dmy(sun)}`,
    };
  }
  return {
    key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
}

/**
 * Rows arrive sorted by date from the server, so one pass with a Map
 * (insertion-ordered) gives chronological groups: O(n), no sorting needed.
 */
export function groupRows(
  rows: readonly CommissionReportRow[],
  wise: WiseMode,
): ReportGroup[] {
  const map = new Map<string, { label: string; rows: CommissionReportRow[] }>();
  for (const r of rows) {
    const { key, label } = bucketOf(r.orderDate, wise);
    const g = map.get(key);
    if (g) g.rows.push(r);
    else map.set(key, { label, rows: [r] });
  }
  return Array.from(map, ([key, g]) => ({
    key,
    label: g.label,
    rows: g.rows,
    totals: sumRows(g.rows),
  }));
}

/* ------------------------------------------------------------------ */
/* Text for PDF + WhatsApp                                              */
/* ------------------------------------------------------------------ */

export function filterLines(f: ReportFilterState): string[] {
  const lines = [`Type: ${f.entityType}`];
  lines.push(`${f.entityType}: ${f.entity ? f.entity.fullName : "All"}`);
  if (f.dateFrom || f.dateTo) {
    lines.push(
      `Date: ${f.dateFrom ? dmyIso(f.dateFrom) : "Start"} – ${f.dateTo ? dmyIso(f.dateTo) : "Today"}`,
    );
  }
  lines.push(`Status: ${f.status}`);
  lines.push(`Wise: ${f.wise}`);
  if (f.phone.trim()) lines.push(`Phone: ${f.phone.trim()}`);
  if (f.email.trim()) lines.push(`Email: ${f.email.trim()}`);
  if (f.address.trim()) lines.push(`Address: ${f.address.trim()}`);
  return lines;
}

export function buildWhatsAppMessage(f: ReportFilterState, t: Totals): string {
  const who = f.entity ? f.entity.fullName : `${f.entityType}s`;
  const range =
    f.dateFrom || f.dateTo
      ? `${f.dateFrom ? dmyIso(f.dateFrom) : "Start"} to ${f.dateTo ? dmyIso(f.dateTo) : "Today"}`
      : "All dates";
  return [
    `Hello ${who},`,
    `Your ${f.entityType.toLowerCase()} commission statement (${range}):`,
    `Orders: ${t.orders} | Tests: ${t.tests}`,
    `Total commission: Rs ${formatMoney(t.commission)}`,
    `Paid: Rs ${formatMoney(t.paidComm)} | Pending: Rs ${formatMoney(t.unpaidComm)}`,
    `Detailed PDF is attached.`,
  ].join("\n");
}

export function pdfFileName(f: ReportFilterState): string {
  const who = (f.entity?.fullName ?? f.entityType)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `commission-${who || "report"}-${f.dateFrom || "all"}_${f.dateTo || "all"}.pdf`;
}

/* ------------------------------------------------------------------ */
/* Printable report                                                     */
/* ------------------------------------------------------------------ */

const esc = (v: string | null | undefined) =>
  (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const dash = (v: string | null | undefined) => (v ? esc(v) : "—");

export const REPORT_CSS = `
.cr{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11px;line-height:1.35;background:#fff}
.cr *{box-sizing:border-box}
.cr h1{font-size:18px;margin:0 0 2px}
.cr .sub{color:#555;margin-bottom:6px}
.cr .filters{display:flex;flex-wrap:wrap;gap:4px 16px;margin-bottom:8px;color:#333}
.cr .sum{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.cr .sum span{background:#eef2ff;border-radius:999px;padding:3px 10px;font-weight:700}
.cr .warn{background:#fff4e5;border:1px solid #f5c26b;padding:6px 8px;border-radius:4px;margin-bottom:8px}
.cr table{width:100%;border-collapse:collapse}
.cr th{background:#eee;border-top:1px solid #111;border-bottom:1px solid #111;padding:5px;text-align:left;text-transform:uppercase;font-size:9.5px;letter-spacing:.3px}
.cr td{border-bottom:1px solid #ddd;padding:5px;vertical-align:top}
.cr tr{break-inside:avoid;page-break-inside:avoid}
.cr thead{display:table-header-group}
.cr .r{text-align:right;white-space:nowrap}
.cr .m{color:#666;font-size:9.5px}
.cr .grp td{background:#f3f4f6;font-weight:700;border-top:1px solid #999}
.cr .paid{color:#15803d;font-weight:700}
.cr .unpaid{color:#b45309;font-weight:700}
.cr .due{color:#b00020;font-weight:700}
.cr tfoot td{border-top:2px solid #111;border-bottom:0;font-weight:700;padding-top:7px}
`;

export interface ReportMeta {
  title: string;
  filterLines: string[];
  commissionLabel: string;
  wise: WiseMode;
  truncatedAt?: number | null;
}

/** <style> + content, no <html>: used for the on-screen preview, print AND the PDF file. */
export function buildReportFragment(
  rows: readonly CommissionReportRow[],
  meta: ReportMeta,
): string {
  const groups = groupRows(rows, meta.wise);
  const total = sumRows(rows);

  const body = groups
    .map((g) => {
      const t = g.totals;
      const head = `<tr class="grp" data-keep>
<td colspan="3">${esc(g.label)} — ${t.tests} test${t.tests === 1 ? "" : "s"}</td>
<td class="r">${formatMoney(t.amount)}</td><td class="r">${formatMoney(t.less)}</td>
<td class="r">${formatMoney(t.due)}</td><td class="r">${formatMoney(t.paid)}</td>
<td colspan="2"></td><td class="r">${formatMoney(t.commission)}</td><td></td></tr>`;
      const lines = g.rows
        .map(
          (r) => `<tr data-keep>
<td>${esc(formatDateTime(r.orderDate))}<div class="m">${esc(r.orderNumber)}</div></td>
<td>${esc(r.patientName)}</td>
<td>${esc(r.testName)}</td>
<td class="r">${formatMoney(r.testAmount)}</td>
<td class="r">${formatMoney(r.less)}</td>
<td class="r${r.due > 0 ? " due" : ""}">${formatMoney(r.due)}</td>
<td class="r">${formatMoney(r.paid)}</td>
<td>${dash(r.doctorName)}</td>
<td>${dash(r.referralName)}</td>
<td class="r">${formatMoney(r.commissionAmount)}</td>
<td class="${r.status === "Paid" ? "paid" : "unpaid"}">${esc(r.status)}</td></tr>`,
        )
        .join("");
      return head + lines;
    })
    .join("");

  // 11 columns everywhere: group rows use 3 + 4 + 2 + 1 + 1.
  return `<style>${REPORT_CSS}</style>
<div class="cr">
<h1>${esc(meta.title)}</h1>
<div class="sub">Generated ${esc(formatDateTime(new Date()))}</div>
<div class="filters">${meta.filterLines.map((l) => `<span>${esc(l)}</span>`).join("")}</div>
<div class="sum">
<span>${total.orders} orders</span><span>${total.tests} tests</span>
<span>Line Total ₹${formatMoney(total.amount)}</span>
<span>Commission ₹${formatMoney(total.commission)}</span>
<span>Paid Comm ₹${formatMoney(total.paidComm)}</span>
<span>Unpaid Comm ₹${formatMoney(total.unpaidComm)}</span>
</div>
${meta.truncatedAt ? `<div class="warn">Only the first ${meta.truncatedAt} rows are shown. Narrow the filters to see the rest.</div>` : ""}
<table>
<thead><tr>
<th>Date</th><th>Patient Name</th><th>Test Name</th><th class="r">Test Amount</th>
<th class="r">Less</th><th class="r">Due</th><th class="r">Paid</th>
<th>Doctor Name</th><th>Referral Name</th><th class="r">${esc(meta.commissionLabel)}</th><th>Status</th>
</tr></thead>
<tbody>${body || `<tr><td colspan="11" style="text-align:center;padding:16px">No rows match these filters.</td></tr>`}</tbody>
<tfoot><tr>
<td colspan="3" class="r">Total</td>
<td class="r">${formatMoney(total.amount)}</td><td class="r">${formatMoney(total.less)}</td>
<td class="r">${formatMoney(total.due)}</td><td class="r">${formatMoney(total.paid)}</td>
<td colspan="2"></td><td class="r">${formatMoney(total.commission)}</td><td></td>
</tr></tfoot>
</table>
</div>`;
}

export function buildReportHtml(
  rows: readonly CommissionReportRow[],
  meta: ReportMeta,
): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(meta.title)}</title>
<style>@page{size:A4 landscape;margin:10mm}html,body{margin:0;padding:12px;background:#fff}</style>
</head><body>${buildReportFragment(rows, meta)}</body></html>`;
}

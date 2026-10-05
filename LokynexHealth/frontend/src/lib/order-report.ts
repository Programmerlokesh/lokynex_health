import { formatDateTime, formatMoney } from "@/lib/format";
import { OrderExportDto } from "@/types/order-list";

const esc = (v: string | null | undefined) =>
  (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const dash = (v: string | null | undefined) => (v ? esc(v) : "—");

export interface ReportMeta {
  title: string;
  /** e.g. ["Date: 01 Oct 2026 – 05 Oct 2026", "Branch: Main", "Payment: UPI"] */
  filterLines: string[];
}

/** A4 landscape. Self-contained: the same HTML is previewed and printed. */
export function buildOrderReportHtml(
  data: OrderExportDto,
  meta: ReportMeta,
): string {
  const rows = data.rows
    .map((r, i) => {
      const names = r.tests.map((t) => `<div>${esc(t.name)}</div>`).join("");
      const amounts = r.tests
        .map((t) => `<div>${formatMoney(t.amount)}</div>`)
        .join("");
      return `<tr>
  <td class="c">${i + 1}</td>
  <td>${esc(formatDateTime(r.createdAt))}<div class="m">${esc(r.orderNumber)}</div></td>
  <td>${esc(r.patientName)}</td>
  <td>${dash(r.doctorName)}</td>
  <td>${dash(r.referralName)}</td>
  <td>${names || "—"}</td>
  <td class="r">${amounts || "—"}</td>
  <td class="r">${formatMoney(r.paid)}</td>
  <td class="r${r.due > 0 ? " due" : ""}">${formatMoney(r.due)}</td>
</tr>`;
    })
    .join("");

  const note = data.truncated
    ? `<p class="warn">Only the first ${data.totalOrders} orders are shown. Narrow the filters to see the rest.</p>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(meta.title)}</title>
<style>
@page{size:A4 landscape;margin:10mm}
*{box-sizing:border-box}
body{margin:0;padding:12px;font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11px;line-height:1.35;background:#fff}
h1{font-size:18px;margin:0 0 2px}
.sub{color:#555;margin-bottom:8px}
.filters{display:flex;flex-wrap:wrap;gap:4px 16px;margin-bottom:8px;color:#333}
.warn{background:#fff4e5;border:1px solid #f5c26b;padding:6px 8px;border-radius:4px}
table{width:100%;border-collapse:collapse}
th{background:#eee;border-top:1px solid #111;border-bottom:1px solid #111;padding:5px;text-align:left;text-transform:uppercase;font-size:10px;letter-spacing:.3px}
td{border-bottom:1px solid #ddd;padding:5px;vertical-align:top}
tr{break-inside:avoid;page-break-inside:avoid}
thead{display:table-header-group}
.c{text-align:center;width:26px;color:#555}
.r{text-align:right;white-space:nowrap}
.m{color:#666;font-size:10px}
.due{font-weight:700;color:#b00020}
tfoot td{border-top:2px solid #111;border-bottom:0;font-weight:700;padding-top:7px}
</style></head><body>
<h1>${esc(meta.title)}</h1>
<div class="sub">Generated ${esc(formatDateTime(new Date()))} · ${data.totalOrders} order${data.totalOrders === 1 ? "" : "s"}</div>
<div class="filters">${meta.filterLines.map((l) => `<span>${esc(l)}</span>`).join("")}</div>
${note}
<table>
<thead><tr>
<th class="c">#</th><th>Order Date</th><th>Patient</th><th>Doctor</th><th>Referral</th>
<th>Test Name</th><th class="r">Test Amount</th><th class="r">Paid</th><th class="r">Due</th>
</tr></thead>
<tbody>${rows || `<tr><td colspan="9" style="text-align:center;padding:16px">No orders match these filters.</td></tr>`}</tbody>
<tfoot><tr>
<td colspan="6" class="r">Total</td>
<td class="r">${formatMoney(data.totalTestAmount)}</td>
<td class="r">${formatMoney(data.totalPaid)}</td>
<td class="r">${formatMoney(data.totalDue)}</td>
</tr></tfoot>
</table>
</body></html>`;
}

/** Prints an HTML document through a hidden iframe (no app chrome can leak onto paper). */
export function printHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  win.addEventListener("afterprint", () =>
    setTimeout(() => iframe.remove(), 500),
  );
  setTimeout(() => {
    win.focus();
    win.print();
  }, 200);
}

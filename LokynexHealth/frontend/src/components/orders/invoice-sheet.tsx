"use client";

import { formatMoney } from "@/lib/format";
import { OrderInvoiceDto } from "@/types/order";
import { forwardRef } from "react";

/** The bill is printed on A5 only — LANDSCAPE. */
export type PaperSize = "A5";

/** Millimetres. Landscape: 210 wide x 148 high. */
export const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  A5: { w: 210, h: 148 },
};

/**
 * Plain, self-contained CSS (no MUI / Tailwind) so the exact same stylesheet
 * is used by the on-screen preview and by the print iframe — what you see is
 * what the printer gets. Laid out for one A5 landscape page (210 x 148 mm).
 */
export const INVOICE_CSS = `
.inv-sheet{box-sizing:border-box;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;
  line-height:1.3;display:flex;flex-direction:column}
.inv-sheet *{box-sizing:border-box}
.inv-A5{width:210mm;min-height:148mm;padding:6mm 6mm 5mm;font-size:10px}

.inv-head{text-align:center;padding-bottom:6px;border-bottom:1px solid #999}
.inv-company{font-size:22px;font-weight:800;line-height:1.1;text-transform:uppercase;word-break:break-word}
.inv-branch{font-weight:700;margin-top:4px}
.inv-addr{color:#555;margin-top:1px}
.inv-no{font-weight:700;font-size:11px;margin-top:4px}

.inv-cards{display:grid;grid-template-columns:1.25fr 1.1fr 1fr;gap:8px;margin-top:7px}
.inv-card{border:1px solid #aaa;border-radius:5px;padding:5px 7px;min-width:0}
.inv-card h4{margin:0 0 3px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.2px}
.inv-row{display:flex;justify-content:space-between;gap:8px;padding:2.5px 0;border-bottom:1px dotted #ccc}
.inv-row:last-child{border-bottom:0}
.inv-row span:first-child{color:#555;flex:0 0 auto}
.inv-row span:last-child{font-weight:700;text-align:right;word-break:break-word}

.inv-table{width:100%;border-collapse:collapse;margin-top:7px}
.inv-table th,.inv-table td{border:1px solid #888;padding:4px 6px}
.inv-table th{background:#f3f3f3;font-size:10px;font-weight:800;text-transform:uppercase}
.inv-table td{vertical-align:top}
.inv-table tr{break-inside:avoid;page-break-inside:avoid}
.inv-table .n{width:26px;text-align:center}
.inv-table .c{text-align:center}
.inv-table .r{text-align:right;white-space:nowrap;width:70px}

.inv-bottom{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-top:5px;
  break-inside:avoid;page-break-inside:avoid}
.inv-note{font-size:9.5px;color:#333;padding-top:1px}
.inv-pay{width:262px;flex:0 0 auto;border-collapse:collapse}
.inv-pay th,.inv-pay td{border:1px solid #888;padding:4px 6px}
.inv-pay th{background:#f3f3f3;font-weight:800;text-transform:uppercase;text-align:center}
.inv-pay .n{width:26px;text-align:center}
.inv-pay .r{text-align:right;white-space:nowrap}

.inv-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:16px;gap:14px;
  break-inside:avoid;page-break-inside:avoid}
.inv-printed{font-size:9.5px;color:#333}
.inv-sign{width:46%;border-top:1px solid #777;text-align:right;font-weight:700;padding-top:3px}
@media print{.inv-sheet{box-shadow:none!important;margin:0!important}}
`;

const rupee = (n: number) => `₹${formatMoney(n)}`;

/** 05-10-2026 07:26 PM */
function billDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const p = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(h12)}:${p(d.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
}

/** "ORD-84" -> "#84" */
const shortNo = (billNo: string) => `#${billNo.match(/\d+/)?.[0] ?? billNo}`;

/** The printable bill. `printedOn` is passed in so preview and print agree. */
export const InvoiceSheet = forwardRef<
  HTMLDivElement,
  { data: OrderInvoiceDto; paper: PaperSize; printedOn: Date }
>(function InvoiceSheet({ data, paper, printedOn }, ref) {
  const ageGender =
    [
      data.patientAge != null ? String(data.patientAge) : null,
      data.patientGender,
    ]
      .filter(Boolean)
      .join(" / ") || "—";
  const no = shortNo(data.billNo);

  return (
    <div ref={ref} className={`inv-sheet inv-${paper}`}>
      <div className="inv-head">
        <div className="inv-company">{data.companyName}</div>
        <div className="inv-branch">Branch: {data.branchName}</div>
        {data.branchAddress && (
          <div className="inv-addr">{data.branchAddress}</div>
        )}
        <div className="inv-no">Invoice No: {no}</div>
      </div>

      <div className="inv-cards">
        <div className="inv-card">
          <h4>Patient</h4>
          <div className="inv-row">
            <span>P. Name</span>
            <span>{data.patientName}</span>
          </div>
          <div className="inv-row">
            <span>Age/Gender</span>
            <span>{ageGender}</span>
          </div>
          <div className="inv-row">
            <span>Profile Phone</span>
            <span>{data.patientPhone}</span>
          </div>
          <div className="inv-row">
            <span>Doctor</span>
            <span>{data.doctor?.name ?? "—"}</span>
          </div>
          <div className="inv-row">
            <span>Referrer</span>
            <span>{data.referral?.name ?? "—"}</span>
          </div>
        </div>

        <div className="inv-card">
          <h4>Invoice</h4>
          <div className="inv-row">
            <span>Bill No</span>
            <span>{no}</span>
          </div>
          <div className="inv-row">
            <span>Bill Date/Time</span>
            <span>{billDateTime(data.billDate)}</span>
          </div>
          <div className="inv-row">
            <span>Payment Mode</span>
            <span>{data.paymentMode}</span>
          </div>
          <div className="inv-row">
            <span>Profile</span>
            <span>{data.guardianName || "—"}</span>
          </div>
        </div>

        <div className="inv-card">
          <h4>Amount</h4>
          <div className="inv-row">
            <span>Subtotal</span>
            <span>{rupee(data.subtotal)}</span>
          </div>
          <div className="inv-row">
            <span>Discount</span>
            <span>- {rupee(data.discount)}</span>
          </div>
          <div className="inv-row">
            <span>Total</span>
            <span>{rupee(data.total)}</span>
          </div>
          <div className="inv-row">
            <span>Paid</span>
            <span>{rupee(data.paid)}</span>
          </div>
          <div className="inv-row">
            <span>Due</span>
            <span>{rupee(data.due)}</span>
          </div>
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th className="n">#</th>
            <th className="c">Test Description</th>
            <th className="r">Rate</th>
            <th className="r">Less</th>
            <th className="r">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l, i) => (
            <tr key={l.testId}>
              <td className="n">{i + 1}</td>
              <td>{l.description}</td>
              <td className="r">{rupee(l.rate)}</td>
              <td className="r">{rupee(l.less)}</td>
              <td className="r">{rupee(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-bottom">
        <div className="inv-note">
          <b>Note:</b> Please bring receipt while collecting reports.
          <br />
          This is a computer-generated bill.
        </div>
        <table className="inv-pay">
          <thead>
            <tr>
              <th colSpan={3}>Payments</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center" }}>
                  No payment received
                </td>
              </tr>
            ) : (
              data.payments.map((p, i) => (
                <tr key={p.method}>
                  <td className="n">{i + 1}</td>
                  <td>{p.method}</td>
                  <td className="r">{rupee(p.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="inv-foot">
        <span className="inv-printed">
          Printed on: {billDateTime(printedOn)}
        </span>
        <div className="inv-sign">Signature</div>
      </div>
    </div>
  );
});

"use client";

import { formatDateTime, formatMoney } from "@/lib/format";
import { OrderInvoiceDto } from "@/types/order";
import { forwardRef } from "react";

/** The bill is printed on A5 only. */
export type PaperSize = "A5";

/** Millimetres. Portrait. */
export const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  A5: { w: 148, h: 210 },
};

/**
 * Plain, self-contained CSS (no MUI / Tailwind) so the exact same stylesheet
 * is used by the on-screen preview and by the print iframe — what you see is
 * what the printer gets. Laid out for one A5 page (148 x 210 mm).
 */
export const INVOICE_CSS = `
.inv-sheet{box-sizing:border-box;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;
  line-height:1.3;display:flex;flex-direction:column}
.inv-sheet *{box-sizing:border-box}
.inv-A5{width:148mm;min-height:209mm;padding:7mm 7mm 6mm;font-size:10px}

.inv-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;
  padding-bottom:6px;border-bottom:2px solid #111}
.inv-brand{min-width:0}
.inv-company{font-size:1.9em;font-weight:800;letter-spacing:.2px;line-height:1.1;word-break:break-word}
.inv-type{font-size:1em;color:#444;margin-top:1px}
.inv-branch{margin-top:3px;font-weight:600}
.inv-muted{color:#555}
.inv-title{text-align:right;flex-shrink:0}
.inv-title b{display:block;font-size:1.5em;letter-spacing:1.5px}
.inv-title span{display:block;margin-top:2px;font-weight:700}

.inv-info{display:grid;grid-template-columns:1.15fr 1fr;gap:0;margin-top:6px;
  border:1px solid #999;border-radius:3px}
.inv-info > div{padding:5px 7px}
.inv-info > div + div{border-left:1px solid #999}
.inv-kv{display:flex;gap:6px;padding:1px 0}
.inv-kv span:first-child{color:#555;flex:0 0 auto;min-width:62px}
.inv-kv span:last-child{font-weight:600;word-break:break-word}

.inv-table{width:100%;border-collapse:collapse;margin-top:7px}
.inv-table th{background:#eee;border-top:1px solid #111;border-bottom:1px solid #111;
  padding:4px 5px;text-align:left;font-size:.95em;text-transform:uppercase;letter-spacing:.3px}
.inv-table td{border-bottom:1px solid #ddd;padding:4px 5px;vertical-align:top}
.inv-table tr{break-inside:avoid;page-break-inside:avoid}
.inv-table .n{width:20px;text-align:center;color:#555}
.inv-table .r{text-align:right;white-space:nowrap}

.inv-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;
  break-inside:avoid;page-break-inside:avoid}
.inv-summary h4{margin:0 0 3px;font-size:.95em;text-transform:uppercase;letter-spacing:.4px;
  color:#333;border-bottom:1px solid #ccc;padding-bottom:2px}
.inv-pay .inv-kv span:first-child{min-width:0;flex:1}
.inv-pay .inv-kv span:last-child{text-align:right}
.inv-amt .inv-kv{justify-content:space-between}
.inv-amt .inv-kv span:first-child{min-width:0}
.inv-grand{border-top:1px solid #111;border-bottom:1px solid #111;margin:3px 0;padding:3px 0;
  font-size:1.15em}
.inv-grand span{font-weight:800!important}
.inv-due span:last-child{font-weight:800}

.inv-note{margin-top:auto;padding-top:10px;font-size:.92em;color:#333}
.inv-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;gap:12px;
  break-inside:avoid;page-break-inside:avoid}
.inv-printed{font-size:.9em;color:#555}
.inv-sign{border-top:1px solid #111;min-width:40%;text-align:center;padding-top:3px;font-size:.95em}
@media print{.inv-sheet{box-shadow:none!important;margin:0!important}}
`;

const amount = (n: number) => formatMoney(n);

/** The printable bill. `printedOn` is passed in so preview and print agree. */
export const InvoiceSheet = forwardRef<
  HTMLDivElement,
  { data: OrderInvoiceDto; paper: PaperSize; printedOn: Date }
>(function InvoiceSheet({ data, paper, printedOn }, ref) {
  const ageGender = [
    data.patientAge != null ? `${data.patientAge} yrs` : null,
    data.patientGender,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div ref={ref} className={`inv-sheet inv-${paper}`}>
      <div className="inv-head">
        <div className="inv-brand">
          <div className="inv-company">{data.companyName}</div>
          <div className="inv-type">{data.companyType}</div>
          <div className="inv-branch">
            {data.branchName}
            {data.branchPhone ? ` · ${data.branchPhone}` : ""}
          </div>
          {data.branchAddress && (
            <div className="inv-muted">{data.branchAddress}</div>
          )}
        </div>
        <div className="inv-title">
          <b>BILL</b>
          <span>{data.invoiceNo}</span>
        </div>
      </div>

      <div className="inv-info">
        <div>
          <div className="inv-kv">
            <span>Patient</span>
            <span>{data.patientName}</span>
          </div>
          <div className="inv-kv">
            <span>Age / Gender</span>
            <span>{ageGender || "—"}</span>
          </div>
          <div className="inv-kv">
            <span>Phone</span>
            <span>{data.patientPhone}</span>
          </div>
          <div className="inv-kv">
            <span>Doctor</span>
            <span>{data.doctor?.name ?? "—"}</span>
          </div>
          <div className="inv-kv">
            <span>Referral</span>
            <span>{data.referral?.name ?? "—"}</span>
          </div>
        </div>
        <div>
          <div className="inv-kv">
            <span>Bill No</span>
            <span>{data.billNo}</span>
          </div>
          <div className="inv-kv">
            <span>Date</span>
            <span>{formatDateTime(data.billDate)}</span>
          </div>
          <div className="inv-kv">
            <span>Payment</span>
            <span>{data.paymentMode}</span>
          </div>
          <div className="inv-kv">
            <span>Guardian</span>
            <span>{data.guardianName || "—"}</span>
          </div>
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th className="n">#</th>
            <th>Test Description</th>
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
              <td className="r">{amount(l.rate)}</td>
              <td className="r">{amount(l.less)}</td>
              <td className="r">{amount(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-summary">
        <div className="inv-pay">
          <h4>Payments</h4>
          {data.payments.length === 0 ? (
            <div className="inv-muted">No payment received</div>
          ) : (
            data.payments.map((p) => (
              <div className="inv-kv" key={p.method}>
                <span>{p.method}</span>
                <span>{amount(p.amount)}</span>
              </div>
            ))
          )}
        </div>
        <div className="inv-amt">
          <h4>Amount</h4>
          <div className="inv-kv">
            <span>Subtotal</span>
            <span>{amount(data.subtotal)}</span>
          </div>
          <div className="inv-kv">
            <span>Discount</span>
            <span>{amount(data.discount)}</span>
          </div>
          <div className="inv-kv inv-grand">
            <span>Total</span>
            <span>{amount(data.total)}</span>
          </div>
          <div className="inv-kv">
            <span>Paid</span>
            <span>{amount(data.paid)}</span>
          </div>
          <div className="inv-kv inv-due">
            <span>Due</span>
            <span>{amount(data.due)}</span>
          </div>
        </div>
      </div>

      <div className="inv-note">
        Note: Please bring this receipt while collecting reports. This is a
        computer generated bill.
      </div>

      <div className="inv-foot">
        <span className="inv-printed">
          Printed on: {formatDateTime(printedOn)}
        </span>
        <div className="inv-sign">Signature</div>
      </div>
    </div>
  );
});

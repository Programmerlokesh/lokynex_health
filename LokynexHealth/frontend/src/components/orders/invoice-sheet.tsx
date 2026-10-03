"use client";

import { formatDateTime, formatMoney } from "@/lib/format";
import { OrderInvoiceDto } from "@/types/order";
import { forwardRef } from "react";

export type PaperSize = "A4" | "A5";

/** Millimetres. Portrait. */
export const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
};

/**
 * Plain, self-contained CSS (no MUI / Tailwind) so the exact same stylesheet
 * is used by the on-screen preview and by the print iframe — what you see is
 * what the printer gets.
 */
export const INVOICE_CSS = `
.inv-sheet{box-sizing:border-box;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;
  line-height:1.35;display:flex;flex-direction:column}
.inv-sheet *{box-sizing:border-box}
.inv-A4{width:210mm;min-height:297mm;padding:12mm;font-size:12px}
.inv-A5{width:148mm;min-height:210mm;padding:8mm;font-size:10px}
.inv-head{text-align:center;border-bottom:2px solid #111;padding-bottom:6px;margin-bottom:8px}
.inv-company{font-size:1.7em;font-weight:700;letter-spacing:.3px}
.inv-type{font-size:1.05em;color:#444}
.inv-branch{margin-top:2px;font-weight:600}
.inv-muted{color:#555}
.inv-invno{margin-top:4px;font-weight:700;font-size:1.1em}
.inv-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.inv-box{border:1px solid #bbb;border-radius:4px;padding:6px 8px}
.inv-box h4{margin:0 0 4px;font-size:1em;text-transform:uppercase;letter-spacing:.5px;color:#333;border-bottom:1px solid #ddd;padding-bottom:2px}
.inv-kv{display:flex;justify-content:space-between;gap:8px;padding:1.5px 0}
.inv-kv span:first-child{color:#555;flex-shrink:0}
.inv-kv span:last-child{font-weight:600;text-align:right;word-break:break-word}
.inv-table{width:100%;border-collapse:collapse;margin:4px 0 8px}
.inv-table th,.inv-table td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}
.inv-table th{background:#f0f0f0;font-size:.95em}
.inv-table .r{text-align:right;white-space:nowrap}
.inv-bottom{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.inv-total .inv-kv span:last-child{font-weight:700}
.inv-grand{border-top:1px solid #111;margin-top:3px;padding-top:3px;font-size:1.1em}
.inv-note{font-size:.95em;margin-top:auto;padding-top:10px}
.inv-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px;gap:12px}
.inv-sign{border-top:1px solid #111;min-width:42%;text-align:center;padding-top:3px;font-size:.95em}
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
        <div className="inv-company">{data.companyName}</div>
        <div className="inv-type">{data.companyType}</div>
        <div className="inv-branch">
          Branch: {data.branchName}
          {data.branchPhone ? ` · ${data.branchPhone}` : ""}
        </div>
        {data.branchAddress && (
          <div className="inv-muted">{data.branchAddress}</div>
        )}
        <div className="inv-invno">Invoice No: {data.invoiceNo}</div>
      </div>

      <div className="inv-grid">
        <div className="inv-box">
          <h4>Patient Details</h4>
          <div className="inv-kv">
            <span>Name</span>
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
        <div className="inv-box">
          <h4>Invoice</h4>
          <div className="inv-kv">
            <span>Bill No</span>
            <span>{data.billNo}</span>
          </div>
          <div className="inv-kv">
            <span>Bill Date/Time</span>
            <span>{formatDateTime(data.billDate)}</span>
          </div>
          <div className="inv-kv">
            <span>Payment Mode</span>
            <span>{data.paymentMode}</span>
          </div>
          <div className="inv-kv">
            <span>Profile Guardian</span>
            <span>{data.guardianName || "—"}</span>
          </div>
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Test Description</th>
            <th className="r">Rate</th>
            <th className="r">Less</th>
            <th className="r">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l) => (
            <tr key={l.testId}>
              <td>{data.invoiceNo}</td>
              <td>{l.description}</td>
              <td className="r">{amount(l.rate)}</td>
              <td className="r">{amount(l.less)}</td>
              <td className="r">{amount(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-bottom">
        <div className="inv-box">
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
        <div className="inv-box inv-total">
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
          <div className="inv-kv">
            <span>Due</span>
            <span>{amount(data.due)}</span>
          </div>
        </div>
      </div>

      <div className="inv-note">
        <div>
          Note: Please bring receipt while collecting reports. This is a
          computer generated bill
        </div>
        <div className="inv-muted" style={{ marginTop: 3 }}>
          Printed on: {formatDateTime(printedOn)}
        </div>
      </div>

      <div className="inv-foot">
        <span />
        <div className="inv-sign">Signature</div>
      </div>
    </div>
  );
});

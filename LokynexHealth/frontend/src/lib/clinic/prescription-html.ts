import { buildReportPdf } from "@/lib/blood-report/pdf";
import { escapeHtml as esc } from "@/lib/report-editor/sanitize";
import type { ClinicMe, Prescription } from "@/types/clinic";

// ---------------------------------------------------------------------------
// Prescription layout. ONE source of truth for the on-screen preview, the
// browser print and the PDF (so WhatsApp gets exactly what the doctor sees).
// Three blocks — header / body / footer — so header + footer repeat on every
// page of a long prescription. Elements with data-keep are never cut in half.
// ---------------------------------------------------------------------------

export interface RxParts {
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
}

const CSS = `
.rx{font-family:"Segoe UI","Noto Sans","Noto Sans Bengali",Roboto,Arial,sans-serif;color:#1b2430;font-size:12.5px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rx *{box-sizing:border-box}
.rx-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:10px 0 12px;border-bottom:3px solid var(--a)}
.rx-brand{display:flex;gap:12px;align-items:center;min-width:0}
.rx-logo{width:58px;height:58px;object-fit:contain;border-radius:10px}
.rx-clinic{font-size:22px;font-weight:800;letter-spacing:.2px;color:var(--a);line-height:1.15}
.rx-tag{font-size:11px;color:#5b6675;margin-top:2px}
.rx-addr{font-size:10.5px;color:#5b6675;margin-top:5px;line-height:1.45}
.rx-doc{text-align:right;min-width:210px;max-width:290px}
.rx-doc-name{font-size:17px;font-weight:800;color:#12202f}
.rx-doc-q{font-size:11px;color:#3a4756;margin-top:1px}
.rx-doc-s{display:inline-block;margin-top:5px;padding:1px 9px;border-radius:99px;background:var(--a-soft);color:var(--a);font-size:10.5px;font-weight:700}
.rx-doc-r{font-size:10.5px;color:#5b6675;margin-top:4px}
.rx-pt{margin-top:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px 14px;padding:10px 14px;border:1px solid var(--a-line);background:var(--a-soft2);border-radius:12px}
.rx-pt div{min-width:0}
.rx-k{font-size:9px;text-transform:uppercase;letter-spacing:.7px;color:#6b7684;font-weight:700}
.rx-v{font-size:12.5px;font-weight:600;color:#12202f;word-break:break-word}
.rx-span2{grid-column:span 2}
.rx-vitals{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px}
.rx-chip{padding:3px 10px;border-radius:99px;border:1px solid var(--a-line);font-size:11px;background:#fff}
.rx-chip b{color:var(--a)}
.rx-sec{margin-top:13px}
.rx-h{font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:800;color:var(--a);margin-bottom:4px;display:flex;align-items:center;gap:8px}
.rx-h:after{content:"";flex:1;height:1px;background:var(--a-line)}
.rx-txt{white-space:pre-wrap;word-break:break-word;font-size:12.5px}
.rx-sym{font-size:34px;line-height:1;font-weight:700;color:var(--a);font-family:Georgia,"Times New Roman",serif;margin:12px 0 2px}
.rx-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
.rx-tbl th{background:var(--a);color:#fff;text-align:left;font-size:10px;letter-spacing:.6px;text-transform:uppercase;padding:7px 9px;font-weight:700}
.rx-tbl th:first-child{border-radius:9px 0 0 0}.rx-tbl th:last-child{border-radius:0 9px 0 0}
.rx-tbl td{padding:8px 9px;border-bottom:1px solid #e6ebf0;vertical-align:top}
.rx-tbl tr:nth-child(even) td{background:#f8fafb}
.rx-n{width:26px;color:#6b7684;font-weight:700}
.rx-mn{font-weight:800;font-size:13px;color:#10202e}
.rx-form{font-size:9.5px;font-weight:700;color:var(--a);background:var(--a-soft);padding:0 6px;border-radius:5px;margin-left:6px;vertical-align:1px}
.rx-comp{font-size:10.8px;color:#5b6675;font-style:italic;margin-top:1px}
.rx-dose{font-weight:800;color:#10202e;white-space:nowrap}
.rx-tests{display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;padding:0;margin:0;list-style:none}
.rx-tests li{display:flex;gap:7px;align-items:flex-start;padding:5px 9px;border:1px solid #e6ebf0;border-radius:9px;background:#fff}
.rx-tests .rx-i{min-width:18px;height:18px;border-radius:99px;background:var(--a);color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:18px;margin-top:1px}
.rx-tn{font-weight:700}.rx-tnote{font-size:10.5px;color:#5b6675}
.rx-follow{margin-top:12px;display:inline-block;padding:6px 14px;border-radius:10px;background:var(--a-soft);color:var(--a);font-weight:700;font-size:12px}
.rx-foot{border-top:3px solid var(--a);padding-top:7px}
.rx-sign{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:0 0 8px}
.rx-note{font-size:10.5px;color:#5b6675;max-width:60%;white-space:pre-wrap}
.rx-sigbox{text-align:center;min-width:190px}
.rx-sigline{border-top:1px solid #8a95a3;padding-top:3px;font-size:11px;font-weight:700;color:#12202f}
.rx-sigsub{font-size:9.5px;color:#6b7684}
.rx-fbar{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;font-size:10px;color:#5b6675;padding-top:6px;border-top:1px dashed #cfd6de}
.rx-rxno{font-size:9.5px;color:#8a95a3;text-align:right;margin-top:2px}
@media (max-width:640px){.rx-pt{grid-template-columns:repeat(2,1fr)}.rx-tests{grid-template-columns:1fr}}
`;

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [14, 124, 134];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function vars(accent: string): string {
  const safe = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#0E7C86";
  const [r, g, b] = hexToRgb(safe);
  return `--a:${safe};--a-soft:rgba(${r},${g},${b},.12);--a-soft2:rgba(${r},${g},${b},.05);--a-line:rgba(${r},${g},${b},.30)`;
}

const wrap = (inner: string, accent: string) =>
  `<style>${CSS}</style><div class="rx" style="${vars(accent)}">${inner}</div>`;

export function fmtRxDate(ymd: string | null | undefined): string {
  if (!ymd) return "";
  const d = new Date(`${ymd.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const doctorTitle = (name: string) =>
  /^dr\.?\s/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}`;
const has = (s?: string | null) => !!s && s.trim() !== "";
const field = (k: string, v: string, cls = "") =>
  `<div class="${cls}"><div class="rx-k">${esc(k)}</div><div class="rx-v">${esc(v || "—")}</div></div>`;

export function buildRxParts(rx: Prescription, clinic: ClinicMe): RxParts {
  const accent = clinic.accentColor;

  // ---------------- header ----------------
  const addr = [clinic.address, clinic.pincode].filter(has).join(" - ");
  const contact = [clinic.phone && `Ph: ${clinic.phone}`, clinic.email]
    .filter(Boolean)
    .join("  |  ");
  const headerHtml = wrap(
    `<div class="rx-head">
       <div class="rx-brand">
         ${clinic.logoUrl ? `<img class="rx-logo" src="${esc(clinic.logoUrl)}" alt="" />` : ""}
         <div style="min-width:0">
           <div class="rx-clinic">${esc(clinic.clinicName)}</div>
           ${has(clinic.tagline) ? `<div class="rx-tag">${esc(clinic.tagline!)}</div>` : ""}
           <div class="rx-addr">${esc(addr)}${contact ? `<br/>${esc(contact)}` : ""}</div>
         </div>
       </div>
       <div class="rx-doc">
         <div class="rx-doc-name">${esc(doctorTitle(rx.doctorName))}</div>
         ${has(rx.doctorQualification) ? `<div class="rx-doc-q">${esc(rx.doctorQualification!)}</div>` : ""}
         ${has(rx.doctorSpecialization) ? `<div class="rx-doc-s">${esc(rx.doctorSpecialization!)}</div>` : ""}
         ${has(rx.doctorRegNo) ? `<div class="rx-doc-r">Reg. No: ${esc(rx.doctorRegNo!)}</div>` : ""}
       </div>
     </div>`,
    accent,
  );

  // ---------------- body ----------------
  const ageSex = [
    rx.patientAge != null ? `${rx.patientAge} yrs` : "",
    rx.patientGender ?? "",
  ]
    .filter(Boolean)
    .join(" / ");
  const address = [rx.patientAddress, rx.patientPincode]
    .filter(has)
    .join(" - ");

  const vitals: [string, string | null | undefined, string][] = [
    ["BP", rx.bp, "mmHg"],
    ["Pulse", rx.pulse, "/min"],
    ["Temp", rx.temperature, "°F"],
    ["Weight", rx.weight, "kg"],
    ["SpO₂", rx.spo2, "%"],
  ];
  const vitalChips = vitals
    .filter(([, v]) => has(v))
    .map(
      ([k, v, u]) =>
        `<span class="rx-chip"><b>${esc(k)}</b> ${esc(v!)} ${u}</span>`,
    )
    .join("");

  const textBlock = (title: string, v?: string | null) =>
    has(v)
      ? `<div class="rx-sec" data-keep><div class="rx-h">${esc(title)}</div><div class="rx-txt">${esc(v!)}</div></div>`
      : "";

  const meds = rx.items
    .map(
      (m, i) => `<tr data-keep>
        <td class="rx-n">${i + 1}</td>
        <td><div class="rx-mn">${esc(m.name)}${has(m.form) ? `<span class="rx-form">${esc(m.form!)}</span>` : ""}</div>
            ${has(m.composition) ? `<div class="rx-comp">${esc(m.composition!)}</div>` : ""}</td>
        <td class="rx-dose">${esc(m.dosage ?? "")}</td>
        <td>${esc(m.duration ?? "")}</td>
        <td>${esc(m.instructions ?? "")}</td></tr>`,
    )
    .join("");

  const medicineBlock = rx.items.length
    ? `<div class="rx-sym" data-keep>℞</div>
       <table class="rx-tbl"><thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Duration</th><th>Instructions</th></tr></thead>
       <tbody>${meds}</tbody></table>`
    : "";

  const testBlock = rx.tests.length
    ? `<div class="rx-sec"><div class="rx-h" data-keep>Investigations advised</div>
       <ul class="rx-tests">${rx.tests
         .map(
           (t, i) =>
             `<li data-keep><span class="rx-i">${i + 1}</span><div><div class="rx-tn">${esc(t.name)}</div>${
               has(t.note) ? `<div class="rx-tnote">${esc(t.note!)}</div>` : ""
             }</div></li>`,
         )
         .join("")}</ul></div>`
    : "";

  const follow =
    rx.followUpDate || has(rx.followUpNote)
      ? `<div class="rx-follow" data-keep>Follow-up: ${esc(fmtRxDate(rx.followUpDate) || "as advised")}${
          has(rx.followUpNote) ? ` · ${esc(rx.followUpNote!)}` : ""
        }</div>`
      : "";

  const bodyHtml = wrap(
    `<div class="rx-pt" data-keep>
       ${field("Patient", rx.patientName, "rx-span2")}
       ${field("Age / Sex", ageSex)}
       ${field("Date", fmtRxDate(rx.visitDate))}
       ${field("Mobile", rx.patientPhone)}
       ${field("Rx No.", rx.rxNo)}
       ${field("Referred by", rx.referral ?? "")}
       ${address ? field("Address", address, "rx-span2") : ""}
     </div>
     ${vitalChips ? `<div class="rx-vitals" data-keep>${vitalChips}</div>` : ""}
     ${textBlock("Chief complaints", rx.chiefComplaints)}
     ${textBlock("Diagnosis", rx.diagnosis)}
     ${medicineBlock}
     ${testBlock}
     ${textBlock("Advice", rx.generalAdvice)}
     ${follow}`,
    accent,
  );

  // ---------------- footer ----------------
  const footerHtml = wrap(
    `<div class="rx-foot">
       <div class="rx-sign">
         <div class="rx-note">${has(clinic.footerNote) ? esc(clinic.footerNote!) : ""}</div>
         <div class="rx-sigbox"><div style="height:34px"></div>
           <div class="rx-sigline">${esc(doctorTitle(rx.doctorName))}</div>
           <div class="rx-sigsub">Signature &amp; seal</div></div>
       </div>
       <div class="rx-fbar">
         <span>${esc(clinic.clinicName)}</span>
         ${has(clinic.registrationNo) ? `<span>Clinic Reg. ${esc(clinic.registrationNo!)}</span>` : ""}
         ${clinic.phone ? `<span>${esc(clinic.phone)}</span>` : ""}
         ${clinic.email ? `<span>${esc(clinic.email)}</span>` : ""}
       </div>
     </div>`,
    accent,
  );

  return { headerHtml, bodyHtml, footerHtml };
}

/** The whole prescription as one block of HTML (used by the on-screen preview). */
export const rxPreviewHtml = (p: RxParts) =>
  p.headerHtml + p.bodyHtml + p.footerHtml;

/** PDF with header + footer on every page (re-uses the lab report PDF engine). */
export function rxToPdf(parts: RxParts): Promise<Blob> {
  return buildReportPdf({ ...parts, headerMm: 0, footerMm: 0 });
}

/** Browser print. thead/tfoot repeat on every printed page, rows never split. */
export function printRx(parts: RxParts, title: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${esc(title)}</title>
    <style>@page{size:A4;margin:9mm 10mm}html,body{margin:0;padding:0;background:#fff}
    table.sheet{width:100%;border-collapse:collapse}table.sheet>thead>tr>td,table.sheet>tbody>tr>td,table.sheet>tfoot>tr>td{padding:0;border:0}
    thead{display:table-header-group}tfoot{display:table-footer-group}
    .rx-tbl tr,[data-keep]{page-break-inside:avoid;break-inside:avoid}</style></head>
    <body><table class="sheet"><thead><tr><td>${parts.headerHtml}</td></tr></thead>
    <tbody><tr><td>${parts.bodyHtml}</td></tr></tbody>
    <tfoot><tr><td>${parts.footerHtml}</td></tr></tfoot></table></body></html>`);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  const go = async () => {
    const imgs = Array.from(doc.images);
    await Promise.all(
      imgs.map((i) =>
        i.complete
          ? null
          : new Promise((r) => {
              i.onload = i.onerror = () => r(null);
            }),
      ),
    );
    iframe.contentWindow?.focus();
    iframe.contentWindow?.addEventListener("afterprint", cleanup);
    iframe.contentWindow?.print();
    setTimeout(cleanup, 120_000);
  };
  setTimeout(go, 150);
}

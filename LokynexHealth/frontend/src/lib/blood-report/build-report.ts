import { escapeHtml, sanitizeHtml } from "@/lib/report-editor/sanitize";
import {
  BloodReportFormDto,
  LabReportSettingsDto,
  ResultFlag,
} from "@/types/blood-report";

export const STRUCTURED_MARKER = "<!--lokynex:structured-->";

export interface ReportRow {
  section: string;
  name: string;
  value: string;
  unit: string;
  reference: string;
  flag: ResultFlag;
  bold: boolean;
}

export interface ReportMeta {
  sampleId: string;
  specimen: string;
  method: string;
  machine: string;
  reagent: string;
  remarks: string;
  /** ISO strings */
  collectedAt: string | null;
  reportedAt: string | null;
}

export interface PrintParts {
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
}

export interface ReportParts extends PrintParts {
  /** > 0 means "blank space" mode: reserve this much paper (mm), draw nothing. */
  headerMm: number;
  footerMm: number;
}

const e = escapeHtml;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** {{branch_name}} {{branch_address}} {{branch_phone}} {{lab_name}} */
export function mergePlaceholders(
  html: string,
  form: BloodReportFormDto,
  labName?: string | null,
): string {
  const map: Record<string, string> = {
    branch_name: form.branchName ?? "",
    branch_address: form.branchAddress ?? "",
    branch_phone: form.branchPhone ?? "",
    lab_name: labName ?? form.branchName ?? "",
  };
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) =>
    k in map ? e(map[k]) : "",
  );
}

function flagMark(f: ResultFlag): string {
  if (f === "Low") return " L";
  if (f === "High") return " H";
  if (f === "Critical") return " ✱";
  return "";
}

function infoPair(label: string, value: string | null | undefined): string {
  return `<td style="padding:3px 6px;font-size:12px;width:50%;vertical-align:top"><span style="color:#555">${e(label)}:</span> <b>${e(value || "—")}</b></td>`;
}

function buildBody(args: {
  form: BloodReportFormDto;
  rows: ReportRow[];
  meta: ReportMeta;
  settings: LabReportSettingsDto;
}): string {
  const { form, meta, settings } = args;
  const rows = args.rows.filter((r) => r.value.trim() !== "");

  const sex = form.patientGender ?? "—";
  const ageSex = `${form.patientAge ?? "—"}${form.patientAge !== null ? " Years" : ""} / ${sex}`;

  const patient = `<table data-plain="1" data-keep="1" style="width:100%;border-collapse:collapse;border-top:1px solid #333;border-bottom:1px solid #333;margin:6px 0">
<tr>${infoPair("Patient Name", form.patientName)}${infoPair("Order No", form.orderNumber)}</tr>
<tr>${infoPair("Age / Sex", ageSex)}${infoPair("Patient ID", form.patientCode)}</tr>
<tr>${infoPair("Referred By", form.doctorName ?? form.referralName ?? "Self")}${infoPair("Phone", form.patientPhone)}</tr>
<tr>${infoPair("Sample Collected", fmtDate(meta.collectedAt))}${infoPair("Reported On", fmtDate(meta.reportedAt))}</tr>
${meta.sampleId ? `<tr>${infoPair("Sample ID", meta.sampleId)}<td></td></tr>` : ""}
</table>`;

  const title = `<div data-keep="1" style="text-align:center;margin:12px 0 6px">
<div style="font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.5px">${e(form.testName)}</div>
${form.departmentName ? `<div style="font-size:11px;color:#555">Department of ${e(form.departmentName)}</div>` : ""}
</div>`;

  const detailPairs: [string, string][] = [
    ["Specimen", meta.specimen],
    ["Method", meta.method],
    ["Analyser / Machine", meta.machine],
    ["Reagent / Chemical", meta.reagent],
  ];
  const shown = detailPairs.filter(([, v]) => v.trim() !== "");
  let details = "";
  if (shown.length > 0) {
    const cells = shown.map(([l, v]) => infoPair(l, v));
    const trs: string[] = [];
    for (let i = 0; i < cells.length; i += 2) {
      trs.push(`<tr>${cells[i]}${cells[i + 1] ?? "<td></td>"}</tr>`);
    }
    details = `<table data-plain="1" data-keep="1" style="width:100%;border-collapse:collapse;background:#f7f7f7;margin:4px 0 8px">${trs.join("")}</table>`;
  }

  let lastSection: string | null = null;
  const bodyRows = rows
    .map((r) => {
      let out = "";
      if (r.section !== lastSection) {
        lastSection = r.section;
        if (r.section) {
          out += `<tr data-keep="1"><td colspan="4" style="padding:6px;font-weight:700;font-size:12px;background:#ececec;border-bottom:1px solid #bbb">${e(r.section)}</td></tr>`;
        }
      }
      const abnormal = r.flag !== "Normal";
      const color = abnormal ? "#b71c1c" : "#111";
      const weight = abnormal || r.bold ? "700" : "400";
      out += `<tr data-keep="1">
<td style="padding:5px 6px;font-size:12.5px;border-bottom:1px solid #e3e3e3;${r.bold ? "font-weight:700;" : ""}">${e(r.name)}</td>
<td style="padding:5px 6px;font-size:12.5px;border-bottom:1px solid #e3e3e3;color:${color};font-weight:${weight}">${e(r.value)}${flagMark(r.flag)}</td>
<td style="padding:5px 6px;font-size:12px;border-bottom:1px solid #e3e3e3;color:#444">${e(r.unit)}</td>
<td style="padding:5px 6px;font-size:12px;border-bottom:1px solid #e3e3e3;color:#444">${e(r.reference)}</td>
</tr>`;
      return out;
    })
    .join("");

  const results = `<table data-plain="1" style="width:100%;border-collapse:collapse;margin-top:4px">
<thead><tr data-keep="1">
<th style="text-align:left;padding:6px;font-size:11px;text-transform:uppercase;border-top:1px solid #111;border-bottom:1px solid #111;width:34%">Test</th>
<th style="text-align:left;padding:6px;font-size:11px;text-transform:uppercase;border-top:1px solid #111;border-bottom:1px solid #111;width:22%">Result</th>
<th style="text-align:left;padding:6px;font-size:11px;text-transform:uppercase;border-top:1px solid #111;border-bottom:1px solid #111;width:16%">Unit</th>
<th style="text-align:left;padding:6px;font-size:11px;text-transform:uppercase;border-top:1px solid #111;border-bottom:1px solid #111;width:28%">Reference Range</th>
</tr></thead>
<tbody>${bodyRows || `<tr><td colspan="4" style="padding:14px;text-align:center;color:#777">No results entered.</td></tr>`}</tbody>
</table>`;

  const legend = rows.some(
    (r) => r.flag === "Low" || r.flag === "High" || r.flag === "Critical",
  )
    ? `<div data-keep="1" style="font-size:10.5px;color:#555;margin-top:4px">L = Low, H = High, ✱ = Critical value</div>`
    : "";

  const remarks = meta.remarks.trim()
    ? `<div data-keep="1" style="margin-top:10px;font-size:12px"><b>Remarks / Interpretation:</b><div style="white-space:pre-wrap;margin-top:2px">${e(meta.remarks)}</div></div>`
    : "";

  const sig = `<div data-keep="1" style="margin-top:18px">
<div style="text-align:center;font-size:11px;color:#555;margin-bottom:10px">*** End of Report ***</div>
<div style="text-align:right;font-size:12px">
${settings.signatureImage ? `<img src="${e(settings.signatureImage)}" alt="" style="height:48px;max-width:200px;object-fit:contain"/><br/>` : '<div style="height:36px"></div>'}
${settings.pathologistName ? `<b>${e(settings.pathologistName)}</b><br/>` : ""}
${settings.pathologistQualification ? `${e(settings.pathologistQualification)}<br/>` : ""}
${settings.registrationNo ? `Reg. No: ${e(settings.registrationNo)}` : ""}
</div></div>`;

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111">${patient}${title}${details}${results}${legend}${remarks}${sig}</div>`;
}

export function buildReportParts(args: {
  form: BloodReportFormDto;
  rows: ReportRow[];
  meta: ReportMeta;
  settings: LabReportSettingsDto;
  useLetterhead: boolean;
  blankHeaderMm: number;
  blankFooterMm: number;
  labName?: string | null;
}): ReportParts {
  const { form, settings, useLetterhead } = args;

  const bodyHtml = buildBody(args);

  if (useLetterhead) {
    const header = settings.headerHtml
      ? sanitizeHtml(mergePlaceholders(settings.headerHtml, form, args.labName))
      : "";
    const footer = settings.footerHtml
      ? sanitizeHtml(mergePlaceholders(settings.footerHtml, form, args.labName))
      : "";
    return {
      headerHtml: header,
      bodyHtml,
      footerHtml: footer,
      headerMm: 0,
      footerMm: 0,
    };
  }

  // Blank space: pre-printed letterhead paper
  const hm = Math.max(0, Math.min(100, args.blankHeaderMm));
  const fm = Math.max(0, Math.min(100, args.blankFooterMm));
  return {
    headerHtml: `<div style="height:${hm}mm"></div>`,
    bodyHtml,
    footerHtml: `<div style="height:${fm}mm"></div>`,
    headerMm: hm,
    footerMm: fm,
  };
}

/** Print document: header/footer repeat on every printed page (thead / tfoot). */
export function buildPrintDocument(title: string, parts: PrintParts): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(title)}</title>
<style>
@page{size:A4;margin:8mm 10mm}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
img{max-width:100%}
table.page{width:100%;border-collapse:collapse}
table.page>thead{display:table-header-group}
table.page>tfoot{display:table-footer-group}
table.page>thead>tr>td,table.page>tbody>tr>td,table.page>tfoot>tr>td{padding:0;border:0}
tr{page-break-inside:avoid}
</style></head><body>
<table class="page">
<thead><tr><td>${parts.headerHtml}</td></tr></thead>
<tbody><tr><td>${parts.bodyHtml}</td></tr></tbody>
<tfoot><tr><td>${parts.footerHtml}</td></tr></tfoot>
</table></body></html>`;
}

export function reportFileName(form: BloodReportFormDto): string {
  const clean = (s: string) =>
    s.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `${clean(form.patientName)}_${clean(form.testName)}_${clean(form.orderNumber)}.pdf`;
}

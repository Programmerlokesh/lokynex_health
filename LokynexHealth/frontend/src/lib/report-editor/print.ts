import { escapeHtml, sanitizeHtml } from "@/lib/report-editor/sanitize";

export const REPORT_CSS = `
*{box-sizing:border-box}
body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;color:#111;background:#fff}
.sheet{min-height:270mm;display:flex;flex-direction:column}
.body{flex:1}
p{margin:2px 0 6px}
h2{font-size:20px}
h3{font-size:16px}
h4{margin:10px 0 2px;font-size:13px;text-transform:uppercase}
hr{border:0;border-top:1px solid #333;margin:6px 0}
img{max-width:100%;height:auto}
table{border-collapse:collapse;width:100%}
table:not([data-plain]) td,table:not([data-plain]) th{border:1px solid #444;padding:4px 6px;vertical-align:top}
td,th{padding:2px 6px;vertical-align:top}
@page{size:A4;margin:12mm}
`;

/** A4 portrait. Every part is sanitised again before it touches the print iframe. */
export function buildReportPrintHtml(parts: {
  title: string;
  header: string | null | undefined;
  body: string | null | undefined;
  footer: string | null | undefined;
}): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(parts.title)}</title>
<style>${REPORT_CSS}</style></head><body>
<div class="sheet">
<div class="header">${sanitizeHtml(parts.header ?? "")}</div>
<div class="body">${sanitizeHtml(parts.body ?? "")}</div>
<div class="footer">${sanitizeHtml(parts.footer ?? "")}</div>
</div></body></html>`;
}

/** Escapes text before it is placed inside printed HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Prints an HTML string through a hidden iframe, so the app chrome (sidebar,
 * dialogs) can never leak onto paper. A4 portrait, 12mm margins.
 */
export function printHtmlDocument(title: string, bodyHtml: string): void {
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
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
@page{size:A4 portrait;margin:12mm}
html,body{margin:0;padding:0;background:#fff;color:#111;
  font-family:"Noto Sans Bengali","Segoe UI",Arial,sans-serif;font-size:13px}
h1{font-size:20px;margin:0 0 4px}
.meta{margin:0 0 14px;font-size:13px;line-height:1.6}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #444;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#eee;font-size:12px}
td.num,th.num{text-align:center;white-space:nowrap}
tr{page-break-inside:avoid}
.foot{margin-top:12px;font-size:12px;color:#444}
</style></head><body>${bodyHtml}</body></html>`,
  );
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup);

  // Give the iframe one frame to lay out before the print dialog opens.
  setTimeout(() => {
    win.focus();
    win.print();
  }, 150);
}

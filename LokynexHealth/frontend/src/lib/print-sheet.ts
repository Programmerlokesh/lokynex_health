import {
  INVOICE_CSS,
  PAPER_MM,
  PaperSize,
} from "@/components/orders/invoice-sheet";

/**
 * Prints one DOM node on its own page size through a hidden iframe, so the
 * app chrome (sidebar, dialog, scaling transform) can never leak onto paper.
 */
export function printSheet(node: HTMLElement, paper: PaperSize): void {
  const { w, h } = PAPER_MM[paper];
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
    `<!doctype html><html><head><meta charset="utf-8"><title>Bill</title>
<style>
@page{size:${w}mm ${h}mm;margin:0}
html,body{margin:0;padding:0;background:#fff}
${INVOICE_CSS}
</style></head><body>${node.outerHTML}</body></html>`,
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

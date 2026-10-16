// A4 landscape at 96 dpi
const PAGE_W_PX = 1123;
const MM_PX = PAGE_W_PX / 297;
const SIDE_MM = 8;
const TOP_MM = 8;
const BOTTOM_MM = 10;
const PAGE_H_MM = 210;
const MAX_CANVAS_AREA = 16_000_000; // safe for iOS Safari

/**
 * Turns the report fragment (<style> + .cr content) into an A4-landscape PDF Blob.
 * Pages are cut only at the bottom of a [data-keep] row, so a row is never split.
 */
export async function buildCommissionPdf(fragmentHtml: string): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const host = document.createElement("div");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "z-index:-1",
    "pointer-events:none",
    `width:${PAGE_W_PX}px`,
    "box-sizing:border-box",
    `padding:0 ${SIDE_MM * MM_PX}px`,
    "background:#fff",
  ].join(";");
  host.innerHTML = fragmentHtml;
  document.body.appendChild(host);

  try {
    const cssHeight = Math.max(1, host.scrollHeight);
    const hostTop = host.getBoundingClientRect().top;
    const keeps = Array.from(
      host.querySelectorAll<HTMLElement>("[data-keep]"),
    ).map((el) => el.getBoundingClientRect().bottom - hostTop);

    const scale = Math.max(
      1,
      Math.min(2, Math.sqrt(MAX_CANVAS_AREA / (PAGE_W_PX * cssHeight))),
    );
    const canvas = await html2canvas(host, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    const areaPx = (PAGE_H_MM - TOP_MM - BOTTOM_MM) * MM_PX;

    // Where does each page end? (largest row-bottom that still fits)
    const slices: [number, number][] = [];
    let start = 0;
    while (start < cssHeight - 1) {
      let end = Math.min(start + areaPx, cssHeight);
      if (end < cssHeight) {
        let best = -1;
        for (const k of keeps) {
          if (k > start + areaPx * 0.3 && k <= end + 0.5 && k > best) best = k;
        }
        if (best > 0) end = best;
      }
      slices.push([start, end]);
      start = end;
    }
    if (slices.length === 0) slices.push([0, cssHeight]);

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "landscape",
      compress: true,
    });

    slices.forEach(([s, e], i) => {
      if (i > 0) pdf.addPage();
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = Math.max(1, Math.round((e - s) * scale));
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("Could not create PDF page.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(
        canvas,
        0,
        Math.round(s * scale),
        canvas.width,
        out.height,
        0,
        0,
        out.width,
        out.height,
      );
      pdf.addImage(
        out.toDataURL("image/jpeg", 0.92),
        "JPEG",
        0,
        TOP_MM,
        297,
        (e - s) / MM_PX,
      );
      pdf.setFontSize(7.5);
      pdf.setTextColor(120);
      pdf.text(`Page ${i + 1} of ${slices.length}`, 297 - SIDE_MM, 207, {
        align: "right",
      });
    });

    return pdf.output("blob");
  } finally {
    host.remove();
  }
}

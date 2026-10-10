import type { ReportParts } from "@/lib/blood-report/build-report";

// A4 at 96 dpi
const PAGE_W_PX = 794;
const MM_PX = PAGE_W_PX / 210;
const SIDE_MM = 10;
const TOP_MM = 8;
const BOTTOM_MM = 8;
const MAX_CANVAS_AREA = 16_000_000; // safe for iOS Safari

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

interface Rendered {
  canvas: HTMLCanvasElement;
  cssHeight: number;
  scale: number;
  /** bottoms (css px) of every [data-keep] block = safe places to break a page */
  keeps: number[];
}

async function renderBlock(html: string): Promise<Rendered> {
  const { default: html2canvas } = await import("html2canvas");

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
    "font-family:Arial,Helvetica,sans-serif",
    "color:#111",
  ].join(";");
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    await waitForImages(host);

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
    return { canvas, cssHeight, scale, keeps };
  } finally {
    host.remove();
  }
}

function cropToJpeg(
  src: HTMLCanvasElement,
  yPx: number,
  hPx: number,
  quality = 0.92,
): string {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = Math.max(1, Math.round(hPx));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Could not create PDF page.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(
    src,
    0,
    Math.round(yPx),
    src.width,
    out.height,
    0,
    0,
    out.width,
    out.height,
  );
  return out.toDataURL("image/jpeg", quality);
}

/** Builds an A4 PDF (header + footer on every page, rows never cut in half). */
export async function buildReportPdf(parts: ReportParts): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  const blankHeader = parts.headerMm > 0;
  const blankFooter = parts.footerMm > 0;

  const hasHeader = !blankHeader && parts.headerHtml.trim() !== "";
  const hasFooter = !blankFooter && parts.footerHtml.trim() !== "";

  const header = hasHeader ? await renderBlock(parts.headerHtml) : null;
  const footer = hasFooter ? await renderBlock(parts.footerHtml) : null;
  const body = await renderBlock(parts.bodyHtml);

  const headerMm = blankHeader
    ? parts.headerMm
    : header
      ? header.cssHeight / MM_PX
      : 0;
  const footerMm = blankFooter
    ? parts.footerMm
    : footer
      ? footer.cssHeight / MM_PX
      : 0;

  const bodyTopMm = TOP_MM + headerMm + (headerMm > 0 ? 2 : 0);
  const bodyBottomMm = 297 - BOTTOM_MM - footerMm - (footerMm > 0 ? 2 : 0);
  const areaMm = bodyBottomMm - bodyTopMm;
  if (areaMm < 60) {
    throw new Error(
      "Header and footer space are too big. Reduce them and try again.",
    );
  }
  const areaPx = areaMm * MM_PX;

  // ---- decide where each page ends ----
  const slices: [number, number][] = [];
  let start = 0;
  while (start < body.cssHeight - 1) {
    let end = Math.min(start + areaPx, body.cssHeight);
    if (end < body.cssHeight) {
      const candidates = body.keeps.filter(
        (k) => k > start + areaPx * 0.3 && k <= end + 0.5,
      );
      if (candidates.length > 0) end = Math.max(...candidates);
    }
    slices.push([start, end]);
    start = end;
  }
  if (slices.length === 0) slices.push([0, body.cssHeight]);

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });
  const headerImg = header
    ? cropToJpeg(header.canvas, 0, header.canvas.height, 0.95)
    : null;
  const footerImg = footer
    ? cropToJpeg(footer.canvas, 0, footer.canvas.height, 0.95)
    : null;

  slices.forEach(([s, en], i) => {
    if (i > 0) pdf.addPage();

    if (headerImg && header) {
      pdf.addImage(headerImg, "JPEG", 0, TOP_MM, 210, header.cssHeight / MM_PX);
    }

    const img = cropToJpeg(body.canvas, s * body.scale, (en - s) * body.scale);
    pdf.addImage(img, "JPEG", 0, bodyTopMm, 210, (en - s) / MM_PX);

    if (footerImg && footer) {
      pdf.addImage(
        footerImg,
        "JPEG",
        0,
        297 - BOTTOM_MM - footer.cssHeight / MM_PX,
        210,
        footer.cssHeight / MM_PX,
      );
    }

    if (slices.length > 1) {
      pdf.setFontSize(7.5);
      pdf.setTextColor(120);
      pdf.text(`Page ${i + 1} of ${slices.length}`, 210 - SIDE_MM, 297 - 3.5, {
        align: "right",
      });
    }
  });

  return pdf.output("blob");
}

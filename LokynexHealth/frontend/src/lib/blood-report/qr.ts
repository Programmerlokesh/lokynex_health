/**
 * QR code printed on every blood report.
 * Scan => /r/<token> opens the full report on the phone (no login).
 */

/** 32 hex chars (128 bit) - same format the API accepts. */
export function generateReportToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Full link the QR points to. */
export function publicReportUrl(token: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    window.location.origin;
  return `${origin}/r/${token}`;
}

/** PNG data-URL of the QR (embedded in the report HTML, so print + PDF both work). */
export async function makeReportQrDataUrl(token: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(publicReportUrl(token), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

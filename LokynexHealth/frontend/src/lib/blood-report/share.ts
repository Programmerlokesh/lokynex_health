/** Indian mobile number -> 91XXXXXXXXXX (digits only). Returns null when invalid. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) return `91${d}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export type ShareResult = "shared" | "opened" | "cancelled";

/**
 * Mobile: opens the phone's share sheet with the PDF attached (pick WhatsApp).
 * Desktop: downloads the PDF and opens WhatsApp chat with the patient's number
 * (the PDF must then be attached by hand — WhatsApp does not allow auto-attach from a link).
 */
export async function shareOnWhatsApp(args: {
  blob: Blob;
  filename: string;
  phone: string; // normalized 91XXXXXXXXXX
  message: string;
}): Promise<ShareResult> {
  const { blob, filename, phone, message } = args;
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (
    isMobileDevice() &&
    typeof nav.share === "function" &&
    nav.canShare?.({ files: [file] })
  ) {
    try {
      await nav.share({ files: [file], title: filename, text: message });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError")
        return "cancelled";
      // any other error -> fall back to link below
    }
  }

  downloadBlob(blob, filename);
  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );
  return "opened";
}

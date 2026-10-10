const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Picks an image file, shrinks it (so it stays small in the DB) and returns a data URL. */
export async function fileToDataUrl(
  file: File,
  opts: {
    maxWidth: number;
    mime?: "image/jpeg" | "image/png";
    quality?: number;
  },
): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG or WEBP image.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image is too large. Please choose one under 8 MB.");
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read this image."));
      el.src = url;
    });

    const ratio = Math.min(1, opts.maxWidth / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process this image.");

    const mime = opts.mime ?? "image/jpeg";
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL(mime, opts.quality ?? 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Turns a photo the user picked from their device into a small, square,
// compressed JPEG data URL (default 256x256, ~20-60 KB). It is stored directly
// in the profile_picture_url column, so no file storage/bucket is needed.

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB picked file

export async function fileToAvatarDataUrl(
  file: File,
  size = 256,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG or WEBP image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image is too large. Please choose one under 8 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read this image."));
      el.src = objectUrl;
    });

    // Centre-crop to a square so the round avatar never looks stretched.
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process this image.");

    ctx.fillStyle = "#ffffff"; // PNG transparency -> white instead of black
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Header / footer banner for a personal prescription pad: keeps the aspect ratio
 * (no cropping), limits the width and compresses to JPEG so it stays small
 * enough to store in the database (usually 60-250 KB).
 */
export async function fileToBannerDataUrl(
  file: File,
  maxWidth = 1600,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG or WEBP image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image is too large. Please choose one under 8 MB.");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read this image."));
      el.src = objectUrl;
    });
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process this image.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

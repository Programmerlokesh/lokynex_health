/**
 * Same rule as the backend (PhoneNormalizer.ToIndianMobile):
 * Indian mobile -> exactly 10 digits, or null if it isn't one.
 * Strips +91 / 91 (12 digits), 0 (11 digits), 0091 (14 digits) and any
 * spaces/dashes/brackets. The 10 digits must start with 6, 7, 8 or 9.
 */
export function toIndianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length === 14 && d.startsWith("0091")) d = d.slice(4);
  else if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

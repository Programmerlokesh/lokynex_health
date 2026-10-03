/** Plain number, 2 decimals, Indian grouping. No currency glyph so it prints on any font. */
export function formatMoney(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

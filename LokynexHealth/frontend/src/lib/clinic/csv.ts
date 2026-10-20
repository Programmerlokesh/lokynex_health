import type { ImportMedicineRow } from "@/types/clinic";

/** Small RFC-4180 CSV parser (quotes, commas and line breaks inside quotes). O(n) single pass. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const ALIASES = {
  name: [
    "name",
    "brand",
    "brand_name",
    "brandname",
    "medicine",
    "medicine_name",
    "product_name",
    "drug",
    "drug_name",
  ],
  company: [
    "manufacturer_name",
    "manufacturer",
    "company",
    "company_name",
    "product_manufactured",
    "marketer",
    "mfg",
  ],
  composition: [
    "composition",
    "salt_composition",
    "salt",
    "generic",
    "generic_name",
  ],
  comp1: ["short_composition1"],
  comp2: ["short_composition2"],
  form: ["type", "form", "dosage_form", "sub_category"],
  discontinued: ["is_discontinued", "discontinued"],
} as const;

const norm = (h: string) =>
  h
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/** Understands the common public Indian-medicine CSV layouts (Kaggle "A-Z Medicines of India",
 *  the 1mg style sets, or your own file with name / company / composition columns). */
export function mapMedicineCsv(table: string[][]): {
  rows: ImportMedicineRow[];
  missing: string | null;
} {
  if (table.length < 2)
    return { rows: [], missing: "The file has no data rows." };
  const header = table[0].map(norm);
  const find = (keys: readonly string[]) =>
    header.findIndex((h) => keys.includes(h));
  const iName = find(ALIASES.name);
  if (iName < 0)
    return {
      rows: [],
      missing:
        "No medicine-name column found (expected: name, brand_name, product_name …).",
    };
  const iCompany = find(ALIASES.company);
  const iComp = find(ALIASES.composition);
  const iC1 = find(ALIASES.comp1);
  const iC2 = find(ALIASES.comp2);
  const iForm = find(ALIASES.form);
  const iDisc = find(ALIASES.discontinued);

  const rows: ImportMedicineRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const c = table[r];
    if (iDisc >= 0 && /^(true|1|yes)$/i.test((c[iDisc] ?? "").trim())) continue;
    const name = (c[iName] ?? "").trim();
    if (!name) continue;
    let composition = iComp >= 0 ? (c[iComp] ?? "").trim() : "";
    if (!composition && iC1 >= 0) {
      composition = [c[iC1], iC2 >= 0 ? c[iC2] : ""]
        .map((x) => (x ?? "").trim())
        .filter(Boolean)
        .join(" + ");
    }
    rows.push({
      brandName: name,
      company: iCompany >= 0 ? (c[iCompany] ?? "").trim() : "",
      composition,
      form: iForm >= 0 ? (c[iForm] ?? "").trim() : "",
    });
  }
  return { rows, missing: null };
}

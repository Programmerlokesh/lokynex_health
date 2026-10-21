/**
 * Online medicine lookup (name, company, composition, dose, timing).
 *
 * Source: the public openFDA drug-label database (https://open.fda.gov/apis/drug/label/).
 * It needs no key and allows browser calls. It mostly lists US-marketed
 * products, so for Indian brands the doctor can still type the details by
 * hand or use the "Google" link beside the search box.
 */
export interface OnlineMedicine {
  key: string;
  brandName: string;
  genericName: string;
  company: string;
  composition: string;
  form: string;
  route: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

interface FdaLabel {
  id?: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    substance_name?: string[];
    route?: string[];
  };
  active_ingredient?: string[];
  dosage_forms_and_strengths?: string[];
  dosage_and_administration?: string[];
  spl_product_data_elements?: string[];
}

const clean = (s: string | undefined) =>
  (s ?? "")
    .replace(/\s+/g, " ")
    .replace(
      /^[0-9.\s]*(dosage and administration|active ingredients?)[:\s-]*/i,
      "",
    )
    .trim();

const cut = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).trim()}…` : s;

/** "every 4 to 6 hours" / "twice daily" / "3 times a day" ... or "" */
function findFrequency(text: string): string {
  const m =
    /(every\s+\d+\s*(?:to|-)\s*\d+\s*hours?|every\s+\d+\s*hours?|once\s+(?:a\s+)?daily|twice\s+(?:a\s+)?daily|(?:two|three|four|\d)\s+times\s+(?:a\s+)?(?:day|daily)|at\s+bedtime|once\s+weekly)/i.exec(
      text,
    );
  return m ? m[1].toLowerCase() : "";
}

/** "1 tablet" / "500 mg" ... or "" */
function findDose(text: string): string {
  const m =
    /(\d+(?:\.\d+)?\s*(?:to|-)\s*\d+(?:\.\d+)?\s*(?:tablets?|capsules?|mg|mL|ml)|\d+(?:\.\d+)?\s*(?:tablets?|capsules?|mg|mL|ml))/i.exec(
      text,
    );
  return m ? m[1] : "";
}

function toMedicine(l: FdaLabel, i: number): OnlineMedicine | null {
  const brand = l.openfda?.brand_name?.[0] ?? l.openfda?.generic_name?.[0];
  if (!brand) return null;
  const dosageText = clean(l.dosage_and_administration?.[0]);
  const composition =
    clean(l.active_ingredient?.[0]) ||
    (l.openfda?.substance_name ?? []).join(", ");
  return {
    key: `${l.id ?? brand}-${i}`,
    brandName: brand,
    genericName: l.openfda?.generic_name?.[0] ?? "",
    company: l.openfda?.manufacturer_name?.[0] ?? "",
    composition: cut(composition, 200),
    form: "",
    route: l.openfda?.route?.[0]?.toLowerCase() ?? "",
    dosage: findDose(dosageText),
    frequency: findFrequency(dosageText),
    instructions: cut(dosageText, 280),
  };
}

export async function searchOnlineMedicines(
  term: string,
  signal?: AbortSignal,
): Promise<OnlineMedicine[]> {
  const t = term.trim().replace(/["\\]/g, "");
  if (t.length < 2) return [];
  const q = `openfda.brand_name:"${t}"+openfda.generic_name:"${t}"+openfda.substance_name:"${t}"`;
  const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(q).replace(/%2B/g, "+")}&limit=12`;
  const res = await fetch(url, { signal });
  if (res.status === 404) return []; // openFDA answers 404 when nothing matches
  if (!res.ok)
    throw new Error("The medicine database is not reachable right now.");
  const json = (await res.json()) as { results?: FdaLabel[] };
  const seen = new Set<string>();
  const out: OnlineMedicine[] = [];
  (json.results ?? []).forEach((l, i) => {
    const m = toMedicine(l, i);
    if (!m) return;
    const id = `${m.brandName}|${m.company}`.toLowerCase();
    if (seen.has(id)) return;
    seen.add(id);
    out.push(m);
  });
  return out;
}

export const googleMedicineUrl = (term: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${term} medicine composition dose uses`)}`;

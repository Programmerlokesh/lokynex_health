import {
  ResultType,
  SaveTestFormatRequest,
  TestFormatDto,
  TestFormatRangeDto,
} from "@/types/test-format";

let counter = 0;
export const newKey = () =>
  `k${Date.now().toString(36)}${(counter++).toString(36)}`;

export interface RangeDraft {
  key: string;
  gender: "" | "Male" | "Female" | "Other";
  ageFrom: string; // years
  ageTo: string; // years
  low: string;
  high: string;
  critLow: string;
  critHigh: string;
  text: string;
  display: string;
}

export interface ParamDraft {
  key: string;
  id: string | null;
  sectionName: string;
  name: string;
  unit: string;
  resultType: ResultType;
  isBold: boolean;
  ranges: RangeDraft[];
}

export interface InfoDraft {
  specimen: string;
  method: string;
  machine: string;
  reagent: string;
  interpretation: string;
}

export interface FormatDraft {
  info: InfoDraft;
  params: ParamDraft[];
}

const numStr = (v: number | null) => (v === null ? "" : String(v));
const daysToYears = (d: number | null) =>
  d === null ? "" : String(Math.round((d / 365) * 100) / 100);

function numOrNull(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const yearsToDays = (s: string): number | null => {
  const n = numOrNull(s);
  return n === null ? null : Math.round(n * 365);
};

const badNumber = (s: string) => s.trim() !== "" && numOrNull(s) === null;

export function newRange(): RangeDraft {
  return {
    key: newKey(),
    gender: "",
    ageFrom: "",
    ageTo: "",
    low: "",
    high: "",
    critLow: "",
    critHigh: "",
    text: "",
    display: "",
  };
}

export function newParam(sectionName = ""): ParamDraft {
  return {
    key: newKey(),
    id: null,
    sectionName,
    name: "",
    unit: "",
    resultType: "Auto",
    isBold: false,
    ranges: [newRange()],
  };
}

/** What prints in the "Reference Range" column when no display text is typed. */
export function autoDisplay(r: RangeDraft): string {
  if (r.text.trim()) return r.text.trim();
  const low = r.low.trim();
  const high = r.high.trim();
  if (low && high) return `${low} - ${high}`;
  if (high) return `<${high}`;
  if (low) return `>${low}`;
  return "";
}

export function draftFromFormat(f: TestFormatDto): FormatDraft {
  return {
    info: {
      specimen: f.specimen ?? "",
      method: f.method ?? "",
      machine: f.machineName ?? "",
      reagent: f.reagentName ?? "",
      interpretation: f.interpretation ?? "",
    },
    params: f.parameters.map((p) => ({
      key: newKey(),
      id: p.id,
      sectionName: p.sectionName,
      name: p.name,
      unit: p.unit ?? "",
      resultType: p.resultType,
      isBold: p.isBold,
      ranges: p.ranges.map((r) => ({
        key: newKey(),
        gender: r.gender ?? "",
        ageFrom: daysToYears(r.ageMinDays),
        ageTo: daysToYears(r.ageMaxDays),
        low: numStr(r.lowValue),
        high: numStr(r.highValue),
        critLow: numStr(r.criticalLow),
        critHigh: numStr(r.criticalHigh),
        text: r.normalText ?? "",
        display: r.displayText ?? "",
      })),
    })),
  };
}

export function toRequest(
  info: InfoDraft,
  params: ParamDraft[],
): SaveTestFormatRequest {
  const clean = (s: string) => s.trim() || null;
  return {
    specimen: clean(info.specimen),
    method: clean(info.method),
    machineName: clean(info.machine),
    reagentName: clean(info.reagent),
    interpretation: clean(info.interpretation),
    parameters: params.map((p) => ({
      id: p.id,
      sectionName: p.sectionName.trim(),
      name: p.name.trim(),
      unit: clean(p.unit),
      resultType: p.resultType,
      isBold: p.isBold,
      ranges: p.ranges.map(
        (r): TestFormatRangeDto => ({
          gender: r.gender || null,
          ageMinDays: yearsToDays(r.ageFrom),
          ageMaxDays: yearsToDays(r.ageTo),
          lowValue: numOrNull(r.low),
          highValue: numOrNull(r.high),
          criticalLow: numOrNull(r.critLow),
          criticalHigh: numOrNull(r.critHigh),
          normalText: clean(r.text),
          displayText: clean(r.display) ?? clean(autoDisplay(r)),
        }),
      ),
    })),
  };
}

/** Returns a list of human readable problems. Empty = OK to save. */
export function validateDraft(params: ParamDraft[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  params.forEach((p, i) => {
    const label = p.name.trim() ? `“${p.name.trim()}”` : `Parameter #${i + 1}`;
    if (!p.name.trim()) errors.push(`${label}: name is required.`);

    const key = `${p.sectionName.trim().toLowerCase()}||${p.name.trim().toLowerCase()}`;
    if (p.name.trim()) {
      if (seen.has(key))
        errors.push(`${label}: added twice in the same section.`);
      seen.add(key);
    }

    p.ranges.forEach((r, j) => {
      const rl = `${label}, range ${j + 1}`;
      const fields: [string, string][] = [
        ["Low", r.low],
        ["High", r.high],
        ["Critical low", r.critLow],
        ["Critical high", r.critHigh],
        ["Age from", r.ageFrom],
        ["Age to", r.ageTo],
      ];
      for (const [n, v] of fields) {
        if (badNumber(v)) errors.push(`${rl}: ${n} must be a number.`);
      }
      const low = numOrNull(r.low);
      const high = numOrNull(r.high);
      if (low !== null && high !== null && low > high) {
        errors.push(`${rl}: low is greater than high.`);
      }
      const from = numOrNull(r.ageFrom);
      const to = numOrNull(r.ageTo);
      if (from !== null && to !== null && from > to) {
        errors.push(`${rl}: age from is greater than age to.`);
      }
      if (
        low === null &&
        high === null &&
        !r.text.trim() &&
        !r.display.trim()
      ) {
        errors.push(`${rl}: enter a low/high value or a normal text.`);
      }
    });
  });

  return errors;
}

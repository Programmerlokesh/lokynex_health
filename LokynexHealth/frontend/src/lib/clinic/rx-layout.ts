// ---------------------------------------------------------------------------
// Prescription layout settings (stored as JSON in clinics.rx_layout).
//
//  default    -> the standard header / footer printed from the clinic profile
//  letterhead -> the doctor has a personal pre-printed pad. Header and footer
//                are each EITHER an uploaded image OR blank space (mm) that is
//                left empty so the content prints between the pad's header
//                and footer.
//  custom     -> the standard layout with every block switchable + size/colour
// ---------------------------------------------------------------------------

export type RxLayoutMode = "default" | "letterhead" | "custom";
export type RxBandMode = "image" | "space";

export interface RxLetterhead {
  headerMode: RxBandMode;
  headerImage: string; // data URL
  headerMm: number; // blank space when headerMode = "space"
  footerMode: RxBandMode;
  footerImage: string;
  footerMm: number;
}

export interface RxCustom {
  headerStyle: "split" | "centered";
  showLogo: boolean;
  showTagline: boolean;
  showClinicContact: boolean;
  showDoctorBlock: boolean;
  showVitals: boolean;
  showFooterNote: boolean;
  showFooterBar: boolean;
  showSignature: boolean;
  fontSize: "small" | "normal" | "large";
  /** Empty = use the clinic colour. */
  accent: string;
}

export interface RxLayout {
  mode: RxLayoutMode;
  letterhead: RxLetterhead;
  custom: RxCustom;
}

export const MM_LIMITS = { min: 0, max: 80 } as const;

export const DEFAULT_LAYOUT: RxLayout = {
  mode: "default",
  letterhead: {
    headerMode: "space",
    headerImage: "",
    headerMm: 40,
    footerMode: "space",
    footerImage: "",
    footerMm: 25,
  },
  custom: {
    headerStyle: "split",
    showLogo: true,
    showTagline: true,
    showClinicContact: true,
    showDoctorBlock: true,
    showVitals: true,
    showFooterNote: true,
    showFooterBar: true,
    showSignature: true,
    fontSize: "normal",
    accent: "",
  },
};

const clampMm = (n: unknown, fallback: number) => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(MM_LIMITS.max, Math.max(MM_LIMITS.min, Math.round(v)));
};
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const img = (v: unknown) =>
  typeof v === "string" && v.startsWith("data:image/") ? v : "";

/** Tolerant parser: bad / missing JSON falls back to the default layout. */
export function parseRxLayout(json?: string | null): RxLayout {
  if (!json) return structuredClone(DEFAULT_LAYOUT);
  try {
    const o = JSON.parse(json) as Partial<RxLayout>;
    const d = DEFAULT_LAYOUT;
    const l = (o.letterhead ?? {}) as Partial<RxLetterhead>;
    const c = (o.custom ?? {}) as Partial<RxCustom>;
    const mode: RxLayoutMode =
      o.mode === "letterhead" || o.mode === "custom" ? o.mode : "default";
    return {
      mode,
      letterhead: {
        headerMode: l.headerMode === "image" ? "image" : "space",
        headerImage: img(l.headerImage),
        headerMm: clampMm(l.headerMm, d.letterhead.headerMm),
        footerMode: l.footerMode === "image" ? "image" : "space",
        footerImage: img(l.footerImage),
        footerMm: clampMm(l.footerMm, d.letterhead.footerMm),
      },
      custom: {
        headerStyle: c.headerStyle === "centered" ? "centered" : "split",
        showLogo: bool(c.showLogo, true),
        showTagline: bool(c.showTagline, true),
        showClinicContact: bool(c.showClinicContact, true),
        showDoctorBlock: bool(c.showDoctorBlock, true),
        showVitals: bool(c.showVitals, true),
        showFooterNote: bool(c.showFooterNote, true),
        showFooterBar: bool(c.showFooterBar, true),
        showSignature: bool(c.showSignature, true),
        fontSize:
          c.fontSize === "small" || c.fontSize === "large"
            ? c.fontSize
            : "normal",
        accent:
          typeof c.accent === "string" && /^#[0-9a-f]{6}$/i.test(c.accent)
            ? c.accent
            : "",
      },
    };
  } catch {
    return structuredClone(DEFAULT_LAYOUT);
  }
}

/** Stored as "" only when nothing differs from the default (keeps uploaded pad images otherwise). */
export function serializeRxLayout(l: RxLayout): string {
  const hasImages = !!(l.letterhead.headerImage || l.letterhead.footerImage);
  return l.mode === "default" && !hasImages ? "" : JSON.stringify(l);
}

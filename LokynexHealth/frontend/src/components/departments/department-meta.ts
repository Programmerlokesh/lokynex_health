import { brand } from "@/components/providers/mui-theme-provider";
import {
  Bone,
  Brain,
  Bug,
  Camera,
  Dna,
  Droplet,
  Ear,
  Eye,
  FlaskConical,
  HeartPulse,
  Layers,
  LayoutGrid,
  Magnet,
  Microscope,
  Radiation,
  ScanLine,
  TestTube,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

export type DeptGroupId =
  | "pathology"
  | "imaging"
  | "heart-brain"
  | "procedures"
  | "other";

export interface DeptGroup {
  id: DeptGroupId;
  label: string;
  color: string;
}

/** Filter chips shown above the department tiles (empty groups are hidden). */
export const DEPT_GROUPS: DeptGroup[] = [
  { id: "pathology", label: "Pathology", color: brand.teal },
  { id: "imaging", label: "Imaging", color: brand.purple },
  { id: "heart-brain", label: "Heart & Brain", color: "#E11D48" },
  { id: "procedures", label: "Procedures", color: brand.orange },
  { id: "other", label: "Other", color: brand.blue },
];

const GROUP_BY_ID = Object.fromEntries(
  DEPT_GROUPS.map((g) => [g.id, g]),
) as Record<DeptGroupId, DeptGroup>;

interface Rule {
  re: RegExp;
  group: DeptGroupId;
  icon: LucideIcon;
}

// First matching rule wins, so the order matters
// (e.g. "PET-CT" must hit the nuclear rule before the plain CT rule).
const RULES: Rule[] = [
  // ---- imaging ----
  {
    re: /nuclear|\bpet\b|\bspect\b|scintigra/i,
    group: "imaging",
    icon: Radiation,
  },
  {
    re: /x[\s-]?ray|radiograph|dental|\bopg\b/i,
    group: "imaging",
    icon: Radiation,
  },
  { re: /\bct\b|computed tomography/i, group: "imaging", icon: Layers },
  { re: /\bmri\b|\bmra\b|magnetic/i, group: "imaging", icon: Magnet },
  {
    re: /ultra\s?sound|\busg\b|sonograph|doppler/i,
    group: "imaging",
    icon: Waves,
  },
  { re: /dexa|densitometr|\bbone\b/i, group: "imaging", icon: Bone },
  {
    re: /mammo|fluoro|contrast|barium|radiolog|imaging/i,
    group: "imaging",
    icon: ScanLine,
  },

  // ---- heart & brain ----
  {
    re: /cardi|\becg\b|\bekg\b|\becho/i,
    group: "heart-brain",
    icon: HeartPulse,
  },
  { re: /neuro|\beeg\b|\bemg\b|brain/i, group: "heart-brain", icon: Brain },
  {
    re: /pulmon|lung|respirat|\bpft\b|spirom|sleep/i,
    group: "heart-brain",
    icon: Wind,
  },

  // ---- procedures ----
  { re: /endoscop|colonoscop|bronchoscop/i, group: "procedures", icon: Camera },
  { re: /audio|\bent\b|hearing/i, group: "procedures", icon: Ear },
  { re: /ophthal|\beye\b|vision/i, group: "procedures", icon: Eye },

  // ---- pathology ----
  { re: /blood|h(a)?ematolog|coagul/i, group: "pathology", icon: Droplet },
  { re: /urine|stool|semen|fluid/i, group: "pathology", icon: TestTube },
  { re: /microbio|serolog|culture|bacteri/i, group: "pathology", icon: Bug },
  { re: /molecular|genetic|\bdna\b/i, group: "pathology", icon: Dna },
  { re: /cytolog|histopath|patholog/i, group: "pathology", icon: Microscope },
  {
    re: /biochem|endocrin|immuno|autoimmun|toxic|profile|panel|pregnan|screening|hormone|chemistry/i,
    group: "pathology",
    icon: FlaskConical,
  },
];

export interface DeptMeta {
  group: DeptGroupId;
  Icon: LucideIcon;
  color: string;
}

/** Group, icon and accent colour of a department — derived from its name only. */
export function getDeptMeta(name: string): DeptMeta {
  const rule = RULES.find((r) => r.re.test(name));
  const group = rule?.group ?? "other";
  return {
    group,
    Icon: rule?.icon ?? LayoutGrid,
    color: GROUP_BY_ID[group].color,
  };
}

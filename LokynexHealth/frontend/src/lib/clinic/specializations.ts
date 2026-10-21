/** Medical specializations recognised worldwide (grouped for the picker). */
export interface SpecializationGroup {
  group: string;
  items: string[];
}

export const SPECIALIZATION_GROUPS: SpecializationGroup[] = [
  {
    group: "General & Family",
    items: [
      "General Physician",
      "Family Medicine",
      "Internal Medicine",
      "General Practitioner (GP)",
      "Geriatric Medicine",
      "Preventive Medicine",
      "Occupational Medicine",
      "Sports Medicine",
      "Palliative Medicine",
      "Emergency Medicine",
      "Critical Care / Intensivist",
    ],
  },
  {
    group: "Heart, Lungs & Vessels",
    items: [
      "Cardiology",
      "Interventional Cardiology",
      "Cardiac Surgery",
      "Cardiothoracic Surgery",
      "Vascular Surgery",
      "Pulmonology (Chest Physician)",
      "Thoracic Surgery",
      "Sleep Medicine",
    ],
  },
  {
    group: "Brain & Mind",
    items: [
      "Neurology",
      "Neurosurgery",
      "Psychiatry",
      "Child & Adolescent Psychiatry",
      "Clinical Psychology",
      "Addiction Medicine",
      "Pain Medicine",
    ],
  },
  {
    group: "Women & Children",
    items: [
      "Obstetrics & Gynaecology",
      "Gynaecologic Oncology",
      "Reproductive Medicine / IVF",
      "Paediatrics",
      "Neonatology",
      "Paediatric Surgery",
      "Paediatric Cardiology",
      "Paediatric Neurology",
      "Adolescent Medicine",
    ],
  },
  {
    group: "Eye, Ear, Nose & Throat",
    items: [
      "Ophthalmology",
      "Retina Specialist",
      "Optometry",
      "ENT (Otorhinolaryngology)",
      "Audiology",
      "Head & Neck Surgery",
    ],
  },
  {
    group: "Bones, Joints & Muscles",
    items: [
      "Orthopaedics",
      "Orthopaedic Surgery",
      "Spine Surgery",
      "Rheumatology",
      "Physical Medicine & Rehabilitation",
      "Physiotherapy",
      "Podiatry",
      "Hand Surgery",
    ],
  },
  {
    group: "Digestive, Liver & Kidney",
    items: [
      "Gastroenterology",
      "Hepatology",
      "Colorectal Surgery",
      "General Surgery",
      "Laparoscopic Surgery",
      "Bariatric Surgery",
      "Nephrology",
      "Urology",
      "Andrology",
      "Transplant Surgery",
    ],
  },
  {
    group: "Hormones, Blood & Cancer",
    items: [
      "Endocrinology",
      "Diabetology",
      "Haematology",
      "Medical Oncology",
      "Surgical Oncology",
      "Radiation Oncology",
      "Clinical Nutrition / Dietetics",
      "Obesity Medicine",
    ],
  },
  {
    group: "Skin, Hair & Cosmetic",
    items: [
      "Dermatology",
      "Venereology",
      "Trichology",
      "Cosmetology",
      "Plastic & Reconstructive Surgery",
      "Aesthetic Medicine",
    ],
  },
  {
    group: "Infection & Immunity",
    items: [
      "Infectious Diseases",
      "Immunology",
      "Allergy & Clinical Immunology",
      "Tropical Medicine",
      "Travel Medicine",
      "Microbiology",
    ],
  },
  {
    group: "Dental",
    items: [
      "Dentistry (General)",
      "Orthodontics",
      "Oral & Maxillofacial Surgery",
      "Endodontics",
      "Periodontics",
      "Prosthodontics",
      "Paediatric Dentistry",
    ],
  },
  {
    group: "Diagnostics & Anaesthesia",
    items: [
      "Radiology",
      "Interventional Radiology",
      "Nuclear Medicine",
      "Pathology",
      "Clinical Biochemistry",
      "Anaesthesiology",
      "Transfusion Medicine",
      "Forensic Medicine",
      "Genetics",
    ],
  },
  {
    group: "Traditional & Integrative",
    items: [
      "Ayurveda",
      "Homeopathy",
      "Unani",
      "Siddha",
      "Naturopathy",
      "Yoga & Wellness",
      "Acupuncture",
      "Chiropractic",
    ],
  },
];

export const ALL_SPECIALIZATIONS: { name: string; group: string }[] =
  SPECIALIZATION_GROUPS.flatMap((g) =>
    g.items.map((name) => ({ name, group: g.group })),
  );

/** Same specialization typed in different ways -> the same icon. */
export type SpecKind =
  | "heart"
  | "lungs"
  | "brain"
  | "mind"
  | "child"
  | "woman"
  | "eye"
  | "ear"
  | "bone"
  | "stomach"
  | "kidney"
  | "hormone"
  | "blood"
  | "cancer"
  | "skin"
  | "infection"
  | "tooth"
  | "scan"
  | "lab"
  | "anaesthesia"
  | "surgery"
  | "elderly"
  | "nutrition"
  | "herbal"
  | "emergency"
  | "general";

const RULES: [RegExp, SpecKind][] = [
  [/cardi|heart|vascular/i, "heart"],
  [/pulmon|chest|lung|respir|sleep|thoracic/i, "lungs"],
  [/neuro|brain/i, "brain"],
  [/psych|mental|addict|pain/i, "mind"],
  [/paed|pedia|neonat|child|adolescent/i, "child"],
  [/gynae|gynec|obstet|reproduct|ivf|women|andrology/i, "woman"],
  [/ophthal|eye|retina|optom/i, "eye"],
  [/\bent\b|otorhino|audiolog|ear|head & neck/i, "ear"],
  [
    /ortho|spine|rheumat|physio|rehab|podiat|hand surg|sports|chiropract/i,
    "bone",
  ],
  [/gastro|hepat|colorect|bariatric|laparo/i, "stomach"],
  [/nephro|urolog|kidney|transplant/i, "kidney"],
  [/endocrin|diabet|obesity|thyroid/i, "hormone"],
  [/haemat|hemat|blood|transfusion/i, "blood"],
  [/oncol|cancer|radiation/i, "cancer"],
  [/dermat|skin|venere|trich|cosmet|plastic|aesthetic/i, "skin"],
  [/infect|immun|allerg|tropical|travel|microbio/i, "infection"],
  [/dent|orthodon|endodon|periodon|prosthod|maxillo|oral/i, "tooth"],
  [/radiolog|nuclear|imaging/i, "scan"],
  [/patholog|biochem|genetic|forensic/i, "lab"],
  [/anaesth|anesth/i, "anaesthesia"],
  [/surg/i, "surgery"],
  [/geriat|palliat|elder/i, "elderly"],
  [/nutri|diet/i, "nutrition"],
  [/ayurved|homeo|unani|siddha|naturo|yoga|wellness|acupunct/i, "herbal"],
  [/emergency|critical|intensiv/i, "emergency"],
];

export function specKind(name: string | null | undefined): SpecKind {
  const t = (name ?? "").trim();
  if (!t) return "general";
  for (const [rx, kind] of RULES) if (rx.test(t)) return kind;
  return "general";
}

/** [light, base, dark] used by the 3D badge. */
export const SPEC_COLORS: Record<SpecKind, [string, string, string]> = {
  heart: ["#FF9AA8", "#EF4444", "#9F1239"],
  lungs: ["#9BD7FF", "#0EA5E9", "#075985"],
  brain: ["#D6B8FF", "#8B5CF6", "#4C1D95"],
  mind: ["#E8B4FF", "#C026D3", "#701A75"],
  child: ["#FFE08A", "#F59E0B", "#92400E"],
  woman: ["#FFB3D9", "#EC4899", "#9D174D"],
  eye: ["#9AF0E6", "#14B8A6", "#115E59"],
  ear: ["#FFC999", "#F97316", "#9A3412"],
  bone: ["#D6DEE8", "#64748B", "#1E293B"],
  stomach: ["#FFD08A", "#EA580C", "#7C2D12"],
  kidney: ["#B5C4FF", "#4F46E5", "#312E81"],
  hormone: ["#B6F0A6", "#22C55E", "#14532D"],
  blood: ["#FF9AA2", "#DC2626", "#7F1D1D"],
  cancer: ["#E3A6FF", "#9333EA", "#581C87"],
  skin: ["#FFD1B0", "#FB923C", "#9A3412"],
  infection: ["#C5F27A", "#84CC16", "#365314"],
  tooth: ["#E0F2FE", "#38BDF8", "#0C4A6E"],
  scan: ["#A5B4FC", "#6366F1", "#1E1B4B"],
  lab: ["#99F6E4", "#0D9488", "#134E4A"],
  anaesthesia: ["#BAE6FD", "#0284C7", "#0C4A6E"],
  surgery: ["#C7D2FE", "#475569", "#0F172A"],
  elderly: ["#FDE68A", "#CA8A04", "#713F12"],
  nutrition: ["#BBF7D0", "#16A34A", "#14532D"],
  herbal: ["#A7F3D0", "#059669", "#064E3B"],
  emergency: ["#FECACA", "#E11D48", "#881337"],
  general: ["#93C5FD", "#2563EB", "#1E3A8A"],
};

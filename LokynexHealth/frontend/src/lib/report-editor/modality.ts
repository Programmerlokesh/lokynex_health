import { Trie } from "@/lib/report-editor/trie";

export type Modality = "usg" | "ct" | "xray" | "general";

export interface Snippet {
  /** Typed after "/" in the editor, e.g. /liver */
  key: string;
  label: string;
  html: string;
}

export interface ModalityDef {
  id: Modality;
  label: string;
  reportTitle: string;
  sections: string[];
  snippets: Snippet[];
}

const p = (text: string) => `<p>${text}</p>`;

// NOTE: these are editable *starting points* for the reporting doctor.
// The doctor must review every line before the report is signed.
const COMMON: Snippet[] = [
  {
    key: "corr",
    label: "Clinical correlation",
    html: p("Clinical correlation is advised."),
  },
  {
    key: "followup",
    label: "Follow-up advice",
    html: p("Follow-up imaging is advised after appropriate treatment."),
  },
  {
    key: "nad",
    label: "No abnormality detected",
    html: p("No significant abnormality detected."),
  },
];

const USG_SNIPPETS: Snippet[] = [
  {
    key: "liver",
    label: "Liver – normal",
    html: p(
      "<b>Liver</b> is normal in size, shape and echotexture. No focal lesion seen. Intrahepatic biliary radicals are not dilated. Portal vein is normal in calibre.",
    ),
  },
  {
    key: "gb",
    label: "Gall bladder & CBD – normal",
    html: p(
      "<b>Gall bladder</b> is well distended with normal wall thickness. No calculus or sludge seen. <b>CBD</b> is normal in calibre.",
    ),
  },
  {
    key: "pancreas",
    label: "Pancreas – normal",
    html: p(
      "<b>Pancreas</b> is normal in size and echotexture. No focal lesion or peripancreatic collection.",
    ),
  },
  {
    key: "spleen",
    label: "Spleen – normal",
    html: p(
      "<b>Spleen</b> is normal in size and echotexture. No focal lesion seen.",
    ),
  },
  {
    key: "kidneys",
    label: "Kidneys – normal",
    html: p(
      "<b>Both kidneys</b> are normal in size, shape and position with preserved corticomedullary differentiation. No calculus, hydronephrosis or mass lesion seen.",
    ),
  },
  {
    key: "bladder",
    label: "Urinary bladder – normal",
    html: p(
      "<b>Urinary bladder</b> is well distended with normal wall thickness. No calculus or mass lesion seen.",
    ),
  },
  {
    key: "prostate",
    label: "Prostate – normal",
    html: p(
      "<b>Prostate</b> is normal in size and echotexture. No focal lesion seen.",
    ),
  },
  {
    key: "uterus",
    label: "Uterus & adnexa – normal",
    html: p(
      "<b>Uterus</b> is anteverted and normal in size with homogeneous myometrial echotexture. Endometrium is normal. Both ovaries are normal. No adnexal mass seen.",
    ),
  },
  {
    key: "fluid",
    label: "No free fluid",
    html: p("No free fluid is seen in the peritoneal cavity."),
  },
  {
    key: "impnormal",
    label: "Impression – normal study",
    html: p(
      "Ultrasonography of the abdomen reveals no significant abnormality.",
    ),
  },
];

const CT_SNIPPETS: Snippet[] = [
  {
    key: "plain",
    label: "Technique – plain",
    html: p("Axial sections were obtained without intravenous contrast."),
  },
  {
    key: "contrast",
    label: "Technique – contrast",
    html: p(
      "Axial sections were obtained before and after intravenous administration of non-ionic contrast.",
    ),
  },
  {
    key: "brain",
    label: "CT brain – normal",
    html: p(
      "Cerebral and cerebellar parenchyma show normal attenuation. No intracranial haemorrhage, mass lesion or midline shift. Ventricles and basal cisterns are normal. Bony calvarium is unremarkable.",
    ),
  },
  {
    key: "chest",
    label: "CT chest – normal",
    html: p(
      "Both lung fields are clear. No consolidation, nodule or pleural effusion. Mediastinal structures are normal. No significant lymphadenopathy.",
    ),
  },
  {
    key: "abdomen",
    label: "CT abdomen – normal",
    html: p(
      "Liver, spleen, pancreas, both kidneys and adrenal glands show normal size and attenuation. No focal lesion, free fluid or lymphadenopathy. Bowel loops are unremarkable.",
    ),
  },
  {
    key: "impnormal",
    label: "Impression – normal study",
    html: p("No significant abnormality detected on this CT study."),
  },
];

const XRAY_SNIPPETS: Snippet[] = [
  {
    key: "chest",
    label: "Chest PA – normal",
    html: p(
      "Both lung fields are clear. Cardiac size and contour are normal. Both hila are normal. Trachea is central.",
    ),
  },
  {
    key: "ctr",
    label: "Cardiothoracic ratio normal",
    html: p("Cardiothoracic ratio is within normal limits."),
  },
  {
    key: "cp",
    label: "Costophrenic angles clear",
    html: p("Both costophrenic angles and domes of diaphragm are normal."),
  },
  {
    key: "bones",
    label: "Bones – normal",
    html: p(
      "Visualised bones show normal density and alignment. No fracture or destructive lesion seen.",
    ),
  },
  {
    key: "joint",
    label: "Joint – normal",
    html: p(
      "Joint space is maintained. No fracture, dislocation or bony lesion seen. Soft tissues are unremarkable.",
    ),
  },
  {
    key: "impnormal",
    label: "Impression – normal study",
    html: p("No significant abnormality detected on this radiograph."),
  },
];

export const MODALITIES: ReadonlyMap<Modality, ModalityDef> = new Map<
  Modality,
  ModalityDef
>([
  [
    "usg",
    {
      id: "usg",
      label: "USG (Ultrasound)",
      reportTitle: "ULTRASONOGRAPHY REPORT",
      sections: [
        "Clinical Details / Indication",
        "Liver",
        "Gall Bladder & CBD",
        "Pancreas",
        "Spleen",
        "Kidneys",
        "Urinary Bladder",
        "Prostate / Uterus & Adnexa",
        "Other Findings",
        "Impression",
      ],
      snippets: [...USG_SNIPPETS, ...COMMON],
    },
  ],
  [
    "ct",
    {
      id: "ct",
      label: "CT Scan",
      reportTitle: "CT SCAN REPORT",
      sections: [
        "Clinical Details",
        "Technique",
        "Findings",
        "Impression",
        "Advice",
      ],
      snippets: [...CT_SNIPPETS, ...COMMON],
    },
  ],
  [
    "xray",
    {
      id: "xray",
      label: "X-ray",
      reportTitle: "X-RAY REPORT",
      sections: [
        "Clinical Details",
        "Projection / Technique",
        "Findings",
        "Impression",
      ],
      snippets: [...XRAY_SNIPPETS, ...COMMON],
    },
  ],
  [
    "general",
    {
      id: "general",
      label: "General",
      reportTitle: "MEDICAL REPORT",
      sections: ["Findings", "Impression"],
      snippets: COMMON,
    },
  ],
]);

export function getModality(id: Modality): ModalityDef {
  return MODALITIES.get(id) as ModalityDef;
}

export function isModality(v: string | null | undefined): v is Modality {
  return !!v && MODALITIES.has(v as Modality);
}

// Ordered rules, compiled once. First match wins.
const RULES: ReadonlyArray<readonly [Modality, RegExp]> = [
  [
    "usg",
    /\b(usg|u\.s\.g|ultra\s?sound|ultrasonography|sonograph\w*|sono\w*|doppler|tvs|nt\s?scan)\b/i,
  ],
  ["ct", /\b(ct|c\.t\.|cect|hrct|computed\s+tomography)\b/i],
  ["xray", /\b(x[\s-]?ray|xray|radiograph\w*|cxr)\b/i],
];

/** Guess the editor type from the test / department name. */
export function detectModality(
  testName: string,
  departmentName = "",
): Modality {
  const text = `${testName} ${departmentName}`;
  for (const [modality, rx] of RULES) {
    if (rx.test(text)) return modality;
  }
  return "general";
}

// Trie per modality, built once and cached.
const trieCache = new Map<Modality, Trie<Snippet>>();
export function getSnippetTrie(modality: Modality): Trie<Snippet> {
  let trie = trieCache.get(modality);
  if (!trie) {
    trie = new Trie<Snippet>();
    for (const s of getModality(modality).snippets) trie.insert(s.key, s);
    trieCache.set(modality, trie);
  }
  return trie;
}

/* ---------- Starting HTML ---------- */

export function buildHeaderHtml(): string {
  return `<div style="text-align:center"><h2 style="margin:0">{{branch_name}}</h2><div>{{branch_address}}</div><div>Phone: {{branch_phone}}</div></div><hr>
<table data-plain="1" style="width:100%;border-collapse:collapse"><tbody>
<tr><td><b>Patient:</b> {{patient_name}}</td><td><b>Age / Sex:</b> {{patient_age_sex}}</td></tr>
<tr><td><b>Order No:</b> {{order_number}}</td><td><b>Date:</b> {{report_date}}</td></tr>
<tr><td><b>Referred by:</b> {{referred_by}}</td><td><b>Phone:</b> {{patient_phone}}</td></tr>
</tbody></table><hr>
<h3 style="text-align:center;text-decoration:underline">{{report_title}}</h3>
<p style="text-align:center"><b>{{test_name}}</b></p>`;
}

export function buildBodyHtml(def: ModalityDef): string {
  return def.sections.map((s) => `<h4>${s}</h4><p><br></p>`).join("");
}

export function buildFooterHtml(): string {
  return `<hr><p style="text-align:right"><br><br><b>Dr. ____________________</b><br>Consultant Radiologist</p>
<p style="font-size:11px">This report is a professional opinion and should be correlated clinically. Not valid for medico-legal purposes.</p>`;
}

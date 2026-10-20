-- ======================================================================
-- 026_seed_missing_formats_and_other_tests.sql
-- WHAT : PART A  gives a parameter + unit (+ result type, decimals) to every
--                test of the 380-test SOP pack that still has only the empty
--                1-line format from 020 (or no format at all), e.g. DLC, ABG,
--                Hb Electrophoresis, Insulin, PTH, Cortisol, Factor VIII,
--                Drug Monitoring Profile, Allergy IgE panels ...
--        PART B  adds the tests the blood pack does NOT have, each with a
--                full report format:
--                  * Urine   (routine, 24-hr tests, microalbumin, UPT ...)
--                  * Stool   (routine, occult blood, ova & cyst ...)
--                  * Semen   (semen analysis, post-vasectomy ...)
--                  * Culture (urine, stool, semen, swab, pus, sputum, CSF,
--                             fungal, AFB ... + Gram / ZN / KOH smears)
--                  * Body fluids, Cytology, Histopathology
--                  * a few other common tests (BT, CT, Typhidot, CD4, ADA ...)
--
-- NO reference ranges are invented here (same rule as 020 / 021): this file
-- only adds parameter names, units, result type and decimal places. Add the
-- normal ranges from your analyser / kit insert in the Test Formats screen.
-- Qualitative parameters (Positive / Negative, colour, organism ...) have no
-- unit on purpose.
--
-- RUN ORDER : ... 017 -> 020 -> 021 -> 026 (this file).  Safe to re-run:
--   * a test is touched only if it has NO parameters yet, or still has the
--     untouched 1-line format from 020 (1 parameter, no unit, no range).
--     Formats you already built / edited are never overwritten.
--   * new tests / departments are created only when no test / department with
--     that name (or a "urine%", "stool%", "semen%" ... department) exists.
--   * runs on EVERY lab schema that has the 014 report-format tables.
-- Price of every new test is 0 -> set real prices in Departments & Tests.
-- Run with the RUN button / "Execute script" in ONE session (not Explain).
--
-- DATA BLOCK SYNTAX (read by the SQL below):
--   -- text                      comment
--   # Test A ;; Test B | DEPT | specimen      header of a multi-parameter format
--   section | parameter | unit | type | decimals [| b]   one parameter line
--   = Test A ;; Test B | unit | type | decimals [| DEPT | specimen]
--                                one-parameter test (parameter name = test name)
--   type: N = Numeric, T = Text, A = Auto     b = bold      ;; = same format for many tests
--   DEPT (only for NEW tests): URI STO SEM MIC HEM SER BIO AUT BOD CYT HIS
-- ======================================================================

-- ---------- 0. department codes (code -> name to create, pattern of an existing one) ----------
DROP TABLE IF EXISTS tmp26_dept;
CREATE TEMP TABLE tmp26_dept (code TEXT PRIMARY KEY, dname TEXT NOT NULL, pat TEXT NOT NULL);
INSERT INTO tmp26_dept (code, dname, pat) VALUES
    ('URI', 'Urine Analysis',          'urine%'),
    ('STO', 'Stool Examination',       'stool%'),
    ('SEM', 'Semen Analysis',          'semen%'),
    ('MIC', 'Microbiology',            'microbio%'),
    ('HEM', 'Hematology',              'h%ematolog%'),
    ('SER', 'Serology',                'serolog%'),
    ('BIO', 'Biochemistry',            'biochem%'),
    ('AUT', 'Autoimmune / Immunology', 'autoimmune%'),
    ('BOD', 'Body Fluids',             '%body fluid%'),
    ('CYT', 'Cytology',                'cytolog%'),
    ('HIS', 'Histopathology',          'histopath%');

-- ---------- 1. the data block -> tmp26_fmt ----------
DROP TABLE IF EXISTS tmp26_fmt;
CREATE TEMP TABLE tmp26_fmt AS
WITH raw AS (
    SELECT l.ord, btrim(l.line) AS line
    FROM regexp_split_to_table($pack_data$
-- =====================================================================
-- PART A : tests that exist (from the pack) but have no parameter + unit
-- =====================================================================
-- ---- Hematology ----
# Differential Leukocyte Count (DLC)
DIFFERENTIAL COUNT | Neutrophils | % | N | 0
DIFFERENTIAL COUNT | Lymphocytes | % | N | 0
DIFFERENTIAL COUNT | Monocytes | % | N | 0
DIFFERENTIAL COUNT | Eosinophils | % | N | 0
DIFFERENTIAL COUNT | Basophils | % | N | 0
= Red Cell Distribution Width (RDW-SD) ;; Mean Platelet Volume (MPV) | fL | N | 1
= Absolute Reticulocyte Count ;; Absolute Eosinophil Count (AEC) ;; Eosinophil Count | /cumm | N | 0
= Immature Platelet Fraction (IPF) | % | N | 1
= Nucleated RBC Count | /100 WBC | N | 0
# Malarial Antigen Rapid Test ;; Malarial Antigen Test
MALARIA ANTIGEN | P. falciparum (HRP-2) | | T |
MALARIA ANTIGEN | P. vivax (pLDH) | | T |
# Sickle Cell Screening / Sickling Test
SICKLING | Sickling Test (Sodium Metabisulphite) | | T |
SICKLING | Solubility Test (HbS) | | T |
 | Impression | | T |
# Osmotic Fragility Test
OSMOTIC FRAGILITY | Initial Haemolysis (Onset) | % NaCl | N | 2
OSMOTIC FRAGILITY | Complete Haemolysis | % NaCl | N | 2
= G6PD Enzyme Assay ;; Quantitative G6PD Activity | U/g Hb | N | 1
# Bone Marrow Aspiration Studies
BONE MARROW ASPIRATE | Cellularity | | T |
BONE MARROW ASPIRATE | Erythropoiesis | | T |
BONE MARROW ASPIRATE | Myelopoiesis | | T |
BONE MARROW ASPIRATE | Megakaryopoiesis | | T |
BONE MARROW ASPIRATE | Lymphocytes / Plasma Cells | | T |
BONE MARROW ASPIRATE | Blasts | % | A | 0
BONE MARROW ASPIRATE | Myeloid : Erythroid (M:E) Ratio | | T |
BONE MARROW ASPIRATE | Iron Stores | | T |
 | Impression | | T |
# Bone Marrow Biopsy Studies
BONE MARROW BIOPSY | Cellularity | | T |
BONE MARROW BIOPSY | Haematopoietic Elements | | T |
BONE MARROW BIOPSY | Reticulin Fibrosis | | T |
BONE MARROW BIOPSY | Abnormal Infiltrate | | T |
 | Impression | | T |
# Hb Electrophoresis ;; Hemoglobin HPLC
HAEMOGLOBIN FRACTIONS | Hb A | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb A2 | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb F | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb S | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb C | % | N | 1
HAEMOGLOBIN FRACTIONS | Other Variants (Hb D / E / Bart) | | T |
 | Impression | | T |
= HbA2 Quantification ;; HbF Quantification | % | N | 1
= LE Cell Test (legacy / limited use) | | T |
-- ---- Coagulation ----
# Thrombin Time (TT)
COAGULATION | Thrombin Time (TT) | sec | N | 1 | b
COAGULATION | Control (TT) | sec | N | 1
= Fibrinogen | mg/dL | N | 0
= D-Dimer | ng/mL FEU | N | 0
= Fibrin Degradation Products (FDP) | µg/mL | N | 1
= Anti-Xa Assay | IU/mL | N | 2
= Factor VIII Activity ;; Factor IX Activity ;; Factor V Activity ;; Factor VII Activity ;; Factor X Activity ;; Factor XI Activity ;; Factor XII Activity | % | N | 1
= von Willebrand Factor Antigen ;; von Willebrand Factor Activity ;; Protein C Activity ;; Protein S Activity ;; Antithrombin III | % | N | 0
# Lupus Anticoagulant
LUPUS ANTICOAGULANT | dRVVT Screen | sec | N | 1
LUPUS ANTICOAGULANT | dRVVT Confirm | sec | N | 1
LUPUS ANTICOAGULANT | Normalised dRVVT Ratio | | N | 2
 | Interpretation | | T |
# Coagulation Mixing Study
MIXING STUDY | Baseline aPTT (Patient) | sec | N | 1
MIXING STUDY | aPTT after 1:1 Mix (Immediate) | sec | N | 1
MIXING STUDY | aPTT after 1:1 Mix (Incubated 2 hr) | sec | N | 1
 | Interpretation | | T |
# Thromboelastography (TEG)
TEG | R Time | min | N | 1
TEG | K Time | min | N | 1
TEG | Alpha Angle | ° | N | 1
TEG | MA (Maximum Amplitude) | mm | N | 1
TEG | LY30 | % | N | 1
# ROTEM
ROTEM (EXTEM) | CT (Clotting Time) | sec | N | 0
ROTEM (EXTEM) | CFT (Clot Formation Time) | sec | N | 0
ROTEM (EXTEM) | Alpha Angle | ° | N | 0
ROTEM (EXTEM) | A10 | mm | N | 0
ROTEM (EXTEM) | MCF (Maximum Clot Firmness) | mm | N | 0
ROTEM (EXTEM) | ML (Maximum Lysis) | % | N | 0
-- ---- Biochemistry ----
= Fructosamine | µmol/L | N | 0
= Insulin | µIU/mL | N | 2
= C-Peptide | ng/mL | N | 2
= Proinsulin | pmol/L | N | 1
= HOMA-IR (calculated) | | N | 2
= Blood Urea Nitrogen (BUN) | mg/dL | N | 1
= Bicarbonate / Total CO2 | mmol/L | N | 1
= Ionized Calcium | mmol/L | N | 2
= Serum Osmolality | mOsm/kg | N | 0
= Cystatin C ;; Cystatin C, repeat alias for renal profile | mg/L | N | 2
= Lactate Dehydrogenase (LDH) ;; Cholinesterase | U/L | N | 0
= Ammonia | µg/dL | N | 0
= Ceruloplasmin | mg/dL | N | 1
= Alpha-1 Antitrypsin ;; Transferrin ;; Apolipoprotein A1 ;; Apolipoprotein B | mg/dL | N | 0
= Bile Acids | µmol/L | N | 1
= Lipoprotein(a) / Lp(a) | mg/dL | N | 1
= High-sensitivity CRP (hs-CRP) | mg/L | N | 2
= Homocysteine | µmol/L | N | 1
= Lactate | mmol/L | N | 1
= Beta-hydroxybutyrate | mmol/L | N | 2
= Procalcitonin (PCT) | ng/mL | N | 2
= Prealbumin / Transthyretin | mg/dL | N | 1
= Zinc ;; Copper | µg/dL | N | 0
= Selenium | µg/L | N | 0
= Lead (blood) | µg/dL | N | 1
= Mercury (blood) ;; Arsenic (blood) | µg/L | N | 1
-- ---- Endocrinology ----
= Anti-TPO Antibody ;; Anti-Thyroglobulin Antibody | IU/mL | A | 1
= TSH Receptor Antibody (TRAb) | IU/L | A | 2
= Thyroglobulin | ng/mL | N | 1
= Parathyroid Hormone (PTH) ;; Calcitonin ;; ACTH ;; Inhibin A ;; Inhibin B | pg/mL | N | 1
= Cortisol (morning) ;; Cortisol (evening) | µg/dL | N | 1
= Aldosterone | ng/dL | N | 1
= Plasma Renin Activity | ng/mL/hr | N | 2
= Direct Renin | µIU/mL | N | 1
= Aldosterone-Renin Ratio | ng/dL per ng/mL/hr | N | 1
= DHEA-S | µg/dL | N | 1
= Testosterone, Free | pg/mL | N | 2
= Sex Hormone Binding Globulin (SHBG) | nmol/L | N | 1
= Progesterone ;; 17-OH Progesterone ;; Anti-Müllerian Hormone (AMH) ;; Anti-Müllerian Hormone (AMH), repeat alias ;; Growth Hormone | ng/mL | N | 2
= IGF-1 | ng/mL | N | 0
= PAPP-A | mIU/L | N | 2
-- ---- Immunoassay ----
= Folate / Folic Acid ;; Vitamin B6 ;; Osteocalcin ;; Chromogranin A ;; Neuron-Specific Enolase (NSE) ;; Myoglobin | ng/mL | N | 1
= 1,25-dihydroxy Vitamin D | pg/mL | N | 1
= Vitamin A | µg/dL | N | 1
= Vitamin E | mg/L | N | 1
= Vitamin B1 (Thiamine) ;; Bone-specific Alkaline Phosphatase ;; P1NP | µg/L | N | 1
= Vitamin C | mg/dL | N | 2
= Beta-CTX / CTX ;; Troponin T | ng/mL | N | 3
= High-sensitivity Troponin I ;; High-sensitivity Troponin T | ng/L | N | 1
= BNP | pg/mL | N | 1
= NT-proBNP | pg/mL | N | 0
= Prostate-Specific Antigen (PSA), Total ;; Free PSA ;; CEA ;; AFP ;; CYFRA 21-1 ;; SCC Antigen | ng/mL | N | 2
= CA-125 ;; CA 15-3 ;; CA 19-9 ;; CA 72-4 | U/mL | N | 1
= HE4 | pmol/L | N | 1
= Serum Beta-hCG | mIU/mL | N | 2
= Carboxyhemoglobin ;; Methemoglobin | % | N | 1
-- ---- Serology ----
# HIV Viral Load (RNA PCR)
VIRAL LOAD | HIV-1 RNA Viral Load | copies/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 copies/mL | A | 2
# HBV DNA PCR / Viral Load
VIRAL LOAD | HBV DNA Viral Load | IU/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 IU/mL | A | 2
# HCV RNA PCR / Viral Load
VIRAL LOAD | HCV RNA Viral Load | IU/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 IU/mL | A | 2
= Anti-HBs | mIU/mL | A | 1
= Total Anti-HBc ;; IgM Anti-HBc ;; HBeAg ;; Anti-HBe | | T |
= Hepatitis A IgM ;; Hepatitis E IgM ;; Chikungunya IgM ;; Chikungunya PCR ;; Leptospira IgM ;; Leptospira PCR ;; SARS-CoV-2 Antibody | | T |
= ASO Titre ;; Rheumatoid Factor (RF) | IU/mL | A | 0
# TPHA / TPPA
SYPHILIS | TPHA / TPPA | | T |
SYPHILIS | Titre | titre | T |
= Rubella IgM ;; CMV IgM ;; Toxoplasma IgM ;; Scrub Typhus IgM ;; HSV 1 IgG ;; HSV 2 IgG ;; Parvovirus B19 IgM ;; Parvovirus B19 IgG | Index | A | 2
= Rubella IgG ;; Toxoplasma IgG | IU/mL | A | 1
= CMV IgG | AU/mL | A | 1
= EBV VCA IgM ;; EBV VCA IgG | U/mL | A | 1
# Brucella Serology
BRUCELLA | Brucella IgM | | T |
BRUCELLA | Brucella IgG | | T |
BRUCELLA | Agglutination (STA) Titre | titre | T |
# Rickettsial Serology
WEIL-FELIX | OX-19 | titre | T |
WEIL-FELIX | OX-2 | titre | T |
WEIL-FELIX | OX-K | titre | T |
# Quantiferon-TB Gold (IGRA)
QUANTIFERON | Nil (Negative Control) | IU/mL | N | 2
QUANTIFERON | TB1 Antigen minus Nil | IU/mL | N | 2
QUANTIFERON | TB2 Antigen minus Nil | IU/mL | N | 2
QUANTIFERON | Mitogen minus Nil | IU/mL | N | 2
 | Interpretation | | T |
-- ---- Microbiology : blood cultures ----
# Blood Culture ;; Blood Culture and Sensitivity ;; Blood Culture, Aerobic ;; Blood Culture, Anaerobic ;; Blood Culture, Pediatric ;; Blood Culture, Fungal ;; Blood Culture, Mycobacterial (specialized)
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
CULTURE | Time to Positivity | hours | A | 0
CULTURE | Incubation Period | days | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
-- ---- Autoimmune / Immunology ----
# Antinuclear Antibody (ANA) ;; ANA by IFA
ANA | ANA Result | | T |
ANA | ANA Titre | titre | T |
ANA | Pattern | | T |
= Anti-dsDNA | IU/mL | A | 1
# ENA Profile
ENA | Anti-Sm | | T |
ENA | Anti-RNP / Sm | | T |
ENA | Anti-SSA (Ro) | | T |
ENA | Anti-SSB (La) | | T |
ENA | Anti-Scl-70 | | T |
ENA | Anti-Jo-1 | | T |
= Anti-Sm Antibody ;; Anti-RNP Antibody ;; Anti-SSA (Ro) ;; Anti-SSB (La) ;; Anti-Scl-70 ;; Anti-centromere Antibody ;; Anti-Jo-1 ;; Anti-CCP | U/mL | A | 1
# ANCA (c-ANCA / p-ANCA)
ANCA | c-ANCA | | T |
ANCA | p-ANCA | | T |
ANCA | ANCA Titre | titre | T |
= MPO Antibody ;; PR3 Antibody | IU/mL | A | 1
= Complement C3 ;; Complement C4 | mg/dL | N | 0
= CH50 | U/mL | N | 0
= HLA-B27 | | T |
# Antiphospholipid Antibodies
ANTIPHOSPHOLIPID | Anti-cardiolipin IgG | GPL U/mL | A | 1
ANTIPHOSPHOLIPID | Anti-cardiolipin IgM | MPL U/mL | A | 1
ANTIPHOSPHOLIPID | Beta-2 Glycoprotein I IgG | U/mL | A | 1
ANTIPHOSPHOLIPID | Beta-2 Glycoprotein I IgM | U/mL | A | 1
ANTIPHOSPHOLIPID | Lupus Anticoagulant | | T |
= Anti-cardiolipin IgG | GPL U/mL | A | 1
= Anti-cardiolipin IgM | MPL U/mL | A | 1
= Beta-2 Glycoprotein I IgG ;; Beta-2 Glycoprotein I IgM | U/mL | A | 1
# Direct Coombs / DAT ;; Indirect Coombs / IAT
COOMBS TEST | Coombs Test Result | | T |
COOMBS TEST | Titre | titre | T |
= Immunoglobulin IgG ;; Immunoglobulin IgA ;; Immunoglobulin IgM | mg/dL | N | 0
= Immunoglobulin IgE | IU/mL | N | 1
# Serum Protein Electrophoresis (SPEP)
PROTEIN FRACTIONS | Albumin | g/dL | N | 2
PROTEIN FRACTIONS | Alpha-1 Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Alpha-2 Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Beta Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Gamma Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Total Protein | g/dL | N | 1
PROTEIN FRACTIONS | A/G Ratio | | N | 2
PROTEIN FRACTIONS | M-Band (Paraprotein) | g/dL | A | 2
 | Impression | | T |
# Immunofixation Electrophoresis
IMMUNOFIXATION | IgG | | T |
IMMUNOFIXATION | IgA | | T |
IMMUNOFIXATION | IgM | | T |
IMMUNOFIXATION | Kappa Light Chain | | T |
IMMUNOFIXATION | Lambda Light Chain | | T |
 | Impression | | T |
= Free Kappa Light Chains ;; Free Lambda Light Chains | mg/L | N | 2
# Cryoglobulins
CRYOGLOBULINS | Cryoglobulins (Qualitative) | | T |
CRYOGLOBULINS | Cryocrit | % | A | 1
= Cold Agglutinin Titre | titre | T |
-- ---- Blood Bank ----
# Extended Red Cell Phenotyping
RH PHENOTYPE | Rh (C) | | T |
RH PHENOTYPE | Rh (c) | | T |
RH PHENOTYPE | Rh (E) | | T |
RH PHENOTYPE | Rh (e) | | T |
OTHER SYSTEMS | Kell (K) | | T |
OTHER SYSTEMS | Duffy (Fya) | | T |
OTHER SYSTEMS | Duffy (Fyb) | | T |
OTHER SYSTEMS | Kidd (Jka) | | T |
OTHER SYSTEMS | Kidd (Jkb) | | T |
# Antibody Screen
ANTIBODY SCREEN | Screening Cell I | | T |
ANTIBODY SCREEN | Screening Cell II | | T |
ANTIBODY SCREEN | Screening Cell III | | T |
 | Interpretation | | T |
# Crossmatch / Compatibility Testing
CROSSMATCH | Donor Unit Number | | T |
CROSSMATCH | Donor Blood Group | | T |
CROSSMATCH | Major Crossmatch | | T |
CROSSMATCH | Minor Crossmatch | | T |
 | Interpretation | | T |
# Antibody Identification Panel
ANTIBODY PANEL | Panel Reaction | | T |
ANTIBODY PANEL | Antibody Identified | | T |
 | Interpretation | | T |
# Hemolysis Workup
HAEMOLYSIS WORKUP | Direct Coombs (DAT) | | T |
HAEMOLYSIS WORKUP | Free Plasma Haemoglobin | mg/dL | N | 1
HAEMOLYSIS WORKUP | Haptoglobin | mg/dL | N | 0
HAEMOLYSIS WORKUP | LDH | U/L | N | 0
HAEMOLYSIS WORKUP | Reticulocyte Count | % | N | 1
 | Impression | | T |
# HLA Typing (transplant use) ;; HLA Typing for Transplant
HLA TYPING | HLA-A | | T |
HLA TYPING | HLA-B | | T |
HLA TYPING | HLA-C | | T |
HLA TYPING | HLA-DRB1 | | T |
HLA TYPING | HLA-DQB1 | | T |
-- ---- Toxicology / drug levels ----
= Blood Alcohol (Ethanol) | mg/dL | N | 0
= Lithium Level | mmol/L | N | 2
= Valproic Acid Level ;; Carbamazepine Level ;; Phenytoin Level ;; Phenobarbital Level ;; Theophylline Level ;; Vancomycin Level ;; Gentamicin Level ;; Amikacin Level ;; Paracetamol / Acetaminophen Level | µg/mL | N | 1
= Digoxin Level ;; Methotrexate Level | ng/mL | N | 2
= Tacrolimus Level | ng/mL | N | 1
= Cyclosporine Level | ng/mL | N | 0
= Salicylate Level | mg/dL | N | 1
-- ---- Critical care ----
# Arterial Blood Gas (ABG)
BLOOD GAS | pH | | N | 2
BLOOD GAS | pCO2 | mmHg | N | 1
BLOOD GAS | pO2 | mmHg | N | 1
BLOOD GAS | HCO3 | mmol/L | N | 1
BLOOD GAS | Base Excess (BE) | mmol/L | N | 1
BLOOD GAS | O2 Saturation (SaO2) | % | N | 1
BLOOD GAS | Lactate | mmol/L | N | 1
# Venous Blood Gas (VBG)
BLOOD GAS | pH | | N | 2
BLOOD GAS | pCO2 | mmHg | N | 1
BLOOD GAS | pO2 | mmHg | N | 1
BLOOD GAS | HCO3 | mmol/L | N | 1
BLOOD GAS | Base Excess (BE) | mmol/L | N | 1
BLOOD GAS | O2 Saturation (SvO2) | % | N | 1
# Co-oximetry
CO-OXIMETRY | Total Haemoglobin (tHb) | g/dL | N | 1
CO-OXIMETRY | Oxyhaemoglobin (O2Hb) | % | N | 1
CO-OXIMETRY | Deoxyhaemoglobin (HHb) | % | N | 1
CO-OXIMETRY | Carboxyhaemoglobin (COHb) | % | N | 1
CO-OXIMETRY | Methaemoglobin (MetHb) | % | N | 1
= Anion Gap (calculated) | mEq/L | N | 1
# Ketones / Beta-hydroxybutyrate
KETONES | Ketones (Qualitative) | | T |
KETONES | Beta-hydroxybutyrate | mmol/L | N | 2
= Blood Lactate | mmol/L | N | 1
-- ---- Molecular / Genetics ----
# JAK2 V617F Mutation
MOLECULAR | JAK2 V617F Mutation | | T |
MOLECULAR | Allele Burden | % | A | 1
# BCR-ABL1 (CML Testing)
MOLECULAR | BCR-ABL1 Transcript (Qualitative) | | T |
MOLECULAR | BCR-ABL1 / ABL1 Ratio (International Scale) | %IS | A | 4
 | Interpretation | | T |
# Factor V Leiden Mutation
MOLECULAR | Factor V Leiden (G1691A) | | T |
 | Interpretation | | T |
# Prothrombin G20210A Mutation
MOLECULAR | Prothrombin G20210A | | T |
 | Interpretation | | T |
# Alpha-thalassemia Molecular Testing
MOLECULAR | Alpha Globin Gene Deletions / Mutations | | T |
MOLECULAR | Genotype | | T |
 | Interpretation | | T |
# Beta-thalassemia Molecular Testing
MOLECULAR | HBB Gene Mutation(s) | | T |
MOLECULAR | Genotype | | T |
 | Interpretation | | T |
# BRCA1 Genetic Testing ;; BRCA2 Genetic Testing
MOLECULAR | Variant(s) Detected | | T |
MOLECULAR | Classification | | T |
 | Interpretation | | T |
# SMA Carrier Testing
MOLECULAR | SMN1 Exon 7 Copy Number | copies | A | 0
MOLECULAR | SMN2 Copy Number | copies | A | 0
 | Interpretation | | T |
# Inherited Thrombophilia Panel
MOLECULAR | Factor V Leiden (G1691A) | | T |
MOLECULAR | Prothrombin G20210A | | T |
MOLECULAR | MTHFR C677T | | T |
MOLECULAR | MTHFR A1298C | | T |
 | Interpretation | | T |
# Cell-free Fetal DNA / NIPT
NIPT | Trisomy 21 (Down Syndrome) | | T |
NIPT | Trisomy 18 (Edwards Syndrome) | | T |
NIPT | Trisomy 13 (Patau Syndrome) | | T |
NIPT | Sex Chromosome Aneuploidy | | T |
NIPT | Fetal Fraction | % | A | 1
 | Overall Result | | T |
# Flow Cytometry (blood / marrow) ;; Immunophenotyping (blood / marrow)
FLOW CYTOMETRY | Sample Viability | % | A | 0
FLOW CYTOMETRY | Blasts | % | A | 1
FLOW CYTOMETRY | Markers Positive | | T |
FLOW CYTOMETRY | Markers Negative | | T |
 | Immunophenotype / Impression | | T |
-- ---- Panels with no format yet (lab analyte lists differ: edit as needed) ----
# Drug Monitoring Profile
ANTI-EPILEPTICS | Valproic Acid | µg/mL | N | 1
ANTI-EPILEPTICS | Carbamazepine | µg/mL | N | 1
ANTI-EPILEPTICS | Phenytoin | µg/mL | N | 1
ANTI-EPILEPTICS | Phenobarbital | µg/mL | N | 1
CARDIAC / RESPIRATORY | Digoxin | ng/mL | N | 2
CARDIAC / RESPIRATORY | Theophylline | µg/mL | N | 1
PSYCHIATRIC | Lithium | mmol/L | N | 2
ANTIBIOTICS | Vancomycin | µg/mL | N | 1
ANTIBIOTICS | Gentamicin | µg/mL | N | 1
ANTIBIOTICS | Amikacin | µg/mL | N | 1
IMMUNOSUPPRESSANTS | Tacrolimus | ng/mL | N | 1
IMMUNOSUPPRESSANTS | Cyclosporine | ng/mL | N | 0
# Allergy / Specific IgE Panel
INHALANT ALLERGENS | House Dust Mite (D. pteronyssinus) | kUA/L | A | 2
INHALANT ALLERGENS | House Dust Mite (D. farinae) | kUA/L | A | 2
INHALANT ALLERGENS | Cockroach | kUA/L | A | 2
INHALANT ALLERGENS | Cat Dander | kUA/L | A | 2
INHALANT ALLERGENS | Dog Dander | kUA/L | A | 2
INHALANT ALLERGENS | Grass Pollen Mix | kUA/L | A | 2
INHALANT ALLERGENS | Tree Pollen Mix | kUA/L | A | 2
INHALANT ALLERGENS | Aspergillus fumigatus | kUA/L | A | 2
INHALANT ALLERGENS | Alternaria alternata | kUA/L | A | 2
# Food-specific IgE Panel
FOOD ALLERGENS | Milk | kUA/L | A | 2
FOOD ALLERGENS | Egg White | kUA/L | A | 2
FOOD ALLERGENS | Peanut | kUA/L | A | 2
FOOD ALLERGENS | Wheat | kUA/L | A | 2
FOOD ALLERGENS | Soybean | kUA/L | A | 2
FOOD ALLERGENS | Fish (Cod) | kUA/L | A | 2
FOOD ALLERGENS | Shrimp | kUA/L | A | 2
FOOD ALLERGENS | Almond | kUA/L | A | 2
FOOD ALLERGENS | Sesame | kUA/L | A | 2
-- ---- Pregnancy screening ----
# Triple Marker Screen (maternal serum)
MATERNAL SERUM | Gestational Age | weeks | N | 1
MATERNAL SERUM | AFP | IU/mL | N | 2
MATERNAL SERUM | AFP (MoM) | MoM | N | 2
MATERNAL SERUM | Free Beta-hCG | mIU/mL | N | 2
MATERNAL SERUM | Free Beta-hCG (MoM) | MoM | N | 2
MATERNAL SERUM | Unconjugated Estriol (uE3) | ng/mL | N | 2
MATERNAL SERUM | uE3 (MoM) | MoM | N | 2
RISK ASSESSMENT | Risk for Down Syndrome (Trisomy 21) | | T |
RISK ASSESSMENT | Risk for Edwards Syndrome (Trisomy 18) | | T |
RISK ASSESSMENT | Risk for Neural Tube Defect | | T |
# Quadruple Marker Screen (maternal serum)
MATERNAL SERUM | Gestational Age | weeks | N | 1
MATERNAL SERUM | AFP | IU/mL | N | 2
MATERNAL SERUM | AFP (MoM) | MoM | N | 2
MATERNAL SERUM | Free Beta-hCG | mIU/mL | N | 2
MATERNAL SERUM | Free Beta-hCG (MoM) | MoM | N | 2
MATERNAL SERUM | Unconjugated Estriol (uE3) | ng/mL | N | 2
MATERNAL SERUM | uE3 (MoM) | MoM | N | 2
MATERNAL SERUM | Inhibin A | pg/mL | N | 1
MATERNAL SERUM | Inhibin A (MoM) | MoM | N | 2
RISK ASSESSMENT | Risk for Down Syndrome (Trisomy 21) | | T |
RISK ASSESSMENT | Risk for Edwards Syndrome (Trisomy 18) | | T |
RISK ASSESSMENT | Risk for Neural Tube Defect | | T |
# First-trimester Combined Screening (serum markers)
ULTRASOUND | Gestational Age | weeks | N | 1
ULTRASOUND | Crown-Rump Length (CRL) | mm | N | 1
ULTRASOUND | Nuchal Translucency (NT) | mm | N | 1
MATERNAL SERUM | Free Beta-hCG | ng/mL | N | 2
MATERNAL SERUM | Free Beta-hCG (MoM) | MoM | N | 2
MATERNAL SERUM | PAPP-A | mIU/L | N | 2
MATERNAL SERUM | PAPP-A (MoM) | MoM | N | 2
RISK ASSESSMENT | Combined Risk for Trisomy 21 | | T |
RISK ASSESSMENT | Combined Risk for Trisomy 18 | | T |
RISK ASSESSMENT | Combined Risk for Trisomy 13 | | T |
# Maternal Serum AFP
MATERNAL SERUM | AFP | ng/mL | N | 2
MATERNAL SERUM | AFP (MoM) | MoM | N | 2
 | Interpretation | | T |
# Indirect Coombs / Antibody Screen in Pregnancy
ANTIBODY SCREEN | Indirect Coombs / Antibody Screen | | T |
ANTIBODY SCREEN | Antibody Titre | titre | T |
-- ---- Specialized ----
= Reticulocyte Hemoglobin Content | pg | N | 1
= Soluble Transferrin Receptor | mg/L | N | 2
= Erythropoietin Level | mIU/mL | N | 1
# Serum Free Light Chain Ratio
LIGHT CHAINS | Free Kappa Light Chains | mg/L | N | 2
LIGHT CHAINS | Free Lambda Light Chains | mg/L | N | 2
LIGHT CHAINS | Kappa / Lambda Ratio | | N | 2
= Beta-2 Microglobulin | mg/L | N | 2
= Serum Viscosity | cP | N | 2
= Porphyrins (blood) | µg/dL | N | 1
# Plasma Metanephrines
PLASMA METANEPHRINES | Metanephrine | pg/mL | N | 1
PLASMA METANEPHRINES | Normetanephrine | pg/mL | N | 1
= Normetanephrine | pg/mL | N | 1
# Catecholamines (plasma)
CATECHOLAMINES | Epinephrine | pg/mL | N | 1
CATECHOLAMINES | Norepinephrine | pg/mL | N | 1
CATECHOLAMINES | Dopamine | pg/mL | N | 1
# Chromosomal Karyotype (blood)
KARYOTYPE | Cells Counted | cells | N | 0
KARYOTYPE | Banding Resolution | | T |
KARYOTYPE | Karyotype | | T |
 | Interpretation | | T |
# Fragile X Testing (blood-based sample)
FRAGILE X | FMR1 CGG Repeats | repeats | A | 0
FRAGILE X | Methylation Status | | T |
 | Interpretation | | T |

-- =====================================================================
-- PART B : NEW tests that are not in the blood pack
-- =====================================================================
-- ---- URINE ----
# Urine Routine & Microscopic Examination | URI | Urine (fresh, mid-stream)
PHYSICAL EXAMINATION | Colour | | T |
PHYSICAL EXAMINATION | Appearance (Transparency) | | T |
PHYSICAL EXAMINATION | Volume | mL | A | 0
PHYSICAL EXAMINATION | Specific Gravity | | N | 3
PHYSICAL EXAMINATION | Reaction (pH) | | N | 1
CHEMICAL EXAMINATION | Protein (Albumin) | | T |
CHEMICAL EXAMINATION | Glucose (Sugar) | | T |
CHEMICAL EXAMINATION | Ketone Bodies | | T |
CHEMICAL EXAMINATION | Bilirubin | | T |
CHEMICAL EXAMINATION | Urobilinogen | EU/dL | A | 1
CHEMICAL EXAMINATION | Blood (Occult Blood) | | T |
CHEMICAL EXAMINATION | Nitrite | | T |
CHEMICAL EXAMINATION | Leukocyte Esterase | | T |
MICROSCOPIC EXAMINATION | Pus Cells (WBC) | /HPF | T |
MICROSCOPIC EXAMINATION | Red Blood Cells (RBC) | /HPF | T |
MICROSCOPIC EXAMINATION | Epithelial Cells | /HPF | T |
MICROSCOPIC EXAMINATION | Casts | /LPF | T |
MICROSCOPIC EXAMINATION | Crystals | | T |
MICROSCOPIC EXAMINATION | Bacteria | | T |
MICROSCOPIC EXAMINATION | Yeast Cells | | T |
MICROSCOPIC EXAMINATION | Mucus Threads | | T |
MICROSCOPIC EXAMINATION | Others | | T |
= Urine Sugar (Fasting) ;; Urine Sugar (Post Prandial) ;; Urine Albumin (Qualitative) ;; Urine Ketone Bodies ;; Urine Urobilinogen ;; Urine Reducing Substances ;; Urine Bence Jones Protein ;; Urine Pregnancy Test (UPT) | | T | | URI | Urine (fresh)
# Urine Bile Salts & Bile Pigments | URI | Urine (fresh)
BILE TESTS | Bile Salts | | T |
BILE TESTS | Bile Pigments | | T |
# Urine Microalbumin (Spot) with ACR | URI | Urine (spot, early morning)
MICROALBUMIN | Urine Microalbumin | mg/L | N | 1 | b
MICROALBUMIN | Urine Creatinine | mg/dL | N | 1
MICROALBUMIN | Albumin / Creatinine Ratio (ACR) | mg/g | N | 1
# Urine Protein / Creatinine Ratio (PCR) | URI | Urine (spot)
PROTEIN / CREATININE | Urine Protein | mg/dL | N | 1
PROTEIN / CREATININE | Urine Creatinine | mg/dL | N | 1
PROTEIN / CREATININE | Protein / Creatinine Ratio (PCR) | mg/mg | N | 2
# 24 Hour Urine Protein | URI | Urine (24-hour collection)
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Urine Protein | mg/dL | N | 1
24 HOUR URINE | Total Protein (24 hr) | mg/24 hr | N | 0 | b
# 24 Hour Urine Creatinine Clearance | URI | Urine (24-hour collection) + serum
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Urine Creatinine | mg/dL | N | 2
24 HOUR URINE | Serum Creatinine | mg/dL | N | 2
24 HOUR URINE | Creatinine Clearance | mL/min | N | 1 | b
# 24 Hour Urine Calcium ;; 24 Hour Urine Uric Acid ;; 24 Hour Urine Phosphorus | URI | Urine (24-hour collection)
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Concentration | mg/dL | N | 1
24 HOUR URINE | Total Excretion (24 hr) | mg/24 hr | N | 1 | b
# 24 Hour Urine Electrolytes (Na, K, Cl) | URI | Urine (24-hour collection)
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Sodium (Na) | mEq/L | N | 0
24 HOUR URINE | Potassium (K) | mEq/L | N | 1
24 HOUR URINE | Chloride (Cl) | mEq/L | N | 0
= Urine Osmolality | mOsm/kg | N | 0 | URI | Urine (spot)
# Urine Drug of Abuse Screen (5 Panel) | URI | Urine (fresh)
DRUG SCREEN | Amphetamines | | T |
DRUG SCREEN | Cocaine | | T |
DRUG SCREEN | Opiates (Morphine) | | T |
DRUG SCREEN | Cannabinoids (THC) | | T |
DRUG SCREEN | Benzodiazepines | | T |
-- ---- STOOL ----
# Stool Routine & Microscopic Examination | STO | Stool (fresh)
PHYSICAL EXAMINATION | Colour | | T |
PHYSICAL EXAMINATION | Consistency | | T |
PHYSICAL EXAMINATION | Mucus | | T |
PHYSICAL EXAMINATION | Blood (Naked Eye) | | T |
PHYSICAL EXAMINATION | Reaction (pH) | | A | 1
CHEMICAL EXAMINATION | Occult Blood | | T |
CHEMICAL EXAMINATION | Reducing Substances | | T |
MICROSCOPIC EXAMINATION | Pus Cells | /HPF | T |
MICROSCOPIC EXAMINATION | Red Blood Cells (RBC) | /HPF | T |
MICROSCOPIC EXAMINATION | Epithelial Cells | /HPF | T |
MICROSCOPIC EXAMINATION | Ova | | T |
MICROSCOPIC EXAMINATION | Cysts | | T |
MICROSCOPIC EXAMINATION | Trophozoites | | T |
MICROSCOPIC EXAMINATION | Larvae | | T |
MICROSCOPIC EXAMINATION | Fat Globules | | T |
MICROSCOPIC EXAMINATION | Undigested Food Particles | | T |
MICROSCOPIC EXAMINATION | Yeast Cells | | T |
MICROSCOPIC EXAMINATION | Others | | T |
= Stool Occult Blood (FOBT) ;; Stool Reducing Substances ;; Stool Fat (Sudan III Stain) ;; Stool Hanging Drop (Vibrio cholerae) ;; Stool H. pylori Antigen ;; Stool Rotavirus Antigen ;; Stool Cryptosporidium / Cyclospora (Modified ZN Stain) | | T | | STO | Stool (fresh)
# Stool Ova & Cyst (O&C) | STO | Stool (fresh)
OVA & CYST | Ova | | T |
OVA & CYST | Cysts | | T |
OVA & CYST | Trophozoites | | T |
OVA & CYST | Larvae | | T |
# Stool Clostridium difficile Toxin | STO | Stool (liquid, fresh)
C. DIFFICILE | GDH Antigen | | T |
C. DIFFICILE | Toxin A/B | | T |
= Faecal Calprotectin ;; Faecal Elastase-1 | µg/g | N | 0 | STO | Stool (spot)
-- ---- SEMEN ----
# Semen Analysis | SEM | Semen (after 2-7 days abstinence)
PHYSICAL EXAMINATION | Abstinence Period | days | N | 0
PHYSICAL EXAMINATION | Method of Collection | | T |
PHYSICAL EXAMINATION | Liquefaction Time | min | N | 0
PHYSICAL EXAMINATION | Volume | mL | N | 1
PHYSICAL EXAMINATION | Colour | | T |
PHYSICAL EXAMINATION | Viscosity | | T |
PHYSICAL EXAMINATION | Reaction (pH) | | N | 1
SPERM COUNT | Sperm Concentration | million/mL | N | 1 | b
SPERM COUNT | Total Sperm Count | million/ejaculate | N | 1
MOTILITY | Progressive Motility (PR) | % | N | 0
MOTILITY | Non-Progressive Motility (NP) | % | N | 0
MOTILITY | Immotile (IM) | % | N | 0
MOTILITY | Total Motility (PR + NP) | % | N | 0 | b
MORPHOLOGY & VITALITY | Normal Morphology | % | N | 0
MORPHOLOGY & VITALITY | Vitality (Live Sperm) | % | N | 0
OTHER FINDINGS | Pus Cells | /HPF | T |
OTHER FINDINGS | Red Blood Cells (RBC) | /HPF | T |
OTHER FINDINGS | Round Cells | /HPF | T |
OTHER FINDINGS | Agglutination | | T |
 | Impression | | T |
# Post Vasectomy Semen Analysis | SEM | Semen
SEMEN | Sperm Concentration | million/mL | N | 2 | b
SEMEN | Motile Sperm | | T |
 | Impression | | T |
# Post-Ejaculatory Urine for Sperm (Retrograde Ejaculation) | SEM | Urine (after ejaculation)
URINE | Sperm in Post-ejaculatory Urine | | T |
URINE | Sperm Count | million/mL | N | 1
# Anti-Sperm Antibody (MAR Test) | SEM | Semen
MAR TEST | IgG-coated Motile Sperm | % | N | 0
MAR TEST | IgA-coated Motile Sperm | % | N | 0
 | Impression | | T |
= Semen Fructose Test | | T | | SEM | Semen
-- ---- CULTURE & SENSITIVITY (Microbiology) ----
# Urine Culture & Sensitivity | MIC | Urine (mid-stream / catheter)
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
CULTURE | Colony Count | CFU/mL | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Semen Culture & Sensitivity | MIC | Semen
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
CULTURE | Colony Count | CFU/mL | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Stool Culture & Sensitivity | MIC | Stool / rectal swab
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Throat Swab Culture & Sensitivity ;; Nasal Swab Culture & Sensitivity ;; Ear Swab Culture & Sensitivity ;; Eye Swab Culture & Sensitivity ;; Wound Swab Culture & Sensitivity | MIC | Swab
CULTURE | Gram Stain | | T |
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Pus Culture & Sensitivity | MIC | Pus / aspirate
CULTURE | Gram Stain | | T |
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# High Vaginal Swab (HVS) Culture & Sensitivity ;; Cervical Swab Culture & Sensitivity ;; Urethral Swab Culture & Sensitivity | MIC | Genital swab
CULTURE | Gram Stain | | T |
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Sputum Culture & Sensitivity | MIC | Sputum
CULTURE | Gram Stain | | T |
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# CSF Culture & Sensitivity ;; Body Fluid Culture & Sensitivity | MIC | Sterile body fluid / CSF
CULTURE | Gram Stain | | T |
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Catheter Tip Culture & Sensitivity | MIC | Catheter tip
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
CULTURE | Colony Count (Roll Plate) | CFU | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Fungal Culture (with KOH Mount) | MIC | Skin / nail / hair / body fluid
FUNGAL CULTURE | KOH Mount | | T |
FUNGAL CULTURE | Culture Result | | T |
FUNGAL CULTURE | Organism Isolated | | T |
FUNGAL CULTURE | Incubation Period | days | A | 0
# AFB Culture (LJ / MGIT) | MIC | Sputum / body fluid / tissue
AFB CULTURE | Culture Result | | T |
AFB CULTURE | Organism Identified | | T |
AFB CULTURE | Incubation Period | weeks | A | 0
# MRSA Screening (Nasal Swab) | MIC | Nasal swab
MRSA SCREEN | MRSA Screen Result | | T |
MRSA SCREEN | Organism Isolated | | T |
# Gram Stain | MIC | Smear
GRAM STAIN | Pus Cells | /HPF | T |
GRAM STAIN | Epithelial Cells | /HPF | T |
GRAM STAIN | Organisms Seen | | T |
 | Impression | | T |
# AFB Smear (ZN Stain) | MIC | Sputum / smear
ZN STAIN | AFB Seen | | T |
ZN STAIN | Grading | | T |
= KOH Mount (Skin / Nail / Hair) | | T | | MIC | Skin scraping / nail / hair
-- ---- BODY FLUIDS ----
# CSF Analysis (Routine & Biochemistry) | BOD | Cerebrospinal fluid (CSF)
PHYSICAL EXAMINATION | Colour | | T |
PHYSICAL EXAMINATION | Appearance | | T |
PHYSICAL EXAMINATION | Clot / Coagulum | | T |
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
CELL COUNT | Red Blood Cells (RBC) | /cumm | A | 0
BIOCHEMISTRY | Protein | mg/dL | N | 0
BIOCHEMISTRY | Glucose | mg/dL | N | 0
BIOCHEMISTRY | Chloride | mmol/L | N | 0
BIOCHEMISTRY | ADA (Adenosine Deaminase) | U/L | N | 1
# Pleural Fluid Analysis ;; Ascitic Fluid Analysis ;; Pericardial Fluid Analysis | BOD | Body fluid (sterile container)
PHYSICAL EXAMINATION | Colour | | T |
PHYSICAL EXAMINATION | Appearance | | T |
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
CELL COUNT | Red Blood Cells (RBC) | /cumm | A | 0
BIOCHEMISTRY | Protein | g/dL | N | 1
BIOCHEMISTRY | Albumin | g/dL | N | 1
BIOCHEMISTRY | Glucose | mg/dL | N | 0
BIOCHEMISTRY | LDH | U/L | N | 0
BIOCHEMISTRY | ADA (Adenosine Deaminase) | U/L | N | 1
# Synovial Fluid Analysis | BOD | Synovial fluid
PHYSICAL EXAMINATION | Colour | | T |
PHYSICAL EXAMINATION | Appearance | | T |
PHYSICAL EXAMINATION | Viscosity | | T |
PHYSICAL EXAMINATION | Mucin Clot | | T |
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
MICROSCOPY | Crystals | | T |
BIOCHEMISTRY | Protein | g/dL | N | 1
BIOCHEMISTRY | Glucose | mg/dL | N | 0
-- ---- CYTOLOGY & HISTOPATHOLOGY ----
# Pap Smear (Cervical Cytology) | CYT | Cervical smear
PAP SMEAR | Specimen Adequacy | | T |
PAP SMEAR | General Categorisation | | T |
PAP SMEAR | Microscopic Findings | | T |
PAP SMEAR | Interpretation / Result | | T |
 | Recommendation | | T |
# FNAC (Fine Needle Aspiration Cytology) | CYT | Fine needle aspirate
FNAC | Site | | T |
FNAC | Nature of Aspirate | | T |
FNAC | Microscopic Findings | | T |
 | Cytological Diagnosis | | T |
# Fluid Cytology ;; Urine Cytology ;; Sputum Cytology | CYT | Fluid / urine / sputum
CYTOLOGY | Cellularity | | T |
CYTOLOGY | Microscopic Findings | | T |
 | Impression | | T |
# Histopathology - Small Biopsy ;; Histopathology - Medium Specimen ;; Histopathology - Large Specimen | HIS | Tissue in 10% formalin
HISTOPATHOLOGY | Clinical History | | T |
HISTOPATHOLOGY | Gross Examination | | T |
HISTOPATHOLOGY | Microscopic Examination | | T |
 | Impression / Diagnosis | | T |
-- ---- OTHER COMMON TESTS ----
= Bleeding Time (BT) ;; Clotting Time (CT) | min | N | 1 | HEM | Capillary / whole blood
= Absolute Neutrophil Count (ANC) | /cumm | N | 0 | HEM | Whole blood (EDTA)
# Typhoid IgM / IgG (Typhidot) | SER | Serum
TYPHIDOT | Typhoid IgM | | T |
TYPHIDOT | Typhoid IgG | | T |
# Helicobacter pylori Antibody (IgG / IgM) | SER | Serum
H. PYLORI | H. pylori IgG | | T |
H. PYLORI | H. pylori IgM | | T |
# Mantoux Test (Tuberculin Skin Test) | SER | Intradermal (read at 48-72 hr)
MANTOUX | Induration Size | mm | N | 0
 | Interpretation | | T |
# CD4 / CD8 Count | AUT | Whole blood (EDTA)
LYMPHOCYTE SUBSETS | Absolute CD4 Count | cells/µL | N | 0
LYMPHOCYTE SUBSETS | CD4 Percentage | % | N | 1
LYMPHOCYTE SUBSETS | Absolute CD8 Count | cells/µL | N | 0
LYMPHOCYTE SUBSETS | CD4 / CD8 Ratio | | N | 2
= Adenosine Deaminase (ADA) - Serum | U/L | N | 1 | BIO | Serum
= Aldolase ;; Acid Phosphatase (Total) | U/L | N | 1 | BIO | Serum
= Haptoglobin | mg/dL | N | 0 | BIO | Serum
# Glucose Challenge Test (GCT, 50 g) | BIO | Plasma (fluoride)
GCT | Plasma Glucose (1 hr after 50 g glucose) | mg/dL | N | 0
$pack_data$, E'\r?\n') WITH ORDINALITY AS l(line, ord)
    WHERE btrim(l.line) <> '' AND btrim(l.line) NOT LIKE '--%'
),
grp AS (
    SELECT ord, line,
           count(*) FILTER (WHERE line ~ '^[#=]') OVER (ORDER BY ord) AS g
    FROM raw
),
hdr AS (
    SELECT g, left(line, 1) AS kind, string_to_array(substr(line, 2), '|') AS f
    FROM grp
    WHERE line ~ '^[#=]'
),
prm AS (
    SELECT g, row_number() OVER (PARTITION BY g ORDER BY ord) AS seq,
           string_to_array(line, '|') AS f
    FROM grp
    WHERE line !~ '^[#=]'
),
one AS (    -- "=" lines: one parameter, named like the test
    SELECT btrim(u.nm)                       AS test_name,
           nullif(btrim(h.f[5]), '')         AS dept,
           nullif(btrim(h.f[6]), '')         AS specimen,
           1                                 AS seq,
           ''::text                          AS section,
           btrim(u.nm)                       AS pname,
           nullif(btrim(h.f[2]), '')         AS unit,
           nullif(btrim(h.f[3]), '')         AS rt,
           nullif(btrim(h.f[4]), '')::smallint AS dp,
           true                              AS bold
    FROM hdr h
    CROSS JOIN LATERAL unnest(string_to_array(h.f[1], ';;')) AS u(nm)
    WHERE h.kind = '='
),
many AS (   -- "#" blocks: parameter lines follow the header
    SELECT btrim(u.nm)                       AS test_name,
           nullif(btrim(h.f[2]), '')         AS dept,
           nullif(btrim(h.f[3]), '')         AS specimen,
           p.seq::int                        AS seq,
           coalesce(btrim(p.f[1]), '')       AS section,
           btrim(p.f[2])                     AS pname,
           nullif(btrim(p.f[3]), '')         AS unit,
           nullif(btrim(p.f[4]), '')         AS rt,
           nullif(btrim(p.f[5]), '')::smallint AS dp,
           coalesce(btrim(p.f[6]) = 'b', false) AS bold
    FROM hdr h
    JOIN prm p ON p.g = h.g
    CROSS JOIN LATERAL unnest(string_to_array(h.f[1], ';;')) AS u(nm)
    WHERE h.kind = '#'
)
SELECT x.test_name, x.dept, x.specimen, x.seq, x.section, x.pname, x.unit,
       CASE x.rt WHEN 'N' THEN 'Numeric' WHEN 'T' THEN 'Text' WHEN 'A' THEN 'Auto' END AS rtype,
       x.dp, x.bold
FROM (SELECT * FROM one UNION ALL SELECT * FROM many) x;

-- guard against a typo / broken copy-paste in the data block
DO $$
DECLARE
    bad TEXT;
BEGIN
    SELECT string_agg(DISTINCT test_name, '; ') INTO bad
    FROM tmp26_fmt
    WHERE rtype IS NULL OR pname IS NULL OR pname = ''
       OR length(pname) > 180 OR length(coalesce(unit, '')) > 40 OR length(section) > 100;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '026: bad parameter line(s) in: %', bad;
    END IF;

    SELECT string_agg(DISTINCT d.test_name, '; ') INTO bad
    FROM (SELECT test_name, seq FROM tmp26_fmt GROUP BY test_name, seq HAVING count(*) > 1) d;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '026: test defined twice in the data block: %', bad;
    END IF;

    SELECT string_agg(DISTINCT f.dept, ', ') INTO bad
    FROM tmp26_fmt f
    WHERE f.dept IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tmp26_dept d WHERE d.code = f.dept);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '026: unknown department code(s): %', bad;
    END IF;

    RAISE NOTICE '026: data block OK - % tests, % parameter lines',
        (SELECT count(DISTINCT test_name) FROM tmp26_fmt), (SELECT count(*) FROM tmp26_fmt);
END
$$;

-- ---------- 2. apply to EVERY lab schema that has the report-format tables ----------
DO $outer$
DECLARE
    s        TEXT;
    old_path TEXT := current_setting('search_path');
    n_dept INT; n_test INT; n_spec INT; n_upd INT; n_ins INT;
BEGIN
    FOR s IN
        SELECT DISTINCT i.table_schema
        FROM information_schema.tables i
        WHERE i.table_name = 'tests'
          AND i.table_schema NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')
    LOOP
        IF to_regclass(format('%I.test_parameters', s)) IS NULL
           OR to_regclass(format('%I.test_reference_ranges', s)) IS NULL THEN
            RAISE NOTICE 'SKIPPED schema % : run 014 first.', s;
            CONTINUE;
        END IF;

        RAISE NOTICE 'Applying 026 to schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);

        -- 2a. departments (Urine / Stool / Semen / Body Fluids / Cytology / Histopathology ...)
        EXECUTE $q$
            INSERT INTO departments (name)
            SELECT w.dname
            FROM tmp26_dept w
            WHERE w.code IN (SELECT DISTINCT f.dept FROM tmp26_fmt f WHERE f.dept IS NOT NULL)
              AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.name ILIKE w.pat)
            ON CONFLICT (name) DO NOTHING$q$;
        GET DIAGNOSTICS n_dept = ROW_COUNT;

        -- 2b. new tests (skipped when the lab already has a test with that name)
        EXECUTE $q$
            INSERT INTO tests (department_id, name, price, status)
            SELECT d.id, f.test_name, 0, 'Active'::record_status
            FROM (SELECT DISTINCT test_name, dept FROM tmp26_fmt WHERE dept IS NOT NULL) f
            JOIN tmp26_dept w ON w.code = f.dept
            CROSS JOIN LATERAL (SELECT dd.id FROM departments dd
                                WHERE dd.name ILIKE w.pat
                                ORDER BY dd.created_at LIMIT 1) d
            WHERE NOT EXISTS (SELECT 1 FROM tests t WHERE lower(t.name) = lower(f.test_name))
            ON CONFLICT (department_id, name) DO NOTHING$q$;
        GET DIAGNOSTICS n_test = ROW_COUNT;

        -- 2c. specimen default of the new tests (needs 015)
        n_spec := 0;
        IF to_regclass(format('%I.test_report_info', s)) IS NOT NULL THEN
            EXECUTE $q$
                INSERT INTO test_report_info (test_id, specimen)
                SELECT DISTINCT ON (t.id) t.id, left(f.specimen, 120)
                FROM tmp26_fmt f
                JOIN tests t ON lower(t.name) = lower(f.test_name)
                WHERE f.specimen IS NOT NULL
                ORDER BY t.id
                ON CONFLICT (test_id) DO NOTHING$q$;
            GET DIAGNOSTICS n_spec = ROW_COUNT;
        END IF;

        -- 2d. which tests may be filled: no parameters yet, or only the untouched 020 starter
        EXECUTE $q$DROP TABLE IF EXISTS tmp26_tgt$q$;
        EXECUTE $q$CREATE TEMP TABLE tmp26_tgt (
                       test_id UUID PRIMARY KEY, test_name TEXT NOT NULL, starter_id UUID)$q$;
        EXECUTE $q$
            INSERT INTO tmp26_tgt (test_id, test_name, starter_id)
            SELECT t.id, t.name,
                   (SELECT p.id FROM test_parameters p WHERE p.test_id = t.id
                    ORDER BY p.sort_order LIMIT 1)
            FROM tests t
            WHERE t.name IN (SELECT DISTINCT f.test_name FROM tmp26_fmt f)
              AND (   NOT EXISTS (SELECT 1 FROM test_parameters x WHERE x.test_id = t.id)
                   OR (    (SELECT count(*) FROM test_parameters x WHERE x.test_id = t.id) = 1
                       AND EXISTS (SELECT 1 FROM test_parameters x
                                   WHERE x.test_id = t.id
                                     AND x.unit IS NULL
                                     AND x.name = left(t.name, 180)
                                     AND NOT EXISTS (SELECT 1 FROM test_reference_ranges r
                                                     WHERE r.parameter_id = x.id))))$q$;

        -- 2e. the untouched 1-line parameter becomes the first real parameter
        --     (same row id, so any saved report result still points to it)
        EXECUTE $q$
            UPDATE test_parameters p
               SET section_name   = f.section,
                   name           = left(f.pname, 180),
                   unit           = f.unit,
                   result_type    = f.rtype,
                   decimal_places = f.dp,
                   sort_order     = f.seq * 10,
                   is_bold        = f.bold
              FROM tmp26_tgt g
              JOIN tmp26_fmt f ON f.test_name = g.test_name AND f.seq = 1
             WHERE p.id = g.starter_id$q$;
        GET DIAGNOSTICS n_upd = ROW_COUNT;

        -- 2f. all other parameters (every parameter when the test had none)
        EXECUTE $q$
            INSERT INTO test_parameters
                (test_id, section_name, name, unit, result_type, decimal_places, sort_order, is_bold)
            SELECT g.test_id, f.section, left(f.pname, 180), f.unit, f.rtype, f.dp, f.seq * 10, f.bold
            FROM tmp26_tgt g
            JOIN tmp26_fmt f ON f.test_name = g.test_name
            WHERE g.starter_id IS NULL OR f.seq > 1$q$;
        GET DIAGNOSTICS n_ins = ROW_COUNT;

        RAISE NOTICE '  % : departments +%, tests +%, specimen defaults +%, 1-line formats upgraded %, parameters added %',
                     s, n_dept, n_test, n_spec, n_upd, n_ins;
    END LOOP;

    PERFORM set_config('search_path', old_path, true);
END
$outer$;

DROP TABLE IF EXISTS tmp26_tgt;
DROP TABLE IF EXISTS tmp26_fmt;
DROP TABLE IF EXISTS tmp26_dept;

-- ======================================================================
-- QUICK CHECKS (run per lab schema, e.g. SET search_path TO lab_demo, public;)
--   -- tests that still have NO parameter / NO unit on a numeric parameter:
--   SELECT t.name FROM tests t WHERE NOT EXISTS (SELECT 1 FROM test_parameters p WHERE p.test_id = t.id);
--   SELECT t.name, p.name FROM test_parameters p JOIN tests t ON t.id = p.test_id
--    WHERE p.result_type = 'Numeric' AND p.unit IS NULL ORDER BY 1, 2;
--   -- departments and how many tests each has:
--   SELECT d.name, count(*) FROM tests t JOIN departments d ON d.id = t.department_id GROUP BY 1 ORDER BY 1;
-- ======================================================================
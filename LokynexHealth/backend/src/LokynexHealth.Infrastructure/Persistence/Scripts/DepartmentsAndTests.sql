-- ======================================================================
-- 003_departments_and_tests.sql      (Lokynex Health)
--
-- ONE file for every department, test, report format (parameters + normal
-- ranges) and specimen default. Replaces the old 017, 019, 020, 021, 026,
-- 027 seeds and SeedTests07 (imaging).
--
-- RUN   : after 002_tenant_schema.sql. Runs on EVERY lab schema that has the
--         report-format tables, or only on one lab when
--             SELECT set_config('lokynex.only_schema', 'lab_xxx', false);
--         is executed first (tenant provisioning does this).
-- SAFE  : re-run any time. Nothing the lab edited is ever overwritten:
--           * a department / test is created only when the lab has none with
--             that name (or, for the core blood tests, none matching the
--             "~" pattern, e.g. a lab's own "CBC"),
--           * a format is written only to a test that has no parameters yet
--             (or only the untouched 1-line starter).
-- PRICE : every new test gets price 0 -> set real prices in "Departments & Tests".
-- RANGES: only the common blood tests carry normal ranges (adult Indian-lab
--         values, have your pathologist verify). Everything else has
--         parameter + unit only; add ranges from your analyser / kit insert
--         in the Test Formats screen.
--
-- DATA SYNTAX (the block below, read by the SQL at the bottom of this file)
--   -- text                 comment
--   @ Dept | specimen | rx  department. specimen = default for its tests,
--                           rx = regex of an existing department name to reuse
--                           (without rx the name itself, ignoring haem/hem, is matched)
--   + Test ;; Test | spec   test(s) without a report format (imaging, procedures)
--   = Test ;; Test | unit | N/T/A | decimals | specimen | method
--                           test(s) with ONE parameter named like the test (bold)
--   # Test ;; Test | specimen | method
--                           test(s) with several parameters; the lines below it are
--       section | parameter | unit | N/T/A | decimals | b    one parameter (b = bold)
--       < Source test | parameter | SECTION                  panel: copy parameter(s) of
--                           another test (all parameters when blank), ranges included
--   > M/F | low | high | crit low | crit high | normal text | display text
--                           normal range of the parameter above it (display text
--                           is "low - high" when left out)
--   ~ regex                 existing test names that count as this test (no duplicate
--                           is created); the first line after the test line
--   N = Numeric, T = Text, A = Auto.  '-' as specimen = no specimen default.
-- ======================================================================

-- name key: lower case, haem = hem, letters and digits only ("Haematology" = "Hematology")
CREATE OR REPLACE FUNCTION pg_temp.nk(t TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS
$f$ SELECT regexp_replace(replace(lower(t), 'haem', 'hem'), '[^a-z0-9]', '', 'g') $f$;

DROP TABLE IF EXISTS tmp_seed_raw, tmp_seed_grp, tmp_seed_dept, tmp_seed_test, tmp_seed_par, tmp_seed_rng;

CREATE TEMP TABLE tmp_seed_raw AS
SELECT l.ord::int AS ord, btrim(l.line) AS line
FROM regexp_split_to_table($data$
@ Blood | Serum / plasma
# Anti-HCV (Hepatitis C)
~ hcv|hepatitis c|^Anti-HCV Antibody$
 | HCV Antibody |  | T
>  |  |  |  |  | Non-Reactive | Non-Reactive
# Beta HCG
~ hcg|^Beta-hCG, Quantitative$
 | Beta hCG | mIU/mL | N | 2 | b
> F |  | 5 |  |  |  | < 5.0 (Non-pregnant)
> M |  | 2 |  |  |  | < 2
# Blood Group (ABO & Rh)
~ blood group|abo|^ABO Blood Group$
BLOOD GROUP | ABO Group |  | T
BLOOD GROUP | Rh (D) Type |  | T
# Blood Sugar Fasting (FBS)
~ fasting.*(sugar|glucose)|\(fbs\)|^fbs|^Fasting Plasma Glucose \(FPG\)$
 | Fasting Blood Sugar (FBS) | mg/dL | N | 0 | b
>  | 70 | 100 | 40 | 500
# Blood Sugar Post Prandial (PPBS)
~ post.?prandial|ppbs|^Post-Prandial Blood Glucose \(PPBG\)$
 | Post Prandial Blood Sugar (PPBS) | mg/dL | N | 0 | b
>  | 70 | 140 | 40 | 500
# Blood Sugar Random (RBS)
~ random.*(sugar|glucose)|\(rbs\)|^rbs|^Random Blood Glucose \(RBG\)$
 | Random Blood Sugar (RBS) | mg/dL | N | 0 | b
>  | 70 | 140 | 40 | 500
# CBC (Complete Blood Count) | EDTA whole blood
~ ^cbc|complete blood count|complete h(a)?emogram|^Complete Blood Count \(CBC\)$
HAEMOGLOBIN | Haemoglobin (Hb) | g/dL | N | 1 | b
> F | 12 | 15 | 7 | 20
> M | 13 | 17 | 7 | 20
RED BLOOD CELLS | Total RBC Count | million/cumm | N | 2
> F | 3.8 | 4.8
> M | 4.5 | 5.5
RED BLOOD CELLS | PCV / Haematocrit | % | N | 1
> F | 36 | 46
> M | 40 | 50
RED CELL INDICES | MCV | fL | N | 1
>  | 83 | 101
RED CELL INDICES | MCH | pg | N | 1
>  | 27 | 32
RED CELL INDICES | MCHC | g/dL | N | 1
>  | 31.5 | 34.5
RED CELL INDICES | RDW-CV | % | N | 1
>  | 11.6 | 14
WHITE BLOOD CELLS | Total WBC Count | /cumm | N | 0 | b
>  | 4000 | 11000 | 2000 | 30000
DIFFERENTIAL COUNT | Neutrophils | % | N | 0
>  | 40 | 80
DIFFERENTIAL COUNT | Lymphocytes | % | N | 0
>  | 20 | 40
DIFFERENTIAL COUNT | Monocytes | % | N | 0
>  | 2 | 10
DIFFERENTIAL COUNT | Eosinophils | % | N | 0
>  | 1 | 6
DIFFERENTIAL COUNT | Basophils | % | N | 0
>  | 0 | 2
PLATELETS | Platelet Count | /cumm | N | 0 | b
>  | 150000 | 410000 | 20000 | 1000000
= CK-MB | U/L | N | 0
~ ck.?mb
>  |  | 25 |  |  |  | < 25
# Coagulation Profile (PT/INR, APTT) | -
~ coagulation
COAGULATION | Prothrombin Time (PT) | sec | N | 1
>  | 11 | 13.5
COAGULATION | Control (PT) | sec | N | 1
>  |  |  |  |  |  | Lab control
COAGULATION | INR |  | N | 2 | b
>  | 0.8 | 1.2
COAGULATION | APTT | sec | N | 1
>  | 25 | 35
# CPK (Creatine Phosphokinase) | -
~ ^cpk|creatine (phospho)?kinase
 | CPK (Total) | U/L | N | 0 | b
> F | 26 | 192
> M | 39 | 308
# CRP (C-Reactive Protein)
~ c.?reactive|^crp|^C-reactive Protein \(CRP\)$
 | C-Reactive Protein (CRP) | mg/L | N | 1 | b
>  |  | 6 |  |  |  | < 6
# Dengue (NS1 / IgG / IgM) | -
~ dengue
DENGUE | Dengue NS1 Antigen |  | T
>  |  |  |  |  | Non-Reactive | Non-Reactive
DENGUE | Dengue IgM |  | T
>  |  |  |  |  | Non-Reactive | Non-Reactive
DENGUE | Dengue IgG |  | T
>  |  |  |  |  | Non-Reactive | Non-Reactive
# ESR (Erythrocyte Sedimentation Rate) | EDTA whole blood
~ ^esr|erythrocyte sed|^Erythrocyte Sedimentation Rate \(ESR\)$
 | ESR (1st hour) | mm/hr | N | 0 | b
> F | 0 | 20
> M | 0 | 15
= Estradiol (E2) | pg/mL | N | 1
~ estradiol|^e2\y
> F |  |  |  |  |  | Follicular: 12.5 - 166 | Mid-cycle: 85.8 - 498 | Luteal: 43.8 - 211 | Post-menopause: < 54.7
> M | 11 | 44
= FSH | mIU/mL | N | 2
~ ^fsh|follicle stimulating
> F |  |  |  |  |  | Follicular: 3.5 - 12.5 | Mid-cycle: 4.7 - 21.5 | Luteal: 1.7 - 7.7 | Post-menopause: 25.8 - 134.8
> M | 1.5 | 12.4
= Haemoglobin (Hb) | g/dL | N | 1 | EDTA whole blood
~ ^h(a)?emoglobin
> F | 12 | 15 | 7 | 20
> M | 13 | 17 | 7 | 20
# HbA1c (Glycosylated Haemoglobin) | EDTA whole blood
~ hba1c|glycosylated|glycated|^HbA1c / Glycated Hemoglobin$
 | HbA1c | % | N | 1 | b
>  | 4 | 5.6 |  |  |  | 4.0 - 5.6 (Non-diabetic)
 | Estimated Average Glucose (eAG) | mg/dL | N | 0
>  |  |  |  |  |  | Calculated from HbA1c
# HBsAg (Hepatitis B)
~ hbsag|hepatitis b|^HBsAg$
 | HBsAg |  | T
>  |  |  |  |  | Non-Reactive | Non-Reactive
# HIV I & II
~ ^hiv|^HIV 1 & 2 Antigen/Antibody Screen$
 | HIV I & II Antibody |  | T
>  |  |  |  |  | Non-Reactive | Non-Reactive
# Iron Studies
~ ^iron( studies| profile)?$|^Iron Profile$
 | Serum Iron | µg/dL | N | 0 | b
> F | 50 | 170
> M | 65 | 175
 | TIBC | µg/dL | N | 0
>  | 250 | 450
 | Ferritin | ng/mL | N | 1
> F | 13 | 150
> M | 30 | 400
 | Transferrin Saturation | % | N | 1
>  | 20 | 50
# KFT / RFT (Kidney Function Test)
~ ^kft|^rft|kidney function|renal function|^Kidney / Renal Function Test \(KFT / RFT\)$
KIDNEY | Urea | mg/dL | N | 0 | b
>  | 15 | 45
KIDNEY | Creatinine | mg/dL | N | 2 | b
> F | 0.6 | 1.1 |  | 10
> M | 0.7 | 1.3 |  | 10
KIDNEY | Uric Acid | mg/dL | N | 1
> F | 2.6 | 6
> M | 3.5 | 7.2
ELECTROLYTES | Sodium (Na) | mEq/L | N | 0
>  | 135 | 145 | 120 | 160
ELECTROLYTES | Potassium (K) | mEq/L | N | 1
>  | 3.5 | 5.1 | 2.5 | 6.5
ELECTROLYTES | Chloride (Cl) | mEq/L | N | 0
>  | 98 | 107
KIDNEY | eGFR | mL/min/1.73m² | N | 0
>  | 90 |  |  |  |  | > 90
# LFT (Liver Function Test)
~ ^lft|liver function|^Liver Function Test \(LFT\)$
BILIRUBIN | Total Bilirubin | mg/dL | N | 2 | b
>  | 0.2 | 1.2 |  | 15
BILIRUBIN | Direct Bilirubin | mg/dL | N | 2
>  | 0 | 0.3
BILIRUBIN | Indirect Bilirubin | mg/dL | N | 2
>  | 0.2 | 0.9
ENZYMES | SGPT (ALT) | U/L | N | 0 | b
> F | 0 | 33
> M | 0 | 41
ENZYMES | SGOT (AST) | U/L | N | 0 | b
> F | 0 | 32
> M | 0 | 40
ENZYMES | Alkaline Phosphatase (ALP) | U/L | N | 0
>  | 44 | 147
ENZYMES | GGT | U/L | N | 0
> F | 6 | 42
> M | 10 | 71
PROTEINS | Total Protein | g/dL | N | 1
>  | 6.4 | 8.3
PROTEINS | Albumin | g/dL | N | 1
>  | 3.5 | 5.2
PROTEINS | Globulin | g/dL | N | 1
>  | 2 | 3.5
PROTEINS | A/G Ratio |  | N | 2
>  | 1.1 | 2.2
# LH (Luteinizing Hormone)
~ ^lh\y|luteinizing|luteinising|^LH$
 | LH | mIU/mL | N | 2 | b
> F |  |  |  |  |  | Follicular: 2.4 - 12.6 | Mid-cycle: 14.0 - 95.6 | Luteal: 1.0 - 11.4 | Post-menopause: 7.7 - 58.5
> M | 1.7 | 8.6
# Lipid Profile
~ lipid
 | Total Cholesterol | mg/dL | N | 0 | b
>  |  | 200 |  |  |  | < 200 (Desirable)
 | Triglycerides | mg/dL | N | 0
>  |  | 150 |  |  |  | < 150 (Normal)
 | HDL Cholesterol | mg/dL | N | 0
> F | 50 |  |  |  |  | > 50
> M | 40 |  |  |  |  | > 40
 | LDL Cholesterol | mg/dL | N | 0 | b
>  |  | 100 |  |  |  | < 100 (Optimal)
 | VLDL Cholesterol | mg/dL | N | 0
>  |  | 30 |  |  |  | < 30
 | Non-HDL Cholesterol | mg/dL | N | 0
>  |  | 130 |  |  |  | < 130
 | Total Cholesterol / HDL Ratio |  | N | 1
>  |  | 5 |  |  |  | < 5
 | LDL / HDL Ratio |  | N | 1
>  |  | 3.5 |  |  |  | < 3.5
# Malaria Parasite (MP)
~ malaria|^mp\y|^Malaria Parasite Smear$
 | Malaria Parasite (MP) / Antigen |  | T
>  |  |  |  |  | Not Detected | Not Detected
# OGTT (Oral Glucose Tolerance Test)
~ ogtt|glucose tolerance|^Oral Glucose Tolerance Test \(OGTT\)$
 | Fasting | mg/dL | N | 0
>  | 70 | 100
 | 1 Hour | mg/dL | N | 0
>  |  | 180 |  |  |  | < 180
 | 2 Hour | mg/dL | N | 0 | b
>  | 70 | 140
# Peripheral Blood Smear
~ smear|^Peripheral Blood Smear \(PBS\)$
PERIPHERAL SMEAR | RBC Morphology |  | T
PERIPHERAL SMEAR | WBC Morphology |  | T
PERIPHERAL SMEAR | Platelets |  | T
PERIPHERAL SMEAR | Haemoparasites |  | T
PERIPHERAL SMEAR | Impression |  | T
= Prolactin | ng/mL | N | 2
~ prolactin
> F | 4.79 | 23.3
> M | 4.04 | 15.2
= Reticulocyte Count | % | N | 1 | EDTA whole blood
~ reticulocyte
>  | 0.5 | 2.5
# Serum Amylase
~ amylase
 | Amylase | U/L | N | 0 | b
>  | 28 | 100
# Serum Calcium
~ ^(serum )?calcium|^Total Calcium$
 | Calcium | mg/dL | N | 1 | b
>  | 8.6 | 10.2 | 6.5 | 13
# Serum Lipase
~ lipase
 | Lipase | U/L | N | 0 | b
>  | 13 | 60
# Serum Magnesium
~ magnesium|^Magnesium$
 | Magnesium | mg/dL | N | 1 | b
>  | 1.6 | 2.6
# Testosterone
~ testosterone|^Testosterone, Total$
 | Testosterone (Total) | ng/dL | N | 0 | b
> F | 15 | 70
> M | 280 | 1100
# Thyroid Profile (T3, T4, TSH)
~ thyroid|^Thyroid Profile \(T3/T4/TSH\)$
THYROID | TSH | µIU/mL | N | 2 | b
>  | 0.4 | 4.2
THYROID | Total T3 | ng/dL | N | 1
>  | 80 | 200
THYROID | Total T4 | µg/dL | N | 2
>  | 5.1 | 14.1
THYROID | Free T3 | pg/mL | N | 2
>  | 2 | 4.4
THYROID | Free T4 | ng/dL | N | 2
>  | 0.93 | 1.7
= Troponin I | ng/mL | N | 3
~ troponin
>  |  | 0.04 |  |  |  | < 0.04
# VDRL / RPR (Syphilis)
~ vdrl|rpr|syphilis|^Syphilis VDRL$
 | VDRL / RPR |  | T
>  |  |  |  |  | Non-Reactive | Non-Reactive
= Vitamin B12 | pg/mL | N | 0
~ b.?12|cobalamin
>  | 200 | 900
= Vitamin D (25-OH) | ng/mL | N | 1
~ vitamin d|25.?oh|vit.? d\y|^25-OH Vitamin D$
>  | 30 | 100 |  |  |  | 30 - 100 (Sufficient)
# Widal Test
~ widal|^Widal Test \(limited reliability\)$
WIDAL | S. Typhi O | titre | T
>  |  |  |  |  | < 1:80 | < 1:80
WIDAL | S. Typhi H | titre | T
>  |  |  |  |  | < 1:80 | < 1:80
WIDAL | S. Paratyphi AH | titre | T
>  |  |  |  |  | < 1:80 | < 1:80
WIDAL | S. Paratyphi BH | titre | T
>  |  |  |  |  | < 1:80 | < 1:80

@ Autoimmune / Immunology | Serum / plasma | ^autoimmune
# ANA by IFA ;; Antinuclear Antibody (ANA)
ANA | ANA Result |  | T
ANA | ANA Titre | titre | T
ANA | Pattern |  | T
# ANA Profile (Immunoblot / Line Assay) | Serum
ANA PROFILE | Nucleosomes |  | T
ANA PROFILE | Double-stranded DNA (dsDNA) |  | T
ANA PROFILE | Histones |  | T
ANA PROFILE | Sm / RNP |  | T
ANA PROFILE | Sm |  | T
ANA PROFILE | SS-A / Ro 60 |  | T
ANA PROFILE | SS-A / Ro 52 |  | T
ANA PROFILE | SS-B / La |  | T
ANA PROFILE | Scl-70 |  | T
ANA PROFILE | CENP-B |  | T
ANA PROFILE | Jo-1 |  | T
ANA PROFILE | Ribosomal P Protein |  | T
 | Interpretation |  | T
# ANCA (c-ANCA / p-ANCA)
ANCA | c-ANCA |  | T
ANCA | p-ANCA |  | T
ANCA | ANCA Titre | titre | T
= Anti-Acetylcholine Receptor (AChR) Antibody | nmol/L | A | 2 | Serum
= Anti-Aquaporin-4 (NMO) Antibody ;; Anti-Endomysial Antibody (EMA) ;; Anti-Intrinsic Factor Antibody ;; Anti-LKM-1 Antibody ;; Anti-Mitochondrial Antibody (AMA) |  | T |  | Serum
= Anti-MOG Antibody ;; Anti-MuSK Antibody ;; Anti-Parietal Cell Antibody ;; Anti-Smooth Muscle Antibody (ASMA) |  | T |  | Serum
= Anti-cardiolipin IgG | GPL U/mL | A | 1
= Anti-cardiolipin IgM | MPL U/mL | A | 1
= Anti-CCP ;; Anti-centromere Antibody ;; Anti-Jo-1 ;; Anti-RNP Antibody ;; Anti-Scl-70 | U/mL | A | 1
= Anti-Sm Antibody ;; Anti-SSA (Ro) ;; Anti-SSB (La) ;; Beta-2 Glycoprotein I IgG ;; Beta-2 Glycoprotein I IgM | U/mL | A | 1
= Anti-dsDNA ;; MPO Antibody ;; PR3 Antibody | IU/mL | A | 1
= Anti-GBM Antibody ;; Anti-Gliadin IgA ;; Anti-Gliadin IgG ;; Anti-Histone Antibody ;; Anti-Nucleosome Antibody | U/mL | A | 1 | Serum
= Anti-Ribosomal P Antibody ;; Anti-tTG IgA ;; Anti-tTG IgG ;; ASCA IgA ;; ASCA IgG | U/mL | A | 1 | Serum
= Anti-PLA2R Antibody | RU/mL | A | 1 | Serum
# Antiphospholipid Antibodies
ANTIPHOSPHOLIPID | Anti-cardiolipin IgG | GPL U/mL | A | 1
ANTIPHOSPHOLIPID | Anti-cardiolipin IgM | MPL U/mL | A | 1
ANTIPHOSPHOLIPID | Beta-2 Glycoprotein I IgG | U/mL | A | 1
ANTIPHOSPHOLIPID | Beta-2 Glycoprotein I IgM | U/mL | A | 1
ANTIPHOSPHOLIPID | Lupus Anticoagulant |  | T
= B Cells (CD19 / CD20) Count ;; NK Cells (CD16 / CD56) Count ;; Total T Cells (CD3) Count | cells/µL | N | 0 | Whole blood (EDTA)
= C1 Esterase Inhibitor (Quantitative) ;; Complement C1q | mg/dL | N | 1 | Serum
# CD4 / CD8 Count | Whole blood (EDTA)
LYMPHOCYTE SUBSETS | Absolute CD4 Count | cells/µL | N | 0
LYMPHOCYTE SUBSETS | CD4 Percentage | % | N | 1
LYMPHOCYTE SUBSETS | Absolute CD8 Count | cells/µL | N | 0
LYMPHOCYTE SUBSETS | CD4 / CD8 Ratio |  | N | 2
= CH50 | U/mL | N | 0
# Coeliac Disease Panel | Serum
COELIAC | Anti-tTG IgA | U/mL | A | 1
COELIAC | Anti-tTG IgG | U/mL | A | 1
COELIAC | Anti-Endomysial Antibody (EMA) IgA |  | T
COELIAC | Deamidated Gliadin Peptide (DGP) IgA | U/mL | A | 1
COELIAC | Deamidated Gliadin Peptide (DGP) IgG | U/mL | A | 1
COELIAC | Total IgA | mg/dL | N | 0
 | Interpretation |  | T
= Cold Agglutinin Titre | titre | T
= Complement C3 ;; Complement C4 ;; Immunoglobulin IgA ;; Immunoglobulin IgG ;; Immunoglobulin IgM | mg/dL | N | 0
# Cryoglobulins
CRYOGLOBULINS | Cryoglobulins (Qualitative) |  | T
CRYOGLOBULINS | Cryocrit | % | A | 1
# Direct Coombs / DAT ;; Indirect Coombs / IAT
COOMBS TEST | Coombs Test Result |  | T
COOMBS TEST | Titre | titre | T
# ENA Profile
ENA | Anti-Sm |  | T
ENA | Anti-RNP / Sm |  | T
ENA | Anti-SSA (Ro) |  | T
ENA | Anti-SSB (La) |  | T
ENA | Anti-Scl-70 |  | T
ENA | Anti-Jo-1 |  | T
= Free Kappa Light Chains ;; Free Lambda Light Chains | mg/L | N | 2
= HLA-B27 |  | T
= HLA-B51 Typing ;; HLA-DQ2 / DQ8 Typing |  | T |  | Whole blood (EDTA)
# Immunofixation Electrophoresis | EDTA whole blood
IMMUNOFIXATION | IgG |  | T
IMMUNOFIXATION | IgA |  | T
IMMUNOFIXATION | IgM |  | T
IMMUNOFIXATION | Kappa Light Chain |  | T
IMMUNOFIXATION | Lambda Light Chain |  | T
 | Impression |  | T
= Immunoglobulin IgE | IU/mL | N | 1
= Nitroblue Tetrazolium (NBT) Test | % | N | 0 | Whole blood (heparin)
# Pemphigus / Pemphigoid Antibodies (ELISA) | Serum
BULLOUS DISEASE | Desmoglein 1 (Dsg1) IgG | U/mL | A | 1
BULLOUS DISEASE | Desmoglein 3 (Dsg3) IgG | U/mL | A | 1
BULLOUS DISEASE | BP180 (NC16A) IgG | U/mL | A | 1
BULLOUS DISEASE | BP230 IgG | U/mL | A | 1
 | Interpretation |  | T
# Serum Protein Electrophoresis (SPEP) | EDTA whole blood
PROTEIN FRACTIONS | Albumin | g/dL | N | 2
PROTEIN FRACTIONS | Alpha-1 Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Alpha-2 Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Beta Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Gamma Globulin | g/dL | N | 2
PROTEIN FRACTIONS | Total Protein | g/dL | N | 1
PROTEIN FRACTIONS | A/G Ratio |  | N | 2
PROTEIN FRACTIONS | M-Band (Paraprotein) | g/dL | A | 2
 | Impression |  | T

@ Biochemistry | Serum / plasma | ^biochem
= 1,5-Anhydroglucitol | µg/mL | N | 1 | Serum
= 5’-Nucleotidase ;; Acid Phosphatase (Total) ;; Adenosine Deaminase (ADA) - Serum ;; Aldolase ;; Angiotensin Converting Enzyme (ACE) | U/L | N | 1 | Serum
= Prostatic Acid Phosphatase (PAP) | U/L | N | 1 | Serum
# Albumin
 | Albumin | g/dL | N | 1 | b
>  | 3.5 | 5.2
# Albumin/Globulin Ratio
 | Albumin/Globulin Ratio |  | N | 2 | b
>  | 1.1 | 2.2
# Alkaline Phosphatase (ALP)
 | Alkaline Phosphatase (ALP) | U/L | N | 0 | b
>  | 44 | 147
= Alpha-1 Antitrypsin ;; Apolipoprotein A1 ;; Apolipoprotein B ;; Transferrin | mg/dL | N | 0
# ALT / SGPT
 | ALT / SGPT | U/L | N | 0 | b
> F | 0 | 33
> M | 0 | 41
= Ammonia ;; Copper ;; Zinc | µg/dL | N | 0
= Arsenic (blood) ;; Mercury (blood) | µg/L | N | 1
# AST / SGOT
 | AST / SGOT | U/L | N | 0 | b
> F | 0 | 32
> M | 0 | 40
= Beta-hydroxybutyrate ;; Ionized Calcium | mmol/L | N | 2
= Bicarbonate / Total CO2 ;; Lactate | mmol/L | N | 1
= Bile Acids ;; Homocysteine | µmol/L | N | 1
# Blood Urea
 | Blood Urea | mg/dL | N | 0 | b
>  | 15 | 45
= Blood Urea Nitrogen (BUN) ;; Ceruloplasmin ;; Lipoprotein(a) / Lp(a) ;; Prealbumin / Transthyretin | mg/dL | N | 1
= C-Peptide ;; Procalcitonin (PCT) | ng/mL | N | 2
= Carnitine, Total and Free | µmol/L | N | 1 | Plasma (heparin)
# Chloride (Cl)
 | Chloride (Cl) | mEq/L | N | 0 | b
>  | 98 | 107
= Cholesterol / HDL Ratio (calculated) ;; LDL / HDL Ratio (calculated) ;; Triglyceride / HDL Ratio (calculated) |  | N | 2 | Serum
= Cholinesterase ;; Lactate Dehydrogenase (LDH) | U/L | N | 0
= Corrected Calcium (calculated) ;; Small Dense LDL (sdLDL) | mg/dL | N | 1 | Serum
= Cystatin C ;; High-sensitivity CRP (hs-CRP) | mg/L | N | 2
# Direct Bilirubin
 | Direct Bilirubin | mg/dL | N | 2 | b
>  | 0 | 0.3
# eGFR (calculated)
 | eGFR (calculated) | mL/min/1.73m² | N | 0 | b
>  | 90 |  |  |  |  | > 90
# Ferritin
 | Ferritin | ng/mL | N | 1 | b
> F | 13 | 150
> M | 30 | 400
= Fructosamine | µmol/L | N | 0
# Gamma-Glutamyl Transferase (GGT)
 | Gamma-Glutamyl Transferase (GGT) | U/L | N | 0 | b
> F | 6 | 42
> M | 10 | 71
# Globulin (calculated)
 | Globulin (calculated) | g/dL | N | 1 | b
>  | 2 | 3.5
# Glucose Challenge Test (GCT, 50 g) | Plasma (fluoride)
GCT | Plasma Glucose (1 hr after 50 g glucose) | mg/dL | N | 0
= Glycated Albumin | % | N | 1 | Serum
= Haptoglobin | mg/dL | N | 0 | Serum
# HDL Cholesterol
 | HDL Cholesterol | mg/dL | N | 0 | b
> F | 50 |  |  |  |  | > 50
> M | 40 |  |  |  |  | > 40
= HOMA-IR (calculated) |  | N | 2
# Indirect Bilirubin (calculated)
 | Indirect Bilirubin (calculated) | mg/dL | N | 2 | b
>  | 0.2 | 0.9
= Insulin | µIU/mL | N | 2
# LDL Cholesterol (direct / calculated)
 | LDL Cholesterol (direct / calculated) | mg/dL | N | 0 | b
>  |  | 100 |  |  |  | < 100 (Optimal)
= Lead (blood) | µg/dL | N | 1
= Lipoprotein-associated Phospholipase A2 (Lp-PLA2) | ng/mL | N | 0 | Serum
= Methylmalonic Acid (MMA) | nmol/L | N | 0 | Serum
= Non-Esterified Fatty Acids (NEFA) | mmol/L | N | 2 | Serum
# Non-HDL Cholesterol
 | Non-HDL Cholesterol | mg/dL | N | 0 | b
>  |  | 130 |  |  |  | < 130
# OGTT for Gestational Diabetes (75 g) | Plasma (fluoride)
GDM OGTT | Fasting Plasma Glucose | mg/dL | N | 0
GDM OGTT | 1 Hour Plasma Glucose | mg/dL | N | 0
GDM OGTT | 2 Hour Plasma Glucose | mg/dL | N | 0
 | Interpretation |  | T
= Phosphorus / Phosphate |  | A
~ ^(serum )?phosph(orus|ate)
# Potassium (K)
 | Potassium (K) | mEq/L | N | 1 | b
>  | 3.5 | 5.1 | 2.5 | 6.5
= Proinsulin | pmol/L | N | 1
= Selenium | µg/L | N | 0
= Serum Amyloid A (SAA) | mg/L | N | 1 | Serum
# Serum Creatinine
 | Serum Creatinine | mg/dL | N | 2 | b
> F | 0.6 | 1.1 |  | 10
> M | 0.7 | 1.3 |  | 10
# Serum Iron
 | Serum Iron | µg/dL | N | 0 | b
> F | 50 | 170
> M | 65 | 175
= Serum Osmolality | mOsm/kg | N | 0
# Sodium (Na)
 | Sodium (Na) | mEq/L | N | 0 | b
>  | 135 | 145 | 120 | 160
= Sweat Chloride Test | mmol/L | N | 0 | Sweat (pilocarpine iontophoresis)
# Total Bilirubin
 | Total Bilirubin | mg/dL | N | 2 | b
>  | 0.2 | 1.2 |  | 15
# Total Cholesterol
 | Total Cholesterol | mg/dL | N | 0 | b
>  |  | 200 |  |  |  | < 200 (Desirable)
# Total Iron Binding Capacity (TIBC)
 | Total Iron Binding Capacity (TIBC) | µg/dL | N | 0 | b
>  | 250 | 450
# Total Protein
 | Total Protein | g/dL | N | 1 | b
>  | 6.4 | 8.3
# Transferrin Saturation
 | Transferrin Saturation | % | N | 1 | b
>  | 20 | 50
# Triglycerides
 | Triglycerides | mg/dL | N | 0 | b
>  |  | 150 |  |  |  | < 150 (Normal)
= Unsaturated Iron Binding Capacity (UIBC) | µg/dL | N | 0 | Serum
# Uric Acid
 | Uric Acid | mg/dL | N | 1 | b
> F | 2.6 | 6
> M | 3.5 | 7.2
= Vitamin K (Phylloquinone) | ng/mL | N | 2 | Serum (protect from light)
# VLDL (calculated)
 | VLDL (calculated) | mg/dL | N | 0 | b
>  |  | 30 |  |  |  | < 30

@ Blood Bank | Serum / plasma | ^blood bank
= Anti-A / Anti-B Isoimmune Titre ;; Anti-D Antibody Titre | titre | T |  | Serum
# Antibody Identification Panel
ANTIBODY PANEL | Panel Reaction |  | T
ANTIBODY PANEL | Antibody Identified |  | T
 | Interpretation |  | T
# Antibody Screen
ANTIBODY SCREEN | Screening Cell I |  | T
ANTIBODY SCREEN | Screening Cell II |  | T
ANTIBODY SCREEN | Screening Cell III |  | T
 | Interpretation |  | T
# Blood Donor Screening (TTI Panel) | Donor blood
TTI SCREEN | HIV 1 & 2 |  | T
TTI SCREEN | HBsAg |  | T
TTI SCREEN | Anti-HCV |  | T
TTI SCREEN | Syphilis (VDRL / RPR) |  | T
TTI SCREEN | Malaria Antigen |  | T
= Bombay Blood Group (Oh) Screening ;; Reverse Grouping (Serum Typing) ;; Weak D (Du) Test |  | T |  | Whole blood (EDTA) / serum
# Crossmatch / Compatibility Testing
CROSSMATCH | Donor Unit Number |  | T
CROSSMATCH | Donor Blood Group |  | T
CROSSMATCH | Major Crossmatch |  | T
CROSSMATCH | Minor Crossmatch |  | T
 | Interpretation |  | T
# Extended Red Cell Phenotyping
RH PHENOTYPE | Rh (C) |  | T
RH PHENOTYPE | Rh (c) |  | T
RH PHENOTYPE | Rh (E) |  | T
RH PHENOTYPE | Rh (e) |  | T
OTHER SYSTEMS | Kell (K) |  | T
OTHER SYSTEMS | Duffy (Fya) |  | T
OTHER SYSTEMS | Duffy (Fyb) |  | T
OTHER SYSTEMS | Kidd (Jka) |  | T
OTHER SYSTEMS | Kidd (Jkb) |  | T
# Hemolysis Workup
HAEMOLYSIS WORKUP | Direct Coombs (DAT) |  | T
HAEMOLYSIS WORKUP | Free Plasma Haemoglobin | mg/dL | N | 1
HAEMOLYSIS WORKUP | Haptoglobin | mg/dL | N | 0
HAEMOLYSIS WORKUP | LDH | U/L | N | 0
HAEMOLYSIS WORKUP | Reticulocyte Count | % | N | 1
 | Impression |  | T
# HLA Typing (transplant use)
HLA TYPING | HLA-A |  | T
HLA TYPING | HLA-B |  | T
HLA TYPING | HLA-C |  | T
HLA TYPING | HLA-DRB1 |  | T
HLA TYPING | HLA-DQB1 |  | T
# Neonatal Blood Group and Coombs (Cord Blood) | Cord blood (EDTA)
NEONATAL | ABO Group |  | T
NEONATAL | Rh (D) Type |  | T
NEONATAL | Direct Coombs (DAT) |  | T
= Rh(D) Typing |  | T
# Transfusion Reaction Investigation | Post-transfusion blood + donor bag segment
TRANSFUSION REACTION | Patient ABO / Rh (Pre-transfusion) |  | T
TRANSFUSION REACTION | Patient ABO / Rh (Post-transfusion) |  | T
TRANSFUSION REACTION | Donor Unit ABO / Rh |  | T
TRANSFUSION REACTION | Clerical Check |  | T
TRANSFUSION REACTION | Visual Haemolysis (Plasma) |  | T
TRANSFUSION REACTION | Direct Coombs (DAT) |  | T
TRANSFUSION REACTION | Repeat Crossmatch |  | T
 | Interpretation |  | T

@ Coagulation | Serum / plasma | ^coagul
# Activated Partial Thromboplastin Time (aPTT) | Citrated plasma
 | Activated Partial Thromboplastin Time (aPTT) | sec | N | 1 | b
>  | 25 | 35
= Activated Protein C Resistance (APCR) ;; Factor XIII Clot Solubility Test |  | T |  | Citrated plasma
= Alpha-2 Antiplasmin ;; Factor XIII Activity ;; Plasminogen Activity | % | N | 0 | Citrated plasma
= Anti-Xa Assay | IU/mL | N | 2
= Antithrombin III ;; Protein C Activity ;; Protein S Activity ;; von Willebrand Factor Activity ;; von Willebrand Factor Antigen | % | N | 0
= Clot Retraction Test |  | T |  | Whole blood (no anticoagulant)
# Coagulation Mixing Study
MIXING STUDY | Baseline aPTT (Patient) | sec | N | 1
MIXING STUDY | aPTT after 1:1 Mix (Immediate) | sec | N | 1
MIXING STUDY | aPTT after 1:1 Mix (Incubated 2 hr) | sec | N | 1
 | Interpretation |  | T
= D-Dimer | ng/mL FEU | N | 0
= Euglobulin Lysis Time | min | N | 0 | Citrated plasma
= Factor IX Activity ;; Factor V Activity ;; Factor VII Activity ;; Factor VIII Activity ;; Factor X Activity | % | N | 1
= Factor XI Activity ;; Factor XII Activity | % | N | 1
# Factor VIII Inhibitor (Bethesda Assay) | Citrated plasma
INHIBITOR | Inhibitor Titre | BU | N | 1
 | Interpretation |  | T
= Fibrin Degradation Products (FDP) | µg/mL | N | 1
= Fibrinogen | mg/dL | N | 0
= Heparin-induced Thrombocytopenia (HIT) Antibody (PF4) |  | A | 2 | Serum / citrated plasma
# International Normalized Ratio (INR) | Citrated plasma
 | International Normalized Ratio (INR) |  | N | 2 | b
>  | 0.8 | 1.2
# Lupus Anticoagulant
LUPUS ANTICOAGULANT | dRVVT Screen | sec | N | 1
LUPUS ANTICOAGULANT | dRVVT Confirm | sec | N | 1
LUPUS ANTICOAGULANT | Normalised dRVVT Ratio |  | N | 2
 | Interpretation |  | T
# PFA-100 (Platelet Function Analyser) | Citrated whole blood
PFA-100 | Closure Time (Collagen / Epinephrine) | sec | N | 0
PFA-100 | Closure Time (Collagen / ADP) | sec | N | 0
 | Interpretation |  | T
# Platelet Aggregation Study | Citrated platelet-rich plasma
PLATELET AGGREGATION | ADP | % | N | 0
PLATELET AGGREGATION | Collagen | % | N | 0
PLATELET AGGREGATION | Epinephrine | % | N | 0
PLATELET AGGREGATION | Arachidonic Acid | % | N | 0
PLATELET AGGREGATION | Ristocetin | % | N | 0
 | Interpretation |  | T
# Prothrombin Time (PT) | Citrated plasma
 | Prothrombin Time (PT) | sec | N | 1 | b
>  | 11 | 13.5
= Reptilase Time | sec | N | 1 | Citrated plasma
# ROTEM
ROTEM (EXTEM) | CT (Clotting Time) | sec | N | 0
ROTEM (EXTEM) | CFT (Clot Formation Time) | sec | N | 0
ROTEM (EXTEM) | Alpha Angle | ° | N | 0
ROTEM (EXTEM) | A10 | mm | N | 0
ROTEM (EXTEM) | MCF (Maximum Clot Firmness) | mm | N | 0
ROTEM (EXTEM) | ML (Maximum Lysis) | % | N | 0
# Thrombin Time (TT)
COAGULATION | Thrombin Time (TT) | sec | N | 1 | b
COAGULATION | Control (TT) | sec | N | 1
# Thromboelastography (TEG)
TEG | R Time | min | N | 1
TEG | K Time | min | N | 1
TEG | Alpha Angle | ° | N | 1
TEG | MA (Maximum Amplitude) | mm | N | 1
TEG | LY30 | % | N | 1

@ Critical Care | Serum / plasma
= Anion Gap (calculated) | mEq/L | N | 1
# Arterial Blood Gas (ABG) | Heparinised whole blood | Blood gas analyser
BLOOD GAS | pH |  | N | 2
BLOOD GAS | pCO2 | mmHg | N | 1
BLOOD GAS | pO2 | mmHg | N | 1
BLOOD GAS | HCO3 | mmol/L | N | 1
BLOOD GAS | Base Excess (BE) | mmol/L | N | 1
BLOOD GAS | O2 Saturation (SaO2) | % | N | 1
BLOOD GAS | Lactate | mmol/L | N | 1
= Blood Lactate | mmol/L | N | 1
# Co-oximetry
CO-OXIMETRY | Total Haemoglobin (tHb) | g/dL | N | 1
CO-OXIMETRY | Oxyhaemoglobin (O2Hb) | % | N | 1
CO-OXIMETRY | Deoxyhaemoglobin (HHb) | % | N | 1
CO-OXIMETRY | Carboxyhaemoglobin (COHb) | % | N | 1
CO-OXIMETRY | Methaemoglobin (MetHb) | % | N | 1
= Ionized Calcium | mmol/L | N | 2
# Ketones / Beta-hydroxybutyrate
KETONES | Ketones (Qualitative) |  | T
KETONES | Beta-hydroxybutyrate | mmol/L | N | 2
= Serum Osmolality | mOsm/kg | N | 0
# Venous Blood Gas (VBG) | Heparinised whole blood | Blood gas analyser
BLOOD GAS | pH |  | N | 2
BLOOD GAS | pCO2 | mmHg | N | 1
BLOOD GAS | pO2 | mmHg | N | 1
BLOOD GAS | HCO3 | mmol/L | N | 1
BLOOD GAS | Base Excess (BE) | mmol/L | N | 1
BLOOD GAS | O2 Saturation (SvO2) | % | N | 1

@ Endocrinology | Serum / plasma | ^endocrin
= 17-OH Progesterone ;; Anti-Müllerian Hormone (AMH) ;; Growth Hormone ;; Progesterone | ng/mL | N | 2
= ACTH ;; Calcitonin ;; Inhibin A ;; Inhibin B ;; Parathyroid Hormone (PTH) | pg/mL | N | 1
# ACTH Stimulation (Synacthen) Test | Serum
ACTH STIMULATION | Baseline Cortisol | µg/dL | N | 1
ACTH STIMULATION | Cortisol at 30 min | µg/dL | N | 1
ACTH STIMULATION | Cortisol at 60 min | µg/dL | N | 1
 | Interpretation |  | T
= Aldosterone | ng/dL | N | 1
= Aldosterone-Renin Ratio | ng/dL per ng/mL/hr | N | 1
= Androstenedione ;; Estriol (E3) | ng/mL | N | 2 | Serum
= Anti-Insulin Antibody ;; GAD-65 Antibody ;; IA-2 Antibody | U/mL | A | 1 | Serum
= Anti-Thyroglobulin Antibody ;; Anti-TPO Antibody | IU/mL | A | 1
= Bioavailable Testosterone ;; Reverse T3 (rT3) | ng/dL | N | 1 | Serum
= Cortisol (evening) ;; Cortisol (morning) ;; DHEA-S | µg/dL | N | 1
= Cortisol (midnight) | µg/dL | N | 1 | Serum
# Dexamethasone Suppression Test (Overnight 1 mg) | Serum
DEXAMETHASONE SUPPRESSION | Baseline Cortisol (8 AM) | µg/dL | N | 1
DEXAMETHASONE SUPPRESSION | Cortisol after 1 mg Dexamethasone | µg/dL | N | 1
 | Interpretation |  | T
= Dihydrotestosterone (DHT) | pg/mL | N | 0 | Serum
= Direct Renin | µIU/mL | N | 1
= Free Androgen Index (calculated) ;; LH / FSH Ratio (calculated) |  | N | 2 | Serum
# Free T3 (FT3)
 | Free T3 (FT3) | pg/mL | N | 2 | b
>  | 2 | 4.4
# Free T4 (FT4)
 | Free T4 (FT4) | ng/dL | N | 2 | b
>  | 0.93 | 1.7
= Gastrin ;; Glucagon ;; Vasopressin (ADH) | pg/mL | N | 1 | Plasma (EDTA, chilled)
# Growth Hormone Suppression Test (OGTT) | Serum
GH SUPPRESSION | Growth Hormone (0 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (30 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (60 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (90 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (120 min) | ng/mL | N | 2
 | Interpretation |  | T
= IGF-1 | ng/mL | N | 0
= Leptin | ng/mL | N | 1 | Serum
= Macroprolactin (PEG Precipitation) | % | N | 0 | Serum
# OGTT with Insulin Response | Plasma (fluoride) + serum
GLUCOSE | Fasting Glucose | mg/dL | N | 0
GLUCOSE | 1 Hour Glucose | mg/dL | N | 0
GLUCOSE | 2 Hour Glucose | mg/dL | N | 0
INSULIN | Fasting Insulin | µIU/mL | N | 2
INSULIN | 1 Hour Insulin | µIU/mL | N | 2
INSULIN | 2 Hour Insulin | µIU/mL | N | 2
 | Interpretation |  | T
= PAPP-A | mIU/L | N | 2
= Plasma Renin Activity | ng/mL/hr | N | 2
= Sex Hormone Binding Globulin (SHBG) | nmol/L | N | 1
= Testosterone, Free | pg/mL | N | 2
= Thyroglobulin | ng/mL | N | 1
# Thyroid Stimulating Hormone (TSH)
 | Thyroid Stimulating Hormone (TSH) | µIU/mL | N | 2 | b
>  | 0.4 | 4.2
= Thyroxine-Binding Globulin (TBG) | µg/mL | N | 1 | Serum
# Total T3
 | Total T3 | ng/dL | N | 1 | b
>  | 80 | 200
# Total T4
 | Total T4 | µg/dL | N | 2 | b
>  | 5.1 | 14.1
= TSH Receptor Antibody (TRAb) | IU/L | A | 2

@ Hematology | Serum / plasma | ^h(a)?ematolog
= Absolute Basophil Count ;; Absolute Lymphocyte Count (ALC) ;; Absolute Monocyte Count ;; Absolute Neutrophil Count (ANC) | /cumm | N | 0 | Whole blood (EDTA)
= Absolute Eosinophil Count (AEC) ;; Eosinophil Count | /cumm | N | 0
= Absolute Reticulocyte Count | /cumm | N | 0 | EDTA whole blood
= Bleeding Time (BT) ;; Clotting Time (CT) | min | N | 1 | Capillary / whole blood
# Bone Marrow Aspiration Studies
BONE MARROW ASPIRATE | Cellularity |  | T
BONE MARROW ASPIRATE | Erythropoiesis |  | T
BONE MARROW ASPIRATE | Myelopoiesis |  | T
BONE MARROW ASPIRATE | Megakaryopoiesis |  | T
BONE MARROW ASPIRATE | Lymphocytes / Plasma Cells |  | T
BONE MARROW ASPIRATE | Blasts | % | A | 0
BONE MARROW ASPIRATE | Myeloid : Erythroid (M:E) Ratio |  | T
BONE MARROW ASPIRATE | Iron Stores |  | T
 | Impression |  | T
# Bone Marrow Biopsy Studies
BONE MARROW BIOPSY | Cellularity |  | T
BONE MARROW BIOPSY | Haematopoietic Elements |  | T
BONE MARROW BIOPSY | Reticulin Fibrosis |  | T
BONE MARROW BIOPSY | Abnormal Infiltrate |  | T
 | Impression |  | T
# Complete Hemogram | EDTA whole blood
< CBC (Complete Blood Count)
# Differential Leukocyte Count (DLC) | EDTA whole blood
DIFFERENTIAL COUNT | Neutrophils | % | N | 0
DIFFERENTIAL COUNT | Lymphocytes | % | N | 0
DIFFERENTIAL COUNT | Monocytes | % | N | 0
DIFFERENTIAL COUNT | Eosinophils | % | N | 0
DIFFERENTIAL COUNT | Basophils | % | N | 0
= G6PD Enzyme Assay | U/g Hb | N | 1 | EDTA whole blood
= Haemoglobin H Inclusion Body Test ;; Ham’s Acidified Serum Test ;; Heinz Body Test ;; Sucrose Lysis Test (PNH Screen) |  | T |  | Whole blood (EDTA)
# Hb Electrophoresis ;; Hemoglobin HPLC | EDTA whole blood
HAEMOGLOBIN FRACTIONS | Hb A | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb A2 | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb F | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb S | % | N | 1
HAEMOGLOBIN FRACTIONS | Hb C | % | N | 1
HAEMOGLOBIN FRACTIONS | Other Variants (Hb D / E / Bart) |  | T
 | Impression |  | T
= HbA2 Quantification ;; HbF Quantification | % | N | 1
# Hematocrit / Packed Cell Volume (PCV)
 | Hematocrit / Packed Cell Volume (PCV) | % | N | 1 | b
> F | 36 | 46
> M | 40 | 50
= Immature Platelet Fraction (IPF) | % | N | 1 | EDTA whole blood
# Kleihauer-Betke Test (Fetal Cells in Maternal Blood) | Maternal blood (EDTA)
KLEIHAUER-BETKE | Fetal Red Cells | % | N | 2
KLEIHAUER-BETKE | Estimated Fetomaternal Haemorrhage | mL | N | 1
 | Interpretation |  | T
# LD Body Smear (Kala-azar) | Bone marrow / splenic aspirate smear
LD BODY | LD Bodies Seen |  | T
 | Impression |  | T
= LE Cell Test (legacy / limited use) |  | T
# Malarial Antigen Rapid Test
MALARIA ANTIGEN | P. falciparum (HRP-2) |  | T
MALARIA ANTIGEN | P. vivax (pLDH) |  | T
# Mean Corpuscular Hemoglobin (MCH) | EDTA whole blood
 | Mean Corpuscular Hemoglobin (MCH) | pg | N | 1 | b
>  | 27 | 32
# Mean Corpuscular Hemoglobin Concentration (MCHC) | EDTA whole blood
 | Mean Corpuscular Hemoglobin Concentration (MCHC) | g/dL | N | 1 | b
>  | 31.5 | 34.5
# Mean Corpuscular Volume (MCV)
 | Mean Corpuscular Volume (MCV) | fL | N | 1 | b
>  | 83 | 101
= Mean Platelet Volume (MPV) | fL | N | 1 | EDTA whole blood
# Microfilaria Detection (Night Blood Smear) | Peripheral blood (night collection)
MICROFILARIA | Microfilariae Seen |  | T
MICROFILARIA | Species |  | T
 | Impression |  | T
= Nucleated RBC Count | /100 WBC | N | 0
# Osmotic Fragility Test
OSMOTIC FRAGILITY | Initial Haemolysis (Onset) | % NaCl | N | 2
OSMOTIC FRAGILITY | Complete Haemolysis | % NaCl | N | 2
# Platelet Count | EDTA whole blood
 | Platelet Count | /cumm | N | 0 | b
>  | 150000 | 410000 | 20000 | 1000000
# Red Blood Cell Count (RBC)
 | Red Blood Cell Count (RBC) | million/cumm | N | 2 | b
> F | 3.8 | 4.8
> M | 4.5 | 5.5
# Red Cell Distribution Width (RDW-CV)
 | Red Cell Distribution Width (RDW-CV) | % | N | 1 | b
>  | 11.6 | 14
= Red Cell Distribution Width (RDW-SD) | fL | N | 1
# Sickle Cell Screening / Sickling Test
SICKLING | Sickling Test (Sodium Metabisulphite) |  | T
SICKLING | Solubility Test (HbS) |  | T
 | Impression |  | T
# Total Leukocyte Count (TLC) | EDTA whole blood
 | Total Leukocyte Count (TLC) | /cumm | N | 0 | b
>  | 4000 | 11000 | 2000 | 30000

@ Immunoassay | Serum / plasma | ^immunoassay
= 1,25-dihydroxy Vitamin D ;; BNP | pg/mL | N | 1
= AFP ;; CEA ;; CYFRA 21-1 ;; Free PSA ;; Prostate-Specific Antigen (PSA), Total | ng/mL | N | 2
= SCC Antigen | ng/mL | N | 2
= AFP-L3 Fraction ;; Free / Total PSA Ratio (calculated) | % | N | 1 | Serum
= Beta-CTX / CTX ;; Troponin T | ng/mL | N | 3
= Bone-specific Alkaline Phosphatase ;; P1NP ;; Vitamin B1 (Thiamine) | µg/L | N | 1
= CA 15-3 ;; CA 19-9 ;; CA 72-4 ;; CA-125 | U/mL | N | 1
= CA 242 ;; CA 27.29 ;; CA 50 | U/mL | N | 1 | Serum
= Carboxyhemoglobin ;; Methemoglobin | % | N | 1 | EDTA whole blood
= Chromogranin A ;; Folate / Folic Acid ;; Myoglobin ;; Neuron-Specific Enolase (NSE) ;; Osteocalcin | ng/mL | N | 1
= Vitamin B6 | ng/mL | N | 1
= HE4 | pmol/L | N | 1
= High-sensitivity Troponin I ;; High-sensitivity Troponin T | ng/L | N | 1
= Holotranscobalamin (Active B12) | pmol/L | N | 1 | Serum
= Interleukin-6 (IL-6) ;; ProGRP | pg/mL | N | 1 | Serum
= NT-proBNP | pg/mL | N | 0
= PIVKA-II (DCP) | mAU/mL | N | 1 | Serum
= Presepsin | pg/mL | N | 0 | Plasma (EDTA)
= RBC Folate | ng/mL | N | 0 | Whole blood (EDTA)
= S-100B Protein | µg/L | N | 2 | Serum
= Serum Beta-hCG | mIU/mL | N | 2
= Specific IgE (Single Allergen) | kUA/L | A | 2 | Serum
= Tryptase (Serum) | µg/L | N | 1 | Serum
= Vitamin A | µg/dL | N | 1
= Vitamin C | mg/dL | N | 2
= Vitamin E | mg/L | N | 1

@ Microbiology | Sterile fluid / tissue / stool | ^microbio
# AFB Culture (LJ / MGIT) | Sputum / body fluid / tissue
AFB CULTURE | Culture Result |  | T
AFB CULTURE | Organism Identified |  | T
AFB CULTURE | Incubation Period | weeks | A | 0
# AFB Smear (ZN Stain) | Sputum / smear
ZN STAIN | AFB Seen |  | T
ZN STAIN | Grading |  | T
= Albert Stain (Diphtheria) ;; Dark-field Microscopy (Treponema) ;; India Ink Preparation (Cryptococcus) ;; Lactophenol Cotton Blue Mount ;; Wet Mount (Saline) for Trichomonas / Yeast |  | T |  | Smear / body fluid
# Anaerobic Culture & Sensitivity ;; Ascitic Fluid Culture & Sensitivity ;; Bile Culture & Sensitivity ;; Bone Marrow Culture & Sensitivity ;; Peritoneal Dialysis Fluid Culture & Sensitivity ;; Pleural Fluid Culture & Sensitivity ;; Synovial Fluid Culture & Sensitivity ;; Tissue / Biopsy Culture & Sensitivity ;; Vibrio cholerae Culture & Sensitivity
CULTURE | Gram Stain |  | T
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Antibiotic Susceptibility Testing (Isolate) | Bacterial isolate
AST | Organism |  | T
AST | Sensitive To |  | T
AST | Intermediate To |  | T
AST | Resistant To |  | T
# Blood Culture ;; Blood Culture and Sensitivity ;; Blood Culture, Aerobic ;; Blood Culture, Anaerobic ;; Blood Culture, Fungal ;; Blood Culture, Mycobacterial (specialized) ;; Blood Culture, Pediatric | Blood (culture bottles) | Blood culture; identification and susceptibility testing
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
CULTURE | Time to Positivity | hours | A | 0
CULTURE | Incubation Period | days | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Body Fluid Culture & Sensitivity ;; CSF Culture & Sensitivity | Sterile body fluid / CSF
CULTURE | Gram Stain |  | T
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Bronchoalveolar Lavage (BAL) Culture & Sensitivity ;; Endotracheal Aspirate (ETA) Culture & Sensitivity ;; Gastric Aspirate Culture & Sensitivity ;; Nasopharyngeal Swab Culture & Sensitivity ;; Tracheal Aspirate Culture & Sensitivity | Respiratory / aspirate sample
CULTURE | Gram Stain |  | T
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
CULTURE | Colony Count | CFU/mL | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
= Candida auris Screening ;; ESBL / Carbapenemase (CRE) Screening ;; VRE Screening (Rectal Swab) |  | T |  | Swab / isolate
# Catheter Tip Culture & Sensitivity | Catheter tip
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
CULTURE | Colony Count (Roll Plate) | CFU | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Cervical Swab Culture & Sensitivity ;; High Vaginal Swab (HVS) Culture & Sensitivity ;; Urethral Swab Culture & Sensitivity | Genital swab
CULTURE | Gram Stain |  | T
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Corneal Scraping (Gram / KOH / Culture) | Corneal scraping
CORNEAL SCRAPING | Gram Stain |  | T
CORNEAL SCRAPING | KOH Mount |  | T
CORNEAL SCRAPING | Culture Result |  | T
CORNEAL SCRAPING | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Ear Swab Culture & Sensitivity ;; Eye Swab Culture & Sensitivity ;; Nasal Swab Culture & Sensitivity ;; Throat Swab Culture & Sensitivity ;; Wound Swab Culture & Sensitivity | Swab
CULTURE | Gram Stain |  | T
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Fungal Culture (with KOH Mount) | Skin / nail / hair / body fluid
FUNGAL CULTURE | KOH Mount |  | T
FUNGAL CULTURE | Culture Result |  | T
FUNGAL CULTURE | Organism Isolated |  | T
FUNGAL CULTURE | Incubation Period | days | A | 0
# Gram Stain | Smear
GRAM STAIN | Pus Cells | /HPF | T
GRAM STAIN | Epithelial Cells | /HPF | T
GRAM STAIN | Organisms Seen |  | T
 | Impression |  | T
= KOH Mount (Skin / Nail / Hair) |  | T |  | Skin scraping / nail / hair
# Line Probe Assay (First & Second Line TB Drugs) | Sputum / culture isolate
LINE PROBE ASSAY | Rifampicin (rpoB) |  | T
LINE PROBE ASSAY | Isoniazid High-level (katG) |  | T
LINE PROBE ASSAY | Isoniazid Low-level (inhA) |  | T
LINE PROBE ASSAY | Fluoroquinolones (gyrA / gyrB) |  | T
LINE PROBE ASSAY | Aminoglycosides / Capreomycin (rrs / eis) |  | T
 | Interpretation |  | T
= Minimum Inhibitory Concentration (MIC / E-test) | µg/mL | N | 2 | Bacterial isolate
# MRSA Screening (Nasal Swab) | Nasal swab
MRSA SCREEN | MRSA Screen Result |  | T
MRSA SCREEN | Organism Isolated |  | T
# OT / Environmental Surveillance Culture | Swab / settle plate
SURVEILLANCE | Culture Result |  | T
SURVEILLANCE | Organism Isolated |  | T
SURVEILLANCE | Colony Count | CFU | A | 0
# Pus Culture & Sensitivity | Pus / aspirate
CULTURE | Gram Stain |  | T
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Semen Culture & Sensitivity | Semen
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
CULTURE | Colony Count | CFU/mL | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Slit Skin Smear for AFB (Leprosy) | Slit skin smear
SLIT SKIN SMEAR | Bacteriological Index (BI) |  | A | 1
SLIT SKIN SMEAR | Morphological Index (MI) | % | A | 0
 | Impression |  | T
# Sputum Culture & Sensitivity | Sputum
CULTURE | Gram Stain |  | T
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Stool Culture & Sensitivity | Stool / rectal swab
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Urine Culture & Sensitivity | Urine (mid-stream / catheter)
CULTURE | Culture Result |  | T
CULTURE | Organism Isolated |  | T
CULTURE | Colony Count | CFU/mL | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To |  | T
ANTIBIOTIC SENSITIVITY | Intermediate To |  | T
ANTIBIOTIC SENSITIVITY | Resistant To |  | T
# Water Bacteriological Analysis (Potability) | Water (sterile bottle)
WATER ANALYSIS | Total Coliform Count (MPN) | MPN/100 mL | A | 0
WATER ANALYSIS | Faecal Coliform / E. coli (MPN) | MPN/100 mL | A | 0
WATER ANALYSIS | Total Viable Count (22 °C) | CFU/mL | A | 0
 | Interpretation |  | T
# Xpert MTB/RIF (CBNAAT) | Sputum / body fluid / tissue
CBNAAT | MTB Detection |  | T
CBNAAT | Semi-quantitative Load |  | T
CBNAAT | Rifampicin Resistance |  | T

@ Molecular / Genetics | Blood (EDTA) / swab / fluid | ^molecular
# Adenovirus DNA PCR (Quantitative) ;; BK Virus DNA PCR (Quantitative) ;; CMV DNA PCR (Quantitative) ;; EBV DNA PCR (Quantitative) | Plasma / whole blood (EDTA)
VIRAL LOAD | Viral Load | copies/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 copies/mL | A | 2
= ALK Rearrangement ;; Chromosomal Microarray (CMA) ;; Cystic Fibrosis (CFTR) Mutation Analysis ;; Duchenne / Becker Muscular Dystrophy (MLPA) ;; HBB Sickle Cell Mutation Analysis |  | T |  | Blood (EDTA) / FFPE tissue
= HLA-B*5701 Typing ;; Huntington Disease (CAG Repeat) ;; MSI (Microsatellite Instability) Testing ;; Pharmacogenomics (CYP2C19 / CYP2D6) ;; ROS1 Rearrangement |  | T |  | Blood (EDTA) / FFPE tissue
= Whole Exome Sequencing |  | T |  | Blood (EDTA) / FFPE tissue
# Alpha-thalassemia Molecular Testing | EDTA whole blood
MOLECULAR | Alpha Globin Gene Deletions / Mutations |  | T
MOLECULAR | Genotype |  | T
 | Interpretation |  | T
# BCR-ABL1 (CML Testing) | EDTA whole blood
MOLECULAR | BCR-ABL1 Transcript (Qualitative) |  | T
MOLECULAR | BCR-ABL1 / ABL1 Ratio (International Scale) | %IS | A | 4
 | Interpretation |  | T
# Beta-thalassemia Molecular Testing | EDTA whole blood
MOLECULAR | HBB Gene Mutation(s) |  | T
MOLECULAR | Genotype |  | T
 | Interpretation |  | T
# BRCA1 Genetic Testing ;; BRCA2 Genetic Testing | Serum / plasma
MOLECULAR | Variant(s) Detected |  | T
MOLECULAR | Classification |  | T
 | Interpretation |  | T
# Cell-free Fetal DNA / NIPT | Serum / plasma
NIPT | Trisomy 21 (Down Syndrome) |  | T
NIPT | Trisomy 18 (Edwards Syndrome) |  | T
NIPT | Trisomy 13 (Patau Syndrome) |  | T
NIPT | Sex Chromosome Aneuploidy |  | T
NIPT | Fetal Fraction | % | A | 1
 | Overall Result |  | T
= Chlamydia trachomatis PCR ;; Dengue Virus RNA PCR ;; Herpes Simplex Virus (HSV 1 / 2) PCR ;; Leishmania PCR ;; Malaria PCR (Species Identification) |  | T
= Mpox (Monkeypox) PCR ;; Mycobacterium tuberculosis PCR ;; Mycoplasma genitalium PCR ;; Neisseria gonorrhoeae PCR ;; Toxoplasma gondii PCR |  | T
= Trichomonas vaginalis PCR ;; Varicella Zoster Virus PCR ;; Zika Virus RNA PCR |  | T
# DNA Paternity / Relationship Testing | Blood (EDTA) / buccal swab
PATERNITY | STR Loci Tested |  | T
PATERNITY | Combined Paternity Index |  | A | 2
PATERNITY | Probability of Paternity | % | A | 4
 | Conclusion |  | T
# EGFR Mutation Analysis | FFPE tissue / plasma
EGFR | Exon 18 |  | T
EGFR | Exon 19 Deletion |  | T
EGFR | Exon 20 (incl. T790M / Insertions) |  | T
EGFR | Exon 21 (L858R) |  | T
 | Interpretation |  | T
# Factor V Leiden Mutation | Serum / plasma
MOLECULAR | Factor V Leiden (G1691A) |  | T
 | Interpretation |  | T
# FISH Analysis | Blood / marrow / FFPE tissue
FISH | Probe(s) Used |  | T
FISH | Cells Scored | cells | N | 0
FISH | Abnormal Cells | % | A | 1
FISH | Result |  | T
 | Interpretation |  | T
# Flow Cytometry (blood / marrow) ;; Immunophenotyping (blood / marrow) | Serum / plasma
FLOW CYTOMETRY | Sample Viability | % | A | 0
FLOW CYTOMETRY | Blasts | % | A | 1
FLOW CYTOMETRY | Markers Positive |  | T
FLOW CYTOMETRY | Markers Negative |  | T
 | Immunophenotype / Impression |  | T
# FLT3 and NPM1 Mutation Analysis | Blood / marrow (EDTA)
MOLECULAR | FLT3-ITD |  | T
MOLECULAR | FLT3-TKD (D835) |  | T
MOLECULAR | NPM1 Mutation |  | T
 | Interpretation |  | T
= HBV Drug Resistance Mutations ;; HBV Genotyping ;; HCV Genotyping ;; HIV Drug Resistance (Genotypic) ;; HIV-1 DNA PCR (Early Infant Diagnosis) |  | T |  | Blood (EDTA) / plasma / dried blood spot
# HLA Typing for Transplant | Serum / plasma
HLA TYPING | HLA-A |  | T
HLA TYPING | HLA-B |  | T
HLA TYPING | HLA-C |  | T
HLA TYPING | HLA-DRB1 |  | T
HLA TYPING | HLA-DQB1 |  | T
# HPV DNA Test (High-risk Genotyping) | Cervical sample (LBC medium)
HPV | HPV 16 |  | T
HPV | HPV 18 |  | T
HPV | Other High-risk HPV (31, 33, 35, 39, 45, 51, 52, 56, 58, 59, 66, 68) |  | T
 | Interpretation |  | T
# Influenza A / B / H1N1 PCR | Nasopharyngeal swab (VTM)
INFLUENZA | Influenza A |  | T
INFLUENZA | Influenza A H1N1 (pdm09) |  | T
INFLUENZA | Influenza A H3N2 |  | T
INFLUENZA | Influenza B |  | T
# Inherited Thrombophilia Panel | Serum / plasma
MOLECULAR | Factor V Leiden (G1691A) |  | T
MOLECULAR | Prothrombin G20210A |  | T
MOLECULAR | MTHFR C677T |  | T
MOLECULAR | MTHFR A1298C |  | T
 | Interpretation |  | T
# JAK2 V617F Mutation | Serum / plasma
MOLECULAR | JAK2 V617F Mutation |  | T
MOLECULAR | Allele Burden | % | A | 1
# KRAS / NRAS / BRAF Mutation Panel | FFPE tissue
RAS / RAF | KRAS (Exons 2, 3, 4) |  | T
RAS / RAF | NRAS (Exons 2, 3, 4) |  | T
RAS / RAF | BRAF V600E |  | T
 | Interpretation |  | T
# MTHFR Mutation Analysis | Blood (EDTA)
MOLECULAR | MTHFR C677T |  | T
MOLECULAR | MTHFR A1298C |  | T
 | Interpretation |  | T
# PML-RARA Transcript (t(15;17)) | Blood / marrow (EDTA)
MOLECULAR | PML-RARA Transcript |  | T
MOLECULAR | PML-RARA / ABL1 Ratio | % | A | 4
 | Interpretation |  | T
# Prenatal Karyotype (Amniotic Fluid / CVS) | Amniotic fluid / chorionic villi
KARYOTYPE | Cells Counted | cells | N | 0
KARYOTYPE | Banding Resolution |  | T
KARYOTYPE | Karyotype |  | T
 | Interpretation |  | T
# Prothrombin G20210A Mutation | Serum / plasma
MOLECULAR | Prothrombin G20210A |  | T
 | Interpretation |  | T
# Respiratory Viral Panel (Multiplex PCR) | Nasopharyngeal swab (VTM)
RESPIRATORY PANEL | Influenza A |  | T
RESPIRATORY PANEL | Influenza B |  | T
RESPIRATORY PANEL | Respiratory Syncytial Virus (RSV) |  | T
RESPIRATORY PANEL | Adenovirus |  | T
RESPIRATORY PANEL | Rhinovirus / Enterovirus |  | T
RESPIRATORY PANEL | Human Metapneumovirus |  | T
RESPIRATORY PANEL | Parainfluenza Virus |  | T
RESPIRATORY PANEL | SARS-CoV-2 |  | T
# SARS-CoV-2 RT-PCR | Nasopharyngeal + oropharyngeal swab (VTM)
SARS-COV-2 | SARS-CoV-2 RNA |  | T
SARS-COV-2 | E Gene Ct Value |  | A | 1
SARS-COV-2 | RdRp / ORF1ab Ct Value |  | A | 1
SARS-COV-2 | N Gene Ct Value |  | A | 1
 | Interpretation |  | T
# SMA Carrier Testing | Serum / plasma
MOLECULAR | SMN1 Exon 7 Copy Number | copies | A | 0
MOLECULAR | SMN2 Copy Number | copies | A | 0
 | Interpretation |  | T
= Stool Multiplex GI Pathogen PCR Panel |  | T |  | Stool
# Y Chromosome Microdeletion (AZF) | Blood (EDTA)
MOLECULAR | AZFa |  | T
MOLECULAR | AZFb |  | T
MOLECULAR | AZFc |  | T
 | Interpretation |  | T

@ Pregnancy / Screening | Serum / plasma | ^pregnancy
# Double Marker Screen (First Trimester) | Maternal serum
MATERNAL SERUM | Gestational Age | weeks | N | 1
MATERNAL SERUM | Free Beta-hCG | ng/mL | N | 2
MATERNAL SERUM | Free Beta-hCG (MoM) | MoM | N | 2
MATERNAL SERUM | PAPP-A | mIU/L | N | 2
MATERNAL SERUM | PAPP-A (MoM) | MoM | N | 2
RISK ASSESSMENT | Risk for Down Syndrome (Trisomy 21) |  | T
RISK ASSESSMENT | Risk for Edwards Syndrome (Trisomy 18) |  | T
# First-trimester Combined Screening (serum markers)
ULTRASOUND | Gestational Age | weeks | N | 1
ULTRASOUND | Crown-Rump Length (CRL) | mm | N | 1
ULTRASOUND | Nuchal Translucency (NT) | mm | N | 1
MATERNAL SERUM | Free Beta-hCG | ng/mL | N | 2
MATERNAL SERUM | Free Beta-hCG (MoM) | MoM | N | 2
MATERNAL SERUM | PAPP-A | mIU/L | N | 2
MATERNAL SERUM | PAPP-A (MoM) | MoM | N | 2
RISK ASSESSMENT | Combined Risk for Trisomy 21 |  | T
RISK ASSESSMENT | Combined Risk for Trisomy 18 |  | T
RISK ASSESSMENT | Combined Risk for Trisomy 13 |  | T
# Indirect Coombs / Antibody Screen in Pregnancy
ANTIBODY SCREEN | Indirect Coombs / Antibody Screen |  | T
ANTIBODY SCREEN | Antibody Titre | titre | T
# Maternal Serum AFP
MATERNAL SERUM | AFP | ng/mL | N | 2
MATERNAL SERUM | AFP (MoM) | MoM | N | 2
 | Interpretation |  | T
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
RISK ASSESSMENT | Risk for Down Syndrome (Trisomy 21) |  | T
RISK ASSESSMENT | Risk for Edwards Syndrome (Trisomy 18) |  | T
RISK ASSESSMENT | Risk for Neural Tube Defect |  | T
# sFlt-1 / PlGF Ratio (Pre-eclampsia) | Serum
PRE-ECLAMPSIA | sFlt-1 | pg/mL | N | 0
PRE-ECLAMPSIA | PlGF | pg/mL | N | 0
PRE-ECLAMPSIA | sFlt-1 / PlGF Ratio |  | N | 1
 | Interpretation |  | T
# Triple Marker Screen (maternal serum)
MATERNAL SERUM | Gestational Age | weeks | N | 1
MATERNAL SERUM | AFP | IU/mL | N | 2
MATERNAL SERUM | AFP (MoM) | MoM | N | 2
MATERNAL SERUM | Free Beta-hCG | mIU/mL | N | 2
MATERNAL SERUM | Free Beta-hCG (MoM) | MoM | N | 2
MATERNAL SERUM | Unconjugated Estriol (uE3) | ng/mL | N | 2
MATERNAL SERUM | uE3 (MoM) | MoM | N | 2
RISK ASSESSMENT | Risk for Down Syndrome (Trisomy 21) |  | T
RISK ASSESSMENT | Risk for Edwards Syndrome (Trisomy 18) |  | T
RISK ASSESSMENT | Risk for Neural Tube Defect |  | T

@ Profiles / Panels | Serum / plasma | ^profile
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
# Anemia Profile
< CBC (Complete Blood Count)
< Reticulocyte Count |  | RETICULOCYTES
< Iron Studies |  | IRON STUDIES
< Vitamin B12 |  | VITAMINS
VITAMINS | Folate | ng/mL | A
# Antenatal / Pregnancy Profile
< CBC (Complete Blood Count)
< Blood Group (ABO & Rh) |  | BLOOD GROUP
< Blood Sugar Fasting (FBS) |  | GLUCOSE
< Thyroid Profile (T3, T4, TSH) | TSH | THYROID
< HBsAg (Hepatitis B) |  | INFECTIOUS SCREEN
< HIV I & II |  | INFECTIOUS SCREEN
< VDRL / RPR (Syphilis) |  | INFECTIOUS SCREEN
# Arthritis / Rheumatology Profile
< CRP (C-Reactive Protein) |  | INFLAMMATION
< KFT / RFT (Kidney Function Test) | Uric Acid | METABOLIC
AUTOIMMUNE | Rheumatoid Factor (RF) | IU/mL | A
AUTOIMMUNE | Anti-CCP | U/mL | A
AUTOIMMUNE | ASO Titre | IU/mL | A
AUTOIMMUNE | Antinuclear Antibody (ANA) |  | T
# Basic Metabolic Panel (BMP)
< Blood Sugar Fasting (FBS) |  | GLUCOSE
< KFT / RFT (Kidney Function Test) | Urea | RENAL
< KFT / RFT (Kidney Function Test) | Creatinine | RENAL
< KFT / RFT (Kidney Function Test) | Sodium (Na) | ELECTROLYTES
< KFT / RFT (Kidney Function Test) | Potassium (K) | ELECTROLYTES
< KFT / RFT (Kidney Function Test) | Chloride (Cl) | ELECTROLYTES
< Serum Calcium |  | CALCIUM
# Bone Profile | Serum
BONE PROFILE | Total Calcium | mg/dL | N | 1
BONE PROFILE | Phosphorus | mg/dL | N | 1
BONE PROFILE | Alkaline Phosphatase (ALP) | U/L | N | 0
BONE PROFILE | Albumin | g/dL | N | 1
BONE PROFILE | Magnesium | mg/dL | N | 2
BONE PROFILE | 25-OH Vitamin D | ng/mL | N | 1
BONE PROFILE | Parathyroid Hormone (PTH) | pg/mL | N | 1
# Cardiac Marker Profile | Serum
CARDIAC MARKERS | Troponin I | ng/mL | N | 3
CARDIAC MARKERS | CK-MB | ng/mL | N | 2
CARDIAC MARKERS | CPK (Total) | U/L | N | 0
CARDIAC MARKERS | Myoglobin | ng/mL | N | 1
CARDIAC MARKERS | LDH | U/L | N | 0
# Cardiac Risk Profile
< Lipid Profile
< CRP (C-Reactive Protein) |  | INFLAMMATION
# Complete Hemogram Profile | EDTA whole blood
< CBC (Complete Blood Count)
< ESR (Erythrocyte Sedimentation Rate) |  | ESR
# Comprehensive Metabolic Panel (CMP)
< Blood Sugar Fasting (FBS) |  | GLUCOSE
< KFT / RFT (Kidney Function Test) | Urea | RENAL
< KFT / RFT (Kidney Function Test) | Creatinine | RENAL
< KFT / RFT (Kidney Function Test) | Sodium (Na) | ELECTROLYTES
< KFT / RFT (Kidney Function Test) | Potassium (K) | ELECTROLYTES
< KFT / RFT (Kidney Function Test) | Chloride (Cl) | ELECTROLYTES
< Serum Calcium |  | CALCIUM
< LFT (Liver Function Test) | Total Bilirubin | LIVER
< LFT (Liver Function Test) | SGPT (ALT) | LIVER
< LFT (Liver Function Test) | SGOT (AST) | LIVER
< LFT (Liver Function Test) | Alkaline Phosphatase (ALP) | LIVER
< LFT (Liver Function Test) | Total Protein | PROTEINS
< LFT (Liver Function Test) | Albumin | PROTEINS
# Dengue Profile | Serum + whole blood (EDTA)
DENGUE | Dengue NS1 Antigen |  | T
DENGUE | Dengue IgM |  | T
DENGUE | Dengue IgG |  | T
BLOOD COUNT | Haemoglobin | g/dL | N | 1
BLOOD COUNT | PCV / Haematocrit | % | N | 1
BLOOD COUNT | Total WBC Count | /cumm | N | 0
BLOOD COUNT | Platelet Count | /cumm | N | 0
# Diabetes Profile
< Blood Sugar Fasting (FBS) |  | GLUCOSE
< Blood Sugar Post Prandial (PPBS) |  | GLUCOSE
< HbA1c (Glycosylated Haemoglobin) |  | HBA1C
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
# Electrolyte Profile
< KFT / RFT (Kidney Function Test) | Sodium (Na) | ELECTROLYTES
< KFT / RFT (Kidney Function Test) | Potassium (K) | ELECTROLYTES
< KFT / RFT (Kidney Function Test) | Chloride (Cl) | ELECTROLYTES
# Female Infertility Profile | Serum
HORMONES | FSH | mIU/mL | N | 2
HORMONES | LH | mIU/mL | N | 2
HORMONES | Estradiol (E2) | pg/mL | N | 1
HORMONES | Progesterone | ng/mL | N | 2
HORMONES | Prolactin | ng/mL | N | 1
HORMONES | TSH | µIU/mL | N | 2
HORMONES | Anti-Müllerian Hormone (AMH) | ng/mL | N | 2
HORMONES | Total Testosterone | ng/dL | N | 1
# Fertility Hormone Profile
< FSH |  | HORMONES
< LH (Luteinizing Hormone) |  | HORMONES
< Prolactin |  | HORMONES
< Estradiol (E2) |  | HORMONES
HORMONES | Anti-Mullerian Hormone (AMH) | ng/mL | A
# Fever Profile
< CBC (Complete Blood Count)
< Malaria Parasite (MP) |  | MALARIA
< Widal Test |  | WIDAL
< Dengue (NS1 / IgG / IgM) |  | DENGUE
< CRP (C-Reactive Protein) |  | INFLAMMATION
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
# Full Body Health Checkup | Blood + urine
HAEMATOLOGY | Haemoglobin | g/dL | N | 1
HAEMATOLOGY | Total WBC Count | /cumm | N | 0
HAEMATOLOGY | Platelet Count | /cumm | N | 0
HAEMATOLOGY | ESR | mm/hr | N | 0
DIABETES | Fasting Blood Sugar | mg/dL | N | 0
DIABETES | HbA1c | % | N | 1
LIPID PROFILE | Total Cholesterol | mg/dL | N | 0
LIPID PROFILE | HDL Cholesterol | mg/dL | N | 0
LIPID PROFILE | LDL Cholesterol | mg/dL | N | 0
LIPID PROFILE | Triglycerides | mg/dL | N | 0
LIVER FUNCTION | Total Bilirubin | mg/dL | N | 2
LIVER FUNCTION | SGOT (AST) | U/L | N | 0
LIVER FUNCTION | SGPT (ALT) | U/L | N | 0
LIVER FUNCTION | Alkaline Phosphatase (ALP) | U/L | N | 0
LIVER FUNCTION | Total Protein | g/dL | N | 1
LIVER FUNCTION | Albumin | g/dL | N | 1
KIDNEY FUNCTION | Urea | mg/dL | N | 0
KIDNEY FUNCTION | Creatinine | mg/dL | N | 2
KIDNEY FUNCTION | Uric Acid | mg/dL | N | 1
ELECTROLYTES | Sodium (Na) | mEq/L | N | 0
ELECTROLYTES | Potassium (K) | mEq/L | N | 1
ELECTROLYTES | Calcium | mg/dL | N | 1
THYROID | TSH | µIU/mL | N | 2
VITAMINS | 25-OH Vitamin D | ng/mL | N | 1
VITAMINS | Vitamin B12 | pg/mL | N | 0
URINE | Urine Protein |  | T
URINE | Urine Sugar |  | T
URINE | Urine Pus Cells | /HPF | T
# Hepatitis Profile (A, B, C, E) | Serum
HEPATITIS | Hepatitis A IgM |  | T
HEPATITIS | HBsAg |  | T
HEPATITIS | Anti-HBs | mIU/mL | A | 1
HEPATITIS | HBeAg |  | T
HEPATITIS | Anti-HBe |  | T
HEPATITIS | Total Anti-HBc |  | T
HEPATITIS | Anti-HCV |  | T
HEPATITIS | Hepatitis E IgM |  | T
# Male Infertility Profile | Serum
HORMONES | FSH | mIU/mL | N | 2
HORMONES | LH | mIU/mL | N | 2
HORMONES | Total Testosterone | ng/dL | N | 1
HORMONES | Prolactin | ng/mL | N | 1
HORMONES | TSH | µIU/mL | N | 2
# Pancreatic Profile | Serum
PANCREATIC | Serum Amylase | U/L | N | 0
PANCREATIC | Serum Lipase | U/L | N | 0
PANCREATIC | Fasting Glucose | mg/dL | N | 0
PANCREATIC | Calcium | mg/dL | N | 1
PANCREATIC | Triglycerides | mg/dL | N | 0
# PCOS / PCOD Profile | Serum + plasma (fluoride)
HORMONES | FSH | mIU/mL | N | 2
HORMONES | LH | mIU/mL | N | 2
HORMONES | LH / FSH Ratio |  | N | 2
HORMONES | Prolactin | ng/mL | N | 1
HORMONES | TSH | µIU/mL | N | 2
HORMONES | Total Testosterone | ng/dL | N | 1
HORMONES | DHEA-S | µg/dL | N | 1
HORMONES | 17-OH Progesterone | ng/mL | N | 2
HORMONES | Anti-Müllerian Hormone (AMH) | ng/mL | N | 2
METABOLIC | Fasting Glucose | mg/dL | N | 0
METABOLIC | Fasting Insulin | µIU/mL | N | 2
METABOLIC | HOMA-IR |  | N | 2
# Pre-marital Profile | Blood / serum
PRE-MARITAL | Blood Group (ABO) |  | T
PRE-MARITAL | Rh (D) Type |  | T
PRE-MARITAL | Haemoglobin | g/dL | N | 1
PRE-MARITAL | Thalassaemia Carrier Screen (HbA2 / HPLC) |  | T
PRE-MARITAL | HBsAg |  | T
PRE-MARITAL | Anti-HCV |  | T
PRE-MARITAL | HIV 1 & 2 |  | T
PRE-MARITAL | VDRL / RPR |  | T
PRE-MARITAL | Rubella IgG (female) | IU/mL | A | 1
# Pre-operative Profile
< CBC (Complete Blood Count)
< Blood Sugar Fasting (FBS) |  | GLUCOSE
< KFT / RFT (Kidney Function Test) | Urea | RENAL
< KFT / RFT (Kidney Function Test) | Creatinine | RENAL
< Coagulation Profile (PT/INR, APTT) |  | COAGULATION
< HBsAg (Hepatitis B) |  | VIRAL MARKERS
< HIV I & II |  | VIRAL MARKERS
< Anti-HCV (Hepatitis C) |  | VIRAL MARKERS
< Blood Group (ABO & Rh) |  | BLOOD GROUP
# Sepsis Profile
< CBC (Complete Blood Count)
< CRP (C-Reactive Protein) |  | INFLAMMATION
SEPSIS MARKERS | Procalcitonin (PCT) | ng/mL | A
SEPSIS MARKERS | Lactate | mmol/L | A
# STI / Sexual Health Profile | Serum + swab
STI SCREEN | HIV 1 & 2 |  | T
STI SCREEN | HBsAg |  | T
STI SCREEN | Anti-HCV |  | T
STI SCREEN | VDRL / RPR |  | T
STI SCREEN | TPHA |  | T
STI SCREEN | Chlamydia trachomatis |  | T
STI SCREEN | Neisseria gonorrhoeae |  | T
STI SCREEN | HSV 2 IgG |  | T
# Thrombophilia Screening Profile | Citrated plasma + serum
THROMBOPHILIA | Protein C Activity | % | N | 0
THROMBOPHILIA | Protein S Activity | % | N | 0
THROMBOPHILIA | Antithrombin III | % | N | 0
THROMBOPHILIA | Activated Protein C Resistance (APCR) |  | T
THROMBOPHILIA | Lupus Anticoagulant |  | T
THROMBOPHILIA | Anti-cardiolipin IgG | GPL U/mL | A | 1
THROMBOPHILIA | Anti-cardiolipin IgM | MPL U/mL | A | 1
THROMBOPHILIA | Homocysteine | µmol/L | N | 1
# TORCH Profile
TORCH | Toxoplasma IgG |  | A
TORCH | Toxoplasma IgM |  | A
TORCH | Rubella IgG |  | A
TORCH | Rubella IgM |  | A
TORCH | Cytomegalovirus (CMV) IgG |  | A
TORCH | Cytomegalovirus (CMV) IgM |  | A
TORCH | Herpes Simplex Virus (HSV) IgM |  | A
# Tumor Marker Profile
TUMOR MARKERS | CEA | ng/mL | A
TUMOR MARKERS | AFP | ng/mL | A
TUMOR MARKERS | CA-125 | U/mL | A
TUMOR MARKERS | CA 19-9 | U/mL | A
TUMOR MARKERS | CA 15-3 | U/mL | A
TUMOR MARKERS | PSA (Total) | ng/mL | A
# Viral Marker Profile
< HBsAg (Hepatitis B) |  | VIRAL MARKERS
< Anti-HCV (Hepatitis C) |  | VIRAL MARKERS
< HIV I & II |  | VIRAL MARKERS
# Vitamin Profile | Serum
VITAMINS | 25-OH Vitamin D | ng/mL | N | 1
VITAMINS | Vitamin B12 | pg/mL | N | 0
VITAMINS | Folate | ng/mL | N | 1

@ Serology | Serum | ^serolog
= Anti-DNase B (ADB) | U/mL | A | 0
= Anti-HBe ;; Chikungunya IgM ;; Chikungunya PCR ;; HBeAg ;; Hepatitis A IgM |  | T |  | Serum / plasma
= Hepatitis E IgM ;; IgM Anti-HBc ;; Leptospira IgM ;; Leptospira PCR ;; SARS-CoV-2 Antibody |  | T |  | Serum / plasma
= Total Anti-HBc |  | T |  | Serum / plasma
= Anti-HBs | mIU/mL | A | 1 | Serum / plasma
= ASO Titre ;; Rheumatoid Factor (RF) | IU/mL | A | 0 | Serum / plasma
= Aspergillus Galactomannan Antigen | Index | A | 2 | Serum / BAL
= Beta-D-Glucan | pg/mL | A | 0
# Brucella Serology | Serum / plasma
BRUCELLA | Brucella IgM |  | T
BRUCELLA | Brucella IgG |  | T
BRUCELLA | Agglutination (STA) Titre | titre | T
= C-reactive Protein (Qualitative / Latex) ;; Chlamydia pneumoniae IgG ;; Chlamydia trachomatis IgG ;; Chlamydia trachomatis IgM ;; Cysticercosis IgG |  | T
= Entamoeba histolytica IgG (Amoebic Serology) ;; Filaria Antigen (ICT) ;; Filaria IgG4 ;; Hepatitis A (HAV) IgG / Total Antibody ;; Hepatitis D (HDV) Antibody, Total |  | T
= Hepatitis D (HDV) IgM ;; Hepatitis E (HEV) IgG ;; HIV Confirmatory Test (Western Blot / Line Immunoassay) ;; HIV p24 Antigen ;; HIV Rapid Card Test |  | T
= HTLV-I / II Antibody ;; Hydatid (Echinococcus) IgG ;; Japanese Encephalitis IgM ;; Kala-azar rK39 Rapid Test ;; Rheumatoid Factor (Qualitative / Latex) |  | T
= Strongyloides IgG ;; Syphilis FTA-ABS IgG ;; Syphilis FTA-ABS IgM ;; Syphilis Total Antibody (Treponemal EIA) ;; Toxocara IgG |  | T
= Tubex TF Typhoid Test ;; West Nile Virus IgM ;; Zika Virus IgM |  | T
= CMV IgG | AU/mL | A | 1 | Serum / plasma
= CMV IgG Avidity ;; Rubella IgG Avidity ;; Toxoplasma IgG Avidity | % | A | 0
= CMV IgM ;; HSV 1 IgG ;; HSV 2 IgG ;; Parvovirus B19 IgG ;; Parvovirus B19 IgM | Index | A | 2 | Serum / plasma
= Rubella IgM ;; Scrub Typhus IgM ;; Toxoplasma IgM | Index | A | 2 | Serum / plasma
# Cryptococcal Antigen (CrAg) | Serum / CSF
CRYPTOCOCCAL ANTIGEN | Cryptococcal Antigen |  | T
CRYPTOCOCCAL ANTIGEN | Titre | titre | T
# Dengue IgG | Serum / plasma
 | Dengue IgG |  | T |  | b
>  |  |  |  |  | Non-Reactive | Non-Reactive
# Dengue IgM | Serum / plasma
 | Dengue IgM |  | T |  | b
>  |  |  |  |  | Non-Reactive | Non-Reactive
# Dengue NS1 Antigen | Serum / plasma
 | Dengue NS1 Antigen |  | T |  | b
>  |  |  |  |  | Non-Reactive | Non-Reactive
= Diphtheria Antibody (IgG) ;; HBsAg Quantitative ;; Rabies Neutralizing Antibody Titre ;; Tetanus Antibody (IgG) | IU/mL | A | 2
= EBV Early Antigen (EA) IgG ;; EBV EBNA IgG ;; Mycoplasma pneumoniae IgG ;; Mycoplasma pneumoniae IgM | U/mL | A | 1
= EBV VCA IgG ;; EBV VCA IgM | U/mL | A | 1 | Serum / plasma
# HBV DNA PCR / Viral Load | Serum / plasma
VIRAL LOAD | HBV DNA Viral Load | IU/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 IU/mL | A | 2
# HCV RNA PCR / Viral Load | Serum / plasma
VIRAL LOAD | HCV RNA Viral Load | IU/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 IU/mL | A | 2
# Helicobacter pylori Antibody (IgG / IgM)
H. PYLORI | H. pylori IgG |  | T
H. PYLORI | H. pylori IgM |  | T
# HIV Viral Load (RNA PCR) | Serum / plasma
VIRAL LOAD | HIV-1 RNA Viral Load | copies/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 copies/mL | A | 2
= Influenza A / B Rapid Antigen Test ;; SARS-CoV-2 Rapid Antigen Test |  | T |  | Nasopharyngeal swab
= Legionella Antigen (Urine) ;; Streptococcus pneumoniae Antigen (Urine) |  | T |  | Urine
# Malarial Antigen Test | Serum / plasma
MALARIA ANTIGEN | P. falciparum (HRP-2) |  | T
MALARIA ANTIGEN | P. vivax (pLDH) |  | T
# Mantoux Test (Tuberculin Skin Test) | Intradermal (read at 48-72 hr)
MANTOUX | Induration Size | mm | N | 0
 | Interpretation |  | T
= Measles IgG ;; Mumps IgG ;; Varicella Zoster (VZV) IgG | IU/mL | A | 1
= Measles IgM ;; Mumps IgM ;; Varicella Zoster (VZV) IgM | Index | A | 2
# Quantiferon-TB Gold (IGRA) | Serum / plasma
QUANTIFERON | Nil (Negative Control) | IU/mL | N | 2
QUANTIFERON | TB1 Antigen minus Nil | IU/mL | N | 2
QUANTIFERON | TB2 Antigen minus Nil | IU/mL | N | 2
QUANTIFERON | Mitogen minus Nil | IU/mL | N | 2
 | Interpretation |  | T
# Rickettsial Serology | Serum / plasma
WEIL-FELIX | OX-19 | titre | T
WEIL-FELIX | OX-2 | titre | T
WEIL-FELIX | OX-K | titre | T
= Rubella IgG ;; Toxoplasma IgG | IU/mL | A | 1 | Serum / plasma
# Syphilis RPR | Serum / plasma
 | Syphilis RPR |  | T |  | b
>  |  |  |  |  | Non-Reactive | Non-Reactive
# TPHA / TPPA | Serum / plasma
SYPHILIS | TPHA / TPPA |  | T
SYPHILIS | Titre | titre | T
# Typhoid IgM / IgG (Typhidot)
TYPHIDOT | Typhoid IgM |  | T
TYPHIDOT | Typhoid IgG |  | T

@ Specialized | Serum / plasma
= Beta-2 Microglobulin ;; Soluble Transferrin Receptor | mg/L | N | 2
# Catecholamines (plasma)
CATECHOLAMINES | Epinephrine | pg/mL | N | 1
CATECHOLAMINES | Norepinephrine | pg/mL | N | 1
CATECHOLAMINES | Dopamine | pg/mL | N | 1
# Chromosomal Karyotype (blood)
KARYOTYPE | Cells Counted | cells | N | 0
KARYOTYPE | Banding Resolution |  | T
KARYOTYPE | Karyotype |  | T
 | Interpretation |  | T
= Erythropoietin Level | mIU/mL | N | 1
# Fragile X Testing (blood-based sample)
FRAGILE X | FMR1 CGG Repeats | repeats | A | 0
FRAGILE X | Methylation Status |  | T
 | Interpretation |  | T
= Normetanephrine | pg/mL | N | 1
# Plasma Metanephrines
PLASMA METANEPHRINES | Metanephrine | pg/mL | N | 1
PLASMA METANEPHRINES | Normetanephrine | pg/mL | N | 1
= Porphyrins (blood) | µg/dL | N | 1
= Quantitative G6PD Activity | U/g Hb | N | 1 | EDTA whole blood
= Reticulocyte Hemoglobin Content | pg | N | 1 | EDTA whole blood
# Serum Free Light Chain Ratio
LIGHT CHAINS | Free Kappa Light Chains | mg/L | N | 2
LIGHT CHAINS | Free Lambda Light Chains | mg/L | N | 2
LIGHT CHAINS | Kappa / Lambda Ratio |  | N | 2
= Serum Viscosity | cP | N | 2

@ Toxicology / Drug Monitoring | Serum / plasma | ^toxicolog
= Aluminium (blood) ;; Cadmium (blood) | µg/L | N | 1 | Whole blood (trace-element tube)
= Amikacin Level ;; Carbamazepine Level ;; Gentamicin Level ;; Lamotrigine Level ;; Levetiracetam Level | µg/mL | N | 1
= Mycophenolic Acid Level ;; Paracetamol / Acetaminophen Level ;; Phenobarbital Level ;; Phenytoin Level ;; Theophylline Level | µg/mL | N | 1
= Tobramycin Level ;; Topiramate Level ;; Valproic Acid Level ;; Vancomycin Level ;; Voriconazole Level | µg/mL | N | 1
= Blood Alcohol (Ethanol) | mg/dL | N | 0
= Carboxyhemoglobin ;; Methemoglobin | % | N | 1 | EDTA whole blood
= Cyclosporine Level | ng/mL | N | 0
= Digoxin Level ;; Methotrexate Level | ng/mL | N | 2
= Ethylene Glycol Level ;; Methanol Level ;; Salicylate Level | mg/dL | N | 1
= Everolimus Level ;; Sirolimus Level | ng/mL | N | 1 | Whole blood (EDTA)
= Lithium Level | mmol/L | N | 2
= Tacrolimus Level | ng/mL | N | 1

@ Body Fluids | Body fluid (sterile container) | body fluid
# Amniotic Fluid Analysis | Amniotic fluid
AMNIOTIC FLUID | Colour |  | T
AMNIOTIC FLUID | Appearance |  | T
AMNIOTIC FLUID | Bilirubin (Delta OD 450) |  | N | 3
AMNIOTIC FLUID | Lecithin / Sphingomyelin (L/S) Ratio |  | N | 1
 | Interpretation |  | T
# Ascitic Fluid Analysis ;; Pericardial Fluid Analysis ;; Pleural Fluid Analysis
PHYSICAL EXAMINATION | Colour |  | T
PHYSICAL EXAMINATION | Appearance |  | T
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
CELL COUNT | Red Blood Cells (RBC) | /cumm | A | 0
BIOCHEMISTRY | Protein | g/dL | N | 1
BIOCHEMISTRY | Albumin | g/dL | N | 1
BIOCHEMISTRY | Glucose | mg/dL | N | 0
BIOCHEMISTRY | LDH | U/L | N | 0
BIOCHEMISTRY | ADA (Adenosine Deaminase) | U/L | N | 1
# Bronchoalveolar Lavage (BAL) Fluid Analysis | BAL fluid
BAL FLUID | Volume Instilled | mL | N | 0
BAL FLUID | Volume Recovered | mL | N | 0
BAL FLUID | Total Cell Count | /cumm | N | 0
BAL FLUID | Macrophages | % | N | 0
BAL FLUID | Lymphocytes | % | N | 0
BAL FLUID | Neutrophils | % | N | 0
BAL FLUID | Eosinophils | % | N | 0
 | Impression |  | T
# CSF Analysis (Routine & Biochemistry) | Cerebrospinal fluid (CSF)
PHYSICAL EXAMINATION | Colour |  | T
PHYSICAL EXAMINATION | Appearance |  | T
PHYSICAL EXAMINATION | Clot / Coagulum |  | T
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
CELL COUNT | Red Blood Cells (RBC) | /cumm | A | 0
BIOCHEMISTRY | Protein | mg/dL | N | 0
BIOCHEMISTRY | Glucose | mg/dL | N | 0
BIOCHEMISTRY | Chloride | mmol/L | N | 0
BIOCHEMISTRY | ADA (Adenosine Deaminase) | U/L | N | 1
= CSF IgG Index |  | N | 2 | CSF + serum
= CSF Lactate | mmol/L | N | 1 | CSF
= CSF Oligoclonal Bands |  | T |  | CSF + serum
= Fluid Amylase | U/L | N | 0 | Body fluid
= Fluid Creatinine | mg/dL | N | 2 | Body fluid
# Peritoneal Dialysis Fluid Analysis | Peritoneal dialysis effluent
PHYSICAL EXAMINATION | Colour |  | T
PHYSICAL EXAMINATION | Appearance |  | T
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
= Pleural Fluid Cholesterol ;; Pleural Fluid Triglycerides | mg/dL | N | 0 | Pleural fluid
# Pleural Fluid Light’s Criteria | Pleural fluid + serum
LIGHT’S CRITERIA | Pleural Fluid Protein | g/dL | N | 1
LIGHT’S CRITERIA | Serum Protein | g/dL | N | 1
LIGHT’S CRITERIA | Pleural / Serum Protein Ratio |  | N | 2
LIGHT’S CRITERIA | Pleural Fluid LDH | U/L | N | 0
LIGHT’S CRITERIA | Serum LDH | U/L | N | 0
LIGHT’S CRITERIA | Pleural / Serum LDH Ratio |  | N | 2
 | Interpretation |  | T
= Pleural Fluid pH |  | N | 2 | Pleural fluid (heparinised syringe)
# Serum-Ascites Albumin Gradient (SAAG) | Ascitic fluid + serum
SAAG | Serum Albumin | g/dL | N | 1
SAAG | Ascitic Fluid Albumin | g/dL | N | 1
SAAG | SAAG (calculated) | g/dL | N | 1 | b
 | Interpretation |  | T
# Synovial Fluid Analysis | Synovial fluid
PHYSICAL EXAMINATION | Colour |  | T
PHYSICAL EXAMINATION | Appearance |  | T
PHYSICAL EXAMINATION | Viscosity |  | T
PHYSICAL EXAMINATION | Mucin Clot |  | T
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
MICROSCOPY | Crystals |  | T
BIOCHEMISTRY | Protein | g/dL | N | 1
BIOCHEMISTRY | Glucose | mg/dL | N | 0

@ Cytology | Fine needle aspirate | ^cytolog
# BAL Cytology ;; Bronchial Wash Cytology ;; Brush Cytology ;; CSF Cytology ;; Imprint / Impression Smear Cytology ;; Nipple Discharge Cytology ;; Tzanck Smear | Fluid / smear
CYTOLOGY | Cellularity |  | T
CYTOLOGY | Microscopic Findings |  | T
 | Impression |  | T
# Breast FNAC ;; CT-guided FNAC ;; FNAC (Fine Needle Aspiration Cytology) ;; Lymph Node FNAC ;; Salivary Gland FNAC ;; Soft Tissue / Skin Swelling FNAC ;; Ultrasound-guided FNAC
FNAC | Site |  | T
FNAC | Nature of Aspirate |  | T
FNAC | Microscopic Findings |  | T
 | Cytological Diagnosis |  | T
= Buccal Smear for Barr Body (Sex Chromatin) | % | N | 0 | Buccal smear
# Fluid Cytology ;; Sputum Cytology ;; Urine Cytology | Fluid / urine / sputum
CYTOLOGY | Cellularity |  | T
CYTOLOGY | Microscopic Findings |  | T
 | Impression |  | T
# Liquid Based Cytology (LBC) - Cervical | Cervical sample (LBC vial)
LBC | Specimen Adequacy |  | T
LBC | General Categorisation |  | T
LBC | Microscopic Findings |  | T
LBC | Interpretation (Bethesda) |  | T
 | Recommendation |  | T
# Pap Smear (Cervical Cytology) | Cervical smear
PAP SMEAR | Specimen Adequacy |  | T
PAP SMEAR | General Categorisation |  | T
PAP SMEAR | Microscopic Findings |  | T
PAP SMEAR | Interpretation / Result |  | T
 | Recommendation |  | T
# Thyroid FNAC (Bethesda System)
FNAC | Site |  | T
FNAC | Nature of Aspirate |  | T
FNAC | Microscopic Findings |  | T
FNAC | Bethesda Category |  | T
 | Cytological Diagnosis |  | T

@ Histopathology | Tissue in 10% formalin | ^histopath
# Appendicectomy Specimen ;; Bone Biopsy ;; Breast Core Biopsy ;; Cervical Biopsy / Cone Biopsy ;; Cholecystectomy Specimen ;; Circumcision (Foreskin) Specimen ;; Duodenal Biopsy (Coeliac) ;; Endometrial Biopsy ;; Endoscopic Biopsy - Colon / Rectum ;; Endoscopic Biopsy - Oesophagus ;; Endoscopic Biopsy - Stomach ;; Fibroid Uterus Specimen ;; Haemorrhoid / Fistula Specimen ;; Hernial Sac Specimen ;; Histopathology - Large Specimen ;; Histopathology - Medium Specimen ;; Histopathology - Small Biopsy ;; Liver Biopsy ;; Lymph Node Biopsy ;; Muscle Biopsy ;; Nasal Polyp Specimen ;; Nerve Biopsy ;; Ovarian Cyst Specimen ;; Placenta Histopathology ;; Products of Conception (POC) ;; Skin Biopsy ;; Thyroid Biopsy ;; Tonsil / Adenoid Specimen
HISTOPATHOLOGY | Clinical History |  | T
HISTOPATHOLOGY | Gross Examination |  | T
HISTOPATHOLOGY | Microscopic Examination |  | T
 | Impression / Diagnosis |  | T
# Colectomy / Colorectal Resection Specimen ;; Gastrectomy Specimen ;; Hysterectomy with Salpingo-oophorectomy Specimen ;; Mastectomy Specimen ;; Nephrectomy Specimen ;; Oral Cancer Resection Specimen ;; Prostatectomy Specimen ;; Thyroidectomy Specimen ;; Wide Local Excision Specimen
HISTOPATHOLOGY | Clinical History |  | T
HISTOPATHOLOGY | Gross Examination |  | T
HISTOPATHOLOGY | Microscopic Examination |  | T
SYNOPTIC REPORT | Tumour Type (Histologic) |  | T
SYNOPTIC REPORT | Histologic Grade |  | T
SYNOPTIC REPORT | Tumour Size | cm | A | 1
SYNOPTIC REPORT | Lymphovascular Invasion |  | T
SYNOPTIC REPORT | Perineural Invasion |  | T
SYNOPTIC REPORT | Surgical Margins |  | T
SYNOPTIC REPORT | Lymph Nodes (Involved / Total) |  | T
SYNOPTIC REPORT | pTNM Stage |  | T
 | Impression / Diagnosis |  | T
# Frozen Section (Intra-operative Consultation) | Fresh tissue
FROZEN SECTION | Specimen / Site |  | T
FROZEN SECTION | Frozen Section Diagnosis |  | T
FROZEN SECTION | Margins |  | T
 | Remarks |  | T
# IHC - Carcinoma Panel ;; IHC - Lymphoma Panel ;; IHC - Prostate Panel ;; IHC - Sarcoma / Soft Tissue Panel ;; IHC - Single Marker | FFPE tissue block
IHC | Markers Tested |  | T
IHC | Positive Markers |  | T
IHC | Negative Markers |  | T
 | Interpretation |  | T
# Immunohistochemistry (IHC) - Breast Panel (ER / PR / HER2 / Ki-67) | FFPE tissue block
IHC BREAST | ER Status |  | T
IHC BREAST | ER Positive Nuclei | % | A | 0
IHC BREAST | PR Status |  | T
IHC BREAST | PR Positive Nuclei | % | A | 0
IHC BREAST | HER2 IHC Score (0 / 1+ / 2+ / 3+) |  | T
IHC BREAST | Ki-67 Proliferation Index | % | A | 0
 | Impression |  | T
# Prostate Needle Biopsy (Gleason Score)
HISTOPATHOLOGY | Clinical History |  | T
HISTOPATHOLOGY | Gross Examination |  | T
HISTOPATHOLOGY | Microscopic Examination |  | T
GLEASON GRADING | Gleason Pattern (Primary + Secondary) |  | T
GLEASON GRADING | Gleason Score |  | T
GLEASON GRADING | Grade Group |  | T
GLEASON GRADING | Cores Involved (Positive / Total) |  | T
GLEASON GRADING | Perineural Invasion |  | T
 | Impression / Diagnosis |  | T
# Renal Biopsy (Light Microscopy and IF) | Renal tissue (formalin + IF medium)
RENAL BIOPSY | Clinical History |  | T
RENAL BIOPSY | Glomeruli (Total / Sclerosed) |  | T
RENAL BIOPSY | Light Microscopy |  | T
RENAL BIOPSY | Immunofluorescence |  | T
 | Impression / Diagnosis |  | T
# Skin Biopsy with Direct Immunofluorescence (DIF) | Skin (formalin + IF medium)
SKIN BIOPSY | Histology |  | T
SKIN BIOPSY | DIF: IgG |  | T
SKIN BIOPSY | DIF: IgA |  | T
SKIN BIOPSY | DIF: IgM |  | T
SKIN BIOPSY | DIF: C3 |  | T
SKIN BIOPSY | DIF: Fibrinogen |  | T
 | Impression / Diagnosis |  | T
# Special Stain Study (PAS / Masson / Reticulin / Congo Red / Perls / GMS) | Tissue section
SPECIAL STAIN | Stain(s) Applied |  | T
SPECIAL STAIN | Result |  | T
 | Interpretation |  | T

@ Semen Analysis | Semen | ^semen
# Anti-Sperm Antibody (MAR Test)
MAR TEST | IgG-coated Motile Sperm | % | N | 0
MAR TEST | IgA-coated Motile Sperm | % | N | 0
 | Impression |  | T
= Hypo-osmotic Swelling (HOS) Test ;; Sperm Morphology (Strict / Kruger) | % | N | 0
# Post Vasectomy Semen Analysis
SEMEN | Sperm Concentration | million/mL | N | 2 | b
SEMEN | Motile Sperm |  | T
 | Impression |  | T
# Post-Ejaculatory Urine for Sperm (Retrograde Ejaculation) | Urine (after ejaculation)
URINE | Sperm in Post-ejaculatory Urine |  | T
URINE | Sperm Count | million/mL | N | 1
# Semen Analysis | Semen (after 2-7 days abstinence)
PHYSICAL EXAMINATION | Abstinence Period | days | N | 0
PHYSICAL EXAMINATION | Method of Collection |  | T
PHYSICAL EXAMINATION | Liquefaction Time | min | N | 0
PHYSICAL EXAMINATION | Volume | mL | N | 1
PHYSICAL EXAMINATION | Colour |  | T
PHYSICAL EXAMINATION | Viscosity |  | T
PHYSICAL EXAMINATION | Reaction (pH) |  | N | 1
SPERM COUNT | Sperm Concentration | million/mL | N | 1 | b
SPERM COUNT | Total Sperm Count | million/ejaculate | N | 1
MOTILITY | Progressive Motility (PR) | % | N | 0
MOTILITY | Non-Progressive Motility (NP) | % | N | 0
MOTILITY | Immotile (IM) | % | N | 0
MOTILITY | Total Motility (PR + NP) | % | N | 0 | b
MORPHOLOGY & VITALITY | Normal Morphology | % | N | 0
MORPHOLOGY & VITALITY | Vitality (Live Sperm) | % | N | 0
OTHER FINDINGS | Pus Cells | /HPF | T
OTHER FINDINGS | Red Blood Cells (RBC) | /HPF | T
OTHER FINDINGS | Round Cells | /HPF | T
OTHER FINDINGS | Agglutination |  | T
 | Impression |  | T
= Semen Fructose Test |  | T
= Semen Peroxidase (Endtz) Test | million/mL | N | 2
= Sperm Count (Concentration Only) | million/mL | N | 1
= Sperm DNA Fragmentation Index (DFI) | % | N | 1

@ Stool Examination | Stool (fresh) | ^stool
= Faecal Calprotectin ;; Faecal Elastase-1 | µg/g | N | 0 | Stool (spot)
= Stool Adenovirus Antigen ;; Stool Cryptosporidium / Cyclospora (Modified ZN Stain) ;; Stool Entamoeba histolytica Antigen ;; Stool Fat (Sudan III Stain) ;; Stool for Leucocytes |  | T
= Stool Giardia Antigen ;; Stool H. pylori Antigen ;; Stool Hanging Drop (Vibrio cholerae) ;; Stool Immunochemical Test (FIT) ;; Stool Norovirus Antigen |  | T
= Stool Occult Blood (FOBT) ;; Stool Reducing Substances ;; Stool Rotavirus Antigen ;; Stool Strongyloides (Agar Plate Culture) |  | T
# Stool Clostridium difficile Toxin | Stool (liquid, fresh)
C. DIFFICILE | GDH Antigen |  | T
C. DIFFICILE | Toxin A/B |  | T
= Stool Fat (72 hr Quantitative) | g/24 hr | N | 1 | Stool (72-hour collection)
# Stool Ova & Cyst (O&C)
OVA & CYST | Ova |  | T
OVA & CYST | Cysts |  | T
OVA & CYST | Trophozoites |  | T
OVA & CYST | Larvae |  | T
# Stool Routine & Microscopic Examination
PHYSICAL EXAMINATION | Colour |  | T
PHYSICAL EXAMINATION | Consistency |  | T
PHYSICAL EXAMINATION | Mucus |  | T
PHYSICAL EXAMINATION | Blood (Naked Eye) |  | T
PHYSICAL EXAMINATION | Reaction (pH) |  | A | 1
CHEMICAL EXAMINATION | Occult Blood |  | T
CHEMICAL EXAMINATION | Reducing Substances |  | T
MICROSCOPIC EXAMINATION | Pus Cells | /HPF | T
MICROSCOPIC EXAMINATION | Red Blood Cells (RBC) | /HPF | T
MICROSCOPIC EXAMINATION | Epithelial Cells | /HPF | T
MICROSCOPIC EXAMINATION | Ova |  | T
MICROSCOPIC EXAMINATION | Cysts |  | T
MICROSCOPIC EXAMINATION | Trophozoites |  | T
MICROSCOPIC EXAMINATION | Larvae |  | T
MICROSCOPIC EXAMINATION | Fat Globules |  | T
MICROSCOPIC EXAMINATION | Undigested Food Particles |  | T
MICROSCOPIC EXAMINATION | Yeast Cells |  | T
MICROSCOPIC EXAMINATION | Others |  | T

@ Urine Analysis | Urine (fresh) | ^urine
= 24 Hour Urine 17-Ketosteroids ;; 24 Hour Urine 5-HIAA ;; 24 Hour Urine Citrate ;; 24 Hour Urine Cystine ;; 24 Hour Urine Magnesium | mg/24 hr | N | 1 | Urine (24-hour collection)
= 24 Hour Urine Microalbumin ;; 24 Hour Urine Oxalate ;; 24 Hour Urine Urea ;; 24 Hour Urine VMA | mg/24 hr | N | 1 | Urine (24-hour collection)
# 24 Hour Urine Calcium ;; 24 Hour Urine Phosphorus ;; 24 Hour Urine Uric Acid | Urine (24-hour collection)
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Concentration | mg/dL | N | 1
24 HOUR URINE | Total Excretion (24 hr) | mg/24 hr | N | 1 | b
= 24 Hour Urine Catecholamines ;; 24 Hour Urine Copper ;; 24 Hour Urine Cortisol (Urinary Free Cortisol) ;; 24 Hour Urine Metanephrines | µg/24 hr | N | 1 | Urine (24-hour collection)
# 24 Hour Urine Creatinine Clearance | Urine (24-hour collection) + serum
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Urine Creatinine | mg/dL | N | 2
24 HOUR URINE | Serum Creatinine | mg/dL | N | 2
24 HOUR URINE | Creatinine Clearance | mL/min | N | 1 | b
# 24 Hour Urine Electrolytes (Na, K, Cl) | Urine (24-hour collection)
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Sodium (Na) | mEq/L | N | 0
24 HOUR URINE | Potassium (K) | mEq/L | N | 1
24 HOUR URINE | Chloride (Cl) | mEq/L | N | 0
# 24 Hour Urine Protein | Urine (24-hour collection)
24 HOUR URINE | Urine Volume (24 hr) | mL | N | 0
24 HOUR URINE | Urine Protein | mg/dL | N | 1
24 HOUR URINE | Total Protein (24 hr) | mg/24 hr | N | 0 | b
= Urine Albumin (Qualitative) ;; Urine Bence Jones Protein ;; Urine Chyle (Chyluria) Test ;; Urine Cotinine (Nicotine Screen) ;; Urine Cystine (Cyanide-Nitroprusside) |  | T
= Urine Eosinophils ;; Urine Ferric Chloride Test ;; Urine Hemosiderin ;; Urine Homogentisic Acid ;; Urine Immunofixation Electrophoresis |  | T
= Urine Ketone Bodies ;; Urine Melanin ;; Urine Metabolic Screen (Aminoaciduria) ;; Urine Myoglobin ;; Urine Porphobilinogen (PBG) |  | T
= Urine Pregnancy Test (UPT) ;; Urine Reducing Substances ;; Urine Sugar (Fasting) ;; Urine Sugar (Post Prandial) ;; Urine Urobilinogen |  | T
= Urine Albumin (Quantitative) ;; Urine Calcium (Spot) ;; Urine Creatinine (Spot) ;; Urine Glucose (Quantitative) ;; Urine Magnesium (Spot) | mg/dL | N | 1 | Urine (spot)
= Urine Phosphorus (Spot) ;; Urine Protein (Quantitative, Spot) ;; Urine Urea (Spot) ;; Urine Uric Acid (Spot) | mg/dL | N | 1 | Urine (spot)
= Urine Amylase | U/L | N | 0 | Urine (spot)
= Urine Arsenic ;; Urine Cadmium ;; Urine Lead ;; Urine Mercury | µg/L | N | 1 | Urine (spot / 24-hour, metal-free container)
= Urine Beta-2 Microglobulin | mg/L | N | 2 | Urine (spot)
# Urine Bile Salts & Bile Pigments
BILE TESTS | Bile Salts |  | T
BILE TESTS | Bile Pigments |  | T
= Urine Calcium / Creatinine Ratio | mg/mg | N | 2 | Urine (spot)
# Urine Drug of Abuse Screen (10 Panel)
DRUG SCREEN | Amphetamines |  | T
DRUG SCREEN | Barbiturates |  | T
DRUG SCREEN | Benzodiazepines |  | T
DRUG SCREEN | Cocaine |  | T
DRUG SCREEN | Methamphetamine |  | T
DRUG SCREEN | Methadone |  | T
DRUG SCREEN | Opiates (Morphine) |  | T
DRUG SCREEN | Tricyclic Antidepressants |  | T
DRUG SCREEN | Cannabinoids (THC) |  | T
DRUG SCREEN | Buprenorphine |  | T
# Urine Drug of Abuse Screen (5 Panel)
DRUG SCREEN | Amphetamines |  | T
DRUG SCREEN | Cocaine |  | T
DRUG SCREEN | Opiates (Morphine) |  | T
DRUG SCREEN | Cannabinoids (THC) |  | T
DRUG SCREEN | Benzodiazepines |  | T
= Urine Dysmorphic RBC (Phase Contrast) | % | N | 0 | Urine (fresh, early morning)
# Urine Electrolytes (Spot) | Urine (spot)
URINE ELECTROLYTES | Sodium (Na) | mEq/L | N | 0
URINE ELECTROLYTES | Potassium (K) | mEq/L | N | 1
URINE ELECTROLYTES | Chloride (Cl) | mEq/L | N | 0
= Urine Iodine (Spot) | µg/L | N | 0 | Urine (spot)
# Urine Microalbumin (Spot) with ACR | Urine (spot, early morning)
MICROALBUMIN | Urine Microalbumin | mg/L | N | 1 | b
MICROALBUMIN | Urine Creatinine | mg/dL | N | 1
MICROALBUMIN | Albumin / Creatinine Ratio (ACR) | mg/g | N | 1
= Urine Osmolality | mOsm/kg | N | 0 | Urine (spot)
# Urine Protein / Creatinine Ratio (PCR) | Urine (spot)
PROTEIN / CREATININE | Urine Protein | mg/dL | N | 1
PROTEIN / CREATININE | Urine Creatinine | mg/dL | N | 1
PROTEIN / CREATININE | Protein / Creatinine Ratio (PCR) | mg/mg | N | 2
# Urine Protein Electrophoresis (UPEP) | Urine (24-hour or spot, concentrated)
URINE PROTEIN FRACTIONS | Albumin | % | N | 1
URINE PROTEIN FRACTIONS | Alpha-1 Globulin | % | N | 1
URINE PROTEIN FRACTIONS | Alpha-2 Globulin | % | N | 1
URINE PROTEIN FRACTIONS | Beta Globulin | % | N | 1
URINE PROTEIN FRACTIONS | Gamma Globulin | % | N | 1
URINE PROTEIN FRACTIONS | M-Band (Paraprotein) |  | T
 | Impression |  | T
# Urine Routine & Microscopic Examination | Urine (fresh, mid-stream)
PHYSICAL EXAMINATION | Colour |  | T
PHYSICAL EXAMINATION | Appearance (Transparency) |  | T
PHYSICAL EXAMINATION | Volume | mL | A | 0
PHYSICAL EXAMINATION | Specific Gravity |  | N | 3
PHYSICAL EXAMINATION | Reaction (pH) |  | N | 1
CHEMICAL EXAMINATION | Protein (Albumin) |  | T
CHEMICAL EXAMINATION | Glucose (Sugar) |  | T
CHEMICAL EXAMINATION | Ketone Bodies |  | T
CHEMICAL EXAMINATION | Bilirubin |  | T
CHEMICAL EXAMINATION | Urobilinogen | EU/dL | A | 1
CHEMICAL EXAMINATION | Blood (Occult Blood) |  | T
CHEMICAL EXAMINATION | Nitrite |  | T
CHEMICAL EXAMINATION | Leukocyte Esterase |  | T
MICROSCOPIC EXAMINATION | Pus Cells (WBC) | /HPF | T
MICROSCOPIC EXAMINATION | Red Blood Cells (RBC) | /HPF | T
MICROSCOPIC EXAMINATION | Epithelial Cells | /HPF | T
MICROSCOPIC EXAMINATION | Casts | /LPF | T
MICROSCOPIC EXAMINATION | Crystals |  | T
MICROSCOPIC EXAMINATION | Bacteria |  | T
MICROSCOPIC EXAMINATION | Yeast Cells |  | T
MICROSCOPIC EXAMINATION | Mucus Threads |  | T
MICROSCOPIC EXAMINATION | Others |  | T

@ CT Scan |  | ^ct([ -]?scan)?$|computed tomograph
+ Coronary Calcium Score
+ CT Abdomen & Pelvis Plain & Contrast
+ CT Abdomen Plain & Contrast
+ CT Angiography Brain (Circle of Willis)
+ CT Ankle & Foot
+ CT Aortogram (Thoracic & Abdominal)
+ CT Brain Perfusion
+ CT Brain Plain
+ CT Brain Plain & Contrast
+ CT Cervical Spine
+ CT Chest Plain
+ CT Chest Plain & Contrast
+ CT Colonography (Virtual Colonoscopy)
+ CT Coronary Angiography
+ CT Dorsal Spine
+ CT Enterography
+ CT Extremity (Any Joint)
+ CT Face (3D)
+ CT Guided Drainage
+ CT Guided FNAC / Biopsy
+ CT Knee
+ CT KUB (Stone Protocol)
+ CT Liver Triple Phase
+ CT Lumbosacral Spine
+ CT Lung Screening (Low Dose)
+ CT Neck Angiography (Carotid)
+ CT Neck Plain & Contrast
+ CT Orbit
+ CT Pancreas Protocol
+ CT Paranasal Sinuses (PNS)
+ CT Pelvis & Hip Joints
+ CT Pelvis Plain & Contrast
+ CT Peripheral Angiography (Lower Limb)
+ CT Peripheral Angiography (Upper Limb)
+ CT Pulmonary Angiography (CTPA)
+ CT Renal Angiography
+ CT Shoulder
+ CT Temporal Bone / Mastoid
+ CT Urography
+ CT Whole Abdomen Triple Phase
+ CT Whole Body (Trauma / Pan-Scan)
+ CT Whole Spine
+ HRCT Chest

@ Cardiology |  | cardio|^ecg|^echo
+ 2D Echo (Pediatric)
+ ABI (Ankle Brachial Index)
+ ABPM (24 Hr Ambulatory BP)
+ CIMT (Carotid Intima-Media Thickness)
+ Contrast Echo (Bubble Study)
+ ECG (12 Lead)
+ ECG (Pediatric)
+ ECG with Rhythm Strip
+ Echocardiography (2D Echo with Color Doppler)
+ Event Recorder
+ Fetal Echocardiography
+ Holter Monitoring (24 Hr)
+ Holter Monitoring (48 Hr)
+ Holter Monitoring (72 Hr)
+ Pacemaker / ICD Check
+ Signal Averaged ECG
+ Stress Echo (Dobutamine)
+ Tilt Table Test
+ TMT (Treadmill Test)
+ Transesophageal Echo (TEE)

@ DEXA / Bone Densitometry |  | dexa|densitometr
+ DEXA Body Composition
+ DEXA Forearm
+ DEXA Hip (One Side)
+ DEXA Pediatric (BMD)
+ DEXA Spine
+ DEXA Spine & Hip (BMD)
+ DEXA Total Body (BMD)
+ Heel BMD (Calcaneal Ultrasound)
+ Trabecular Bone Score (TBS)
+ Vertebral Fracture Assessment (VFA)

@ Dental Imaging |  | dental
+ Bitewing X-Ray
+ CBCT Both Jaws
+ CBCT Impacted Tooth
+ CBCT Implant Planning
+ CBCT Single Arch
+ CBCT Sinus
+ CBCT TMJ
+ Cephalometric Analysis
+ IOPA (Single Tooth)
+ IOPA Full Mouth
+ Lateral Cephalogram
+ Occlusal X-Ray
+ OPG (Orthopantomogram)
+ PA Cephalogram
+ TMJ X-Ray (Dental)

@ ENT & Audiology |  | audiolog|^ent( |$|/|&)
+ Acoustic Reflex Testing
+ ASSR
+ BERA / ABR (Hearing)
+ Caloric Test
+ Hearing Aid Evaluation / Trial
+ Impedance Audiometry (Tympanometry)
+ Newborn Hearing Screening
+ OAE (Otoacoustic Emission)
+ PTA + Impedance (Combined)
+ Pure Tone Audiometry (PTA)
+ Rhinomanometry
+ Speech Audiometry
+ Tinnitus Evaluation
+ Video Laryngostroboscopy
+ VNG (Videonystagmography)

@ Endoscopy |  | endoscop
+ 24 Hr pH Monitoring
+ Anoscopy
+ Bronchoscopy (Diagnostic)
+ Bronchoscopy with BAL
+ Capsule Endoscopy
+ Colonoscopy (Diagnostic)
+ Colonoscopy with Biopsy
+ Colonoscopy with Polypectomy
+ Colposcopy
+ Cystoscopy (Diagnostic)
+ ERCP
+ Esophageal Manometry
+ EUS (Endoscopic Ultrasound)
+ Hysteroscopy (Diagnostic)
+ Laryngoscopy (Flexible)
+ Nasal Endoscopy (DNE)
+ Proctoscopy
+ Sigmoidoscopy (Flexible)
+ Upper GI Endoscopy (OGD / EGD)
+ Upper GI Endoscopy with Biopsy
+ Upper GI Endoscopy with CLO Test

@ Fluoroscopy / Contrast Studies |  | fluoro|contrast stud
+ Arthrography
+ Barium Enema
+ Barium Meal
+ Barium Meal Follow Through
+ Barium Swallow
+ Cystogram
+ Dacryocystography (DCG)
+ Defecography
+ Fistulogram
+ Hysterosalpingography (HSG)
+ IVU / IVP (Intravenous Urography)
+ Loopogram
+ Micturating Cystourethrogram (MCU)
+ Myelography
+ Nephrostogram
+ Retrograde Urethrogram (RGU)
+ Sialography
+ Sinogram
+ Small Bowel Enema (Enteroclysis)
+ T-Tube Cholangiogram

@ MRI |  | ^mri|magnetic resonance
+ MR Angiography Peripheral
+ MR Enterography
+ MR Spectroscopy Brain
+ MR Urography
+ MRA Brain (Circle of Willis)
+ MRA Neck (Carotid)
+ MRCP
+ MRI Abdomen
+ MRI Ankle
+ MRI Brachial Plexus
+ MRI Brain DWI / Stroke Protocol
+ MRI Brain Epilepsy Protocol
+ MRI Brain Plain
+ MRI Brain Plain & Contrast
+ MRI Brain with MRA
+ MRI Breast (Both)
+ MRI Cardiac
+ MRI Cervical Spine
+ MRI Chest
+ MRI Dorsal Spine
+ MRI Elbow
+ MRI Extremity (Bone / Soft Tissue)
+ MRI Face & Neck
+ MRI Female Pelvis (Uterus & Ovaries)
+ MRI Fetal
+ MRI Fistula (Perianal)
+ MRI Foot
+ MRI Hand
+ MRI Hip (Both)
+ MRI IAM / Cranial Nerves (CP Angle)
+ MRI Knee
+ MRI Liver (Dynamic Contrast)
+ MRI Lumbosacral Plexus
+ MRI Lumbosacral Spine
+ MRI Neck Soft Tissue
+ MRI Orbit
+ MRI Pelvis
+ MRI Pituitary (Dynamic)
+ MRI Prostate (Multiparametric)
+ MRI Shoulder
+ MRI SI Joints
+ MRI Spine with Contrast
+ MRI TMJ
+ MRI Whole Body Screening
+ MRI Whole Spine Screening
+ MRI Wrist
+ MRV Brain

@ Mammography |  | mammo
+ 3D Mammography (Tomosynthesis)
+ Diagnostic Mammography (Additional Views)
+ Galactography (Ductogram)
+ Mammography + Breast USG (Combined)
+ Mammography Bilateral
+ Mammography Unilateral
+ Needle Localization (Breast)
+ Screening Mammography
+ Stereotactic Breast Biopsy

@ Neurophysiology |  | neuro
+ Autonomic Function Test
+ BERA / BAER (Brainstem Evoked Response)
+ Blink Reflex
+ EEG (Routine)
+ EEG Pediatric
+ EEG Sleep Deprived
+ EEG Video Monitoring (Long Term)
+ EMG (Needle)
+ H-Reflex & F-Wave Study
+ NCV + EMG (Single Limb)
+ NCV Four Limbs
+ NCV Lower Limb
+ NCV Upper Limb
+ RNS (Repetitive Nerve Stimulation)
+ SSEP (Somatosensory Evoked Potential)
+ Transcranial Doppler (TCD)
+ VEP (Visual Evoked Potential)

@ Nuclear Medicine / PET-CT |  | nuclear|pet.?ct
+ Bone Scan (Whole Body)
+ Bone Scan Three Phase
+ Brain SPECT
+ DOTATATE PET-CT
+ Gastric Emptying Scan
+ GI Bleed Scan
+ Hepatobiliary (HIDA) Scan
+ Lung Perfusion / V-Q Scan
+ Lymphoscintigraphy (Sentinel Node)
+ MAG3 Renogram
+ Meckel's Diverticulum Scan
+ MIBG Scan
+ MUGA Scan
+ Myocardial Perfusion Imaging (SPECT) Rest
+ Myocardial Perfusion Imaging (SPECT) Stress
+ Octreotide Scan
+ Parathyroid Scan (Sestamibi)
+ PET-CT Brain
+ PET-CT Cardiac Viability
+ PET-CT Whole Body (FDG)
+ PSMA PET-CT
+ Radionuclide Cystogram
+ Renal Scan (DMSA)
+ Renal Scan (DTPA)
+ Salivary Gland Scintigraphy
+ Testicular Scan
+ Thyroid Scan (Tc-99m)
+ Thyroid Uptake
+ Whole Body Iodine Scan (I-131)

@ Ophthalmology |  | ophthal|^eye
+ A-Scan Biometry (IOL Power)
+ B-Scan Ocular Ultrasound
+ Color Vision Testing
+ Corneal Topography
+ ERG (Electroretinography)
+ Fluorescein Angiography (FFA)
+ Fundus Examination
+ Fundus Photography
+ Gonioscopy
+ Lacrimal Syringing
+ OCT Angiography
+ OCT Macula
+ OCT Optic Nerve (RNFL)
+ Orthoptic Evaluation (Squint)
+ Pachymetry
+ Schirmer's Test
+ Slit Lamp Examination
+ Specular Microscopy
+ Tonometry (IOP)
+ Visual Acuity & Refraction
+ Visual Field (Perimetry)

@ Pulmonology / PFT |  | pulmon|^pft
+ 6 Minute Walk Test
+ Allergy Skin Prick Test (Panel)
+ Bronchial Provocation (Methacholine) Test
+ CPET (Cardiopulmonary Exercise Test)
+ DLCO (Diffusion Capacity)
+ FeNO (Exhaled Nitric Oxide)
+ Home Sleep Apnea Test
+ Lung Volumes (Body Plethysmography)
+ Overnight Oximetry
+ Peak Flow Rate
+ PFT Complete (Spirometry + DLCO + Lung Volumes)
+ Polysomnography (Sleep Study)
+ Spirometry (PFT)
+ Spirometry Pre & Post Bronchodilator
+ Split Night Sleep Study (CPAP Titration)

@ Ultrasound (USG) |  | ultra ?sound|^usg|sonograph
+ Doppler Abdominal Aorta
+ Doppler Arterial Lower Limb
+ Doppler Arterial Upper Limb
+ Doppler Carotid & Vertebral Arteries
+ Doppler Penile
+ Doppler Portal Vein / Liver
+ Doppler Renal Arteries
+ Doppler Scrotum
+ Doppler Thyroid
+ Doppler Venous Lower Limb (DVT)
+ Doppler Venous Upper Limb
+ Liver Elastography (FibroScan)
+ USG Abdomen & Pelvis
+ USG Anomaly Scan (TIFFA, 18-22 Weeks)
+ USG Anterior Abdominal Wall (Hernia)
+ USG Biophysical Profile (BPP)
+ USG Breast (Both)
+ USG Breast (Single)
+ USG Cervical Length
+ USG Chest / Pleural
+ USG Follicular Study (Complete Cycle)
+ USG Follicular Study (Single Scan)
+ USG Guided Aspiration / Drainage
+ USG Guided Biopsy
+ USG Guided FNAC
+ USG Hepatobiliary System (HBS)
+ USG Hip (MSK)
+ USG Infant Hip (DDH)
+ USG Inguinal Region
+ USG Knee (MSK)
+ USG KUB (Kidney, Ureter, Bladder)
+ USG KUB with Prostate
+ USG Lower Abdomen
+ USG Neck (Soft Tissue / Lymph Nodes)
+ USG Neonatal Cranial (Transfontanellar)
+ USG Neonatal Spine
+ USG NT / NB Scan (11-14 Weeks)
+ USG Obstetric 2nd Trimester
+ USG Obstetric 3rd Trimester / Growth
+ USG Obstetric Dating / Viability
+ USG Obstetric Doppler (Umbilical & Uterine Artery)
+ USG Pelvis (Transabdominal)
+ USG Post Void Residual (PVR)
+ USG Prostate (TRUS)
+ USG Pyloric Stenosis (Pediatric)
+ USG Salivary Glands
+ USG Scrotum / Testes
+ USG Shoulder (MSK)
+ USG Soft Tissue / Lump
+ USG Thyroid
+ USG Transvaginal (TVS)
+ USG Upper Abdomen
+ USG Whole Abdomen

@ X-Ray |  | ^x[ -]?ray|radiograph
+ Abdomen Erect
+ Abdomen Erect & Supine
+ Abdomen Supine
+ Ankle Joint AP & Lateral
+ Bone Age (Hand & Wrist)
+ Both Hip Joints AP
+ Both Knees Standing AP
+ Calcaneum (Heel) Axial & Lateral
+ Cervical Spine AP & Lateral
+ Cervical Spine Flexion & Extension
+ Cervical Spine Oblique Views
+ Cervical Spine Open Mouth (Odontoid) View
+ Chest AP View
+ Chest Apical Lordotic View
+ Chest Decubitus View
+ Chest Lateral View
+ Chest PA & Lateral Views
+ Chest PA View
+ Clavicle AP
+ Dorsal (Thoracic) Spine AP & Lateral
+ Elbow Joint AP & Lateral
+ Femur AP & Lateral
+ Fingers
+ Foot AP & Oblique
+ Forearm AP & Lateral
+ Hand AP & Oblique
+ Hip Joint AP & Lateral (One Side)
+ Humerus AP & Lateral
+ Infantogram (Babygram)
+ Knee Joint AP & Lateral
+ Knee Joint Weight Bearing
+ KUB (Plain X-Ray)
+ Lumbosacral Spine AP & Lateral
+ Lumbosacral Spine Flexion & Extension
+ Lumbosacral Spine Oblique Views
+ Mandible AP & Lateral
+ Mastoids (Schuller's View)
+ Nasal Bone Lateral
+ Neck AP & Lateral (Soft Tissue)
+ Orbit
+ Paranasal Sinuses (PNS) Caldwell View
+ Paranasal Sinuses (PNS) Water's View
+ Patella Skyline View
+ Pelvis AP View
+ Post-Nasal Space / Adenoids (Lateral)
+ Ribs (One Side)
+ Sacroiliac (SI) Joints
+ Sacrum & Coccyx AP & Lateral
+ Scanogram (Limb Length)
+ Scapula AP & Lateral
+ Shoulder Axial / Y View
+ Shoulder Joint AP
+ Skeletal Survey
+ Skull AP & Lateral
+ Skull Towne's View
+ Sternum Lateral View
+ Tibia & Fibula AP & Lateral
+ TM Joints
+ Toes
+ Whole Spine (Scoliosis) AP & Lateral
+ Wrist Joint AP & Lateral
$data$, E'\r?\n') WITH ORDINALITY AS l(line, ord)
WHERE btrim(l.line) <> '' AND btrim(l.line) NOT LIKE '--%';

-- ---------- parse the data block ----------
CREATE TEMP TABLE tmp_seed_grp AS
SELECT ord, line, dg, tg_ AS tg,
       sum(CASE WHEN line !~ '^[@#+>~]' THEN 1 ELSE 0 END)
           OVER (PARTITION BY tg_ ORDER BY ord) AS gp   -- parameter number inside its test
FROM (SELECT ord, line,
             count(*) FILTER (WHERE line ~ '^@')     OVER (ORDER BY ord) AS dg,   -- department group
             count(*) FILTER (WHERE line ~ '^[#=+]') OVER (ORDER BY ord) AS tg_   -- test group
      FROM tmp_seed_raw) z;

CREATE TEMP TABLE tmp_seed_dept AS
SELECT dg, btrim(f[1]) AS dname, nullif(btrim(f[2]), '') AS specimen, nullif(btrim(f[3]), '') AS rx,
       pg_temp.nk(btrim(f[1])) AS dkey
FROM (SELECT dg, string_to_array(substr(line, 2), '|') AS f FROM tmp_seed_grp WHERE line ~ '^@') x;

CREATE TEMP TABLE tmp_seed_test AS
SELECT row_number() OVER (ORDER BY h.ord, u.i)::int AS tid,
       h.tg, h.dg, left(btrim(u.nm), 200) AS name, pg_temp.nk(btrim(u.nm)) AS nkey,
       (SELECT substr(a.line, 3) FROM tmp_seed_grp a WHERE a.tg = h.tg AND a.line ~ '^~ ' LIMIT 1) AS alias,
       CASE WHEN h.spec IS NULL THEN d.specimen WHEN h.spec = '-' THEN NULL ELSE h.spec END AS specimen,
       h.method,
       EXISTS (SELECT 1 FROM tmp_seed_grp c WHERE c.tg = h.tg AND c.line ~ '^<') AS has_compose
FROM (SELECT ord, tg, dg, line,
             string_to_array(substr(line, 2), '|') AS f,
             CASE left(line, 1) WHEN '=' THEN nullif(btrim((string_to_array(substr(line, 2), '|'))[5]), '')
                                ELSE nullif(btrim((string_to_array(substr(line, 2), '|'))[2]), '') END AS spec,
             CASE left(line, 1) WHEN '=' THEN nullif(btrim((string_to_array(substr(line, 2), '|'))[6]), '')
                                WHEN '#' THEN nullif(btrim((string_to_array(substr(line, 2), '|'))[3]), '') END AS method
      FROM tmp_seed_grp WHERE line ~ '^[#=+]') h
JOIN tmp_seed_dept d ON d.dg = h.dg
CROSS JOIN LATERAL unnest(string_to_array((string_to_array(substr(h.line, 2), '|'))[1], ';;')) WITH ORDINALITY AS u(nm, i);

CREATE TEMP TABLE tmp_seed_par AS
SELECT t.tid, g.gp AS n,
       CASE WHEN g.line ~ '^<' THEN 'C' ELSE 'P' END AS kind,
       -- direct parameter
       CASE WHEN g.line ~ '^=' THEN '' ELSE coalesce(btrim(p.f[1]), '') END AS section,
       CASE WHEN g.line ~ '^=' THEN t.name ELSE btrim(p.f[2]) END           AS pname,
       CASE WHEN g.line ~ '^=' THEN nullif(btrim(e.f[2]), '') ELSE nullif(btrim(p.f[3]), '') END AS unit,
       CASE (CASE WHEN g.line ~ '^=' THEN btrim(e.f[3]) ELSE btrim(p.f[4]) END)
            WHEN 'N' THEN 'Numeric' WHEN 'T' THEN 'Text' WHEN 'A' THEN 'Auto' END                AS rtype,
       CASE WHEN g.line ~ '^=' THEN nullif(btrim(e.f[4]), '') ELSE nullif(btrim(p.f[5]), '') END::smallint AS dp,
       CASE WHEN g.line ~ '^=' THEN true ELSE coalesce(btrim(p.f[6]) = 'b', false) END          AS bold,
       -- panel source
       nullif(btrim(c.f[1]), '') AS srcname, nullif(btrim(c.f[2]), '') AS srcparam, nullif(btrim(c.f[3]), '') AS srcsec
FROM tmp_seed_grp g
JOIN tmp_seed_test t ON t.tg = g.tg
CROSS JOIN LATERAL (SELECT string_to_array(g.line, '|') AS f) p
CROSS JOIN LATERAL (SELECT string_to_array(substr(g.line, 2), '|') AS f) e
CROSS JOIN LATERAL (SELECT string_to_array(substr(g.line, 2), '|') AS f) c
WHERE g.line !~ '^[@#+>~]';

CREATE TEMP TABLE tmp_seed_rng AS
SELECT t.tid, g.gp AS n,
       CASE btrim(f[1]) WHEN 'M' THEN 'Male' WHEN 'F' THEN 'Female' END AS gender,
       nullif(btrim(f[2]), '') AS low, nullif(btrim(f[3]), '') AS high,
       nullif(btrim(f[4]), '') AS clow, nullif(btrim(f[5]), '') AS chigh,
       nullif(btrim(f[6]), '') AS ntext,
       coalesce((SELECT string_agg(btrim(x), ' | ' ORDER BY o) FROM unnest(f[7:]) WITH ORDINALITY AS u(x, o)),
                btrim(f[2]) || ' - ' || btrim(f[3])) AS disp
FROM tmp_seed_grp g
JOIN tmp_seed_test t ON t.tg = g.tg
CROSS JOIN LATERAL (SELECT string_to_array(substr(g.line, 2), '|') AS f) x
WHERE g.line ~ '^>';

-- guard against a broken copy / paste of the data block
DO $$
DECLARE bad TEXT;
BEGIN
    SELECT string_agg(DISTINCT t.name, '; ') INTO bad FROM tmp_seed_par p JOIN tmp_seed_test t USING (tid)
     WHERE p.kind = 'P' AND (p.rtype IS NULL OR coalesce(p.pname, '') = '' OR length(p.pname) > 180
                             OR length(coalesce(p.unit, '')) > 40 OR length(p.section) > 100);
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'departments_and_tests: bad parameter line(s) in: %', bad; END IF;
    SELECT string_agg(DISTINCT t.name, '; ') INTO bad FROM tmp_seed_par p JOIN tmp_seed_test t USING (tid)
     WHERE p.kind = 'C' AND p.srcname IS NULL;
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'departments_and_tests: bad "<" line(s) in: %', bad; END IF;
    SELECT string_agg(DISTINCT name, '; ') INTO bad
      FROM (SELECT dg, name FROM tmp_seed_test GROUP BY dg, name HAVING count(*) > 1) d;
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'departments_and_tests: test listed twice in a department: %', bad; END IF;
    RAISE NOTICE 'departments_and_tests: data OK - % departments, % tests, % parameter lines, % ranges',
        (SELECT count(*) FROM tmp_seed_dept), (SELECT count(*) FROM tmp_seed_test),
        (SELECT count(*) FROM tmp_seed_par), (SELECT count(*) FROM tmp_seed_rng);
END
$$;

-- ---------- apply to every lab schema ----------
CREATE TEMP TABLE IF NOT EXISTS tmp_seed_dmap (dg INT PRIMARY KEY, id UUID NOT NULL);
CREATE TEMP TABLE IF NOT EXISTS tmp_seed_tmap (tid INT NOT NULL, test_id UUID NOT NULL, PRIMARY KEY (tid, test_id));
CREATE TEMP TABLE IF NOT EXISTS tmp_seed_tgt  (test_id UUID PRIMARY KEY, tid INT NOT NULL, starter_id UUID);
CREATE TEMP TABLE IF NOT EXISTS tmp_seed_np (
    new_id UUID NOT NULL DEFAULT gen_random_uuid(), test_id UUID NOT NULL, tid INT NOT NULL, n INT NOT NULL,
    src_id UUID, starter BOOLEAN NOT NULL DEFAULT false, section TEXT, name TEXT, unit TEXT, rtype TEXT,
     dp SMALLINT, bold BOOLEAN, sort INT);

DO $apply$
DECLARE
    s        TEXT;
    only_s   TEXT := nullif(current_setting('lokynex.only_schema', true), '');
    old_path TEXT := current_setting('search_path');
    n_dept INT; n_test INT; n_par INT; n_rng INT;
BEGIN
    FOR s IN
        SELECT DISTINCT i.table_schema
        FROM information_schema.tables i
        WHERE i.table_name = 'test_parameters'
          AND i.table_schema NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')
          AND (only_s IS NULL OR i.table_schema = only_s)
        ORDER BY 1
    LOOP
        IF to_regclass(format('%I.tests', s)) IS NULL OR to_regclass(format('%I.test_report_info', s)) IS NULL THEN
            RAISE NOTICE 'SKIPPED schema % : run 002_tenant_schema.sql first.', s;
            CONTINUE;
        END IF;
        PERFORM set_config('search_path', format('%I, public', s), true);

        -- the app only knows Auto | Numeric | Text (older seeds wrote 'Number')
        UPDATE test_parameters SET result_type = 'Numeric' WHERE result_type = 'Number';

        -- departments (reuse an existing one when its name matches)
        INSERT INTO departments (name)
        SELECT d.dname FROM tmp_seed_dept d
        WHERE NOT EXISTS (SELECT 1 FROM departments x
                          WHERE pg_temp.nk(x.name) = d.dkey OR (d.rx IS NOT NULL AND x.name ~* d.rx))
        ON CONFLICT (name) DO NOTHING;
        GET DIAGNOSTICS n_dept = ROW_COUNT;

        TRUNCATE tmp_seed_dmap;
        INSERT INTO tmp_seed_dmap (dg, id)
        SELECT DISTINCT ON (d.dg) d.dg, x.id
        FROM tmp_seed_dept d
        JOIN departments x ON pg_temp.nk(x.name) = d.dkey OR (d.rx IS NOT NULL AND x.name ~* d.rx)
        ORDER BY d.dg, (pg_temp.nk(x.name) = d.dkey) DESC, x.created_at, x.name;

        -- which tests does the lab already have?
        TRUNCATE tmp_seed_tmap;
        INSERT INTO tmp_seed_tmap (tid, test_id)
        SELECT t.tid, x.id FROM tmp_seed_test t
        JOIN (SELECT id, pg_temp.nk(name) AS k FROM tests) x ON x.k = t.nkey
        UNION
        SELECT t.tid, x.id FROM tmp_seed_test t
        JOIN (SELECT id, name, pg_temp.nk(name) AS k FROM tests) x
          ON t.alias IS NOT NULL AND x.name ~* t.alias
         AND x.k NOT IN (SELECT nkey FROM tmp_seed_test);   -- tests of this catalog are never "aliases" of another one

        INSERT INTO tests (department_id, name, price)
        SELECT m.id, t.name, 0
        FROM tmp_seed_test t JOIN tmp_seed_dmap m ON m.dg = t.dg
        WHERE NOT EXISTS (SELECT 1 FROM tmp_seed_tmap k WHERE k.tid = t.tid)
        ON CONFLICT (department_id, name) DO NOTHING;
        GET DIAGNOSTICS n_test = ROW_COUNT;

        INSERT INTO tmp_seed_tmap (tid, test_id)
        SELECT t.tid, x.id
        FROM tmp_seed_test t
        JOIN tmp_seed_dmap m ON m.dg = t.dg
        JOIN tests x ON x.department_id = m.id AND x.name = t.name
        ON CONFLICT DO NOTHING;

        -- specimen / method defaults shown on the Test Format + Upload Report screens
        INSERT INTO test_report_info (test_id, specimen, method)
        SELECT DISTINCT ON (k.test_id) k.test_id, left(t.specimen, 120), left(t.method, 200)
        FROM tmp_seed_tmap k JOIN tmp_seed_test t ON t.tid = k.tid
        WHERE t.specimen IS NOT NULL OR t.method IS NOT NULL
        ORDER BY k.test_id, t.tid
        ON CONFLICT (test_id) DO NOTHING;

        -- tests that may receive a format: no parameter yet, or only the untouched 1-line starter
        TRUNCATE tmp_seed_tgt;
        INSERT INTO tmp_seed_tgt (test_id, tid, starter_id)
        SELECT DISTINCT ON (k.test_id) k.test_id, k.tid,
               (SELECT p.id FROM test_parameters p WHERE p.test_id = k.test_id ORDER BY p.sort_order, p.name LIMIT 1)
        FROM tmp_seed_tmap k JOIN tests t ON t.id = k.test_id
        WHERE EXISTS (SELECT 1 FROM tmp_seed_par q WHERE q.tid = k.tid)
          AND (   NOT EXISTS (SELECT 1 FROM test_parameters x WHERE x.test_id = t.id)
               OR (    (SELECT count(*) FROM test_parameters x WHERE x.test_id = t.id) = 1
                   AND EXISTS (SELECT 1 FROM test_parameters x
                               WHERE x.test_id = t.id AND x.unit IS NULL AND x.section_name = ''
                                 AND x.name = left(t.name, 180)
                                 AND NOT EXISTS (SELECT 1 FROM test_reference_ranges r WHERE r.parameter_id = x.id))))
        ORDER BY k.test_id, k.tid;

        -- parameters written directly in the data block (an untouched starter row is reused, so
        -- any saved report result still points to it)
        TRUNCATE tmp_seed_np;
        INSERT INTO tmp_seed_np (test_id, tid, n, section, name, unit, rtype, dp, bold, sort)
        SELECT g.test_id, g.tid, p.n, p.section, left(p.pname, 180), p.unit, p.rtype, p.dp, p.bold,
               p.n * CASE WHEN t.has_compose THEN 1000 ELSE 10 END
        FROM tmp_seed_tgt g
        JOIN tmp_seed_par p  ON p.tid = g.tid AND p.kind = 'P'
        JOIN tmp_seed_test t ON t.tid = g.tid;
        UPDATE tmp_seed_np np SET new_id = g.starter_id, starter = true
        FROM tmp_seed_tgt g
        WHERE g.test_id = np.test_id AND g.starter_id IS NOT NULL
          AND np.n = (SELECT min(y.n) FROM tmp_seed_np y WHERE y.test_id = np.test_id);

        UPDATE test_parameters p
           SET section_name = np.section, name = np.name, unit = np.unit, result_type = np.rtype,
               decimal_places = np.dp, sort_order = np.sort, is_bold = np.bold
          FROM tmp_seed_np np WHERE np.starter AND p.id = np.new_id;
        INSERT INTO test_parameters (id, test_id, section_name, name, unit, result_type, decimal_places, sort_order, is_bold)
        SELECT new_id, test_id, section, name, unit, rtype, dp, sort, bold FROM tmp_seed_np WHERE NOT starter;
        GET DIAGNOSTICS n_par = ROW_COUNT;

        INSERT INTO test_reference_ranges
            (parameter_id, gender, low_value, high_value, critical_low, critical_high, normal_text, display_text)
        SELECT np.new_id, r.gender::gender_type, r.low::numeric, r.high::numeric,
               r.clow::numeric, r.chigh::numeric, r.ntext, r.disp
        FROM tmp_seed_np np JOIN tmp_seed_rng r ON r.tid = np.tid AND r.n = np.n;
        GET DIAGNOSTICS n_rng = ROW_COUNT;

        -- panels: copy parameters (and ranges) of other tests, e.g. CMP = glucose + kidney + liver
        TRUNCATE tmp_seed_np;
        INSERT INTO tmp_seed_np (test_id, tid, n, src_id, section, name, unit, rtype, dp, bold, sort)
        SELECT DISTINCT ON (g.test_id, lower(coalesce(pn.srcsec, sp.section_name)), lower(sp.name))
               g.test_id, g.tid, pn.n, sp.id, coalesce(pn.srcsec, sp.section_name), sp.name, sp.unit,
               sp.result_type, sp.decimal_places, sp.is_bold, pn.n * 1000 + sp.sort_order
        FROM tmp_seed_tgt g
        JOIN tmp_seed_par pn ON pn.tid = g.tid AND pn.kind = 'C'
        JOIN tests st ON st.name = pn.srcname
        JOIN test_parameters sp ON sp.test_id = st.id AND sp.status = 'Active'
                               AND (pn.srcparam IS NULL OR sp.name = pn.srcparam)
        ORDER BY g.test_id, lower(coalesce(pn.srcsec, sp.section_name)), lower(sp.name), pn.n;
        INSERT INTO test_parameters (id, test_id, section_name, name, unit, result_type, decimal_places, sort_order, is_bold)
        SELECT new_id, test_id, coalesce(section, ''), name, unit, rtype, dp, sort, coalesce(bold, false) FROM tmp_seed_np;
        INSERT INTO test_reference_ranges
            (parameter_id, gender, age_min_days, age_max_days, low_value, high_value,
             critical_low, critical_high, normal_text, display_text)
        SELECT np.new_id, r.gender, r.age_min_days, r.age_max_days, r.low_value, r.high_value,
               r.critical_low, r.critical_high, r.normal_text, r.display_text
        FROM tmp_seed_np np JOIN test_reference_ranges r ON r.parameter_id = np.src_id;

        RAISE NOTICE '  % : departments +%, tests +%, parameters +%, ranges +%', s, n_dept, n_test, n_par, n_rng;
    END LOOP;

    PERFORM set_config('search_path', old_path, true);
END
$apply$;

DROP TABLE IF EXISTS tmp_seed_raw, tmp_seed_grp, tmp_seed_dept, tmp_seed_test, tmp_seed_par, tmp_seed_rng,
                     tmp_seed_dmap, tmp_seed_tmap, tmp_seed_tgt, tmp_seed_np;
DROP FUNCTION IF EXISTS pg_temp.nk(TEXT);

-- QUICK CHECKS (set the search_path to a lab first: SET search_path TO lab_demo, public;)
--   SELECT d.name, count(*) FROM tests t JOIN departments d ON d.id = t.department_id GROUP BY 1 ORDER BY 1;
--   -- tests without a report format (imaging / procedures have none on purpose):
--   SELECT t.name FROM tests t WHERE NOT EXISTS (SELECT 1 FROM test_parameters p WHERE p.test_id = t.id);

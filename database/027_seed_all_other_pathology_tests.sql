-- ======================================================================
-- 027_seed_all_other_pathology_tests.sql
-- WHAT : 026 covered the blood pack + urine / stool / semen / culture /
--        body fluid / cytology / histopathology basics. This file adds the
--        pathology tests that were STILL MISSING, each with a full report
--        format (visible on the Test Formats page):
--          * Hematology   : Microfilaria, LD body, Kleihauer-Betke, Heinz body, PNH screen
--          * Coagulation  : Factor XIII, Bethesda inhibitor, platelet aggregation, PFA-100, APCR ...
--          * Biochemistry : ACE, MMA, Vit K, carnitine, sdLDL, lipid ratios, sweat chloride, GDM-OGTT ...
--          * Endocrine    : androstenedione, DHT, gastrin, glucagon, TBG, GAD-65, DST, ACTH stim ...
--          * Immunoassay / tumour markers, Autoimmune (Coeliac, AMA/ASMA, AChR, PLA2R, ANA profile ...)
--          * Serology     : VZV / measles / mumps, HDV, HEV, JE, Zika, kala-azar, filaria, FTA-ABS,
--                           CrAg, amoebic / hydatid / cysticercosis, rabies titre ...
--          * Microbiology : BAL / ETA / bile / tissue / anaerobic / corneal culture, AST, MIC,
--                           ESBL / CRE, India ink, wet mount, CBNAAT, Line Probe Assay,
--                           slit-skin smear, water analysis, OT surveillance
--          * Molecular    : SARS-CoV-2, Influenza, respiratory panel, HPV, CMV / EBV / BK load, EGFR,
--                           KRAS / BRAF, PML-RARA, FLT3 / NPM1, AZF, FISH, paternity, prenatal karyotype ...
--          * Profiles     : Bone, PCOS, Infertility (F / M), Pre-marital, Full Body, Cardiac, Pancreatic,
--                           Hepatitis, Vitamin, STI, Dengue, Thrombophilia
--          * Tox / Blood bank / Pregnancy screening, extra Urine (24-hr, spot, UPEP, DOA-10),
--            Stool antigens, Semen (DFI, HOS), Body fluids (BAL, SAAG, Light's criteria, amniotic),
--            Cytology (LBC, Thyroid FNAC, Tzanck ...), Histopathology (frozen, IHC, Gleason, renal, DIF ...)
--
-- NO reference ranges are invented (same rule as 020 / 021 / 026): only parameter
-- name, unit, result type and decimals. Add normal ranges from your analyser /
-- kit insert in the Test Formats screen.
--
-- RUN ORDER : ... 017 -> 020 -> 021 -> 026 -> 027 (this file).  Safe to re-run:
--   * formats are written only for tests that have NO parameters yet (or still
--     the untouched 1-line starter from 020). Formats you edited are never overwritten.
--   * a new test / department is created only when no test with that name
--     (or department matching the pattern) exists.
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
--   DEPT (only for NEW tests): URI STO SEM MIC HEM COA SER BIO END IMM AUT MOL PRO TOX BLO BOD CYT HIS PRE
-- ======================================================================

-- ---------- 0. department codes (code -> name to create, pattern of an existing one) ----------
DROP TABLE IF EXISTS tmp27_dept;
CREATE TEMP TABLE tmp27_dept (code TEXT PRIMARY KEY, dname TEXT NOT NULL, pat TEXT NOT NULL);
INSERT INTO tmp27_dept (code, dname, pat) VALUES
    ('URI', 'Urine Analysis',               'urine%'),
    ('STO', 'Stool Examination',            'stool%'),
    ('SEM', 'Semen Analysis',               'semen%'),
    ('MIC', 'Microbiology',                 'microbio%'),
    ('HEM', 'Hematology',                   'h%ematolog%'),
    ('COA', 'Coagulation',                  'coagul%'),
    ('SER', 'Serology',                     'serolog%'),
    ('BIO', 'Biochemistry',                 'biochem%'),
    ('END', 'Endocrinology',                'endocrin%'),
    ('IMM', 'Immunoassay',                  'immunoassay%'),
    ('AUT', 'Autoimmune / Immunology',      'autoimmune%'),
    ('MOL', 'Molecular / Genetics',         'molecular%'),
    ('PRO', 'Profiles / Panels',            'profile%'),
    ('TOX', 'Toxicology / Drug Monitoring', 'toxicolog%'),
    ('BLO', 'Blood Bank',                   'blood bank%'),
    ('BOD', 'Body Fluids',                  '%body fluid%'),
    ('CYT', 'Cytology',                     'cytolog%'),
    ('HIS', 'Histopathology',               'histopath%'),
    ('PRE', 'Pregnancy / Screening',        'pregnancy%');

-- ---------- 1. the data block -> tmp27_fmt ----------
DROP TABLE IF EXISTS tmp27_fmt;
CREATE TEMP TABLE tmp27_fmt AS
WITH raw AS (
    SELECT l.ord, btrim(l.line) AS line
    FROM regexp_split_to_table($b$
-- =====================================================================
-- PART A : pack test that may still have no format
-- =====================================================================
= Total Calcium | mg/dL | N | 1
-- =====================================================================
-- PART B : NEW tests
-- =====================================================================
-- ---- HEMATOLOGY (special smears / stains) ----
# Microfilaria Detection (Night Blood Smear) | HEM | Peripheral blood (night collection)
MICROFILARIA | Microfilariae Seen | | T |
MICROFILARIA | Species | | T |
 | Impression | | T |
# LD Body Smear (Kala-azar) | HEM | Bone marrow / splenic aspirate smear
LD BODY | LD Bodies Seen | | T |
 | Impression | | T |
# Kleihauer-Betke Test (Fetal Cells in Maternal Blood) | HEM | Maternal blood (EDTA)
KLEIHAUER-BETKE | Fetal Red Cells | % | N | 2
KLEIHAUER-BETKE | Estimated Fetomaternal Haemorrhage | mL | N | 1
 | Interpretation | | T |
= Heinz Body Test ;; Haemoglobin H Inclusion Body Test ;; Sucrose Lysis Test (PNH Screen) ;; Ham's Acidified Serum Test | | T | | HEM | Whole blood (EDTA)
= Absolute Lymphocyte Count (ALC) ;; Absolute Monocyte Count ;; Absolute Basophil Count | /cumm | N | 0 | HEM | Whole blood (EDTA)
-- ---- COAGULATION ----
= Factor XIII Activity ;; Plasminogen Activity ;; Alpha-2 Antiplasmin | % | N | 0 | COA | Citrated plasma
= Factor XIII Clot Solubility Test ;; Activated Protein C Resistance (APCR) | | T | | COA | Citrated plasma
= Clot Retraction Test | | T | | COA | Whole blood (no anticoagulant)
= Euglobulin Lysis Time | min | N | 0 | COA | Citrated plasma
= Reptilase Time | sec | N | 1 | COA | Citrated plasma
= Heparin-induced Thrombocytopenia (HIT) Antibody (PF4) | | A | 2 | COA | Serum / citrated plasma
# Factor VIII Inhibitor (Bethesda Assay) | COA | Citrated plasma
INHIBITOR | Inhibitor Titre | BU | N | 1
 | Interpretation | | T |
# Platelet Aggregation Study | COA | Citrated platelet-rich plasma
PLATELET AGGREGATION | ADP | % | N | 0
PLATELET AGGREGATION | Collagen | % | N | 0
PLATELET AGGREGATION | Epinephrine | % | N | 0
PLATELET AGGREGATION | Arachidonic Acid | % | N | 0
PLATELET AGGREGATION | Ristocetin | % | N | 0
 | Interpretation | | T |
# PFA-100 (Platelet Function Analyser) | COA | Citrated whole blood
PFA-100 | Closure Time (Collagen / Epinephrine) | sec | N | 0
PFA-100 | Closure Time (Collagen / ADP) | sec | N | 0
 | Interpretation | | T |
-- ---- BIOCHEMISTRY ----
= Corrected Calcium (calculated) | mg/dL | N | 1 | BIO | Serum
= Unsaturated Iron Binding Capacity (UIBC) | µg/dL | N | 0 | BIO | Serum
= 5'-Nucleotidase ;; Angiotensin Converting Enzyme (ACE) ;; Prostatic Acid Phosphatase (PAP) | U/L | N | 1 | BIO | Serum
= Serum Amyloid A (SAA) | mg/L | N | 1 | BIO | Serum
= Methylmalonic Acid (MMA) | nmol/L | N | 0 | BIO | Serum
= Vitamin K (Phylloquinone) | ng/mL | N | 2 | BIO | Serum (protect from light)
= Carnitine, Total and Free | µmol/L | N | 1 | BIO | Plasma (heparin)
= Glycated Albumin | % | N | 1 | BIO | Serum
= 1,5-Anhydroglucitol | µg/mL | N | 1 | BIO | Serum
= Non-Esterified Fatty Acids (NEFA) | mmol/L | N | 2 | BIO | Serum
= Lipoprotein-associated Phospholipase A2 (Lp-PLA2) | ng/mL | N | 0 | BIO | Serum
= Small Dense LDL (sdLDL) | mg/dL | N | 1 | BIO | Serum
= Cholesterol / HDL Ratio (calculated) ;; LDL / HDL Ratio (calculated) ;; Triglyceride / HDL Ratio (calculated) | | N | 2 | BIO | Serum
= Sweat Chloride Test | mmol/L | N | 0 | BIO | Sweat (pilocarpine iontophoresis)
# OGTT for Gestational Diabetes (75 g) | BIO | Plasma (fluoride)
GDM OGTT | Fasting Plasma Glucose | mg/dL | N | 0
GDM OGTT | 1 Hour Plasma Glucose | mg/dL | N | 0
GDM OGTT | 2 Hour Plasma Glucose | mg/dL | N | 0
 | Interpretation | | T |
-- ---- ENDOCRINOLOGY ----
= Androstenedione ;; Estriol (E3) | ng/mL | N | 2 | END | Serum
= Dihydrotestosterone (DHT) | pg/mL | N | 0 | END | Serum
= Bioavailable Testosterone | ng/dL | N | 1 | END | Serum
= Free Androgen Index (calculated) ;; LH / FSH Ratio (calculated) | | N | 2 | END | Serum
= Cortisol (midnight) | µg/dL | N | 1 | END | Serum
= Macroprolactin (PEG Precipitation) | % | N | 0 | END | Serum
= Gastrin ;; Glucagon ;; Vasopressin (ADH) | pg/mL | N | 1 | END | Plasma (EDTA, chilled)
= Thyroxine-Binding Globulin (TBG) | µg/mL | N | 1 | END | Serum
= Reverse T3 (rT3) | ng/dL | N | 1 | END | Serum
= Leptin | ng/mL | N | 1 | END | Serum
= Anti-Insulin Antibody ;; GAD-65 Antibody ;; IA-2 Antibody | U/mL | A | 1 | END | Serum
# Dexamethasone Suppression Test (Overnight 1 mg) | END | Serum
DEXAMETHASONE SUPPRESSION | Baseline Cortisol (8 AM) | µg/dL | N | 1
DEXAMETHASONE SUPPRESSION | Cortisol after 1 mg Dexamethasone | µg/dL | N | 1
 | Interpretation | | T |
# ACTH Stimulation (Synacthen) Test | END | Serum
ACTH STIMULATION | Baseline Cortisol | µg/dL | N | 1
ACTH STIMULATION | Cortisol at 30 min | µg/dL | N | 1
ACTH STIMULATION | Cortisol at 60 min | µg/dL | N | 1
 | Interpretation | | T |
# Growth Hormone Suppression Test (OGTT) | END | Serum
GH SUPPRESSION | Growth Hormone (0 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (30 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (60 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (90 min) | ng/mL | N | 2
GH SUPPRESSION | Growth Hormone (120 min) | ng/mL | N | 2
 | Interpretation | | T |
# OGTT with Insulin Response | END | Plasma (fluoride) + serum
GLUCOSE | Fasting Glucose | mg/dL | N | 0
GLUCOSE | 1 Hour Glucose | mg/dL | N | 0
GLUCOSE | 2 Hour Glucose | mg/dL | N | 0
INSULIN | Fasting Insulin | µIU/mL | N | 2
INSULIN | 1 Hour Insulin | µIU/mL | N | 2
INSULIN | 2 Hour Insulin | µIU/mL | N | 2
 | Interpretation | | T |
-- ---- IMMUNOASSAY / TUMOUR MARKERS ----
= CA 27.29 ;; CA 50 ;; CA 242 | U/mL | N | 1 | IMM | Serum
= AFP-L3 Fraction | % | N | 1 | IMM | Serum
= PIVKA-II (DCP) | mAU/mL | N | 1 | IMM | Serum
= ProGRP | pg/mL | N | 1 | IMM | Serum
= S-100B Protein | µg/L | N | 2 | IMM | Serum
= Free / Total PSA Ratio (calculated) | % | N | 1 | IMM | Serum
= Holotranscobalamin (Active B12) | pmol/L | N | 1 | IMM | Serum
= RBC Folate | ng/mL | N | 0 | IMM | Whole blood (EDTA)
= Interleukin-6 (IL-6) | pg/mL | N | 1 | IMM | Serum
= Presepsin | pg/mL | N | 0 | IMM | Plasma (EDTA)
= Tryptase (Serum) | µg/L | N | 1 | IMM | Serum
= Specific IgE (Single Allergen) | kUA/L | A | 2 | IMM | Serum
-- ---- AUTOIMMUNE / IMMUNOLOGY ----
# Coeliac Disease Panel | AUT | Serum
COELIAC | Anti-tTG IgA | U/mL | A | 1
COELIAC | Anti-tTG IgG | U/mL | A | 1
COELIAC | Anti-Endomysial Antibody (EMA) IgA | | T |
COELIAC | Deamidated Gliadin Peptide (DGP) IgA | U/mL | A | 1
COELIAC | Deamidated Gliadin Peptide (DGP) IgG | U/mL | A | 1
COELIAC | Total IgA | mg/dL | N | 0
 | Interpretation | | T |
= Anti-tTG IgA ;; Anti-tTG IgG ;; Anti-Gliadin IgA ;; Anti-Gliadin IgG ;; Anti-Histone Antibody ;; Anti-Nucleosome Antibody ;; Anti-Ribosomal P Antibody ;; ASCA IgA ;; ASCA IgG | U/mL | A | 1 | AUT | Serum
= Anti-Endomysial Antibody (EMA) | | T | | AUT | Serum
= Anti-Mitochondrial Antibody (AMA) ;; Anti-Smooth Muscle Antibody (ASMA) ;; Anti-LKM-1 Antibody ;; Anti-Parietal Cell Antibody ;; Anti-Intrinsic Factor Antibody ;; Anti-Aquaporin-4 (NMO) Antibody ;; Anti-MOG Antibody ;; Anti-MuSK Antibody | | T | | AUT | Serum
= Anti-GBM Antibody | U/mL | A | 1 | AUT | Serum
= Anti-Acetylcholine Receptor (AChR) Antibody | nmol/L | A | 2 | AUT | Serum
= Anti-PLA2R Antibody | RU/mL | A | 1 | AUT | Serum
= C1 Esterase Inhibitor (Quantitative) ;; Complement C1q | mg/dL | N | 1 | AUT | Serum
= HLA-B51 Typing ;; HLA-DQ2 / DQ8 Typing | | T | | AUT | Whole blood (EDTA)
= Nitroblue Tetrazolium (NBT) Test | % | N | 0 | AUT | Whole blood (heparin)
# ANA Profile (Immunoblot / Line Assay) | AUT | Serum
ANA PROFILE | Nucleosomes | | T |
ANA PROFILE | Double-stranded DNA (dsDNA) | | T |
ANA PROFILE | Histones | | T |
ANA PROFILE | Sm / RNP | | T |
ANA PROFILE | Sm | | T |
ANA PROFILE | SS-A / Ro 60 | | T |
ANA PROFILE | SS-A / Ro 52 | | T |
ANA PROFILE | SS-B / La | | T |
ANA PROFILE | Scl-70 | | T |
ANA PROFILE | CENP-B | | T |
ANA PROFILE | Jo-1 | | T |
ANA PROFILE | Ribosomal P Protein | | T |
 | Interpretation | | T |
# Pemphigus / Pemphigoid Antibodies (ELISA) | AUT | Serum
BULLOUS DISEASE | Desmoglein 1 (Dsg1) IgG | U/mL | A | 1
BULLOUS DISEASE | Desmoglein 3 (Dsg3) IgG | U/mL | A | 1
BULLOUS DISEASE | BP180 (NC16A) IgG | U/mL | A | 1
BULLOUS DISEASE | BP230 IgG | U/mL | A | 1
 | Interpretation | | T |
= Total T Cells (CD3) Count ;; B Cells (CD19 / CD20) Count ;; NK Cells (CD16 / CD56) Count | cells/µL | N | 0 | AUT | Whole blood (EDTA)
-- ---- SEROLOGY ----
= HIV p24 Antigen ;; HIV Confirmatory Test (Western Blot / Line Immunoassay) ;; HIV Rapid Card Test ;; Hepatitis D (HDV) Antibody, Total ;; Hepatitis D (HDV) IgM ;; Hepatitis A (HAV) IgG / Total Antibody ;; Hepatitis E (HEV) IgG | | T | | SER | Serum
= HBsAg Quantitative | IU/mL | A | 2 | SER | Serum
= Japanese Encephalitis IgM ;; West Nile Virus IgM ;; Zika Virus IgM ;; Kala-azar rK39 Rapid Test ;; Filaria Antigen (ICT) ;; Filaria IgG4 ;; Tubex TF Typhoid Test | | T | | SER | Serum
= Varicella Zoster (VZV) IgG ;; Measles IgG ;; Mumps IgG | IU/mL | A | 1 | SER | Serum
= Varicella Zoster (VZV) IgM ;; Measles IgM ;; Mumps IgM | Index | A | 2 | SER | Serum
= EBV EBNA IgG ;; EBV Early Antigen (EA) IgG ;; Mycoplasma pneumoniae IgM ;; Mycoplasma pneumoniae IgG | U/mL | A | 1 | SER | Serum
= Chlamydia trachomatis IgG ;; Chlamydia trachomatis IgM ;; Chlamydia pneumoniae IgG | | T | | SER | Serum
= Legionella Antigen (Urine) ;; Streptococcus pneumoniae Antigen (Urine) | | T | | SER | Urine
= Anti-DNase B (ADB) | U/mL | A | 0 | SER | Serum
= Diphtheria Antibody (IgG) ;; Tetanus Antibody (IgG) | IU/mL | A | 2 | SER | Serum
= Entamoeba histolytica IgG (Amoebic Serology) ;; Hydatid (Echinococcus) IgG ;; Cysticercosis IgG ;; Toxocara IgG ;; Strongyloides IgG | | T | | SER | Serum
= Aspergillus Galactomannan Antigen | Index | A | 2 | SER | Serum / BAL
= Beta-D-Glucan | pg/mL | A | 0 | SER | Serum
= Syphilis FTA-ABS IgG ;; Syphilis FTA-ABS IgM ;; Syphilis Total Antibody (Treponemal EIA) ;; HTLV-I / II Antibody | | T | | SER | Serum
= SARS-CoV-2 Rapid Antigen Test ;; Influenza A / B Rapid Antigen Test | | T | | SER | Nasopharyngeal swab
= C-reactive Protein (Qualitative / Latex) ;; Rheumatoid Factor (Qualitative / Latex) | | T | | SER | Serum
= Rabies Neutralizing Antibody Titre | IU/mL | A | 2 | SER | Serum
= Toxoplasma IgG Avidity ;; CMV IgG Avidity ;; Rubella IgG Avidity | % | A | 0 | SER | Serum
# Cryptococcal Antigen (CrAg) | SER | Serum / CSF
CRYPTOCOCCAL ANTIGEN | Cryptococcal Antigen | | T |
CRYPTOCOCCAL ANTIGEN | Titre | titre | T |
-- ---- MICROBIOLOGY ----
# Bronchoalveolar Lavage (BAL) Culture & Sensitivity ;; Endotracheal Aspirate (ETA) Culture & Sensitivity ;; Tracheal Aspirate Culture & Sensitivity ;; Nasopharyngeal Swab Culture & Sensitivity ;; Gastric Aspirate Culture & Sensitivity | MIC | Respiratory / aspirate sample
CULTURE | Gram Stain | | T |
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
CULTURE | Colony Count | CFU/mL | A | 0
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Bile Culture & Sensitivity ;; Peritoneal Dialysis Fluid Culture & Sensitivity ;; Synovial Fluid Culture & Sensitivity ;; Pleural Fluid Culture & Sensitivity ;; Ascitic Fluid Culture & Sensitivity ;; Tissue / Biopsy Culture & Sensitivity ;; Bone Marrow Culture & Sensitivity ;; Anaerobic Culture & Sensitivity ;; Vibrio cholerae Culture & Sensitivity | MIC | Sterile fluid / tissue / stool
CULTURE | Gram Stain | | T |
CULTURE | Culture Result | | T |
CULTURE | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Corneal Scraping (Gram / KOH / Culture) | MIC | Corneal scraping
CORNEAL SCRAPING | Gram Stain | | T |
CORNEAL SCRAPING | KOH Mount | | T |
CORNEAL SCRAPING | Culture Result | | T |
CORNEAL SCRAPING | Organism Isolated | | T |
ANTIBIOTIC SENSITIVITY | Sensitive To | | T |
ANTIBIOTIC SENSITIVITY | Intermediate To | | T |
ANTIBIOTIC SENSITIVITY | Resistant To | | T |
# Antibiotic Susceptibility Testing (Isolate) | MIC | Bacterial isolate
AST | Organism | | T |
AST | Sensitive To | | T |
AST | Intermediate To | | T |
AST | Resistant To | | T |
= Minimum Inhibitory Concentration (MIC / E-test) | µg/mL | N | 2 | MIC | Bacterial isolate
= ESBL / Carbapenemase (CRE) Screening ;; VRE Screening (Rectal Swab) ;; Candida auris Screening | | T | | MIC | Swab / isolate
= India Ink Preparation (Cryptococcus) ;; Wet Mount (Saline) for Trichomonas / Yeast ;; Dark-field Microscopy (Treponema) ;; Albert Stain (Diphtheria) ;; Lactophenol Cotton Blue Mount | | T | | MIC | Smear / body fluid
# Xpert MTB/RIF (CBNAAT) | MIC | Sputum / body fluid / tissue
CBNAAT | MTB Detection | | T |
CBNAAT | Semi-quantitative Load | | T |
CBNAAT | Rifampicin Resistance | | T |
# Line Probe Assay (First & Second Line TB Drugs) | MIC | Sputum / culture isolate
LINE PROBE ASSAY | Rifampicin (rpoB) | | T |
LINE PROBE ASSAY | Isoniazid High-level (katG) | | T |
LINE PROBE ASSAY | Isoniazid Low-level (inhA) | | T |
LINE PROBE ASSAY | Fluoroquinolones (gyrA / gyrB) | | T |
LINE PROBE ASSAY | Aminoglycosides / Capreomycin (rrs / eis) | | T |
 | Interpretation | | T |
# Slit Skin Smear for AFB (Leprosy) | MIC | Slit skin smear
SLIT SKIN SMEAR | Bacteriological Index (BI) | | A | 1
SLIT SKIN SMEAR | Morphological Index (MI) | % | A | 0
 | Impression | | T |
# Water Bacteriological Analysis (Potability) | MIC | Water (sterile bottle)
WATER ANALYSIS | Total Coliform Count (MPN) | MPN/100 mL | A | 0
WATER ANALYSIS | Faecal Coliform / E. coli (MPN) | MPN/100 mL | A | 0
WATER ANALYSIS | Total Viable Count (22 °C) | CFU/mL | A | 0
 | Interpretation | | T |
# OT / Environmental Surveillance Culture | MIC | Swab / settle plate
SURVEILLANCE | Culture Result | | T |
SURVEILLANCE | Organism Isolated | | T |
SURVEILLANCE | Colony Count | CFU | A | 0
-- ---- MOLECULAR / PCR ----
= Dengue Virus RNA PCR ;; Zika Virus RNA PCR ;; Mpox (Monkeypox) PCR ;; Malaria PCR (Species Identification) ;; Herpes Simplex Virus (HSV 1 / 2) PCR ;; Varicella Zoster Virus PCR ;; Chlamydia trachomatis PCR ;; Neisseria gonorrhoeae PCR ;; Mycoplasma genitalium PCR ;; Trichomonas vaginalis PCR ;; Mycobacterium tuberculosis PCR ;; Toxoplasma gondii PCR ;; Leishmania PCR | | T | | MOL | Blood (EDTA) / swab / fluid
= HIV-1 DNA PCR (Early Infant Diagnosis) ;; HCV Genotyping ;; HBV Genotyping ;; HBV Drug Resistance Mutations ;; HIV Drug Resistance (Genotypic) | | T | | MOL | Blood (EDTA) / plasma / dried blood spot
= Stool Multiplex GI Pathogen PCR Panel | | T | | MOL | Stool
= Cystic Fibrosis (CFTR) Mutation Analysis ;; Duchenne / Becker Muscular Dystrophy (MLPA) ;; Huntington Disease (CAG Repeat) ;; Chromosomal Microarray (CMA) ;; Whole Exome Sequencing ;; Pharmacogenomics (CYP2C19 / CYP2D6) ;; HLA-B*5701 Typing ;; HBB Sickle Cell Mutation Analysis ;; MSI (Microsatellite Instability) Testing ;; ALK Rearrangement ;; ROS1 Rearrangement | | T | | MOL | Blood (EDTA) / FFPE tissue
# SARS-CoV-2 RT-PCR | MOL | Nasopharyngeal + oropharyngeal swab (VTM)
SARS-COV-2 | SARS-CoV-2 RNA | | T |
SARS-COV-2 | E Gene Ct Value | | A | 1
SARS-COV-2 | RdRp / ORF1ab Ct Value | | A | 1
SARS-COV-2 | N Gene Ct Value | | A | 1
 | Interpretation | | T |
# Influenza A / B / H1N1 PCR | MOL | Nasopharyngeal swab (VTM)
INFLUENZA | Influenza A | | T |
INFLUENZA | Influenza A H1N1 (pdm09) | | T |
INFLUENZA | Influenza A H3N2 | | T |
INFLUENZA | Influenza B | | T |
# Respiratory Viral Panel (Multiplex PCR) | MOL | Nasopharyngeal swab (VTM)
RESPIRATORY PANEL | Influenza A | | T |
RESPIRATORY PANEL | Influenza B | | T |
RESPIRATORY PANEL | Respiratory Syncytial Virus (RSV) | | T |
RESPIRATORY PANEL | Adenovirus | | T |
RESPIRATORY PANEL | Rhinovirus / Enterovirus | | T |
RESPIRATORY PANEL | Human Metapneumovirus | | T |
RESPIRATORY PANEL | Parainfluenza Virus | | T |
RESPIRATORY PANEL | SARS-CoV-2 | | T |
# HPV DNA Test (High-risk Genotyping) | MOL | Cervical sample (LBC medium)
HPV | HPV 16 | | T |
HPV | HPV 18 | | T |
HPV | Other High-risk HPV (31, 33, 35, 39, 45, 51, 52, 56, 58, 59, 66, 68) | | T |
 | Interpretation | | T |
# CMV DNA PCR (Quantitative) ;; EBV DNA PCR (Quantitative) ;; BK Virus DNA PCR (Quantitative) ;; Adenovirus DNA PCR (Quantitative) | MOL | Plasma / whole blood (EDTA)
VIRAL LOAD | Viral Load | copies/mL | A | 0
VIRAL LOAD | Log10 Viral Load | log10 copies/mL | A | 2
# EGFR Mutation Analysis | MOL | FFPE tissue / plasma
EGFR | Exon 18 | | T |
EGFR | Exon 19 Deletion | | T |
EGFR | Exon 20 (incl. T790M / Insertions) | | T |
EGFR | Exon 21 (L858R) | | T |
 | Interpretation | | T |
# KRAS / NRAS / BRAF Mutation Panel | MOL | FFPE tissue
RAS / RAF | KRAS (Exons 2, 3, 4) | | T |
RAS / RAF | NRAS (Exons 2, 3, 4) | | T |
RAS / RAF | BRAF V600E | | T |
 | Interpretation | | T |
# PML-RARA Transcript (t(15;17)) | MOL | Blood / marrow (EDTA)
MOLECULAR | PML-RARA Transcript | | T |
MOLECULAR | PML-RARA / ABL1 Ratio | % | A | 4
 | Interpretation | | T |
# FLT3 and NPM1 Mutation Analysis | MOL | Blood / marrow (EDTA)
MOLECULAR | FLT3-ITD | | T |
MOLECULAR | FLT3-TKD (D835) | | T |
MOLECULAR | NPM1 Mutation | | T |
 | Interpretation | | T |
# MTHFR Mutation Analysis | MOL | Blood (EDTA)
MOLECULAR | MTHFR C677T | | T |
MOLECULAR | MTHFR A1298C | | T |
 | Interpretation | | T |
# Y Chromosome Microdeletion (AZF) | MOL | Blood (EDTA)
MOLECULAR | AZFa | | T |
MOLECULAR | AZFb | | T |
MOLECULAR | AZFc | | T |
 | Interpretation | | T |
# Prenatal Karyotype (Amniotic Fluid / CVS) | MOL | Amniotic fluid / chorionic villi
KARYOTYPE | Cells Counted | cells | N | 0
KARYOTYPE | Banding Resolution | | T |
KARYOTYPE | Karyotype | | T |
 | Interpretation | | T |
# FISH Analysis | MOL | Blood / marrow / FFPE tissue
FISH | Probe(s) Used | | T |
FISH | Cells Scored | cells | N | 0
FISH | Abnormal Cells | % | A | 1
FISH | Result | | T |
 | Interpretation | | T |
# DNA Paternity / Relationship Testing | MOL | Blood (EDTA) / buccal swab
PATERNITY | STR Loci Tested | | T |
PATERNITY | Combined Paternity Index | | A | 2
PATERNITY | Probability of Paternity | % | A | 4
 | Conclusion | | T |
-- ---- PROFILES / PANELS ----
# Bone Profile | PRO | Serum
BONE PROFILE | Total Calcium | mg/dL | N | 1
BONE PROFILE | Phosphorus | mg/dL | N | 1
BONE PROFILE | Alkaline Phosphatase (ALP) | U/L | N | 0
BONE PROFILE | Albumin | g/dL | N | 1
BONE PROFILE | Magnesium | mg/dL | N | 2
BONE PROFILE | 25-OH Vitamin D | ng/mL | N | 1
BONE PROFILE | Parathyroid Hormone (PTH) | pg/mL | N | 1
# PCOS / PCOD Profile | PRO | Serum + plasma (fluoride)
HORMONES | FSH | mIU/mL | N | 2
HORMONES | LH | mIU/mL | N | 2
HORMONES | LH / FSH Ratio | | N | 2
HORMONES | Prolactin | ng/mL | N | 1
HORMONES | TSH | µIU/mL | N | 2
HORMONES | Total Testosterone | ng/dL | N | 1
HORMONES | DHEA-S | µg/dL | N | 1
HORMONES | 17-OH Progesterone | ng/mL | N | 2
HORMONES | Anti-Müllerian Hormone (AMH) | ng/mL | N | 2
METABOLIC | Fasting Glucose | mg/dL | N | 0
METABOLIC | Fasting Insulin | µIU/mL | N | 2
METABOLIC | HOMA-IR | | N | 2
# Female Infertility Profile | PRO | Serum
HORMONES | FSH | mIU/mL | N | 2
HORMONES | LH | mIU/mL | N | 2
HORMONES | Estradiol (E2) | pg/mL | N | 1
HORMONES | Progesterone | ng/mL | N | 2
HORMONES | Prolactin | ng/mL | N | 1
HORMONES | TSH | µIU/mL | N | 2
HORMONES | Anti-Müllerian Hormone (AMH) | ng/mL | N | 2
HORMONES | Total Testosterone | ng/dL | N | 1
# Male Infertility Profile | PRO | Serum
HORMONES | FSH | mIU/mL | N | 2
HORMONES | LH | mIU/mL | N | 2
HORMONES | Total Testosterone | ng/dL | N | 1
HORMONES | Prolactin | ng/mL | N | 1
HORMONES | TSH | µIU/mL | N | 2
# Pre-marital Profile | PRO | Blood / serum
PRE-MARITAL | Blood Group (ABO) | | T |
PRE-MARITAL | Rh (D) Type | | T |
PRE-MARITAL | Haemoglobin | g/dL | N | 1
PRE-MARITAL | Thalassaemia Carrier Screen (HbA2 / HPLC) | | T |
PRE-MARITAL | HBsAg | | T |
PRE-MARITAL | Anti-HCV | | T |
PRE-MARITAL | HIV 1 & 2 | | T |
PRE-MARITAL | VDRL / RPR | | T |
PRE-MARITAL | Rubella IgG (female) | IU/mL | A | 1
# Full Body Health Checkup | PRO | Blood + urine
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
URINE | Urine Protein | | T |
URINE | Urine Sugar | | T |
URINE | Urine Pus Cells | /HPF | T |
# Cardiac Marker Profile | PRO | Serum
CARDIAC MARKERS | Troponin I | ng/mL | N | 3
CARDIAC MARKERS | CK-MB | ng/mL | N | 2
CARDIAC MARKERS | CPK (Total) | U/L | N | 0
CARDIAC MARKERS | Myoglobin | ng/mL | N | 1
CARDIAC MARKERS | LDH | U/L | N | 0
# Pancreatic Profile | PRO | Serum
PANCREATIC | Serum Amylase | U/L | N | 0
PANCREATIC | Serum Lipase | U/L | N | 0
PANCREATIC | Fasting Glucose | mg/dL | N | 0
PANCREATIC | Calcium | mg/dL | N | 1
PANCREATIC | Triglycerides | mg/dL | N | 0
# Hepatitis Profile (A, B, C, E) | PRO | Serum
HEPATITIS | Hepatitis A IgM | | T |
HEPATITIS | HBsAg | | T |
HEPATITIS | Anti-HBs | mIU/mL | A | 1
HEPATITIS | HBeAg | | T |
HEPATITIS | Anti-HBe | | T |
HEPATITIS | Total Anti-HBc | | T |
HEPATITIS | Anti-HCV | | T |
HEPATITIS | Hepatitis E IgM | | T |
# Vitamin Profile | PRO | Serum
VITAMINS | 25-OH Vitamin D | ng/mL | N | 1
VITAMINS | Vitamin B12 | pg/mL | N | 0
VITAMINS | Folate | ng/mL | N | 1
# STI / Sexual Health Profile | PRO | Serum + swab
STI SCREEN | HIV 1 & 2 | | T |
STI SCREEN | HBsAg | | T |
STI SCREEN | Anti-HCV | | T |
STI SCREEN | VDRL / RPR | | T |
STI SCREEN | TPHA | | T |
STI SCREEN | Chlamydia trachomatis | | T |
STI SCREEN | Neisseria gonorrhoeae | | T |
STI SCREEN | HSV 2 IgG | | T |
# Dengue Profile | PRO | Serum + whole blood (EDTA)
DENGUE | Dengue NS1 Antigen | | T |
DENGUE | Dengue IgM | | T |
DENGUE | Dengue IgG | | T |
BLOOD COUNT | Haemoglobin | g/dL | N | 1
BLOOD COUNT | PCV / Haematocrit | % | N | 1
BLOOD COUNT | Total WBC Count | /cumm | N | 0
BLOOD COUNT | Platelet Count | /cumm | N | 0
# Thrombophilia Screening Profile | PRO | Citrated plasma + serum
THROMBOPHILIA | Protein C Activity | % | N | 0
THROMBOPHILIA | Protein S Activity | % | N | 0
THROMBOPHILIA | Antithrombin III | % | N | 0
THROMBOPHILIA | Activated Protein C Resistance (APCR) | | T |
THROMBOPHILIA | Lupus Anticoagulant | | T |
THROMBOPHILIA | Anti-cardiolipin IgG | GPL U/mL | A | 1
THROMBOPHILIA | Anti-cardiolipin IgM | MPL U/mL | A | 1
THROMBOPHILIA | Homocysteine | µmol/L | N | 1
-- ---- TOXICOLOGY / DRUG LEVELS ----
= Methanol Level ;; Ethylene Glycol Level | mg/dL | N | 1 | TOX | Serum / plasma
= Cadmium (blood) ;; Aluminium (blood) | µg/L | N | 1 | TOX | Whole blood (trace-element tube)
= Levetiracetam Level ;; Lamotrigine Level ;; Topiramate Level ;; Tobramycin Level ;; Voriconazole Level ;; Mycophenolic Acid Level | µg/mL | N | 1 | TOX | Serum / plasma
= Sirolimus Level ;; Everolimus Level | ng/mL | N | 1 | TOX | Whole blood (EDTA)
-- ---- BLOOD BANK ----
= Weak D (Du) Test ;; Bombay Blood Group (Oh) Screening ;; Reverse Grouping (Serum Typing) | | T | | BLO | Whole blood (EDTA) / serum
= Anti-D Antibody Titre ;; Anti-A / Anti-B Isoimmune Titre | titre | T | | BLO | Serum
# Neonatal Blood Group and Coombs (Cord Blood) | BLO | Cord blood (EDTA)
NEONATAL | ABO Group | | T |
NEONATAL | Rh (D) Type | | T |
NEONATAL | Direct Coombs (DAT) | | T |
# Transfusion Reaction Investigation | BLO | Post-transfusion blood + donor bag segment
TRANSFUSION REACTION | Patient ABO / Rh (Pre-transfusion) | | T |
TRANSFUSION REACTION | Patient ABO / Rh (Post-transfusion) | | T |
TRANSFUSION REACTION | Donor Unit ABO / Rh | | T |
TRANSFUSION REACTION | Clerical Check | | T |
TRANSFUSION REACTION | Visual Haemolysis (Plasma) | | T |
TRANSFUSION REACTION | Direct Coombs (DAT) | | T |
TRANSFUSION REACTION | Repeat Crossmatch | | T |
 | Interpretation | | T |
# Blood Donor Screening (TTI Panel) | BLO | Donor blood
TTI SCREEN | HIV 1 & 2 | | T |
TTI SCREEN | HBsAg | | T |
TTI SCREEN | Anti-HCV | | T |
TTI SCREEN | Syphilis (VDRL / RPR) | | T |
TTI SCREEN | Malaria Antigen | | T |
-- ---- PREGNANCY SCREENING ----
# Double Marker Screen (First Trimester) | PRE | Maternal serum
MATERNAL SERUM | Gestational Age | weeks | N | 1
MATERNAL SERUM | Free Beta-hCG | ng/mL | N | 2
MATERNAL SERUM | Free Beta-hCG (MoM) | MoM | N | 2
MATERNAL SERUM | PAPP-A | mIU/L | N | 2
MATERNAL SERUM | PAPP-A (MoM) | MoM | N | 2
RISK ASSESSMENT | Risk for Down Syndrome (Trisomy 21) | | T |
RISK ASSESSMENT | Risk for Edwards Syndrome (Trisomy 18) | | T |
# sFlt-1 / PlGF Ratio (Pre-eclampsia) | PRE | Serum
PRE-ECLAMPSIA | sFlt-1 | pg/mL | N | 0
PRE-ECLAMPSIA | PlGF | pg/mL | N | 0
PRE-ECLAMPSIA | sFlt-1 / PlGF Ratio | | N | 1
 | Interpretation | | T |
-- ---- URINE ----
# Urine Electrolytes (Spot) | URI | Urine (spot)
URINE ELECTROLYTES | Sodium (Na) | mEq/L | N | 0
URINE ELECTROLYTES | Potassium (K) | mEq/L | N | 1
URINE ELECTROLYTES | Chloride (Cl) | mEq/L | N | 0
= Urine Creatinine (Spot) ;; Urine Urea (Spot) ;; Urine Uric Acid (Spot) ;; Urine Calcium (Spot) ;; Urine Phosphorus (Spot) ;; Urine Magnesium (Spot) | mg/dL | N | 1 | URI | Urine (spot)
= Urine Calcium / Creatinine Ratio | mg/mg | N | 2 | URI | Urine (spot)
= Urine Glucose (Quantitative) ;; Urine Protein (Quantitative, Spot) ;; Urine Albumin (Quantitative) | mg/dL | N | 1 | URI | Urine (spot)
= Urine Amylase | U/L | N | 0 | URI | Urine (spot)
= Urine Beta-2 Microglobulin | mg/L | N | 2 | URI | Urine (spot)
= Urine Iodine (Spot) | µg/L | N | 0 | URI | Urine (spot)
= Urine Lead ;; Urine Arsenic ;; Urine Mercury ;; Urine Cadmium | µg/L | N | 1 | URI | Urine (spot / 24-hour, metal-free container)
= Urine Dysmorphic RBC (Phase Contrast) | % | N | 0 | URI | Urine (fresh, early morning)
= 24 Hour Urine Oxalate ;; 24 Hour Urine Citrate ;; 24 Hour Urine Cystine ;; 24 Hour Urine Magnesium ;; 24 Hour Urine Urea ;; 24 Hour Urine VMA ;; 24 Hour Urine 5-HIAA ;; 24 Hour Urine 17-Ketosteroids ;; 24 Hour Urine Microalbumin | mg/24 hr | N | 1 | URI | Urine (24-hour collection)
= 24 Hour Urine Copper ;; 24 Hour Urine Cortisol (Urinary Free Cortisol) ;; 24 Hour Urine Metanephrines ;; 24 Hour Urine Catecholamines | µg/24 hr | N | 1 | URI | Urine (24-hour collection)
= Urine Porphobilinogen (PBG) ;; Urine Hemosiderin ;; Urine Myoglobin ;; Urine Eosinophils ;; Urine Chyle (Chyluria) Test ;; Urine Melanin ;; Urine Homogentisic Acid ;; Urine Cystine (Cyanide-Nitroprusside) ;; Urine Ferric Chloride Test ;; Urine Metabolic Screen (Aminoaciduria) ;; Urine Immunofixation Electrophoresis ;; Urine Cotinine (Nicotine Screen) | | T | | URI | Urine (fresh)
# Urine Protein Electrophoresis (UPEP) | URI | Urine (24-hour or spot, concentrated)
URINE PROTEIN FRACTIONS | Albumin | % | N | 1
URINE PROTEIN FRACTIONS | Alpha-1 Globulin | % | N | 1
URINE PROTEIN FRACTIONS | Alpha-2 Globulin | % | N | 1
URINE PROTEIN FRACTIONS | Beta Globulin | % | N | 1
URINE PROTEIN FRACTIONS | Gamma Globulin | % | N | 1
URINE PROTEIN FRACTIONS | M-Band (Paraprotein) | | T |
 | Impression | | T |
# Urine Drug of Abuse Screen (10 Panel) | URI | Urine (fresh)
DRUG SCREEN | Amphetamines | | T |
DRUG SCREEN | Barbiturates | | T |
DRUG SCREEN | Benzodiazepines | | T |
DRUG SCREEN | Cocaine | | T |
DRUG SCREEN | Methamphetamine | | T |
DRUG SCREEN | Methadone | | T |
DRUG SCREEN | Opiates (Morphine) | | T |
DRUG SCREEN | Tricyclic Antidepressants | | T |
DRUG SCREEN | Cannabinoids (THC) | | T |
DRUG SCREEN | Buprenorphine | | T |
-- ---- STOOL ----
= Stool Giardia Antigen ;; Stool Entamoeba histolytica Antigen ;; Stool Norovirus Antigen ;; Stool Adenovirus Antigen ;; Stool Immunochemical Test (FIT) ;; Stool for Leucocytes ;; Stool Strongyloides (Agar Plate Culture) | | T | | STO | Stool (fresh)
= Stool Fat (72 hr Quantitative) | g/24 hr | N | 1 | STO | Stool (72-hour collection)
-- ---- SEMEN ----
= Sperm DNA Fragmentation Index (DFI) | % | N | 1 | SEM | Semen
= Hypo-osmotic Swelling (HOS) Test ;; Sperm Morphology (Strict / Kruger) | % | N | 0 | SEM | Semen
= Sperm Count (Concentration Only) | million/mL | N | 1 | SEM | Semen
= Semen Peroxidase (Endtz) Test | million/mL | N | 2 | SEM | Semen
-- ---- BODY FLUIDS ----
# Amniotic Fluid Analysis | BOD | Amniotic fluid
AMNIOTIC FLUID | Colour | | T |
AMNIOTIC FLUID | Appearance | | T |
AMNIOTIC FLUID | Bilirubin (Delta OD 450) | | N | 3
AMNIOTIC FLUID | Lecithin / Sphingomyelin (L/S) Ratio | | N | 1
 | Interpretation | | T |
# Bronchoalveolar Lavage (BAL) Fluid Analysis | BOD | BAL fluid
BAL FLUID | Volume Instilled | mL | N | 0
BAL FLUID | Volume Recovered | mL | N | 0
BAL FLUID | Total Cell Count | /cumm | N | 0
BAL FLUID | Macrophages | % | N | 0
BAL FLUID | Lymphocytes | % | N | 0
BAL FLUID | Neutrophils | % | N | 0
BAL FLUID | Eosinophils | % | N | 0
 | Impression | | T |
# Peritoneal Dialysis Fluid Analysis | BOD | Peritoneal dialysis effluent
PHYSICAL EXAMINATION | Colour | | T |
PHYSICAL EXAMINATION | Appearance | | T |
CELL COUNT | Total Cell Count | /cumm | N | 0
CELL COUNT | Neutrophils | % | N | 0
CELL COUNT | Lymphocytes | % | N | 0
# Serum-Ascites Albumin Gradient (SAAG) | BOD | Ascitic fluid + serum
SAAG | Serum Albumin | g/dL | N | 1
SAAG | Ascitic Fluid Albumin | g/dL | N | 1
SAAG | SAAG (calculated) | g/dL | N | 1 | b
 | Interpretation | | T |
# Pleural Fluid Light's Criteria | BOD | Pleural fluid + serum
LIGHT'S CRITERIA | Pleural Fluid Protein | g/dL | N | 1
LIGHT'S CRITERIA | Serum Protein | g/dL | N | 1
LIGHT'S CRITERIA | Pleural / Serum Protein Ratio | | N | 2
LIGHT'S CRITERIA | Pleural Fluid LDH | U/L | N | 0
LIGHT'S CRITERIA | Serum LDH | U/L | N | 0
LIGHT'S CRITERIA | Pleural / Serum LDH Ratio | | N | 2
 | Interpretation | | T |
= Pleural Fluid pH | | N | 2 | BOD | Pleural fluid (heparinised syringe)
= Pleural Fluid Triglycerides ;; Pleural Fluid Cholesterol | mg/dL | N | 0 | BOD | Pleural fluid
= Fluid Amylase | U/L | N | 0 | BOD | Body fluid
= Fluid Creatinine | mg/dL | N | 2 | BOD | Body fluid
= CSF Oligoclonal Bands | | T | | BOD | CSF + serum
= CSF IgG Index | | N | 2 | BOD | CSF + serum
= CSF Lactate | mmol/L | N | 1 | BOD | CSF
-- ---- CYTOLOGY ----
# Liquid Based Cytology (LBC) - Cervical | CYT | Cervical sample (LBC vial)
LBC | Specimen Adequacy | | T |
LBC | General Categorisation | | T |
LBC | Microscopic Findings | | T |
LBC | Interpretation (Bethesda) | | T |
 | Recommendation | | T |
# Thyroid FNAC (Bethesda System) | CYT | Fine needle aspirate
FNAC | Site | | T |
FNAC | Nature of Aspirate | | T |
FNAC | Microscopic Findings | | T |
FNAC | Bethesda Category | | T |
 | Cytological Diagnosis | | T |
# Breast FNAC ;; Lymph Node FNAC ;; Salivary Gland FNAC ;; Soft Tissue / Skin Swelling FNAC ;; Ultrasound-guided FNAC ;; CT-guided FNAC | CYT | Fine needle aspirate
FNAC | Site | | T |
FNAC | Nature of Aspirate | | T |
FNAC | Microscopic Findings | | T |
 | Cytological Diagnosis | | T |
# Bronchial Wash Cytology ;; BAL Cytology ;; CSF Cytology ;; Nipple Discharge Cytology ;; Brush Cytology ;; Imprint / Impression Smear Cytology ;; Tzanck Smear | CYT | Fluid / smear
CYTOLOGY | Cellularity | | T |
CYTOLOGY | Microscopic Findings | | T |
 | Impression | | T |
= Buccal Smear for Barr Body (Sex Chromatin) | % | N | 0 | CYT | Buccal smear
-- ---- HISTOPATHOLOGY ----
# Frozen Section (Intra-operative Consultation) | HIS | Fresh tissue
FROZEN SECTION | Specimen / Site | | T |
FROZEN SECTION | Frozen Section Diagnosis | | T |
FROZEN SECTION | Margins | | T |
 | Remarks | | T |
# Mastectomy Specimen ;; Wide Local Excision Specimen ;; Colectomy / Colorectal Resection Specimen ;; Gastrectomy Specimen ;; Nephrectomy Specimen ;; Prostatectomy Specimen ;; Thyroidectomy Specimen ;; Hysterectomy with Salpingo-oophorectomy Specimen ;; Oral Cancer Resection Specimen | HIS | Tissue in 10% formalin
HISTOPATHOLOGY | Clinical History | | T |
HISTOPATHOLOGY | Gross Examination | | T |
HISTOPATHOLOGY | Microscopic Examination | | T |
SYNOPTIC REPORT | Tumour Type (Histologic) | | T |
SYNOPTIC REPORT | Histologic Grade | | T |
SYNOPTIC REPORT | Tumour Size | cm | A | 1
SYNOPTIC REPORT | Lymphovascular Invasion | | T |
SYNOPTIC REPORT | Perineural Invasion | | T |
SYNOPTIC REPORT | Surgical Margins | | T |
SYNOPTIC REPORT | Lymph Nodes (Involved / Total) | | T |
SYNOPTIC REPORT | pTNM Stage | | T |
 | Impression / Diagnosis | | T |
# Endoscopic Biopsy - Stomach ;; Endoscopic Biopsy - Colon / Rectum ;; Endoscopic Biopsy - Oesophagus ;; Duodenal Biopsy (Coeliac) ;; Liver Biopsy ;; Lymph Node Biopsy ;; Skin Biopsy ;; Endometrial Biopsy ;; Cervical Biopsy / Cone Biopsy ;; Breast Core Biopsy ;; Thyroid Biopsy ;; Bone Biopsy ;; Muscle Biopsy ;; Nerve Biopsy ;; Appendicectomy Specimen ;; Cholecystectomy Specimen ;; Hernial Sac Specimen ;; Tonsil / Adenoid Specimen ;; Fibroid Uterus Specimen ;; Ovarian Cyst Specimen ;; Products of Conception (POC) ;; Placenta Histopathology ;; Circumcision (Foreskin) Specimen ;; Haemorrhoid / Fistula Specimen ;; Nasal Polyp Specimen | HIS | Tissue in 10% formalin
HISTOPATHOLOGY | Clinical History | | T |
HISTOPATHOLOGY | Gross Examination | | T |
HISTOPATHOLOGY | Microscopic Examination | | T |
 | Impression / Diagnosis | | T |
# Prostate Needle Biopsy (Gleason Score) | HIS | Tissue in 10% formalin
HISTOPATHOLOGY | Clinical History | | T |
HISTOPATHOLOGY | Gross Examination | | T |
HISTOPATHOLOGY | Microscopic Examination | | T |
GLEASON GRADING | Gleason Pattern (Primary + Secondary) | | T |
GLEASON GRADING | Gleason Score | | T |
GLEASON GRADING | Grade Group | | T |
GLEASON GRADING | Cores Involved (Positive / Total) | | T |
GLEASON GRADING | Perineural Invasion | | T |
 | Impression / Diagnosis | | T |
# Renal Biopsy (Light Microscopy and IF) | HIS | Renal tissue (formalin + IF medium)
RENAL BIOPSY | Clinical History | | T |
RENAL BIOPSY | Glomeruli (Total / Sclerosed) | | T |
RENAL BIOPSY | Light Microscopy | | T |
RENAL BIOPSY | Immunofluorescence | | T |
 | Impression / Diagnosis | | T |
# Skin Biopsy with Direct Immunofluorescence (DIF) | HIS | Skin (formalin + IF medium)
SKIN BIOPSY | Histology | | T |
SKIN BIOPSY | DIF: IgG | | T |
SKIN BIOPSY | DIF: IgA | | T |
SKIN BIOPSY | DIF: IgM | | T |
SKIN BIOPSY | DIF: C3 | | T |
SKIN BIOPSY | DIF: Fibrinogen | | T |
 | Impression / Diagnosis | | T |
# Immunohistochemistry (IHC) - Breast Panel (ER / PR / HER2 / Ki-67) | HIS | FFPE tissue block
IHC BREAST | ER Status | | T |
IHC BREAST | ER Positive Nuclei | % | A | 0
IHC BREAST | PR Status | | T |
IHC BREAST | PR Positive Nuclei | % | A | 0
IHC BREAST | HER2 IHC Score (0 / 1+ / 2+ / 3+) | | T |
IHC BREAST | Ki-67 Proliferation Index | % | A | 0
 | Impression | | T |
# IHC - Single Marker ;; IHC - Lymphoma Panel ;; IHC - Carcinoma Panel ;; IHC - Sarcoma / Soft Tissue Panel ;; IHC - Prostate Panel | HIS | FFPE tissue block
IHC | Markers Tested | | T |
IHC | Positive Markers | | T |
IHC | Negative Markers | | T |
 | Interpretation | | T |
# Special Stain Study (PAS / Masson / Reticulin / Congo Red / Perls / GMS) | HIS | Tissue section
SPECIAL STAIN | Stain(s) Applied | | T |
SPECIAL STAIN | Result | | T |
 | Interpretation | | T |
$b$, E'\r?\n') WITH ORDINALITY AS l(line, ord)
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
    FROM tmp27_fmt
    WHERE rtype IS NULL OR pname IS NULL OR pname = ''
       OR length(pname) > 180 OR length(coalesce(unit, '')) > 40 OR length(section) > 100;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '027: bad parameter line(s) in: %', bad;
    END IF;

    SELECT string_agg(DISTINCT d.test_name, '; ') INTO bad
    FROM (SELECT test_name, seq FROM tmp27_fmt GROUP BY test_name, seq HAVING count(*) > 1) d;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '027: test defined twice in the data block: %', bad;
    END IF;

    SELECT string_agg(DISTINCT f.dept, ', ') INTO bad
    FROM tmp27_fmt f
    WHERE f.dept IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tmp27_dept d WHERE d.code = f.dept);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '027: unknown department code(s): %', bad;
    END IF;

    RAISE NOTICE '027: data block OK - % tests, % parameter lines',
        (SELECT count(DISTINCT test_name) FROM tmp27_fmt), (SELECT count(*) FROM tmp27_fmt);
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

        RAISE NOTICE 'Applying 027 to schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);

        -- 2a. departments (Urine / Stool / Semen / Body Fluids / Cytology / Histopathology ...)
        EXECUTE $q$
            INSERT INTO departments (name)
            SELECT w.dname
            FROM tmp27_dept w
            WHERE w.code IN (SELECT DISTINCT f.dept FROM tmp27_fmt f WHERE f.dept IS NOT NULL)
              AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.name ILIKE w.pat)
            ON CONFLICT (name) DO NOTHING$q$;
        GET DIAGNOSTICS n_dept = ROW_COUNT;

        -- 2b. new tests (skipped when the lab already has a test with that name)
        EXECUTE $q$
            INSERT INTO tests (department_id, name, price, status)
            SELECT d.id, f.test_name, 0, 'Active'::record_status
            FROM (SELECT DISTINCT test_name, dept FROM tmp27_fmt WHERE dept IS NOT NULL) f
            JOIN tmp27_dept w ON w.code = f.dept
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
                FROM tmp27_fmt f
                JOIN tests t ON lower(t.name) = lower(f.test_name)
                WHERE f.specimen IS NOT NULL
                ORDER BY t.id
                ON CONFLICT (test_id) DO NOTHING$q$;
            GET DIAGNOSTICS n_spec = ROW_COUNT;
        END IF;

        -- 2d. which tests may be filled: no parameters yet, or only the untouched 020 starter
        EXECUTE $q$DROP TABLE IF EXISTS tmp27_tgt$q$;
        EXECUTE $q$CREATE TEMP TABLE tmp27_tgt (
                       test_id UUID PRIMARY KEY, test_name TEXT NOT NULL, starter_id UUID)$q$;
        EXECUTE $q$
            INSERT INTO tmp27_tgt (test_id, test_name, starter_id)
            SELECT t.id, t.name,
                   (SELECT p.id FROM test_parameters p WHERE p.test_id = t.id
                    ORDER BY p.sort_order LIMIT 1)
            FROM tests t
            WHERE t.name IN (SELECT DISTINCT f.test_name FROM tmp27_fmt f)
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
              FROM tmp27_tgt g
              JOIN tmp27_fmt f ON f.test_name = g.test_name AND f.seq = 1
             WHERE p.id = g.starter_id$q$;
        GET DIAGNOSTICS n_upd = ROW_COUNT;

        -- 2f. all other parameters (every parameter when the test had none)
        EXECUTE $q$
            INSERT INTO test_parameters
                (test_id, section_name, name, unit, result_type, decimal_places, sort_order, is_bold)
            SELECT g.test_id, f.section, left(f.pname, 180), f.unit, f.rtype, f.dp, f.seq * 10, f.bold
            FROM tmp27_tgt g
            JOIN tmp27_fmt f ON f.test_name = g.test_name
            WHERE g.starter_id IS NULL OR f.seq > 1$q$;
        GET DIAGNOSTICS n_ins = ROW_COUNT;

        RAISE NOTICE '  % : departments +%, tests +%, specimen defaults +%, 1-line formats upgraded %, parameters added %',
                     s, n_dept, n_test, n_spec, n_upd, n_ins;
    END LOOP;

    PERFORM set_config('search_path', old_path, true);
END
$outer$;

DROP TABLE IF EXISTS tmp27_tgt;
DROP TABLE IF EXISTS tmp27_fmt;
DROP TABLE IF EXISTS tmp27_dept;

-- ======================================================================
-- QUICK CHECKS (run per lab schema, e.g. SET search_path TO lab_demo, public;)
--   -- tests that still have NO parameter / NO unit on a numeric parameter:
--   SELECT t.name FROM tests t WHERE NOT EXISTS (SELECT 1 FROM test_parameters p WHERE p.test_id = t.id);
--   SELECT t.name, p.name FROM test_parameters p JOIN tests t ON t.id = p.test_id
--    WHERE p.result_type = 'Numeric' AND p.unit IS NULL ORDER BY 1, 2;
--   -- departments and how many tests each has:
--   SELECT d.name, count(*) FROM tests t JOIN departments d ON d.id = t.department_id GROUP BY 1 ORDER BY 1;
-- ======================================================================
-- ======================================================================
-- 020_seed_sop_pack_catalog.sql
-- WHAT : Loads the 380-test "Medical Lab Reference Range & SOP Pack" into
--        every lab schema, so the tests show up on
--          * Departments & Tests page   (departments + tests)
--          * Test Formats page          (test_parameters + test_report_info)
--          * Upload Report page         (blood report entry form reads the format)
--        and keeps the pack's SOP / approval info in a NEW side table
--        `lab_test_catalog` (nothing existing is altered, EF Core entities
--        need NO change).
--
-- RUN ORDER : 014 -> 015 -> 018 -> 019 -> 017 -> 020 (this file)
--             (017 first, so its rich formats win over the 1-line formats here)
-- SAFE TO RE-RUN : yes. Existing departments / tests / formats are never
--             overwritten; a pack test is skipped when the lab already has a
--             test with the same (normalised) name or a known equivalent
--             name (e.g. "Fasting Plasma Glucose (FPG)" = "Blood Sugar Fasting (FBS)").
-- RUN IT : with the RUN button / "Execute script" (not Explain), in ONE session.
--
-- DESIGN NOTES
--  * Reference ranges are NOT invented. The pack itself says "do not use a
--    guessed range", so new tests get a 1-line format (name only, no unit,
--    no range) and result entry works immediately. Add real ranges from your
--    analyser insert in the Test Formats screen, then mark the catalog row
--    Approved (see the bottom of this file).
--  * Panels (CBC, CMP, BMP, Fever profile ...) get NO parameters on purpose:
--    the pack has no component list. Build them in Test Formats.
--  * All inserts are set-based (hash joins on a normalised-name key), so the
--    cost is O(tests + pack) per lab, not O(tests x pack).
--  * Price of every new test is 0 -> set real prices in Departments & Tests.
-- ======================================================================

-- ---------- 1. the pack, compact form (one block per department) ----------
-- line  =  Test name [| flags]     flags: P=panel, E=EDTA, C=citrated, H=heparinised,
--                                         B=culture bottle, K=serum (kit-specific)
DROP TABLE IF EXISTS tmp_pack;
CREATE TEMP TABLE tmp_pack AS
WITH raw AS (
    SELECT v.prefix, v.dept, v.rtype,
           btrim(split_part(l.line, '|', 1)) AS name,
           btrim(split_part(l.line, '|', 2)) AS tag
    FROM (VALUES
    ('HEM', 'Hematology', 'Auto', $pack_data$
Complete Blood Count (CBC)|PE
Complete Hemogram|PE
Hemoglobin (Hb)|E
Total Leukocyte Count (TLC)|E
Differential Leukocyte Count (DLC)|E
Red Blood Cell Count (RBC)
Hematocrit / Packed Cell Volume (PCV)
Mean Corpuscular Volume (MCV)
Mean Corpuscular Hemoglobin (MCH)|E
Mean Corpuscular Hemoglobin Concentration (MCHC)|E
Red Cell Distribution Width (RDW-CV)
Red Cell Distribution Width (RDW-SD)
Platelet Count|E
Mean Platelet Volume (MPV)|E
Peripheral Blood Smear (PBS)
Reticulocyte Count|E
Absolute Reticulocyte Count|E
Erythrocyte Sedimentation Rate (ESR)|E
Absolute Eosinophil Count (AEC)
Immature Platelet Fraction (IPF)|E
Nucleated RBC Count
Malaria Parasite Smear
Malarial Antigen Rapid Test|K
Sickle Cell Screening / Sickling Test
Osmotic Fragility Test
G6PD Enzyme Assay|E
Bone Marrow Aspiration Studies
Bone Marrow Biopsy Studies
Hb Electrophoresis|E
Hemoglobin HPLC|E
HbA2 Quantification
HbF Quantification
Eosinophil Count
LE Cell Test (legacy / limited use)
$pack_data$),
    ('COA', 'Coagulation', 'Auto', $pack_data$
Prothrombin Time (PT)|C
International Normalized Ratio (INR)|C
Activated Partial Thromboplastin Time (aPTT)|C
Thrombin Time (TT)
Fibrinogen
D-Dimer
Fibrin Degradation Products (FDP)
Anti-Xa Assay
Factor VIII Activity
Factor IX Activity
Factor V Activity
Factor VII Activity
Factor X Activity
Factor XI Activity
Factor XII Activity
von Willebrand Factor Antigen|K
von Willebrand Factor Activity
Lupus Anticoagulant
Protein C Activity
Protein S Activity
Antithrombin III
Coagulation Mixing Study
Thromboelastography (TEG)
ROTEM
$pack_data$),
    ('BIO', 'Biochemistry', 'Auto', $pack_data$
Fasting Plasma Glucose (FPG)
Random Blood Glucose (RBG)
Post-Prandial Blood Glucose (PPBG)
Oral Glucose Tolerance Test (OGTT)
HbA1c / Glycated Hemoglobin|E
Fructosamine
Insulin
C-Peptide
Proinsulin
HOMA-IR (calculated)
Blood Urea
Blood Urea Nitrogen (BUN)
Serum Creatinine
eGFR (calculated)
Uric Acid
Sodium (Na)
Potassium (K)
Chloride (Cl)
Bicarbonate / Total CO2
Total Calcium
Ionized Calcium
Phosphorus / Phosphate
Magnesium
Serum Osmolality
Cystatin C
Total Bilirubin
Direct Bilirubin
Indirect Bilirubin (calculated)
AST / SGOT
ALT / SGPT
Alkaline Phosphatase (ALP)
Gamma-Glutamyl Transferase (GGT)
Total Protein
Albumin
Globulin (calculated)
Albumin/Globulin Ratio
Lactate Dehydrogenase (LDH)
Ammonia
Serum Amylase
Serum Lipase
Cholinesterase
Ceruloplasmin
Alpha-1 Antitrypsin
Bile Acids
Serum Iron
Total Iron Binding Capacity (TIBC)
Transferrin
Transferrin Saturation
Ferritin
Total Cholesterol
HDL Cholesterol
LDL Cholesterol (direct / calculated)
Triglycerides
VLDL (calculated)
Non-HDL Cholesterol
Apolipoprotein A1
Apolipoprotein B
Lipoprotein(a) / Lp(a)
High-sensitivity CRP (hs-CRP)
Homocysteine
Lactate
Beta-hydroxybutyrate
C-reactive Protein (CRP)
Procalcitonin (PCT)
Prealbumin / Transthyretin
Zinc
Copper
Selenium
Lead (blood)
Mercury (blood)
Arsenic (blood)
$pack_data$),
    ('END', 'Endocrinology', 'Auto', $pack_data$
Thyroid Stimulating Hormone (TSH)
Free T4 (FT4)
Free T3 (FT3)
Total T4
Total T3
Anti-TPO Antibody|K
Anti-Thyroglobulin Antibody|K
TSH Receptor Antibody (TRAb)|K
Thyroglobulin
Parathyroid Hormone (PTH)
Calcitonin
Cortisol (morning)
Cortisol (evening)
ACTH
Aldosterone
Plasma Renin Activity
Direct Renin
Aldosterone-Renin Ratio
DHEA-S
Testosterone, Total
Testosterone, Free
Sex Hormone Binding Globulin (SHBG)
Estradiol (E2)
Progesterone
FSH
LH
Prolactin
Anti-Müllerian Hormone (AMH)
Growth Hormone
IGF-1
17-OH Progesterone
Beta-hCG, Quantitative
PAPP-A
Inhibin A
Inhibin B
$pack_data$),
    ('IMM', 'Immunoassay', 'Auto', $pack_data$
Vitamin B12
Folate / Folic Acid
25-OH Vitamin D
1,25-dihydroxy Vitamin D
Vitamin A
Vitamin E
Vitamin B1 (Thiamine)
Vitamin B6
Vitamin C
Osteocalcin
Bone-specific Alkaline Phosphatase
Beta-CTX / CTX
P1NP
Troponin I
High-sensitivity Troponin I
Troponin T
High-sensitivity Troponin T
CK-MB
BNP
NT-proBNP
Myoglobin
Prostate-Specific Antigen (PSA), Total|K
Free PSA
CEA
AFP
CA-125
CA 15-3
CA 19-9
CA 72-4
Chromogranin A
Neuron-Specific Enolase (NSE)
CYFRA 21-1
SCC Antigen|K
HE4
Serum Beta-hCG
Carboxyhemoglobin|E
Methemoglobin|E
$pack_data$),
    ('SER', 'Serology', 'Text', $pack_data$
HIV 1 & 2 Antigen/Antibody Screen|K
HIV Viral Load (RNA PCR)|K
HBsAg|K
Anti-HBs
Total Anti-HBc
IgM Anti-HBc
HBeAg
Anti-HBe
HBV DNA PCR / Viral Load
Anti-HCV Antibody|K
HCV RNA PCR / Viral Load
Hepatitis A IgM|K
Hepatitis E IgM|K
Dengue NS1 Antigen|K
Dengue IgM|K
Dengue IgG|K
Chikungunya IgM
Chikungunya PCR
ASO Titre
Rheumatoid Factor (RF)
Syphilis RPR|K
Syphilis VDRL|K
TPHA / TPPA
Rubella IgM|K
Rubella IgG|K
CMV IgM|K
CMV IgG|K
EBV VCA IgM|K
EBV VCA IgG|K
Toxoplasma IgM|K
Toxoplasma IgG|K
HSV 1 IgG
HSV 2 IgG
Parvovirus B19 IgM
Parvovirus B19 IgG
Brucella Serology
Leptospira IgM
Leptospira PCR
Scrub Typhus IgM
Rickettsial Serology
Quantiferon-TB Gold (IGRA)
SARS-CoV-2 Antibody|K
Widal Test (limited reliability)
Malarial Antigen Test|K
$pack_data$),
    ('MIC', 'Microbiology', 'Text', $pack_data$
Blood Culture|B
Blood Culture and Sensitivity|B
Blood Culture, Aerobic|B
Blood Culture, Anaerobic|B
Blood Culture, Pediatric|B
Blood Culture, Fungal|B
Blood Culture, Mycobacterial (specialized)|B
$pack_data$),
    ('AUT', 'Autoimmune / Immunology', 'Auto', $pack_data$
Antinuclear Antibody (ANA)|K
ANA by IFA
Anti-dsDNA
ENA Profile
Anti-Sm Antibody|K
Anti-RNP Antibody|K
Anti-SSA (Ro)
Anti-SSB (La)
Anti-Scl-70
Anti-centromere Antibody|K
Anti-Jo-1
ANCA (c-ANCA / p-ANCA)
MPO Antibody|K
PR3 Antibody|K
Complement C3
Complement C4
CH50
Anti-CCP
HLA-B27
Antiphospholipid Antibodies
Anti-cardiolipin IgG
Anti-cardiolipin IgM
Beta-2 Glycoprotein I IgG
Beta-2 Glycoprotein I IgM
Direct Coombs / DAT
Indirect Coombs / IAT
Immunoglobulin IgG
Immunoglobulin IgA
Immunoglobulin IgM
Immunoglobulin IgE
Serum Protein Electrophoresis (SPEP)|E
Immunofixation Electrophoresis|E
Free Kappa Light Chains
Free Lambda Light Chains
Cryoglobulins
Cold Agglutinin Titre
$pack_data$),
    ('BLO', 'Blood Bank', 'Text', $pack_data$
ABO Blood Group
Rh(D) Typing
Extended Red Cell Phenotyping
Antibody Screen|K
Crossmatch / Compatibility Testing
Antibody Identification Panel|K
Hemolysis Workup
HLA Typing (transplant use)
$pack_data$),
    ('TOX', 'Toxicology / Drug Monitoring', 'Auto', $pack_data$
Blood Alcohol (Ethanol)
Carboxyhemoglobin|E
Methemoglobin|E
Lithium Level
Valproic Acid Level
Carbamazepine Level
Phenytoin Level
Phenobarbital Level
Digoxin Level
Theophylline Level
Vancomycin Level
Gentamicin Level
Amikacin Level
Tacrolimus Level
Cyclosporine Level
Methotrexate Level
Paracetamol / Acetaminophen Level
Salicylate Level
$pack_data$),
    ('CRI', 'Critical Care', 'Auto', $pack_data$
Arterial Blood Gas (ABG)|H
Venous Blood Gas (VBG)|H
Co-oximetry
Anion Gap (calculated)
Ketones / Beta-hydroxybutyrate
Blood Lactate
Ionized Calcium
Serum Osmolality
$pack_data$),
    ('MOL', 'Molecular / Genetics', 'Text', $pack_data$
JAK2 V617F Mutation
BCR-ABL1 (CML Testing)|E
Factor V Leiden Mutation
Prothrombin G20210A Mutation
Alpha-thalassemia Molecular Testing|E
Beta-thalassemia Molecular Testing|E
BRCA1 Genetic Testing
BRCA2 Genetic Testing
SMA Carrier Testing
Inherited Thrombophilia Panel
Cell-free Fetal DNA / NIPT
Flow Cytometry (blood / marrow)
Immunophenotyping (blood / marrow)
HLA Typing for Transplant
$pack_data$),
    ('PRO', 'Profiles / Panels', 'Auto', $pack_data$
Complete Hemogram Profile|PE
Basic Metabolic Panel (BMP)|P
Comprehensive Metabolic Panel (CMP)|P
Liver Function Test (LFT)|P
Kidney / Renal Function Test (KFT / RFT)|P
Lipid Profile|P
Thyroid Profile (T3/T4/TSH)|P
Iron Profile|P
Diabetes Profile|P
Fever Profile|P
Pre-operative Profile|P
Antenatal / Pregnancy Profile|P
Cardiac Risk Profile|P
Arthritis / Rheumatology Profile|P
Viral Marker Profile|P
TORCH Profile|P
Anemia Profile|P
Electrolyte Profile|P
Sepsis Profile|P
Fertility Hormone Profile|P
Tumor Marker Profile|P
Drug Monitoring Profile|P
Allergy / Specific IgE Panel|P
Food-specific IgE Panel|P
$pack_data$),
    ('PRE', 'Pregnancy / Screening', 'Auto', $pack_data$
Triple Marker Screen (maternal serum)
Quadruple Marker Screen (maternal serum)
First-trimester Combined Screening (serum markers)
Maternal Serum AFP
Indirect Coombs / Antibody Screen in Pregnancy|K
$pack_data$),
    ('SPE', 'Specialized', 'Auto', $pack_data$
Reticulocyte Hemoglobin Content|E
Soluble Transferrin Receptor
Erythropoietin Level
Serum Free Light Chain Ratio
Beta-2 Microglobulin
Serum Viscosity
Porphyrins (blood)
Plasma Metanephrines
Normetanephrine
Catecholamines (plasma)
Chromosomal Karyotype (blood)
Fragile X Testing (blood-based sample)
Quantitative G6PD Activity|E
Anti-Müllerian Hormone (AMH), repeat alias
Cystatin C, repeat alias for renal profile
$pack_data$)
    ) AS v(prefix, dept, rtype, block)
    CROSS JOIN LATERAL regexp_split_to_table(v.block, E'\r?\n') AS l(line)
    WHERE btrim(l.line) <> ''
),
-- pack name -> the name 019 / 017 already use for the same test (so no duplicates)
same_as(pack_name, existing_name) AS (VALUES
    ('Complete Blood Count (CBC)',               'CBC (Complete Blood Count)'),
    ('Erythrocyte Sedimentation Rate (ESR)',     'ESR (Erythrocyte Sedimentation Rate)'),
    ('Peripheral Blood Smear (PBS)',             'Peripheral Blood Smear'),
    ('Fasting Plasma Glucose (FPG)',             'Blood Sugar Fasting (FBS)'),
    ('Post-Prandial Blood Glucose (PPBG)',       'Blood Sugar Post Prandial (PPBS)'),
    ('Random Blood Glucose (RBG)',               'Blood Sugar Random (RBS)'),
    ('HbA1c / Glycated Hemoglobin',              'HbA1c (Glycosylated Haemoglobin)'),
    ('Oral Glucose Tolerance Test (OGTT)',       'OGTT (Oral Glucose Tolerance Test)'),
    ('Liver Function Test (LFT)',                'LFT (Liver Function Test)'),
    ('Kidney / Renal Function Test (KFT / RFT)', 'KFT / RFT (Kidney Function Test)'),
    ('Thyroid Profile (T3/T4/TSH)',              'Thyroid Profile (T3, T4, TSH)'),
    ('C-reactive Protein (CRP)',                 'CRP (C-Reactive Protein)'),
    ('Widal Test (limited reliability)',         'Widal Test'),
    ('HBsAg',                                    'HBsAg (Hepatitis B)'),
    ('Anti-HCV Antibody',                        'Anti-HCV (Hepatitis C)'),
    ('HIV 1 & 2 Antigen/Antibody Screen',        'HIV I & II'),
    ('Syphilis VDRL',                            'VDRL / RPR (Syphilis)'),
    ('Malaria Parasite Smear',                   'Malaria Parasite (MP)'),
    ('LH',                                       'LH (Luteinizing Hormone)'),
    ('Beta-hCG, Quantitative',                   'Beta HCG'),
    ('25-OH Vitamin D',                          'Vitamin D (25-OH)'),
    ('Iron Profile',                             'Iron Studies'),
    ('Total Calcium',                            'Serum Calcium'),
    ('Phosphorus / Phosphate',                   'Serum Phosphorus'),
    ('Magnesium',                                'Serum Magnesium'),
    ('ABO Blood Group',                          'Blood Group (ABO & Rh)'),
    ('Testosterone, Total',                      'Testosterone')
),
syn(pack_name, synonyms) AS (VALUES
    ('Complete Blood Count (CBC)',               'CBC; Complete Hemogram'),
    ('Hemoglobin (Hb)',                          'Hb; HGB'),
    ('Prothrombin Time (PT)',                    'PT'),
    ('Fasting Plasma Glucose (FPG)',             'FBS; FPG'),
    ('Post-Prandial Blood Glucose (PPBG)',       'PPBS; PPBG'),
    ('HbA1c / Glycated Hemoglobin',              'HbA1c; A1C'),
    ('Thyroid Stimulating Hormone (TSH)',        'TSH'),
    ('HIV 1 & 2 Antigen/Antibody Screen',        'HIV 1/2 Ag/Ab; 4th generation screen'),
    ('Liver Function Test (LFT)',                'LFT; Liver Profile'),
    ('Kidney / Renal Function Test (KFT / RFT)', 'KFT; RFT; Renal Profile')
),
fast(pack_name, fasting) AS (VALUES
    ('Fasting Plasma Glucose (FPG)',             'Yes; follow lab protocol'),
    ('Post-Prandial Blood Glucose (PPBG)',       'Meal-timing specific; record collection time'),
    ('Lithium Level',                            'Dose/collection timing critical')
)
SELECT r.prefix, r.dept, r.rtype, r.name, r.tag,
       left(r.prefix || '-' || btrim(regexp_replace(upper(r.name), '[^A-Z0-9]+', '-', 'g'), '-'), 39) AS code,
       regexp_replace(replace(lower(r.name), 'haem', 'hem'), '[^a-z0-9]', '', 'g')                    AS name_key,
       regexp_replace(replace(lower(a.existing_name), 'haem', 'hem'), '[^a-z0-9]', '', 'g')           AS alt_key,
       regexp_replace(replace(lower(r.dept), 'haem', 'hem'), '[^a-z0-9]', '', 'g')                    AS dept_key,
       strpos(r.tag, 'P') > 0                                                                          AS is_panel,
       CASE WHEN strpos(r.tag,'E')>0 THEN 'EDTA whole blood'
            WHEN strpos(r.tag,'C')>0 THEN 'Citrated plasma'
            WHEN strpos(r.tag,'H')>0 THEN 'Heparinised whole blood'
            WHEN strpos(r.tag,'B')>0 THEN 'Blood (culture bottles)'
            ELSE 'Serum / plasma' END                                                                  AS specimen,
       CASE WHEN strpos(r.tag,'E')>0 THEN 'EDTA whole blood (verify test-specific requirements)'
            WHEN strpos(r.tag,'C')>0 THEN 'Citrated plasma'
            WHEN strpos(r.tag,'H')>0 THEN 'Heparinized arterial/venous whole blood'
            WHEN strpos(r.tag,'B')>0 THEN 'Blood in culture bottle(s)'
            WHEN strpos(r.tag,'K')>0 THEN 'Serum / plasma; confirm kit instructions'
            ELSE 'Serum / plasma or lab-approved specimen' END                                         AS specimen_requirement,
       CASE WHEN strpos(r.tag,'B')>0 THEN 'Blood culture; identification and susceptibility testing'
            WHEN strpos(r.tag,'H')>0 THEN 'Blood gas analyser'
            ELSE NULL END                                                                              AS method_text,
       s.synonyms, f.fasting
FROM raw r
LEFT JOIN same_as a ON a.pack_name = r.name
LEFT JOIN syn s     ON s.pack_name = r.name
LEFT JOIN fast f    ON f.pack_name = r.name;

CREATE UNIQUE INDEX ON tmp_pack (code);
CREATE INDEX ON tmp_pack (name_key);

-- guard against a broken copy/paste: the pack has exactly 380 tests
DO $$
DECLARE n INT;
BEGIN
    SELECT count(*) INTO n FROM tmp_pack;
    IF n <> 380 THEN
        RAISE EXCEPTION 'Expected 380 tests in the pack, found % - the data block was not pasted completely.', n;
    END IF;
END
$$;

-- ---------- 2. apply to EVERY lab schema that has a `tests` table ----------
DO $outer$
DECLARE
    s              TEXT;
    old_path       TEXT := current_setting('search_path');
    activate_new   BOOLEAN := true;   -- false = new tests are created Inactive (hidden from New Order / Test Formats)
    n_dept INT; n_test INT; n_cat INT; n_par INT; n_info INT;
BEGIN
    FOR s IN
        SELECT DISTINCT i.table_schema
        FROM information_schema.tables i
        WHERE i.table_name = 'tests'
          AND i.table_schema NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')
    LOOP
        IF to_regclass(format('%I.test_parameters', s)) IS NULL
           OR to_regclass(format('%I.test_report_info', s)) IS NULL THEN
            RAISE NOTICE 'SKIPPED schema % : run 014 and 015 first.', s;
            CONTINUE;
        END IF;

        RAISE NOTICE 'Loading SOP pack into schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);

        -- 2a. fix: formats seeded by 017 used result_type 'Number', but the app
        --     (validator + Test Formats screen) only knows Auto | Numeric | Text.
        EXECUTE $q$UPDATE test_parameters SET result_type = 'Numeric' WHERE result_type = 'Number'$q$;

        -- 2b. side table with the pack's SOP / approval info (one row per pack test)
        EXECUTE $q$
            CREATE TABLE IF NOT EXISTS lab_test_catalog (
                id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                test_code             VARCHAR(60)  NOT NULL,
                test_id               UUID         NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
                catalog_department    VARCHAR(100) NOT NULL,
                synonyms              VARCHAR(200),
                is_panel              BOOLEAN      NOT NULL DEFAULT false,
                specimen_requirement  VARCHAR(120),
                fasting_note          VARCHAR(120),
                evidence_source       VARCHAR(150) NOT NULL DEFAULT 'ICMR GCLP 2021 (governance guidance only)',
                approval_status       VARCHAR(10)  NOT NULL DEFAULT 'Pending'
                                      CHECK (approval_status IN ('Pending', 'Approved')),
                approved_by           VARCHAR(150),
                approved_at           TIMESTAMPTZ,
                sop_ref               VARCHAR(80),        -- SOP document id / version
                created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
                updated_at            TIMESTAMPTZ
            )$q$;
        EXECUTE $q$CREATE UNIQUE INDEX IF NOT EXISTS uq_lab_test_catalog_code ON lab_test_catalog (test_code)$q$;
        EXECUTE $q$CREATE INDEX IF NOT EXISTS idx_lab_test_catalog_test   ON lab_test_catalog (test_id)$q$;
        EXECUTE $q$CREATE INDEX IF NOT EXISTS idx_lab_test_catalog_status ON lab_test_catalog (approval_status, is_panel)$q$;
        EXECUTE $q$DROP TRIGGER IF EXISTS trg_lab_test_catalog_updated_at ON lab_test_catalog$q$;
        EXECUTE $q$CREATE TRIGGER trg_lab_test_catalog_updated_at BEFORE UPDATE ON lab_test_catalog
                    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()$q$;

        -- 2c. departments (Hematology == Haematology, so no duplicate department)
        EXECUTE $q$
            INSERT INTO departments (name)
            SELECT DISTINCT p.dept
            FROM tmp_pack p
            WHERE NOT EXISTS (
                SELECT 1 FROM departments d
                WHERE regexp_replace(replace(lower(d.name), 'haem', 'hem'), '[^a-z0-9]', '', 'g') = p.dept_key)
            ON CONFLICT (name) DO NOTHING$q$;
        GET DIAGNOSTICS n_dept = ROW_COUNT;

        -- 2d. tests (remember which ones are new -> only those get a starter format)
        EXECUTE $q$DROP TABLE IF EXISTS tmp_new_tests$q$;
        EXECUTE $q$CREATE TEMP TABLE tmp_new_tests (id UUID PRIMARY KEY, code VARCHAR(60) NOT NULL)$q$;
        EXECUTE format($q$
            WITH tk AS (   -- normalised-name key of every existing test (hash-join friendly)
                SELECT regexp_replace(replace(lower(t.name), 'haem', 'hem'), '[^a-z0-9]', '', 'g') AS k
                FROM tests t
            ),
            todo AS (
                SELECT p.*
                FROM tmp_pack p
                WHERE NOT EXISTS (SELECT 1 FROM tk WHERE tk.k = p.name_key)
                  AND NOT EXISTS (SELECT 1 FROM tk WHERE tk.k = p.alt_key)
            ),
            ins AS (
                INSERT INTO tests (department_id, name, price, status)
                SELECT d.id, todo.name, 0, %L::record_status
                FROM todo
                CROSS JOIN LATERAL (
                    SELECT dd.id FROM departments dd
                    WHERE regexp_replace(replace(lower(dd.name), 'haem', 'hem'), '[^a-z0-9]', '', 'g') = todo.dept_key
                    ORDER BY dd.created_at LIMIT 1) d
                ON CONFLICT (department_id, name) DO NOTHING
                RETURNING id, department_id, name
            )
            INSERT INTO tmp_new_tests (id, code)
            SELECT ins.id, todo.code
            FROM ins
            JOIN departments dd ON dd.id = ins.department_id
            JOIN todo ON todo.name = ins.name
                     AND todo.dept_key = regexp_replace(replace(lower(dd.name), 'haem', 'hem'), '[^a-z0-9]', '', 'g')
            ON CONFLICT DO NOTHING$q$,
            CASE WHEN activate_new THEN 'Active' ELSE 'Inactive' END);
        GET DIAGNOSTICS n_test = ROW_COUNT;

        -- 2e. catalog rows: pack test -> the lab's test (new one, or the existing equivalent)
        EXECUTE $q$
            WITH tk AS (
                SELECT t.id, t.created_at,
                       regexp_replace(replace(lower(t.name), 'haem', 'hem'), '[^a-z0-9]', '', 'g') AS k,
                       regexp_replace(replace(lower(d.name), 'haem', 'hem'), '[^a-z0-9]', '', 'g') AS dk
                FROM tests t JOIN departments d ON d.id = t.department_id
            ),
            cand AS (
                SELECT p.code, tk.id AS test_id, 0 AS pri, (tk.dk = p.dept_key) AS same_dept, tk.created_at
                FROM tmp_pack p JOIN tk ON tk.k = p.name_key
                UNION ALL
                SELECT p.code, tk.id, 1, (tk.dk = p.dept_key), tk.created_at
                FROM tmp_pack p JOIN tk ON tk.k = p.alt_key
            ),
            best AS (
                SELECT DISTINCT ON (code) code, test_id
                FROM cand
                ORDER BY code, pri, same_dept DESC, created_at
            )
            INSERT INTO lab_test_catalog
                (test_code, test_id, catalog_department, synonyms, is_panel, specimen_requirement, fasting_note)
            SELECT p.code, b.test_id, p.dept, p.synonyms, p.is_panel, p.specimen_requirement, p.fasting
            FROM tmp_pack p JOIN best b ON b.code = p.code
            ON CONFLICT (test_code) DO NOTHING$q$;
        GET DIAGNOSTICS n_cat = ROW_COUNT;

        -- 2f. starter format for NEW individual tests only (panels: build components in Test Formats)
        EXECUTE $q$
            INSERT INTO test_parameters (test_id, section_name, name, unit, result_type, sort_order, is_bold)
            SELECT n.id, '', left(t.name, 180), NULL,
                   CASE WHEN p.rtype = 'Text' THEN 'Text' ELSE 'Auto' END, 10, true
            FROM tmp_new_tests n
            JOIN tmp_pack p ON p.code = n.code
            JOIN tests t    ON t.id = n.id
            WHERE NOT p.is_panel
              AND NOT EXISTS (SELECT 1 FROM test_parameters tp WHERE tp.test_id = n.id)$q$;
        GET DIAGNOSTICS n_par = ROW_COUNT;

        -- 2g. specimen / method defaults shown on the Test Format + Upload Report screens
        EXECUTE $q$
            INSERT INTO test_report_info (test_id, specimen, method)
            SELECT DISTINCT ON (c.test_id) c.test_id, p.specimen, p.method_text
            FROM lab_test_catalog c
            JOIN tmp_pack p ON p.code = c.test_code
            ORDER BY c.test_id, c.created_at
            ON CONFLICT (test_id) DO NOTHING$q$;
        GET DIAGNOSTICS n_info = ROW_COUNT;

        RAISE NOTICE '  % : departments +%, tests +%, catalog rows +%, starter formats +%, specimen defaults +%',
                     s, n_dept, n_test, n_cat, n_par, n_info;
    END LOOP;

    PERFORM set_config('search_path', old_path, true);
END
$outer$;

DROP TABLE IF EXISTS tmp_new_tests;
DROP TABLE IF EXISTS tmp_pack;

-- ======================================================================
-- AFTER YOU VERIFY A TEST WITH YOUR PATHOLOGIST (example, run per lab schema):
--   SET search_path TO lab_demo, public;
--   UPDATE lab_test_catalog
--      SET approval_status = 'Approved', approved_by = 'Dr. Name',
--          approved_at = now(), sop_ref = 'SOP-BIO-001 v1'
--    WHERE test_code = 'BIO-FASTING-PLASMA-GLUCOSE-FPG';
--
-- QUICK CHECKS:
--   SELECT d.name, count(*) FROM tests t JOIN departments d ON d.id = t.department_id GROUP BY 1 ORDER BY 1;
--   SELECT count(*) FILTER (WHERE approval_status = 'Pending') AS pending,
--          count(*) FILTER (WHERE is_panel)                    AS panels
--     FROM lab_test_catalog;
--   -- tests that still have NO report format (these show the warning on Upload Report):
--   SELECT t.name FROM tests t WHERE NOT EXISTS (SELECT 1 FROM test_parameters p WHERE p.test_id = t.id);
-- ======================================================================
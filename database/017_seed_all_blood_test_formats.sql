-- ======================================================================
-- 017_seed_all_blood_test_formats.sql
-- Report formats (parameters + normal ranges) for 40 blood test groups
-- (86 parameters). Runs on EVERY schema that has a `tests` table.
--  * Matches your existing tests by NAME (pattern match), never creates tests.
--  * Only fills tests that have NO parameters yet, so it never overwrites
--    a format you already edited. Safe to re-run.
--  * Watch the NOTICE lines: "NO MATCH" = no test with that name in the lab.
--  * Ranges = common adult Indian-lab values. Have your pathologist verify;
--    edit anything later in the Test Formats screen.
-- Run with the RUN button (not Explain).
-- ======================================================================
DO $outer$
DECLARE
    s TEXT;
BEGIN
    FOR s IN
        SELECT DISTINCT i.table_schema
        FROM information_schema.tables i
        WHERE i.table_name = 'tests'
          AND i.table_schema NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')
    LOOP
        RAISE NOTICE 'Seeding formats in schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);
        EXECUTE $sql$
DO $$
DECLARE
    d      RECORD;
    t      RECORD;
    p      RECORD;
    p_id   UUID;
    n_all  INT;
    n_done INT;
BEGIN
    FOR d IN SELECT * FROM (VALUES
        ('esr', '^esr|erythrocyte sed'),
        ('hb', '^h(a)?emoglobin'),
        ('pbs', 'smear'),
        ('retic', 'reticulocyte'),
        ('coag', 'coagulation'),
        ('fbs', 'fasting.*(sugar|glucose)|\(fbs\)|^fbs'),
        ('ppbs', 'post.?prandial|ppbs'),
        ('rbs', 'random.*(sugar|glucose)|\(rbs\)|^rbs'),
        ('hba1c', 'hba1c|glycosylated|glycated'),
        ('ogtt', 'ogtt|glucose tolerance'),
        ('lipid', 'lipid'),
        ('lft', '^lft|liver function'),
        ('kft', '^kft|^rft|kidney function|renal function'),
        ('thy', 'thyroid'),
        ('trop', 'troponin'),
        ('ckmb', 'ck.?mb'),
        ('cpk', '^cpk|creatine (phospho)?kinase'),
        ('widal', 'widal'),
        ('dengue', 'dengue'),
        ('mp', 'malaria|^mp\y'),
        ('hbsag', 'hbsag|hepatitis b'),
        ('hcv', 'hcv|hepatitis c'),
        ('hiv', '^hiv'),
        ('vdrl', 'vdrl|rpr|syphilis'),
        ('crp', 'c.?reactive|^crp'),
        ('fsh', '^fsh|follicle stimulating'),
        ('lh', '^lh\y|luteinizing|luteinising'),
        ('prl', 'prolactin'),
        ('testo', 'testosterone'),
        ('e2', 'estradiol|^e2\y'),
        ('bhcg', 'hcg'),
        ('vitd', 'vitamin d|25.?oh|vit.? d\y'),
        ('b12', 'b.?12|cobalamin'),
        ('iron', '^iron( studies| profile)?$'),
        ('amyl', 'amylase'),
        ('lipase', 'lipase'),
        ('ca', '^(serum )?calcium'),
        ('phos', 'phosph'),
        ('mg', 'magnesium'),
        ('bg', 'blood group|abo')
    ) AS x(k, rx)
    LOOP
        SELECT count(*) INTO n_all FROM tests WHERE name ~* d.rx;
        IF n_all = 0 THEN
            RAISE NOTICE 'NO MATCH for [%] (pattern: %)', d.k, d.rx;
            CONTINUE;
        END IF;
        n_done := 0;
        FOR t IN SELECT id, name FROM tests
                 WHERE name ~* d.rx
                   AND NOT EXISTS (SELECT 1 FROM test_parameters tp WHERE tp.test_id = tests.id)
        LOOP
            FOR p IN SELECT * FROM (VALUES
        ('esr', 10, '', 'ESR (1st hour)', 'mm/hr', 0, true, 'Number'),
        ('hb', 10, '', 'Haemoglobin (Hb)', 'g/dL', 1, true, 'Number'),
        ('pbs', 10, 'PERIPHERAL SMEAR', 'RBC Morphology', NULL, NULL, false, 'Text'),
        ('pbs', 20, 'PERIPHERAL SMEAR', 'WBC Morphology', NULL, NULL, false, 'Text'),
        ('pbs', 30, 'PERIPHERAL SMEAR', 'Platelets', NULL, NULL, false, 'Text'),
        ('pbs', 40, 'PERIPHERAL SMEAR', 'Haemoparasites', NULL, NULL, false, 'Text'),
        ('pbs', 50, 'PERIPHERAL SMEAR', 'Impression', NULL, NULL, false, 'Text'),
        ('retic', 10, '', 'Reticulocyte Count', '%', 1, true, 'Number'),
        ('coag', 10, 'COAGULATION', 'Prothrombin Time (PT)', 'sec', 1, false, 'Number'),
        ('coag', 20, 'COAGULATION', 'Control (PT)', 'sec', 1, false, 'Number'),
        ('coag', 30, 'COAGULATION', 'INR', NULL, 2, true, 'Number'),
        ('coag', 40, 'COAGULATION', 'APTT', 'sec', 1, false, 'Number'),
        ('fbs', 10, '', 'Fasting Blood Sugar (FBS)', 'mg/dL', 0, true, 'Number'),
        ('ppbs', 10, '', 'Post Prandial Blood Sugar (PPBS)', 'mg/dL', 0, true, 'Number'),
        ('rbs', 10, '', 'Random Blood Sugar (RBS)', 'mg/dL', 0, true, 'Number'),
        ('hba1c', 10, '', 'HbA1c', '%', 1, true, 'Number'),
        ('hba1c', 20, '', 'Estimated Average Glucose (eAG)', 'mg/dL', 0, false, 'Number'),
        ('ogtt', 10, '', 'Fasting', 'mg/dL', 0, false, 'Number'),
        ('ogtt', 20, '', '1 Hour', 'mg/dL', 0, false, 'Number'),
        ('ogtt', 30, '', '2 Hour', 'mg/dL', 0, true, 'Number'),
        ('lipid', 10, '', 'Total Cholesterol', 'mg/dL', 0, true, 'Number'),
        ('lipid', 20, '', 'Triglycerides', 'mg/dL', 0, false, 'Number'),
        ('lipid', 30, '', 'HDL Cholesterol', 'mg/dL', 0, false, 'Number'),
        ('lipid', 40, '', 'LDL Cholesterol', 'mg/dL', 0, true, 'Number'),
        ('lipid', 50, '', 'VLDL Cholesterol', 'mg/dL', 0, false, 'Number'),
        ('lipid', 60, '', 'Non-HDL Cholesterol', 'mg/dL', 0, false, 'Number'),
        ('lipid', 70, '', 'Total Cholesterol / HDL Ratio', NULL, 1, false, 'Number'),
        ('lipid', 80, '', 'LDL / HDL Ratio', NULL, 1, false, 'Number'),
        ('lft', 10, 'BILIRUBIN', 'Total Bilirubin', 'mg/dL', 2, true, 'Number'),
        ('lft', 20, 'BILIRUBIN', 'Direct Bilirubin', 'mg/dL', 2, false, 'Number'),
        ('lft', 30, 'BILIRUBIN', 'Indirect Bilirubin', 'mg/dL', 2, false, 'Number'),
        ('lft', 40, 'ENZYMES', 'SGPT (ALT)', 'U/L', 0, true, 'Number'),
        ('lft', 50, 'ENZYMES', 'SGOT (AST)', 'U/L', 0, true, 'Number'),
        ('lft', 60, 'ENZYMES', 'Alkaline Phosphatase (ALP)', 'U/L', 0, false, 'Number'),
        ('lft', 70, 'ENZYMES', 'GGT', 'U/L', 0, false, 'Number'),
        ('lft', 80, 'PROTEINS', 'Total Protein', 'g/dL', 1, false, 'Number'),
        ('lft', 90, 'PROTEINS', 'Albumin', 'g/dL', 1, false, 'Number'),
        ('lft', 100, 'PROTEINS', 'Globulin', 'g/dL', 1, false, 'Number'),
        ('lft', 110, 'PROTEINS', 'A/G Ratio', NULL, 2, false, 'Number'),
        ('kft', 10, 'KIDNEY', 'Urea', 'mg/dL', 0, true, 'Number'),
        ('kft', 20, 'KIDNEY', 'Creatinine', 'mg/dL', 2, true, 'Number'),
        ('kft', 30, 'KIDNEY', 'Uric Acid', 'mg/dL', 1, false, 'Number'),
        ('kft', 40, 'ELECTROLYTES', 'Sodium (Na)', 'mEq/L', 0, false, 'Number'),
        ('kft', 50, 'ELECTROLYTES', 'Potassium (K)', 'mEq/L', 1, false, 'Number'),
        ('kft', 60, 'ELECTROLYTES', 'Chloride (Cl)', 'mEq/L', 0, false, 'Number'),
        ('kft', 70, 'KIDNEY', 'eGFR', 'mL/min/1.73m²', 0, false, 'Number'),
        ('thy', 10, 'THYROID', 'TSH', 'µIU/mL', 2, true, 'Number'),
        ('thy', 20, 'THYROID', 'Total T3', 'ng/dL', 1, false, 'Number'),
        ('thy', 30, 'THYROID', 'Total T4', 'µg/dL', 2, false, 'Number'),
        ('thy', 40, 'THYROID', 'Free T3', 'pg/mL', 2, false, 'Number'),
        ('thy', 50, 'THYROID', 'Free T4', 'ng/dL', 2, false, 'Number'),
        ('trop', 10, '', 'Troponin I', 'ng/mL', 3, true, 'Number'),
        ('ckmb', 10, '', 'CK-MB', 'U/L', 0, true, 'Number'),
        ('cpk', 10, '', 'CPK (Total)', 'U/L', 0, true, 'Number'),
        ('widal', 10, 'WIDAL', 'S. Typhi O', 'titre', NULL, false, 'Text'),
        ('widal', 20, 'WIDAL', 'S. Typhi H', 'titre', NULL, false, 'Text'),
        ('widal', 30, 'WIDAL', 'S. Paratyphi AH', 'titre', NULL, false, 'Text'),
        ('widal', 40, 'WIDAL', 'S. Paratyphi BH', 'titre', NULL, false, 'Text'),
        ('dengue', 10, 'DENGUE', 'Dengue NS1 Antigen', NULL, NULL, false, 'Text'),
        ('dengue', 20, 'DENGUE', 'Dengue IgM', NULL, NULL, false, 'Text'),
        ('dengue', 30, 'DENGUE', 'Dengue IgG', NULL, NULL, false, 'Text'),
        ('mp', 10, '', 'Malaria Parasite (MP) / Antigen', NULL, NULL, false, 'Text'),
        ('hbsag', 10, '', 'HBsAg', NULL, NULL, false, 'Text'),
        ('hcv', 10, '', 'HCV Antibody', NULL, NULL, false, 'Text'),
        ('hiv', 10, '', 'HIV I & II Antibody', NULL, NULL, false, 'Text'),
        ('vdrl', 10, '', 'VDRL / RPR', NULL, NULL, false, 'Text'),
        ('crp', 10, '', 'C-Reactive Protein (CRP)', 'mg/L', 1, true, 'Number'),
        ('fsh', 10, '', 'FSH', 'mIU/mL', 2, true, 'Number'),
        ('lh', 10, '', 'LH', 'mIU/mL', 2, true, 'Number'),
        ('prl', 10, '', 'Prolactin', 'ng/mL', 2, true, 'Number'),
        ('testo', 10, '', 'Testosterone (Total)', 'ng/dL', 0, true, 'Number'),
        ('e2', 10, '', 'Estradiol (E2)', 'pg/mL', 1, true, 'Number'),
        ('bhcg', 10, '', 'Beta hCG', 'mIU/mL', 2, true, 'Number'),
        ('vitd', 10, '', 'Vitamin D (25-OH)', 'ng/mL', 1, true, 'Number'),
        ('b12', 10, '', 'Vitamin B12', 'pg/mL', 0, true, 'Number'),
        ('iron', 10, '', 'Serum Iron', 'µg/dL', 0, true, 'Number'),
        ('iron', 20, '', 'TIBC', 'µg/dL', 0, false, 'Number'),
        ('iron', 30, '', 'Ferritin', 'ng/mL', 1, false, 'Number'),
        ('iron', 40, '', 'Transferrin Saturation', '%', 1, false, 'Number'),
        ('amyl', 10, '', 'Amylase', 'U/L', 0, true, 'Number'),
        ('lipase', 10, '', 'Lipase', 'U/L', 0, true, 'Number'),
        ('ca', 10, '', 'Calcium', 'mg/dL', 1, true, 'Number'),
        ('phos', 10, '', 'Phosphorus', 'mg/dL', 1, true, 'Number'),
        ('mg', 10, '', 'Magnesium', 'mg/dL', 1, true, 'Number'),
        ('bg', 10, 'BLOOD GROUP', 'ABO Group', NULL, NULL, false, 'Text'),
        ('bg', 20, 'BLOOD GROUP', 'Rh (D) Type', NULL, NULL, false, 'Text')
            ) AS v(k, so, section_name, pname, unit, dp, is_bold, rtype)
            WHERE v.k = d.k ORDER BY v.so
            LOOP
                INSERT INTO test_parameters
                    (test_id, section_name, name, unit, result_type, decimal_places, sort_order, is_bold)
                VALUES (t.id, p.section_name, p.pname, p.unit, p.rtype, p.dp::smallint, p.so, p.is_bold)
                RETURNING id INTO p_id;

                INSERT INTO test_reference_ranges
                    (parameter_id, gender, low_value, high_value, critical_low, critical_high, normal_text, display_text)
                SELECT p_id, r.g::gender_type, r.lo, r.hi, r.clo, r.chi, r.txt, r.disp
                FROM (VALUES
        ('esr', 10, 'Male', 0, 15, NULL, NULL, '0 - 15', NULL),
        ('esr', 10, 'Female', 0, 20, NULL, NULL, '0 - 20', NULL),
        ('hb', 10, 'Male', 13, 17, 7, 20, '13 - 17', NULL),
        ('hb', 10, 'Female', 12, 15, 7, 20, '12 - 15', NULL),
        ('retic', 10, NULL, 0.5, 2.5, NULL, NULL, '0.5 - 2.5', NULL),
        ('coag', 10, NULL, 11, 13.5, NULL, NULL, '11 - 13.5', NULL),
        ('coag', 20, NULL, NULL, NULL, NULL, NULL, 'Lab control', NULL),
        ('coag', 30, NULL, 0.8, 1.2, NULL, NULL, '0.8 - 1.2', NULL),
        ('coag', 40, NULL, 25, 35, NULL, NULL, '25 - 35', NULL),
        ('fbs', 10, NULL, 70, 100, 40, 500, '70 - 100', NULL),
        ('ppbs', 10, NULL, 70, 140, 40, 500, '70 - 140', NULL),
        ('rbs', 10, NULL, 70, 140, 40, 500, '70 - 140', NULL),
        ('hba1c', 10, NULL, 4.0, 5.6, NULL, NULL, '4.0 - 5.6 (Non-diabetic)', NULL),
        ('hba1c', 20, NULL, NULL, NULL, NULL, NULL, 'Calculated from HbA1c', NULL),
        ('ogtt', 10, NULL, 70, 100, NULL, NULL, '70 - 100', NULL),
        ('ogtt', 20, NULL, NULL, 180, NULL, NULL, '< 180', NULL),
        ('ogtt', 30, NULL, 70, 140, NULL, NULL, '70 - 140', NULL),
        ('lipid', 10, NULL, NULL, 200, NULL, NULL, '< 200 (Desirable)', NULL),
        ('lipid', 20, NULL, NULL, 150, NULL, NULL, '< 150 (Normal)', NULL),
        ('lipid', 30, 'Male', 40, NULL, NULL, NULL, '> 40', NULL),
        ('lipid', 30, 'Female', 50, NULL, NULL, NULL, '> 50', NULL),
        ('lipid', 40, NULL, NULL, 100, NULL, NULL, '< 100 (Optimal)', NULL),
        ('lipid', 50, NULL, NULL, 30, NULL, NULL, '< 30', NULL),
        ('lipid', 60, NULL, NULL, 130, NULL, NULL, '< 130', NULL),
        ('lipid', 70, NULL, NULL, 5.0, NULL, NULL, '< 5', NULL),
        ('lipid', 80, NULL, NULL, 3.5, NULL, NULL, '< 3.5', NULL),
        ('lft', 10, NULL, 0.2, 1.2, NULL, 15, '0.2 - 1.2', NULL),
        ('lft', 20, NULL, 0.0, 0.3, NULL, NULL, '0 - 0.3', NULL),
        ('lft', 30, NULL, 0.2, 0.9, NULL, NULL, '0.2 - 0.9', NULL),
        ('lft', 40, 'Male', 0, 41, NULL, NULL, '0 - 41', NULL),
        ('lft', 40, 'Female', 0, 33, NULL, NULL, '0 - 33', NULL),
        ('lft', 50, 'Male', 0, 40, NULL, NULL, '0 - 40', NULL),
        ('lft', 50, 'Female', 0, 32, NULL, NULL, '0 - 32', NULL),
        ('lft', 60, NULL, 44, 147, NULL, NULL, '44 - 147', NULL),
        ('lft', 70, 'Male', 10, 71, NULL, NULL, '10 - 71', NULL),
        ('lft', 70, 'Female', 6, 42, NULL, NULL, '6 - 42', NULL),
        ('lft', 80, NULL, 6.4, 8.3, NULL, NULL, '6.4 - 8.3', NULL),
        ('lft', 90, NULL, 3.5, 5.2, NULL, NULL, '3.5 - 5.2', NULL),
        ('lft', 100, NULL, 2.0, 3.5, NULL, NULL, '2 - 3.5', NULL),
        ('lft', 110, NULL, 1.1, 2.2, NULL, NULL, '1.1 - 2.2', NULL),
        ('kft', 10, NULL, 15, 45, NULL, NULL, '15 - 45', NULL),
        ('kft', 20, 'Male', 0.7, 1.3, NULL, 10, '0.7 - 1.3', NULL),
        ('kft', 20, 'Female', 0.6, 1.1, NULL, 10, '0.6 - 1.1', NULL),
        ('kft', 30, 'Male', 3.5, 7.2, NULL, NULL, '3.5 - 7.2', NULL),
        ('kft', 30, 'Female', 2.6, 6.0, NULL, NULL, '2.6 - 6', NULL),
        ('kft', 40, NULL, 135, 145, 120, 160, '135 - 145', NULL),
        ('kft', 50, NULL, 3.5, 5.1, 2.5, 6.5, '3.5 - 5.1', NULL),
        ('kft', 60, NULL, 98, 107, NULL, NULL, '98 - 107', NULL),
        ('kft', 70, NULL, 90, NULL, NULL, NULL, '> 90', NULL),
        ('thy', 10, NULL, 0.4, 4.2, NULL, NULL, '0.4 - 4.2', NULL),
        ('thy', 20, NULL, 80, 200, NULL, NULL, '80 - 200', NULL),
        ('thy', 30, NULL, 5.1, 14.1, NULL, NULL, '5.1 - 14.1', NULL),
        ('thy', 40, NULL, 2.0, 4.4, NULL, NULL, '2 - 4.4', NULL),
        ('thy', 50, NULL, 0.93, 1.7, NULL, NULL, '0.93 - 1.7', NULL),
        ('trop', 10, NULL, NULL, 0.04, NULL, NULL, '< 0.04', NULL),
        ('ckmb', 10, NULL, NULL, 25, NULL, NULL, '< 25', NULL),
        ('cpk', 10, 'Male', 39, 308, NULL, NULL, '39 - 308', NULL),
        ('cpk', 10, 'Female', 26, 192, NULL, NULL, '26 - 192', NULL),
        ('widal', 10, NULL, NULL, NULL, NULL, NULL, '< 1:80', '< 1:80'),
        ('widal', 20, NULL, NULL, NULL, NULL, NULL, '< 1:80', '< 1:80'),
        ('widal', 30, NULL, NULL, NULL, NULL, NULL, '< 1:80', '< 1:80'),
        ('widal', 40, NULL, NULL, NULL, NULL, NULL, '< 1:80', '< 1:80'),
        ('dengue', 10, NULL, NULL, NULL, NULL, NULL, 'Non-Reactive', 'Non-Reactive'),
        ('dengue', 20, NULL, NULL, NULL, NULL, NULL, 'Non-Reactive', 'Non-Reactive'),
        ('dengue', 30, NULL, NULL, NULL, NULL, NULL, 'Non-Reactive', 'Non-Reactive'),
        ('mp', 10, NULL, NULL, NULL, NULL, NULL, 'Not Detected', 'Not Detected'),
        ('hbsag', 10, NULL, NULL, NULL, NULL, NULL, 'Non-Reactive', 'Non-Reactive'),
        ('hcv', 10, NULL, NULL, NULL, NULL, NULL, 'Non-Reactive', 'Non-Reactive'),
        ('hiv', 10, NULL, NULL, NULL, NULL, NULL, 'Non-Reactive', 'Non-Reactive'),
        ('vdrl', 10, NULL, NULL, NULL, NULL, NULL, 'Non-Reactive', 'Non-Reactive'),
        ('crp', 10, NULL, NULL, 6.0, NULL, NULL, '< 6', NULL),
        ('fsh', 10, 'Male', 1.5, 12.4, NULL, NULL, '1.5 - 12.4', NULL),
        ('fsh', 10, 'Female', NULL, NULL, NULL, NULL, 'Follicular: 3.5 - 12.5 | Mid-cycle: 4.7 - 21.5 | Luteal: 1.7 - 7.7 | Post-menopause: 25.8 - 134.8', NULL),
        ('lh', 10, 'Male', 1.7, 8.6, NULL, NULL, '1.7 - 8.6', NULL),
        ('lh', 10, 'Female', NULL, NULL, NULL, NULL, 'Follicular: 2.4 - 12.6 | Mid-cycle: 14.0 - 95.6 | Luteal: 1.0 - 11.4 | Post-menopause: 7.7 - 58.5', NULL),
        ('prl', 10, 'Male', 4.04, 15.2, NULL, NULL, '4.04 - 15.2', NULL),
        ('prl', 10, 'Female', 4.79, 23.3, NULL, NULL, '4.79 - 23.3', NULL),
        ('testo', 10, 'Male', 280, 1100, NULL, NULL, '280 - 1100', NULL),
        ('testo', 10, 'Female', 15, 70, NULL, NULL, '15 - 70', NULL),
        ('e2', 10, 'Male', 11, 44, NULL, NULL, '11 - 44', NULL),
        ('e2', 10, 'Female', NULL, NULL, NULL, NULL, 'Follicular: 12.5 - 166 | Mid-cycle: 85.8 - 498 | Luteal: 43.8 - 211 | Post-menopause: < 54.7', NULL),
        ('bhcg', 10, 'Male', NULL, 2.0, NULL, NULL, '< 2', NULL),
        ('bhcg', 10, 'Female', NULL, 5.0, NULL, NULL, '< 5.0 (Non-pregnant)', NULL),
        ('vitd', 10, NULL, 30, 100, NULL, NULL, '30 - 100 (Sufficient)', NULL),
        ('b12', 10, NULL, 200, 900, NULL, NULL, '200 - 900', NULL),
        ('iron', 10, 'Male', 65, 175, NULL, NULL, '65 - 175', NULL),
        ('iron', 10, 'Female', 50, 170, NULL, NULL, '50 - 170', NULL),
        ('iron', 20, NULL, 250, 450, NULL, NULL, '250 - 450', NULL),
        ('iron', 30, 'Male', 30, 400, NULL, NULL, '30 - 400', NULL),
        ('iron', 30, 'Female', 13, 150, NULL, NULL, '13 - 150', NULL),
        ('iron', 40, NULL, 20, 50, NULL, NULL, '20 - 50', NULL),
        ('amyl', 10, NULL, 28, 100, NULL, NULL, '28 - 100', NULL),
        ('lipase', 10, NULL, 13, 60, NULL, NULL, '13 - 60', NULL),
        ('ca', 10, NULL, 8.6, 10.2, 6.5, 13.0, '8.6 - 10.2', NULL),
        ('phos', 10, NULL, 2.5, 4.5, NULL, NULL, '2.5 - 4.5', NULL),
        ('mg', 10, NULL, 1.6, 2.6, NULL, NULL, '1.6 - 2.6', NULL)
                ) AS r(k, so, g, lo, hi, clo, chi, disp, txt)
                WHERE r.k = d.k AND r.so = p.so;
            END LOOP;
            n_done := n_done + 1;
            RAISE NOTICE 'Format added: % (%)', t.name, d.k;
        END LOOP;
    END LOOP;
END $$;
        $sql$;
    END LOOP;
END
$outer$;
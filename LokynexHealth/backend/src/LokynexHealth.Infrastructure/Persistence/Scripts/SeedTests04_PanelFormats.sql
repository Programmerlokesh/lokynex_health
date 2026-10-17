-- ======================================================================
-- 021_build_panel_and_test_formats.sql
-- WHAT : Builds report formats (parameters + units + reference ranges) for
--        (A) ~55 common individual tests that 020 created with a 1-line format
--            (Urea, Creatinine, Sodium, SGOT, Cholesterol, TSH, PT, INR ...)
--        (B) 17 panels that had NO format (BMP, CMP, Fever Profile, ...)
--
-- NO ranges are invented here: every unit / range is COPIED from a format that
-- already exists in your lab (017 seed or your own edits). So (A) and (B)
-- always agree with the CBC / LFT / KFT / Lipid / Thyroid formats you already use.
--
-- RUN ORDER : ... 017 -> 020 -> 021 (this file).  Safe to re-run:
--   * a panel is built only if it has NO parameters yet,
--   * an individual test is updated only if it still has the untouched
--     1-line format from 020 (1 parameter, no unit, no range).
--   * if a source test (e.g. "KFT / RFT (Kidney Function Test)") is missing in
--     a lab, the rows that need it are simply skipped.
-- Panels with extra analytes that have no source (RF, CEA, AMH ...) get the
-- parameter + unit only: ranges are kit/analyser specific -> add them in
-- Test Formats. Drug Monitoring / Allergy IgE / Food IgE panels are left
-- empty on purpose (analyte list is different in every lab).
-- Run with the RUN button / "Execute script" in ONE session.
-- ======================================================================

-- ---------- A. individual tests: copy unit + ranges from an existing parameter ----------
DROP TABLE IF EXISTS tmp_ind;
CREATE TEMP TABLE tmp_ind (target TEXT, src_test TEXT, src_param TEXT);
INSERT INTO tmp_ind VALUES
 ('Total Leukocyte Count (TLC)',                       'CBC (Complete Blood Count)', 'Total WBC Count'),
 ('Red Blood Cell Count (RBC)',                        'CBC (Complete Blood Count)', 'Total RBC Count'),
 ('Hematocrit / Packed Cell Volume (PCV)',             'CBC (Complete Blood Count)', 'PCV / Haematocrit'),
 ('Mean Corpuscular Volume (MCV)',                     'CBC (Complete Blood Count)', 'MCV'),
 ('Mean Corpuscular Hemoglobin (MCH)',                 'CBC (Complete Blood Count)', 'MCH'),
 ('Mean Corpuscular Hemoglobin Concentration (MCHC)',  'CBC (Complete Blood Count)', 'MCHC'),
 ('Red Cell Distribution Width (RDW-CV)',              'CBC (Complete Blood Count)', 'RDW-CV'),
 ('Platelet Count',                                    'CBC (Complete Blood Count)', 'Platelet Count'),
 ('Prothrombin Time (PT)',                             'Coagulation Profile (PT/INR, APTT)', 'Prothrombin Time (PT)'),
 ('International Normalized Ratio (INR)',              'Coagulation Profile (PT/INR, APTT)', 'INR'),
 ('Activated Partial Thromboplastin Time (aPTT)',      'Coagulation Profile (PT/INR, APTT)', 'APTT'),
 ('Blood Urea',                                        'KFT / RFT (Kidney Function Test)', 'Urea'),
 ('Serum Creatinine',                                  'KFT / RFT (Kidney Function Test)', 'Creatinine'),
 ('Uric Acid',                                         'KFT / RFT (Kidney Function Test)', 'Uric Acid'),
 ('Sodium (Na)',                                       'KFT / RFT (Kidney Function Test)', 'Sodium (Na)'),
 ('Potassium (K)',                                     'KFT / RFT (Kidney Function Test)', 'Potassium (K)'),
 ('Chloride (Cl)',                                     'KFT / RFT (Kidney Function Test)', 'Chloride (Cl)'),
 ('eGFR (calculated)',                                 'KFT / RFT (Kidney Function Test)', 'eGFR'),
 ('Total Bilirubin',                                   'LFT (Liver Function Test)', 'Total Bilirubin'),
 ('Direct Bilirubin',                                  'LFT (Liver Function Test)', 'Direct Bilirubin'),
 ('Indirect Bilirubin (calculated)',                   'LFT (Liver Function Test)', 'Indirect Bilirubin'),
 ('AST / SGOT',                                        'LFT (Liver Function Test)', 'SGOT (AST)'),
 ('ALT / SGPT',                                        'LFT (Liver Function Test)', 'SGPT (ALT)'),
 ('Alkaline Phosphatase (ALP)',                        'LFT (Liver Function Test)', 'Alkaline Phosphatase (ALP)'),
 ('Gamma-Glutamyl Transferase (GGT)',                  'LFT (Liver Function Test)', 'GGT'),
 ('Total Protein',                                     'LFT (Liver Function Test)', 'Total Protein'),
 ('Albumin',                                           'LFT (Liver Function Test)', 'Albumin'),
 ('Globulin (calculated)',                             'LFT (Liver Function Test)', 'Globulin'),
 ('Albumin/Globulin Ratio',                            'LFT (Liver Function Test)', 'A/G Ratio'),
 ('Total Cholesterol',                                 'Lipid Profile', 'Total Cholesterol'),
 ('HDL Cholesterol',                                   'Lipid Profile', 'HDL Cholesterol'),
 ('LDL Cholesterol (direct / calculated)',             'Lipid Profile', 'LDL Cholesterol'),
 ('Triglycerides',                                     'Lipid Profile', 'Triglycerides'),
 ('VLDL (calculated)',                                 'Lipid Profile', 'VLDL Cholesterol'),
 ('Non-HDL Cholesterol',                               'Lipid Profile', 'Non-HDL Cholesterol'),
 ('Thyroid Stimulating Hormone (TSH)',                 'Thyroid Profile (T3, T4, TSH)', 'TSH'),
 ('Free T4 (FT4)',                                     'Thyroid Profile (T3, T4, TSH)', 'Free T4'),
 ('Free T3 (FT3)',                                     'Thyroid Profile (T3, T4, TSH)', 'Free T3'),
 ('Total T4',                                          'Thyroid Profile (T3, T4, TSH)', 'Total T4'),
 ('Total T3',                                          'Thyroid Profile (T3, T4, TSH)', 'Total T3'),
 ('Serum Iron',                                        'Iron Studies', 'Serum Iron'),
 ('Total Iron Binding Capacity (TIBC)',                'Iron Studies', 'TIBC'),
 ('Ferritin',                                          'Iron Studies', 'Ferritin'),
 ('Transferrin Saturation',                            'Iron Studies', 'Transferrin Saturation'),
 ('Rh(D) Typing',                                      'Blood Group (ABO & Rh)', 'Rh (D) Type'),
 ('Dengue NS1 Antigen',                                'Dengue (NS1 / IgG / IgM)', 'Dengue NS1 Antigen'),
 ('Dengue IgM',                                        'Dengue (NS1 / IgG / IgM)', 'Dengue IgM'),
 ('Dengue IgG',                                        'Dengue (NS1 / IgG / IgM)', 'Dengue IgG'),
 ('Syphilis RPR',                                      'VDRL / RPR (Syphilis)', 'VDRL / RPR');

-- ---------- B. panels: which existing formats / parameters they are made of ----------
-- src_param NULL = every parameter of the source test.  section NULL = keep source section.
DROP TABLE IF EXISTS tmp_pan;
CREATE TEMP TABLE tmp_pan (panel TEXT, seq INT, src_test TEXT, src_param TEXT, section TEXT);
INSERT INTO tmp_pan VALUES
 ('Complete Hemogram',                 1, 'CBC (Complete Blood Count)', NULL, NULL),
 ('Complete Hemogram Profile',         1, 'CBC (Complete Blood Count)', NULL, NULL),
 ('Complete Hemogram Profile',         2, 'ESR (Erythrocyte Sedimentation Rate)', NULL, 'ESR'),
 ('Electrolyte Profile',               1, 'KFT / RFT (Kidney Function Test)', 'Sodium (Na)',    'ELECTROLYTES'),
 ('Electrolyte Profile',               2, 'KFT / RFT (Kidney Function Test)', 'Potassium (K)',  'ELECTROLYTES'),
 ('Electrolyte Profile',               3, 'KFT / RFT (Kidney Function Test)', 'Chloride (Cl)',  'ELECTROLYTES'),
 ('Basic Metabolic Panel (BMP)',       1, 'Blood Sugar Fasting (FBS)', NULL, 'GLUCOSE'),
 ('Basic Metabolic Panel (BMP)',       2, 'KFT / RFT (Kidney Function Test)', 'Urea',           'RENAL'),
 ('Basic Metabolic Panel (BMP)',       3, 'KFT / RFT (Kidney Function Test)', 'Creatinine',     'RENAL'),
 ('Basic Metabolic Panel (BMP)',       4, 'KFT / RFT (Kidney Function Test)', 'Sodium (Na)',    'ELECTROLYTES'),
 ('Basic Metabolic Panel (BMP)',       5, 'KFT / RFT (Kidney Function Test)', 'Potassium (K)',  'ELECTROLYTES'),
 ('Basic Metabolic Panel (BMP)',       6, 'KFT / RFT (Kidney Function Test)', 'Chloride (Cl)',  'ELECTROLYTES'),
 ('Basic Metabolic Panel (BMP)',       7, 'Serum Calcium', NULL, 'CALCIUM'),
 ('Comprehensive Metabolic Panel (CMP)', 1, 'Blood Sugar Fasting (FBS)', NULL, 'GLUCOSE'),
 ('Comprehensive Metabolic Panel (CMP)', 2, 'KFT / RFT (Kidney Function Test)', 'Urea',        'RENAL'),
 ('Comprehensive Metabolic Panel (CMP)', 3, 'KFT / RFT (Kidney Function Test)', 'Creatinine',  'RENAL'),
 ('Comprehensive Metabolic Panel (CMP)', 4, 'KFT / RFT (Kidney Function Test)', 'Sodium (Na)', 'ELECTROLYTES'),
 ('Comprehensive Metabolic Panel (CMP)', 5, 'KFT / RFT (Kidney Function Test)', 'Potassium (K)','ELECTROLYTES'),
 ('Comprehensive Metabolic Panel (CMP)', 6, 'KFT / RFT (Kidney Function Test)', 'Chloride (Cl)','ELECTROLYTES'),
 ('Comprehensive Metabolic Panel (CMP)', 7, 'Serum Calcium', NULL, 'CALCIUM'),
 ('Comprehensive Metabolic Panel (CMP)', 8, 'LFT (Liver Function Test)', 'Total Bilirubin',            'LIVER'),
 ('Comprehensive Metabolic Panel (CMP)', 9, 'LFT (Liver Function Test)', 'SGPT (ALT)',                  'LIVER'),
 ('Comprehensive Metabolic Panel (CMP)',10, 'LFT (Liver Function Test)', 'SGOT (AST)',                  'LIVER'),
 ('Comprehensive Metabolic Panel (CMP)',11, 'LFT (Liver Function Test)', 'Alkaline Phosphatase (ALP)',  'LIVER'),
 ('Comprehensive Metabolic Panel (CMP)',12, 'LFT (Liver Function Test)', 'Total Protein',               'PROTEINS'),
 ('Comprehensive Metabolic Panel (CMP)',13, 'LFT (Liver Function Test)', 'Albumin',                     'PROTEINS'),
 ('Diabetes Profile',                  1, 'Blood Sugar Fasting (FBS)', NULL, 'GLUCOSE'),
 ('Diabetes Profile',                  2, 'Blood Sugar Post Prandial (PPBS)', NULL, 'GLUCOSE'),
 ('Diabetes Profile',                  3, 'HbA1c (Glycosylated Haemoglobin)', NULL, 'HBA1C'),
 ('Fever Profile',                     1, 'CBC (Complete Blood Count)', NULL, NULL),
 ('Fever Profile',                     2, 'Malaria Parasite (MP)', NULL, 'MALARIA'),
 ('Fever Profile',                     3, 'Widal Test', NULL, 'WIDAL'),
 ('Fever Profile',                     4, 'Dengue (NS1 / IgG / IgM)', NULL, 'DENGUE'),
 ('Fever Profile',                     5, 'CRP (C-Reactive Protein)', NULL, 'INFLAMMATION'),
 ('Pre-operative Profile',             1, 'CBC (Complete Blood Count)', NULL, NULL),
 ('Pre-operative Profile',             2, 'Blood Sugar Fasting (FBS)', NULL, 'GLUCOSE'),
 ('Pre-operative Profile',             3, 'KFT / RFT (Kidney Function Test)', 'Urea',       'RENAL'),
 ('Pre-operative Profile',             4, 'KFT / RFT (Kidney Function Test)', 'Creatinine', 'RENAL'),
 ('Pre-operative Profile',             5, 'Coagulation Profile (PT/INR, APTT)', NULL, 'COAGULATION'),
 ('Pre-operative Profile',             6, 'HBsAg (Hepatitis B)', NULL, 'VIRAL MARKERS'),
 ('Pre-operative Profile',             7, 'HIV I & II', NULL, 'VIRAL MARKERS'),
 ('Pre-operative Profile',             8, 'Anti-HCV (Hepatitis C)', NULL, 'VIRAL MARKERS'),
 ('Pre-operative Profile',             9, 'Blood Group (ABO & Rh)', NULL, 'BLOOD GROUP'),
 ('Antenatal / Pregnancy Profile',     1, 'CBC (Complete Blood Count)', NULL, NULL),
 ('Antenatal / Pregnancy Profile',     2, 'Blood Group (ABO & Rh)', NULL, 'BLOOD GROUP'),
 ('Antenatal / Pregnancy Profile',     3, 'Blood Sugar Fasting (FBS)', NULL, 'GLUCOSE'),
 ('Antenatal / Pregnancy Profile',     4, 'Thyroid Profile (T3, T4, TSH)', 'TSH', 'THYROID'),
 ('Antenatal / Pregnancy Profile',     5, 'HBsAg (Hepatitis B)', NULL, 'INFECTIOUS SCREEN'),
 ('Antenatal / Pregnancy Profile',     6, 'HIV I & II', NULL, 'INFECTIOUS SCREEN'),
 ('Antenatal / Pregnancy Profile',     7, 'VDRL / RPR (Syphilis)', NULL, 'INFECTIOUS SCREEN'),
 ('Cardiac Risk Profile',              1, 'Lipid Profile', NULL, NULL),
 ('Cardiac Risk Profile',              2, 'CRP (C-Reactive Protein)', NULL, 'INFLAMMATION'),
 ('Arthritis / Rheumatology Profile',  1, 'CRP (C-Reactive Protein)', NULL, 'INFLAMMATION'),
 ('Arthritis / Rheumatology Profile',  2, 'KFT / RFT (Kidney Function Test)', 'Uric Acid', 'METABOLIC'),
 ('Viral Marker Profile',              1, 'HBsAg (Hepatitis B)', NULL, 'VIRAL MARKERS'),
 ('Viral Marker Profile',              2, 'Anti-HCV (Hepatitis C)', NULL, 'VIRAL MARKERS'),
 ('Viral Marker Profile',              3, 'HIV I & II', NULL, 'VIRAL MARKERS'),
 ('Anemia Profile',                    1, 'CBC (Complete Blood Count)', NULL, NULL),
 ('Anemia Profile',                    2, 'Reticulocyte Count', NULL, 'RETICULOCYTES'),
 ('Anemia Profile',                    3, 'Iron Studies', NULL, 'IRON STUDIES'),
 ('Anemia Profile',                    4, 'Vitamin B12', NULL, 'VITAMINS'),
 ('Sepsis Profile',                    1, 'CBC (Complete Blood Count)', NULL, NULL),
 ('Sepsis Profile',                    2, 'CRP (C-Reactive Protein)', NULL, 'INFLAMMATION'),
 ('Fertility Hormone Profile',         1, 'FSH', NULL, 'HORMONES'),
 ('Fertility Hormone Profile',         2, 'LH (Luteinizing Hormone)', NULL, 'HORMONES'),
 ('Fertility Hormone Profile',         3, 'Prolactin', NULL, 'HORMONES'),
 ('Fertility Hormone Profile',         4, 'Estradiol (E2)', NULL, 'HORMONES');

-- extra analytes that have no source format: parameter + unit only (add ranges in Test Formats)
DROP TABLE IF EXISTS tmp_ext;
CREATE TEMP TABLE tmp_ext (panel TEXT, seq INT, section TEXT, name TEXT, unit TEXT, rtype TEXT);
INSERT INTO tmp_ext VALUES
 ('Anemia Profile',                   5, 'VITAMINS',   'Folate',                        'ng/mL',  'Auto'),
 ('Sepsis Profile',                   3, 'SEPSIS MARKERS', 'Procalcitonin (PCT)',      'ng/mL',  'Auto'),
 ('Sepsis Profile',                   4, 'SEPSIS MARKERS', 'Lactate',                  'mmol/L', 'Auto'),
 ('Fertility Hormone Profile',        5, 'HORMONES',   'Anti-Mullerian Hormone (AMH)',  'ng/mL',  'Auto'),
 ('Arthritis / Rheumatology Profile', 3, 'AUTOIMMUNE', 'Rheumatoid Factor (RF)',        'IU/mL',  'Auto'),
 ('Arthritis / Rheumatology Profile', 4, 'AUTOIMMUNE', 'Anti-CCP',                      'U/mL',   'Auto'),
 ('Arthritis / Rheumatology Profile', 5, 'AUTOIMMUNE', 'ASO Titre',                     'IU/mL',  'Auto'),
 ('Arthritis / Rheumatology Profile', 6, 'AUTOIMMUNE', 'Antinuclear Antibody (ANA)',    NULL,     'Text'),
 ('TORCH Profile',                    1, 'TORCH',      'Toxoplasma IgG',                NULL,     'Auto'),
 ('TORCH Profile',                    2, 'TORCH',      'Toxoplasma IgM',                NULL,     'Auto'),
 ('TORCH Profile',                    3, 'TORCH',      'Rubella IgG',                   NULL,     'Auto'),
 ('TORCH Profile',                    4, 'TORCH',      'Rubella IgM',                   NULL,     'Auto'),
 ('TORCH Profile',                    5, 'TORCH',      'Cytomegalovirus (CMV) IgG',     NULL,     'Auto'),
 ('TORCH Profile',                    6, 'TORCH',      'Cytomegalovirus (CMV) IgM',     NULL,     'Auto'),
 ('TORCH Profile',                    7, 'TORCH',      'Herpes Simplex Virus (HSV) IgM',NULL,     'Auto'),
 ('Tumor Marker Profile',             1, 'TUMOR MARKERS', 'CEA',                       'ng/mL',  'Auto'),
 ('Tumor Marker Profile',             2, 'TUMOR MARKERS', 'AFP',                       'ng/mL',  'Auto'),
 ('Tumor Marker Profile',             3, 'TUMOR MARKERS', 'CA-125',                    'U/mL',   'Auto'),
 ('Tumor Marker Profile',             4, 'TUMOR MARKERS', 'CA 19-9',                   'U/mL',   'Auto'),
 ('Tumor Marker Profile',             5, 'TUMOR MARKERS', 'CA 15-3',                   'U/mL',   'Auto'),
 ('Tumor Marker Profile',             6, 'TUMOR MARKERS', 'PSA (Total)',               'ng/mL',  'Auto');

-- ---------- apply to EVERY lab schema that has the report-format tables ----------
DO $outer$
DECLARE
    s        TEXT;
    old_path TEXT := current_setting('search_path');
    n_ind INT; n_pan INT; n_rng INT;
BEGIN
    FOR s IN
        SELECT DISTINCT i.table_schema
        FROM information_schema.tables i
        WHERE i.table_name = 'test_parameters'
          AND i.table_schema NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')
    LOOP
        RAISE NOTICE 'Building formats in schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);

        -- A. individual tests (only the untouched 1-line formats from 020)
        EXECUTE $q$DROP TABLE IF EXISTS tmp_upd$q$;
        EXECUTE $q$CREATE TEMP TABLE tmp_upd (id UUID PRIMARY KEY)$q$;
        EXECUTE $q$
            WITH tgt AS (
                SELECT tp.id AS param_id, i.src_test, i.src_param
                FROM tmp_ind i
                JOIN tests t            ON t.name = i.target
                JOIN test_parameters tp ON tp.test_id = t.id
                WHERE tp.unit IS NULL
                  AND (SELECT count(*) FROM test_parameters x WHERE x.test_id = t.id) = 1
                  AND NOT EXISTS (SELECT 1 FROM test_reference_ranges r WHERE r.parameter_id = tp.id)
            ),
            src AS (
                SELECT DISTINCT ON (tgt.param_id)
                       tgt.param_id, sp.id AS src_id, sp.unit, sp.decimal_places,
                       CASE sp.result_type WHEN 'Number' THEN 'Numeric' ELSE sp.result_type END AS result_type
                FROM tgt
                JOIN tests st            ON st.name = tgt.src_test
                JOIN test_parameters sp  ON sp.test_id = st.id AND sp.name = tgt.src_param
                                        AND sp.status = 'Active'
                ORDER BY tgt.param_id, st.created_at
            ),
            upd AS (
                UPDATE test_parameters p
                   SET unit = s.unit, decimal_places = s.decimal_places, result_type = s.result_type
                  FROM src s WHERE p.id = s.param_id
                RETURNING p.id
            ),
            rng AS (
                INSERT INTO test_reference_ranges
                    (parameter_id, gender, age_min_days, age_max_days, low_value, high_value,
                     critical_low, critical_high, normal_text, display_text)
                SELECT s.param_id, r.gender, r.age_min_days, r.age_max_days, r.low_value, r.high_value,
                       r.critical_low, r.critical_high, r.normal_text, r.display_text
                FROM src s JOIN test_reference_ranges r ON r.parameter_id = s.src_id
                RETURNING 1
            )
            INSERT INTO tmp_upd SELECT id FROM upd$q$;
        GET DIAGNOSTICS n_ind = ROW_COUNT;

        -- B. panels with no format yet
        EXECUTE $q$DROP TABLE IF EXISTS tmp_np$q$;
        EXECUTE $q$
            CREATE TEMP TABLE tmp_np (
                new_id UUID NOT NULL DEFAULT gen_random_uuid(), test_id UUID NOT NULL, src_id UUID,
                section TEXT, name TEXT, unit TEXT, rtype TEXT, dec SMALLINT, bold BOOLEAN, sort INT)$q$;
        EXECUTE $q$
            INSERT INTO tmp_np (test_id, src_id, section, name, unit, rtype, dec, bold, sort)
            SELECT DISTINCT ON (t.id, lower(coalesce(pn.section, sp.section_name)), lower(sp.name))
                   t.id, sp.id, coalesce(pn.section, sp.section_name), sp.name, sp.unit,
                   CASE sp.result_type WHEN 'Number' THEN 'Numeric' ELSE sp.result_type END,
                   sp.decimal_places, sp.is_bold, pn.seq * 1000 + sp.sort_order
            FROM tmp_pan pn
            JOIN tests t ON t.name = pn.panel
                        AND NOT EXISTS (SELECT 1 FROM test_parameters x WHERE x.test_id = t.id)
            JOIN tests st           ON st.name = pn.src_test
            JOIN test_parameters sp ON sp.test_id = st.id AND sp.status = 'Active'
                                   AND (pn.src_param IS NULL OR sp.name = pn.src_param)
            ORDER BY t.id, lower(coalesce(pn.section, sp.section_name)), lower(sp.name), pn.seq$q$;
        EXECUTE $q$
            INSERT INTO tmp_np (test_id, src_id, section, name, unit, rtype, dec, bold, sort)
            SELECT t.id, NULL, e.section, e.name, e.unit, e.rtype, NULL, false, e.seq * 1000
            FROM tmp_ext e
            JOIN tests t ON t.name = e.panel
                        AND NOT EXISTS (SELECT 1 FROM test_parameters x WHERE x.test_id = t.id)$q$;
        EXECUTE $q$
            INSERT INTO test_parameters
                (id, test_id, section_name, name, unit, result_type, decimal_places, sort_order, is_bold)
            SELECT new_id, test_id, coalesce(section, ''), left(name, 180), unit, rtype, dec, sort, coalesce(bold, false)
            FROM tmp_np$q$;
        GET DIAGNOSTICS n_pan = ROW_COUNT;
        EXECUTE $q$
            INSERT INTO test_reference_ranges
                (parameter_id, gender, age_min_days, age_max_days, low_value, high_value,
                 critical_low, critical_high, normal_text, display_text)
            SELECT n.new_id, r.gender, r.age_min_days, r.age_max_days, r.low_value, r.high_value,
                   r.critical_low, r.critical_high, r.normal_text, r.display_text
            FROM tmp_np n JOIN test_reference_ranges r ON r.parameter_id = n.src_id$q$;
        GET DIAGNOSTICS n_rng = ROW_COUNT;

        RAISE NOTICE '  % : individual tests updated %, panel parameters added %, ranges copied %',
                     s, n_ind, n_pan, n_rng;
    END LOOP;

    PERFORM set_config('search_path', old_path, true);
END
$outer$;

DROP TABLE IF EXISTS tmp_upd;
DROP TABLE IF EXISTS tmp_np;
DROP TABLE IF EXISTS tmp_ind;
DROP TABLE IF EXISTS tmp_pan;
DROP TABLE IF EXISTS tmp_ext;

-- CHECK: tests that still have NO format (should only be Drug Monitoring + the 2 IgE panels):
--   SELECT t.name FROM tests t WHERE NOT EXISTS (SELECT 1 FROM test_parameters p WHERE p.test_id = t.id);
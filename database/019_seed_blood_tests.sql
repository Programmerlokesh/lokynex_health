-- ======================================================================
-- 019_seed_blood_tests.sql
-- WHY: the "Test Formats" screen lists only tests that exist in the lab's
--      `tests` table. 017 fills formats but NEVER creates tests, so a lab that
--      only added "CBC" sees just CBC there.
-- WHAT: creates the common blood tests (41 groups) in the department "Blood"
--      (created if missing) on EVERY lab schema that has a `tests` table.
--  * A test is skipped when the lab already has a test with a matching name
--    (same patterns as 017), so nothing is duplicated.
--  * price is 0 -> set the real price in "Departments & Tests".
-- ORDER:  018  ->  019 (this file)  ->  017  (017 then fills parameters + ranges)
-- Safe to re-run. Run with the RUN button (not Explain).
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
        RAISE NOTICE 'Seeding blood tests in schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);
        EXECUTE $sql$
DO $$
DECLARE
    dept_id UUID;
    t       RECORD;
    n_added INT := 0;
BEGIN
    SELECT id INTO dept_id FROM departments WHERE name ILIKE 'blood' LIMIT 1;
    IF dept_id IS NULL THEN
        INSERT INTO departments (name) VALUES ('Blood')
        ON CONFLICT (name) DO NOTHING;
        SELECT id INTO dept_id FROM departments WHERE name ILIKE 'blood' LIMIT 1;
    END IF;

    FOR t IN SELECT * FROM (VALUES
        ('CBC (Complete Blood Count)',            '^cbc|complete blood count|complete h(a)?emogram'),
        ('ESR (Erythrocyte Sedimentation Rate)',  '^esr|erythrocyte sed'),
        ('Haemoglobin (Hb)',                      '^h(a)?emoglobin'),
        ('Peripheral Blood Smear',                'smear'),
        ('Reticulocyte Count',                    'reticulocyte'),
        ('Coagulation Profile (PT/INR, APTT)',    'coagulation'),
        ('Blood Sugar Fasting (FBS)',             'fasting.*(sugar|glucose)|\(fbs\)|^fbs'),
        ('Blood Sugar Post Prandial (PPBS)',      'post.?prandial|ppbs'),
        ('Blood Sugar Random (RBS)',              'random.*(sugar|glucose)|\(rbs\)|^rbs'),
        ('HbA1c (Glycosylated Haemoglobin)',      'hba1c|glycosylated|glycated'),
        ('OGTT (Oral Glucose Tolerance Test)',    'ogtt|glucose tolerance'),
        ('Lipid Profile',                         'lipid'),
        ('LFT (Liver Function Test)',             '^lft|liver function'),
        ('KFT / RFT (Kidney Function Test)',      '^kft|^rft|kidney function|renal function'),
        ('Thyroid Profile (T3, T4, TSH)',         'thyroid'),
        ('Troponin I',                            'troponin'),
        ('CK-MB',                                 'ck.?mb'),
        ('CPK (Creatine Phosphokinase)',          '^cpk|creatine (phospho)?kinase'),
        ('Widal Test',                            'widal'),
        ('Dengue (NS1 / IgG / IgM)',              'dengue'),
        ('Malaria Parasite (MP)',                 'malaria|^mp\y'),
        ('HBsAg (Hepatitis B)',                   'hbsag|hepatitis b'),
        ('Anti-HCV (Hepatitis C)',                'hcv|hepatitis c'),
        ('HIV I & II',                            '^hiv'),
        ('VDRL / RPR (Syphilis)',                 'vdrl|rpr|syphilis'),
        ('CRP (C-Reactive Protein)',              'c.?reactive|^crp'),
        ('FSH',                                   '^fsh|follicle stimulating'),
        ('LH (Luteinizing Hormone)',              '^lh\y|luteinizing|luteinising'),
        ('Prolactin',                             'prolactin'),
        ('Testosterone',                          'testosterone'),
        ('Estradiol (E2)',                        'estradiol|^e2\y'),
        ('Beta HCG',                              'hcg'),
        ('Vitamin D (25-OH)',                     'vitamin d|25.?oh|vit.? d\y'),
        ('Vitamin B12',                           'b.?12|cobalamin'),
        ('Iron Studies',                          '^iron( studies| profile)?$'),
        ('Serum Amylase',                         'amylase'),
        ('Serum Lipase',                          'lipase'),
        ('Serum Calcium',                         '^(serum )?calcium'),
        ('Serum Phosphorus',                      'phosph'),
        ('Serum Magnesium',                       'magnesium'),
        ('Blood Group (ABO & Rh)',                'blood group|abo')
    ) AS x(test_name, rx)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM tests WHERE name ~* t.rx) THEN
            INSERT INTO tests (department_id, name, price)
            VALUES (dept_id, t.test_name, 0)
            ON CONFLICT (department_id, name) DO NOTHING;
            n_added := n_added + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Blood tests added: %', n_added;
END
$$;
        $sql$;
    END LOOP;
END
$outer$;
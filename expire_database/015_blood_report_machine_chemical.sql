-- ======================================================================
-- 015_blood_report_machine_chemical.sql
-- Run AFTER 014_blood_report_formats.sql. Replace lab_demo with your schema.
-- Adds: machine / chemical (reagent) / specimen / method to blood reports.
-- Safe to re-run.
-- ======================================================================
SET search_path TO lab_demo, public;

-- Default info per test (lab sets machine/reagent once, it is reused next time)
CREATE TABLE IF NOT EXISTS test_report_info (
    test_id         UUID PRIMARY KEY REFERENCES tests(id) ON DELETE CASCADE,
    specimen        VARCHAR(120),
    method          VARCHAR(200),
    machine_name    VARCHAR(150),
    reagent_name    VARCHAR(200),
    interpretation  TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-report snapshot (what actually printed on that report)
ALTER TABLE report_documents
    ADD COLUMN IF NOT EXISTS specimen        VARCHAR(120),
    ADD COLUMN IF NOT EXISTS method_text     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS machine_name    VARCHAR(150),
    ADD COLUMN IF NOT EXISTS reagent_name    VARCHAR(200),
    ADD COLUMN IF NOT EXISTS sample_id       VARCHAR(40),
    ADD COLUMN IF NOT EXISTS report_remarks  TEXT;

-- Well-known specimen / method defaults (machine & reagent left blank on purpose:
-- every lab uses a different analyser, so the technician fills it once per test).
INSERT INTO test_report_info (test_id, specimen, method)
SELECT t.id, v.specimen, v.method
FROM (VALUES
    ('CBC (Complete Blood Count)',            'Whole blood (EDTA)',          'Automated haematology analyser (impedance / flow cytometry)'),
    ('Haemoglobin (Hb)',                      'Whole blood (EDTA)',          'Photometry'),
    ('ESR (Erythrocyte Sedimentation Rate)',  'Whole blood (EDTA / citrate)','Westergren method'),
    ('Blood Sugar Fasting (FBS)',             'Plasma (fluoride)',           'GOD-POD (enzymatic colorimetric)'),
    ('Blood Sugar Post Prandial (PPBS)',      'Plasma (fluoride)',           'GOD-POD (enzymatic colorimetric)'),
    ('Blood Sugar Random (RBS)',              'Plasma (fluoride)',           'GOD-POD (enzymatic colorimetric)'),
    ('HbA1c (Glycosylated Haemoglobin)',      'Whole blood (EDTA)',          NULL),
    ('Lipid Profile',                         'Serum',                       'Enzymatic colorimetric'),
    ('LFT (Liver Function Test)',             'Serum',                       'Colorimetric / kinetic'),
    ('KFT / RFT (Kidney Function Test)',      'Serum',                       'Colorimetric / ion-selective electrode')
) AS v(test_name, specimen, method)
JOIN tests t ON t.name = v.test_name
ON CONFLICT (test_id) DO NOTHING;

-- Generic specimen by department for everything else (editable from the report screen)
INSERT INTO test_report_info (test_id, specimen)
SELECT t.id,
       CASE d.name
            WHEN 'Haematology'              THEN 'Whole blood (EDTA)'
            WHEN 'Coagulation'              THEN 'Citrated plasma'
            ELSE 'Serum'
       END
FROM tests t
JOIN departments d ON d.id = t.department_id
WHERE d.name IN ('Haematology','Biochemistry','Hormones & Endocrinology',
                 'Serology & Immunology','Cardiac Markers','Coagulation')
ON CONFLICT (test_id) DO NOTHING;
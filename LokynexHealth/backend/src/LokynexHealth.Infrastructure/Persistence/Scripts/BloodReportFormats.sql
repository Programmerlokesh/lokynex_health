-- ======================================================================
-- 014_blood_report_formats.sql
-- Run BEFORE 015_blood_report_machine_chemical.sql.
-- Replace lab_demo with your tenant schema. Safe to re-run.
-- Adds: test parameters + reference ranges (report format per test),
--       saved results, letterhead / pathologist settings, delivery log,
--       and the structured-report columns on report_documents.
-- ======================================================================
SET search_path TO lab_demo, public;

-- ---------- report format of a test ----------
CREATE TABLE IF NOT EXISTS test_parameters (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id        UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    section_name   VARCHAR(100) NOT NULL DEFAULT '',
    name           VARCHAR(200) NOT NULL,
    unit           VARCHAR(40),
    method         VARCHAR(120),
    result_type    VARCHAR(10) NOT NULL DEFAULT 'Auto',   -- Auto | Number | Text
    decimal_places SMALLINT,
    sort_order     INT NOT NULL DEFAULT 0,
    is_bold        BOOLEAN NOT NULL DEFAULT false,
    status         record_status NOT NULL DEFAULT 'Active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_test_parameters_test_sort ON test_parameters (test_id, sort_order);

DROP TRIGGER IF EXISTS trg_test_parameters_updated_at ON test_parameters;
CREATE TRIGGER trg_test_parameters_updated_at
BEFORE UPDATE ON test_parameters
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS test_reference_ranges (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_id   UUID NOT NULL REFERENCES test_parameters(id) ON DELETE CASCADE,
    gender         gender_type,            -- NULL = any gender
    age_min_days   INT,                    -- NULL = no lower age limit
    age_max_days   INT,                    -- NULL = no upper age limit
    low_value      NUMERIC(14,4),
    high_value     NUMERIC(14,4),
    critical_low   NUMERIC(14,4),
    critical_high  NUMERIC(14,4),
    normal_text    VARCHAR(100),
    display_text   VARCHAR(150) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_param ON test_reference_ranges (parameter_id);

-- ---------- saved results of a report ----------
CREATE TABLE IF NOT EXISTS report_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_document_id  UUID NOT NULL REFERENCES report_documents(id) ON DELETE CASCADE,
    parameter_id        UUID NOT NULL REFERENCES test_parameters(id),
    section_name        VARCHAR(100) NOT NULL DEFAULT '',
    parameter_name      VARCHAR(200) NOT NULL,
    unit                VARCHAR(40),
    reference_text      VARCHAR(150),
    sort_order          INT NOT NULL DEFAULT 0,
    result_value        VARCHAR(200),
    result_numeric      NUMERIC(14,4),
    flag                VARCHAR(10) NOT NULL DEFAULT 'Normal',   -- Normal | Low | High | Critical
    remarks             TEXT,
    entered_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_results_doc_param ON report_results (report_document_id, parameter_id);
CREATE INDEX IF NOT EXISTS idx_report_results_doc_sort ON report_results (report_document_id, sort_order);

DROP TRIGGER IF EXISTS trg_report_results_updated_at ON report_results;
CREATE TRIGGER trg_report_results_updated_at
BEFORE UPDATE ON report_results
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- letterhead / pathologist settings (branch_id NULL = lab default) ----------
CREATE TABLE IF NOT EXISTS lab_report_settings (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id                   UUID REFERENCES branches(id) ON DELETE CASCADE,
    use_letterhead              BOOLEAN NOT NULL DEFAULT true,
    header_html                 TEXT,
    footer_html                 TEXT,
    header_space_mm             SMALLINT NOT NULL DEFAULT 40,
    footer_space_mm             SMALLINT NOT NULL DEFAULT 30,
    pathologist_name            VARCHAR(150),
    pathologist_qualification   VARCHAR(200),
    registration_no             VARCHAR(60),
    signature_image             TEXT,
    updated_by                  UUID REFERENCES users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lab_report_settings_branch
    ON lab_report_settings (COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));

DROP TRIGGER IF EXISTS trg_lab_report_settings_updated_at ON lab_report_settings;
CREATE TRIGGER trg_lab_report_settings_updated_at
BEFORE UPDATE ON lab_report_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- print / download / WhatsApp log ----------
CREATE TABLE IF NOT EXISTS report_deliveries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_document_id  UUID NOT NULL REFERENCES report_documents(id) ON DELETE CASCADE,
    channel             VARCHAR(10) NOT NULL,                 -- Print | Pdf | WhatsApp
    sent_to             VARCHAR(20),
    status              VARCHAR(10) NOT NULL DEFAULT 'Done',
    error_message       TEXT,
    delivered_by        UUID REFERENCES users(id),
    delivered_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_doc ON report_deliveries (report_document_id);

-- ---------- structured-report columns on report_documents ----------
ALTER TABLE report_documents
    ADD COLUMN IF NOT EXISTS use_letterhead      BOOLEAN,
    ADD COLUMN IF NOT EXISTS sample_collected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reported_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by         UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS pdf_generated_at    TIMESTAMPTZ;

-- ---------- picks the matching range for a gender / age ----------
CREATE OR REPLACE FUNCTION get_reference_range(p_parameter UUID, p_gender gender_type, p_age_days INT)
RETURNS SETOF test_reference_ranges
LANGUAGE sql STABLE AS $$
    SELECT r.*
    FROM test_reference_ranges r
    WHERE r.parameter_id = p_parameter
      AND (r.gender IS NULL OR (p_gender IS NOT NULL AND r.gender = p_gender))
      AND (r.age_min_days IS NULL OR p_age_days IS NULL OR p_age_days >= r.age_min_days)
      AND (r.age_max_days IS NULL OR p_age_days IS NULL OR p_age_days <= r.age_max_days)
    ORDER BY (r.gender IS NOT NULL) DESC, (r.age_min_days IS NOT NULL) DESC
    LIMIT 1;
$$;

-- ---------- starter format: CBC (adult ranges; verify with your pathologist) ----------
-- Only runs for a CBC test that has NO parameters yet. Edit anything later
-- from the "Test Formats" screen.
DO $$
DECLARE
    t_id UUID;
    p_id UUID;
    r    RECORD;
BEGIN
    FOR t_id IN SELECT id FROM tests WHERE name ILIKE 'CBC%' LOOP
        IF EXISTS (SELECT 1 FROM test_parameters WHERE test_id = t_id) THEN
            CONTINUE;
        END IF;

        FOR r IN
            SELECT * FROM (VALUES
              -- sort, section,               name,                 unit,         dec, bold, m_lo,   m_hi,    f_lo,   f_hi,    crit_lo, crit_hi
              (10, 'HAEMOGLOBIN',           'Haemoglobin (Hb)',    'g/dL',        1, true,  13.0,    17.0,    12.0,   15.0,    7.0,     20.0),
              (20, 'RED BLOOD CELLS',       'Total RBC Count',     'million/cumm',2, false, 4.5,     5.5,     3.8,    4.8,     NULL,    NULL),
              (30, 'RED BLOOD CELLS',       'PCV / Haematocrit',   '%',           1, false, 40.0,    50.0,    36.0,   46.0,    NULL,    NULL),
              (40, 'RED CELL INDICES',      'MCV',                 'fL',          1, false, 83.0,    101.0,   83.0,   101.0,   NULL,    NULL),
              (50, 'RED CELL INDICES',      'MCH',                 'pg',          1, false, 27.0,    32.0,    27.0,   32.0,    NULL,    NULL),
              (60, 'RED CELL INDICES',      'MCHC',                'g/dL',        1, false, 31.5,    34.5,    31.5,   34.5,    NULL,    NULL),
              (70, 'RED CELL INDICES',      'RDW-CV',              '%',           1, false, 11.6,    14.0,    11.6,   14.0,    NULL,    NULL),
              (80, 'WHITE BLOOD CELLS',     'Total WBC Count',     '/cumm',       0, true,  4000.0,  11000.0, 4000.0, 11000.0, 2000.0,  30000.0),
              (90, 'DIFFERENTIAL COUNT',    'Neutrophils',         '%',           0, false, 40.0,    80.0,    40.0,   80.0,    NULL,    NULL),
              (100,'DIFFERENTIAL COUNT',    'Lymphocytes',         '%',           0, false, 20.0,    40.0,    20.0,   40.0,    NULL,    NULL),
              (110,'DIFFERENTIAL COUNT',    'Monocytes',           '%',           0, false, 2.0,     10.0,    2.0,    10.0,    NULL,    NULL),
              (120,'DIFFERENTIAL COUNT',    'Eosinophils',         '%',           0, false, 1.0,     6.0,     1.0,    6.0,     NULL,    NULL),
              (130,'DIFFERENTIAL COUNT',    'Basophils',           '%',           0, false, 0.0,     2.0,     0.0,    2.0,     NULL,    NULL),
              (140,'PLATELETS',             'Platelet Count',      '/cumm',       0, true,  150000.0,410000.0,150000.0,410000.0,20000.0,1000000.0)
            ) AS v(sort_order, section_name, name, unit, dp, is_bold, m_lo, m_hi, f_lo, f_hi, c_lo, c_hi)
        LOOP
            INSERT INTO test_parameters (test_id, section_name, name, unit, result_type, decimal_places, sort_order, is_bold)
            VALUES (t_id, r.section_name, r.name, r.unit, 'Number', r.dp::smallint, r.sort_order, r.is_bold)
            RETURNING id INTO p_id;

            IF r.m_lo = r.f_lo AND r.m_hi = r.f_hi THEN
                INSERT INTO test_reference_ranges
                    (parameter_id, gender, low_value, high_value, critical_low, critical_high, display_text)
                VALUES (p_id, NULL, r.m_lo, r.m_hi, r.c_lo, r.c_hi,
                        trim(trailing '.' FROM trim(trailing '0' FROM r.m_lo::text)) || ' - ' ||
                        trim(trailing '.' FROM trim(trailing '0' FROM r.m_hi::text)));
            ELSE
                INSERT INTO test_reference_ranges
                    (parameter_id, gender, low_value, high_value, critical_low, critical_high, display_text)
                VALUES
                    (p_id, 'Male',   r.m_lo, r.m_hi, r.c_lo, r.c_hi, r.m_lo::numeric(14,1)::text || ' - ' || r.m_hi::numeric(14,1)::text),
                    (p_id, 'Female', r.f_lo, r.f_hi, r.c_lo, r.c_hi, r.f_lo::numeric(14,1)::text || ' - ' || r.f_hi::numeric(14,1)::text);
            END IF;
        END LOOP;
    END LOOP;
END $$;
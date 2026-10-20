-- ======================================================================
-- 014_blood_report_formats.sql
-- Run BEFORE 015_blood_report_machine_chemical.sql.
-- Replace lab_demo with your tenant schema. Safe to re-run.
-- Adds: test parameters + reference ranges (report format per test; the actual
--       formats are seeded by 017_seed_all_blood_test_formats.sql),
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

-- NOTE: no sample test formats are seeded here any more.
-- Test formats (parameters + normal ranges) come from 017_seed_all_blood_test_formats.sql.
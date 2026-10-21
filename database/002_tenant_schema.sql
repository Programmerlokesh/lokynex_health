-- =====================================================================
-- 002_tenant_schema.sql                              (Lokynex Health)
--
-- The complete schema of ONE lab (schema-per-tenant). Run once per lab,
-- with the search_path pointing at that lab's schema:
--
--     CREATE SCHEMA lab_demo;
--     SET search_path TO lab_demo, public;
--     \i 002_tenant_schema.sql
--
-- (tenant provisioning in the backend does exactly this for every new lab).
-- Needs 001_platform.sql first: doctors / referrals are global and live in
-- `platform`, so the foreign keys below point there.
-- Safe to re-run on an existing lab: it only creates what is missing.
-- Then run 003_departments_and_tests.sql to load the test catalog.
-- =====================================================================

-- ---------- ENUMS ----------
DO $$
DECLARE e RECORD;
BEGIN
    FOR e IN SELECT * FROM (VALUES
        ('record_status',          $v$'Active', 'Inactive'$v$),
        ('gender_type',            $v$'Male', 'Female', 'Other'$v$),
        ('commission_type',        $v$'Flat', 'Percentage'$v$),
        ('discount_type',          $v$'Flat', 'Percentage'$v$),
        ('payment_method_type',    $v$'Cash', 'Card', 'UPI'$v$),
        ('payment_status_type',    $v$'Open', 'Partial', 'Paid'$v$),
        ('commission_entity_type', $v$'Doctor', 'Referral', 'Technician'$v$),
        ('commission_status_type', $v$'Paid', 'Unpaid'$v$),
        ('report_status_type',     $v$'Pending', 'Uploaded'$v$),
        ('booking_status_type',    $v$'Booked', 'Cancelled', 'Completed'$v$),
        ('report_source_type',     $v$'Manual', 'UploadedDocument'$v$)
    ) AS x(n, labels)
    LOOP
        BEGIN
            EXECUTE format('CREATE TYPE %I AS ENUM (%s)', e.n, e.labels);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END LOOP;
END $$;

-- ---------- BRANCHES, ROLES, USERS ----------
CREATE TABLE IF NOT EXISTS branches (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_name             VARCHAR(150) NOT NULL,
    branch_code             VARCHAR(20)  UNIQUE NOT NULL,
    branch_address          TEXT,
    branch_pincode          VARCHAR(10),
    branch_phone            VARCHAR(20),
    branch_email            CITEXT,
    created_by_super_admin  BOOLEAN NOT NULL DEFAULT false,  -- true = created at onboarding (locked from Lab Admin edit)
    is_main                 BOOLEAN NOT NULL DEFAULT false,  -- the lab's main branch (id = platform.tenants.id)
    status                  record_status NOT NULL DEFAULT 'Active',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
    id              SMALLINT PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(150) NOT NULL,
    username             VARCHAR(100) UNIQUE NOT NULL,
    email                CITEXT UNIQUE NOT NULL,
    phone                VARCHAR(20) NOT NULL,
    address              TEXT,
    pincode              VARCHAR(10),
    profile_picture_url  TEXT,
    branch_id            UUID REFERENCES branches(id),
    role_id              UUID REFERENCES roles(id),
    password_hash        VARCHAR(255) NOT NULL,
    status               record_status NOT NULL DEFAULT 'Active',
    created_by           UUID REFERENCES users(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by           UUID REFERENCES users(id),
    updated_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_phone     ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_status    ON users (status);

ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS user_module_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id       SMALLINT NOT NULL REFERENCES modules(id),
    can_view        BOOLEAN NOT NULL DEFAULT true,
    can_create      BOOLEAN NOT NULL DEFAULT false,
    can_edit        BOOLEAN NOT NULL DEFAULT false,
    can_delete      BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (user_id, module_id)
);

-- ---------- DEPARTMENTS & TESTS ----------
CREATE TABLE IF NOT EXISTS departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) UNIQUE NOT NULL,
    status          record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tests (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id                   UUID NOT NULL REFERENCES departments(id),
    name                            VARCHAR(200) NOT NULL,
    price                           NUMERIC(10,2) NOT NULL,
    doctor_commission_type          commission_type NOT NULL DEFAULT 'Flat',
    doctor_commission_value         NUMERIC(10,2) NOT NULL DEFAULT 0,
    referral_commission_type        commission_type NOT NULL DEFAULT 'Flat',
    referral_commission_value       NUMERIC(10,2) NOT NULL DEFAULT 0,
    technician_commission_type      commission_type NOT NULL DEFAULT 'Flat',
    technician_commission_value     NUMERIC(10,2) NOT NULL DEFAULT 0,
    status                          record_status NOT NULL DEFAULT 'Active',
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ,
    UNIQUE (department_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tests_department ON tests (department_id);

-- ---------- TECHNICIANS (branch scoped; doctors / referrals are global in `platform`) ----------
CREATE TABLE IF NOT EXISTS technicians (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    email           CITEXT,
    address         TEXT,
    whatsapp_number VARCHAR(20),
    status          record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
-- labs created before WhatsApp numbers existed: add the column (no-op when present)
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_technicians_branch    ON technicians (branch_id);
CREATE INDEX IF NOT EXISTS idx_technicians_name_trgm ON technicians USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_technicians_phone     ON technicians (phone);

-- Per-lab edits / hiding of the global doctor + referral registry; the *_effective views merge both.
CREATE TABLE IF NOT EXISTS doctor_lab_overrides (
    doctor_id       UUID PRIMARY KEY REFERENCES platform.doctors(id) ON DELETE CASCADE,
    has_edits       BOOLEAN NOT NULL DEFAULT false,   -- true = the columns below are this lab's version
    full_name       VARCHAR(150),
    phone           VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email           CITEXT,
    address         TEXT,
    specialization  VARCHAR(150),
    status          platform.record_status,           -- NULL = follow the global status
    is_hidden       BOOLEAN NOT NULL DEFAULT false,   -- removed from THIS lab's list only
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS referral_lab_overrides (
    referral_id     UUID PRIMARY KEY REFERENCES platform.referrals(id) ON DELETE CASCADE,
    has_edits       BOOLEAN NOT NULL DEFAULT false,
    full_name       VARCHAR(150),
    phone           VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email           CITEXT,
    address         TEXT,
    status          platform.record_status,
    is_hidden       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE OR REPLACE VIEW doctors_effective AS
SELECT d.id,
       CASE WHEN o.has_edits THEN o.full_name       ELSE d.full_name       END AS full_name,
       CASE WHEN o.has_edits THEN o.phone           ELSE d.phone           END AS phone,
       CASE WHEN o.has_edits THEN o.whatsapp_number ELSE d.whatsapp_number END AS whatsapp_number,
       CASE WHEN o.has_edits THEN o.email           ELSE d.email           END AS email,
       CASE WHEN o.has_edits THEN o.address         ELSE d.address         END AS address,
       CASE WHEN o.has_edits THEN o.specialization  ELSE d.specialization  END AS specialization,
       COALESCE(o.status, d.status)                                           AS status,
       COALESCE(o.is_hidden, false)                                           AS is_hidden,
       d.created_at,
       COALESCE(o.updated_at, d.updated_at)                                   AS updated_at
FROM platform.doctors d
LEFT JOIN doctor_lab_overrides o ON o.doctor_id = d.id;

CREATE OR REPLACE VIEW referrals_effective AS
SELECT r.id,
       CASE WHEN o.has_edits THEN o.full_name       ELSE r.full_name       END AS full_name,
       CASE WHEN o.has_edits THEN o.phone           ELSE r.phone           END AS phone,
       CASE WHEN o.has_edits THEN o.whatsapp_number ELSE r.whatsapp_number END AS whatsapp_number,
       CASE WHEN o.has_edits THEN o.email           ELSE r.email           END AS email,
       CASE WHEN o.has_edits THEN o.address         ELSE r.address         END AS address,
       COALESCE(o.status, r.status)                                           AS status,
       COALESCE(o.is_hidden, false)                                           AS is_hidden,
       r.created_at,
       COALESCE(o.updated_at, r.updated_at)                                   AS updated_at
FROM platform.referrals r
LEFT JOIN referral_lab_overrides o ON o.referral_id = r.id;

-- ---------- PATIENTS ----------
CREATE TABLE IF NOT EXISTS patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code        VARCHAR(30) UNIQUE NOT NULL,
    full_name           VARCHAR(150) NOT NULL DEFAULT '',   -- family GUARDIAN's name
    phone               VARCHAR(20) NOT NULL,
    age                 INT,
    gender              gender_type,
    address             TEXT,
    email               CITEXT,
    whatsapp_number     VARCHAR(20),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_patients_phone         ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_phone_prefix  ON patients (phone varchar_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm ON patients USING gin (full_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS patient_relatives (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    age             INT,
    relationship    VARCHAR(50),
    gender          gender_type,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_relatives_name_trgm ON patient_relatives USING gin (name gin_trgm_ops);

-- ---------- ORDERS ----------
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(30) UNIQUE NOT NULL DEFAULT ('ORD-' || nextval('order_number_seq')::text),
    patient_id          UUID NOT NULL REFERENCES patients(id),
    relative_id         UUID REFERENCES patient_relatives(id),
    branch_id           UUID NOT NULL REFERENCES branches(id),
    doctor_id           UUID REFERENCES platform.doctors(id),
    referral_id         UUID REFERENCES platform.referrals(id),

    discount_type       discount_type NOT NULL DEFAULT 'Flat',
    discount_value      NUMERIC(10,2) NOT NULL DEFAULT 0,
    gross_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,   -- sum of order_items.price
    final_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,   -- gross - discount (0 if complimentary)

    is_complimentary    BOOLEAN NOT NULL DEFAULT false,
    payment_method      payment_method_type,
    payment_status      payment_status_type NOT NULL DEFAULT 'Open',
    paid_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,

    is_deleted          BOOLEAN NOT NULL DEFAULT false,     -- "Deleted List"
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id),
    deleted_by_name     VARCHAR(150),                       -- the Lab Admin has no users row, so the name is kept

    created_by          UUID REFERENCES users(id),          -- NULL when the Lab Admin created it
    created_by_name     VARCHAR(150),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES users(id),
    updated_by_name     VARCHAR(150),
    updated_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_branch         ON orders (branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient        ON orders (patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_doctor         ON orders (doctor_id);
CREATE INDEX IF NOT EXISTS idx_orders_referral       ON orders (referral_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted     ON orders (is_deleted);
CREATE INDEX IF NOT EXISTS idx_orders_live_created   ON orders (created_at DESC, id DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at     ON orders (deleted_at DESC, id DESC) WHERE is_deleted = true;

CREATE TABLE IF NOT EXISTS order_items (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    test_id                         UUID NOT NULL REFERENCES tests(id),
    technician_id                   UUID REFERENCES technicians(id),
    price                           NUMERIC(10,2) NOT NULL,   -- tests.price at order time
    doctor_commission_enabled       BOOLEAN NOT NULL DEFAULT false,
    doctor_commission_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
    referral_commission_enabled     BOOLEAN NOT NULL DEFAULT false,
    referral_commission_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    technician_commission_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    report_status                   report_status_type NOT NULL DEFAULT 'Pending',
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- doctor and referral commission are mutually exclusive per test line
    CONSTRAINT chk_commission_exclusive CHECK (NOT (doctor_commission_enabled AND referral_commission_enabled))
);
CREATE INDEX IF NOT EXISTS idx_order_items_order      ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_test       ON order_items (test_id);
CREATE INDEX IF NOT EXISTS idx_order_items_technician ON order_items (technician_id);

CREATE TABLE IF NOT EXISTS order_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL,
    payment_method  payment_method_type NOT NULL,
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by     UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_order_payments_order        ON order_payments (order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_method_order ON order_payments (payment_method, order_id);

-- who changed an order and when (edit / delete / restore)
CREATE TABLE IF NOT EXISTS order_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    changed_by      UUID REFERENCES users(id),          -- NULL when the Lab Admin made the change
    changed_by_name VARCHAR(150),
    action          VARCHAR(20) NOT NULL DEFAULT 'Edit', -- Edit | Delete | Restore
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    change_summary  TEXT,
    old_values      JSONB,
    new_values      JSONB
);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order         ON order_audit_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_changed ON order_audit_logs (order_id, changed_at DESC);

-- ---------- REPORT BUILDER (templates + editable per-order reports) ----------
CREATE TABLE IF NOT EXISTS report_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    department_id       UUID REFERENCES departments(id),
    header_content      TEXT,
    footer_content      TEXT,
    body_content        TEXT,
    source_type         report_source_type NOT NULL DEFAULT 'Manual',
    original_file_path  VARCHAR(500),
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES users(id),
    updated_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_deleted ON report_templates (is_deleted);

CREATE TABLE IF NOT EXISTS report_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id       UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    template_id         UUID REFERENCES report_templates(id),
    header_content      TEXT,
    footer_content      TEXT,
    body_content        TEXT,
    source_type         report_source_type NOT NULL DEFAULT 'Manual',
    original_file_path  VARCHAR(500),
    exported_file_path  VARCHAR(500),
    -- structured (blood) report
    use_letterhead      BOOLEAN,
    sample_collected_at TIMESTAMPTZ,
    reported_at         TIMESTAMPTZ,
    verified_by         UUID REFERENCES users(id),
    pdf_generated_at    TIMESTAMPTZ,
    specimen            VARCHAR(120),
    method_text         VARCHAR(200),
    machine_name        VARCHAR(150),
    reagent_name        VARCHAR(200),
    sample_id           VARCHAR(40),
    report_remarks      TEXT,
    public_token        VARCHAR(40),                      -- QR code link of the report
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES users(id),
    updated_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_report_documents_order_item ON report_documents (order_item_id);
CREATE INDEX IF NOT EXISTS idx_report_documents_is_deleted ON report_documents (is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_documents_public_token
    ON report_documents (public_token) WHERE public_token IS NOT NULL;

-- ---------- TEST REPORT FORMATS (parameters + normal ranges) ----------
CREATE TABLE IF NOT EXISTS test_parameters (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id        UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    section_name   VARCHAR(100) NOT NULL DEFAULT '',
    name           VARCHAR(200) NOT NULL,
    unit           VARCHAR(40),
    method         VARCHAR(120),
    result_type    VARCHAR(10) NOT NULL DEFAULT 'Auto',   -- Auto | Numeric | Text
    decimal_places SMALLINT,
    sort_order     INT NOT NULL DEFAULT 0,
    is_bold        BOOLEAN NOT NULL DEFAULT false,
    status         record_status NOT NULL DEFAULT 'Active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_test_parameters_test_sort ON test_parameters (test_id, sort_order);

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

-- default specimen / method / machine / reagent per test (set once, reused on the next report)
CREATE TABLE IF NOT EXISTS test_report_info (
    test_id         UUID PRIMARY KEY REFERENCES tests(id) ON DELETE CASCADE,
    specimen        VARCHAR(120),
    method          VARCHAR(200),
    machine_name    VARCHAR(150),
    reagent_name    VARCHAR(200),
    interpretation  TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- letterhead / pathologist settings (branch_id NULL = lab default)
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
-- Per-department report pad (department_id NULL = lab default pad)
ALTER TABLE lab_report_settings
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE CASCADE;
DROP INDEX IF EXISTS uq_lab_report_settings_branch;
CREATE UNIQUE INDEX IF NOT EXISTS uq_lab_report_settings_branch_dept
    ON lab_report_settings (COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid),
                            COALESCE(department_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- print / download / WhatsApp log
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

-- pick-list of machines (analysers) and reagents; categories = which test groups show it
CREATE TABLE IF NOT EXISTS report_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind        VARCHAR(10)  NOT NULL CHECK (kind IN ('Machine', 'Reagent')),
    name        VARCHAR(200) NOT NULL,
    categories  VARCHAR(200),                -- NULL = shown for every test
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_options_kind_name ON report_options (kind, lower(name));

-- picks the matching range for a gender / age
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

-- ---------- COMMISSIONS ----------
CREATE TABLE IF NOT EXISTS commission_overrides (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type         commission_entity_type NOT NULL,
    doctor_id           UUID REFERENCES platform.doctors(id),
    referral_id         UUID REFERENCES platform.referrals(id),
    technician_id       UUID REFERENCES technicians(id),
    department_id       UUID REFERENCES departments(id),
    test_id             UUID NOT NULL REFERENCES tests(id),
    commission_type     commission_type NOT NULL,
    commission_value    NUMERIC(10,2) NOT NULL,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_commission_override_entity CHECK (num_nonnulls(doctor_id, referral_id, technician_id) = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_commission_override_doctor     ON commission_overrides (doctor_id, test_id)     WHERE doctor_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_commission_override_referral   ON commission_overrides (referral_id, test_id)   WHERE referral_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_commission_override_technician ON commission_overrides (technician_id, test_id) WHERE technician_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS commission_payouts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type         commission_entity_type NOT NULL,
    doctor_id           UUID REFERENCES platform.doctors(id),
    referral_id         UUID REFERENCES platform.referrals(id),
    technician_id       UUID REFERENCES technicians(id),
    order_item_id       UUID NOT NULL REFERENCES order_items(id),
    branch_id           UUID REFERENCES branches(id),
    commission_amount   NUMERIC(10,2) NOT NULL,
    status              commission_status_type NOT NULL DEFAULT 'Unpaid',
    paid_at             TIMESTAMPTZ,
    paid_by             UUID REFERENCES users(id),
    generated_by        UUID REFERENCES users(id),
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_commission_payout_entity CHECK (num_nonnulls(doctor_id, referral_id, technician_id) = 1)
);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_doctor     ON commission_payouts (doctor_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_referral   ON commission_payouts (referral_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_technician ON commission_payouts (technician_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status     ON commission_payouts (status);

-- ---------- LEDGER / P&L ----------
CREATE TABLE IF NOT EXISTS ledger_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID REFERENCES branches(id),
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_type      VARCHAR(30) NOT NULL,     -- Income / Expense / CommissionPayout / Refund
    reference_table VARCHAR(50),
    reference_id    UUID,
    amount          NUMERIC(12,2) NOT NULL,
    description     TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_branch_date ON ledger_entries (branch_id, entry_date);

-- ---------- DOCTOR CLINIC ----------
CREATE TABLE IF NOT EXISTS doctor_clinic_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    doctor_id       UUID NOT NULL REFERENCES platform.doctors(id),
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),   -- 0 = Sunday
    slot_minutes    INT NOT NULL,
    time_from       TIME NOT NULL,
    time_to         TIME NOT NULL,
    max_patients    INT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    UNIQUE (branch_id, doctor_id, day_of_week, time_from)
);

CREATE TABLE IF NOT EXISTS doctor_clinic_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id     UUID REFERENCES doctor_clinic_schedules(id),
    doctor_id       UUID NOT NULL REFERENCES platform.doctors(id),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    booking_date    DATE NOT NULL,
    time_slot       TIME NOT NULL,
    serial_no       INT,                                 -- 1, 2, 3 ... per doctor + branch + day
    patient_name    VARCHAR(150) NOT NULL,
    patient_phone   VARCHAR(20) NOT NULL,
    patient_email   CITEXT,
    note            TEXT,                                -- reason for visit
    visit_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method  payment_method_type,                 -- NULL when visit_fee = 0
    status          booking_status_type NOT NULL DEFAULT 'Booked',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doctor_clinic_bookings_doctor_date ON doctor_clinic_bookings (doctor_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_doctor_clinic_bookings_branch_date ON doctor_clinic_bookings (branch_id, booking_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_clinic_bookings_serial
    ON doctor_clinic_bookings (doctor_id, branch_id, booking_date, serial_no) WHERE serial_no IS NOT NULL;

-- ---------- updated_at triggers ----------
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['branches', 'users', 'tests', 'technicians', 'patients', 'orders',
                             'report_templates', 'report_documents', 'test_parameters', 'report_results',
                             'lab_report_settings', 'doctor_clinic_schedules']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$I', t);
        EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I
                        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
    END LOOP;
END $$;

-- ---------- starting data ----------
INSERT INTO modules (id, name) VALUES
    (1,  'Users'),
    (2,  'Branches'),
    (3,  'DepartmentsAndTests'),
    (4,  'NewOrder'),
    (5,  'OrderListAndReports'),
    (6,  'CommissionSetup'),
    (7,  'Ledger'),
    (8,  'Commission'),
    (9,  'DoctorReferralTechnician'),
    (10, 'DoctorClinic')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (name, description) VALUES
    ('LabAdmin',     'Full access within the lab tenant'),
    ('Receptionist', 'Creates orders, registers patients, collects payment'),
    ('Technician',   'Performs tests, uploads reports'),
    ('Accountant',   'Views ledger, commissions, and payment reports')
ON CONFLICT (name) DO NOTHING;

-- Machines / reagents offered on the report screen (labs can add their own)
INSERT INTO report_options (kind, name, categories)
SELECT v.kind, v.name, v.categories
FROM (VALUES
    ('Machine', 'Abbott Architect c4000',                  'Biochemistry'),
    ('Machine', 'Abbott Architect i1000SR',                'Immunoassay'),
    ('Machine', 'Beckman Coulter Access 2',                'Immunoassay'),
    ('Machine', 'Beckman Coulter DxH 520',                 'Haematology'),
    ('Machine', 'Bio-Rad D-10 (HbA1c)',                    'HbA1c'),
    ('Machine', 'Erba Chem 5X',                            'Biochemistry'),
    ('Machine', 'Erba ECL 105 (Coagulometer)',             'Coagulation'),
    ('Machine', 'Erba H 360',                              'Haematology'),
    ('Machine', 'Erba H 560',                              'Haematology'),
    ('Machine', 'Erba LisaScan II (ELISA reader)',         'Serology'),
    ('Machine', 'Horiba Micros 60',                        'Haematology'),
    ('Machine', 'Horiba Yumizen H500',                     'Haematology'),
    ('Machine', 'Manual method',                           NULL),
    ('Machine', 'Medica EasyLyte (ISE)',                   'Biochemistry'),
    ('Machine', 'Mindray BC-3000 Plus',                    'Haematology'),
    ('Machine', 'Mindray BC-5000',                         'Haematology'),
    ('Machine', 'Mindray BC-5150',                         'Haematology'),
    ('Machine', 'Mindray BC-6000',                         'Haematology'),
    ('Machine', 'Mindray BS-200E',                         'Biochemistry'),
    ('Machine', 'Mindray BS-240',                          'Biochemistry'),
    ('Machine', 'Mindray CL-900i',                         'Immunoassay'),
    ('Machine', 'Rapid card test (manual)',                'Serology'),
    ('Machine', 'Roche Cobas 6000',                        'Biochemistry,Immunoassay,HbA1c'),
    ('Machine', 'Roche Cobas c311',                        'Biochemistry,HbA1c'),
    ('Machine', 'Roche Cobas e411',                        'Immunoassay'),
    ('Machine', 'Siemens Atellica',                        'Biochemistry,Immunoassay'),
    ('Machine', 'Siemens Immulite 1000',                   'Immunoassay'),
    ('Machine', 'Snibe Maglumi 800',                       'Immunoassay'),
    ('Machine', 'Snibe Maglumi X3',                        'Immunoassay'),
    ('Machine', 'Stago STA Compact Max (Coagulometer)',    'Coagulation'),
    ('Machine', 'Stago Start 4 (Coagulometer)',            'Coagulation'),
    ('Machine', 'Sysmex XN-1000',                          'Haematology'),
    ('Machine', 'Sysmex XN-350',                           'Haematology'),
    ('Machine', 'Sysmex XN-550',                           'Haematology'),
    ('Machine', 'Sysmex XP-100',                           'Haematology'),
    ('Machine', 'Tosoh AIA-360',                           'Immunoassay'),
    ('Machine', 'Tosoh G8 (HbA1c)',                        'HbA1c'),
    ('Machine', 'Transasia EM 200',                        'Biochemistry'),
    ('Machine', 'Transasia XL-640',                        'Biochemistry'),
    ('Machine', 'Vitros ECi',                              'Immunoassay'),
    ('Reagent', 'Abbott Architect reagents',               'Biochemistry,Immunoassay'),
    ('Reagent', 'Agappe Diagnostics reagents',             'Biochemistry'),
    ('Reagent', 'Beckman Access reagents',                 'Immunoassay'),
    ('Reagent', 'Beckman Coulter DxH reagents',            'Haematology'),
    ('Reagent', 'Beckman Coulter reagents',                'Biochemistry,Immunoassay'),
    ('Reagent', 'Bio-Rad D-10 HbA1c reagent',              'HbA1c'),
    ('Reagent', 'Biorad reagents',                         'Immunoassay,HbA1c'),
    ('Reagent', 'Coral Clinical Systems reagents',         'Biochemistry,Serology'),
    ('Reagent', 'ELISA kit',                               'Serology'),
    ('Reagent', 'Erba Diluent / Lyse',                     'Haematology'),
    ('Reagent', 'Erba Mannheim reagents',                  'Biochemistry'),
    ('Reagent', 'Horiba ABX Diluent / Lyse',               'Haematology'),
    ('Reagent', 'J. Mitra kit',                            'Biochemistry,Serology'),
    ('Reagent', 'Manual kit',                              NULL),
    ('Reagent', 'Meril Diagnostics kit',                   'Biochemistry,Serology'),
    ('Reagent', 'Mindray CL series reagents',              'Immunoassay'),
    ('Reagent', 'Mindray M-30 series reagents',            'Haematology'),
    ('Reagent', 'Randox reagents',                         'Biochemistry'),
    ('Reagent', 'Rapid card kit',                          'Serology'),
    ('Reagent', 'Roche Cobas reagents',                    'Biochemistry,HbA1c'),
    ('Reagent', 'Roche Elecsys reagents',                  'Immunoassay'),
    ('Reagent', 'Siemens Immulite reagents',               'Immunoassay'),
    ('Reagent', 'Siemens reagents',                        'Biochemistry,Immunoassay,Coagulation'),
    ('Reagent', 'Snibe Maglumi reagents',                  'Immunoassay'),
    ('Reagent', 'Span Diagnostics kit',                    'Biochemistry,Serology'),
    ('Reagent', 'Span PT / APTT reagents',                 'Coagulation'),
    ('Reagent', 'Stago coagulation reagents',              'Coagulation'),
    ('Reagent', 'Sysmex Cellpack / Stromatolyser',         'Haematology'),
    ('Reagent', 'Tosoh AIA reagents',                      'Immunoassay'),
    ('Reagent', 'Tosoh G8 HbA1c reagent',                  'HbA1c'),
    ('Reagent', 'Transasia Autopak reagents',              'Biochemistry'),
    ('Reagent', 'Tulip Diagnostics kit',                   'Biochemistry,Serology'),
    ('Reagent', 'Tulip PT / APTT reagents',                'Coagulation'),
    ('Reagent', 'Widal antigen kit',                       'Serology')

) AS v(kind, name, categories)
ON CONFLICT DO NOTHING;
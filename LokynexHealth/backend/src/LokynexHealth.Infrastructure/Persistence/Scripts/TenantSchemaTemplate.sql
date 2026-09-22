-- =====================================================================
-- TENANT SCHEMA TEMPLATE — one physical copy of this structure per Lab
-- Maps to: LokynexHealthDbContext
--
-- HOW THIS IS APPLIED (per ADR 0004 — schema-per-tenant):
--   1. SuperAdmin creates a Lab -> a row lands in platform.tenants.
--   2. Provisioning job runs:  CREATE SCHEMA lab_<code>;
--   3. This script runs with search_path pointed at that schema:
--        SET search_path TO lab_<code>, public;
--      (every unqualified object below then lands inside lab_<code>)
--   4. The admin user (from platform.tenants.admin_*) and branches
--      (from platform.tenant_branches) are inserted into THIS schema's
--      `users` / `branches` tables to finish onboarding.
--
-- Requires 001_extensions.sql AND 002_platform_schema.sql to have already
-- run once on the database — this script has cross-schema FKs into
-- platform.doctors / platform.referrals (Doctor & Referral are shared
-- across every lab; see the note above the `technicians` table below).
-- =====================================================================

-- ---------- ENUMS (schema-scoped: land inside lab_<code>) ----------
CREATE TYPE record_status          AS ENUM ('Active', 'Inactive');
CREATE TYPE gender_type            AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE commission_type        AS ENUM ('Flat', 'Percentage');
CREATE TYPE discount_type          AS ENUM ('Flat', 'Percentage');
CREATE TYPE payment_method_type    AS ENUM ('Cash', 'Card', 'UPI');
CREATE TYPE payment_status_type    AS ENUM ('Open', 'Partial', 'Paid');
CREATE TYPE commission_entity_type AS ENUM ('Doctor', 'Referral', 'Technician');
CREATE TYPE commission_status_type AS ENUM ('Paid', 'Unpaid');
CREATE TYPE report_status_type     AS ENUM ('Pending', 'Uploaded');
CREATE TYPE booking_status_type    AS ENUM ('Booked', 'Cancelled', 'Completed');
CREATE TYPE report_source_type     AS ENUM ('Manual', 'UploadedDocument');

-- ---------- BRANCHES ----------
CREATE TABLE branches (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_name             VARCHAR(150) NOT NULL,
    branch_code             VARCHAR(20)  UNIQUE NOT NULL,
    branch_address          TEXT,
    branch_pincode          VARCHAR(10),
    branch_phone            VARCHAR(20),
    branch_email            CITEXT,
    created_by_super_admin  BOOLEAN NOT NULL DEFAULT false, -- true = provisioned at onboarding (locked from Lab Admin edit)
    status                  record_status NOT NULL DEFAULT 'Active',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ
);

CREATE TRIGGER trg_branches_updated_at
BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- ROLES & MODULE PERMISSIONS ----------
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) UNIQUE NOT NULL,   -- LabAdmin, Receptionist, Technician, Accountant, ...
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE modules (
    id              SMALLINT PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL
);

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
    (10, 'DoctorClinic');

-- ---------- USERS ----------
CREATE TABLE users (
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

CREATE INDEX idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX idx_users_phone     ON users (phone);
CREATE INDEX idx_users_status    ON users (status);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- users.branch_id needs users to exist first for its own audit column:
ALTER TABLE branches ADD COLUMN created_by UUID REFERENCES users(id);

-- user <-> module permission grid ("Permission for which module user access")
CREATE TABLE user_module_permissions (
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
CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) UNIQUE NOT NULL,
    status          record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tests (
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

CREATE INDEX idx_tests_department ON tests (department_id);

CREATE TRIGGER trg_tests_updated_at
BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- TECHNICIANS (tenant + branch scoped) ----------
-- NOTE: Doctor and Referral are NOT here. Per clarification they are
-- shared/global across every lab under the SuperAdmin, so they live in
-- platform.doctors / platform.referrals (see 002_platform_schema.sql).
-- Every FK below that points at a doctor or referral is a cross-schema
-- FK into `platform` — fully supported since both schemas sit in the
-- same physical database.
CREATE TABLE technicians (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),  -- technician is bound to one branch
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    email           CITEXT,
    address         TEXT,
    status          record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX idx_technicians_branch      ON technicians (branch_id);
CREATE INDEX idx_technicians_name_trgm   ON technicians USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_technicians_phone       ON technicians (phone);
CREATE TRIGGER trg_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- PATIENTS ----------
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code        VARCHAR(30) UNIQUE NOT NULL,   -- generated Patient ID
    phone               VARCHAR(20) NOT NULL,
    age                 INT,
    gender              gender_type,
    address             TEXT,
    email               CITEXT,
    whatsapp_number     VARCHAR(20),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);
CREATE INDEX idx_patients_phone ON patients (phone);
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- "Add patient" — family members registered under a primary patient
CREATE TABLE patient_relatives (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    age             INT,
    relationship    VARCHAR(50),
    gender          gender_type,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- ORDERS (New Order) ----------
CREATE SEQUENCE order_number_seq START 1;

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(30) UNIQUE NOT NULL DEFAULT ('ORD-' || nextval('order_number_seq')::text),
    patient_id          UUID NOT NULL REFERENCES patients(id),
    relative_id         UUID REFERENCES patient_relatives(id),
    branch_id           UUID NOT NULL REFERENCES branches(id),
    doctor_id           UUID REFERENCES platform.doctors(id),
    referral_id         UUID REFERENCES platform.referrals(id),

    discount_type       discount_type NOT NULL DEFAULT 'Flat',
    discount_value      NUMERIC(10,2) NOT NULL DEFAULT 0,
    gross_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,   -- sum of order_items.price before discount
    final_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,   -- app-calculated: gross - discount (0 if complimentary)

    is_complimentary    BOOLEAN NOT NULL DEFAULT false,     -- true zeroes final_amount & all commissions
    payment_method      payment_method_type,
    payment_status      payment_status_type NOT NULL DEFAULT 'Open',
    paid_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,

    is_deleted          BOOLEAN NOT NULL DEFAULT false,     -- powers the "Deleted List" view
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id),

    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES users(id),
    updated_at          TIMESTAMPTZ
);

CREATE INDEX idx_orders_branch         ON orders (branch_id);
CREATE INDEX idx_orders_patient        ON orders (patient_id);
CREATE INDEX idx_orders_doctor         ON orders (doctor_id);
CREATE INDEX idx_orders_referral       ON orders (referral_id);
CREATE INDEX idx_orders_payment_status ON orders (payment_status);
CREATE INDEX idx_orders_created_at     ON orders (created_at);
CREATE INDEX idx_orders_is_deleted     ON orders (is_deleted);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- test line items within an order
CREATE TABLE order_items (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    test_id                         UUID NOT NULL REFERENCES tests(id),
    technician_id                   UUID REFERENCES technicians(id),

    price                           NUMERIC(10,2) NOT NULL,  -- snapshot of tests.price at order time

    doctor_commission_enabled       BOOLEAN NOT NULL DEFAULT false,
    doctor_commission_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
    referral_commission_enabled     BOOLEAN NOT NULL DEFAULT false,
    referral_commission_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    technician_commission_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,

    report_status                   report_status_type NOT NULL DEFAULT 'Pending',
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- doctor commission and referral commission are mutually exclusive per test line
    CONSTRAINT chk_commission_exclusive CHECK (NOT (doctor_commission_enabled AND referral_commission_enabled))
);

CREATE INDEX idx_order_items_order       ON order_items (order_id);
CREATE INDEX idx_order_items_test        ON order_items (test_id);
CREATE INDEX idx_order_items_technician  ON order_items (technician_id);

-- ---------- REPORT BUILDER (templates + editable per-order reports) ----------
CREATE TABLE report_templates (
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

CREATE INDEX idx_report_templates_is_deleted ON report_templates (is_deleted);

CREATE TRIGGER trg_report_templates_updated_at
BEFORE UPDATE ON report_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE report_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id       UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    template_id         UUID REFERENCES report_templates(id),

    header_content      TEXT,
    footer_content      TEXT,
    body_content        TEXT,

    source_type         report_source_type NOT NULL DEFAULT 'Manual',
    original_file_path  VARCHAR(500),
    exported_file_path  VARCHAR(500),

    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id),

    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES users(id),
    updated_at          TIMESTAMPTZ
);

CREATE INDEX idx_report_documents_order_item ON report_documents (order_item_id);
CREATE INDEX idx_report_documents_is_deleted  ON report_documents (is_deleted);

CREATE TRIGGER trg_report_documents_updated_at
BEFORE UPDATE ON report_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE order_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL,
    payment_method  payment_method_type NOT NULL,
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by     UUID REFERENCES users(id)
);
CREATE INDEX idx_order_payments_order ON order_payments (order_id);

CREATE TABLE order_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    changed_by      UUID NOT NULL REFERENCES users(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    change_summary  TEXT,
    old_values      JSONB,
    new_values      JSONB
);
CREATE INDEX idx_order_audit_logs_order ON order_audit_logs (order_id);

-- ---------- COMMISSION SETUP ----------
CREATE TABLE commission_overrides (
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

    CONSTRAINT chk_commission_override_entity CHECK (
        num_nonnulls(doctor_id, referral_id, technician_id) = 1
    )
);
CREATE UNIQUE INDEX uq_commission_override_doctor     ON commission_overrides (doctor_id, test_id)     WHERE doctor_id IS NOT NULL;
CREATE UNIQUE INDEX uq_commission_override_referral   ON commission_overrides (referral_id, test_id)   WHERE referral_id IS NOT NULL;
CREATE UNIQUE INDEX uq_commission_override_technician ON commission_overrides (technician_id, test_id) WHERE technician_id IS NOT NULL;

-- ---------- COMMISSION PAYOUTS ----------
CREATE TABLE commission_payouts (
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

    CONSTRAINT chk_commission_payout_entity CHECK (
        num_nonnulls(doctor_id, referral_id, technician_id) = 1
    )
);
CREATE INDEX idx_commission_payouts_doctor     ON commission_payouts (doctor_id);
CREATE INDEX idx_commission_payouts_referral   ON commission_payouts (referral_id);
CREATE INDEX idx_commission_payouts_technician ON commission_payouts (technician_id);
CREATE INDEX idx_commission_payouts_status     ON commission_payouts (status);

-- ---------- LEDGER / P&L ----------
CREATE TABLE ledger_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID REFERENCES branches(id),
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_type      VARCHAR(30) NOT NULL,
    reference_table VARCHAR(50),
    reference_id    UUID,
    amount          NUMERIC(12,2) NOT NULL,
    description     TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_entries_branch_date ON ledger_entries (branch_id, entry_date);

-- ---------- DOCTOR CLINIC ----------
CREATE TABLE doctor_clinic_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    doctor_id       UUID NOT NULL REFERENCES platform.doctors(id),
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    slot_minutes    INT NOT NULL,
    time_from       TIME NOT NULL,
    time_to         TIME NOT NULL,
    max_patients    INT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    UNIQUE (branch_id, doctor_id, day_of_week, time_from)
);
CREATE TRIGGER trg_doctor_clinic_schedules_updated_at
BEFORE UPDATE ON doctor_clinic_schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE doctor_clinic_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id     UUID REFERENCES doctor_clinic_schedules(id),
    doctor_id       UUID NOT NULL REFERENCES platform.doctors(id),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    booking_date    DATE NOT NULL,
    time_slot       TIME NOT NULL,
    patient_name    VARCHAR(150) NOT NULL,
    patient_phone   VARCHAR(20) NOT NULL,
    patient_email   CITEXT,
    note            TEXT,
    status          booking_status_type NOT NULL DEFAULT 'Booked',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_clinic_bookings_doctor_date ON doctor_clinic_bookings (doctor_id, booking_date);
CREATE INDEX idx_doctor_clinic_bookings_branch_date ON doctor_clinic_bookings (branch_id, booking_date);
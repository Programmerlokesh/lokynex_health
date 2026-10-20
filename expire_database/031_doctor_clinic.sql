-- ======================================================================
-- 031_doctor_clinic.sql
-- Doctor Clinic module (separate from labs). Run ONCE against the database.
-- Every table lives in the `platform` schema and carries clinic_id, so one
-- physical schema safely serves any number of clinics. Safe to re-run.
-- ======================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- clinics (the doctor-clinic account SuperAdmin creates) ----------
CREATE TABLE IF NOT EXISTS platform.clinics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_code         VARCHAR(20)  NOT NULL UNIQUE,
    name                VARCHAR(150) NOT NULL,
    tagline             VARCHAR(200),
    address             TEXT         NOT NULL,
    phone               VARCHAR(20)  NOT NULL,
    email               VARCHAR(150) NOT NULL,
    pincode             VARCHAR(10)  NOT NULL,
    registration_no     VARCHAR(60),
    logo_url            TEXT,
    footer_note         VARCHAR(300),
    accent_color        VARCHAR(9)   NOT NULL DEFAULT '#0E7C86',
    admin_name          VARCHAR(150) NOT NULL,
    admin_phone         VARCHAR(20)  NOT NULL,
    admin_address       TEXT,
    admin_email         VARCHAR(150) NOT NULL,
    admin_username      VARCHAR(100) NOT NULL UNIQUE,
    admin_password_hash VARCHAR(255) NOT NULL,
    user_limit          INT          NOT NULL DEFAULT 5,
    status              VARCHAR(20)  NOT NULL DEFAULT 'Active'
                        CHECK (status IN ('Active','Inactive','Suspended')),
    created_by          UUID,
    created_by_name     VARCHAR(150),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);
DROP TRIGGER IF EXISTS trg_clinics_updated_at ON platform.clinics;
CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON platform.clinics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- clinic users (staff the clinic admin creates) ----------
CREATE TABLE IF NOT EXISTS platform.clinic_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id     UUID         NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    username      VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(150),
    phone         VARCHAR(20)  NOT NULL,
    role          VARCHAR(40)  NOT NULL,
    permissions   VARCHAR(1500) NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
    created_by    UUID,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic ON platform.clinic_users (clinic_id);
DROP TRIGGER IF EXISTS trg_clinic_users_updated_at ON platform.clinic_users;
CREATE TRIGGER trg_clinic_users_updated_at BEFORE UPDATE ON platform.clinic_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- doctors of the clinic ----------
CREATE TABLE IF NOT EXISTS platform.clinic_doctors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID         NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    full_name       VARCHAR(150) NOT NULL,
    qualification   VARCHAR(200),
    specialization  VARCHAR(150),
    registration_no VARCHAR(60),
    phone           VARCHAR(20),
    email           VARCHAR(150),
    status          VARCHAR(20)  NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_doctors_clinic ON platform.clinic_doctors (clinic_id, status);
DROP TRIGGER IF EXISTS trg_clinic_doctors_updated_at ON platform.clinic_doctors;
CREATE TRIGGER trg_clinic_doctors_updated_at BEFORE UPDATE ON platform.clinic_doctors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- chamber schedules ----------
CREATE TABLE IF NOT EXISTS platform.clinic_schedules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id    UUID     NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    doctor_id    UUID     NOT NULL REFERENCES platform.clinic_doctors(id) ON DELETE CASCADE,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    slot_minutes INT      NOT NULL CHECK (slot_minutes > 0),
    time_from    TIME     NOT NULL,
    time_to      TIME     NOT NULL,
    max_patients INT      NOT NULL CHECK (max_patients > 0),
    is_active    BOOLEAN  NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ,
    UNIQUE (clinic_id, doctor_id, day_of_week, time_from)
);
DROP TRIGGER IF EXISTS trg_clinic_schedules_updated_at ON platform.clinic_schedules;
CREATE TRIGGER trg_clinic_schedules_updated_at BEFORE UPDATE ON platform.clinic_schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- patients ----------
CREATE TABLE IF NOT EXISTS platform.clinic_patients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID         NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    age             INT,
    gender          VARCHAR(10),
    phone           VARCHAR(20)  NOT NULL,
    whatsapp_number VARCHAR(20),
    email           VARCHAR(150),
    address         TEXT,
    pincode         VARCHAR(10),
    last_visit_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_patients_phone ON platform.clinic_patients (clinic_id, phone);
CREATE INDEX IF NOT EXISTS idx_clinic_patients_name_trgm
    ON platform.clinic_patients USING gin (name gin_trgm_ops);
DROP TRIGGER IF EXISTS trg_clinic_patients_updated_at ON platform.clinic_patients;
CREATE TRIGGER trg_clinic_patients_updated_at BEFORE UPDATE ON platform.clinic_patients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- prescriptions ----------
CREATE TABLE IF NOT EXISTS platform.clinic_prescriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id             UUID         NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    rx_serial             INT          NOT NULL,
    rx_no                 VARCHAR(30)  NOT NULL,
    visit_date            DATE         NOT NULL,
    doctor_id             UUID         REFERENCES platform.clinic_doctors(id) ON DELETE SET NULL,
    doctor_name           VARCHAR(150) NOT NULL,
    doctor_qualification  VARCHAR(200),
    doctor_specialization VARCHAR(150),
    doctor_reg_no         VARCHAR(60),
    patient_id            UUID         REFERENCES platform.clinic_patients(id) ON DELETE SET NULL,
    patient_name          VARCHAR(150) NOT NULL,
    patient_age           INT,
    patient_gender        VARCHAR(10),
    patient_phone         VARCHAR(20)  NOT NULL,
    patient_whatsapp      VARCHAR(20),
    patient_email         VARCHAR(150),
    patient_address       TEXT,
    patient_pincode       VARCHAR(10),
    booking_id            UUID,
    referral              VARCHAR(200),
    chief_complaints      TEXT,
    diagnosis             TEXT,
    bp                    VARCHAR(20),
    pulse                 VARCHAR(20),
    temperature           VARCHAR(20),
    weight                VARCHAR(20),
    spo2                  VARCHAR(20),
    general_advice        TEXT,
    follow_up_date        DATE,
    follow_up_note        VARCHAR(300),
    created_by            UUID,
    updated_by            UUID,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ,
    UNIQUE (clinic_id, rx_serial)
);
CREATE INDEX IF NOT EXISTS idx_clinic_rx_clinic_date ON platform.clinic_prescriptions (clinic_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinic_rx_patient ON platform.clinic_prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_clinic_rx_name_trgm
    ON platform.clinic_prescriptions USING gin (patient_name gin_trgm_ops);
DROP TRIGGER IF EXISTS trg_clinic_rx_updated_at ON platform.clinic_prescriptions;
CREATE TRIGGER trg_clinic_rx_updated_at BEFORE UPDATE ON platform.clinic_prescriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS platform.clinic_prescription_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID         NOT NULL REFERENCES platform.clinic_prescriptions(id) ON DELETE CASCADE,
    sort_order      INT          NOT NULL,
    medicine_id     UUID,
    name            VARCHAR(200) NOT NULL,
    company         VARCHAR(150),
    composition     VARCHAR(500),
    form            VARCHAR(40),
    dosage          VARCHAR(80),
    duration        VARCHAR(80),
    instructions    VARCHAR(200),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_rx_items_rx ON platform.clinic_prescription_items (prescription_id, sort_order);

CREATE TABLE IF NOT EXISTS platform.clinic_prescription_tests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID         NOT NULL REFERENCES platform.clinic_prescriptions(id) ON DELETE CASCADE,
    sort_order      INT          NOT NULL,
    test_id         UUID,
    name            VARCHAR(200) NOT NULL,
    department_name VARCHAR(150),
    note            VARCHAR(200),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_rx_tests_rx ON platform.clinic_prescription_tests (prescription_id, sort_order);

-- ---------- bookings (patient appointments) ----------
CREATE TABLE IF NOT EXISTS platform.clinic_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID         NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    schedule_id     UUID         REFERENCES platform.clinic_schedules(id) ON DELETE SET NULL,
    doctor_id       UUID         NOT NULL REFERENCES platform.clinic_doctors(id) ON DELETE CASCADE,
    booking_date    DATE         NOT NULL,
    time_slot       TIME         NOT NULL,
    serial_no       INT          NOT NULL,
    patient_name    VARCHAR(150) NOT NULL,
    patient_phone   VARCHAR(20)  NOT NULL,
    patient_email   VARCHAR(150),
    patient_age     INT,
    patient_gender  VARCHAR(10),
    note            TEXT,
    visit_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method  VARCHAR(20),
    status          VARCHAR(20)  NOT NULL DEFAULT 'Booked' CHECK (status IN ('Booked','Cancelled','Completed')),
    prescription_id UUID,
    created_by      UUID,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_bookings_day ON platform.clinic_bookings (clinic_id, booking_date, doctor_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_bookings_serial
    ON platform.clinic_bookings (clinic_id, doctor_id, booking_date, serial_no);
DROP TRIGGER IF EXISTS trg_clinic_bookings_updated_at ON platform.clinic_bookings;
CREATE TRIGGER trg_clinic_bookings_updated_at BEFORE UPDATE ON platform.clinic_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- medicines (clinic formulary) ----------
CREATE TABLE IF NOT EXISTS platform.clinic_medicines (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id            UUID         NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    brand_name           VARCHAR(200) NOT NULL,
    company              VARCHAR(150) NOT NULL DEFAULT '',
    composition          VARCHAR(500),
    form                 VARCHAR(40),
    default_dosage       VARCHAR(80),
    default_duration     VARCHAR(80),
    default_instructions VARCHAR(200),
    source               VARCHAR(20)  NOT NULL DEFAULT 'Manual',
    usage_count          INT          NOT NULL DEFAULT 0,
    is_active            BOOLEAN      NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_medicines_clinic_company ON platform.clinic_medicines (clinic_id, company);
CREATE INDEX IF NOT EXISTS idx_clinic_medicines_name_trgm
    ON platform.clinic_medicines USING gin (brand_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clinic_medicines_company_trgm
    ON platform.clinic_medicines USING gin (company gin_trgm_ops);
DROP TRIGGER IF EXISTS trg_clinic_medicines_updated_at ON platform.clinic_medicines;
CREATE TRIGGER trg_clinic_medicines_updated_at BEFORE UPDATE ON platform.clinic_medicines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- ledger ----------
CREATE TABLE IF NOT EXISTS platform.clinic_ledger_entries (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id      UUID         NOT NULL REFERENCES platform.clinics(id) ON DELETE CASCADE,
    entry_date     DATE         NOT NULL,
    entry_type     VARCHAR(20)  NOT NULL CHECK (entry_type IN ('Income','Expense','Refund')),
    category       VARCHAR(60),
    amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30),
    reference_no   VARCHAR(60),
    description    VARCHAR(500),
    source         VARCHAR(20)  NOT NULL DEFAULT 'Manual',
    reference_id   UUID,
    created_by     UUID,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clinic_ledger_clinic_date ON platform.clinic_ledger_entries (clinic_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinic_ledger_ref ON platform.clinic_ledger_entries (reference_id);
DROP TRIGGER IF EXISTS trg_clinic_ledger_updated_at ON platform.clinic_ledger_entries;
CREATE TRIGGER trg_clinic_ledger_updated_at BEFORE UPDATE ON platform.clinic_ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
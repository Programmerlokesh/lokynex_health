-- Makes sure technicians has the WhatsApp column on freshly provisioned labs
-- (the base TenantSchemaTemplate.sql does not create it).
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Per-lab overrides of the global doctor / referral registry (same as database/028).
CREATE TABLE IF NOT EXISTS doctor_lab_overrides (
    doctor_id       UUID PRIMARY KEY REFERENCES platform.doctors(id) ON DELETE CASCADE,
    has_edits       BOOLEAN NOT NULL DEFAULT false,
    full_name       VARCHAR(150),
    phone           VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email           CITEXT,
    address         TEXT,
    specialization  VARCHAR(150),
    status          platform.record_status,
    is_hidden       BOOLEAN NOT NULL DEFAULT false,
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
-- ======================================================================
-- 028_lab_directory_overrides.sql
-- Per-lab overrides for the GLOBAL doctor / referral registry.
--   * platform.doctors / platform.referrals stay global (adds go there).
--   * A lab's edits / status / "delete" are stored in that lab's schema:
--       doctor_lab_overrides, referral_lab_overrides
--   * doctors_effective / referrals_effective views merge both, so every
--     query in the lab sees the lab's own name/number.
-- Applies to EVERY existing lab schema. Safe to re-run.
-- ======================================================================
DO $outer$
DECLARE
    s TEXT;
BEGIN
    FOR s IN
        SELECT t.schema_name
        FROM platform.tenants t
        WHERE EXISTS (
            SELECT 1 FROM information_schema.tables i
            WHERE i.table_schema = t.schema_name AND i.table_name = 'tests')
    LOOP
        RAISE NOTICE 'Applying 028 to schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);
        EXECUTE $sql$
CREATE TABLE IF NOT EXISTS doctor_lab_overrides (
    doctor_id       UUID PRIMARY KEY REFERENCES platform.doctors(id) ON DELETE CASCADE,
    has_edits       BOOLEAN NOT NULL DEFAULT false,   -- true = the detail columns below are this lab's version
    full_name       VARCHAR(150),
    phone           VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email           CITEXT,
    address         TEXT,
    specialization  VARCHAR(150),
    status          platform.record_status,           -- NULL = follow the global status
    is_hidden       BOOLEAN NOT NULL DEFAULT false,   -- true = removed from THIS lab's list only
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
        $sql$;
    END LOOP;
END
$outer$;
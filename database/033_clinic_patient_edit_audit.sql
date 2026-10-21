-- 033: who edited a clinic patient by hand, and when. Run once per database. Safe to re-run.
ALTER TABLE platform.clinic_patients
    ADD COLUMN IF NOT EXISTS edited_by_username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS edited_at          TIMESTAMPTZ;
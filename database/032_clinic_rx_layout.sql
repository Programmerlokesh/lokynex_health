-- 032: prescription layout settings (default / personal pre-printed pad / fully custom)
-- Safe to re-run.
ALTER TABLE platform.clinics
    ADD COLUMN IF NOT EXISTS rx_layout TEXT;
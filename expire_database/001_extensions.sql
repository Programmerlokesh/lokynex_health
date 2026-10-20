-- =====================================================================
-- Lokynex Health — Lab Billing & Reporting
-- 001_extensions.sql
--
-- Run ONCE per physical PostgreSQL database. Extensions and the trigger
-- function below are database-wide (not schema-scoped), so both the
-- `platform` schema and every dynamically-created tenant schema
-- (lab_<code>) depend on this having run first.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email / username
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fast ILIKE search on name/phone columns

-- Auto-maintains updated_at on any table that attaches this trigger.
-- Lives in `public` so it's callable, unqualified, from platform.* and
-- every tenant schema without cross-schema qualification headaches.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

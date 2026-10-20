-- Run this BEFORE deploying the new backend (EF selects this column on every
-- Tenant query). Adds a photo column for the Lab Admin (tenant owner), who
-- lives in platform.tenants and has no row in the tenant `users` table.
-- Safe to re-run.

ALTER TABLE platform.tenants
    ADD COLUMN IF NOT EXISTS admin_profile_picture_url TEXT;
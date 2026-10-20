-- Run this against the EXISTING lab_demo schema (Neon) to add profile fields
-- that the tenant schema template didn't originally have.
-- Safe to re-run: IF NOT EXISTS guards every column.

ALTER TABLE lab_demo.users
    ADD COLUMN IF NOT EXISTS address              TEXT,
    ADD COLUMN IF NOT EXISTS pincode               VARCHAR(10),
    ADD COLUMN IF NOT EXISTS profile_picture_url    TEXT;
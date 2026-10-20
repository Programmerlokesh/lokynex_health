-- ======================================================================
-- 022_directory_whatsapp.sql
-- Adds optional whatsapp_number to doctors, referrals (platform) and to
-- technicians of EVERY lab schema. Safe to re-run.
-- ======================================================================
ALTER TABLE platform.doctors   ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE platform.referrals ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

DO $$
DECLARE
    s TEXT;
BEGIN
    FOR s IN
        SELECT t.schema_name
        FROM platform.tenants t
        WHERE EXISTS (
            SELECT 1 FROM information_schema.tables i
            WHERE i.table_schema = t.schema_name AND i.table_name = 'technicians')
    LOOP
        RAISE NOTICE 'Adding whatsapp_number to %.technicians', s;
        EXECUTE format(
            'ALTER TABLE %I.technicians ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)', s);
    END LOOP;
END $$;
-- ======================================================================
-- 029_technicians_whatsapp_fix.sql
-- Adds technicians.whatsapp_number to EVERY lab schema that lacks it.
-- Safe to re-run.
-- ======================================================================
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
        RAISE NOTICE 'Fixing %.technicians', s;
        EXECUTE format(
            'ALTER TABLE %I.technicians ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)', s);
    END LOOP;
END $$;

-- platform registry (already added by 022, kept here so one run fixes everything)
ALTER TABLE platform.doctors   ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE platform.referrals ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
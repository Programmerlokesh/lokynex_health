-- ======================================================================
-- 022_doctor_clinic_booking_fee_serial.sql
-- Doctor Clinic bookings: visit fee, payment method and serial number.
-- Applies to EVERY schema that already has `doctor_clinic_bookings`
-- (all labs, including lab_demo). Safe to re-run.
-- ======================================================================
DO $outer$
DECLARE
    s TEXT;
BEGIN
    FOR s IN
        SELECT DISTINCT table_schema
        FROM information_schema.tables
        WHERE table_name = 'doctor_clinic_bookings'
          AND table_schema NOT IN ('information_schema', 'pg_catalog')
    LOOP
        RAISE NOTICE 'Applying 022 to schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);

        EXECUTE $sql$
            ALTER TABLE doctor_clinic_bookings
                ADD COLUMN IF NOT EXISTS serial_no       INT,
                ADD COLUMN IF NOT EXISTS visit_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS payment_method  payment_method_type;

            -- Give old bookings a serial: booking order within doctor + branch + day.
            UPDATE doctor_clinic_bookings b
               SET serial_no = x.rn
              FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY doctor_id, branch_id, booking_date
                               ORDER BY created_at, id) AS rn
                      FROM doctor_clinic_bookings
                     WHERE serial_no IS NULL
                   ) x
             WHERE b.id = x.id
               -- only safe when the day has no serials yet (first run)
               AND NOT EXISTS (
                    SELECT 1 FROM doctor_clinic_bookings o
                     WHERE o.doctor_id = b.doctor_id
                       AND o.branch_id = b.branch_id
                       AND o.booking_date = b.booking_date
                       AND o.serial_no IS NOT NULL);

            -- One serial per doctor + branch + day (backstop; the app also locks).
            CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_clinic_bookings_serial
                ON doctor_clinic_bookings (doctor_id, branch_id, booking_date, serial_no)
                WHERE serial_no IS NOT NULL;
        $sql$;
    END LOOP;
END
$outer$;
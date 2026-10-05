-- Order List features: indexes for the date / branch / payment-method filters,
-- the Deleted list and the audit timeline. Safe to re-run.
-- Run AFTER 012_order_list_enhancements.sql. Replace lab_demo if your schema differs.

-- Payment-method filter -> "orders that have a payment of method X" (EXISTS lookup).
CREATE INDEX IF NOT EXISTS idx_order_payments_method_order
    ON lab_demo.order_payments (payment_method, order_id);

-- Normal list: newest first, only live rows. Deleted list: latest deletion first.
CREATE INDEX IF NOT EXISTS idx_orders_live_created
    ON lab_demo.orders (created_at DESC, id DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at
    ON lab_demo.orders (deleted_at DESC, id DESC) WHERE is_deleted = true;

-- Order details timeline.
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_changed
    ON lab_demo.order_audit_logs (order_id, changed_at DESC);

-- Patient / family-member NAME search ("contains") — trigram indexes.
-- Wrapped so the script never fails if pg_trgm lives in another schema.
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm
        ON lab_demo.patients USING gin (full_name public.gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_patient_relatives_name_trgm
        ON lab_demo.patient_relatives USING gin (name public.gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped trigram indexes (%). Name search still works, just slower.', SQLERRM;
END $$;
-- Order List enhancements. Safe to re-run.
--   1. orders: remember the NAME of whoever created / last edited / deleted an
--      order (a Lab Admin has no row in `users`, so an id alone is not enough).
--   2. order_audit_logs: one row per edit / delete / restore, with who + when.
--      changed_by becomes nullable for the same reason (Lab Admin).
-- Replace lab_demo below if your tenant schema is named differently.

ALTER TABLE lab_demo.orders
    ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS updated_by_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS deleted_by_name VARCHAR(150);

-- Lab Admin (tenant owner) orders are stored with created_by = NULL.
ALTER TABLE lab_demo.orders ALTER COLUMN created_by DROP NOT NULL;

-- Backfill names for orders that already have a user id.
UPDATE lab_demo.orders o SET created_by_name = u.name
FROM lab_demo.users u WHERE o.created_by = u.id AND o.created_by_name IS NULL;

UPDATE lab_demo.orders o SET updated_by_name = u.name
FROM lab_demo.users u WHERE o.updated_by = u.id AND o.updated_by_name IS NULL;

UPDATE lab_demo.orders o SET deleted_by_name = u.name
FROM lab_demo.users u WHERE o.deleted_by = u.id AND o.deleted_by_name IS NULL;

ALTER TABLE lab_demo.order_audit_logs ALTER COLUMN changed_by DROP NOT NULL;

ALTER TABLE lab_demo.order_audit_logs
    ADD COLUMN IF NOT EXISTS changed_by_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS action VARCHAR(20) NOT NULL DEFAULT 'Edit';   -- Edit | Delete | Restore

-- Order List date-range + payment-method filters.
CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON lab_demo.orders (created_at);
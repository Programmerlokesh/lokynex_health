-- New Order tab enhancements. Safe to re-run.
--   1. Main branch becomes a real row in <tenant>.branches (is_main = true,
--      id = platform.tenants.id) so the New Order "Branch" dropdown lists it.
--   2. patients.full_name  -> the family GUARDIAN's name (first person entered
--      under a phone number). Family members stay in patient_relatives.
--   3. platform.tenants.company_type -> printed on the invoice.
--   4. order_payments backfill so old orders show a payment on the invoice.
-- Replace lab_demo below if your tenant schema is named differently.

ALTER TABLE platform.tenants
    ADD COLUMN IF NOT EXISTS company_type VARCHAR(50) NOT NULL DEFAULT 'Diagnostic Laboratory';

ALTER TABLE lab_demo.branches
    ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE lab_demo.patients
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(150) NOT NULL DEFAULT '';

-- Prefix search ("phone starts with ...") stays an index scan.
CREATE INDEX IF NOT EXISTS idx_patients_phone_prefix
    ON lab_demo.patients (phone varchar_pattern_ops);

-- Pick the tenant that owns lab_demo (fallback: the oldest tenant).
WITH owner AS (
    SELECT t.*
    FROM platform.tenants t
    WHERE t.schema_name = 'lab_demo'
       OR (NOT EXISTS (SELECT 1 FROM platform.tenants WHERE schema_name = 'lab_demo')
           AND t.id = (SELECT id FROM platform.tenants ORDER BY created_at LIMIT 1))
)
-- 1a. Existing branch that already carries the lab code -> just flag it.
UPDATE lab_demo.branches b
SET is_main = true
FROM owner o
WHERE b.branch_code = o.lab_code;

-- 1b. Otherwise insert the main branch (skips if the code already exists).
INSERT INTO lab_demo.branches
    (id, branch_name, branch_code, branch_address, branch_pincode, branch_phone,
     branch_email, created_by_super_admin, is_main, status, created_at)
SELECT o.id, o.primary_branch_name, o.lab_code, o.primary_branch_address,
       o.primary_branch_pincode, o.primary_branch_phone, o.primary_branch_email,
       true, true, 'Active', o.created_at
FROM (
    SELECT t.*
    FROM platform.tenants t
    WHERE t.schema_name = 'lab_demo'
       OR (NOT EXISTS (SELECT 1 FROM platform.tenants WHERE schema_name = 'lab_demo')
           AND t.id = (SELECT id FROM platform.tenants ORDER BY created_at LIMIT 1))
) o
WHERE NOT EXISTS (SELECT 1 FROM lab_demo.branches b WHERE b.id = o.id OR b.branch_code = o.lab_code);

-- 4. One payment row per already-paid order that has none.
INSERT INTO lab_demo.order_payments (order_id, amount, payment_method, paid_at)
SELECT o.id, o.paid_amount, COALESCE(o.payment_method, 'Cash'), o.created_at
FROM lab_demo.orders o
WHERE o.paid_amount > 0
  AND NOT EXISTS (SELECT 1 FROM lab_demo.order_payments p WHERE p.order_id = o.id);
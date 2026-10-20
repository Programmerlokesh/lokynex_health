-- =====================================================================
-- SEED DATA
-- Part A runs once against `platform` (any database, after 002).
-- Part B runs once per tenant schema (after 003), same search_path rule.
-- =====================================================================

-- ---------- A. platform.plans (subscription catalog) ----------
INSERT INTO platform.plans (name, description, price, billing_cycle, max_users, max_branches, features, is_active)
VALUES
    ('Basic',    'Single branch, small team',      999.00,  'Monthly', 5,  1, '{"support":"email"}',        true),
    ('Standard', 'Multi-branch, growing lab chain', 2499.00, 'Monthly', 15, 3, '{"support":"priority"}',     true),
    ('Premium',  'Unlimited branches, full suite',  4999.00, 'Monthly', 50, 10,'{"support":"dedicated"}',    true);

-- ---------- B. tenant roles (run per lab_<code> schema) ----------
INSERT INTO roles (name, description) VALUES
    ('LabAdmin',     'Full access within the lab tenant'),
    ('Receptionist', 'Creates orders, registers patients, collects payment'),
    ('Technician',   'Performs tests, uploads reports'),
    ('Accountant',   'Views ledger, commissions, and payment reports');

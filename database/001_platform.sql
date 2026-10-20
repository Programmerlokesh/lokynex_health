-- =====================================================================
-- 001_platform.sql                                   (Lokynex Health)
--
-- Run ONCE per physical PostgreSQL database (Neon: pooling OFF).
-- Contains: extensions, the shared set_updated_at() trigger, the whole
-- `platform` schema (SuperAdmin layer, owners, subscriptions, global
-- doctor / referral registry) and the starting data (plans, SuperAdmin).
-- Safe to re-run: every statement is IF NOT EXISTS / ON CONFLICT.
--
-- Next: 002_tenant_schema.sql (per lab), then 003_departments_and_tests.sql.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email / username
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fast ILIKE search on name / phone

-- Keeps updated_at current on every table that attaches this trigger.
-- Lives in `public` so platform.* and every lab schema can use it.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SCHEMA IF NOT EXISTS platform;

-- ---------- ENUMS ----------
DO $$
BEGIN
    CREATE TYPE platform.record_status       AS ENUM ('Active', 'Inactive', 'Suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
    CREATE TYPE platform.subscription_status AS ENUM ('Trial', 'Active', 'Expired', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
    CREATE TYPE platform.billing_cycle       AS ENUM ('Monthly', 'Quarterly', 'Yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- SUPER ADMINS ----------
CREATE TABLE IF NOT EXISTS platform.super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    email           CITEXT UNIQUE NOT NULL,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    status          platform.record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

-- ---------- OWNERS (staff who sell the software) ----------
CREATE TABLE IF NOT EXISTS platform.owners (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    role                VARCHAR(50)  NOT NULL,
    username            VARCHAR(100) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    phone               VARCHAR(20)  NOT NULL,
    whatsapp_number     VARCHAR(20),
    address             TEXT,
    pincode             VARCHAR(10),
    profile_picture_url TEXT,
    status              platform.record_status NOT NULL DEFAULT 'Active',
    created_by          UUID REFERENCES platform.super_admins(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- Panel permissions of a staff member, stored as "labs:manage,plans:view,...".
-- The backend (Owner.Permissions) reads this column, so it must exist.
-- An older database gets it added here; staff that already existed keep their
-- old behaviour (create labs + own ledger) ONLY the first time the column is added.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'platform' AND table_name = 'owners' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE platform.owners ADD COLUMN permissions VARCHAR(500) NOT NULL DEFAULT '';
        UPDATE platform.owners SET permissions = 'labs:manage,ledger:manage';
    END IF;
END $$;

-- ---------- PLANS ----------
CREATE TABLE IF NOT EXISTS platform.plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL DEFAULT 0,
    billing_cycle   platform.billing_cycle NOT NULL DEFAULT 'Monthly',
    max_users       INT NOT NULL DEFAULT 5,
    max_branches    INT NOT NULL DEFAULT 1,
    features        JSONB,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

-- ---------- TENANTS (labs) ----------
CREATE TABLE IF NOT EXISTS platform.tenants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_code                VARCHAR(20)  UNIQUE NOT NULL,   -- code of the primary branch
    schema_name             VARCHAR(63)  UNIQUE NOT NULL,   -- physical schema, e.g. lab_a1b2c3
    subdomain               VARCHAR(100) UNIQUE NOT NULL,

    primary_branch_name     VARCHAR(150) NOT NULL,
    primary_branch_address  TEXT NOT NULL,
    primary_branch_phone    VARCHAR(20)  NOT NULL,
    primary_branch_email    CITEXT NOT NULL,
    primary_branch_pincode  VARCHAR(10)  NOT NULL,

    company_type            VARCHAR(50)  NOT NULL DEFAULT 'Diagnostic Laboratory',  -- printed on the invoice

    admin_name              VARCHAR(150) NOT NULL,
    admin_phone             VARCHAR(20)  NOT NULL,
    admin_address           TEXT,
    admin_email             CITEXT NOT NULL,
    admin_username          VARCHAR(100) UNIQUE NOT NULL,
    admin_password_hash     VARCHAR(255) NOT NULL,
    admin_profile_picture_url TEXT,                 -- the Lab Admin has no row in the lab's `users`

    user_limit              INT NOT NULL DEFAULT 5,
    status                  platform.record_status NOT NULL DEFAULT 'Active',

    created_by              UUID REFERENCES platform.super_admins(id),
    created_by_owner_id     UUID REFERENCES platform.owners(id),
    created_by_name         VARCHAR(150),
    created_by_role         VARCHAR(50),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain        ON platform.tenants (subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_lab_code         ON platform.tenants (lab_code);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by_owner ON platform.tenants (created_by_owner_id, created_at DESC);

-- Extra branches entered in the Create Lab form (mirrored into the lab's own `branches`).
CREATE TABLE IF NOT EXISTS platform.tenant_branches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    branch_name     VARCHAR(150) NOT NULL,
    branch_code     VARCHAR(20)  NOT NULL,
    branch_address  TEXT,
    branch_pincode  VARCHAR(10),
    branch_phone    VARCHAR(20),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, branch_code)
);

-- branch_id NULL = the lab's main subscription, otherwise that branch's own subscription.
CREATE TABLE IF NOT EXISTS platform.subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    branch_id       UUID REFERENCES platform.tenant_branches(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES platform.plans(id),
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE NOT NULL,
    status          platform.subscription_status NOT NULL DEFAULT 'Active',
    amount_paid     NUMERIC(10,2) NOT NULL DEFAULT 0,
    auto_renew      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant        ON platform.subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_branch ON platform.subscriptions (tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_start  ON platform.subscriptions (tenant_id, start_date);

CREATE TABLE IF NOT EXISTS platform.notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES platform.tenants(id) ON DELETE CASCADE,  -- NULL = broadcast to all labs
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    sent_by         UUID REFERENCES platform.super_admins(id),
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON platform.notifications (tenant_id);

-- Owner ledger (income / expense of the staff who sell the software)
CREATE TABLE IF NOT EXISTS platform.owner_ledger_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES platform.owners(id) ON DELETE CASCADE,
    entry_date      DATE NOT NULL,
    entry_type      VARCHAR(30) NOT NULL
                    CHECK (entry_type IN ('Income', 'Expense', 'Refund', 'CommissionPayout')),
    category        VARCHAR(60),
    tenant_id       UUID REFERENCES platform.tenants(id) ON DELETE SET NULL,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method  VARCHAR(30),
    reference_no    VARCHAR(60),
    description     VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_owner_ledger_owner_date   ON platform.owner_ledger_entries (owner_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_owner_ledger_owner_tenant ON platform.owner_ledger_entries (owner_id, tenant_id);

-- ---------- GLOBAL DOCTOR / REFERRAL REGISTRY (shared by every lab) ----------
CREATE TABLE IF NOT EXISTS platform.doctors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    email           CITEXT,
    address         TEXT,
    whatsapp_number VARCHAR(20),
    specialization  VARCHAR(150),
    status          platform.record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_platform_doctors_name_trgm ON platform.doctors USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_platform_doctors_phone     ON platform.doctors (phone);

CREATE TABLE IF NOT EXISTS platform.referrals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    email           CITEXT,
    address         TEXT,
    whatsapp_number VARCHAR(20),
    status          platform.record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_platform_referrals_name_trgm ON platform.referrals USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_platform_referrals_phone     ON platform.referrals (phone);

-- ---------- updated_at triggers ----------
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['super_admins', 'owners', 'plans', 'tenants', 'subscriptions',
                             'owner_ledger_entries', 'doctors', 'referrals']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON platform.%1$I', t);
        EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON platform.%1$I
                        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
    END LOOP;
END $$;

-- ---------- starting data ----------
-- Subscription plans (only when there are none yet)
INSERT INTO platform.plans (name, description, price, billing_cycle, max_users, max_branches, features)
SELECT v.* FROM (VALUES
    ('Basic',    'Single branch, small team',       999.00,  'Monthly'::platform.billing_cycle,  5,  1, '{"support":"email"}'::jsonb),
    ('Standard', 'Multi-branch, growing lab chain', 2499.00, 'Monthly'::platform.billing_cycle, 15,  3, '{"support":"priority"}'::jsonb),
    ('Premium',  'Unlimited branches, full suite',  4999.00, 'Monthly'::platform.billing_cycle, 50, 10, '{"support":"dedicated"}'::jsonb)
) AS v(name, description, price, billing_cycle, max_users, max_branches, features)
WHERE NOT EXISTS (SELECT 1 FROM platform.plans);

-- First SuperAdmin (username: superadmin). Change the password after the first login.
INSERT INTO platform.super_admins (name, email, username, password_hash)
VALUES ('Lokesh Debnath', 'lokesh@lokynex.com', 'superadmin',
        '$2b$12$xHgx2ZLIDHw2YJJRY73c1uQUK/WZ/.gV05iP6IhsbmIYtL.8cf/la')
ON CONFLICT (username) DO NOTHING;
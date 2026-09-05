-- =====================================================================
-- PLATFORM SCHEMA — SuperAdmin layer, shared across every tenant
-- Maps to: PlatformDbContext
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS platform;

-- ---------- ENUMS ----------
CREATE TYPE platform.record_status       AS ENUM ('Active', 'Inactive', 'Suspended');
CREATE TYPE platform.subscription_status AS ENUM ('Trial', 'Active', 'Expired', 'Cancelled');
CREATE TYPE platform.billing_cycle       AS ENUM ('Monthly', 'Quarterly', 'Yearly');

-- ---------- SUPER ADMINS ----------
CREATE TABLE platform.super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    email           CITEXT UNIQUE NOT NULL,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    status          platform.record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TRIGGER trg_super_admins_updated_at
BEFORE UPDATE ON platform.super_admins
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- PLANS ----------
CREATE TABLE platform.plans (
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

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON platform.plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- TENANTS (Labs) ----------
-- Written by: SuperAdmin > Manage Labs > Create Lab
CREATE TABLE platform.tenants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_code                VARCHAR(20)  UNIQUE NOT NULL,   -- Branch Code (primary branch)
    schema_name             VARCHAR(63)  UNIQUE NOT NULL,   -- physical PG schema, e.g. lab_a1b2c3
    subdomain               VARCHAR(100) UNIQUE NOT NULL,   -- resolved via X-Tenant-Subdomain header

    primary_branch_name     VARCHAR(150) NOT NULL,
    primary_branch_address  TEXT NOT NULL,
    primary_branch_phone    VARCHAR(20)  NOT NULL,
    primary_branch_email    CITEXT NOT NULL,
    primary_branch_pincode  VARCHAR(10)  NOT NULL,

    admin_name              VARCHAR(150) NOT NULL,
    admin_phone             VARCHAR(20)  NOT NULL,
    admin_address           TEXT,
    admin_email             CITEXT NOT NULL,
    admin_username          VARCHAR(100) UNIQUE NOT NULL,
    admin_password_hash     VARCHAR(255) NOT NULL,  -- staged credential; provisioned into tenant.users on schema creation

    user_limit              INT NOT NULL DEFAULT 5,
    status                  platform.record_status NOT NULL DEFAULT 'Active',

    created_by              UUID REFERENCES platform.super_admins(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ
);

CREATE INDEX idx_tenants_subdomain ON platform.tenants (subdomain);
CREATE INDEX idx_tenants_lab_code  ON platform.tenants (lab_code);

CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON platform.tenants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- EXTEND BRANCH ----------
-- Additional branches supplied inside the Create Lab form. Staged here at
-- onboarding; the provisioning job mirrors each row into the new tenant
-- schema's own `branches` table once the schema is created.
CREATE TABLE platform.tenant_branches (
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

-- ---------- SUBSCRIPTIONS ----------
CREATE TABLE platform.subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES platform.plans(id),
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE NOT NULL,
    status          platform.subscription_status NOT NULL DEFAULT 'Active',
    amount_paid     NUMERIC(10,2) NOT NULL DEFAULT 0,
    auto_renew      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_tenant ON platform.subscriptions (tenant_id);

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON platform.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- NOTIFICATIONS ----------
CREATE TABLE platform.notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES platform.tenants(id) ON DELETE CASCADE, -- NULL = broadcast to all labs
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    sent_by         UUID REFERENCES platform.super_admins(id),
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_tenant ON platform.notifications (tenant_id);

-- ---------- GLOBAL DOCTOR / REFERRAL REGISTRY ----------
-- Per clarification: Doctor and Referral are shared master data — every
-- lab under this SuperAdmin sees and uses the SAME doctor/referral list.
-- Lives in `platform` (not per-tenant) so tenant schemas reference these
-- via a cross-schema FK. Technician stays tenant + branch scoped (see
-- 003_tenant_schema_template.sql) since technicians work at one branch.
CREATE TABLE platform.doctors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    email           CITEXT,
    address         TEXT,
    specialization  VARCHAR(150),   -- used by Doctor Clinic module
    status          platform.record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX idx_platform_doctors_name_trgm ON platform.doctors USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_platform_doctors_phone     ON platform.doctors (phone);

CREATE TRIGGER trg_platform_doctors_updated_at
BEFORE UPDATE ON platform.doctors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE platform.referrals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    email           CITEXT,
    address         TEXT,
    status          platform.record_status NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX idx_platform_referrals_name_trgm ON platform.referrals USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_platform_referrals_phone     ON platform.referrals (phone);

CREATE TRIGGER trg_platform_referrals_updated_at
BEFORE UPDATE ON platform.referrals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

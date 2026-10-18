-- 030_staff_panel_permissions.sql
-- Safe to re-run. Run once in the Neon SQL editor.
-- Includes everything from 025 (owners = "Staff" in the UI) + panel permissions.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- 025: staff table ----------
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
DROP TRIGGER IF EXISTS trg_owners_updated_at ON platform.owners;
CREATE TRIGGER trg_owners_updated_at BEFORE UPDATE ON platform.owners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 025: "added by" on labs ----------
ALTER TABLE platform.tenants
    ADD COLUMN IF NOT EXISTS created_by_owner_id UUID REFERENCES platform.owners(id),
    ADD COLUMN IF NOT EXISTS created_by_name     VARCHAR(150),
    ADD COLUMN IF NOT EXISTS created_by_role     VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by_owner
    ON platform.tenants (created_by_owner_id, created_at DESC);

-- ---------- 025: staff ledger ----------
CREATE TABLE IF NOT EXISTS platform.owner_ledger_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES platform.owners(id) ON DELETE CASCADE,
    entry_date      DATE NOT NULL,
    entry_type      VARCHAR(30) NOT NULL
                    CHECK (entry_type IN ('Income','Expense','Refund','CommissionPayout')),
    category        VARCHAR(60),
    tenant_id       UUID REFERENCES platform.tenants(id) ON DELETE SET NULL,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method  VARCHAR(30),
    reference_no    VARCHAR(60),
    description     VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_owner_ledger_owner_date
    ON platform.owner_ledger_entries (owner_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_owner_ledger_owner_tenant
    ON platform.owner_ledger_entries (owner_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_start
    ON platform.subscriptions (tenant_id, start_date);
DROP TRIGGER IF EXISTS trg_owner_ledger_updated_at ON platform.owner_ledger_entries;
CREATE TRIGGER trg_owner_ledger_updated_at BEFORE UPDATE ON platform.owner_ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 030: panel permissions ----------
-- Stored as "labs:manage,plans:view,...". Existing staff keep their old
-- behaviour (create labs + own ledger) ONLY the first time this column is added.
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
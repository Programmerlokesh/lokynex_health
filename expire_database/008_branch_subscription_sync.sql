-- 1. Lets a SuperAdmin-created branch carry its OWN subscription, independent
--    of the lab's main plan. Null branch_id = the lab's main subscription
--    (unchanged, existing behaviour); a set branch_id = that one branch's
--    own subscription.
-- 2. Backfills lab_demo.branches for any platform.tenant_branches row that
--    was created before this fix — those branches existed only in the
--    SuperAdmin's registry and were invisible to the Lab Admin's own
--    Branches tab. From now on AddLabBranch/UpdateLabBranch/CreateLab keep
--    both tables in sync automatically (see BranchMirror.cs); this is a
--    one-time catch-up for rows that predate that fix.
-- Safe to re-run.

ALTER TABLE platform.subscriptions
    ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES platform.tenant_branches(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_branch
    ON platform.subscriptions(tenant_id, branch_id);

-- Backfill: one row per orphaned tenant_branches entry, skipping any whose
-- branch_code already collides with something in lab_demo.branches (that
-- collision has to be resolved by hand — this backfill won't silently drop
-- or rename anyone's data).
INSERT INTO lab_demo.branches
    (id, branch_name, branch_code, branch_address, branch_pincode, branch_phone,
     created_by_super_admin, status, created_at)
SELECT
    tb.id, tb.branch_name, tb.branch_code, tb.branch_address, tb.branch_pincode, tb.branch_phone,
    true, 'Active', tb.created_at
FROM platform.tenant_branches tb
WHERE NOT EXISTS (SELECT 1 FROM lab_demo.branches b WHERE b.id = tb.id)
  AND NOT EXISTS (SELECT 1 FROM lab_demo.branches b WHERE b.branch_code = tb.branch_code);
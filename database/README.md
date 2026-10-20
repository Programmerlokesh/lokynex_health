# Lokynex Health — Database

PostgreSQL, schema-per-tenant: `platform` (SuperAdmin layer, shared) + one
schema per lab (`lab_<code>`).

| Order | File | Run |
|---|---|---|
| 1 | `001_platform.sql` | once per database (extensions, `platform.*`, plans, first SuperAdmin) |
| 2 | `002_tenant_schema.sql` | once per lab, with `SET search_path TO lab_xxx, public;` |
| 3 | `003_departments_and_tests.sql` | loads every department, test, report format and specimen default |

All three are safe to re-run (they only create what is missing and never overwrite what a lab edited).

## New lab
The backend does steps 2 + 3 itself when a lab is created. It embeds copies of
the two files, so after you change one of them copy it too:

    database/002_tenant_schema.sql           -> LokynexHealth/backend/src/LokynexHealth.Infrastructure/Persistence/Scripts/TenantSchema.sql
    database/003_departments_and_tests.sql   -> LokynexHealth/backend/src/LokynexHealth.Infrastructure/Persistence/Scripts/DepartmentsAndTests.sql

## Existing labs
Paste `003_departments_and_tests.sql` into the Neon SQL editor (RUN, not Explain), or:

    cd database && npm i pg
    export DATABASE_URL="postgresql://..."      # Neon > Connect, pooling OFF
    node run-seeds.mjs                          # all labs
    node run-seeds.mjs lab_demo                 # one lab

## Editing the catalog
Everything is the data block at the top of `003_departments_and_tests.sql`
(syntax explained in its header). Price of every seeded test is 0: set real
prices in *Departments & Tests*. Only common blood tests carry normal ranges;
add the rest from your analyser / kit insert in *Test Formats*.

## Business rules enforced in the database
- Doctor and referral commission are mutually exclusive on an order line (`order_items.chk_commission_exclusive`).
- A commission override / payout points at exactly one doctor, referral or technician.
- Orders are soft-deleted (`is_deleted`), every edit / delete / restore is logged in `order_audit_logs`.
- Doctors and referrals are global (`platform`); a lab can edit or hide them for itself (`doctor_lab_overrides`, `referral_lab_overrides`, `doctors_effective`, `referrals_effective`).

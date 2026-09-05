# Lokynex Health — Lab Billing & Reporting: Database Schema

Full PostgreSQL schema for the Lab System spec, built for the existing
schema-per-tenant architecture (ADR 0004): `PlatformDbContext` +
`LokynexHealthDbContext`, Npgsql, EF Core.

## Files & run order

1. `schema/001_extensions.sql` — run **once** per physical database (pgcrypto, citext, pg_trgm, shared `set_updated_at()` trigger fn).
2. `schema/002_platform_schema.sql` — run **once**. SuperAdmin layer: `platform.*`.
3. `schema/003_tenant_schema_template.sql` — run **once per lab**, with `search_path` pointed at that lab's schema. This is what your tenant-provisioning job should execute right after `CREATE SCHEMA lab_<code>;`.
4. `schema/004_seed_data.sql` — Part A once for `platform.plans`; Part B once per tenant for `roles`.

## Module → table map

| Spec module | Tables |
|---|---|
| Manage Labs / Create Lab | `platform.tenants`, `platform.tenant_branches` |
| Subscription / Plans | `platform.subscriptions`, `platform.plans` |
| Notifications | `platform.notifications` |
| Users + permissions | `users`, `roles`, `modules`, `user_module_permissions` |
| Branches | `branches` (`created_by_super_admin` flag marks branches locked from Lab Admin edit) |
| Departments and Tests | `departments`, `tests` (commission type/value per doctor/referral/technician baked into the test row) |
| New Order | `patients`, `patient_relatives`, `orders`, `order_items` |
| Order List & Upload Report | `report_documents`, `orders.is_deleted` (Deleted List), indexes on branch/date/doctor/referral/technician for the filter bar |
| Commission Setup | `commission_overrides` (per-doctor/referral/technician test-level override) |
| Ledger/PL sheet | `ledger_entries` |
| Commission (payouts) | `commission_payouts` |
| Doctor/Referral/Technician | `platform.doctors`, `platform.referrals` (global — shared by every lab), `technicians` (tenant + `branch_id` scoped) |
| Doctor Clinic | `doctor_clinic_schedules` (Create Centre), `doctor_clinic_bookings` (Book by doctor) |

## Report Builder (templates + editable per-order reports)

`report_templates` — reusable letterheads. Header/footer/body are stored
as HTML in `header_content` / `footer_content` / `body_content`. A
template either starts blank (`source_type = 'Manual'`, built in an
in-app rich-text editor) or from an uploaded `.docx`
(`source_type = 'UploadedDocument'`, original file kept at
`original_file_path`).

`report_documents` — the actual report against one `order_item`. Always
gets its **own copy** of header/footer/body (never a live reference back
to the template), so editing a generated report never touches the
template it came from. Same `Manual` / `UploadedDocument` source flow as
templates, plus `exported_file_path` for the finalized PDF once
printed/shared.

**Both tables share the same soft-delete pattern** — `is_deleted` +
`deleted_at` + `deleted_by`. "Deleted Folder" is just
`WHERE is_deleted = true`; nothing is hard-deleted, so recovery is a
one-column update.

**Suggested implementation stack** (not enforced by the schema, your
call):
- Frontend rich-text editor: TipTap or Quill — both store clean HTML,
  which maps directly onto `header_content`/`footer_content`/`body_content`.
- `.docx` upload → HTML: convert with **Mammoth.js** (Node) or
  **DocumentFormat.OpenXml** + a custom HTML writer (.NET-native, more
  control over header/footer extraction) on upload; store the result in
  the same three HTML columns so the editor treats uploaded and
  manually-built content identically from that point on.
- HTML → final PDF on export: **Puppeteer** (headless Chrome print-to-PDF,
  best fidelity for arbitrary HTML/CSS) or a .NET PDF library like
  **QuestPDF** if you'd rather stay fully in the .NET stack — flag which
  you'd prefer and I can wire up the actual conversion code.

## Doctor & Referral are global, Technician is branch-scoped

Per explicit confirmation: **Doctor** and **Referral** are shared master
data — every lab under this SuperAdmin sees and can select the same
doctor/referral list. So `doctors` and `referrals` live in `platform`
(not per-tenant), and every tenant-schema FK that used to point at a
local `doctors`/`referrals` table now points cross-schema at
`platform.doctors(id)` / `platform.referrals(id)`. This works cleanly in
Postgres — cross-schema FKs are fully supported as long as both schemas
sit in the same physical database (they do here).

**Technician** stays tenant-scoped *and* now carries `branch_id NOT NULL`
— a technician belongs to exactly one branch, matching how the New Order
screen only shows the technicians of the branch the order is being
placed at.

One thing worth flagging since it's a real business-model choice, not
just a technical detail: "every lab" here means every lab under this one
SuperAdmin account — i.e. this is meant for a single lab-chain/franchise
owner running multiple branded labs, not for unrelated third-party labs
sharing a doctor directory. If you ever onboard SuperAdmins for
*different, unrelated* businesses on the same platform, this global
table would need a `network_id`/owner-level scope instead of being
platform-wide — flag if that's a scenario you need to support later.

## Business rules enforced at the DB layer

- **Doctor vs referral commission is mutually exclusive per test line** — `order_items.chk_commission_exclusive` CHECK constraint. Toggling one off in the UI should simply set the other's `*_enabled` flag to false; the DB blocks both being true simultaneously either way.
- **Commission override / payout rows must point at exactly one entity** — `num_nonnulls(doctor_id, referral_id, technician_id) = 1` CHECK on both `commission_overrides` and `commission_payouts`.
- **Full audit trail on order edits** ("user er name er time show korbe") — `order_audit_logs` stores `changed_by` + `changed_at` + JSONB old/new snapshots. Recommend writing this via an EF Core `SaveChangesInterceptor` (you have `HttpContext`/current-user there) rather than a DB trigger, since triggers can't see the logged-in app user.
- **Soft delete for orders** — `is_deleted` + `deleted_at` + `deleted_by`, so "Deleted List" is just `WHERE is_deleted = true` and the normal Order List is `WHERE is_deleted = false`.

## Left to the application layer (intentionally not DB constraints)

- `orders.final_amount` = `gross_amount` − discount, or `0` when `is_complimentary = true` — compute in the `NewOrder` command handler (or a `BEFORE INSERT/UPDATE` trigger if you'd rather keep it DB-side; flagging as a choice, not prescribing).
- Complimentary zeroing of `order_items.*_commission_amount` — same place, same reasoning.
- Day/Week/Month/Year views on Order List — plain date-range queries against `orders.created_at` / `order_date`, no schema change needed.

## EF Core / Npgsql notes

- All PKs are `uuid DEFAULT gen_random_uuid()` — maps cleanly to `Guid` with `HasDefaultValueSql("gen_random_uuid()")`.
- Postgres native enums (`record_status`, `commission_type`, etc.) — map with `NpgsqlDataSourceBuilder.MapEnum<T>()` + `HasPostgresEnum<T>()` in `OnModelCreating`. If you'd rather avoid enum-migration friction as the app evolves, swap these for `varchar` + `CHECK IN (...)`; happy to generate that variant instead if you hit pain here.
- Column names are `snake_case`, consistent with the `EFCore.NamingConventions` package — confirm that's still wired into both `DbContext`s.
- Search fields (`name`, `full_name`, `phone`) use `pg_trgm` GIN indexes so `ILIKE '%term%'` stays fast at scale — needed for the User/Doctor/Referral/Technician search boxes in the spec.

## Reconciling with what's already scaffolded

Memory notes `Patient`, `Tenant`, `Doctor` entities already exist in the `Domain` project. Suggest running this against a fresh dev DB, generating an EF Core migration from these `CREATE TABLE`s, and diffing that against your current entity classes rather than hand-merging — faster to catch drift that way.

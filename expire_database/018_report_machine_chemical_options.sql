-- ======================================================================
-- 018_report_machine_chemical_options.sql
-- Pick-list of machines (analysers) + reagents (chemicals) for blood reports.
-- Runs on EVERY lab schema that has a `tests` table. Safe to re-run.
-- Run with the RUN button (not Explain).
-- ======================================================================
DO $outer$
DECLARE
    s TEXT;
BEGIN
    FOR s IN
        SELECT DISTINCT i.table_schema
        FROM information_schema.tables i
        WHERE i.table_name = 'tests'
          AND i.table_schema NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')
    LOOP
        RAISE NOTICE 'Creating report_options in schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);
        EXECUTE $sql$
CREATE TABLE IF NOT EXISTS report_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind        VARCHAR(10)  NOT NULL CHECK (kind IN ('Machine', 'Reagent')),
    name        VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_options_kind_name
    ON report_options (kind, lower(name));

INSERT INTO report_options (kind, name)
SELECT v.kind, v.name
FROM (VALUES
    ('Machine', 'Sysmex XN-1000'),
    ('Machine', 'Sysmex XN-350'),
    ('Machine', 'Sysmex XP-100'),
    ('Machine', 'Mindray BC-5150'),
    ('Machine', 'Mindray BC-5000'),
    ('Machine', 'Mindray BC-3000 Plus'),
    ('Machine', 'Erba H 360'),
    ('Machine', 'Erba H 560'),
    ('Machine', 'Horiba Micros 60'),
    ('Machine', 'Beckman Coulter DxH 520'),
    ('Machine', 'Transasia XL-640'),
    ('Machine', 'Transasia EM 200'),
    ('Machine', 'Erba Chem 5X'),
    ('Machine', 'Mindray BS-240'),
    ('Machine', 'Mindray BS-200E'),
    ('Machine', 'Roche Cobas c311'),
    ('Machine', 'Roche Cobas e411'),
    ('Machine', 'Roche Cobas 6000'),
    ('Machine', 'Abbott Architect i1000SR'),
    ('Machine', 'Abbott Architect c4000'),
    ('Machine', 'Siemens Atellica'),
    ('Machine', 'Beckman Coulter Access 2'),
    ('Machine', 'Vitros ECi'),
    ('Machine', 'Tosoh G8 (HbA1c)'),
    ('Machine', 'Bio-Rad D-10 (HbA1c)'),
    ('Machine', 'Erba ECL 105 (Coagulometer)'),
    ('Machine', 'Stago Start 4 (Coagulometer)'),
    ('Machine', 'Manual method'),
    ('Reagent', 'Sysmex Cellpack / Stromatolyser'),
    ('Reagent', 'Mindray M-30 series reagents'),
    ('Reagent', 'Erba Diluent / Lyse'),
    ('Reagent', 'Horiba ABX Diluent / Lyse'),
    ('Reagent', 'Beckman Coulter DxH reagents'),
    ('Reagent', 'Transasia Autopak reagents'),
    ('Reagent', 'Erba Mannheim reagents'),
    ('Reagent', 'Randox reagents'),
    ('Reagent', 'Agappe Diagnostics reagents'),
    ('Reagent', 'Coral Clinical Systems reagents'),
    ('Reagent', 'Roche Cobas reagents'),
    ('Reagent', 'Abbott Architect reagents'),
    ('Reagent', 'Siemens reagents'),
    ('Reagent', 'Beckman Coulter reagents'),
    ('Reagent', 'Biorad reagents'),
    ('Reagent', 'Tulip Diagnostics kit'),
    ('Reagent', 'Span Diagnostics kit'),
    ('Reagent', 'J. Mitra kit'),
    ('Reagent', 'Meril Diagnostics kit'),
    ('Reagent', 'Manual kit')
) AS v(kind, name)
ON CONFLICT DO NOTHING;
$sql$;
    END LOOP;
END
$outer$;
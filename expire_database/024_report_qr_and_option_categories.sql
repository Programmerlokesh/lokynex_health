-- ======================================================================
-- 024_report_qr_and_option_categories.sql
-- Run AFTER 014, 015, 018. Replace lab_demo with your tenant schema.
-- Safe to re-run. Run with the RUN button (not Explain).
-- ======================================================================
SET search_path TO lab_demo, public;

-- ---------- 1. QR public token ----------
ALTER TABLE report_documents
    ADD COLUMN IF NOT EXISTS public_token VARCHAR(40);

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_documents_public_token
    ON report_documents (public_token)
    WHERE public_token IS NOT NULL;

UPDATE report_documents
   SET public_token = replace(gen_random_uuid()::text, '-', '')
 WHERE public_token IS NULL
   AND body_content LIKE '<!--lokynex:structured-->%';

-- ---------- 2. machine / reagent categories ----------
ALTER TABLE report_options
    ADD COLUMN IF NOT EXISTS categories VARCHAR(200);

INSERT INTO report_options (kind, name)
SELECT v.kind, v.name
FROM (VALUES
    ('Machine', 'Sysmex XN-550'),
    ('Machine', 'Mindray BC-6000'),
    ('Machine', 'Horiba Yumizen H500'),
    ('Machine', 'Medica EasyLyte (ISE)'),
    ('Machine', 'Mindray CL-900i'),
    ('Machine', 'Snibe Maglumi 800'),
    ('Machine', 'Snibe Maglumi X3'),
    ('Machine', 'Tosoh AIA-360'),
    ('Machine', 'Siemens Immulite 1000'),
    ('Machine', 'Erba LisaScan II (ELISA reader)'),
    ('Machine', 'Rapid card test (manual)'),
    ('Machine', 'Stago STA Compact Max (Coagulometer)'),
    ('Reagent', 'Roche Elecsys reagents'),
    ('Reagent', 'Snibe Maglumi reagents'),
    ('Reagent', 'Mindray CL series reagents'),
    ('Reagent', 'Beckman Access reagents'),
    ('Reagent', 'Tosoh AIA reagents'),
    ('Reagent', 'Siemens Immulite reagents'),
    ('Reagent', 'Tosoh G8 HbA1c reagent'),
    ('Reagent', 'Bio-Rad D-10 HbA1c reagent'),
    ('Reagent', 'Stago coagulation reagents'),
    ('Reagent', 'Span PT / APTT reagents'),
    ('Reagent', 'Tulip PT / APTT reagents'),
    ('Reagent', 'Widal antigen kit'),
    ('Reagent', 'ELISA kit'),
    ('Reagent', 'Rapid card kit')
) AS v(kind, name)
ON CONFLICT DO NOTHING;

UPDATE report_options o
   SET categories = m.cats
  FROM (VALUES
    ('Machine', 'Sysmex XN-1000',                      'Haematology'),
    ('Machine', 'Sysmex XN-350',                       'Haematology'),
    ('Machine', 'Sysmex XN-550',                       'Haematology'),
    ('Machine', 'Sysmex XP-100',                       'Haematology'),
    ('Machine', 'Mindray BC-5150',                     'Haematology'),
    ('Machine', 'Mindray BC-5000',                     'Haematology'),
    ('Machine', 'Mindray BC-3000 Plus',                'Haematology'),
    ('Machine', 'Mindray BC-6000',                     'Haematology'),
    ('Machine', 'Erba H 360',                          'Haematology'),
    ('Machine', 'Erba H 560',                          'Haematology'),
    ('Machine', 'Horiba Micros 60',                    'Haematology'),
    ('Machine', 'Horiba Yumizen H500',                 'Haematology'),
    ('Machine', 'Beckman Coulter DxH 520',             'Haematology'),
    ('Machine', 'Transasia XL-640',                    'Biochemistry'),
    ('Machine', 'Transasia EM 200',                    'Biochemistry'),
    ('Machine', 'Erba Chem 5X',                        'Biochemistry'),
    ('Machine', 'Mindray BS-240',                      'Biochemistry'),
    ('Machine', 'Mindray BS-200E',                     'Biochemistry'),
    ('Machine', 'Medica EasyLyte (ISE)',               'Biochemistry'),
    ('Machine', 'Roche Cobas c311',                    'Biochemistry,HbA1c'),
    ('Machine', 'Abbott Architect c4000',              'Biochemistry'),
    ('Machine', 'Roche Cobas 6000',                    'Biochemistry,Immunoassay,HbA1c'),
    ('Machine', 'Siemens Atellica',                    'Biochemistry,Immunoassay'),
    ('Machine', 'Roche Cobas e411',                    'Immunoassay'),
    ('Machine', 'Abbott Architect i1000SR',            'Immunoassay'),
    ('Machine', 'Beckman Coulter Access 2',            'Immunoassay'),
    ('Machine', 'Vitros ECi',                          'Immunoassay'),
    ('Machine', 'Mindray CL-900i',                     'Immunoassay'),
    ('Machine', 'Snibe Maglumi 800',                   'Immunoassay'),
    ('Machine', 'Snibe Maglumi X3',                    'Immunoassay'),
    ('Machine', 'Tosoh AIA-360',                       'Immunoassay'),
    ('Machine', 'Siemens Immulite 1000',               'Immunoassay'),
    ('Machine', 'Erba LisaScan II (ELISA reader)',     'Serology'),
    ('Machine', 'Rapid card test (manual)',            'Serology'),
    ('Machine', 'Tosoh G8 (HbA1c)',                    'HbA1c'),
    ('Machine', 'Bio-Rad D-10 (HbA1c)',                'HbA1c'),
    ('Machine', 'Erba ECL 105 (Coagulometer)',         'Coagulation'),
    ('Machine', 'Stago Start 4 (Coagulometer)',        'Coagulation'),
    ('Machine', 'Stago STA Compact Max (Coagulometer)','Coagulation'),
    ('Reagent', 'Sysmex Cellpack / Stromatolyser',     'Haematology'),
    ('Reagent', 'Mindray M-30 series reagents',        'Haematology'),
    ('Reagent', 'Erba Diluent / Lyse',                 'Haematology'),
    ('Reagent', 'Horiba ABX Diluent / Lyse',           'Haematology'),
    ('Reagent', 'Beckman Coulter DxH reagents',        'Haematology'),
    ('Reagent', 'Transasia Autopak reagents',          'Biochemistry'),
    ('Reagent', 'Erba Mannheim reagents',              'Biochemistry'),
    ('Reagent', 'Randox reagents',                     'Biochemistry'),
    ('Reagent', 'Agappe Diagnostics reagents',         'Biochemistry'),
    ('Reagent', 'Coral Clinical Systems reagents',     'Biochemistry,Serology'),
    ('Reagent', 'Roche Cobas reagents',                'Biochemistry,HbA1c'),
    ('Reagent', 'Abbott Architect reagents',           'Biochemistry,Immunoassay'),
    ('Reagent', 'Siemens reagents',                    'Biochemistry,Immunoassay,Coagulation'),
    ('Reagent', 'Beckman Coulter reagents',            'Biochemistry,Immunoassay'),
    ('Reagent', 'Biorad reagents',                     'Immunoassay,HbA1c'),
    ('Reagent', 'Tulip Diagnostics kit',               'Biochemistry,Serology'),
    ('Reagent', 'Span Diagnostics kit',                'Biochemistry,Serology'),
    ('Reagent', 'J. Mitra kit',                        'Biochemistry,Serology'),
    ('Reagent', 'Meril Diagnostics kit',               'Biochemistry,Serology'),
    ('Reagent', 'Roche Elecsys reagents',              'Immunoassay'),
    ('Reagent', 'Snibe Maglumi reagents',              'Immunoassay'),
    ('Reagent', 'Mindray CL series reagents',          'Immunoassay'),
    ('Reagent', 'Beckman Access reagents',             'Immunoassay'),
    ('Reagent', 'Tosoh AIA reagents',                  'Immunoassay'),
    ('Reagent', 'Siemens Immulite reagents',           'Immunoassay'),
    ('Reagent', 'Tosoh G8 HbA1c reagent',              'HbA1c'),
    ('Reagent', 'Bio-Rad D-10 HbA1c reagent',          'HbA1c'),
    ('Reagent', 'Stago coagulation reagents',          'Coagulation'),
    ('Reagent', 'Span PT / APTT reagents',             'Coagulation'),
    ('Reagent', 'Tulip PT / APTT reagents',            'Coagulation'),
    ('Reagent', 'Widal antigen kit',                   'Serology'),
    ('Reagent', 'ELISA kit',                           'Serology'),
    ('Reagent', 'Rapid card kit',                      'Serology')
  ) AS m(kind, name, cats)
 WHERE o.kind = m.kind
   AND lower(o.name) = lower(m.name)
   AND o.categories IS NULL;
-- "Manual method" / "Manual kit" ar tomar nijer type kora naam gulo
-- categories = NULL thake, mane shob test e dekhay.
-- ======================================================================
-- 028_seed_imaging_and_other_departments.sql
-- WHY  : SeedTests01..06 only create PATHOLOGY departments (Blood, Urine,
--        Stool, Microbiology, Histopathology ...). A diagnostic centre also
--        has Radiology / Imaging and other test rooms. This file adds them.
-- WHAT : creates these departments (only when no department with a
--        matching name exists) and ~400 tests inside them:
--          IMAGING        X-Ray, Fluoroscopy / Contrast Studies, CT Scan, MRI,
--                         Ultrasound (USG), Mammography, DEXA / Bone Densitometry,
--                         Dental Imaging, Nuclear Medicine / PET-CT
--          HEART & BRAIN  Cardiology (ECG, Echo, TMT, Holter ...),
--                         Neurophysiology (EEG, EMG, NCV ...),
--                         Pulmonology (PFT, sleep study ...)
--          PROCEDURES     Endoscopy, ENT & Audiology, Ophthalmology
--
-- RULES (same as 019 / 026 / 027):
--   * Price of every new test is 0  -> set real prices in "Departments & Tests"
--     (those rows show a yellow "Rs 0" so they are easy to spot).
--   * Safe to re-run: a department / test is created only when it does not
--     exist yet. Prices, commissions and names you edited are never touched.
--   * Runs on EVERY lab schema that has a `tests` table.
--   * Run with the RUN button / "Execute script" in ONE session (not Explain).
--
-- RUN ORDER : ... 027 -> 028 (this file)
--
-- DATA BLOCK SYNTAX:   CODE | Test name        (lines starting with -- are comments)
-- ======================================================================

-- ---------- 0. department codes: code -> name to create, regex of an existing name to reuse ----------
DROP TABLE IF EXISTS tmp28_dept;
CREATE TEMP TABLE tmp28_dept (code TEXT PRIMARY KEY, dname TEXT NOT NULL, pat TEXT NOT NULL);
INSERT INTO tmp28_dept (code, dname, pat) VALUES
    ('XRY', 'X-Ray',                          '^x[ -]?ray|radiograph'),
    ('FLU', 'Fluoroscopy / Contrast Studies', 'fluoro|contrast stud'),
    ('CTS', 'CT Scan',                        '^ct([ -]?scan)?$|computed tomograph'),
    ('MRI', 'MRI',                            '^mri|magnetic resonance'),
    ('USG', 'Ultrasound (USG)',               'ultra ?sound|^usg|sonograph'),
    ('MAM', 'Mammography',                    'mammo'),
    ('DXA', 'DEXA / Bone Densitometry',       'dexa|densitometr'),
    ('DEN', 'Dental Imaging',                 'dental'),
    ('NUC', 'Nuclear Medicine / PET-CT',      'nuclear|pet.?ct'),
    ('CAR', 'Cardiology',                     'cardio|^ecg|^echo'),
    ('NEU', 'Neurophysiology',                'neuro'),
    ('PUL', 'Pulmonology / PFT',              'pulmon|^pft'),
    ('END', 'Endoscopy',                      'endoscop'),
    ('ENT', 'ENT & Audiology',                'audiolog|^ent( |$|/|&)'),
    ('OPH', 'Ophthalmology',                  'ophthal|^eye');

-- ---------- 1. the test list -> tmp28_test ----------
DROP TABLE IF EXISTS tmp28_test;
CREATE TEMP TABLE tmp28_test AS
SELECT btrim(split_part(x.line, '|', 1)) AS code,
       left(btrim(split_part(x.line, '|', 2)), 200) AS test_name
FROM (
    SELECT btrim(l.line, E' \t\r') AS line
    FROM regexp_split_to_table($pack_data$
-- ===================== X-RAY =====================
XRY | Chest PA View
XRY | Chest AP View
XRY | Chest Lateral View
XRY | Chest PA & Lateral Views
XRY | Chest Apical Lordotic View
XRY | Chest Decubitus View
XRY | Ribs (One Side)
XRY | Sternum Lateral View
XRY | Neck AP & Lateral (Soft Tissue)
XRY | Post-Nasal Space / Adenoids (Lateral)
XRY | Cervical Spine AP & Lateral
XRY | Cervical Spine Flexion & Extension
XRY | Cervical Spine Oblique Views
XRY | Cervical Spine Open Mouth (Odontoid) View
XRY | Dorsal (Thoracic) Spine AP & Lateral
XRY | Lumbosacral Spine AP & Lateral
XRY | Lumbosacral Spine Flexion & Extension
XRY | Lumbosacral Spine Oblique Views
XRY | Whole Spine (Scoliosis) AP & Lateral
XRY | Sacrum & Coccyx AP & Lateral
XRY | Sacroiliac (SI) Joints
XRY | Pelvis AP View
XRY | Hip Joint AP & Lateral (One Side)
XRY | Both Hip Joints AP
XRY | Femur AP & Lateral
XRY | Knee Joint AP & Lateral
XRY | Knee Joint Weight Bearing
XRY | Both Knees Standing AP
XRY | Patella Skyline View
XRY | Tibia & Fibula AP & Lateral
XRY | Ankle Joint AP & Lateral
XRY | Foot AP & Oblique
XRY | Calcaneum (Heel) Axial & Lateral
XRY | Toes
XRY | Scanogram (Limb Length)
XRY | Shoulder Joint AP
XRY | Shoulder Axial / Y View
XRY | Clavicle AP
XRY | Scapula AP & Lateral
XRY | Humerus AP & Lateral
XRY | Elbow Joint AP & Lateral
XRY | Forearm AP & Lateral
XRY | Wrist Joint AP & Lateral
XRY | Hand AP & Oblique
XRY | Fingers
XRY | Bone Age (Hand & Wrist)
XRY | Skull AP & Lateral
XRY | Skull Towne's View
XRY | Paranasal Sinuses (PNS) Water's View
XRY | Paranasal Sinuses (PNS) Caldwell View
XRY | Nasal Bone Lateral
XRY | Mandible AP & Lateral
XRY | TM Joints
XRY | Mastoids (Schuller's View)
XRY | Orbit
XRY | Abdomen Erect
XRY | Abdomen Supine
XRY | Abdomen Erect & Supine
XRY | KUB (Plain X-Ray)
XRY | Skeletal Survey
XRY | Infantogram (Babygram)
-- ===================== FLUOROSCOPY / CONTRAST =====================
FLU | Barium Swallow
FLU | Barium Meal
FLU | Barium Meal Follow Through
FLU | Small Bowel Enema (Enteroclysis)
FLU | Barium Enema
FLU | Loopogram
FLU | Defecography
FLU | IVU / IVP (Intravenous Urography)
FLU | Retrograde Urethrogram (RGU)
FLU | Micturating Cystourethrogram (MCU)
FLU | Cystogram
FLU | Nephrostogram
FLU | Hysterosalpingography (HSG)
FLU | Sinogram
FLU | Fistulogram
FLU | T-Tube Cholangiogram
FLU | Sialography
FLU | Dacryocystography (DCG)
FLU | Myelography
FLU | Arthrography
-- ===================== CT SCAN =====================
CTS | CT Brain Plain
CTS | CT Brain Plain & Contrast
CTS | CT Brain Perfusion
CTS | CT Angiography Brain (Circle of Willis)
CTS | CT Orbit
CTS | CT Paranasal Sinuses (PNS)
CTS | CT Temporal Bone / Mastoid
CTS | CT Face (3D)
CTS | CT Neck Plain & Contrast
CTS | CT Neck Angiography (Carotid)
CTS | CT Chest Plain
CTS | CT Chest Plain & Contrast
CTS | HRCT Chest
CTS | CT Lung Screening (Low Dose)
CTS | CT Pulmonary Angiography (CTPA)
CTS | CT Coronary Angiography
CTS | Coronary Calcium Score
CTS | CT Aortogram (Thoracic & Abdominal)
CTS | CT Abdomen Plain & Contrast
CTS | CT Pelvis Plain & Contrast
CTS | CT Abdomen & Pelvis Plain & Contrast
CTS | CT Whole Abdomen Triple Phase
CTS | CT Liver Triple Phase
CTS | CT Pancreas Protocol
CTS | CT KUB (Stone Protocol)
CTS | CT Urography
CTS | CT Renal Angiography
CTS | CT Enterography
CTS | CT Colonography (Virtual Colonoscopy)
CTS | CT Peripheral Angiography (Lower Limb)
CTS | CT Peripheral Angiography (Upper Limb)
CTS | CT Cervical Spine
CTS | CT Dorsal Spine
CTS | CT Lumbosacral Spine
CTS | CT Whole Spine
CTS | CT Shoulder
CTS | CT Pelvis & Hip Joints
CTS | CT Knee
CTS | CT Ankle & Foot
CTS | CT Extremity (Any Joint)
CTS | CT Whole Body (Trauma / Pan-Scan)
CTS | CT Guided FNAC / Biopsy
CTS | CT Guided Drainage
-- ===================== MRI =====================
MRI | MRI Brain Plain
MRI | MRI Brain Plain & Contrast
MRI | MRI Brain with MRA
MRI | MRI Brain DWI / Stroke Protocol
MRI | MRI Brain Epilepsy Protocol
MRI | MR Spectroscopy Brain
MRI | MRA Brain (Circle of Willis)
MRI | MRV Brain
MRI | MRI Pituitary (Dynamic)
MRI | MRI Orbit
MRI | MRI IAM / Cranial Nerves (CP Angle)
MRI | MRI Face & Neck
MRI | MRI Neck Soft Tissue
MRI | MRA Neck (Carotid)
MRI | MRI TMJ
MRI | MRI Cervical Spine
MRI | MRI Dorsal Spine
MRI | MRI Lumbosacral Spine
MRI | MRI Whole Spine Screening
MRI | MRI Spine with Contrast
MRI | MRI Brachial Plexus
MRI | MRI Lumbosacral Plexus
MRI | MRI Chest
MRI | MRI Breast (Both)
MRI | MRI Cardiac
MRI | MRI Abdomen
MRI | MRCP
MRI | MRI Liver (Dynamic Contrast)
MRI | MR Enterography
MRI | MR Urography
MRI | MRI Pelvis
MRI | MRI Female Pelvis (Uterus & Ovaries)
MRI | MRI Prostate (Multiparametric)
MRI | MRI Fistula (Perianal)
MRI | MRI Fetal
MRI | MRI Shoulder
MRI | MRI Elbow
MRI | MRI Wrist
MRI | MRI Hand
MRI | MRI Hip (Both)
MRI | MRI SI Joints
MRI | MRI Knee
MRI | MRI Ankle
MRI | MRI Foot
MRI | MRI Extremity (Bone / Soft Tissue)
MRI | MR Angiography Peripheral
MRI | MRI Whole Body Screening
-- ===================== ULTRASOUND (USG) =====================
USG | USG Whole Abdomen
USG | USG Upper Abdomen
USG | USG Lower Abdomen
USG | USG Abdomen & Pelvis
USG | USG Hepatobiliary System (HBS)
USG | USG KUB (Kidney, Ureter, Bladder)
USG | USG KUB with Prostate
USG | USG Post Void Residual (PVR)
USG | USG Pelvis (Transabdominal)
USG | USG Transvaginal (TVS)
USG | USG Obstetric Dating / Viability
USG | USG NT / NB Scan (11-14 Weeks)
USG | USG Obstetric 2nd Trimester
USG | USG Anomaly Scan (TIFFA, 18-22 Weeks)
USG | USG Obstetric 3rd Trimester / Growth
USG | USG Biophysical Profile (BPP)
USG | USG Cervical Length
USG | USG Obstetric Doppler (Umbilical & Uterine Artery)
USG | USG Follicular Study (Single Scan)
USG | USG Follicular Study (Complete Cycle)
USG | USG Thyroid
USG | USG Neck (Soft Tissue / Lymph Nodes)
USG | USG Salivary Glands
USG | USG Breast (Both)
USG | USG Breast (Single)
USG | USG Scrotum / Testes
USG | USG Prostate (TRUS)
USG | USG Chest / Pleural
USG | USG Anterior Abdominal Wall (Hernia)
USG | USG Inguinal Region
USG | USG Soft Tissue / Lump
USG | USG Shoulder (MSK)
USG | USG Knee (MSK)
USG | USG Hip (MSK)
USG | USG Infant Hip (DDH)
USG | USG Neonatal Cranial (Transfontanellar)
USG | USG Neonatal Spine
USG | USG Pyloric Stenosis (Pediatric)
USG | Doppler Carotid & Vertebral Arteries
USG | Doppler Venous Lower Limb (DVT)
USG | Doppler Arterial Lower Limb
USG | Doppler Venous Upper Limb
USG | Doppler Arterial Upper Limb
USG | Doppler Renal Arteries
USG | Doppler Portal Vein / Liver
USG | Doppler Abdominal Aorta
USG | Doppler Scrotum
USG | Doppler Penile
USG | Doppler Thyroid
USG | Liver Elastography (FibroScan)
USG | USG Guided FNAC
USG | USG Guided Biopsy
USG | USG Guided Aspiration / Drainage
-- ===================== MAMMOGRAPHY =====================
MAM | Mammography Bilateral
MAM | Mammography Unilateral
MAM | Screening Mammography
MAM | Diagnostic Mammography (Additional Views)
MAM | 3D Mammography (Tomosynthesis)
MAM | Mammography + Breast USG (Combined)
MAM | Galactography (Ductogram)
MAM | Stereotactic Breast Biopsy
MAM | Needle Localization (Breast)
-- ===================== DEXA =====================
DXA | DEXA Spine
DXA | DEXA Hip (One Side)
DXA | DEXA Spine & Hip (BMD)
DXA | DEXA Forearm
DXA | DEXA Total Body (BMD)
DXA | DEXA Body Composition
DXA | DEXA Pediatric (BMD)
DXA | Vertebral Fracture Assessment (VFA)
DXA | Trabecular Bone Score (TBS)
DXA | Heel BMD (Calcaneal Ultrasound)
-- ===================== DENTAL IMAGING =====================
DEN | OPG (Orthopantomogram)
DEN | IOPA (Single Tooth)
DEN | IOPA Full Mouth
DEN | Bitewing X-Ray
DEN | Occlusal X-Ray
DEN | Lateral Cephalogram
DEN | PA Cephalogram
DEN | Cephalometric Analysis
DEN | TMJ X-Ray (Dental)
DEN | CBCT Single Arch
DEN | CBCT Both Jaws
DEN | CBCT TMJ
DEN | CBCT Sinus
DEN | CBCT Implant Planning
DEN | CBCT Impacted Tooth
-- ===================== NUCLEAR MEDICINE / PET-CT =====================
NUC | PET-CT Whole Body (FDG)
NUC | PET-CT Brain
NUC | PET-CT Cardiac Viability
NUC | PSMA PET-CT
NUC | DOTATATE PET-CT
NUC | Bone Scan (Whole Body)
NUC | Bone Scan Three Phase
NUC | Thyroid Scan (Tc-99m)
NUC | Thyroid Uptake
NUC | Whole Body Iodine Scan (I-131)
NUC | Parathyroid Scan (Sestamibi)
NUC | Renal Scan (DTPA)
NUC | Renal Scan (DMSA)
NUC | MAG3 Renogram
NUC | Radionuclide Cystogram
NUC | Hepatobiliary (HIDA) Scan
NUC | Gastric Emptying Scan
NUC | GI Bleed Scan
NUC | Meckel's Diverticulum Scan
NUC | Myocardial Perfusion Imaging (SPECT) Stress
NUC | Myocardial Perfusion Imaging (SPECT) Rest
NUC | MUGA Scan
NUC | Lung Perfusion / V-Q Scan
NUC | Brain SPECT
NUC | Lymphoscintigraphy (Sentinel Node)
NUC | MIBG Scan
NUC | Octreotide Scan
NUC | Salivary Gland Scintigraphy
NUC | Testicular Scan
-- ===================== CARDIOLOGY =====================
CAR | ECG (12 Lead)
CAR | ECG with Rhythm Strip
CAR | ECG (Pediatric)
CAR | Echocardiography (2D Echo with Color Doppler)
CAR | 2D Echo (Pediatric)
CAR | Fetal Echocardiography
CAR | Transesophageal Echo (TEE)
CAR | Stress Echo (Dobutamine)
CAR | Contrast Echo (Bubble Study)
CAR | TMT (Treadmill Test)
CAR | Holter Monitoring (24 Hr)
CAR | Holter Monitoring (48 Hr)
CAR | Holter Monitoring (72 Hr)
CAR | ABPM (24 Hr Ambulatory BP)
CAR | Event Recorder
CAR | Tilt Table Test
CAR | Signal Averaged ECG
CAR | ABI (Ankle Brachial Index)
CAR | CIMT (Carotid Intima-Media Thickness)
CAR | Pacemaker / ICD Check
-- ===================== NEUROPHYSIOLOGY =====================
NEU | EEG (Routine)
NEU | EEG Sleep Deprived
NEU | EEG Pediatric
NEU | EEG Video Monitoring (Long Term)
NEU | EMG (Needle)
NEU | NCV Upper Limb
NEU | NCV Lower Limb
NEU | NCV Four Limbs
NEU | NCV + EMG (Single Limb)
NEU | RNS (Repetitive Nerve Stimulation)
NEU | H-Reflex & F-Wave Study
NEU | Blink Reflex
NEU | VEP (Visual Evoked Potential)
NEU | BERA / BAER (Brainstem Evoked Response)
NEU | SSEP (Somatosensory Evoked Potential)
NEU | Transcranial Doppler (TCD)
NEU | Autonomic Function Test
-- ===================== PULMONOLOGY =====================
PUL | Spirometry (PFT)
PUL | Spirometry Pre & Post Bronchodilator
PUL | PFT Complete (Spirometry + DLCO + Lung Volumes)
PUL | DLCO (Diffusion Capacity)
PUL | Lung Volumes (Body Plethysmography)
PUL | Peak Flow Rate
PUL | 6 Minute Walk Test
PUL | CPET (Cardiopulmonary Exercise Test)
PUL | FeNO (Exhaled Nitric Oxide)
PUL | Bronchial Provocation (Methacholine) Test
PUL | Overnight Oximetry
PUL | Polysomnography (Sleep Study)
PUL | Split Night Sleep Study (CPAP Titration)
PUL | Home Sleep Apnea Test
PUL | Allergy Skin Prick Test (Panel)
-- ===================== ENDOSCOPY =====================
END | Upper GI Endoscopy (OGD / EGD)
END | Upper GI Endoscopy with Biopsy
END | Upper GI Endoscopy with CLO Test
END | Colonoscopy (Diagnostic)
END | Colonoscopy with Biopsy
END | Colonoscopy with Polypectomy
END | Sigmoidoscopy (Flexible)
END | Proctoscopy
END | Anoscopy
END | ERCP
END | EUS (Endoscopic Ultrasound)
END | Capsule Endoscopy
END | Esophageal Manometry
END | 24 Hr pH Monitoring
END | Bronchoscopy (Diagnostic)
END | Bronchoscopy with BAL
END | Cystoscopy (Diagnostic)
END | Hysteroscopy (Diagnostic)
END | Colposcopy
END | Laryngoscopy (Flexible)
END | Nasal Endoscopy (DNE)
-- ===================== ENT & AUDIOLOGY =====================
ENT | Pure Tone Audiometry (PTA)
ENT | Speech Audiometry
ENT | Impedance Audiometry (Tympanometry)
ENT | PTA + Impedance (Combined)
ENT | Acoustic Reflex Testing
ENT | OAE (Otoacoustic Emission)
ENT | Newborn Hearing Screening
ENT | BERA / ABR (Hearing)
ENT | ASSR
ENT | Hearing Aid Evaluation / Trial
ENT | Tinnitus Evaluation
ENT | VNG (Videonystagmography)
ENT | Caloric Test
ENT | Video Laryngostroboscopy
ENT | Rhinomanometry
-- ===================== OPHTHALMOLOGY =====================
OPH | Visual Acuity & Refraction
OPH | Slit Lamp Examination
OPH | Tonometry (IOP)
OPH | Gonioscopy
OPH | Fundus Examination
OPH | Fundus Photography
OPH | OCT Macula
OPH | OCT Optic Nerve (RNFL)
OPH | OCT Angiography
OPH | Visual Field (Perimetry)
OPH | Corneal Topography
OPH | Pachymetry
OPH | Specular Microscopy
OPH | A-Scan Biometry (IOL Power)
OPH | B-Scan Ocular Ultrasound
OPH | Fluorescein Angiography (FFA)
OPH | Color Vision Testing
OPH | Schirmer's Test
OPH | ERG (Electroretinography)
OPH | Orthoptic Evaluation (Squint)
OPH | Lacrimal Syringing
$pack_data$, E'\n') AS l(line)
) x
WHERE x.line <> '' AND x.line NOT LIKE '--%';

-- ---------- 2. apply to EVERY lab schema that has a `tests` table ----------
DO $outer$
DECLARE
    s      TEXT;
    n_dept INT;
    n_test INT;
BEGIN
    FOR s IN
        SELECT DISTINCT i.table_schema
        FROM information_schema.tables i
        WHERE i.table_name = 'tests'
          AND i.table_schema NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')
    LOOP
        RAISE NOTICE 'Seeding imaging / other departments in schema: %', s;
        EXECUTE format('SET LOCAL search_path TO %I, public', s);

        -- 2a. departments (skipped when a department with a matching name exists)
        EXECUTE $q$
            INSERT INTO departments (name)
            SELECT w.dname
            FROM tmp28_dept w
            WHERE w.code IN (SELECT DISTINCT f.code FROM tmp28_test f)
              AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.name ~* w.pat)
            ON CONFLICT (name) DO NOTHING$q$;
        GET DIAGNOSTICS n_dept = ROW_COUNT;

        -- 2b. tests (skipped when that department already has a test with the same name)
        EXECUTE $q$
            INSERT INTO tests (department_id, name, price, status)
            SELECT d.id, f.test_name, 0, 'Active'::record_status
            FROM (SELECT DISTINCT code, test_name FROM tmp28_test) f
            JOIN tmp28_dept w ON w.code = f.code
            CROSS JOIN LATERAL (SELECT dd.id FROM departments dd
                                WHERE dd.name ~* w.pat
                                ORDER BY dd.created_at LIMIT 1) d
            WHERE NOT EXISTS (SELECT 1 FROM tests t
                              WHERE t.department_id = d.id
                                AND lower(t.name) = lower(f.test_name))
            ON CONFLICT (department_id, name) DO NOTHING$q$;
        GET DIAGNOSTICS n_test = ROW_COUNT;

        RAISE NOTICE 'schema %: % department(s) and % test(s) added', s, n_dept, n_test;
    END LOOP;
END
$outer$;

-- ----------------------------------------------------------------------
-- QUICK CHECK (run per lab schema, e.g. SET search_path TO lab_demo, public;)
--   SELECT d.name, count(t.id) AS tests
--   FROM departments d LEFT JOIN tests t ON t.department_id = d.id
--   GROUP BY d.name ORDER BY d.name;
-- ----------------------------------------------------------------------
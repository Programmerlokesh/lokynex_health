"use client";

import { useToast } from "@/components/clinic/clinic-ui";
import { MedicineAdder } from "@/components/clinic/prescription/medicine-adder";
import { TestAdviceDialog } from "@/components/clinic/prescription/test-advice-dialog";
import {
  useClinicDoctors,
  useClinicMe,
  useClinicMedicineMutations,
  useClinicPatients,
  usePrescription,
  usePrescriptionMutations,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import { toDateInputValue } from "@/lib/format";
import { toIndianMobile } from "@/lib/phone";
import type {
  ClinicPatient,
  RxItem,
  RxTest,
  SavePrescriptionRequest,
} from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const DOSAGES = [
  "1-0-1",
  "1-1-1",
  "1-0-0",
  "0-1-0",
  "0-0-1",
  "1-1-0",
  "0-1-1",
  "½-0-½",
  "1-1-1-1",
  "SOS",
  "Once a day",
  "Twice a day",
  "Thrice a day",
];
const DURATIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "15 days",
  "1 month",
  "2 months",
  "Continue",
  "SOS",
];
const TIMINGS = [
  "After food",
  "Before food",
  "Empty stomach",
  "At bedtime",
  "With warm water",
  "As needed",
  "Apply locally",
];

type Row<T> = T & { key: string };
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Math.random()).slice(2);
const withKey = <T,>(x: T): Row<T> => ({ ...x, key: uid() });

interface FormState {
  doctorId: string;
  visitDate: string;
  patientId: string | null;
  name: string;
  age: string;
  gender: string;
  phone: string;
  waSame: boolean;
  whatsapp: string;
  email: string;
  address: string;
  pincode: string;
  bookingId: string | null;
  referral: string;
  complaints: string;
  diagnosis: string;
  bp: string;
  pulse: string;
  temperature: string;
  weight: string;
  spo2: string;
  advice: string;
  followUpDate: string;
  followUpNote: string;
}

const EMPTY: FormState = {
  doctorId: "",
  visitDate: "",
  patientId: null,
  name: "",
  age: "",
  gender: "",
  phone: "",
  waSame: true,
  whatsapp: "",
  email: "",
  address: "",
  pincode: "",
  bookingId: null,
  referral: "",
  complaints: "",
  diagnosis: "",
  bp: "",
  pulse: "",
  temperature: "",
  weight: "",
  spo2: "",
  advice: "",
  followUpDate: "",
  followUpNote: "",
};

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 1.5, sm: 2.25 }, borderRadius: 4 }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

const grid = (cols: Record<string, string>) => ({
  display: "grid",
  gap: 1.5,
  gridTemplateColumns: cols,
});

/* ---------------- one medicine row (memoised: typing in one row never re-renders the others) ---------------- */
const MedRow = memo(function MedRow(props: {
  index: number;
  row: Row<RxItem>;
  canSave: boolean;
  onChange: (key: string, patch: Partial<RxItem>) => void;
  onRemove: (key: string) => void;
  onSave: (row: Row<RxItem>) => void;
}) {
  const { row, index, onChange, onRemove, onSave, canSave } = props;
  const k = row.key;
  const opt = (
    field: "dosage" | "duration" | "instructions",
    options: string[],
    label: string,
  ) => (
    <Autocomplete
      freeSolo
      size="small"
      options={options}
      inputValue={row[field] ?? ""}
      onInputChange={(_, v) => onChange(k, { [field]: v })}
      renderInput={(p) => <TextField {...p} label={label} />}
    />
  );
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1,
        p: 1.25,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        gridTemplateColumns: {
          xs: "1fr 1fr",
          md: "30px minmax(240px,2.4fr) 1fr 1fr 1.2fr 76px",
        },
        alignItems: "start",
      }}
    >
      <Typography
        sx={{ fontWeight: 800, pt: 1, display: { xs: "none", md: "block" } }}
      >
        {index + 1}
      </Typography>
      <Box
        sx={{
          gridColumn: { xs: "1 / -1", md: "auto" },
          display: "grid",
          gap: 0.75,
        }}
      >
        <TextField
          size="small"
          label={`Medicine ${index + 1}`}
          value={row.name}
          onChange={(e) => onChange(k, { name: e.target.value })}
          slotProps={{ htmlInput: { style: { fontWeight: 700 } } }}
        />
        <TextField
          size="small"
          label="Composition"
          value={row.composition ?? ""}
          onChange={(e) => onChange(k, { composition: e.target.value })}
          slotProps={{
            htmlInput: { style: { fontSize: 13, fontStyle: "italic" } },
          }}
        />
      </Box>
      {opt("dosage", DOSAGES, "Dosage")}
      {opt("duration", DURATIONS, "Duration")}
      <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
        {opt("instructions", TIMINGS, "Instructions")}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gridColumn: { xs: "1 / -1", md: "auto" },
        }}
      >
        {canSave && (
          <Tooltip title="Save these details (composition, dosage…) as this medicine's default">
            <IconButton
              size="small"
              onClick={() => onSave(row)}
              aria-label="Save as default"
            >
              <BookmarkAddOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Remove">
          <IconButton
            size="small"
            color="error"
            onClick={() => onRemove(k)}
            aria-label="Remove medicine"
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

/* ---------------- the editor ---------------- */
export function PrescriptionEditor({
  prescriptionId,
}: {
  prescriptionId?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const { data: doctors } = useClinicDoctors({ activeOnly: true });
  const { data: existing, isLoading: loadingExisting } = usePrescription(
    prescriptionId ?? null,
  );
  const { save } = usePrescriptionMutations();
  const { save: saveMedicine } = useClinicMedicineMutations();

  const [f, setF] = useState<FormState>({
    ...EMPTY,
    visitDate: toDateInputValue(new Date()),
  });
  const [items, setItems] = useState<Row<RxItem>[]>([]);
  const [tests, setTests] = useState<Row<RxTest>[]>([]);
  const [testsOpen, setTestsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hydrated = useRef(false);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setF((p) => ({ ...p, [key]: v }));

  // ---- new prescription: prefill from the appointment (query string) ----
  useEffect(() => {
    if (prescriptionId || hydrated.current) return;
    hydrated.current = true;
    setF((p) => ({
      ...p,
      bookingId: sp.get("bookingId"),
      doctorId: sp.get("doctorId") ?? p.doctorId,
      name: sp.get("name") ?? "",
      phone: sp.get("phone") ?? "",
      age: sp.get("age") ?? "",
      gender: sp.get("gender") ?? "",
      email: sp.get("email") ?? "",
    }));
  }, [prescriptionId, sp]);

  // default doctor
  useEffect(() => {
    if (!f.doctorId && doctors?.length && !prescriptionId)
      setF((p) => ({ ...p, doctorId: doctors[0].id }));
  }, [doctors, f.doctorId, prescriptionId]);

  // ---- edit: load the saved prescription once ----
  useEffect(() => {
    if (!existing || hydrated.current) return;
    hydrated.current = true;
    setF({
      doctorId: existing.doctorId ?? "",
      visitDate: existing.visitDate.slice(0, 10),
      patientId: existing.patientId ?? null,
      name: existing.patientName,
      age: existing.patientAge != null ? String(existing.patientAge) : "",
      gender: existing.patientGender ?? "",
      phone: existing.patientPhone,
      waSame:
        !existing.patientWhatsapp ||
        existing.patientWhatsapp === existing.patientPhone,
      whatsapp: existing.patientWhatsapp ?? "",
      email: existing.patientEmail ?? "",
      address: existing.patientAddress ?? "",
      pincode: existing.patientPincode ?? "",
      bookingId: existing.bookingId ?? null,
      referral: existing.referral ?? "",
      complaints: existing.chiefComplaints ?? "",
      diagnosis: existing.diagnosis ?? "",
      bp: existing.bp ?? "",
      pulse: existing.pulse ?? "",
      temperature: existing.temperature ?? "",
      weight: existing.weight ?? "",
      spo2: existing.spo2 ?? "",
      advice: existing.generalAdvice ?? "",
      followUpDate: existing.followUpDate?.slice(0, 10) ?? "",
      followUpNote: existing.followUpNote ?? "",
    });
    setItems(existing.items.map(withKey));
    setTests(existing.tests.map(withKey));
  }, [existing]);

  // ---- existing-patient lookup ----
  const canPatients = canDo(me?.permissions, me?.isAdmin, "patients");
  const [pInput, setPInput] = useState("");
  const pq = useDebounce(pInput.trim(), 300);
  const { data: patientHits, isFetching: pLoading } = useClinicPatients(
    { search: pq, pageSize: 8 },
    canPatients && pq.length >= 2,
  );
  const pickPatient = (p: ClinicPatient | null) => {
    if (!p) return;
    setF((x) => ({
      ...x,
      patientId: p.id,
      name: p.name,
      age: p.age != null ? String(p.age) : "",
      gender: p.gender ?? "",
      phone: p.phone,
      waSame: !p.whatsappNumber || p.whatsappNumber === p.phone,
      whatsapp: p.whatsappNumber ?? "",
      email: p.email ?? "",
      address: p.address ?? "",
      pincode: p.pincode ?? "",
    }));
    setPInput("");
  };

  // ---- medicine rows ----
  const addItem = useCallback(
    (i: RxItem) => setItems((p) => (p.length >= 40 ? p : [...p, withKey(i)])),
    [],
  );
  const changeItem = useCallback(
    (key: string, patch: Partial<RxItem>) =>
      setItems((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r))),
    [],
  );
  const removeItem = useCallback(
    (key: string) => setItems((p) => p.filter((r) => r.key !== key)),
    [],
  );
  const canSaveMedicine = canDo(
    me?.permissions,
    me?.isAdmin,
    "medicines",
    "create",
  );
  const saveRowAsDefault = useCallback(
    (r: Row<RxItem>) => {
      if (!r.name.trim()) return;
      saveMedicine.mutate(
        {
          id: r.medicineId ?? null,
          data: {
            brandName: r.name.trim(),
            company: r.company ?? "",
            composition: r.composition ?? "",
            form: r.form ?? "",
            defaultDosage: r.dosage ?? "",
            defaultDuration: r.duration ?? "",
            defaultInstructions: r.instructions ?? "",
            isActive: true,
          },
        },
        {
          onSuccess: () => toast(`“${r.name}” saved to your medicine list`),
          onError: (e) => toast(getApiErrorMessage(e), "error"),
        },
      );
    },
    [saveMedicine, toast],
  );

  // ---- tests ----
  const testsForDialog = useMemo<RxTest[]>(
    () => tests.map(({ key: _k, ...t }) => t),
    [tests],
  );
  const setTestsFromDialog = (next: RxTest[]) => {
    // keep the row key (and any edited note) of tests that are still selected
    const byName = new Map(tests.map((t) => [t.name, t]));
    setTests(next.map((t) => byName.get(t.name) ?? withKey(t)));
  };

  // ---- save ----
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.doctorId) e.doctorId = "Choose the doctor";
    if (!f.name.trim()) e.name = "Patient name is required";
    if (!toIndianMobile(f.phone))
      e.phone = "Enter a valid 10-digit mobile number";
    if (!f.waSame && f.whatsapp.trim() && !toIndianMobile(f.whatsapp))
      e.whatsapp = "Enter a valid WhatsApp number";
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Please fix the highlighted fields", "error");
      return;
    }

    const body: SavePrescriptionRequest = {
      doctorId: f.doctorId,
      visitDate: f.visitDate,
      patientId: f.patientId,
      patientName: f.name.trim(),
      patientAge: f.age.trim() === "" ? null : Number(f.age),
      patientGender: f.gender,
      patientPhone: f.phone.trim(),
      patientWhatsapp: f.waSame ? "" : f.whatsapp.trim(),
      patientEmail: f.email.trim(),
      patientAddress: f.address.trim(),
      patientPincode: f.pincode.trim(),
      bookingId: f.bookingId,
      referral: f.referral.trim(),
      chiefComplaints: f.complaints.trim(),
      diagnosis: f.diagnosis.trim(),
      bp: f.bp,
      pulse: f.pulse,
      temperature: f.temperature,
      weight: f.weight,
      spo2: f.spo2,
      generalAdvice: f.advice.trim(),
      followUpDate: f.followUpDate || null,
      followUpNote: f.followUpNote.trim(),
      items: items.filter((i) => i.name.trim()).map(({ key: _k, ...i }) => i),
      tests: tests.filter((t) => t.name.trim()).map(({ key: _k, ...t }) => t),
    };
    save.mutate(
      { id: prescriptionId ?? null, data: body },
      {
        onSuccess: (res) => router.replace(`/clinic/prescriptions/${res.id}`),
        onError: (err) =>
          toast(
            getApiErrorMessage(err, "Could not save the prescription."),
            "error",
          ),
      },
    );
  };

  if (prescriptionId && loadingExisting) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const txt = (
    key: keyof FormState,
    label: string,
    extra: Record<string, unknown> = {},
  ) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={f[key] as string}
      onChange={(e) => set(key, e.target.value as never)}
      error={!!errors[key]}
      helperText={errors[key]}
      {...extra}
    />
  );

  return (
    <Box sx={{ display: "grid", gap: 2, pb: 10 }}>
      <Section title="Visit">
        <Box sx={grid({ xs: "1fr", sm: "2fr 1fr" })}>
          <TextField
            select
            size="small"
            fullWidth
            label="Doctor *"
            value={f.doctorId}
            onChange={(e) => set("doctorId", e.target.value)}
            error={!!errors.doctorId}
            helperText={errors.doctorId}
          >
            {(doctors ?? []).map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.fullName}
                {d.specialization ? ` — ${d.specialization}` : ""}
              </MenuItem>
            ))}
          </TextField>
          {txt("visitDate", "Date", {
            type: "date",
            slotProps: { inputLabel: { shrink: true } },
          })}
        </Box>
      </Section>

      <Section title="Patient">
        {canPatients && (
          <Autocomplete<ClinicPatient, false, false, false>
            sx={{ mb: 1.5 }}
            value={null}
            inputValue={pInput}
            onInputChange={(_, v, r) => {
              if (r !== "reset") setPInput(v);
            }}
            options={patientHits?.items ?? []}
            filterOptions={(x) => x}
            loading={pLoading}
            getOptionLabel={(p) => `${p.name} · ${p.phone}`}
            onChange={(_, v) => pickPatient(v)}
            renderInput={(p) => (
              <TextField
                {...p}
                size="small"
                label="Find an existing patient (name or mobile)"
              />
            )}
          />
        )}
        <Box sx={grid({ xs: "1fr", sm: "2fr 1fr 1fr" })}>
          {txt("name", "Patient name *")}
          {txt("age", "Age", {
            type: "number",
            slotProps: { htmlInput: { min: 0, max: 130 } },
          })}
          <TextField
            select
            size="small"
            fullWidth
            label="Gender"
            value={f.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
        </Box>
        <Box sx={{ ...grid({ xs: "1fr", sm: "1fr 1fr" }), mt: 1.5 }}>
          {txt("phone", "Mobile number *", {
            type: "tel",
            slotProps: { htmlInput: { inputMode: "numeric" } },
          })}
          <Box>
            <TextField
              size="small"
              fullWidth
              label="WhatsApp number"
              disabled={f.waSame}
              value={f.waSame ? f.phone : f.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              error={!!errors.whatsapp}
              helperText={errors.whatsapp}
              type="tel"
            />
            <FormControlLabel
              sx={{ ml: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={f.waSame}
                  onChange={(e) => set("waSame", e.target.checked)}
                />
              }
              label={
                <Typography variant="caption">Same as mobile number</Typography>
              }
            />
          </Box>
        </Box>
        <Box sx={{ ...grid({ xs: "1fr", sm: "1.2fr 2fr 0.8fr" }), mt: 0.5 }}>
          {txt("email", "Email", { type: "email" })}
          {txt("address", "Address")}
          {txt("pincode", "Pincode", {
            slotProps: { htmlInput: { inputMode: "numeric", maxLength: 10 } },
          })}
        </Box>
        <Box sx={{ mt: 1.5 }}>
          {txt("referral", "Referred by (doctor / hospital / person)")}
        </Box>
      </Section>

      <Section title="Clinical notes">
        <Box sx={grid({ xs: "repeat(2,1fr)", sm: "repeat(5,1fr)" })}>
          {txt("bp", "BP (mmHg)")}
          {txt("pulse", "Pulse (/min)")}
          {txt("temperature", "Temp (°F)")}
          {txt("weight", "Weight (kg)")}
          {txt("spo2", "SpO₂ (%)")}
        </Box>
        <Box sx={{ ...grid({ xs: "1fr", md: "1fr 1fr" }), mt: 1.5 }}>
          {txt("complaints", "Chief complaints", {
            multiline: true,
            minRows: 2,
          })}
          {txt("diagnosis", "Diagnosis", { multiline: true, minRows: 2 })}
        </Box>
      </Section>

      <Section title={`Medicines (${items.length})`}>
        <MedicineAdder onAdd={addItem} />
        <Box sx={{ display: "grid", gap: 1 }}>
          <Box
            sx={{
              display: { xs: "none", md: "grid" },
              gridTemplateColumns:
                "30px minmax(240px,2.4fr) 1fr 1fr 1.2fr 76px",
              gap: 1,
              px: 1.25,
              color: "text.secondary",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>#</span>
            <span>MEDICINE · COMPOSITION</span>
            <span>DOSAGE</span>
            <span>DURATION</span>
            <span>INSTRUCTIONS</span>
            <span />
          </Box>
          {items.map((r, i) => (
            <MedRow
              key={r.key}
              index={i}
              row={r}
              canSave={canSaveMedicine}
              onChange={changeItem}
              onRemove={removeItem}
              onSave={saveRowAsDefault}
            />
          ))}
          {items.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No medicines yet. Search above, or add a blank row.
            </Typography>
          )}
          <Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => addItem({ name: "" })}
            >
              Add blank row
            </Button>
          </Box>
        </Box>
      </Section>

      <Section
        title={`Tests advised (${tests.length})`}
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<ScienceOutlinedIcon />}
            onClick={() => setTestsOpen(true)}
          >
            Advise tests
          </Button>
        }
      >
        {tests.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No tests advised.
          </Typography>
        )}
        <Box sx={{ display: "grid", gap: 1 }}>
          {tests.map((t, i) => (
            <Box
              key={t.key}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr auto", sm: "1.4fr 1fr auto" },
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                size="small"
                label={`Test ${i + 1}`}
                value={t.name}
                helperText={t.departmentName ?? undefined}
                onChange={(e) =>
                  setTests((p) =>
                    p.map((x) =>
                      x.key === t.key ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              <TextField
                size="small"
                label="Note (optional)"
                value={t.note ?? ""}
                sx={{
                  gridColumn: { xs: "1 / -1", sm: "auto" },
                  order: { xs: 3, sm: 0 },
                }}
                onChange={(e) =>
                  setTests((p) =>
                    p.map((x) =>
                      x.key === t.key ? { ...x, note: e.target.value } : x,
                    ),
                  )
                }
              />
              <IconButton
                color="error"
                size="small"
                onClick={() =>
                  setTests((p) => p.filter((x) => x.key !== t.key))
                }
                aria-label="Remove test"
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Section>

      <Section title="Advice & follow-up">
        {txt("advice", "General advice / diet / precautions", {
          multiline: true,
          minRows: 2,
        })}
        <Box sx={{ ...grid({ xs: "1fr", sm: "1fr 2fr" }), mt: 1.5 }}>
          {txt("followUpDate", "Follow-up date", {
            type: "date",
            slotProps: { inputLabel: { shrink: true } },
          })}
          {txt("followUpNote", "Follow-up note")}
        </Box>
      </Section>

      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          p: 1.25,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          pb: "max(10px, var(--safe-bottom, 0px))",
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button onClick={() => router.back()} disabled={save.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={submit}
          disabled={save.isPending}
          sx={{ minWidth: 190, fontWeight: 800 }}
        >
          {save.isPending ? (
            <CircularProgress size={22} color="inherit" />
          ) : prescriptionId ? (
            "Update prescription"
          ) : (
            "Save prescription"
          )}
        </Button>
      </Box>

      <TestAdviceDialog
        open={testsOpen}
        onClose={() => setTestsOpen(false)}
        selected={testsForDialog}
        onChange={setTestsFromDialog}
      />
      {toastNode}
    </Box>
  );
}

"use client";

import { useBranches } from "@/hooks/use-branches";
import {
  useCreateDirectoryRecord,
  useUpdateDirectoryRecord,
} from "@/hooks/use-directory";
import { getApiErrorMessage } from "@/lib/api-error";
import { toIndianMobile } from "@/lib/phone";
import {
  DirectoryKind,
  DirectoryPayload,
  DirectoryRecord,
} from "@/types/directory";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

export const DIRECTORY_LABEL: Record<DirectoryKind, string> = {
  doctor: "Doctor",
  referral: "Referral",
  technician: "Technician",
};

type FormState = {
  branchId: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  sameAsMobile: boolean;
  email: string;
  address: string;
  specialization: string;
};

function initialState(record?: DirectoryRecord | null): FormState {
  if (!record) {
    return {
      branchId: "",
      fullName: "",
      phone: "",
      whatsapp: "",
      sameAsMobile: false,
      email: "",
      address: "",
      specialization: "",
    };
  }
  const phoneKey = toIndianMobile(record.phone);
  const waKey = toIndianMobile(record.whatsappNumber);
  const same = !!phoneKey && !!waKey && phoneKey === waKey;
  return {
    branchId: "branchId" in record ? record.branchId : "",
    fullName: record.fullName,
    phone: record.phone,
    whatsapp: same ? "" : (record.whatsappNumber ?? ""),
    sameAsMobile: same,
    email: record.email ?? "",
    address: record.address ?? "",
    specialization: "specialization" in record ? (record.specialization ?? "") : "",
  };
}

function BranchSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: branches } = useBranches({ pageSize: 100 });
  return (
    <TextField
      select
      label="Branch"
      size="small"
      required
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {branches?.items.map((b) => (
        <MenuItem key={b.id} value={b.id}>
          {b.branchName}
        </MenuItem>
      ))}
    </TextField>
  );
}

/**
 * Add / Edit form for Doctor, Referral and Technician.
 * Mount it only while it should be visible ({open && <DirectoryFormDialog/>})
 * so the form always starts fresh from `record` (edit) or empty (add).
 */
export function DirectoryFormDialog({
  kind,
  record,
  onClose,
}: {
  kind: DirectoryKind;
  record?: DirectoryRecord | null;
  onClose: () => void;
}) {
  const isEdit = !!record;
  const label = DIRECTORY_LABEL[kind];
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = useState<FormState>(() => initialState(record));
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({ phone: false, wa: false, email: false });

  const create = useCreateDirectoryRecord(kind);
  const update = useUpdateDirectoryRecord(kind);
  const mutation = isEdit ? update : create;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const waValue = form.sameAsMobile ? form.phone : form.whatsapp;
  const phoneValid = toIndianMobile(form.phone) !== null;
  const waValid = !waValue.trim() || toIndianMobile(waValue) !== null;
  const emailValid =
    !form.email.trim() || /^\S+@\S+\.\S+$/.test(form.email.trim());
  const branchValid = kind !== "technician" || !!form.branchId;

  const phoneError = (submitted || touched.phone) && !phoneValid;
  const waError = (submitted || touched.wa) && !waValid;
  const emailError = (submitted || touched.email) && !emailValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (
      !form.fullName.trim() ||
      !phoneValid ||
      !waValid ||
      !emailValid ||
      !branchValid
    )
      return;

    const payload: DirectoryPayload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      whatsappNumber: waValue.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      ...(kind === "doctor"
        ? { specialization: form.specialization.trim() || undefined }
        : {}),
      ...(kind === "technician" ? { branchId: form.branchId } : {}),
    };

    if (isEdit && record) {
      update.mutate({ id: record.id, data: payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? `Edit ${label}` : `Add ${label}`}
      </DialogTitle>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {kind !== "technician" && (
            <Alert severity="info" sx={{ py: 0 }}>
              {label}s are shared by every lab — changes apply everywhere.
            </Alert>
          )}

          {kind === "technician" && (
            <BranchSelect
              value={form.branchId}
              onChange={(v) => set("branchId", v)}
            />
          )}

          <TextField
            label="Full Name"
            size="small"
            required
            fullWidth
            value={form.fullName}
            error={submitted && !form.fullName.trim()}
            onChange={(e) => set("fullName", e.target.value)}
          />

          <TextField
            label="Mobile Number"
            size="small"
            required
            fullWidth
            value={form.phone}
            error={phoneError}
            helperText={
              phoneError
                ? "Enter a valid 10-digit Indian mobile number."
                : undefined
            }
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            onChange={(e) => set("phone", e.target.value)}
            slotProps={{
              htmlInput: { inputMode: "tel", maxLength: 20 },
            }}
          />

          <Box>
            <TextField
              label="WhatsApp Number (optional)"
              size="small"
              fullWidth
              disabled={form.sameAsMobile}
              value={waValue}
              error={waError}
              helperText={
                waError
                  ? "Enter a valid 10-digit WhatsApp number."
                  : undefined
              }
              onBlur={() => setTouched((t) => ({ ...t, wa: true }))}
              onChange={(e) => set("whatsapp", e.target.value)}
              slotProps={{
                htmlInput: { inputMode: "tel", maxLength: 20 },
              }}
            />
            <FormControlLabel
              sx={{ mt: 0.25, ml: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={form.sameAsMobile}
                  onChange={(e) => set("sameAsMobile", e.target.checked)}
                />
              }
              label="Same as mobile number"
            />
          </Box>

          <TextField
            label="Email (optional)"
            size="small"
            fullWidth
            type="email"
            value={form.email}
            error={emailError}
            helperText={emailError ? "Enter a valid email address." : undefined}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            onChange={(e) => set("email", e.target.value)}
          />

          {kind === "doctor" && (
            <TextField
              label="Specialization (optional)"
              size="small"
              fullWidth
              value={form.specialization}
              onChange={(e) => set("specialization", e.target.value)}
            />
          )}

          <TextField
            label="Address (optional)"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />

          {mutation.isError && (
            <Alert severity="error">
              {getApiErrorMessage(mutation.error, "Could not save. Please try again.")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : isEdit ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

/** "Add Doctor" / "Add Referral" / "Add Technician" button + its dialog. */
export function AddDirectoryButton({ kind }: { kind: DirectoryKind }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ width: { xs: "100%", sm: "auto" } }}
      >
        Add {DIRECTORY_LABEL[kind]}
      </Button>
      {open && (
        <DirectoryFormDialog kind={kind} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

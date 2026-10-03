"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { createDoctorApi, createReferralApi } from "@/lib/api/directory";
import { getDoctorsApi, getReferralsApi } from "@/lib/api/lookups";
import { LookupDto } from "@/types/lookup";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  specialization: string;
};

/**
 * Same rule as the backend (PhoneNormalizer.ToIndianMobile):
 * Indian mobile -> exactly 10 digits, or null if it isn't one.
 * Strips +91 / 91 (12 digits), 0 (11 digits), 0091 (14 digits) and any
 * spaces/dashes/brackets. The 10 digits must start with 6, 7, 8 or 9.
 */
function toIndianMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 14 && d.startsWith("0091")) d = d.slice(4);
  else if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/** Last 10 digits — matches old records that were saved as "+91 98300-12345". */
function matchKey(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Add a Doctor / Referral without leaving the New Order page.
 * Mount it only while it should be visible ({open && <QuickAddPersonDialog/>})
 * so the form always starts fresh with the text the user had typed (`seed`).
 *
 * Phone: Indian 10-digit mobile only (saved as 10 digits).
 * Duplicate protection:
 *  - same phone number  -> blocked (Save disabled) + "Use this ..." button
 *  - same name, other phone -> warning only + "Use" button, Save still allowed
 *  The backend enforces the phone/email rule too, so this is just friendly UX.
 */
export function QuickAddPersonDialog({
  kind,
  seed,
  onClose,
  onCreated,
}: {
  kind: "doctor" | "referral";
  /** Whatever the user typed in the search box. */
  seed: string;
  onClose: () => void;
  /** Called with the new record, or with an existing one the user chose to use. */
  onCreated: (person: LookupDto) => void;
}) {
  const qc = useQueryClient();
  const label = kind === "doctor" ? "Doctor" : "Referral";
  const lower = label.toLowerCase();

  // Typed digits -> prefill phone, typed text -> prefill name.
  const looksLikePhone = /^[\d+\-\s()]{3,}$/.test(seed);
  const [form, setForm] = useState<FormState>({
    fullName: looksLikePhone ? "" : seed,
    phone: looksLikePhone ? (toIndianMobile(seed) ?? seed) : "",
    email: "",
    address: "",
    specialization: "",
  });
  const [phoneTouched, setPhoneTouched] = useState(false);

  function handlePhoneChange(value: string) {
    // Keep only characters a phone number can have, then collapse a pasted
    // "+91 98300 12345" / "098300 12345" straight to the 10 digits.
    const cleaned = value.replace(/[^\d+\s-]/g, "");
    setForm((f) => ({ ...f, phone: toIndianMobile(cleaned) ?? cleaned }));
  }

  // ---------- live duplicate check ----------
  const phoneNorm = toIndianMobile(form.phone); // 10 digits or null
  const nameKey = normName(form.fullName);
  const dPhoneNorm = toIndianMobile(useDebounce(form.phone.trim(), 400));
  const dName = useDebounce(form.fullName.trim(), 400);
  const dNameKey = normName(dName);

  const search = (q: string) =>
    kind === "doctor" ? getDoctorsApi(q) : getReferralsApi(q);

  const phoneQ = useQuery({
    queryKey: ["dup-check", kind, "phone", dPhoneNorm],
    queryFn: () => search(dPhoneNorm as string),
    enabled: !!dPhoneNorm,
  });
  const nameQ = useQuery({
    queryKey: ["dup-check", kind, "name", dNameKey],
    queryFn: () => search(dName),
    enabled: dNameKey.length >= 3,
  });

  // Only trust results that belong to what is in the box right now
  // (the debounced value may lag behind while the user is typing).
  const phoneDup: LookupDto | undefined =
    phoneNorm && phoneNorm === dPhoneNorm
      ? phoneQ.data?.items.find((p) => matchKey(p.phone) === phoneNorm)
      : undefined;

  const nameDups: LookupDto[] =
    nameKey.length >= 3 && nameKey === dNameKey
      ? (nameQ.data?.items ?? []).filter(
          (p) => p.id !== phoneDup?.id && normName(p.fullName) === nameKey,
        )
      : [];

  // ---------- create ----------
  const mutation = useMutation({
    mutationFn: async (f: FormState) => {
      const base = {
        fullName: f.fullName.trim(),
        phone: toIndianMobile(f.phone) ?? f.phone.trim(),
        email: f.email.trim() || undefined,
        address: f.address.trim() || undefined,
      };
      const specialization = f.specialization.trim() || undefined;
      const { id } =
        kind === "doctor"
          ? await createDoctorApi({ ...base, specialization })
          : await createReferralApi(base);
      return {
        id,
        base,
        specialization: kind === "doctor" ? specialization : undefined,
      };
    },
    onSuccess: ({ id, base, specialization }) => {
      // Refresh every list that shows doctors / referrals.
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["referrals"] });
      qc.invalidateQueries({ queryKey: ["doctors-list"] });
      qc.invalidateQueries({ queryKey: ["referrals-list"] });

      onCreated({
        id,
        fullName: base.fullName,
        phone: base.phone,
        email: base.email ?? null,
        address: base.address ?? null,
        specialization: specialization ?? null,
      });
    },
  });

  const phoneInvalid = form.phone.trim().length > 0 && !phoneNorm;
  const canSave =
    form.fullName.trim().length > 0 &&
    !!phoneNorm &&
    !phoneDup &&
    !mutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // IMPORTANT: this dialog is rendered inside the New Order <form>. React
    // bubbles events through portals, so without this the outer form's
    // onSubmit would fire too and try to create the ORDER.
    e.stopPropagation();
    if (!canSave) return;
    mutation.mutate(form);
  }

  const showPhoneError = !!phoneDup || (phoneTouched && phoneInvalid);

  return (
    <Dialog
      open
      onClose={mutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      sx={{ "& .MuiDialog-paper": { m: { xs: 1.5, sm: 4 }, width: "100%" } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Add New {label}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {mutation.isError && (
            <Alert severity="error">
              {getApiErrorMessage(mutation.error, `Failed to add ${label}.`)}
            </Alert>
          )}

          {phoneDup && (
            <Alert severity="warning">
              <AlertTitle sx={{ fontWeight: 700 }}>
                This {lower} already exists
              </AlertTitle>
              <ExistingPerson person={phoneDup} />
              <Button
                size="small"
                variant="contained"
                color="warning"
                sx={{ mt: 1.5 }}
                onClick={() => onCreated(phoneDup)}
              >
                Use this {lower}
              </Button>
            </Alert>
          )}

          {!phoneDup && nameDups.length > 0 && (
            <Alert severity="info">
              <AlertTitle sx={{ fontWeight: 700 }}>
                A {lower} with the same name already exists
              </AlertTitle>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {nameDups.map((p) => (
                  <Box key={p.id}>
                    <ExistingPerson person={p} />
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.75 }}
                      onClick={() => onCreated(p)}
                    >
                      Use this {lower}
                    </Button>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                Different person? Just continue and save.
              </Typography>
            </Alert>
          )}

          <TextField
            label="Full Name"
            size="small"
            required
            fullWidth
            autoFocus={!form.fullName}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <TextField
            label="Phone"
            size="small"
            required
            fullWidth
            autoFocus={!!form.fullName && !form.phone}
            value={form.phone}
            error={showPhoneError}
            helperText={
              phoneTouched && phoneInvalid
                ? "Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9)."
                : "10-digit mobile number"
            }
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">+91</InputAdornment>
                ),
              },
              htmlInput: { inputMode: "tel", maxLength: 17 },
            }}
          />
          {kind === "doctor" && (
            <TextField
              label="Specialization"
              size="small"
              fullWidth
              value={form.specialization}
              onChange={(e) =>
                setForm({ ...form, specialization: e.target.value })
              }
            />
          )}
          <TextField
            label="Email"
            size="small"
            fullWidth
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Address"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            color="inherit"
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSave}>
            {mutation.isPending ? "Saving..." : "Save & Select"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function ExistingPerson({ person }: { person: LookupDto }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {person.fullName}
        {person.specialization ? ` · ${person.specialization}` : ""}
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        {person.phone}
        {person.address ? ` · ${person.address}` : ""}
      </Typography>
    </Box>
  );
}

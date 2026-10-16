"use client";

import { useCreateDoctor, useUpdateDoctor } from "@/hooks/use-directory";
import { getApiErrorMessage } from "@/lib/api-error";
import { DoctorFullDto } from "@/types/directory";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** null / undefined = add a new doctor, otherwise edit this one. */
  doctor?: DoctorFullDto | null;
}

export function DoctorFormDialog({ open, onClose, doctor }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={fullScreen}
    >
      {/* Body mounts fresh every time the dialog opens, so the form always starts clean. */}
      <DoctorFormBody doctor={doctor ?? null} onClose={onClose} />
    </Dialog>
  );
}

function DoctorFormBody({
  doctor,
  onClose,
}: {
  doctor: DoctorFullDto | null;
  onClose: () => void;
}) {
  const isEdit = !!doctor;
  const [form, setForm] = useState({
    fullName: doctor?.fullName ?? "",
    phone: doctor?.phone ?? "",
    email: doctor?.email ?? "",
    address: doctor?.address ?? "",
    specialization: doctor?.specialization ?? "",
  });

  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const mutation = isEdit ? updateDoctor : createDoctor;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) return;

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      specialization: form.specialization.trim() || undefined,
    };

    if (doctor) {
      updateDoctor.mutate(
        { id: doctor.id, data: payload },
        { onSuccess: onClose },
      );
    } else {
      createDoctor.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? "Edit Doctor" : "Add Doctor"}
      </DialogTitle>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {mutation.isError && (
            <Alert severity="error">
              {getApiErrorMessage(mutation.error, "Could not save the doctor.")}
            </Alert>
          )}
          {isEdit && (
            <Alert severity="info" sx={{ py: 0 }}>
              Doctors are shared by every lab — changes appear everywhere.
            </Alert>
          )}
          <TextField
            label="Full Name"
            size="small"
            required
            fullWidth
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <TextField
            label="Phone"
            size="small"
            required
            fullWidth
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <TextField
            label="Email"
            size="small"
            fullWidth
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Specialization"
            size="small"
            fullWidth
            value={form.specialization}
            onChange={(e) =>
              setForm({ ...form, specialization: e.target.value })
            }
          />
          <TextField
            label="Address"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              mutation.isPending || !form.fullName.trim() || !form.phone.trim()
            }
          >
            {mutation.isPending
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </>
  );
}

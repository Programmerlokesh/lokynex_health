"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import {
  EmptyState,
  StatusChip,
  useDialogFullScreen,
  useToast,
} from "@/components/clinic/clinic-ui";
import {
  useClinicDoctors,
  useClinicMe,
  useSaveClinicDoctor,
} from "@/hooks/use-clinic";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import type { ClinicDoctor } from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

function DoctorDialog({
  doctor,
  open,
  onClose,
}: {
  doctor: ClinicDoctor | null;
  open: boolean;
  onClose: () => void;
}) {
  const fullScreen = useDialogFullScreen();
  const { toast, toastNode } = useToast();
  const save = useSaveClinicDoctor();
  const [f, setF] = useState({
    fullName: doctor?.fullName ?? "",
    qualification: doctor?.qualification ?? "",
    specialization: doctor?.specialization ?? "",
    registrationNo: doctor?.registrationNo ?? "",
    phone: doctor?.phone ?? "",
    email: doctor?.email ?? "",
    status: doctor?.status ?? "Active",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.fullName.trim()) {
      toast("Doctor name is required", "error");
      return;
    }
    save.mutate(
      {
        id: doctor?.id ?? null,
        data: { ...f, status: f.status as "Active" | "Inactive" },
      },
      {
        onSuccess: onClose,
        onError: (e) => toast(getApiErrorMessage(e), "error"),
      },
    );
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {doctor ? "Edit doctor" : "Add doctor"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        <TextField
          size="small"
          label="Full name *"
          value={f.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
        <TextField
          size="small"
          label="Qualification (printed on prescription)"
          placeholder="MBBS, MD (Medicine)"
          value={f.qualification}
          onChange={(e) => set("qualification", e.target.value)}
        />
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Specialization"
            value={f.specialization}
            onChange={(e) => set("specialization", e.target.value)}
          />
          <TextField
            size="small"
            label="Registration no."
            value={f.registrationNo}
            onChange={(e) => set("registrationNo", e.target.value)}
          />
          <TextField
            size="small"
            label="Phone"
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <TextField
            size="small"
            label="Email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Box>
        {doctor && (
          <TextField
            select
            size="small"
            label="Status"
            value={f.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={save.isPending}>
          Save
        </Button>
      </DialogActions>
      {toastNode}
    </Dialog>
  );
}

export default function DoctorsPage() {
  const { data: me } = useClinicMe();
  const { data: doctors } = useClinicDoctors();
  const [editing, setEditing] = useState<ClinicDoctor | null>(null);
  const [open, setOpen] = useState(false);
  const canCreate = canDo(me?.permissions, me?.isAdmin, "doctors", "create");
  const canEdit = canDo(me?.permissions, me?.isAdmin, "doctors", "edit");
  const openDialog = (d: ClinicDoctor | null) => {
    setEditing(d);
    setOpen(true);
  };

  return (
    <>
      <PageTitle
        title="Doctors"
        subtitle="Doctors of this clinic — their details are printed on prescriptions"
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog(null)}
            >
              Add doctor
            </Button>
          )
        }
      />
      {!doctors?.length ? (
        <EmptyState text="No doctors yet." />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {doctors.map((d) => (
            <Paper
              key={d.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 4,
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800}>{d.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {[d.qualification, d.specialization]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {[d.registrationNo && `Reg. ${d.registrationNo}`, d.phone]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <StatusChip status={d.status} />
                </Box>
              </Box>
              {canEdit && (
                <IconButton
                  onClick={() => openDialog(d)}
                  aria-label="Edit doctor"
                >
                  <EditOutlinedIcon />
                </IconButton>
              )}
            </Paper>
          ))}
        </Box>
      )}
      {open && (
        <DoctorDialog
          key={editing?.id ?? "new"}
          doctor={editing}
          open
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

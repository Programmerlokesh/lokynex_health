"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import {
  EmptyState,
  useDialogFullScreen,
  useToast,
} from "@/components/clinic/clinic-ui";
import { SearchBar, StatusPill, kitCardSx } from "@/components/common/page-kit";
import {
  useClinicDoctors,
  useClinicMe,
  useSaveClinicDoctor,
} from "@/hooks/use-clinic";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import { ALL_SPECIALIZATIONS } from "@/lib/clinic/specializations";
import { SpecialtyIcon3D } from "@/lib/clinic/specialty-icon-3d";
import type { ClinicDoctor } from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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
  const [done, setDone] = useState<{ name: string; spec: string } | null>(null);
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
        onSuccess: () => {
          if (doctor) onClose();
          else
            setDone({ name: f.fullName.trim(), spec: f.specialization.trim() });
        },
        onError: (e) => toast(getApiErrorMessage(e), "error"),
      },
    );
  };

  if (done) {
    return (
      <Dialog open onClose={onClose} fullWidth maxWidth="xs">
        <DialogContent
          sx={{
            textAlign: "center",
            py: 4,
            display: "grid",
            justifyItems: "center",
            gap: 1.5,
          }}
        >
          <SpecialtyIcon3D specialization={done.spec} size={96} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {done.name} added
          </Typography>
          <Typography color="text.secondary">
            {done.spec || "No specialization set"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" onClick={onClose}>
            Done
          </Button>
        </DialogActions>
        {toastNode}
      </Dialog>
    );
  }

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <SpecialtyIcon3D specialization={f.specialization} size={64} />
          <TextField
            fullWidth
            size="small"
            label="Full name *"
            value={f.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </Box>
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
          <Autocomplete
            freeSolo
            size="small"
            options={ALL_SPECIALIZATIONS}
            groupBy={(o) => (typeof o === "string" ? "" : o.group)}
            getOptionLabel={(o) => (typeof o === "string" ? o : o.name)}
            inputValue={f.specialization}
            onInputChange={(_, v) => set("specialization", v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Specialization"
                helperText="Pick from the list or type your own"
              />
            )}
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
  const [search, setSearch] = useState("");
  const canCreate = canDo(me?.permissions, me?.isAdmin, "doctors", "create");
  const canEdit = canDo(me?.permissions, me?.isAdmin, "doctors", "edit");
  const openDialog = (d: ClinicDoctor | null) => {
    setEditing(d);
    setOpen(true);
  };

  const q = search.trim().toLowerCase();
  const shown = (doctors ?? []).filter(
    (d) =>
      !q ||
      d.fullName.toLowerCase().includes(q) ||
      (d.specialization ?? "").toLowerCase().includes(q),
  );

  return (
    <>
      <PageTitle
        title="Doctors"
        subtitle="Doctors of this clinic. Their details are printed on prescriptions."
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
      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or specialization"
        />
      </Box>
      {!shown.length ? (
        <EmptyState
          text={
            doctors?.length
              ? "No doctor matches your search."
              : "No doctors yet."
          }
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
              xl: "repeat(3, 1fr)",
            },
          }}
        >
          {shown.map((d) => (
            <Box
              key={d.id}
              sx={{
                ...kitCardSx,
                p: 2,
                display: "flex",
                gap: 2,
                alignItems: "center",
                opacity: d.status === "Active" ? 1 : 0.7,
              }}
            >
              <SpecialtyIcon3D specialization={d.specialization} size={60} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 800 }} noWrap>
                  {d.fullName}
                </Typography>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                  noWrap
                >
                  {d.specialization || "No specialization"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                  noWrap
                >
                  {[
                    d.qualification,
                    d.registrationNo && `Reg. ${d.registrationNo}`,
                    d.phone,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <StatusPill active={d.status === "Active"} label={d.status} />
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
            </Box>
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

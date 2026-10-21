"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import { EmptyState, useToast } from "@/components/clinic/clinic-ui";
import {
  Avatar,
  SearchBar,
  StatStrip,
  kitCardSx,
} from "@/components/common/page-kit";
import {
  useClinicMe,
  useClinicPatientHistory,
  useClinicPatientMutations,
  useClinicPatients,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import { fmtRxDate } from "@/lib/clinic/prescription-html";
import { formatDateTime } from "@/lib/format";
import { toIndianMobile } from "@/lib/phone";
import type { ClinicPatient } from "@/types/clinic";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Pagination,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

/** "Edited by @riya · 21 Oct 2026, 3:40 pm" - only shown after someone edited the patient. */
function EditedNote({ p }: { p: ClinicPatient }) {
  if (!p.editedByUsername && !p.editedAt) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        color: "text.secondary",
        fontSize: 12,
      }}
    >
      <HistoryEduOutlinedIcon sx={{ fontSize: 15 }} />
      <span>
        Edited by <b>@{p.editedByUsername ?? "unknown"}</b>
        {p.editedAt ? ` · ${formatDateTime(p.editedAt)}` : ""}
      </span>
    </Box>
  );
}

function EditDialog({
  patient,
  onClose,
  onSaved,
}: {
  patient: ClinicPatient;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const { update } = useClinicPatientMutations();
  const [f, setF] = useState({
    name: patient.name,
    age: patient.age != null ? String(patient.age) : "",
    gender: patient.gender ?? "",
    phone: patient.phone,
    whatsapp: patient.whatsappNumber ?? "",
    email: patient.email ?? "",
    address: patient.address ?? "",
    pincode: patient.pincode ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function save() {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Required";
    if (!toIndianMobile(f.phone)) e.phone = "Valid 10-digit mobile";
    if (f.whatsapp.trim() && !toIndianMobile(f.whatsapp))
      e.whatsapp = "Valid 10-digit mobile";
    if (f.age && (Number(f.age) < 0 || Number(f.age) > 150)) e.age = "0 - 150";
    setErrors(e);
    if (Object.keys(e).length) return;
    setServerError(null);
    update.mutate(
      {
        id: patient.id,
        data: {
          name: f.name.trim(),
          age: f.age ? Number(f.age) : null,
          gender: f.gender || null,
          phone: f.phone.trim(),
          whatsappNumber: f.whatsapp.trim() || null,
          email: f.email.trim() || null,
          address: f.address.trim() || null,
          pincode: f.pincode.trim() || null,
        },
      },
      {
        onSuccess: () => onSaved("Patient updated."),
        onError: (err) =>
          setServerError(
            getApiErrorMessage(err, "Could not update the patient."),
          ),
      },
    );
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Edit patient</DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 1.5 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr 1fr", sm: "2fr 1fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Name *"
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
          />
          <TextField
            size="small"
            label="Age"
            type="number"
            value={f.age}
            onChange={(e) => set("age", e.target.value)}
            error={!!errors.age}
            helperText={errors.age}
          />
          <TextField
            select
            size="small"
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
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Mobile *"
            type="tel"
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
          />
          <TextField
            size="small"
            label="WhatsApp"
            type="tel"
            value={f.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            error={!!errors.whatsapp}
            helperText={errors.whatsapp ?? "Empty = same as mobile"}
          />
        </Box>
        <TextField
          size="small"
          label="Email"
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "3fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Address"
            value={f.address}
            onChange={(e) => set("address", e.target.value)}
          />
          <TextField
            size="small"
            label="Pincode"
            value={f.pincode}
            onChange={(e) => set("pincode", e.target.value)}
          />
        </Box>
        <EditedNote p={patient} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={update.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function History({
  id,
  onClose,
  canEdit,
  onEdit,
}: {
  id: string;
  onClose: () => void;
  canEdit: boolean;
  onEdit: (p: ClinicPatient) => void;
}) {
  const { data, isLoading } = useClinicPatientHistory(id);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {data && <Avatar name={data.patient.name} size={40} />}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {data?.patient.name ?? "Patient"}
        </Box>
        {canEdit && data && (
          <Button
            size="small"
            startIcon={<EditOutlinedIcon />}
            onClick={() => onEdit(data.patient)}
          >
            Edit
          </Button>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading || !data ? (
          <CircularProgress />
        ) : (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.75 }}
            >
              {[
                data.patient.age != null && `${data.patient.age} yrs`,
                data.patient.gender,
                data.patient.phone,
                data.patient.address,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
            {data.patient.createdAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                Added {formatDateTime(data.patient.createdAt)}
              </Typography>
            )}
            <Box sx={{ mt: 0.5, mb: 1.5 }}>
              <EditedNote p={data.patient} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Visits ({data.prescriptions.length})
            </Typography>
            <List dense>
              {data.prescriptions.map((p) => (
                <ListItemButton
                  key={p.id}
                  component={Link}
                  href={`/clinic/prescriptions/${p.id}`}
                >
                  <ListItemText
                    primary={`${fmtRxDate(p.visitDate)} · ${p.rxNo}`}
                    secondary={`${p.doctorName}${p.diagnosis ? ` — ${p.diagnosis}` : ""}`}
                  />
                </ListItemButton>
              ))}
              {!data.prescriptions.length && (
                <Typography variant="body2" color="text.secondary">
                  No prescriptions yet.
                </Typography>
              )}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClinicPatient | null>(null);
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const canEdit = canDo(me?.permissions, me?.isAdmin, "patients", "edit");

  const q = useDebounce(search.trim(), 300);
  const { data } = useClinicPatients({
    search: q || undefined,
    pageNumber: page,
    pageSize: 20,
  });

  return (
    <>
      <PageTitle
        title="Patients"
        subtitle="Saved when you write a prescription. You can edit the details at any time."
      />

      {data && (
        <Box sx={{ mb: 2 }}>
          <StatStrip
            items={[
              {
                label: q ? "Matching patients" : "Total patients",
                value: data.totalCount,
              },
              { label: "On this page", value: data.items.length },
              {
                label: "Edited by staff",
                value: data.items.filter((p) => p.editedByUsername).length,
              },
            ]}
          />
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name or mobile number"
        />
      </Box>

      {!data?.items.length ? (
        <EmptyState text="No patients found." />
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
          {data.items.map((p) => (
            <Box
              key={p.id}
              onClick={() => setOpen(p.id)}
              sx={{
                ...kitCardSx,
                p: 1.75,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                transition: "border-color .15s, box-shadow .15s",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 8px 22px rgba(23,43,77,0.10)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Avatar name={p.name} size={44} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.25 }} noWrap>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[p.age != null ? `${p.age} yrs` : null, p.gender]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Typography>
                </Box>
                {canEdit && (
                  <Tooltip title="Edit patient">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(p);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 0.4,
                  color: "text.secondary",
                  fontSize: 13,
                }}
              >
                <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                  <CallOutlinedIcon sx={{ fontSize: 15 }} /> {p.phone}
                </Box>
                {p.address && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.75,
                      alignItems: "center",
                      minWidth: 0,
                    }}
                  >
                    <PlaceOutlinedIcon sx={{ fontSize: 15 }} />
                    <Typography noWrap sx={{ fontSize: 13 }}>
                      {p.address}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  label={`${p.visitCount} visit${p.visitCount === 1 ? "" : "s"}`}
                />
                {p.lastVisitAt && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Last: ${fmtRxDate(p.lastVisitAt)}`}
                  />
                )}
              </Box>

              <EditedNote p={p} />
            </Box>
          ))}
        </Box>
      )}

      {!!data && data.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={data.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
          />
        </Box>
      )}

      {open && !editing && (
        <History
          id={open}
          onClose={() => setOpen(null)}
          canEdit={canEdit}
          onEdit={setEditing}
        />
      )}
      {editing && (
        <EditDialog
          key={editing.id}
          patient={editing}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setEditing(null);
            toast(m);
          }}
        />
      )}
      {toastNode}
    </>
  );
}

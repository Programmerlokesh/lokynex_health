"use client";

import { StatusChip } from "@/components/clinic/clinic-ui";
import {
  useClinicAdminMutations,
  useClinicDetail,
  useClinics,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ClinicStatus, CreateClinicRequest } from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

const two = {
  display: "grid",
  gap: 1.5,
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
} as const;

/* ---------------- create ---------------- */
export function CreateClinicDialog() {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const { create } = useClinicAdminMutations();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blank: CreateClinicRequest = {
    clinicName: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    pincode: "",
    registrationNo: "",
    adminName: "",
    adminPhone: "",
    adminAddress: "",
    adminEmail: "",
    adminUsername: "",
    adminPassword: "",
    userLimit: 5,
    doctorQualification: "",
    doctorSpecialization: "",
    doctorRegistrationNo: "",
  };
  const [f, setF] = useState<CreateClinicRequest>(blank);
  const set = <K extends keyof CreateClinicRequest>(
    k: K,
    v: CreateClinicRequest[K],
  ) => setF((p) => ({ ...p, [k]: v }));
  const txt = (
    k: keyof CreateClinicRequest,
    label: string,
    extra: Record<string, unknown> = {},
  ) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={f[k] as string}
      onChange={(e) => set(k, e.target.value as never)}
      {...extra}
    />
  );

  const close = () => {
    setOpen(false);
    setError(null);
  };
  const submit = () => {
    setError(null);
    const need: [string, string][] = [
      [f.clinicName, "Clinic name"],
      [f.address, "Clinic address"],
      [f.phone, "Clinic phone"],
      [f.email, "Clinic email"],
      [f.pincode, "Pincode"],
      [f.adminName, "Doctor / admin name"],
      [f.adminPhone, "Admin phone"],
      [f.adminEmail, "Admin email"],
      [f.adminUsername, "Username"],
      [f.adminPassword, "Password"],
    ];
    const miss = need.find(([v]) => !v.trim());
    if (miss) {
      setError(`${miss[1]} is required.`);
      return;
    }
    if (f.adminPassword.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }
    create.mutate(
      { ...f, userLimit: Number(f.userLimit) || 5 },
      {
        onSuccess: () => {
          setF(blank);
          close();
        },
        onError: (e) => setError(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Create clinic
      </Button>
      <Dialog
        open={open}
        onClose={close}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Create doctor clinic</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="subtitle2" fontWeight={800}>
            Clinic
          </Typography>
          {txt("clinicName", "Clinic name *")}
          {txt("tagline", "Tagline (optional)")}
          <Box sx={two}>
            {txt("phone", "Clinic phone *")}
            {txt("email", "Clinic email *", { type: "email" })}
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
            }}
          >
            {txt("address", "Address *")}
            {txt("pincode", "Pincode *")}
            {txt("registrationNo", "Clinic reg. no.")}
          </Box>
          <Typography variant="subtitle2" fontWeight={800}>
            Doctor / clinic admin (first login)
          </Typography>
          <Box sx={two}>
            {txt("adminName", "Doctor name *")}
            {txt("adminPhone", "Phone *")}
          </Box>
          <Box sx={two}>
            {txt("adminEmail", "Email *", { type: "email" })}
            {txt("adminAddress", "Address")}
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
            }}
          >
            {txt("doctorQualification", "Qualification (MBBS, MD…)")}
            {txt("doctorSpecialization", "Specialization")}
            {txt("doctorRegistrationNo", "Medical reg. no.")}
          </Box>
          <Typography variant="subtitle2" fontWeight={800}>
            Login
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 0.7fr" },
            }}
          >
            {txt("adminUsername", "Username *", { autoComplete: "off" })}
            {txt("adminPassword", "Password * (min 8)", {
              type: "password",
              autoComplete: "new-password",
            })}
            {txt("userLimit", "User limit", { type: "number" })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={create.isPending}
          >
            {create.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Create clinic"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ---------------- edit ---------------- */
function EditClinicDialog({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const { data } = useClinicDetail(id);
  const { update, resetPassword } = useClinicAdminMutations();
  const [f, setF] = useState<Record<string, string> | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // copy the loaded record into the form once
  if (data && !f) {
    setF({
      clinicName: data.name,
      tagline: data.tagline ?? "",
      address: data.address,
      phone: data.phone,
      email: data.email,
      pincode: data.pincode,
      registrationNo: data.registrationNo ?? "",
      adminName: data.adminName,
      adminPhone: data.adminPhone,
      adminAddress: data.adminAddress ?? "",
      adminEmail: data.adminEmail,
      userLimit: String(data.userLimit),
      status: data.status,
    });
  }
  const set = (k: string, v: string) => setF((p) => (p ? { ...p, [k]: v } : p));
  const txt = (k: string, label: string) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={f?.[k] ?? ""}
      onChange={(e) => set(k, e.target.value)}
    />
  );

  const save = () => {
    if (!f) return;
    update.mutate(
      {
        id,
        data: {
          clinicName: f.clinicName,
          tagline: f.tagline,
          address: f.address,
          phone: f.phone,
          email: f.email,
          pincode: f.pincode,
          registrationNo: f.registrationNo,
          adminName: f.adminName,
          adminPhone: f.adminPhone,
          adminAddress: f.adminAddress,
          adminEmail: f.adminEmail,
          userLimit: Number(f.userLimit) || 1,
          status: f.status as ClinicStatus,
        },
      },
      {
        onSuccess: onClose,
        onError: (e) => setMsg({ ok: false, text: getApiErrorMessage(e) }),
      },
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        Edit clinic {data ? `· ${data.clinicCode}` : ""}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        {!f ? (
          <CircularProgress />
        ) : (
          <>
            {msg && (
              <Alert severity={msg.ok ? "success" : "error"}>{msg.text}</Alert>
            )}
            {txt("clinicName", "Clinic name")}
            {txt("tagline", "Tagline")}
            <Box sx={two}>
              {txt("phone", "Phone")}
              {txt("email", "Email")}
            </Box>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
              }}
            >
              {txt("address", "Address")}
              {txt("pincode", "Pincode")}
              {txt("registrationNo", "Reg. no.")}
            </Box>
            <Box sx={two}>
              {txt("adminName", "Admin name")}
              {txt("adminPhone", "Admin phone")}
            </Box>
            <Box sx={two}>
              {txt("adminEmail", "Admin email")}
              {txt("adminAddress", "Admin address")}
            </Box>
            <Box sx={two}>
              {txt("userLimit", "User limit")}
              <TextField
                select
                size="small"
                label="Status"
                value={f.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["Active", "Inactive", "Suspended"].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1 }}>
              Reset admin password (username: {data?.adminUsername})
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                type="password"
                label="New password (min 8)"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
              />
              <Button
                variant="outlined"
                disabled={pw.length < 8 || resetPassword.isPending}
                onClick={() =>
                  resetPassword.mutate(
                    { id, pw },
                    {
                      onSuccess: () => {
                        setPw("");
                        setMsg({ ok: true, text: "Password reset." });
                      },
                      onError: (e) =>
                        setMsg({ ok: false, text: getApiErrorMessage(e) }),
                    },
                  )
                }
              >
                Reset
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={!f || update.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ---------------- list ---------------- */
export function ClinicsAdminPanel() {
  const [search, setSearch] = useState("");
  const q = useDebounce(search.trim(), 300);
  const { data, isLoading, error } = useClinics({ search: q || undefined });
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <TextField
        size="small"
        placeholder="Search clinics"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ maxWidth: 420 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      {error && <Alert severity="error">{getApiErrorMessage(error)}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : !data?.items.length ? (
        <Typography color="text.secondary">No clinics yet.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          }}
        >
          {data.items.map((c) => (
            <Paper
              key={c.id}
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
                <Typography fontWeight={800} noWrap>
                  {c.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {c.clinicCode} · {c.adminName} (@{c.adminUsername})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.phone} · {c.userCount}/{c.userLimit} users
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <StatusChip status={c.status} />
                </Box>
              </Box>
              <IconButton
                onClick={() => setEditId(c.id)}
                aria-label="Edit clinic"
              >
                <EditOutlinedIcon />
              </IconButton>
            </Paper>
          ))}
        </Box>
      )}
      {editId && (
        <EditClinicDialog
          key={editId}
          id={editId}
          onClose={() => setEditId(null)}
        />
      )}
    </Box>
  );
}

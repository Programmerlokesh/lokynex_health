"use client";

import {
  ConfirmDialog,
  EmptyState,
  StatusChip,
  useDialogFullScreen,
  useToast,
} from "@/components/clinic/clinic-ui";
import {
  useClinicBookingMutations,
  useClinicBookings,
  useClinicDoctors,
  useClinicMe,
  useClinicScheduleMutations,
  useClinicSchedules,
  useClinicSlots,
} from "@/hooks/use-clinic";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import { toDateInputValue } from "@/lib/format";
import { toIndianMobile } from "@/lib/phone";
import { escapeHtml } from "@/lib/report-editor/sanitize";
import type { ClinicBooking } from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ============================ BOOK ============================ */
export function BookPanel() {
  const { toast, toastNode } = useToast();
  const { data: doctors } = useClinicDoctors({ activeOnly: true });
  const { book } = useClinicBookingMutations();
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [slot, setSlot] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    note: "",
    fee: "",
    method: "Cash",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ serial: number; name: string } | null>(
    null,
  );

  useEffect(() => {
    if (!doctorId && doctors?.length) setDoctorId(doctors[0].id);
  }, [doctors, doctorId]);
  useEffect(() => setSlot(null), [doctorId, date]);

  const { data: slots, isFetching } = useClinicSlots(
    doctorId && date ? { doctorId, date } : null,
  );
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!slot) e.slot = "Choose a time slot";
    if (!f.name.trim()) e.name = "Required";
    if (!toIndianMobile(f.phone)) e.phone = "Valid 10-digit mobile";
    const fee = f.fee.trim() === "" ? 0 : Number(f.fee);
    if (Number.isNaN(fee) || fee < 0) e.fee = "Invalid amount";
    setErrors(e);
    if (Object.keys(e).length) return;
    book.mutate(
      {
        doctorId,
        bookingDate: date,
        timeSlot: slot!,
        patientName: f.name.trim(),
        patientPhone: f.phone.trim(),
        patientEmail: f.email.trim() || undefined,
        patientAge: f.age ? Number(f.age) : undefined,
        patientGender: f.gender || undefined,
        note: f.note.trim() || undefined,
        visitFee: fee,
        paymentMethod: fee > 0 ? f.method : undefined,
      },
      {
        onSuccess: (r) => {
          setDone({ serial: r.serialNo, name: f.name.trim() });
          setF({
            name: "",
            phone: "",
            email: "",
            age: "",
            gender: "",
            note: "",
            fee: "",
            method: "Cash",
          });
          setSlot(null);
        },
        onError: (err) =>
          toast(getApiErrorMessage(err, "Could not book."), "error"),
      },
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 4, display: "grid", gap: 2 }}
    >
      {done && (
        <Alert severity="success" onClose={() => setDone(null)}>
          Booked <b>{done.name}</b> — serial no. <b>#{done.serial}</b>
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
        }}
      >
        <TextField
          select
          size="small"
          label="Doctor"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        >
          {(doctors ?? []).map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.fullName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
          Time slot{" "}
          {errors.slot && (
            <Typography component="span" color="error" variant="caption">
              — {errors.slot}
            </Typography>
          )}
        </Typography>
        {isFetching ? (
          <CircularProgress size={20} />
        ) : !slots?.length ? (
          <Typography variant="body2" color="text.secondary">
            No chamber on this day for this doctor.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {slots.map((s) => (
              <Chip
                key={s.timeSlot}
                clickable={!s.isFull}
                disabled={s.isFull}
                color={slot === s.timeSlot ? "primary" : "default"}
                variant={slot === s.timeSlot ? "filled" : "outlined"}
                onClick={() => setSlot(s.timeSlot)}
                label={`${fmtTime(s.timeSlot)} · ${s.isFull ? "full" : `${s.availableCount} left`}`}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1.2fr 0.7fr 0.9fr" },
        }}
      >
        <TextField
          size="small"
          label="Patient name *"
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
        />
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
          label="Age"
          type="number"
          value={f.age}
          onChange={(e) => set("age", e.target.value)}
        />
        <TextField
          select
          size="small"
          label="Gender"
          value={f.gender}
          onChange={(e) => set("gender", e.target.value)}
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
        >
          <MenuItem value="">—</MenuItem>
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        <TextField
          size="small"
          label="Email"
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
          sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
        />
        <TextField
          size="small"
          label="Visit fee (₹)"
          type="number"
          value={f.fee}
          onChange={(e) => set("fee", e.target.value)}
          error={!!errors.fee}
          helperText={errors.fee}
        />
        <TextField
          select
          size="small"
          label="Payment"
          value={f.method}
          onChange={(e) => set("method", e.target.value)}
          disabled={!(Number(f.fee) > 0)}
        >
          {["Cash", "Card", "UPI"].map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Reason / note"
          value={f.note}
          onChange={(e) => set("note", e.target.value)}
          sx={{ gridColumn: "1 / -1" }}
        />
      </Box>

      <Box>
        <Button
          variant="contained"
          size="large"
          onClick={submit}
          disabled={book.isPending}
          sx={{ fontWeight: 800 }}
        >
          {book.isPending ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Book appointment"
          )}
        </Button>
      </Box>
      {toastNode}
    </Paper>
  );
}

/* ============================ BOOKINGS ============================ */
function printList(date: string, rows: ClinicBooking[], clinicName: string) {
  const body = rows
    .map(
      (b) =>
        `<tr><td>${b.serialNo}</td><td>${escapeHtml(fmtTime(b.timeSlot))}</td><td>${escapeHtml(b.patientName)}${b.patientAge != null ? ` (${b.patientAge})` : ""}</td><td>${escapeHtml(b.patientPhone)}</td><td>${escapeHtml(b.doctorName)}</td><td>${escapeHtml(b.status)}</td></tr>`,
    )
    .join("");
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const d = iframe.contentDocument!;
  d.open();
  d.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>Patient list</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;font-size:12px}h2{margin:0 0 2px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #999;padding:5px 7px;text-align:left}th{background:#eee}</style></head><body><h2>${escapeHtml(clinicName)}</h2><div>Patient list — ${escapeHtml(date)}</div><table><thead><tr><th>#</th><th>Time</th><th>Patient</th><th>Mobile</th><th>Doctor</th><th>Status</th></tr></thead><tbody>${body}</tbody></table></body></html>`,
  );
  d.close();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 60_000);
  }, 150);
}

export function BookingsPanel() {
  const router = useRouter();
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const { data: doctors } = useClinicDoctors();
  const { cancel } = useClinicBookingMutations();
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [doctorId, setDoctorId] = useState("");
  const [toCancel, setToCancel] = useState<ClinicBooking | null>(null);
  const { data: rows, isFetching } = useClinicBookings({
    date,
    doctorId: doctorId || undefined,
  });

  const canRx = canDo(me?.permissions, me?.isAdmin, "prescriptions", "create");
  const canEdit = canDo(me?.permissions, me?.isAdmin, "appointments", "edit");
  const live = useMemo(
    () => (rows ?? []).filter((b) => b.status !== "Cancelled"),
    [rows],
  );
  const money = useMemo(() => live.reduce((s, b) => s + b.visitFee, 0), [live]);

  const writeRx = (b: ClinicBooking) => {
    const p = new URLSearchParams({
      bookingId: b.id,
      doctorId: b.doctorId,
      name: b.patientName,
      phone: b.patientPhone,
    });
    if (b.patientAge != null) p.set("age", String(b.patientAge));
    if (b.patientGender) p.set("gender", b.patientGender);
    if (b.patientEmail) p.set("email", b.patientEmail);
    router.push(`/clinic/prescriptions/new?${p.toString()}`);
  };

  const rowActions = (b: ClinicBooking) => (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      {b.prescriptionId ? (
        <Tooltip title="View prescription">
          <IconButton
            size="small"
            component={Link}
            href={`/clinic/prescriptions/${b.prescriptionId}`}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : b.status === "Booked" && canRx ? (
        <Tooltip title="Write prescription">
          <IconButton size="small" color="primary" onClick={() => writeRx(b)}>
            <NoteAddOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {b.status === "Booked" && canEdit && (
        <Tooltip title="Cancel appointment">
          <IconButton size="small" color="error" onClick={() => setToCancel(b)}>
            <CancelOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 4,
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1.5fr auto" },
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          type="date"
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          size="small"
          label="Doctor"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        >
          <MenuItem value="">All doctors</MenuItem>
          {(doctors ?? []).map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.fullName}
            </MenuItem>
          ))}
        </TextField>
        <Button
          startIcon={<PrintOutlinedIcon />}
          disabled={!rows?.length}
          onClick={() => printList(date, rows ?? [], me?.clinicName ?? "")}
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
        >
          Print list
        </Button>
      </Paper>
      <Typography variant="body2" color="text.secondary">
        {live.length} patient(s) · fees ₹{money.toLocaleString("en-IN")}
      </Typography>

      {isFetching && !rows ? (
        <CircularProgress size={22} />
      ) : !rows?.length ? (
        <EmptyState text="No appointments for this day." />
      ) : (
        <>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 4, display: { xs: "none", md: "block" } }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((b) => (
                  <TableRow
                    key={b.id}
                    hover
                    sx={{ opacity: b.status === "Cancelled" ? 0.55 : 1 }}
                  >
                    <TableCell sx={{ fontWeight: 800 }}>{b.serialNo}</TableCell>
                    <TableCell>{fmtTime(b.timeSlot)}</TableCell>
                    <TableCell>
                      {b.patientName}
                      {b.patientAge != null ? ` (${b.patientAge})` : ""}
                      {b.reason && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          {b.reason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{b.patientPhone}</TableCell>
                    <TableCell>{b.doctorName}</TableCell>
                    <TableCell align="right">
                      {b.visitFee > 0
                        ? `₹${b.visitFee}${b.paymentMethod ? ` · ${b.paymentMethod}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={b.status} />
                    </TableCell>
                    <TableCell align="right">{rowActions(b)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1 }}>
            {rows.map((b) => (
              <Paper
                key={b.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  opacity: b.status === "Cancelled" ? 0.55 : 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>
                      #{b.serialNo} · {b.patientName}
                      {b.patientAge != null ? ` (${b.patientAge})` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fmtTime(b.timeSlot)} · {b.patientPhone} · {b.doctorName}
                    </Typography>
                  </Box>
                  {rowActions(b)}
                </Box>
                <Box sx={{ display: "flex", gap: 0.75, mt: 0.75 }}>
                  <StatusChip status={b.status} />
                  {b.visitFee > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`₹${b.visitFee}`}
                    />
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}
      <ConfirmDialog
        open={!!toCancel}
        title="Cancel this appointment?"
        danger
        confirmLabel="Cancel appointment"
        busy={cancel.isPending}
        text={
          toCancel
            ? `${toCancel.patientName} (#${toCancel.serialNo}).${toCancel.visitFee > 0 ? ` The ₹${toCancel.visitFee} fee will be recorded as a refund in the ledger.` : ""}`
            : ""
        }
        onClose={() => setToCancel(null)}
        onConfirm={() =>
          toCancel &&
          cancel.mutate(toCancel.id, {
            onSuccess: () => {
              setToCancel(null);
              toast("Appointment cancelled");
            },
            onError: (e) => {
              setToCancel(null);
              toast(getApiErrorMessage(e), "error");
            },
          })
        }
      />
      {toastNode}
    </Box>
  );
}

/* ============================ SCHEDULES ============================ */
function ScheduleDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fullScreen = useDialogFullScreen();
  const { toast, toastNode } = useToast();
  const { data: doctors } = useClinicDoctors({ activeOnly: true });
  const { create } = useClinicScheduleMutations();
  const [f, setF] = useState({
    doctorId: "",
    day: 1,
    from: "10:00",
    to: "13:00",
    slot: 15,
    max: 1,
  });
  useEffect(() => {
    if (open && !f.doctorId && doctors?.length)
      setF((p) => ({ ...p, doctorId: doctors[0].id }));
  }, [open, doctors, f.doctorId]);

  const submit = () =>
    create.mutate(
      {
        doctorId: f.doctorId,
        dayOfWeek: f.day,
        slotMinutes: Number(f.slot),
        timeFrom: `${f.from}:00`,
        timeTo: `${f.to}:00`,
        maxPatients: Number(f.max),
      },
      {
        onSuccess: () => {
          toast("Schedule added");
          onClose();
        },
        onError: (e) => toast(getApiErrorMessage(e), "error"),
      },
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Add chamber schedule</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        <TextField
          select
          size="small"
          label="Doctor"
          value={f.doctorId}
          onChange={(e) => setF({ ...f, doctorId: e.target.value })}
        >
          {(doctors ?? []).map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.fullName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Day"
          value={f.day}
          onChange={(e) => setF({ ...f, day: Number(e.target.value) })}
        >
          {DAYS.map((d, i) => (
            <MenuItem key={d} value={i}>
              {d}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <TextField
            size="small"
            type="time"
            label="From"
            value={f.from}
            onChange={(e) => setF({ ...f, from: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="time"
            label="To"
            value={f.to}
            onChange={(e) => setF({ ...f, to: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="number"
            label="Slot (minutes)"
            value={f.slot}
            onChange={(e) => setF({ ...f, slot: Number(e.target.value) })}
          />
          <TextField
            size="small"
            type="number"
            label="Patients per slot"
            value={f.max}
            onChange={(e) => setF({ ...f, max: Number(e.target.value) })}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={create.isPending || !f.doctorId}
        >
          Add
        </Button>
      </DialogActions>
      {toastNode}
    </Dialog>
  );
}

export function SchedulesPanel() {
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const { data: rows } = useClinicSchedules({});
  const { toggle } = useClinicScheduleMutations();
  const [open, setOpen] = useState(false);
  const canCreate = canDo(me?.permissions, me?.isAdmin, "doctors", "create");
  const canEdit = canDo(me?.permissions, me?.isAdmin, "doctors", "edit");

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {canCreate && (
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add schedule
          </Button>
        </Box>
      )}
      {!rows?.length ? (
        <EmptyState text="No chamber schedules yet." />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {rows.map((s) => (
            <Paper
              key={s.id}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                opacity: s.isActive ? 1 : 0.6,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }} noWrap>
                  {DAYS[s.dayOfWeek]} · {fmtTime(s.timeFrom)} –{" "}
                  {fmtTime(s.timeTo)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.doctorName} · {s.slotMinutes} min slots · {s.maxPatients}
                  /slot
                </Typography>
              </Box>
              <Switch
                checked={s.isActive}
                disabled={!canEdit || toggle.isPending}
                onChange={(_, v) =>
                  toggle.mutate(
                    { id: s.id, isActive: v },
                    { onError: (e) => toast(getApiErrorMessage(e), "error") },
                  )
                }
              />
            </Paper>
          ))}
        </Box>
      )}
      <ScheduleDialog open={open} onClose={() => setOpen(false)} />
      {toastNode}
    </Box>
  );
}

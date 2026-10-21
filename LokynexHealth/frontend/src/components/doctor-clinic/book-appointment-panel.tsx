"use client";

import { Avatar, kitCardSx } from "@/components/common/page-kit";
import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useAvailableSlots,
  useBookAppointment,
} from "@/hooks/use-doctor-clinic";
import { useDoctors } from "@/hooks/use-lookups";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney, toDateInputValue } from "@/lib/format";
import { ClinicPaymentMethod } from "@/types/doctor-clinic";
import { LookupDto } from "@/types/lookup";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { PAYMENT_METHODS, formatTime } from "./clinic-utils";

/**
 * Same flow as the Doctor Clinic "Book" screen: pick branch, doctor and date,
 * choose a time slot, fill the patient and book - all on one page.
 */
export function BookAppointmentPanel() {
  const [branchId, setBranchId] = useState("");
  const [doctor, setDoctor] = useState<LookupDto | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 350);
  const [date, setDate] = useState(toDateInputValue(new Date()));

  const [slot, setSlot] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
    fee: "",
    method: "Cash" as ClinicPaymentMethod,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookedMsg, setBookedMsg] = useState<string | null>(null);

  const { data: branches } = useBranches({ pageSize: 100 });
  // Only active doctors can take new bookings.
  const { data: doctorResult } = useDoctors(debouncedDoctorSearch, true);

  // a single-branch lab never needs to pick one
  const soleBranchId = branches?.items.length === 1 ? branches.items[0].id : "";
  const activeBranchId = branchId || soleBranchId;

  const doctorId = doctor?.id ?? null;
  const slotParams = useMemo(
    () =>
      doctorId && activeBranchId && date
        ? { doctorId, branchId: activeBranchId, date }
        : null,
    [doctorId, activeBranchId, date],
  );
  const { data: slots, isFetching } = useAvailableSlots(slotParams);
  const book = useBookAppointment();

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  function submit() {
    const e: Record<string, string> = {};
    if (!slotParams) e.doctor = "Pick a branch, doctor and date";
    if (!slot) e.slot = "Choose a time slot";
    if (!f.name.trim()) e.name = "Required";
    if (!f.phone.trim()) e.phone = "Required";
    const fee = f.fee.trim() === "" ? 0 : Number(f.fee);
    if (!Number.isFinite(fee) || fee < 0) e.fee = "Invalid amount";
    setErrors(e);
    if (Object.keys(e).length || !doctorId || !slot) return;

    book.mutate(
      {
        doctorId,
        branchId: activeBranchId,
        bookingDate: date,
        timeSlot: slot,
        patientName: f.name.trim(),
        patientPhone: f.phone.trim(),
        patientEmail: f.email.trim() || undefined,
        note: f.note.trim() || undefined,
        visitFee: fee,
        paymentMethod: fee > 0 ? f.method : undefined,
      },
      {
        onSuccess: (r) => {
          const feePart =
            fee > 0 ? ` Fee ₹${formatMoney(fee)} (${f.method}).` : "";
          setBookedMsg(
            `${f.name.trim()} booked, serial #${r.serialNo} at ${formatTime(slot)} on ${date}.${feePart}`,
          );
          setF({
            name: "",
            phone: "",
            email: "",
            note: "",
            fee: "",
            method: "Cash",
          });
          setSlot(null);
        },
      },
    );
  }

  return (
    <Box
      sx={{ ...kitCardSx, p: { xs: 1.5, sm: 2.5 }, display: "grid", gap: 2 }}
    >
      {bookedMsg && (
        <Alert severity="success" onClose={() => setBookedMsg(null)}>
          {bookedMsg}
        </Alert>
      )}
      {book.isError && (
        <Alert severity="error">
          {getApiErrorMessage(book.error, "Could not book this slot.")}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1.4fr 1fr" },
        }}
      >
        <TextField
          select
          size="small"
          label="Branch"
          value={activeBranchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setDoctor(null);
            setSlot(null);
          }}
        >
          {branches?.items.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.branchName}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          size="small"
          options={doctorResult?.items ?? []}
          value={doctor}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          getOptionLabel={(o) => o.fullName}
          filterOptions={(x) => x}
          onInputChange={(_, v, reason) => {
            if (reason === "input") setDoctorSearch(v);
          }}
          onChange={(_, v) => {
            setDoctor(v);
            setSlot(null);
          }}
          disabled={!activeBranchId}
          noOptionsText="No doctor found"
          renderOption={(props, o) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={key} {...rest} sx={{ gap: 1.25 }}>
                <Avatar name={o.fullName} size={30} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {o.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {o.phone}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Doctor"
              error={!!errors.doctor}
              helperText={errors.doctor}
            />
          )}
        />
        <TextField
          size="small"
          type="date"
          label="Date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSlot(null);
          }}
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
        {!slotParams ? (
          <Typography variant="body2" color="text.secondary">
            Pick a branch, doctor and date to see the slots.
          </Typography>
        ) : isFetching ? (
          <CircularProgress size={20} />
        ) : !slots?.length ? (
          <Typography variant="body2" color="text.secondary">
            This doctor has no clinic hours on the selected day.
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
                label={`${formatTime(s.timeSlot)} · ${s.isFull ? "full" : `${s.availableCount} left`}`}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1.2fr 1.2fr" },
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
          label="Email"
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
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
          onChange={(e) => set("method", e.target.value as ClinicPaymentMethod)}
          disabled={!(Number(f.fee) > 0)}
        >
          {PAYMENT_METHODS.map((m) => (
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
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
        />
      </Box>

      <Box>
        <Button
          variant="contained"
          size="large"
          onClick={submit}
          disabled={book.isPending}
          sx={{ fontWeight: 800, borderRadius: "999px", px: 4 }}
        >
          {book.isPending ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Book appointment"
          )}
        </Button>
      </Box>
    </Box>
  );
}

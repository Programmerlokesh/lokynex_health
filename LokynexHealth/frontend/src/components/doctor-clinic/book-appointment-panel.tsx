"use client";

import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useAvailableSlots,
  useBookAppointment,
} from "@/hooks/use-doctor-clinic";
import { useDoctors } from "@/hooks/use-lookups";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { AvailableSlotDto, ClinicPaymentMethod } from "@/types/doctor-clinic";
import { LookupDto } from "@/types/lookup";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { PAYMENT_METHODS, formatTime } from "./clinic-utils";

export function BookAppointmentPanel() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [branchId, setBranchId] = useState("");
  const [doctor, setDoctor] = useState<LookupDto | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 350);
  const [date, setDate] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotDto | null>(
    null,
  );
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [reason, setReason] = useState("");
  const [visitFee, setVisitFee] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<ClinicPaymentMethod>("Cash");
  const [bookedMsg, setBookedMsg] = useState<string | null>(null);

  const { data: branches } = useBranches({ pageSize: 100 });
  // Only active doctors can take new bookings.
  const { data: doctorResult } = useDoctors(debouncedDoctorSearch, true);

  const doctorId = doctor?.id ?? null;
  const slotParams = useMemo(
    () => (doctorId && branchId && date ? { doctorId, branchId, date } : null),
    [doctorId, branchId, date],
  );
  const { data: slots, isLoading: slotsLoading } =
    useAvailableSlots(slotParams);

  const bookAppointment = useBookAppointment();

  const feeNumber = visitFee.trim() === "" ? 0 : Number(visitFee);
  const feeInvalid = !Number.isFinite(feeNumber) || feeNumber < 0;

  function resetBookingForm() {
    setSelectedSlot(null);
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setReason("");
    setVisitFee("");
    setPaymentMethod("Cash");
    bookAppointment.reset();
  }

  function closeDialog() {
    setSelectedSlot(null);
    bookAppointment.reset();
  }

  function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !doctorId || !branchId || !date) return;
    if (!patientName.trim() || !patientPhone.trim() || feeInvalid) return;

    bookAppointment.mutate(
      {
        doctorId,
        branchId,
        bookingDate: date,
        timeSlot: selectedSlot.timeSlot,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || undefined,
        note: reason.trim() || undefined,
        visitFee: feeNumber,
        paymentMethod: feeNumber > 0 ? paymentMethod : undefined,
      },
      {
        onSuccess: (result) => {
          const feePart =
            feeNumber > 0
              ? ` Fee ₹${formatMoney(feeNumber)} (${paymentMethod}).`
              : "";
          setBookedMsg(
            `${patientName.trim()} booked — Serial #${result.serialNo}, ${formatTime(selectedSlot.timeSlot)} on ${date}.${feePart}`,
          );
          resetBookingForm();
        },
      },
    );
  }

  return (
    <Box>
      <Box
        sx={{
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          p: { xs: 1.5, sm: 2.5 },
          mb: 2.5,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Branch"
              size="small"
              fullWidth
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setDoctor(null);
              }}
            >
              {branches?.items.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branchName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Autocomplete
              options={doctorResult?.items ?? []}
              value={doctor}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              getOptionLabel={(o) => `${o.fullName} — ${o.phone}`}
              filterOptions={(x) => x}
              onInputChange={(_, v) => setDoctorSearch(v)}
              onChange={(_, v) => setDoctor(v)}
              disabled={!branchId}
              renderInput={(params) => (
                <TextField {...params} label="Doctor" size="small" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Date"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {bookedMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2.5 }}
          onClose={() => setBookedMsg(null)}
        >
          {bookedMsg}
        </Alert>
      )}

      {!slotParams ? (
        <Typography variant="body2" color="text.secondary">
          Pick a branch, doctor, and date to see available slots.
        </Typography>
      ) : slotsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : !slots || slots.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          This doctor doesn&apos;t hold clinic hours on the selected day.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {slots.map((slot) => (
            <Chip
              key={slot.timeSlot}
              label={`${formatTime(slot.timeSlot)} · ${slot.availableCount}/${slot.maxPatients} left`}
              clickable={!slot.isFull}
              disabled={slot.isFull}
              color={slot.isFull ? "default" : "primary"}
              variant={slot.isFull ? "outlined" : "filled"}
              onClick={() => !slot.isFull && setSelectedSlot(slot)}
            />
          ))}
        </Box>
      )}

      <Dialog
        open={!!selectedSlot}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
        fullScreen={fullScreen}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Book {selectedSlot && formatTime(selectedSlot.timeSlot)} Slot
        </DialogTitle>
        <Box
          component="form"
          onSubmit={handleBook}
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {bookAppointment.isError && (
              <Alert severity="error">
                {getApiErrorMessage(
                  bookAppointment.error,
                  "Could not book this slot.",
                )}
              </Alert>
            )}

            <TextField
              label="Patient Name"
              size="small"
              fullWidth
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <TextField
              label="Patient Phone"
              size="small"
              fullWidth
              required
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
            />
            <TextField
              label="Patient Email (optional)"
              size="small"
              fullWidth
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
            <TextField
              label="Reason for visit"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="Visit fee (₹)"
                size="small"
                fullWidth
                type="number"
                value={visitFee}
                error={feeInvalid}
                helperText={feeInvalid ? "Enter 0 or more" : undefined}
                onChange={(e) => setVisitFee(e.target.value)}
                slotProps={{
                  htmlInput: { min: 0, step: "any", inputMode: "decimal" },
                }}
              />
              <TextField
                select
                label="Payment method"
                size="small"
                fullWidth
                disabled={feeNumber <= 0}
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as ClinicPaymentMethod)
                }
              >
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeDialog} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                bookAppointment.isPending ||
                !patientName.trim() ||
                !patientPhone.trim() ||
                feeInvalid
              }
            >
              {bookAppointment.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

"use client";

import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useAvailableSlots,
  useBookAppointment,
} from "@/hooks/use-doctor-clinic";
import { useDoctors } from "@/hooks/use-lookups";
import { AvailableSlotDto } from "@/types/doctor-clinic";
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
} from "@mui/material";
import { useMemo, useState } from "react";

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function BookAppointmentPanel() {
  const [branchId, setBranchId] = useState("");
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 350);
  const [date, setDate] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotDto | null>(
    null,
  );
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [note, setNote] = useState("");
  const [bookedMsg, setBookedMsg] = useState<string | null>(null);

  const { data: branches } = useBranches({ pageSize: 100 });
  const { data: doctorResult } = useDoctors(debouncedDoctorSearch);

  const slotParams = useMemo(
    () => (doctorId && branchId && date ? { doctorId, branchId, date } : null),
    [doctorId, branchId, date],
  );
  const { data: slots, isLoading: slotsLoading } =
    useAvailableSlots(slotParams);

  const bookAppointment = useBookAppointment();

  function resetBookingForm() {
    setSelectedSlot(null);
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setNote("");
  }

  function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !doctorId || !branchId || !date) return;
    if (!patientName || !patientPhone) return;

    bookAppointment.mutate(
      {
        doctorId,
        branchId,
        bookingDate: date,
        timeSlot: selectedSlot.timeSlot,
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        note: note || undefined,
      },
      {
        onSuccess: () => {
          setBookedMsg(
            `${patientName} booked for ${formatTime(selectedSlot.timeSlot)} on ${date}.`,
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
          p: 2.5,
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
                setDoctorId(null);
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
              getOptionLabel={(o) => `${o.fullName} — ${o.phone}`}
              onInputChange={(_, v) => setDoctorSearch(v)}
              onChange={(_, v) => setDoctorId(v?.id ?? null)}
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
        onClose={() => setSelectedSlot(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Book {selectedSlot && formatTime(selectedSlot.timeSlot)} Slot
        </DialogTitle>
        <Box component="form" onSubmit={handleBook}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {bookAppointment.isError && (
              <Alert severity="error">
                Could not book this slot — it may have just filled up. Please
                pick another.
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
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
            />
            <TextField
              label="Patient Email (optional)"
              size="small"
              fullWidth
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
            <TextField
              label="Note (optional)"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setSelectedSlot(null)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                bookAppointment.isPending || !patientName || !patientPhone
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

"use client";

import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import { useCreateSchedule } from "@/hooks/use-doctor-clinic";
import { useDoctors } from "@/hooks/use-lookups";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function CreateScheduleDialog() {
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 350);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [slotMinutes, setSlotMinutes] = useState("15");
  const [maxPatients, setMaxPatients] = useState("1");

  const { data: branches } = useBranches({ pageSize: 100 });
  const { data: doctorResult } = useDoctors(debouncedDoctorSearch);
  const createSchedule = useCreateSchedule();

  function resetForm() {
    setBranchId("");
    setDoctorId(null);
    setDoctorSearch("");
    setDayOfWeek(1);
    setTimeFrom("");
    setTimeTo("");
    setSlotMinutes("15");
    setMaxPatients("1");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId || !doctorId || !timeFrom || !timeTo) return;

    createSchedule.mutate(
      {
        branchId,
        doctorId,
        dayOfWeek,
        slotMinutes: Number(slotMinutes),
        timeFrom: `${timeFrom}:00`,
        timeTo: `${timeTo}:00`,
        maxPatients: Number(maxPatients),
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Create Schedule
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Clinic Schedule
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {createSchedule.isError && (
              <Alert severity="error">
                Could not create the schedule. Please try again.
              </Alert>
            )}

            <TextField
              select
              label="Branch"
              size="small"
              fullWidth
              required
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches?.items.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branchName}
                </MenuItem>
              ))}
            </TextField>

            <Autocomplete
              options={doctorResult?.items ?? []}
              getOptionLabel={(o) => `${o.fullName} — ${o.phone}`}
              onInputChange={(_, v) => setDoctorSearch(v)}
              onChange={(_, v) => setDoctorId(v?.id ?? null)}
              renderInput={(params) => (
                <TextField {...params} label="Doctor" size="small" required />
              )}
            />

            <TextField
              select
              label="Day of Week"
              size="small"
              fullWidth
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
            >
              {DAYS.map((day, i) => (
                <MenuItem key={day} value={i}>
                  {day}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <TextField
                label="Time From"
                type="time"
                size="small"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
              />
              <TextField
                label="Time To"
                type="time"
                size="small"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <TextField
                label="Slot Minutes"
                type="number"
                size="small"
                fullWidth
                required
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(e.target.value)}
              />
              <TextField
                label="Max Patients / Slot"
                type="number"
                size="small"
                fullWidth
                required
                value={maxPatients}
                onChange={(e) => setMaxPatients(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createSchedule.isPending ||
                !branchId ||
                !doctorId ||
                !timeFrom ||
                !timeTo
              }
            >
              {createSchedule.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}

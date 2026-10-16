"use client";

import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import { useCreateSchedule } from "@/hooks/use-doctor-clinic";
import { useDoctors } from "@/hooks/use-lookups";
import { getApiErrorMessage } from "@/lib/api-error";
import { LookupDto } from "@/types/lookup";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { DAYS } from "./clinic-utils";

export function CreateScheduleDialog() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [doctor, setDoctor] = useState<LookupDto | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 350);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [slotMinutes, setSlotMinutes] = useState("15");
  const [maxPatients, setMaxPatients] = useState("1");

  const { data: branches } = useBranches({ pageSize: 100 });
  // Only active doctors can be given a clinic schedule.
  const { data: doctorResult } = useDoctors(debouncedDoctorSearch, true);
  const createSchedule = useCreateSchedule();

  function resetForm() {
    setBranchId("");
    setDoctor(null);
    setDoctorSearch("");
    setDayOfWeek(1);
    setTimeFrom("");
    setTimeTo("");
    setSlotMinutes("15");
    setMaxPatients("1");
    createSchedule.reset();
  }

  function handleClose() {
    setOpen(false);
    createSchedule.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId || !doctor || !timeFrom || !timeTo) return;

    createSchedule.mutate(
      {
        branchId,
        doctorId: doctor.id,
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
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        fullScreen={fullScreen}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Clinic Schedule
        </DialogTitle>
        <Box
          component="form"
          onSubmit={handleSubmit}
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
            {createSchedule.isError && (
              <Alert severity="error">
                {getApiErrorMessage(
                  createSchedule.error,
                  "Could not create the schedule. Please try again.",
                )}
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
              value={doctor}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              getOptionLabel={(o) => `${o.fullName} — ${o.phone}`}
              filterOptions={(x) => x}
              onInputChange={(_, v) => setDoctorSearch(v)}
              onChange={(_, v) => setDoctor(v)}
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

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
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

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
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
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createSchedule.isPending ||
                !branchId ||
                !doctor ||
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

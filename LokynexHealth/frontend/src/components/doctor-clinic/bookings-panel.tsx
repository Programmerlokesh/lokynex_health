"use client";

import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import { useDoctorsList } from "@/hooks/use-directory";
import { useBookings } from "@/hooks/use-doctor-clinic";
import { formatMoney, toDateInputValue } from "@/lib/format";
import { DoctorFullDto } from "@/types/directory";
import { BookingDto } from "@/types/doctor-clinic";
import PrintIcon from "@mui/icons-material/Print";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { PAYMENT_METHODS, formatLongDate, formatTime } from "./clinic-utils";
import { printPatientList } from "./print-patient-list";

const money = (n: number) => `₹${formatMoney(n)}`;

export function BookingsPanel() {
  const [branchId, setBranchId] = useState(""); // "" = all branches
  const [doctor, setDoctor] = useState<DoctorFullDto | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 350);
  const [date, setDate] = useState(() => toDateInputValue(new Date()));

  const { data: branches } = useBranches({ pageSize: 100 });
  // All doctors (active + inactive): old bookings of a deactivated doctor must stay viewable.
  const { data: doctorResult } = useDoctorsList(debouncedDoctorSearch);

  const params = useMemo(
    () =>
      doctor && date
        ? { doctorId: doctor.id, date, branchId: branchId || undefined }
        : null,
    [doctor, date, branchId],
  );
  const { data, isLoading } = useBookings(params);

  // Cancelled bookings are shown but never counted or printed.
  const rows = data ?? [];
  const live = rows.filter((r) => r.status !== "Cancelled");
  const totalFee = live.reduce((sum, r) => sum + r.visitFee, 0);
  const byMethod = PAYMENT_METHODS.map((m) => ({
    method: m,
    amount: live
      .filter((r) => r.paymentMethod === m)
      .reduce((sum, r) => sum + r.visitFee, 0),
  })).filter((x) => x.amount > 0);
  const showBranch = new Set(rows.map((r) => r.branchId)).size > 1;

  function handlePrint() {
    if (!doctor || live.length === 0) return;
    const branchLabel = branchId
      ? (branches?.items.find((b) => b.id === branchId)?.branchName ?? "")
      : "All branches";
    printPatientList({
      doctorName: doctor.fullName,
      branchLabel,
      date,
      rows: live,
      showBranch,
    });
  }

  const reasonText = (r: BookingDto) => r.reason || "—";

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
            <Autocomplete
              options={doctorResult?.items ?? []}
              value={doctor}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              getOptionLabel={(o) =>
                `${o.fullName} — ${o.phone}${o.status !== "Active" ? " (Inactive)" : ""}`
              }
              filterOptions={(x) => x}
              onInputChange={(_, v) => setDoctorSearch(v)}
              onChange={(_, v) => setDoctor(v)}
              renderInput={(p) => (
                <TextField {...p} label="Doctor" size="small" />
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
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Branch"
              size="small"
              fullWidth
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              slotProps={{
                select: { displayEmpty: true },
                inputLabel: { shrink: true },
              }}
            >
              <MenuItem value="">All branches</MenuItem>
              {branches?.items.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branchName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {!params ? (
        <Typography variant="body2" color="text.secondary">
          Select a doctor and a date to see the patients booked that day.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No patients booked with {doctor?.fullName} on {formatLongDate(date)}.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Summary + print */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip label={`Patients: ${live.length}`} color="primary" />
              <Chip label={`Collected: ${money(totalFee)}`} color="success" />
              {byMethod.map((x) => (
                <Chip
                  key={x.method}
                  variant="outlined"
                  label={`${x.method}: ${money(x.amount)}`}
                />
              ))}
            </Box>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              disabled={live.length === 0}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Print patient list
            </Button>
          </Box>

          {/* Desktop / tablet: table */}
          <TableContainer
            component={Paper}
            sx={{
              display: { xs: "none", md: "block" },
              borderRadius: 3,
              boxShadow: "0 4px 16px rgba(23,43,77,0.06)",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Serial</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                  {showBranch && (
                    <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Visit fee
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    hover
                    sx={r.status === "Cancelled" ? { opacity: 0.5 } : undefined}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      #{r.serialNo ?? "—"}
                    </TableCell>
                    <TableCell>{formatTime(r.timeSlot)}</TableCell>
                    {showBranch && <TableCell>{r.branchName}</TableCell>}
                    <TableCell sx={{ fontWeight: 500 }}>
                      {r.patientName}
                      {r.status === "Cancelled" && (
                        <Chip
                          label="Cancelled"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{r.patientPhone}</TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      {reasonText(r)}
                    </TableCell>
                    <TableCell align="right">
                      {r.visitFee > 0 ? money(r.visitFee) : "—"}
                    </TableCell>
                    <TableCell>{r.paymentMethod ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile: cards */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {rows.map((r) => (
              <Paper
                key={r.id}
                variant="outlined"
                sx={{
                  p: 1.75,
                  borderRadius: 3,
                  opacity: r.status === "Cancelled" ? 0.5 : 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    #{r.serialNo ?? "—"} · {r.patientName}
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      r.status === "Cancelled"
                        ? "Cancelled"
                        : formatTime(r.timeSlot)
                    }
                    color={r.status === "Cancelled" ? "error" : "default"}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {r.patientPhone}
                </Typography>
                {showBranch && (
                  <Typography variant="body2" color="text.secondary">
                    {r.branchName}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Reason: {reasonText(r)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                  {r.visitFee > 0
                    ? `${money(r.visitFee)} · ${r.paymentMethod ?? ""}`
                    : "No fee collected"}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

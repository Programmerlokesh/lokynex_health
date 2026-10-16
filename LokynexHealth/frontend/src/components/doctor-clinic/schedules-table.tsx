"use client";

import { useToggleScheduleStatus } from "@/hooks/use-doctor-clinic";
import { ScheduleDto } from "@/types/doctor-clinic";
import {
  Box,
  Chip,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DAYS, formatTime } from "./clinic-utils";

export function SchedulesTable({ rows }: { rows: ScheduleDto[] }) {
  const toggleStatus = useToggleScheduleStatus();

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No schedules created yet.
      </Typography>
    );
  }

  return (
    <>
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
              <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Day</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Slot</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Max / Slot</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{row.doctorName}</TableCell>
                <TableCell>{row.branchName}</TableCell>
                <TableCell>
                  <Chip
                    label={DAYS[row.dayOfWeek]}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {formatTime(row.timeFrom)} – {formatTime(row.timeTo)}
                </TableCell>
                <TableCell>{row.slotMinutes} min</TableCell>
                <TableCell>{row.maxPatients}</TableCell>
                <TableCell>
                  <Switch
                    size="small"
                    checked={row.isActive}
                    onChange={(e) =>
                      toggleStatus.mutate({
                        id: row.id,
                        isActive: e.target.checked,
                      })
                    }
                  />
                </TableCell>
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
        {rows.map((row) => (
          <Paper
            key={row.id}
            variant="outlined"
            sx={{ p: 1.75, borderRadius: 3 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {row.doctorName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {row.branchName}
                </Typography>
              </Box>
              <Switch
                size="small"
                checked={row.isActive}
                onChange={(e) =>
                  toggleStatus.mutate({
                    id: row.id,
                    isActive: e.target.checked,
                  })
                }
              />
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              <Chip
                label={DAYS[row.dayOfWeek]}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${formatTime(row.timeFrom)} – ${formatTime(row.timeTo)}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${row.slotMinutes} min · max ${row.maxPatients}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Paper>
        ))}
      </Box>
    </>
  );
}

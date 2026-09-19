"use client";

import { useToggleScheduleStatus } from "@/hooks/use-doctor-clinic";
import { ScheduleDto } from "@/types/doctor-clinic";
import {
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
import { motion } from "framer-motion";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatTime(time: string) {
  // "09:00:00" -> "09:00 AM"
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

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
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(23,43,77,0.06)" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#F5F9FC" }}>
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
          {rows.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              style={{ display: "table-row" }}
            >
              <TableCell sx={{ fontWeight: 500 }}>{row.doctorName}</TableCell>
              <TableCell>{row.branchName}</TableCell>
              <TableCell>
                <Chip label={DAYS[row.dayOfWeek]} size="small" variant="outlined" />
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
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
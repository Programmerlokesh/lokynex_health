"use client";

import { Avatar, EmptyState, kitCardSx } from "@/components/common/page-kit";
import { useToggleScheduleStatus } from "@/hooks/use-doctor-clinic";
import { ScheduleDto } from "@/types/doctor-clinic";
import { Box, Chip, Switch, Typography } from "@mui/material";
import { DAYS, formatTime } from "./clinic-utils";

export function SchedulesTable({ rows }: { rows: ScheduleDto[] }) {
  const toggleStatus = useToggleScheduleStatus();

  if (rows.length === 0) return <EmptyState text="No schedules created yet." />;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)",
        },
        gap: 1.5,
      }}
    >
      {rows.map((row) => (
        <Box
          key={row.id}
          sx={{
            ...kitCardSx,
            p: 1.75,
            display: "grid",
            gap: 1.25,
            opacity: row.isActive ? 1 : 0.65,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Avatar name={row.doctorName} size={40} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} noWrap>
                {row.doctorName}
              </Typography>
              <Typography
                sx={{ fontSize: 12.5, color: "text.secondary" }}
                noWrap
              >
                {row.branchName}
              </Typography>
            </Box>
            <Switch
              size="small"
              checked={row.isActive}
              onChange={(e) =>
                toggleStatus.mutate({ id: row.id, isActive: e.target.checked })
              }
            />
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            <Chip label={DAYS[row.dayOfWeek]} size="small" color="primary" />
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
        </Box>
      ))}
    </Box>
  );
}

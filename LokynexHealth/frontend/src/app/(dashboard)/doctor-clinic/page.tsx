"use client";

import { BookAppointmentPanel } from "@/components/doctor-clinic/book-appointment-panel";
import { CreateScheduleDialog } from "@/components/doctor-clinic/create-schedule-dialog";
import { SchedulesTable } from "@/components/doctor-clinic/schedules-table";
import { MicroscopeIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useSchedules } from "@/hooks/use-doctor-clinic";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

export default function DoctorClinicPage() {
  const [tab, setTab] = useState(0);
  const { data: schedules, isLoading } = useSchedules({});

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: "#ECFDF5",
              color: brand.teal,
              p: 1,
              borderRadius: 2,
              display: "flex",
            }}
          >
            <MicroscopeIcon fontSize="small" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Doctor Clinic
          </Typography>
        </Box>
        {tab === 0 && <CreateScheduleDialog />}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Schedules" />
        <Tab label="Book Appointment" />
      </Tabs>

      {tab === 0 ? (
        isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <SchedulesTable rows={schedules ?? []} />
        )
      ) : (
        <BookAppointmentPanel />
      )}
    </Box>
  );
}

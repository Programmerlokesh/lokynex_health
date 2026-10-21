"use client";

import { PageHeader } from "@/components/common/page-kit";
import { BookAppointmentPanel } from "@/components/doctor-clinic/book-appointment-panel";
import { BookingsPanel } from "@/components/doctor-clinic/bookings-panel";
import { CreateScheduleDialog } from "@/components/doctor-clinic/create-schedule-dialog";
import { DoctorsPanel } from "@/components/doctor-clinic/doctors-panel";
import { SchedulesTable } from "@/components/doctor-clinic/schedules-table";
import { MicroscopeIcon } from "@/components/icons/lab-icons";
import { useSchedules } from "@/hooks/use-doctor-clinic";
import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { useState } from "react";

export default function DoctorClinicPage() {
  const [tab, setTab] = useState(0);
  const { data: schedules, isLoading } = useSchedules({});

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        icon={<MicroscopeIcon />}
        tint="#ECFDF5"
        color="#00BFA6"
        title="Doctor Clinic"
        subtitle="Book patients into a chamber, see the day's list, manage schedules and doctors"
        actions={tab === 2 ? <CreateScheduleDialog /> : undefined}
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Book" />
        <Tab label="Patient list" />
        <Tab label="Schedules" />
        <Tab label="Doctors" />
      </Tabs>

      {tab === 0 && <BookAppointmentPanel />}
      {tab === 1 && <BookingsPanel />}
      {tab === 2 &&
        (isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <SchedulesTable rows={schedules ?? []} />
        ))}
      {tab === 3 && <DoctorsPanel />}
    </Box>
  );
}

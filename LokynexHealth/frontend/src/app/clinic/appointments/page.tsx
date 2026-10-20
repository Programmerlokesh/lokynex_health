"use client";

import {
  BookPanel,
  BookingsPanel,
  SchedulesPanel,
} from "@/components/clinic/appointments/appointments-panels";
import { PageTitle } from "@/components/clinic/clinic-shell";
import { useClinicMe } from "@/hooks/use-clinic";
import { canDo } from "@/lib/clinic/permissions";
import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

export default function AppointmentsPage() {
  const { data: me } = useClinicMe();
  const canBook = canDo(me?.permissions, me?.isAdmin, "appointments", "create");
  const [tab, setTab] = useState(canBook ? 0 : 1);
  const t = canBook ? tab : tab === 0 ? 1 : tab;

  return (
    <>
      <PageTitle
        title="Appointments"
        subtitle="Book patients into the chamber, see the day's list, manage schedules"
      />
      <Tabs
        value={t}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {canBook && <Tab value={0} label="Book" />}
        <Tab value={1} label="Patient list" />
        <Tab value={2} label="Schedules" />
      </Tabs>
      <Box>
        {t === 0 ? (
          <BookPanel />
        ) : t === 1 ? (
          <BookingsPanel />
        ) : (
          <SchedulesPanel />
        )}
      </Box>
    </>
  );
}

"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import { useClinicDashboard, useClinicMe } from "@/hooks/use-clinic";
import { canDo } from "@/lib/clinic/permissions";
import { fmtRxDate } from "@/lib/clinic/prescription-html";
import { formatINR } from "@/lib/ledger-utils";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import Link from "next/link";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: { xs: 24, sm: 28 }, fontWeight: 800, color: tone }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

export default function ClinicDashboardPage() {
  const { data: me } = useClinicMe();
  const { data } = useClinicDashboard();
  const perms = me?.permissions;
  const admin = me?.isAdmin;

  if (!data)
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  const showMoney = canDo(perms, admin, "ledger");

  return (
    <>
      <PageTitle
        title={`Welcome${me ? `, ${me.actorName}` : ""}`}
        subtitle={me?.clinicName}
        actions={
          canDo(perms, admin, "prescriptions", "create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              href="/clinic/prescriptions/new"
            >
              New prescription
            </Button>
          )
        }
      />
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" },
          mb: 2,
        }}
      >
        <Stat label="Today's appointments" value={data.todayBookings} />
        <Stat label="Waiting" value={data.todayWaiting} tone="#D97706" />
        <Stat label="Prescriptions today" value={data.todayPrescriptions} />
        <Stat label="Total patients" value={data.totalPatients} />
        {showMoney && (
          <>
            <Stat
              label="Income (this month)"
              value={formatINR(data.monthIncome)}
              tone="#16A34A"
            />
            <Stat
              label="Outflow (this month)"
              value={formatINR(data.monthOutflow)}
              tone="#DC2626"
            />
            <Stat
              label="Net (this month)"
              value={formatINR(data.monthNet)}
              tone={data.monthNet >= 0 ? "#16A34A" : "#DC2626"}
            />
          </>
        )}
        <Stat label="All prescriptions" value={data.totalPrescriptions} />
      </Box>
      {canDo(perms, admin, "prescriptions") && (
        <Paper variant="outlined" sx={{ borderRadius: 4, p: 1 }}>
          <Typography fontWeight={800} sx={{ px: 1.5, pt: 1 }}>
            Recent prescriptions
          </Typography>
          <List dense>
            {data.recent.map((p) => (
              <ListItemButton
                key={p.id}
                component={Link}
                href={`/clinic/prescriptions/${p.id}`}
              >
                <ListItemText
                  primary={`${p.patientName} · ${p.rxNo}`}
                  secondary={`${fmtRxDate(p.visitDate)} · ${p.doctorName}${p.diagnosis ? ` — ${p.diagnosis}` : ""}`}
                />
              </ListItemButton>
            ))}
            {!data.recent.length && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 1.5 }}
              >
                Nothing yet.
              </Typography>
            )}
          </List>
        </Paper>
      )}
    </>
  );
}

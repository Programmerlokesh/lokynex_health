"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import { Avatar, kitCardSx } from "@/components/common/page-kit";
import { useClinicDashboard, useClinicMe } from "@/hooks/use-clinic";
import { canDo } from "@/lib/clinic/permissions";
import { fmtRxDate } from "@/lib/clinic/prescription-html";
import { formatINR } from "@/lib/ledger-utils";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import type { ReactNode } from "react";

function Tile({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  href?: string;
}) {
  return (
    <Box
      component={href ? Link : "div"}
      href={href as string}
      sx={{
        ...kitCardSx,
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        textDecoration: "none",
        color: "text.primary",
        transition: "box-shadow .15s, border-color .15s",
        ...(href && {
          "&:hover": {
            borderColor: color,
            boxShadow: `0 8px 22px ${alpha(color, 0.18)}`,
          },
        }),
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "16px",
          display: "grid",
          placeItems: "center",
          color,
          bgcolor: alpha(color, 0.14),
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: { xs: 24, sm: 28 },
            fontWeight: 800,
            lineHeight: 1.1,
          }}
          noWrap
        >
          {value}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }} noWrap>
          {label}
        </Typography>
      </Box>
    </Box>
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
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const queue = data.todayBookings;
  const done = Math.max(queue - data.todayWaiting, 0);
  const donePct = queue > 0 ? Math.round((done / queue) * 100) : 0;

  return (
    <>
      <PageTitle
        title={`${greeting}${me ? `, ${me.actorName}` : ""}`}
        subtitle="Here is how the clinic is doing today"
        actions={
          canDo(perms, admin, "prescriptions", "create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              href="/clinic/prescriptions/new"
              sx={{ borderRadius: "999px", fontWeight: 700 }}
            >
              New prescription
            </Button>
          )
        }
      />

      <Box sx={{ display: "grid", gap: 2 }}>
        {/* today */}
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          <Tile
            label="Appointments today"
            value={data.todayBookings}
            icon={<EventAvailableOutlinedIcon />}
            color="#0EA5E9"
            href="/clinic/appointments"
          />
          <Tile
            label="Waiting now"
            value={data.todayWaiting}
            icon={<HourglassBottomIcon />}
            color="#F59E0B"
            href="/clinic/appointments"
          />
          <Tile
            label="Prescriptions today"
            value={data.todayPrescriptions}
            icon={<DescriptionOutlinedIcon />}
            color="#7C3AED"
            href="/clinic/prescriptions"
          />
          <Tile
            label="Total patients"
            value={data.totalPatients}
            icon={<PeopleAltOutlinedIcon />}
            color="#00BFA6"
            href="/clinic/patients"
          />
        </Box>

        {/* queue progress + money */}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: showMoney ? "1fr 1.2fr" : "1fr",
            },
          }}
        >
          <Box sx={{ ...kitCardSx, p: 2.25 }}>
            <Typography sx={{ fontWeight: 800 }}>Today&apos;s queue</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {queue === 0
                ? "No appointments booked yet today."
                : `${done} of ${queue} patients seen`}
            </Typography>
            <Box
              sx={{
                height: 14,
                borderRadius: 99,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${donePct}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg,#00BFA6,#0EA5E9)",
                  transition: "width .6s ease",
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 0.75,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {data.todayWaiting} waiting
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {donePct}%
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1.5 }}
            >
              All-time prescriptions: <b>{data.totalPrescriptions}</b>
            </Typography>
          </Box>

          {showMoney && (
            <Box sx={{ ...kitCardSx, p: 2.25 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalanceWalletOutlinedIcon
                    sx={{ color: "primary.main" }}
                  />
                  <Typography sx={{ fontWeight: 800 }}>This month</Typography>
                </Box>
                <Button
                  size="small"
                  component={Link}
                  href="/clinic/ledger"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                >
                  Ledger &amp; P&amp;L
                </Button>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: "repeat(3, 1fr)",
                }}
              >
                {[
                  { l: "Income", v: data.monthIncome, c: "#16A34A" },
                  { l: "Outflow", v: data.monthOutflow, c: "#DC2626" },
                  {
                    l: data.monthNet >= 0 ? "Net profit" : "Net loss",
                    v: data.monthNet,
                    c: data.monthNet >= 0 ? "#16A34A" : "#DC2626",
                  },
                ].map((m) => (
                  <Box
                    key={m.l}
                    sx={{
                      borderRadius: "14px",
                      p: 1.25,
                      bgcolor: alpha(m.c, 0.09),
                      minWidth: 0,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {m.l}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: m.c,
                        fontSize: { xs: 14.5, sm: 18 },
                      }}
                      noWrap
                    >
                      {formatINR(m.v)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* recent prescriptions */}
        {canDo(perms, admin, "prescriptions") && (
          <Box sx={{ ...kitCardSx, p: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                pb: 0.5,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>
                Recent prescriptions
              </Typography>
              <Button
                size="small"
                component={Link}
                href="/clinic/prescriptions"
                endIcon={<ArrowForwardIcon fontSize="small" />}
              >
                View all
              </Button>
            </Box>
            {data.recent.map((p) => (
              <Box
                key={p.id}
                component={Link}
                href={`/clinic/prescriptions/${p.id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1,
                  borderRadius: "14px",
                  textDecoration: "none",
                  color: "text.primary",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Avatar name={p.patientName} size={38} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>
                    {p.patientName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: "block" }}
                  >
                    {p.doctorName}
                    {p.diagnosis ? ` · ${p.diagnosis}` : ""}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                    {p.rxNo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fmtRxDate(p.visitDate)}
                  </Typography>
                </Box>
              </Box>
            ))}
            {!data.recent.length && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 1.5 }}
              >
                No prescriptions yet. Start with “New prescription”.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </>
  );
}

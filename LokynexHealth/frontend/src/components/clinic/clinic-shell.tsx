"use client";

import { ClinicTopbar } from "@/components/clinic/clinic-topbar";
import { useClinicMe } from "@/hooks/use-clinic";
import { useClinicAuthGuard } from "@/hooks/use-clinic-auth-guard";
import { CLINIC_NAV, canDo } from "@/lib/clinic/permissions";
import {
  glassPanelSx,
  homeGradient,
  iconTileSx,
  railItemSx,
} from "@/lib/home-theme";
import { useClinicAuthStore } from "@/store/clinic-auth-store";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Box, CircularProgress } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  dashboard: <DashboardOutlinedIcon fontSize="small" />,
  appointments: <EventAvailableOutlinedIcon fontSize="small" />,
  prescriptions: <DescriptionOutlinedIcon fontSize="small" />,
  patients: <PeopleAltOutlinedIcon fontSize="small" />,
  medicines: <MedicationOutlinedIcon fontSize="small" />,
  ledger: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
  doctors: <LocalHospitalOutlinedIcon fontSize="small" />,
  users: <GroupsOutlinedIcon fontSize="small" />,
  settings: <SettingsOutlinedIcon fontSize="small" />,
};

/** Frame of every /clinic page: top bar + left rail (a scrolling pill row on phones). */
export function ClinicShell({ children }: { children: ReactNode }) {
  const ready = useClinicAuthGuard();
  const router = useRouter();
  const pathname = usePathname();
  const session = useClinicAuthStore((s) => s.session);
  const logout = useClinicAuthStore((s) => s.logout);
  // fresh permissions from the server (the admin may have changed them since login)
  const { data: me } = useClinicMe();

  if (!ready) {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const perms = me?.permissions ?? session?.permissions ?? [];
  const isAdmin = me?.isAdmin ?? session?.isAdmin ?? false;
  const items = CLINIC_NAV.filter(
    (n) => n.module === null || canDo(perms, isAdmin, n.module),
  );

  return (
    <Box sx={{ minHeight: "100dvh", background: homeGradient }}>
      <ClinicTopbar
        userName={me?.actorName ?? session?.name ?? null}
        roleLabel={
          me?.actorRole === "ClinicAdmin" || isAdmin
            ? "Admin"
            : (session?.role ?? "")
        }
        clinicName={me?.clinicName ?? session?.clinicName ?? "Doctor Clinic"}
        onLogout={() => {
          logout();
          router.push("/login");
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1.5, md: 2.5 },
          p: { xs: 1.25, sm: 2, md: 3 },
          maxWidth: 1500,
          mx: "auto",
          alignItems: "flex-start",
        }}
      >
        <Box
          component="nav"
          aria-label="Clinic sections"
          className="no-print"
          sx={{
            ...glassPanelSx,
            borderRadius: "22px",
            p: 1,
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            gap: 0.5,
            width: { xs: "100%", md: 250 },
            flexShrink: 0,
            overflowX: { xs: "auto", md: "visible" },
            position: { md: "sticky" },
            top: { md: 84 },
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {items.map((n) => {
            const active =
              pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Box
                key={n.key}
                component={Link}
                href={n.href}
                aria-current={active ? "page" : undefined}
                sx={{ ...railItemSx(active), textDecoration: "none" }}
              >
                <Box sx={iconTileSx(active)}>{ICONS[n.key]}</Box>
                <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                  {n.label}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>{children}</Box>
      </Box>
    </Box>
  );
}

export function PageTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        mb: 2,
      }}
      className="no-print"
    >
      <Box sx={{ minWidth: 0 }}>
        <Box
          component="h2"
          sx={{ m: 0, fontSize: { xs: 20, sm: 24 }, fontWeight: 800 }}
        >
          {title}
        </Box>
        {subtitle && (
          <Box sx={{ color: "text.secondary", fontSize: 13.5, mt: 0.25 }}>
            {subtitle}
          </Box>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>{actions}</Box>
      )}
    </Box>
  );
}

"use client";

import { SampleDropIcon } from "@/components/icons/lab-icons";
import { LocationChip } from "@/components/layout/location-chip";
import { CreateLabDialog } from "@/components/super-admin/create-lab-dialog";
import { CreatePlanDialog } from "@/components/super-admin/create-plan-dialog";
import { CreateSubscriptionDialog } from "@/components/super-admin/create-subscription-dialog";
import { LabsTable } from "@/components/super-admin/labs-table";
import { NotificationsTable } from "@/components/super-admin/notifications-table";
import { PlansTable } from "@/components/super-admin/plans-table";
import { SendNotificationDialog } from "@/components/super-admin/send-notification-dialog";
import { SubscriptionsTable } from "@/components/super-admin/subscriptions-table";
import {
  useLabs,
  useNotifications,
  usePlans,
  useSubscriptions,
} from "@/hooks/use-super-admin";
import { useSuperAdminAuthGuard } from "@/hooks/use-superadmin-auth-guard";
import {
  glassPanelSx,
  homeGradient,
  iconTileSx,
  railItemSx,
} from "@/lib/home-theme";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import { useThemeStore } from "@/store/theme-store";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";

// Same left-rail idea as the lab home page (All / Orders / Reports ...),
// here one rail row per console section.
const TABS: { label: string; icon: ComponentType<SvgIconProps> }[] = [
  { label: "Labs", icon: ScienceOutlinedIcon },
  { label: "Plans", icon: WorkspacePremiumOutlinedIcon },
  { label: "Subscriptions", icon: CreditCardOutlinedIcon },
  { label: "Notifications", icon: NotificationsNoneOutlinedIcon },
];

export default function SuperAdminDashboardPage() {
  const isAuthenticated = useSuperAdminAuthGuard();
  const router = useRouter();
  const name = useSuperAdminAuthStore((s) => s.name);
  const logout = useSuperAdminAuthStore((s) => s.logout);
  const { mode, toggleMode } = useThemeStore();

  const [tab, setTab] = useState(0);

  const { data: labs, isLoading: labsLoading } = useLabs({});
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscriptions, isLoading: subscriptionsLoading } =
    useSubscriptions({});
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications({});

  if (!isAuthenticated) {
    return null;
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const spinner = (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100dvh", background: homeGradient }}>
      {/* Deliberately its own AppBar — NOT the tenant Sidebar/Topbar — so a
          lab user can never navigate here, and this console never looks like
          part of any single lab's dashboard. It reuses the lab home page's
          colours, font and layout so the two feel like one product. */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        className="no-print"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          pt: "var(--safe-top)",
          pl: "var(--safe-left)",
          pr: "var(--safe-right)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            position: "relative",
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
          >
            <SampleDropIcon sx={{ color: "#4F8BFF" }} fontSize="small" />
            {/* Below md the title stays on the left; md+ it is centred */}
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                display: { xs: "block", md: "none" },
              }}
            >
              SuperAdmin Console
            </Typography>
          </Box>

          <Typography
            variant="h6"
            noWrap
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: "30vw",
              fontWeight: 800,
              pointerEvents: "none",
            }}
          >
            SuperAdmin Console
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1.5 },
              flexShrink: 0,
            }}
          >
            <LocationChip />
            <Tooltip
              title={
                mode === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              <IconButton
                onClick={toggleMode}
                size="small"
                aria-label={
                  mode === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
              >
                {mode === "light" ? (
                  <DarkModeOutlinedIcon fontSize="small" />
                ) : (
                  <LightModeOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Typography
              variant="body2"
              noWrap
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" }, maxWidth: 160 }}
            >
              {name}
            </Typography>
            <Button
              size="small"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={handleLogout}
              sx={{ color: "#DC2626" }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: { xs: 2, sm: 3, lg: 4 },
          maxWidth: 1600,
          mx: "auto",
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, mb: 0.25, fontSize: { xs: 20, sm: 24 } }}
        >
          Platform Administration
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: { xs: 2, md: 3 } }}
        >
          Welcome, {name}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 1.5, md: 3 },
            alignItems: "stretch",
          }}
        >
          {/* LEFT: section rail (desktop) / scrollable chips (mobile) */}
          <Box
            component="nav"
            aria-label="Console sections"
            sx={{
              width: { md: 230 },
              flexShrink: 0,
              display: "flex",
              flexDirection: { xs: "row", md: "column" },
              gap: { xs: 1, md: 1.25 },
              overflowX: { xs: "auto", md: "visible" },
              p: { xs: 0.75, md: 2 },
              alignSelf: { md: "flex-start" },
              borderRadius: { xs: 999, md: "28px" },
              ...glassPanelSx,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {TABS.map((t, i) => {
              const isActive = tab === i;
              return (
                <Box
                  key={t.label}
                  component="button"
                  type="button"
                  onClick={() => setTab(i)}
                  aria-pressed={isActive}
                  sx={railItemSx(isActive)}
                >
                  <Box sx={iconTileSx(isActive)}>
                    <t.icon fontSize="small" />
                  </Box>
                  {t.label}
                </Box>
              );
            })}
          </Box>

          {/* RIGHT: content panel */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              p: { xs: 1.25, sm: 2, md: 2.5 },
              borderRadius: { xs: "22px", md: "32px" },
              display: "flex",
              flexDirection: "column",
              gap: 2,
              ...glassPanelSx,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {TABS[tab].label}
              </Typography>

              {tab === 0 && <CreateLabDialog />}
              {tab === 1 && <CreatePlanDialog />}
              {tab === 2 && <CreateSubscriptionDialog />}
              {tab === 3 && <SendNotificationDialog />}
            </Box>

            {tab === 0 &&
              (labsLoading ? spinner : <LabsTable rows={labs?.items ?? []} />)}
            {tab === 1 &&
              (plansLoading ? spinner : <PlansTable rows={plans ?? []} />)}
            {tab === 2 &&
              (subscriptionsLoading ? (
                spinner
              ) : (
                <SubscriptionsTable rows={subscriptions ?? []} />
              ))}
            {tab === 3 &&
              (notificationsLoading ? (
                spinner
              ) : (
                <NotificationsTable rows={notifications ?? []} />
              ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

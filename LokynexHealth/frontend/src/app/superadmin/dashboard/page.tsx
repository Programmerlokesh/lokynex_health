"use client";

import { SampleDropIcon } from "@/components/icons/lab-icons";
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
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TABS = ["Labs", "Plans", "Subscriptions", "Notifications"];

export default function SuperAdminDashboardPage() {
  const isAuthenticated = useSuperAdminAuthGuard();
  const router = useRouter();
  const name = useSuperAdminAuthStore((s) => s.name);
  const logout = useSuperAdminAuthStore((s) => s.logout);

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
    router.push("/superadmin/login");
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Deliberately its own AppBar — NOT the tenant Sidebar/Topbar — so a
          lab user can never navigate here, and this console never looks like
          part of any single lab's dashboard. */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "#062B5C", borderBottom: "1px solid #0A3872" }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SampleDropIcon sx={{ color: "#22D3EE" }} fontSize="small" />
            <Typography sx={{ fontWeight: 700, color: "#fff" }}>
              SuperAdmin Console
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.75)" }}
            >
              {name}
            </Typography>
            <Button
              size="small"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={handleLogout}
              sx={{ color: "rgba(255,255,255,0.75)" }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Platform Administration
          </Typography>

          {tab === 0 && <CreateLabDialog />}
          {tab === 1 && <CreatePlanDialog />}
          {tab === 2 && <CreateSubscriptionDialog />}
          {tab === 3 && <SendNotificationDialog />}
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {TABS.map((t) => (
            <Tab key={t} label={t} />
          ))}
        </Tabs>

        {tab === 0 &&
          (labsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <LabsTable rows={labs?.items ?? []} />
          ))}

        {tab === 1 &&
          (plansLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <PlansTable rows={plans ?? []} />
          ))}

        {tab === 2 &&
          (subscriptionsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <SubscriptionsTable rows={subscriptions ?? []} />
          ))}

        {tab === 3 &&
          (notificationsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <NotificationsTable rows={notifications ?? []} />
          ))}
      </Box>
    </Box>
  );
}

"use client";

import { CreateOwnerButton } from "@/components/owners/owner-form-dialog";
import { OwnersTable } from "@/components/owners/owners-table";
import { PlatformShell } from "@/components/platform/platform-shell";
import { CreateLabDialog } from "@/components/super-admin/create-lab-dialog";
import { CreatePlanDialog } from "@/components/super-admin/create-plan-dialog";
import { CreateSubscriptionDialog } from "@/components/super-admin/create-subscription-dialog";
import { LabsTable } from "@/components/super-admin/labs-table";
import { NotificationsTable } from "@/components/super-admin/notifications-table";
import { PlansTable } from "@/components/super-admin/plans-table";
import { SendNotificationDialog } from "@/components/super-admin/send-notification-dialog";
import { SubscriptionsTable } from "@/components/super-admin/subscriptions-table";
import { useDebounce } from "@/hooks/use-debounce";
import { useOwners } from "@/hooks/use-owners";
import {
  useLabs,
  useNotifications,
  usePlans,
  useSubscriptions,
} from "@/hooks/use-super-admin";
import { useSuperAdminAuthGuard } from "@/hooks/use-superadmin-auth-guard";
import { glassPanelSx, iconTileSx, railItemSx } from "@/lib/home-theme";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";

type TabKey = "labs" | "owners" | "plans" | "subscriptions" | "notifications";

const TABS: {
  key: TabKey;
  label: string;
  icon: ComponentType<SvgIconProps>;
}[] = [
  { key: "labs", label: "Labs", icon: ScienceOutlinedIcon },
  { key: "owners", label: "Owners", icon: BadgeOutlinedIcon },
  { key: "plans", label: "Plans", icon: WorkspacePremiumOutlinedIcon },
  {
    key: "subscriptions",
    label: "Subscriptions",
    icon: CreditCardOutlinedIcon,
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: NotificationsNoneOutlinedIcon,
  },
];

const spinner = (
  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
    <CircularProgress size={28} />
  </Box>
);

export default function SuperAdminDashboardPage() {
  const isAuthenticated = useSuperAdminAuthGuard();
  const router = useRouter();
  const name = useSuperAdminAuthStore((s) => s.name);
  const logout = useSuperAdminAuthStore((s) => s.logout);

  const [tab, setTab] = useState<TabKey>("labs");
  const [ownerSearch, setOwnerSearch] = useState("");
  const debouncedOwnerSearch = useDebounce(ownerSearch, 400);

  const { data: labs, isLoading: labsLoading } = useLabs({});
  const { data: owners, isLoading: ownersLoading } = useOwners({
    search: debouncedOwnerSearch.trim() || undefined,
  });
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscriptions, isLoading: subscriptionsLoading } =
    useSubscriptions({});
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications({});

  if (!isAuthenticated) return null;

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <PlatformShell
      subtitle="SuperAdmin Console"
      userName={name}
      onLogout={() => {
        logout();
        router.push("/login");
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
          {TABS.map((t) => (
            <Box
              key={t.key}
              component="button"
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              sx={railItemSx(tab === t.key)}
            >
              <Box sx={iconTileSx(tab === t.key)}>
                <t.icon fontSize="small" />
              </Box>
              {t.label}
            </Box>
          ))}
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
              {active.label}
            </Typography>
            {tab === "labs" && <CreateLabDialog />}
            {tab === "owners" && <CreateOwnerButton />}
            {tab === "plans" && <CreatePlanDialog />}
            {tab === "subscriptions" && <CreateSubscriptionDialog />}
            {tab === "notifications" && <SendNotificationDialog />}
          </Box>

          {tab === "labs" &&
            (labsLoading ? spinner : <LabsTable rows={labs?.items ?? []} />)}

          {tab === "owners" && (
            <>
              <TextField
                size="small"
                placeholder="Search owner by name, login ID or phone…"
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {ownersLoading ? (
                spinner
              ) : (
                <OwnersTable rows={owners?.items ?? []} />
              )}
            </>
          )}

          {tab === "plans" &&
            (plansLoading ? spinner : <PlansTable rows={plans ?? []} />)}
          {tab === "subscriptions" &&
            (subscriptionsLoading ? (
              spinner
            ) : (
              <SubscriptionsTable rows={subscriptions ?? []} />
            ))}
          {tab === "notifications" &&
            (notificationsLoading ? (
              spinner
            ) : (
              <NotificationsTable rows={notifications ?? []} />
            ))}
        </Box>
      </Box>
    </PlatformShell>
  );
}

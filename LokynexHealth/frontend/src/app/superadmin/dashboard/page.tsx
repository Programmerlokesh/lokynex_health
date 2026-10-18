"use client";

import { OwnerLedgerView } from "@/components/owner-ledger/owner-ledger-view";
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
import { getApiErrorMessage } from "@/lib/api-error";
import { glassPanelSx, iconTileSx, railItemSx } from "@/lib/home-theme";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";

type TabKey =
  | "labs"
  | "staff"
  | "plans"
  | "subscriptions"
  | "notifications"
  | "ledger";

const TABS: {
  key: TabKey;
  label: string;
  icon: ComponentType<SvgIconProps>;
}[] = [
  { key: "labs", label: "Labs", icon: ScienceOutlinedIcon },
  { key: "staff", label: "Staff", icon: BadgeOutlinedIcon },
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
  { key: "ledger", label: "Ledger & P&L", icon: InsightsOutlinedIcon },
];

const spinner = (
  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
    <CircularProgress size={28} />
  </Box>
);

// A failed request used to look like an empty list. Show the real reason.
const errorNote = (error: unknown) => (
  <Alert severity="error">{getApiErrorMessage(error)}</Alert>
);

export default function SuperAdminDashboardPage() {
  const isAuthenticated = useSuperAdminAuthGuard();
  const router = useRouter();
  const name = useSuperAdminAuthStore((s) => s.name);
  const logout = useSuperAdminAuthStore((s) => s.logout);

  const [tab, setTab] = useState<TabKey>("labs");
  const [staffSearch, setStaffSearch] = useState("");
  const debouncedStaffSearch = useDebounce(staffSearch, 400);
  const [ledgerStaffId, setLedgerStaffId] = useState("");

  const { data: labs, isLoading: labsLoading, error: labsError } = useLabs({});
  const {
    data: staff,
    isLoading: staffLoading,
    error: staffError,
  } = useOwners({
    search: debouncedStaffSearch.trim() || undefined,
  });
  // Full staff list (no search filter) — feeds the Ledger & P&L picker.
  const { data: allStaff } = useOwners({});
  const {
    data: plans,
    isLoading: plansLoading,
    error: plansError,
  } = usePlans();
  const {
    data: subscriptions,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
  } = useSubscriptions({});
  const {
    data: notifications,
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useNotifications({});

  if (!isAuthenticated) return null;

  const active = TABS.find((t) => t.key === tab)!;

  const staffList = allStaff?.items ?? [];
  const ledgerId = ledgerStaffId || staffList[0]?.id || "";
  const ledgerStaff = staffList.find((s) => s.id === ledgerId);

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
            {tab === "staff" && <CreateOwnerButton />}
            {tab === "plans" && <CreatePlanDialog />}
            {tab === "subscriptions" && <CreateSubscriptionDialog />}
            {tab === "notifications" && <SendNotificationDialog />}
          </Box>

          {tab === "labs" &&
            (labsError ? (
              errorNote(labsError)
            ) : labsLoading ? (
              spinner
            ) : (
              <LabsTable rows={labs?.items ?? []} />
            ))}

          {tab === "staff" && (
            <>
              <TextField
                size="small"
                placeholder="Search staff by name, login ID or phone…"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
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
              {staffError ? (
                errorNote(staffError)
              ) : staffLoading ? (
                spinner
              ) : (
                <OwnersTable rows={staff?.items ?? []} />
              )}
            </>
          )}

          {tab === "plans" &&
            (plansError ? (
              errorNote(plansError)
            ) : plansLoading ? (
              spinner
            ) : (
              <PlansTable rows={plans ?? []} />
            ))}

          {tab === "subscriptions" &&
            (subscriptionsError ? (
              errorNote(subscriptionsError)
            ) : subscriptionsLoading ? (
              spinner
            ) : (
              <SubscriptionsTable rows={subscriptions ?? []} />
            ))}

          {tab === "notifications" &&
            (notificationsError ? (
              errorNote(notificationsError)
            ) : notificationsLoading ? (
              spinner
            ) : (
              <NotificationsTable rows={notifications ?? []} />
            ))}

          {tab === "ledger" &&
            (staffList.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No staff yet. Create a staff member first — then you can see
                their Ledger & P&L here.
              </Typography>
            ) : (
              <>
                <TextField
                  select
                  size="small"
                  label="Staff member"
                  value={ledgerId}
                  onChange={(e) => setLedgerStaffId(e.target.value)}
                  sx={{ maxWidth: { sm: 360 } }}
                >
                  {staffList.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} · {s.role}
                      {s.status !== "Active" ? " (inactive)" : ""}
                    </MenuItem>
                  ))}
                </TextField>
                <OwnerLedgerView
                  key={ledgerId}
                  ownerId={ledgerId}
                  ownerName={ledgerStaff?.name}
                  readOnly
                />
              </>
            ))}
        </Box>
      </Box>
    </PlatformShell>
  );
}

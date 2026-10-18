"use client";

import { OwnerLedgerView } from "@/components/owner-ledger/owner-ledger-view";
import { MyProfileDialog } from "@/components/owners/my-profile-dialog";
import { PlatformShell } from "@/components/platform/platform-shell";
import { CreateLabDialog } from "@/components/super-admin/create-lab-dialog";
import { CreatePlanDialog } from "@/components/super-admin/create-plan-dialog";
import { CreateSubscriptionDialog } from "@/components/super-admin/create-subscription-dialog";
import { LabsTable } from "@/components/super-admin/labs-table";
import { NotificationsTable } from "@/components/super-admin/notifications-table";
import { PlansTable } from "@/components/super-admin/plans-table";
import { SendNotificationDialog } from "@/components/super-admin/send-notification-dialog";
import { SubscriptionsTable } from "@/components/super-admin/subscriptions-table";
import { useOwnerAuthGuard } from "@/hooks/use-owner-auth-guard";
import { useMyOwnerProfile } from "@/hooks/use-owners";
import {
  useLabs,
  useNotifications,
  usePlans,
  useSubscriptions,
} from "@/hooks/use-super-admin";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { glassPanelSx, iconTileSx, railItemSx } from "@/lib/home-theme";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { accessLevelOf, panelLabel } from "@/types/owner";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useRouter } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";

type PanelKey = "labs" | "plans" | "subscriptions" | "notifications" | "ledger";
type TabKey = PanelKey | "profile";

// Panels the SuperAdmin can open for a staff member. "My Profile" is always there.
const PANEL_TABS: {
  key: PanelKey;
  label: string;
  icon: ComponentType<SvgIconProps>;
}[] = [
  { key: "labs", label: "Labs", icon: ScienceOutlinedIcon },
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

const PROFILE_TAB: {
  key: TabKey;
  label: string;
  icon: ComponentType<SvgIconProps>;
} = { key: "profile", label: "My Profile", icon: AccountCircleOutlinedIcon };

function Loading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function ErrorNote({ error }: { error: unknown }) {
  return <Alert severity="error">{getApiErrorMessage(error)}</Alert>;
}

function PanelFrame({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
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
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </>
  );
}

// ---------- one component per panel, so a request is only sent
// for the panel that is actually open ----------

function LabsPanel({ manage }: { manage: boolean }) {
  // The API scopes this to the labs THIS staff member added.
  const { data, isLoading, error } = useLabs({});
  return (
    <PanelFrame title="Labs" action={manage ? <CreateLabDialog /> : null}>
      {error ? (
        <ErrorNote error={error} />
      ) : isLoading ? (
        <Loading />
      ) : (
        <LabsTable rows={data?.items ?? []} readOnly />
      )}
    </PanelFrame>
  );
}

function PlansPanel({ manage }: { manage: boolean }) {
  const { data, isLoading, error } = usePlans();
  return (
    <PanelFrame title="Plans" action={manage ? <CreatePlanDialog /> : null}>
      {error ? (
        <ErrorNote error={error} />
      ) : isLoading ? (
        <Loading />
      ) : (
        <PlansTable rows={data ?? []} readOnly={!manage} />
      )}
    </PanelFrame>
  );
}

function SubscriptionsPanel({ manage }: { manage: boolean }) {
  // Only subscriptions of the labs this staff member added.
  const { data, isLoading, error } = useSubscriptions({});
  return (
    <PanelFrame
      title="Subscriptions"
      action={manage ? <CreateSubscriptionDialog /> : null}
    >
      {error ? (
        <ErrorNote error={error} />
      ) : isLoading ? (
        <Loading />
      ) : (
        <SubscriptionsTable rows={data ?? []} readOnly={!manage} />
      )}
    </PanelFrame>
  );
}

function NotificationsPanel({ manage }: { manage: boolean }) {
  const { data, isLoading, error } = useNotifications({});
  return (
    <PanelFrame
      title="Notifications"
      action={manage ? <SendNotificationDialog /> : null}
    >
      {error ? (
        <ErrorNote error={error} />
      ) : isLoading ? (
        <Loading />
      ) : (
        <NotificationsTable rows={data ?? []} />
      )}
    </PanelFrame>
  );
}

function LedgerPanel({ manage }: { manage: boolean }) {
  return (
    <PanelFrame title="Ledger & P&L">
      <OwnerLedgerView readOnly={!manage} />
    </PanelFrame>
  );
}

function ProfilePanel() {
  const { data: me, isLoading, error } = useMyOwnerProfile();
  const [editing, setEditing] = useState(false);
  if (error) return <ErrorNote error={error} />;
  if (isLoading || !me) return <Loading />;

  const rows: [string, string][] = [
    ["Login ID", me.username],
    ["Phone", me.phone],
    ["WhatsApp", me.whatsappNumber || "—"],
    ["Address", me.address || "—"],
    ["Pincode", me.pincode || "—"],
    ["Labs added", String(me.labCount)],
    ["Member since", formatDateTime(me.createdAt)],
  ];
  const perms = me.permissions ?? [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        My Profile
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar
          src={me.profilePictureUrl ?? undefined}
          sx={{ width: 72, height: 72, fontSize: 28 }}
        >
          {me.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }} noWrap>
            {me.name}
          </Typography>
          <Chip
            size="small"
            label={me.role}
            color="primary"
            variant="outlined"
          />
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditOutlinedIcon />}
          onClick={() => setEditing(true)}
          sx={{ ml: "auto", flexShrink: 0 }}
        >
          Edit profile
        </Button>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {rows.map(([k, v]) => (
          <Box
            key={k}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              minWidth: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {k}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, wordBreak: "break-word" }}
            >
              {v}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary">
          Panels the SuperAdmin gave you
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
          {perms.length === 0 ? (
            <Typography variant="body2">None yet</Typography>
          ) : (
            perms.map((p) => (
              <Chip
                key={p.panel}
                size="small"
                variant="outlined"
                color={p.level === "manage" ? "primary" : "default"}
                label={`${panelLabel(p.panel)} · ${p.level === "manage" ? "Manage" : "View"}`}
              />
            ))
          )}
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Your role, Login ID and panel access can only be changed by the
        SuperAdmin.
      </Typography>
      {editing && (
        <MyProfileDialog open onClose={() => setEditing(false)} me={me} />
      )}
    </Box>
  );
}

export default function StaffDashboardPage() {
  const isAuthenticated = useOwnerAuthGuard();
  const router = useRouter();
  const staff = useOwnerAuthStore((s) => s.owner);
  const logout = useOwnerAuthStore((s) => s.logout);

  const [tab, setTab] = useState<TabKey>("labs");

  // Always fresh from the server, so a SuperAdmin change shows without re-login.
  const {
    data: me,
    isLoading: meLoading,
    error: meError,
  } = useMyOwnerProfile(isAuthenticated);

  if (!isAuthenticated) return null;

  const perms = me?.permissions ?? [];
  const tabs = [
    ...PANEL_TABS.filter((t) => accessLevelOf(perms, t.key) !== "none"),
    PROFILE_TAB,
  ];
  const activeKey: TabKey = tabs.some((t) => t.key === tab) ? tab : tabs[0].key;
  const manage =
    activeKey !== "profile" && accessLevelOf(perms, activeKey) === "manage";

  return (
    <PlatformShell
      subtitle={`Staff Console · ${staff?.role ?? ""}`}
      userName={staff?.name ?? null}
      avatarUrl={me?.profilePictureUrl}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, mb: 0.25, fontSize: { xs: 20, sm: 24 } }}
      >
        Welcome, {staff?.name}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        You work under the SuperAdmin. You can open only the panels the
        SuperAdmin has given you.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1.5, md: 3 },
          alignItems: "stretch",
        }}
      >
        <Box
          component="nav"
          aria-label="Staff sections"
          className="no-print"
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
          {tabs.map((t) => (
            <Box
              key={t.key}
              component="button"
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={activeKey === t.key}
              sx={railItemSx(activeKey === t.key)}
            >
              <Box sx={iconTileSx(activeKey === t.key)}>
                <t.icon fontSize="small" />
              </Box>
              {t.label}
            </Box>
          ))}
        </Box>

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
          {meLoading ? (
            <Loading />
          ) : meError ? (
            <ErrorNote error={meError} />
          ) : (
            <>
              {tabs.length === 1 && (
                <Alert severity="info">
                  The SuperAdmin has not given you access to any panel yet.
                  Please ask them to open the panels you need.
                </Alert>
              )}
              {activeKey === "labs" && <LabsPanel manage={manage} />}
              {activeKey === "plans" && <PlansPanel manage={manage} />}
              {activeKey === "subscriptions" && (
                <SubscriptionsPanel manage={manage} />
              )}
              {activeKey === "notifications" && (
                <NotificationsPanel manage={manage} />
              )}
              {activeKey === "ledger" && <LedgerPanel manage={manage} />}
              {activeKey === "profile" && <ProfilePanel />}
            </>
          )}
        </Box>
      </Box>
    </PlatformShell>
  );
}

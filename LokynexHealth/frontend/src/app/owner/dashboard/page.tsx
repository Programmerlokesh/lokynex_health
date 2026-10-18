"use client";

import { OwnerLedgerView } from "@/components/owner-ledger/owner-ledger-view";
import { PlatformShell } from "@/components/platform/platform-shell";
import { CreateLabDialog } from "@/components/super-admin/create-lab-dialog";
import { LabsTable } from "@/components/super-admin/labs-table";
import { useOwnerAuthGuard } from "@/hooks/use-owner-auth-guard";
import { useMyOwnerProfile } from "@/hooks/use-owners";
import { useLabs } from "@/hooks/use-super-admin";
import { formatDateTime } from "@/lib/format";
import { glassPanelSx, iconTileSx, railItemSx } from "@/lib/home-theme";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { Avatar, Box, Chip, CircularProgress, Typography } from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";

type TabKey = "labs" | "ledger" | "profile";
const TABS: {
  key: TabKey;
  label: string;
  icon: ComponentType<SvgIconProps>;
}[] = [
  { key: "labs", label: "Labs", icon: ScienceOutlinedIcon },
  { key: "ledger", label: "Ledger & P&L", icon: InsightsOutlinedIcon },
  { key: "profile", label: "My Profile", icon: AccountCircleOutlinedIcon },
];

function ProfileCard() {
  const { data: me, isLoading } = useMyOwnerProfile();
  if (isLoading || !me) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  const rows: [string, string][] = [
    ["Login ID", me.username],
    ["Phone", me.phone],
    ["WhatsApp", me.whatsappNumber || "—"],
    ["Address", me.address || "—"],
    ["Pincode", me.pincode || "—"],
    ["Labs added", String(me.labCount)],
    ["Member since", formatDateTime(me.createdAt)],
  ];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
      <Typography variant="caption" color="text.secondary">
        To change your details or password, ask the SuperAdmin.
      </Typography>
    </Box>
  );
}

export default function OwnerDashboardPage() {
  const isAuthenticated = useOwnerAuthGuard();
  const router = useRouter();
  const owner = useOwnerAuthStore((s) => s.owner);
  const logout = useOwnerAuthStore((s) => s.logout);

  const [tab, setTab] = useState<TabKey>("labs");

  // Only the labs THIS owner added — the API scopes it by the token.
  const { data: labs, isLoading: labsLoading } = useLabs({});
  const { data: me } = useMyOwnerProfile(isAuthenticated);

  if (!isAuthenticated) return null;

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <PlatformShell
      subtitle={`Owner Console · ${owner?.role ?? ""}`}
      userName={owner?.name ?? null}
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
        Welcome, {owner?.name}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        Add labs, and track your sales profit & loss.
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
          aria-label="Owner sections"
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
          </Box>

          {tab === "labs" &&
            (labsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <LabsTable rows={labs?.items ?? []} readOnly />
            ))}
          {tab === "ledger" && <OwnerLedgerView />}
          {tab === "profile" && <ProfileCard />}
        </Box>
      </Box>
    </PlatformShell>
  );
}

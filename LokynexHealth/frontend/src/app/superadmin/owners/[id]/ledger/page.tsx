"use client";

import { OwnerLedgerView } from "@/components/owner-ledger/owner-ledger-view";
import { PlatformShell } from "@/components/platform/platform-shell";
import { useOwner } from "@/hooks/use-owners";
import { useSuperAdminAuthGuard } from "@/hooks/use-superadmin-auth-guard";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Avatar, Box, Button, Chip, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

// SuperAdmin looking at ONE owner's ledger & P&L (read only).
export default function SuperAdminOwnerLedgerPage() {
  const isAuthenticated = useSuperAdminAuthGuard();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const name = useSuperAdminAuthStore((s) => s.name);
  const logout = useSuperAdminAuthStore((s) => s.logout);
  const { data: owner } = useOwner(isAuthenticated ? id : null);

  if (!isAuthenticated) return null;

  return (
    <PlatformShell
      subtitle="SuperAdmin Console"
      userName={name}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    >
      <Button
        size="small"
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/superadmin/dashboard")}
        className="no-print"
        sx={{ mb: 1 }}
      >
        Back to console
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Avatar
          src={owner?.profilePictureUrl ?? undefined}
          sx={{ width: 44, height: 44 }}
        >
          {owner?.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, fontSize: { xs: 18, sm: 24 } }}
            noWrap
          >
            {owner ? `${owner.name} — Ledger & P&L` : "Ledger & P&L"}
          </Typography>
          {owner && (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <Chip size="small" label={owner.role} variant="outlined" />
              <Chip
                size="small"
                label={owner.status}
                color={owner.status === "Active" ? "success" : "error"}
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      </Box>

      <OwnerLedgerView ownerId={id} ownerName={owner?.name} readOnly />
    </PlatformShell>
  );
}

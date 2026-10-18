"use client";

import { SampleDropIcon } from "@/components/icons/lab-icons";
import { LocationChip } from "@/components/layout/location-chip";
import { homeGradient } from "@/lib/home-theme";
import { useThemeStore } from "@/store/theme-store";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

// Shared frame for EVERY page that works under the SuperAdmin (SuperAdmin
// console, Owner console, owner ledger view). The "Lokynex Health" heading
// always sits at the top of all of them.
export function PlatformShell({
  subtitle,
  userName,
  avatarUrl,
  onLogout,
  children,
}: {
  subtitle: string; // e.g. "SuperAdmin Console" / "Owner Console · CEO"
  userName: string | null;
  avatarUrl?: string | null;
  onLogout: () => void;
  children: ReactNode;
}) {
  const { mode, toggleMode } = useThemeStore();
  const toggleLabel =
    mode === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <Box sx={{ minHeight: "100dvh", background: homeGradient }}>
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
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
          >
            <SampleDropIcon sx={{ color: "#4F8BFF" }} fontSize="small" />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: 16, sm: 20 },
                  lineHeight: 1.15,
                }}
              >
                Lokynex Health
              </Typography>
              <Typography
                noWrap
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", lineHeight: 1.1 }}
              >
                {subtitle}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1.5 },
              flexShrink: 0,
            }}
          >
            <LocationChip />
            <Tooltip title={toggleLabel}>
              <IconButton
                onClick={toggleMode}
                size="small"
                aria-label={toggleLabel}
              >
                {mode === "light" ? (
                  <DarkModeOutlinedIcon fontSize="small" />
                ) : (
                  <LightModeOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            {userName && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  src={avatarUrl ?? undefined}
                  alt={userName}
                  sx={{ width: 28, height: 28, fontSize: 13 }}
                >
                  {userName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  variant="body2"
                  noWrap
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" }, maxWidth: 160 }}
                >
                  {userName}
                </Typography>
              </Box>
            )}
            <Button
              size="small"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={onLogout}
              sx={{ color: "#DC2626", minWidth: 0 }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                Logout
              </Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 1.5, sm: 3, lg: 4 }, maxWidth: 1600, mx: "auto" }}>
        {children}
      </Box>
    </Box>
  );
}

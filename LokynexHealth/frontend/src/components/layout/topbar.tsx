"use client";

import { LocationChip } from "@/components/layout/location-chip";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useMyProfile } from "@/hooks/use-users";
import { glassBarSx } from "@/lib/home-theme";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatDateTime(date: Date) {
  const datePart = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${datePart}  ·  ${timePart}`;
}

export function Topbar({
  showHomeButton = false,
  centerTitle = false,
}: {
  // Phone/small tablet on inner pages: the slim rail is hidden there, so a
  // Home button in the bar takes you back to the home page instead.
  showHomeButton?: boolean;
  // Home page: lab name sits in the exact middle of the bar.
  centerTitle?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  // Same query key as the Profile page, so a new photo/name shows up here
  // instantly after saving.
  const { data: profile } = useMyProfile();
  const displayName = profile?.name ?? user?.name;
  const { mode, toggleMode } = useThemeStore();

  const [now, setNow] = useState<Date | null>(null);

  // clock sudhu laptop+ e dekhay, tai phone/tablet e prottek second re-render korbe na
  const showClock = useMediaQuery(useTheme().breakpoints.up("lg"));

  useEffect(() => {
    if (!showClock) return;
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [showClock]);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      className="no-print"
      sx={{
        ...glassBarSx,
        color: "text.primary",
        border: 0,
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
          {showHomeButton && (
            <IconButton
              component={Link}
              href="/dashboard"
              edge="start"
              aria-label="Go to home"
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              <HomeRoundedIcon />
            </IconButton>
          )}
          {/* Lab name: left on inner pages. On the home page it is centred
              from md up (below md it stays here so nothing overlaps). */}
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 600,
              display: centerTitle ? { xs: "block", md: "none" } : "block",
            }}
          >
            {user?.labName || "Lokynex Health"}
          </Typography>
          {now && showClock && (
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ display: { xs: "none", lg: "block" }, ml: 1 }}
            >
              {formatDateTime(now)}
            </Typography>
          )}
        </Box>

        {centerTitle && (
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
            {user?.labName || "Lokynex Health"}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            flexShrink: 0,
          }}
        >
          <LocationChip />
          <NotificationBell />

          <Tooltip
            title={
              mode === "light" ? "Switch to dark mode" : "Switch to light mode"
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

          <Tooltip title="My Profile">
            <Box
              component={Link}
              href="/profile"
              aria-label="Open my profile"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                sx={{
                  textAlign: "right",
                  display: { xs: "none", sm: "block" },
                  maxWidth: 180,
                }}
              >
                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                  {displayName}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  component="div"
                >
                  {user?.role}
                </Typography>
              </Box>
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar
                  src={profile?.profilePictureUrl || undefined}
                  alt={displayName ?? "User"}
                  sx={{ bgcolor: "#0f172a", width: 36, height: 36 }}
                >
                  {displayName?.charAt(0) ?? "U"}
                </Avatar>
              </motion.div>
            </Box>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

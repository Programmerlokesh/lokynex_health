"use client";

import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
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

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((state) => state.user);
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
          <IconButton
            edge="start"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            flexShrink: 0,
          }}
        >
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

          <Box
            sx={{
              textAlign: "right",
              display: { xs: "none", sm: "block" },
              maxWidth: 180,
            }}
          >
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {user?.name}
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
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            <Avatar
              sx={{ bgcolor: "#0f172a", width: 36, height: 36 }}
              aria-label={user?.name ? `Signed in as ${user.name}` : "User"}
            >
              {user?.name?.charAt(0) ?? "U"}
            </Avatar>
          </motion.div>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

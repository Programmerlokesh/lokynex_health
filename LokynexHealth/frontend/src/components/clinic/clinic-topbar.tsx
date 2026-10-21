"use client";

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
import { useEffect, useState } from "react";

/** Live day / date / time. Starts empty so server and browser HTML always match. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * Doctor Clinic top bar:
 *   left   - the user who is logged in (name only, never a doctor's name)
 *   centre - the clinic name
 *   right  - day, date and time
 */
export function ClinicTopbar({
  userName,
  roleLabel,
  clinicName,
  onLogout,
}: {
  userName: string | null;
  roleLabel?: string;
  clinicName: string;
  onLogout: () => void;
}) {
  const { mode, toggleMode } = useThemeStore();
  const now = useNow();
  const toggleLabel =
    mode === "light" ? "Switch to dark mode" : "Switch to light mode";

  const day = now?.toLocaleDateString("en-IN", { weekday: "long" }) ?? "";
  const date =
    now?.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) ?? "";
  const time =
    now?.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) ?? "";

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
          display: "grid",
          gridTemplateColumns: { xs: "auto 1fr auto", md: "1fr auto 1fr" },
          alignItems: "center",
          gap: 1,
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {/* left: logged-in user */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: 14,
              bgcolor: "primary.main",
            }}
          >
            {(userName ?? "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
            <Typography
              noWrap
              sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}
            >
              {userName ?? ""}
            </Typography>
            {roleLabel && (
              <Typography
                noWrap
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", lineHeight: 1.1 }}
              >
                {roleLabel}
              </Typography>
            )}
          </Box>
        </Box>

        {/* centre: clinic name */}
        <Typography
          component="h1"
          noWrap
          sx={{
            fontWeight: 800,
            fontSize: { xs: 15, sm: 20 },
            textAlign: "center",
            minWidth: 0,
            px: 1,
          }}
        >
          {clinicName}
        </Typography>

        {/* right: day, date, time + controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: { xs: 0.5, sm: 1.5 },
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              textAlign: "right",
              display: { xs: "none", sm: "block" },
              lineHeight: 1.15,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
              {day}
              {day && date ? ", " : ""}
              {date}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: "tabular-nums", display: "block" }}
              noWrap
            >
              {time}
            </Typography>
          </Box>
          {/* phones: one compact line */}
          <Box
            sx={{
              display: { xs: "block", sm: "none" },
              textAlign: "right",
              lineHeight: 1.1,
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 700 }} noWrap>
              {day.slice(0, 3)} {date}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: "text.secondary",
                fontVariantNumeric: "tabular-nums",
              }}
              noWrap
            >
              {time}
            </Typography>
          </Box>
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
  );
}

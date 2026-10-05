"use client";

import { TestTubeIcon } from "@/components/icons/lab-icons";
import {
  HOME_ACCENT,
  HOME_ACCENT_GRADIENT,
  homeGradient,
} from "@/lib/home-theme";
import { useAuthStore } from "@/store/auth-store";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import { Box, Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// The old full navigation list is gone. Every module is opened from the home
// page now; on an inner page this slim rail has ONE job: click it to go back
// to the home page. (Hidden below `md` — phones get a Home button in the
// Topbar instead.)
export const RAIL_WIDTH = 88;

const tileSx = {
  width: 44,
  height: 44,
  borderRadius: "14px",
  display: "grid",
  placeItems: "center",
  color: "#fff",
  background: HOME_ACCENT_GRADIENT,
  boxShadow: "0 6px 14px rgba(59,111,245,0.35)",
} as const;

export function Sidebar() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    document.cookie = "lokynex-token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <Box
      component="aside"
      className="no-print"
      sx={{
        display: { xs: "none", md: "flex" },
        flexShrink: 0,
        width: RAIL_WIDTH,
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: RAIL_WIDTH,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          pt: "calc(var(--safe-top) + 16px)",
          pb: "calc(var(--safe-bottom) + 16px)",
          pl: "var(--safe-left)",
          background: homeGradient,
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        <TestTubeIcon sx={{ color: HOME_ACCENT, fontSize: 24, mb: 1 }} />

        <Tooltip title="Back to Home" placement="right">
          <Box
            component={Link}
            href="/dashboard"
            aria-label="Back to home page"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              textDecoration: "none",
              color: "text.primary",
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: "16px",
              px: 1,
              py: 1,
              "&:hover": { bgcolor: "rgba(255,255,255,0.5)" },
              "&:focus-visible": {
                outline: `2px solid ${HOME_ACCENT}`,
                outlineOffset: 2,
              },
            }}
          >
            <Box sx={tileSx}>
              <HomeRoundedIcon />
            </Box>
            Home
          </Box>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Logout" placement="right">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            aria-label="Logout"
            className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11.5px] font-bold text-red-600 hover:bg-white/50"
          >
            <LogoutIcon fontSize="small" />
            Logout
          </motion.button>
        </Tooltip>
      </Box>
    </Box>
  );
}

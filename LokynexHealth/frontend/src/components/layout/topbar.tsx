"use client";

import { useAuthStore } from "@/store/auth-store";
import { AppBar, Avatar, Box, Toolbar, Typography } from "@mui/material";
import { motion } from "framer-motion";

export function Topbar() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: "1px solid #e2e8f0" }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Lokynex Health
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role}
            </Typography>
          </Box>
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            <Avatar sx={{ bgcolor: "#0f172a", width: 36, height: 36 }}>
              {user?.name?.charAt(0) ?? "U"}
            </Avatar>
          </motion.div>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

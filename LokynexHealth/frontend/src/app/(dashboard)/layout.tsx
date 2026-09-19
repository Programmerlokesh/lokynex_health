"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthGuard();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* minWidth: 0 SOBCHEYE IMPORTANT - eta chhara wide table pura page ke pashe thele dey */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: "100dvh",
          bgcolor: "background.default",
        }}
      >
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            p: { xs: 2, sm: 3, lg: 4 },
            pr: {
              xs: "max(16px, var(--safe-right))",
              sm: "max(24px, var(--safe-right))",
              lg: "max(32px, var(--safe-right))",
            },
            pb: { xs: "max(16px, var(--safe-bottom))", sm: 3, lg: 4 },
            maxWidth: 1600,
            mx: "auto",
            outline: "none",
          }}
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}

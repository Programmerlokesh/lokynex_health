"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { homeGradient } from "@/lib/home-theme";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthGuard();
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  // The home page has its own left-side group rail + option cards, so no
  // sidebar there. Every other page gets the slim rail whose only job is
  // taking you back to the home page.
  const isHome = pathname === "/dashboard";

  return (
    // Gradient lives on the OUTER wrapper now, so the home page, every inner
    // tab and the slim rail all share ONE continuous gradient (no seams).
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        background: homeGradient,
        backgroundAttachment: { md: "fixed" },
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {!isHome && <Sidebar />}

      {/* minWidth: 0 SOBCHEYE IMPORTANT - eta chhara wide table pura page ke pashe thele dey */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: "100dvh",
        }}
      >
        <Topbar showHomeButton={!isHome} centerTitle={isHome} />
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
            pb: {
              xs: "calc(16px + var(--safe-bottom))",
              sm: "calc(24px + var(--safe-bottom))",
              lg: "calc(32px + var(--safe-bottom))",
            },
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

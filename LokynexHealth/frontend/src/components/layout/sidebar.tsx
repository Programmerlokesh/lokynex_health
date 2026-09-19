"use client";

import {
  BranchIcon,
  CommissionIcon,
  DashboardGridIcon,
  MicroscopeIcon,
  OrderFlowIcon,
  PulseIcon,
  ReportIcon,
  TeamIcon,
  TestTubeIcon,
} from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useAuthStore } from "@/store/auth-store";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardGridIcon },
  { label: "Users", href: "/users", icon: TeamIcon },
  { label: "Branches", href: "/branches", icon: BranchIcon },
  { label: "Departments & Tests", href: "/departments", icon: TestTubeIcon },
  { label: "New Order", href: "/orders/new", icon: OrderFlowIcon },
  { label: "Order List", href: "/orders", icon: OrderFlowIcon },
  {
    label: "Doctor / Referral / Technician",
    href: "/directory",
    icon: TeamIcon,
  },
  {
    label: "Commission Setup",
    href: "/commission-setup",
    icon: CommissionIcon,
  },
  {
    label: "Commission Payout",
    href: "/commission-payouts",
    icon: CommissionIcon,
  },
  { label: "Ledger & P&L", href: "/ledger", icon: PulseIcon },
  { label: "Doctor Clinic", href: "/doctor-clinic", icon: MicroscopeIcon },
  { label: "Report Builder", href: "/report-builder", icon: ReportIcon },
];

export const DRAWER_WIDTH = 248; // laptop (lg+) full sidebar
export const RAIL_WIDTH = 76; // tablet (md-lg) icon-only rail

const paperSx = {
  boxSizing: "border-box",
  background: `linear-gradient(180deg, ${brand.navy}, #0A3872)`,
  border: "none",
  color: "#fff",
  paddingTop: "var(--safe-top)",
  paddingBottom: "var(--safe-bottom)",
  paddingLeft: "var(--safe-left)",
} as const;

function SidebarContent({
  rail,
  onNavigate,
  onClose,
}: {
  rail: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const labelDisplay = rail ? { md: "none", lg: "block" } : "block";
  const rowJustify = rail ? { md: "center", lg: "flex-start" } : "flex-start";

  function handleLogout() {
    logout();
    document.cookie = "lokynex-token=; path=/; max-age=0";
    onNavigate?.();
    router.push("/login");
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: rowJustify,
        }}
      >
        <TestTubeIcon sx={{ color: brand.cyan, fontSize: 22 }} />
        <Box
          component="span"
          sx={{
            display: labelDisplay,
            flex: 1,
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Lokynex Health
        </Box>
        {onClose && (
          <IconButton
            onClick={onClose}
            aria-label="Close navigation menu"
            sx={{ color: "rgba(255,255,255,0.8)", mr: -1 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <List
        component="nav"
        aria-label="Main navigation"
        sx={{ px: 1.25, py: 1.5, flex: 1, overflowY: "auto" }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Box key={item.href} sx={{ position: "relative", mb: 0.5 }}>
              {isActive && (
                <motion.div
                  layoutId={
                    rail ? "sidebar-active-bg-rail" : "sidebar-active-bg-drawer"
                  }
                  className="absolute inset-0 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.14)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Tooltip
                title={item.label}
                placement="right"
                slotProps={{
                  popper: {
                    sx: {
                      display: rail ? { md: "block", lg: "none" } : "none",
                    },
                  },
                }}
              >
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    borderRadius: 2,
                    justifyContent: rowJustify,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.72)",
                    "&:hover": {
                      bgcolor: isActive
                        ? "transparent"
                        : "rgba(255,255,255,0.06)",
                    },
                    "&:focus-visible": { outline: `2px solid ${brand.cyan}` },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: rail ? { md: 0, lg: 34 } : 34,
                      justifyContent: "center",
                      color: isActive ? brand.cyan : "inherit",
                    }}
                  >
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{ display: labelDisplay }}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: 13.5,
                          fontWeight: isActive ? 600 : 500,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </Box>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
      <Box sx={{ p: 1.5 }}>
        <Tooltip
          title="Logout"
          placement="right"
          slotProps={{
            popper: {
              sx: { display: rail ? { md: "block", lg: "none" } : "none" },
            },
          }}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            aria-label="Logout"
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/5"
            style={{ justifyContent: rail ? undefined : "flex-start" }}
          >
            <LogoutIcon fontSize="small" />
            <Box component="span" sx={{ display: labelDisplay }}>
              Logout
            </Box>
          </motion.button>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <Box component="aside" className="no-print" sx={{ flexShrink: 0 }}>
      {/* Phone / small tablet (< md): slide-out drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            ...paperSx,
            width: `min(${DRAWER_WIDTH + 24}px, 86vw)`,
          },
        }}
      >
        <SidebarContent
          rail={false}
          onNavigate={onMobileClose}
          onClose={onMobileClose}
        />
      </Drawer>

      {/* Tablet (md-lg): icon rail | Laptop (lg+): full sidebar */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: { md: RAIL_WIDTH, lg: DRAWER_WIDTH },
          "& .MuiDrawer-paper": {
            ...paperSx,
            width: { md: RAIL_WIDTH, lg: DRAWER_WIDTH },
          },
        }}
      >
        <SidebarContent rail />
      </Drawer>
    </Box>
  );
}

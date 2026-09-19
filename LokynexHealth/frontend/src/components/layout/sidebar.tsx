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
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  {
    label: "Ledger & P&L",
    href: "/ledger",
    icon: PulseIcon,
  },
  {
    label: "Doctor Clinic",
    href: "/doctor-clinic",
    icon: MicroscopeIcon,
  },
  {
    label: "Report Builder",
    href: "/report-builder",
    icon: ReportIcon,
  },
];

const drawerWidth = 240;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    document.cookie = "lokynex-token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: `linear-gradient(180deg, ${brand.navy}, #0A3872)`,
          border: "none",
        },
      }}
    >
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
        <TestTubeIcon sx={{ color: brand.cyan, fontSize: 22 }} />
        <span className="text-[15px] font-bold text-white">Lokynex Health</span>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <List sx={{ px: 1.25, py: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative block no-underline"
            >
              <Box sx={{ position: "relative", mb: 0.5 }}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.14)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <ListItemButton
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    borderRadius: 2,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                    "&:hover": {
                      bgcolor: isActive
                        ? "transparent"
                        : "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 34,
                      color: isActive ? brand.cyan : "inherit",
                    }}
                  >
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
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
              </Box>
            </Link>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
      <Box sx={{ p: 1.5 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/5"
        >
          <LogoutIcon fontSize="small" />
          Logout
        </motion.button>
      </Box>
    </Drawer>
  );
}

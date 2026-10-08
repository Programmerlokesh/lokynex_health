"use client";

import {
  BranchIcon,
  CommissionIcon,
  MicroscopeIcon,
  OrderFlowIcon,
  PulseIcon,
  ReportIcon,
  TeamIcon,
  TestTubeIcon,
} from "@/components/icons/lab-icons";
import {
  glassPanelSx,
  homeCardSx,
  iconTileSx,
  railItemSx,
} from "@/lib/home-theme";
import { useAuthStore } from "@/store/auth-store";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { Box, Typography } from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";

type GroupId = "all" | "orders" | "reports" | "accounts" | "settings";

// Left-side groups (same idea as the reference design: All / Orders /
// Reports / Accounts / Settings).
const GROUPS: {
  id: GroupId;
  label: string;
  icon: ComponentType<SvgIconProps>;
}[] = [
  { id: "all", label: "All", icon: GridViewRoundedIcon },
  { id: "orders", label: "Orders", icon: ShoppingCartOutlinedIcon },
  { id: "reports", label: "Reports", icon: BarChartRoundedIcon },
  { id: "accounts", label: "Accounts", icon: AccountBalanceWalletOutlinedIcon },
  { id: "settings", label: "Settings", icon: SettingsOutlinedIcon },
];

// Every option from the old sidebar, tucked inside one of the groups above.
// `moduleName` must match the sidebar's moduleName (permission gate);
// `null` = always visible. `group: "clinic"` shows only under "All".
const ITEMS: {
  label: string;
  href: string;
  tag: string;
  path: string;
  group: Exclude<GroupId, "all"> | "clinic";
  icon: ComponentType<SvgIconProps>;
  moduleName: string | null;
}[] = [
  {
    label: "Branches",
    href: "/branches",
    tag: "Lab",
    path: "lab › branches",
    group: "settings",
    icon: BranchIcon,
    moduleName: "Branches",
  },
  {
    label: "Users",
    href: "/users",
    tag: "Lab",
    path: "lab › users",
    group: "settings",
    icon: TeamIcon,
    moduleName: "Users",
  },
  {
    label: "Departments & Tests",
    href: "/departments",
    tag: "Catalog",
    path: "catalog › departments",
    group: "settings",
    icon: TestTubeIcon,
    moduleName: "DepartmentsAndTests",
  },
  {
    label: "Doctor / Referral / Technician",
    href: "/directory",
    tag: "Masters",
    path: "master › directory",
    group: "settings",
    icon: TeamIcon,
    moduleName: "DoctorReferralTechnician",
  },
  {
    label: "My Profile",
    href: "/profile",
    tag: "Settings",
    path: "settings › profile",
    group: "settings",
    icon: AccountCircleOutlinedIcon,
    moduleName: null,
  },
  {
    label: "New Order",
    href: "/orders/new",
    tag: "Orders",
    path: "orders › new",
    group: "orders",
    icon: OrderFlowIcon,
    moduleName: "NewOrder",
  },
  {
    label: "Order List",
    href: "/orders",
    tag: "Orders",
    path: "orders › list",
    group: "orders",
    icon: OrderFlowIcon,
    moduleName: "OrderListAndReports",
  },
  {
    label: "Upload Report",
    href: "/reports/upload",
    tag: "Reports",
    path: "reports › upload",
    group: "reports",
    icon: ReportIcon,
    moduleName: "OrderListAndReports",
  },
  {
    label: "Report Builder",
    href: "/report-builder",
    tag: "Reports",
    path: "reports › report-builder",
    group: "reports",
    icon: ReportIcon,
    moduleName: "OrderListAndReports",
  },
  {
    label: "Commission Setup",
    href: "/commission-setup",
    tag: "Reports",
    path: "reports › commission-setup",
    group: "reports",
    icon: CommissionIcon,
    moduleName: "CommissionSetup",
  },
  {
    label: "Ledger & P&L",
    href: "/ledger",
    tag: "Reports",
    path: "reports › ledger",
    group: "reports",
    icon: PulseIcon,
    moduleName: "Ledger",
  },
  {
    label: "Commission Payout",
    href: "/commission-payouts",
    tag: "Accounts",
    path: "accounts › commission-payouts",
    group: "accounts",
    icon: CommissionIcon,
    moduleName: "Commission",
  },
  {
    label: "Doctor Clinic",
    href: "/doctor-clinic",
    tag: "Clinic",
    path: "doctor-clinic",
    group: "clinic",
    icon: MicroscopeIcon,
    moduleName: "DoctorClinic",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [active, setActive] = useState<GroupId>("all");

  // Same permission rule the old sidebar used: LabAdmin sees everything,
  // other staff only the modules granted to them.
  const isLabAdmin = user?.role === "LabAdmin";
  const permissions = user?.permissions ?? [];
  const canView = (moduleName: string | null) =>
    moduleName === null ||
    isLabAdmin ||
    permissions.includes(`${moduleName}:View`);

  const visible = ITEMS.filter((i) => canView(i.moduleName));
  const groups = GROUPS.filter(
    (g) => g.id === "all" || visible.some((i) => i.group === g.id),
  );
  const shown =
    active === "all" ? visible : visible.filter((i) => i.group === active);

  function handleLogout() {
    logout();
    document.cookie = "lokynex-token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, mb: 0.25, fontSize: { xs: 20, sm: 24 } }}
      >
        Welcome, {user?.name}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        Role: {user?.role}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1.5, md: 3 },
          alignItems: "stretch",
        }}
      >
        {/* LEFT: group rail (desktop) / scrollable chips (mobile) */}
        <Box
          component="nav"
          aria-label="Home sections"
          sx={{
            width: { md: 230 },
            flexShrink: 0,
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            gap: { xs: 1, md: 1.25 },
            overflowX: { xs: "auto", md: "visible" },
            p: { xs: 0.75, md: 2 },
            borderRadius: { xs: 999, md: "28px" },
            ...glassPanelSx,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {groups.map((g) => {
            const isActive = active === g.id;
            return (
              <Box
                key={g.id}
                component="button"
                type="button"
                onClick={() => setActive(g.id)}
                aria-pressed={isActive}
                sx={railItemSx(isActive)}
              >
                <Box sx={iconTileSx(isActive)}>
                  <g.icon fontSize="small" />
                </Box>
                {g.label}
              </Box>
            );
          })}

          {/* Desktop only: Logout at the bottom of the rail
              (Doctor Clinic stays available as a card under "All") */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              gap: 0.5,
              mt: "auto",
              pt: 2,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={handleLogout}
              sx={{ ...railItemSx(false), color: "#DC2626", fontSize: 13.5 }}
            >
              <LogoutIcon fontSize="small" />
              Logout
            </Box>
          </Box>
        </Box>

        {/* RIGHT: option cards */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 1.25, sm: 2, md: 2.5 },
            borderRadius: { xs: "22px", md: "32px" },
            ...glassPanelSx,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gap: { xs: 1.25, sm: 1.75 },
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            {shown.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                whileHover={{ y: -3 }}
                style={{ minWidth: 0 }}
              >
                <Box component={Link} href={item.href} sx={homeCardSx}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      color: "text.secondary",
                      mb: 0.5,
                    }}
                  >
                    <item.icon sx={{ fontSize: 14 }} />
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.tag}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3 }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{ fontSize: 12.5, fontWeight: 600, mt: 0.25 }}
                    color="text.secondary"
                  >
                    {item.path}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Mobile: Logout lives here (rail is chips only; Doctor Clinic is a card under "All") */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              gap: 1,
              mt: 2,
              flexWrap: "wrap",
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={handleLogout}
              sx={{
                ...railItemSx(false),
                color: "#DC2626",
                bgcolor: "rgba(255,255,255,0.7)",
                px: 2,
              }}
            >
              <LogoutIcon fontSize="small" />
              Logout
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

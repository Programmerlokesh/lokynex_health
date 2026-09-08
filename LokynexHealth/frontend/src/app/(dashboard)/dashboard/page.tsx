"use client";

import {
  CommissionIcon,
  TeamIcon,
  TestTubeIcon,
} from "@/components/icons/lab-icons";
import { useAuthStore } from "@/store/auth-store";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { motion } from "framer-motion";

const stats = [
  {
    label: "Total Users",
    value: "—",
    icon: TeamIcon,
    iconColor: "#0EA5E9",
    bg: "#E0F2FE",
  },
  {
    label: "Active Tests",
    value: "—",
    icon: TestTubeIcon,
    iconColor: "#00BFA6",
    bg: "#CCFBF1",
  },
  {
    label: "Revenue (MTD)",
    value: "—",
    icon: CommissionIcon,
    iconColor: "#F97316",
    bg: "#FFEDD5",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Welcome, {user?.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Role: {user?.role}
      </Typography>

      <Grid container spacing={2}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
            >
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 16px rgba(23,43,77,0.06)",
                }}
              >
                <CardContent
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Box
                    sx={{
                      bgcolor: stat.bg,
                      color: stat.iconColor,
                      p: 1.4,
                      borderRadius: 2.5,
                      display: "flex",
                    }}
                  >
                    <stat.icon fontSize="medium" />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

"use client";

import { CommissionOverridesTable } from "@/components/commissions/commission-overrides-table";
import { SetCommissionOverrideDialog } from "@/components/commissions/set-commission-override-dialog";
import { CommissionIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useCommissionOverrides } from "@/hooks/use-commissions";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

const TABS = ["All", "Doctor", "Referral", "Technician"] as const;

export default function CommissionSetupPage() {
  const [tab, setTab] = useState(0);
  const entityType = TABS[tab] === "All" ? "" : TABS[tab];

  const { data, isLoading } = useCommissionOverrides(entityType);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: "#EDE9FE",
              color: brand.purple,
              p: 1,
              borderRadius: 2,
              display: "flex",
            }}
          >
            <CommissionIcon fontSize="small" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Commission Setup
          </Typography>
        </Box>
        <SetCommissionOverrideDialog />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: -1.5 }}>
        Per-test commission overrides for a specific doctor, referral, or
        technician — takes precedence over the test&apos;s default commission.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        {TABS.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <CommissionOverridesTable rows={data?.items ?? []} />
      )}
    </Box>
  );
}

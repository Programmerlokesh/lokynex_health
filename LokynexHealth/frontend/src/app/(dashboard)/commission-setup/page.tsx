"use client";

import { CommissionOverridesTable } from "@/components/commissions/commission-overrides-table";
import { SetCommissionOverrideDialog } from "@/components/commissions/set-commission-override-dialog";
import { PageHeader, SearchBar } from "@/components/common/page-kit";
import { CommissionIcon } from "@/components/icons/lab-icons";
import { useCommissionOverrides } from "@/hooks/use-commissions";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { useMemo, useState } from "react";

const TABS = ["All", "Doctor", "Referral", "Technician"] as const;

export default function CommissionSetupPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const entityType = TABS[tab] === "All" ? "" : TABS[tab];

  const { data, isLoading } = useCommissionOverrides(entityType);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = data?.items ?? [];
    return q
      ? all.filter(
          (r) =>
            r.entityName.toLowerCase().includes(q) ||
            r.testName.toLowerCase().includes(q),
        )
      : all;
  }, [data, search]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        icon={<CommissionIcon />}
        tint="#EDE9FE"
        color="#7C3AED"
        title="Commission Setup"
        subtitle="Custom per-test rates for a doctor, referral or technician. They win over the test's default commission."
        actions={<SetCommissionOverrideDialog />}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Custom commissions
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data ? `${rows.length} shown` : ""}
          </Typography>
        </Box>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by person or test..."
          maxWidth={360}
        />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {TABS.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <CommissionOverridesTable rows={rows} />
      )}
    </Box>
  );
}

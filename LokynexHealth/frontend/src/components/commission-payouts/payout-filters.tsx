"use client";

import { GetPayoutsFilters } from "@/types/commission-payout";
import { Box, Grid, MenuItem, TextField } from "@mui/material";

export function PayoutFilters({
  filters,
  onChange,
}: {
  filters: GetPayoutsFilters;
  onChange: (patch: Partial<GetPayoutsFilters>) => void;
}) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        mb: 2.5,
      }}
    >
      <Grid container spacing={2}>
        <Grid size={2.4}>
          <TextField
            label="Date From"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.dateFrom ?? ""}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
        </Grid>
        <Grid size={2.4}>
          <TextField
            label="Date To"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.dateTo ?? ""}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
        </Grid>
        <Grid size={2.4}>
          <TextField
            select
            label="Entity Type"
            size="small"
            fullWidth
            value={filters.entityType ?? ""}
            onChange={(e) => onChange({ entityType: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Doctor">Doctor</MenuItem>
            <MenuItem value="Referral">Referral</MenuItem>
            <MenuItem value="Technician">Technician</MenuItem>
          </TextField>
        </Grid>
        <Grid size={2.4}>
          <TextField
            select
            label="Status"
            size="small"
            fullWidth
            value={filters.status ?? "All"}
            onChange={(e) => onChange({ status: e.target.value })}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Unpaid">Unpaid</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
          </TextField>
        </Grid>
        <Grid size={2.4}>
          <TextField
            select
            label="Group By"
            size="small"
            fullWidth
            value={filters.groupBy}
            onChange={(e) =>
              onChange({
                groupBy: e.target.value as GetPayoutsFilters["groupBy"],
              })
            }
          >
            <MenuItem value="Day">Day</MenuItem>
            <MenuItem value="Week">Week</MenuItem>
            <MenuItem value="Month">Month</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
}

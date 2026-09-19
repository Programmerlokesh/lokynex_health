"use client";

import { useBranches } from "@/hooks/use-branches";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  branchId: string;
  paymentStatus: string;
  search: string;
  orderNumber: string;
  showDeleted: boolean;
}

export function OrderFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}) {
  const { data: branches } = useBranches({ pageSize: 100 });

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
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TextField
            label="Date From"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TextField
            label="Date To"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TextField
            select
            label="Branch"
            size="small"
            fullWidth
            value={filters.branchId}
            onChange={(e) => onChange({ branchId: e.target.value })}
          >
            <MenuItem value="">All Branches</MenuItem>
            {branches?.items.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.branchName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TextField
            select
            label="Payment Status"
            size="small"
            fullWidth
            value={filters.paymentStatus}
            onChange={(e) => onChange({ paymentStatus: e.target.value })}
          >
            <MenuItem value="Any">Any</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Partial">Partial</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <TextField
            label="Order ID"
            size="small"
            fullWidth
            value={filters.orderNumber}
            onChange={(e) => onChange({ orderNumber: e.target.value })}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            label="Patient Name / Phone"
            size="small"
            fullWidth
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid
          size={6}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={filters.showDeleted}
                onChange={(e) => onChange({ showDeleted: e.target.checked })}
              />
            }
            label="Show Deleted List"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

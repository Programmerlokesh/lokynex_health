"use client";

import { useBranches } from "@/hooks/use-branches";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  branchId: string;
  paymentMethod: string;
  paymentStatus: string;
  /** Patient name or phone. */
  search: string;
  orderNumber: string;
}

export const initialFilters: FilterState = {
  dateFrom: "",
  dateTo: "",
  branchId: "",
  paymentMethod: "Any",
  paymentStatus: "Any",
  search: "",
  orderNumber: "",
};

/**
 * Nothing is searched while typing. The values live in a local DRAFT; only
 * "Apply Filter" (or Enter) pushes them to the page. "Reset" clears every field
 * back to its starting value and applies that straight away.
 */
export function OrderFilters({
  onApply,
}: {
  onApply: (filters: FilterState) => void;
}) {
  const { data: branches } = useBranches({ pageSize: 100 });
  const [draft, setDraft] = useState<FilterState>(initialFilters);

  const patch = (p: Partial<FilterState>) => setDraft((d) => ({ ...d, ...p }));
  const badRange =
    !!draft.dateFrom && !!draft.dateTo && draft.dateFrom > draft.dateTo;

  function apply() {
    if (badRange) return;
    onApply({
      ...draft,
      search: draft.search.trim(),
      orderNumber: draft.orderNumber.trim(),
    });
  }

  function reset() {
    setDraft(initialFilters);
    onApply(initialFilters);
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        p: { xs: 1.5, sm: 2.5 },
        mb: 2.5,
      }}
    >
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid size={{ xs: 6, md: 3, lg: 2 }}>
          <TextField
            label="Date From"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={draft.dateFrom}
            onChange={(e) => patch({ dateFrom: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3, lg: 2 }}>
          <TextField
            label="Date To"
            type="date"
            size="small"
            fullWidth
            error={badRange}
            helperText={badRange ? "Before start date" : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
            value={draft.dateTo}
            onChange={(e) => patch({ dateTo: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
          <TextField
            select
            label="Branch"
            size="small"
            fullWidth
            value={draft.branchId}
            onChange={(e) => patch({ branchId: e.target.value })}
          >
            <MenuItem value="">All Branches</MenuItem>
            {branches?.items.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.branchName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 3, lg: 2 }}>
          <TextField
            select
            label="Payment Method"
            size="small"
            fullWidth
            value={draft.paymentMethod}
            onChange={(e) => patch({ paymentMethod: e.target.value })}
          >
            <MenuItem value="Any">Any</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Card">Card</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 3, lg: 2 }}>
          <TextField
            select
            label="Payment Status"
            size="small"
            fullWidth
            value={draft.paymentStatus}
            onChange={(e) => patch({ paymentStatus: e.target.value })}
          >
            <MenuItem value="Any">Any</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Partial">Partial</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
          <TextField
            label="Order ID"
            size="small"
            fullWidth
            placeholder="e.g. ORD-105"
            value={draft.orderNumber}
            onChange={(e) => patch({ orderNumber: e.target.value })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Patient Name / Phone"
            size="small"
            fullWidth
            placeholder="Search..."
            value={draft.search}
            onChange={(e) => patch({ search: e.target.value })}
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
          size={{ xs: 12, md: 6 }}
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
        >
          <Button
            type="button"
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={reset}
            sx={{ flex: { xs: 1, md: "0 0 auto" } }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<FilterListIcon />}
            disabled={badRange}
            sx={{ flex: { xs: 1, md: "0 0 auto" } }}
          >
            Apply Filter
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

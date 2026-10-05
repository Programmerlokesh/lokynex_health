"use client";

import { useBranches } from "@/hooks/use-branches";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
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

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    bgcolor: "background.paper",
  },
} as const;

/** Small CAPS label above a field (like the reference design). */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        component="div"
        sx={{
          mb: 0.5,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

/**
 * Nothing is searched while typing. The values live in a local DRAFT; only
 * "Apply Filters" (or Enter) pushes them to the page. "Reset" clears every
 * field and applies that straight away.
 *
 * `applied` is what the page is currently using. When the page changes it
 * from outside (Day / Week / Month in the Actions menu) the draft follows.
 */
export function OrderFilters({
  applied,
  onApply,
}: {
  applied: FilterState;
  onApply: (filters: FilterState) => void;
}) {
  const { data: branches } = useBranches({ pageSize: 100 });
  const [draft, setDraft] = useState<FilterState>(applied);
  const [prevApplied, setPrevApplied] = useState<FilterState>(applied);
  // phone e filter default e collapse thake, md+ e always open
  const [open, setOpen] = useState(false);

  // Keep the draft in sync when the page changes `applied` from outside.
  if (prevApplied !== applied) {
    setPrevApplied(applied);
    setDraft(applied);
  }

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
    setOpen(false);
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
        borderRadius: 4,
        p: { xs: 1.75, sm: 2.5 },
        mb: 2.5,
        boxShadow: "0 6px 20px rgba(23,43,77,0.05)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <FilterListIcon fontSize="small" />
            <Typography sx={{ fontWeight: 800, fontSize: 17 }}>
              Filters
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: "block" }}
          >
            Date, branch, status, payment and patient search
          </Typography>
        </Box>
        <IconButton
          aria-label={open ? "Hide filters" : "Show filters"}
          onClick={() => setOpen((v) => !v)}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s",
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: { xs: open ? "block" : "none", md: "block" },
          mt: 1.75,
        }}
      >
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Field label="Date From">
              <TextField
                type="date"
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Date from" } }}
                value={draft.dateFrom}
                onChange={(e) => patch({ dateFrom: e.target.value })}
              />
            </Field>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Field label="Date To">
              <TextField
                type="date"
                size="small"
                fullWidth
                sx={fieldSx}
                error={badRange}
                helperText={badRange ? "Before start date" : undefined}
                slotProps={{ htmlInput: { "aria-label": "Date to" } }}
                value={draft.dateTo}
                onChange={(e) => patch({ dateTo: e.target.value })}
              />
            </Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Field label="Branch">
              <TextField
                select
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Branch" } }}
                value={draft.branchId}
                onChange={(e) => patch({ branchId: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {branches?.items.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.branchName}
                  </MenuItem>
                ))}
              </TextField>
            </Field>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <Field label="Status">
              <TextField
                select
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Payment status" } }}
                value={draft.paymentStatus}
                onChange={(e) => patch({ paymentStatus: e.target.value })}
              >
                <MenuItem value="Any">Any</MenuItem>
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="Partial">Partial</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </TextField>
            </Field>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <Field label="Payment Method">
              <TextField
                select
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Payment method" } }}
                value={draft.paymentMethod}
                onChange={(e) => patch({ paymentMethod: e.target.value })}
              >
                <MenuItem value="Any">Any</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </TextField>
            </Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Field label="Name / Phone">
              <TextField
                size="small"
                fullWidth
                sx={fieldSx}
                placeholder="Patient name or phone"
                slotProps={{
                  htmlInput: { "aria-label": "Patient name or phone" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                value={draft.search}
                onChange={(e) => patch({ search: e.target.value })}
              />
            </Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Field label="Order #">
              <TextField
                size="small"
                fullWidth
                sx={fieldSx}
                placeholder="e.g. ORD-105"
                slotProps={{ htmlInput: { "aria-label": "Order number" } }}
                value={draft.orderNumber}
                onChange={(e) => patch({ orderNumber: e.target.value })}
              />
            </Field>
          </Grid>

          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              startIcon={<FilterListIcon />}
              disabled={badRange}
              sx={{ flex: 1, height: 40, borderRadius: 999 }}
            >
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltIcon />}
              onClick={reset}
              sx={{
                flex: 1,
                height: 40,
                borderRadius: 999,
                borderColor: "divider",
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

"use client";

import { PillButton } from "@/components/report-builder/report-toolbar-ui";
import {
  activeOrderRange,
  initialOrderFilters,
  OrderFilterState,
} from "@/lib/order-report-filters";
import { QuickRange, rangeFor } from "@/lib/report-builder-filters";
import { ReportStatusFilter } from "@/types/report-builder";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Box,
  Button,
  Collapse,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

const QUICK: { key: QuickRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

const labelSx = {
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "text.secondary",
  mb: 0.5,
  display: "block",
} as const;

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    bgcolor: "background.paper",
    fontWeight: 600,
  },
} as const;

/**
 * Nothing is searched while typing. Values live in a local DRAFT; only
 * "Apply Filters" (or Enter) pushes them to the page. Quick range pills apply
 * straight away. The parent re-mounts this component (via `key`) when the
 * applied filters change from outside.
 */
export function OrderReportFilters({
  open,
  applied,
  onApply,
}: {
  open: boolean;
  applied: OrderFilterState;
  onApply: (f: OrderFilterState) => void;
}) {
  const [draft, setDraft] = useState<OrderFilterState>(applied);
  const patch = (p: Partial<OrderFilterState>) =>
    setDraft((d) => ({ ...d, ...p }));

  const badRange =
    !!draft.dateFrom && !!draft.dateTo && draft.dateFrom > draft.dateTo;
  const current = activeOrderRange(draft);

  function apply() {
    if (badRange) return;
    onApply({
      ...draft,
      orderNumber: draft.orderNumber.trim(),
      patientName: draft.patientName.trim(),
      phone: draft.phone.trim(),
      testName: draft.testName.trim(),
    });
  }

  function reset() {
    setDraft(initialOrderFilters);
    onApply(initialOrderFilters);
  }

  function quick(r: QuickRange) {
    const next = { ...draft, ...rangeFor(r) };
    setDraft(next);
    onApply(next);
  }

  const text = (
    label: string,
    key: "patientName" | "phone" | "orderNumber" | "testName",
    placeholder?: string,
  ) => (
    <Box>
      <Typography sx={labelSx}>{label}</Typography>
      <TextField
        size="small"
        fullWidth
        sx={fieldSx}
        placeholder={placeholder}
        value={draft[key]}
        onChange={(e) =>
          patch({ [key]: e.target.value } as Partial<OrderFilterState>)
        }
      />
    </Box>
  );

  return (
    <Collapse in={open} unmountOnExit>
      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        sx={{
          borderRadius: "28px",
          p: { xs: 2, sm: 3 },
          background:
            "linear-gradient(135deg, rgba(25,118,210,0.06), rgba(124,58,237,0.05))",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
          {QUICK.map((q) => (
            <PillButton
              key={q.key}
              active={current === q.key}
              onClick={() => quick(q.key)}
            >
              <CalendarMonthOutlinedIcon sx={{ fontSize: 14 }} />
              {q.label}
            </PillButton>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          <Box>
            <Typography sx={labelSx}>Date from</Typography>
            <TextField
              type="date"
              size="small"
              fullWidth
              sx={fieldSx}
              value={draft.dateFrom}
              onChange={(e) => patch({ dateFrom: e.target.value })}
            />
          </Box>
          <Box>
            <Typography sx={labelSx}>Date to</Typography>
            <TextField
              type="date"
              size="small"
              fullWidth
              sx={fieldSx}
              error={badRange}
              helperText={badRange ? "Before start date" : undefined}
              value={draft.dateTo}
              onChange={(e) => patch({ dateTo: e.target.value })}
            />
          </Box>
          <Box>
            <Typography sx={labelSx}>Report status</Typography>
            <TextField
              select
              size="small"
              fullWidth
              sx={fieldSx}
              value={draft.status}
              onChange={(e) =>
                patch({ status: e.target.value as ReportStatusFilter })
              }
            >
              <MenuItem value="Any">Any</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Reported">Reported</MenuItem>
            </TextField>
          </Box>
          {text("Test", "testName", "e.g. USG, X-ray")}
          {text("Patient name contains", "patientName")}
          {text("Phone", "phone")}
          {text("Order # (contains)", "orderNumber")}
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2.5 }}
        >
          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={<FilterListIcon />}
            disabled={badRange}
            sx={{
              borderRadius: "999px",
              py: 1.4,
              fontWeight: 800,
              background: "linear-gradient(90deg, #3B82F6, #1976D2)",
              boxShadow: "0 8px 20px rgba(25,118,210,0.28)",
            }}
          >
            Apply Filters
          </Button>
          <Box>
            <Button
              type="button"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={reset}
              sx={{
                borderRadius: "999px",
                px: 2.5,
                bgcolor: "background.paper",
                color: "text.primary",
                boxShadow: "0 1px 3px rgba(23,43,77,0.10)",
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Box>
    </Collapse>
  );
}

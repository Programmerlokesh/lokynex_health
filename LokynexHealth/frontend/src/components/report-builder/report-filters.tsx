"use client";

import { PillButton } from "@/components/report-builder/report-toolbar-ui";
import {
  activeRange,
  initialReportFilters,
  QuickRange,
  rangeFor,
  ReportFilterState,
  SourceFilter,
} from "@/lib/report-builder-filters";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Collapse,
  InputAdornment,
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
 * applied filters change from outside, so the draft always starts in sync.
 */
export function ReportFilters({
  open,
  mode,
  applied,
  onApply,
}: {
  open: boolean;
  mode: "templates" | "documents";
  applied: ReportFilterState;
  onApply: (f: ReportFilterState) => void;
}) {
  const [draft, setDraft] = useState<ReportFilterState>(applied);
  const patch = (p: Partial<ReportFilterState>) =>
    setDraft((d) => ({ ...d, ...p }));

  const badRange =
    !!draft.dateFrom && !!draft.dateTo && draft.dateFrom > draft.dateTo;
  const current = activeRange(draft);

  function apply() {
    if (badRange) return;
    onApply({ ...draft, search: draft.search.trim() });
  }

  function reset() {
    setDraft(initialReportFilters);
    onApply(initialReportFilters);
  }

  function quick(r: QuickRange) {
    const next = { ...draft, ...rangeFor(r) };
    setDraft(next);
    onApply({ ...next, search: next.search.trim() });
  }

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

          {mode === "templates" && (
            <Box>
              <Typography sx={labelSx}>Source</Typography>
              <TextField
                select
                size="small"
                fullWidth
                sx={fieldSx}
                value={draft.source}
                onChange={(e) =>
                  patch({ source: e.target.value as SourceFilter })
                }
              >
                <MenuItem value="Any">Any</MenuItem>
                <MenuItem value="Manual">Manual</MenuItem>
                <MenuItem value="UploadedDocument">Uploaded Document</MenuItem>
              </TextField>
            </Box>
          )}

          <Box
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
                lg: mode === "templates" ? "auto" : "span 2",
              },
            }}
          >
            <Typography sx={labelSx}>
              {mode === "templates"
                ? "Template name contains"
                : "Order # / patient / test"}
            </Typography>
            <TextField
              size="small"
              fullWidth
              sx={fieldSx}
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
          </Box>
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

"use client";

import { PulseIcon } from "@/components/icons/lab-icons";
import {
  BranchPerformance,
  OutflowDonut,
  PnlWaterfall,
} from "@/components/ledger/ledger-breakdown-charts";
import { LedgerEntryDialog } from "@/components/ledger/ledger-entry-dialog";
import {
  LedgerInsights,
  LedgerKpiCards,
} from "@/components/ledger/ledger-kpi-cards";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { LedgerTrendChart } from "@/components/ledger/ledger-trend-chart";
import { PnlStatement } from "@/components/ledger/pnl-statement";
import { SyncLedgerDialog } from "@/components/ledger/sync-ledger-dialog";
import { brand } from "@/components/providers/mui-theme-provider";
import { useBranches } from "@/hooks/use-branches";
import { useLedgerAnalytics } from "@/hooks/use-ledger";
import {
  formatDisplayDate,
  getPresetRange,
  PRESETS,
  type PresetId,
} from "@/lib/ledger-utils";
import type { GranularityChoice, LedgerEntry } from "@/types/ledger";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

type TabId = "overview" | "pnl" | "ledger";

function OverviewSkeleton() {
  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          mb: 2,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0,1fr))",
            lg: "repeat(6, minmax(0,1fr))",
          },
        }}
      >
        <Skeleton
          variant="rounded"
          height={170}
          sx={{ gridColumn: "span 2", borderRadius: 4 }}
        />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={170}
            sx={{ borderRadius: 4 }}
          />
        ))}
      </Box>
      <Skeleton
        variant="rounded"
        height={360}
        sx={{ borderRadius: 4, mb: 2 }}
      />
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />
      </Box>
    </Box>
  );
}

export default function LedgerPage() {
  const initial = getPresetRange("30d");
  const [preset, setPreset] = useState<PresetId | "custom">("30d");
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [branchId, setBranchId] = useState("");
  const [granularity, setGranularity] = useState<GranularityChoice>("auto");
  const [tab, setTab] = useState<TabId>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerEntry | null>(null);

  const qc = useQueryClient();
  const { data: branches } = useBranches({ pageSize: 100 });

  const analyticsFilters = useMemo(
    () => ({
      branchId: branchId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      granularity,
    }),
    [branchId, dateFrom, dateTo, granularity],
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useLedgerAnalytics(analyticsFilters);

  const branchName = branches?.items.find((b) => b.id === branchId)?.branchName;
  const periodLabel = data
    ? `${formatDisplayDate(data.dateFrom)} – ${formatDisplayDate(data.dateTo)} · ${branchName ?? "All branches"}`
    : "";
  const previousLabel = data
    ? `${formatDisplayDate(data.previousFrom)} – ${formatDisplayDate(data.previousTo)}`
    : "";

  function applyPreset(id: PresetId) {
    const r = getPresetRange(id);
    setPreset(id);
    setDateFrom(r.dateFrom);
    setDateTo(r.dateTo);
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: LedgerEntry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  const isEmpty = !!data && data.current.entryCount === 0;

  const emptyState = (
    <Paper sx={{ p: { xs: 3, sm: 6 }, textAlign: "center" }}>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        style={{ display: "inline-block" }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            mx: "auto",
            color: brand.electricBlue,
            bgcolor: alpha(brand.electricBlue, 0.14),
          }}
        >
          <RequestQuoteRoundedIcon sx={{ fontSize: 38 }} />
        </Box>
      </motion.div>
      <Typography variant="h6" sx={{ mt: 2 }}>
        No ledger entries in this range
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.5, mb: 3, maxWidth: 440, mx: "auto" }}
      >
        Pull in paid orders and commission payouts with <b>Sync from Orders</b>,
        record a manual entry, or pick a wider date range.
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <SyncLedgerDialog />
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openNew}
        >
          Record entry
        </Button>
        <Button variant="text" onClick={() => applyPreset("all")}>
          Show all time
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box>
      {/* ---------- header ---------- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}
        >
          <Box
            sx={{
              bgcolor: "#E0F2FE",
              color: brand.electricBlue,
              p: 1,
              borderRadius: 2,
              display: "flex",
            }}
          >
            <PulseIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Ledger &amp; P&amp;L
            </Typography>
            {periodLabel && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {periodLabel}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Tooltip title="Refresh">
            <IconButton
              aria-label="Refresh ledger"
              onClick={() => qc.invalidateQueries({ queryKey: ["ledger"] })}
            >
              <motion.div
                animate={{ rotate: isFetching ? 360 : 0 }}
                transition={
                  isFetching
                    ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                    : { duration: 0 }
                }
                style={{ display: "flex" }}
              >
                <RefreshRoundedIcon />
              </motion.div>
            </IconButton>
          </Tooltip>
          <SyncLedgerDialog />
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openNew}
          >
            Record Entry
          </Button>
        </Box>
      </Box>

      {/* ---------- filters ---------- */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            pb: 0.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {PRESETS.map((p) => {
            const selected = preset === p.id;
            return (
              <Box
                key={p.id}
                component="button"
                type="button"
                onClick={() => applyPreset(p.id)}
                aria-pressed={selected}
                sx={{
                  flexShrink: 0,
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  px: 1.5,
                  py: 0.6,
                  minHeight: 34,
                  borderRadius: 99,
                  border: `1.5px solid ${selected ? brand.blue : "transparent"}`,
                  color: selected ? brand.blue : "text.secondary",
                  bgcolor: selected ? alpha(brand.blue, 0.12) : "action.hover",
                  transition: "all .15s ease",
                }}
              >
                {p.label}
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0,1fr))",
              md: "repeat(3, minmax(0,1fr))",
            },
          }}
        >
          <TextField
            label="Date From"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPreset("custom");
            }}
          />
          <TextField
            label="Date To"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPreset("custom");
            }}
          />
          <TextField
            select
            label="Branch"
            size="small"
            fullWidth
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
          >
            <MenuItem value="">All Branches</MenuItem>
            {branches?.items.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.branchName}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* ---------- tabs ---------- */}
      <Tabs
        value={tab}
        onChange={(_, v: TabId) => setTab(v)}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          mb: 2.5,
          minHeight: 44,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTabs-indicator": { height: 3, borderRadius: 3 },
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 700,
            minHeight: 44,
          },
        }}
      >
        <Tab
          value="overview"
          icon={<InsightsRoundedIcon fontSize="small" />}
          iconPosition="start"
          label="Overview"
        />
        <Tab
          value="pnl"
          icon={<RequestQuoteRoundedIcon fontSize="small" />}
          iconPosition="start"
          label="P&L Statement"
        />
        <Tab
          value="ledger"
          icon={<ReceiptLongRoundedIcon fontSize="small" />}
          iconPosition="start"
          label="Ledger"
        />
      </Tabs>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === "ledger" ? (
            <LedgerTable
              key={`${branchId}|${dateFrom}|${dateTo}`}
              branchId={branchId || undefined}
              dateFrom={dateFrom || undefined}
              dateTo={dateTo || undefined}
              onEdit={openEdit}
            />
          ) : isLoading ? (
            <OverviewSkeleton />
          ) : isError ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            >
              Could not load the ledger analytics.
            </Alert>
          ) : data ? (
            isEmpty ? (
              emptyState
            ) : tab === "overview" ? (
              <Box
                sx={{
                  opacity: isFetching ? 0.65 : 1,
                  transition: "opacity .2s",
                }}
              >
                <LedgerKpiCards
                  current={data.current}
                  previous={data.previous}
                  series={data.series}
                  granularity={data.granularity}
                />
                <LedgerInsights
                  current={data.current}
                  series={data.series}
                  granularity={data.granularity}
                />

                <Box sx={{ mb: 2 }}>
                  <LedgerTrendChart
                    series={data.series}
                    granularity={granularity}
                    appliedGranularity={data.granularity}
                    onGranularityChange={setGranularity}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    mb: 2,
                    gridTemplateColumns: {
                      xs: "minmax(0,1fr)",
                      md: "repeat(2, minmax(0,1fr))",
                    },
                  }}
                >
                  <PnlWaterfall totals={data.current} delay={0.15} />
                  <OutflowDonut totals={data.current} delay={0.2} />
                </Box>

                {data.branches.length > 0 && (
                  <BranchPerformance branches={data.branches} delay={0.25} />
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  opacity: isFetching ? 0.65 : 1,
                  transition: "opacity .2s",
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "minmax(0,1fr)",
                    lg: "minmax(0,3fr) minmax(0,2fr)",
                  },
                  alignItems: "start",
                }}
              >
                <PnlStatement
                  current={data.current}
                  previous={data.previous}
                  periodLabel={periodLabel}
                  previousLabel={previousLabel}
                />
                <PnlWaterfall totals={data.current} delay={0.12} />
              </Box>
            )
          ) : null}
        </motion.div>
      </AnimatePresence>

      <LedgerEntryDialog
        open={dialogOpen}
        entry={editing}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}

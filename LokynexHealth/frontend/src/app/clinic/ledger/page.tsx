"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import {
  ConfirmDialog,
  EmptyState,
  useToast,
} from "@/components/clinic/clinic-ui";
import { ClinicLedgerEntryDialog } from "@/components/clinic/ledger/clinic-ledger-entry-dialog";
import {
  OutflowDonut,
  PnlWaterfall,
} from "@/components/ledger/ledger-breakdown-charts";
import {
  LedgerInsights,
  LedgerKpiCards,
} from "@/components/ledger/ledger-kpi-cards";
import { LedgerTrendChart } from "@/components/ledger/ledger-trend-chart";
import { PnlStatement } from "@/components/ledger/pnl-statement";
import {
  useClinicLedgerAnalytics,
  useClinicLedgerEntries,
  useClinicLedgerMutations,
  useClinicMe,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import {
  formatDisplayDate,
  formatINR,
  getPresetRange,
  PRESETS,
  typeMeta,
  type PresetId,
} from "@/lib/ledger-utils";
import type { ClinicLedgerEntry } from "@/types/clinic";
import type { GranularityChoice } from "@/types/ledger";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function ClinicLedgerPage() {
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const { remove } = useClinicLedgerMutations();
  const [preset, setPreset] = useState<PresetId>("thisMonth");
  const [range, setRange] = useState(() => getPresetRange("thisMonth"));
  const [gran, setGran] = useState<GranularityChoice>("auto");
  const [tab, setTab] = useState<"overview" | "pnl" | "entries">("overview");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ClinicLedgerEntry | "new" | null>(
    null,
  );
  const [del, setDel] = useState<ClinicLedgerEntry | null>(null);
  const sq = useDebounce(search.trim(), 300);

  const filters = {
    dateFrom: range.dateFrom || undefined,
    dateTo: range.dateTo || undefined,
  };
  const { data, isLoading } = useClinicLedgerAnalytics({
    ...filters,
    granularity: gran,
  });
  const { data: entries } = useClinicLedgerEntries({
    ...filters,
    entryType: type || undefined,
    search: sq || undefined,
    pageNumber: page,
    pageSize: 20,
  });
  const canCreate = canDo(me?.permissions, me?.isAdmin, "ledger", "create");
  const canEdit = canDo(me?.permissions, me?.isAdmin, "ledger", "edit");
  const canDelete = canDo(me?.permissions, me?.isAdmin, "ledger", "delete");

  const apply = (id: PresetId) => {
    setPreset(id);
    setRange(getPresetRange(id));
    setPage(1);
  };
  const label = data
    ? `${formatDisplayDate(data.dateFrom)} – ${formatDisplayDate(data.dateTo)}`
    : "";
  const prevLabel = data
    ? `${formatDisplayDate(data.previousFrom)} – ${formatDisplayDate(data.previousTo)}`
    : "";

  const rowActions = (e: ClinicLedgerEntry) =>
    e.source !== "Manual" ? (
      <Chip size="small" variant="outlined" label="Auto" />
    ) : (
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        {canEdit && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditing(e)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDel(e)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );

  const amountCell = (e: ClinicLedgerEntry) => {
    const m = typeMeta(e.entryType);
    return (
      <Typography component="span" sx={{ fontWeight: 800, color: m.color }}>
        {e.entryType === "Income" ? "+" : "−"}
        {formatINR(e.amount)}
      </Typography>
    );
  };

  return (
    <>
      <PageTitle
        title="Ledger & P&L"
        subtitle={label}
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setEditing("new")}
            >
              Record entry
            </Button>
          )
        }
      />

      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 4, mb: 2 }}>
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
          {PRESETS.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              clickable
              color={preset === p.id ? "primary" : "default"}
              variant={preset === p.id ? "filled" : "outlined"}
              onClick={() => apply(p.id)}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "1fr 1fr",
            mt: 1,
            maxWidth: 440,
          }}
        >
          <TextField
            size="small"
            type="date"
            label="From"
            value={range.dateFrom}
            onChange={(e) => {
              setPreset("all");
              setRange((r) => ({ ...r, dateFrom: e.target.value }));
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={range.dateTo}
            onChange={(e) => {
              setPreset("all");
              setRange((r) => ({ ...r, dateTo: e.target.value }));
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </Paper>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
        variant="scrollable"
      >
        <Tab value="overview" label="Overview" />
        <Tab value="pnl" label="P&L statement" />
        <Tab value="entries" label="Entries" />
      </Tabs>

      {isLoading || !data ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : tab === "overview" ? (
        data.current.entryCount === 0 ? (
          <EmptyState text="No entries in this range. Visit fees are added automatically when you book appointments; record other income and expenses with “Record entry”." />
        ) : (
          <Box sx={{ display: "grid", gap: 2 }}>
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
            <LedgerTrendChart
              series={data.series}
              granularity={gran}
              appliedGranularity={data.granularity}
              onGranularityChange={setGran}
            />
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
              }}
            >
              <PnlWaterfall totals={data.current} />
              <OutflowDonut totals={data.current} />
            </Box>
          </Box>
        )
      ) : tab === "pnl" ? (
        <PnlStatement
          current={data.current}
          previous={data.previous}
          periodLabel={label}
          previousLabel={prevLabel}
        />
      ) : (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 2fr" },
            }}
          >
            <TextField
              select
              size="small"
              label="Type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Income">Income</MenuItem>
              <MenuItem value="Expense">Expense</MenuItem>
              <MenuItem value="Refund">Refund</MenuItem>
            </TextField>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {entries && (
                <Typography variant="caption" color="text.secondary">
                  In {formatINR(entries.filteredIn)} · Out{" "}
                  {formatINR(entries.filteredOut)} · Net{" "}
                  {formatINR(entries.filteredNet)}
                </Typography>
              )}
            </Box>
            <TextField
              size="small"
              label="Search category / description / ref"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
            />
          </Box>
          {!entries?.items.length ? (
            <EmptyState text="No entries match." />
          ) : (
            <>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 4, display: { xs: "none", md: "block" } }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.items.map((e) => (
                      <TableRow key={e.id} hover>
                        <TableCell>
                          {formatDisplayDate(e.entryDate.slice(0, 10))}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={e.entryType}
                            sx={{ color: typeMeta(e.entryType).color }}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{e.category || "—"}</TableCell>
                        <TableCell sx={{ maxWidth: 280 }}>
                          <Typography variant="body2" noWrap>
                            {e.description || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>{e.paymentMethod || "—"}</TableCell>
                        <TableCell align="right">{amountCell(e)}</TableCell>
                        <TableCell align="right">{rowActions(e)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1 }}>
                {entries.items.map((e) => (
                  <Paper
                    key={e.id}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 3 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} noWrap>
                          {e.category || e.entryType}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ display: "block" }}
                        >
                          {formatDisplayDate(e.entryDate.slice(0, 10))} ·{" "}
                          {e.paymentMethod || "—"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>{amountCell(e)}</Box>
                    </Box>
                    {e.description && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {e.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 0.5 }}>{rowActions(e)}</Box>
                  </Paper>
                ))}
              </Box>
              {entries.totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Pagination
                    count={entries.totalPages}
                    page={page}
                    onChange={(_, v) => setPage(v)}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {editing && (
        <ClinicLedgerEntryDialog
          key={editing === "new" ? "new" : editing.id}
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!del}
        title="Delete entry?"
        danger
        confirmLabel="Delete"
        busy={remove.isPending}
        text={
          del
            ? `${del.entryType} of ${formatINR(del.amount)} will be removed.`
            : ""
        }
        onClose={() => setDel(null)}
        onConfirm={() =>
          del &&
          remove.mutate(del.id, {
            onSuccess: () => {
              setDel(null);
              toast("Entry deleted");
            },
            onError: (e) => {
              setDel(null);
              toast(getApiErrorMessage(e), "error");
            },
          })
        }
      />
      {toastNode}
    </>
  );
}

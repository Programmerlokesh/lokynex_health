"use client";

import { AnimatedNumber } from "@/components/ledger/animated-number";
import { ChartCard } from "@/components/ledger/chart-utils";
import {
  DonutChart,
  LabBars,
  TrendChart,
} from "@/components/owner-ledger/owner-ledger-charts";
import { OwnerLedgerEntries } from "@/components/owner-ledger/owner-ledger-entries";
import { useOwnerLedgerAnalytics } from "@/hooks/use-owners";
import { formatMoney } from "@/lib/format";
import {
  bestAndWorst,
  bucketLabel,
  marginPct,
  netRevenue,
  pctChange,
  PresetKey,
  presetRange,
  PRESETS,
  totalExpenses,
} from "@/lib/owner-ledger-utils";
import { OwnerLedgerAnalytics } from "@/types/owner";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const GREEN = "#16A34A";
const RED = "#DC2626";
const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ---------- KPI card ----------
function Kpi({
  title,
  value,
  prev,
  accent,
  invert = false,
  sub,
}: {
  title: string;
  value: number;
  prev: number;
  accent: string;
  invert?: boolean;
  sub?: string;
}) {
  const change = pctChange(value, prev);
  const up = (change ?? 0) >= 0;
  const good = invert ? !up : up;
  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderTop: `3px solid ${accent}`,
        minWidth: 0,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: { xs: 18, sm: 22 },
          color: accent,
          lineHeight: 1.3,
        }}
        noWrap
      >
        <AnimatedNumber value={value} format={formatMoney} />
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexWrap: "wrap",
          mt: 0.25,
        }}
      >
        {change === null ? (
          <Chip size="small" label="New" />
        ) : (
          <Chip
            size="small"
            icon={up ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            label={`${Math.abs(change).toFixed(1)}%`}
            sx={{
              bgcolor: `${good ? GREEN : RED}1f`,
              color: good ? GREEN : RED,
              fontWeight: 700,
              "& .MuiChip-icon": { color: "inherit", fontSize: 14 },
            }}
          />
        )}
        <Typography variant="caption" color="text.secondary">
          {sub ?? "vs previous period"}
        </Typography>
      </Box>
    </Paper>
  );
}

// ---------- P&L statement ----------
type PnlRow = {
  label: string;
  cur: number;
  prev: number;
  kind: "head" | "line" | "sub" | "total";
  invert?: boolean;
};

function buildPnl(a: OwnerLedgerAnalytics): PnlRow[] {
  const rows: PnlRow[] = [];
  const cats = (type: string) =>
    a.categories.filter((c) => c.entryType === type);
  const line = (type: string, invert = false) =>
    cats(type).forEach((c) =>
      rows.push({
        label: c.category,
        cur: c.total,
        prev: c.previousTotal,
        kind: "line",
        invert,
      }),
    );
  const { current: c, previous: p } = a;

  rows.push({ label: "Revenue", cur: 0, prev: 0, kind: "head" });
  line("Income");
  rows.push({
    label: "Gross revenue",
    cur: c.income,
    prev: p.income,
    kind: "sub",
  });
  line("Refund", true);
  rows.push({
    label: "Less: refunds",
    cur: -c.refund,
    prev: -p.refund,
    kind: "sub",
    invert: true,
  });
  rows.push({
    label: "Net revenue",
    cur: netRevenue(c),
    prev: netRevenue(p),
    kind: "total",
  });

  rows.push({ label: "Expenses", cur: 0, prev: 0, kind: "head" });
  line("Expense", true);
  line("CommissionPayout", true);
  rows.push({
    label: "Total expenses",
    cur: totalExpenses(c),
    prev: totalExpenses(p),
    kind: "sub",
    invert: true,
  });
  rows.push({
    label: c.net >= 0 ? "Net profit" : "Net loss",
    cur: c.net,
    prev: p.net,
    kind: "total",
  });
  return rows;
}

function PnlStatement({ a }: { a: OwnerLedgerAnalytics }) {
  const rows = useMemo(() => buildPnl(a), [a]);
  const margin = marginPct(a.current);
  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 340 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 700 }}>Particulars</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              This period
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Previous
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 700,
                display: { xs: "none", sm: "table-cell" },
              }}
            >
              Change
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => {
            if (r.kind === "head") {
              return (
                <TableRow key={i}>
                  <TableCell
                    colSpan={4}
                    sx={{
                      fontWeight: 800,
                      pt: 2,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      fontSize: 12,
                      letterSpacing: 0.6,
                    }}
                  >
                    {r.label}
                  </TableCell>
                </TableRow>
              );
            }
            const ch = pctChange(r.cur, r.prev);
            const strong = r.kind !== "line";
            const color =
              r.kind === "total" ? (r.cur >= 0 ? GREEN : RED) : undefined;
            return (
              <TableRow
                key={i}
                sx={
                  r.kind === "total" ? { bgcolor: "action.hover" } : undefined
                }
              >
                <TableCell
                  sx={{
                    pl: r.kind === "line" ? 3 : 2,
                    fontWeight: strong ? 700 : 400,
                  }}
                >
                  {r.label}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: strong ? 700 : 400,
                    color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatMoney(r.cur)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
                >
                  {formatMoney(r.prev)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: "none", sm: "table-cell" },
                    color:
                      ch === null
                        ? "text.secondary"
                        : ch >= 0 !== !!r.invert
                          ? GREEN
                          : RED,
                  }}
                >
                  {ch === null ? "—" : `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell sx={{ pl: 2, color: "text.secondary" }}>
              Profit margin
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              {margin === null ? "—" : `${margin.toFixed(1)}%`}
            </TableCell>
            <TableCell align="right" sx={{ color: "text.secondary" }}>
              {marginPct(a.previous) === null
                ? "—"
                : `${marginPct(a.previous)!.toFixed(1)}%`}
            </TableCell>
            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }} />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ---------- tables ----------
const scrollTable = { minWidth: 460 } as const;

function LabTable({ a }: { a: OwnerLedgerAnalytics }) {
  const total = a.labs.reduce((s, l) => s + l.income, 0) || 1;
  if (a.labs.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        No lab activity in this period.
      </Typography>
    );
  return (
    <TableContainer>
      <Table size="small" sx={scrollTable}>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            {["Lab", "Sales", "Income", "Outflow", "Net", "Share"].map(
              (h, i) => (
                <TableCell
                  key={h}
                  align={i === 0 ? "left" : "right"}
                  sx={{ fontWeight: 700 }}
                >
                  {h}
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {a.labs.map((l) => (
            <TableRow key={l.tenantId ?? "general"} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {l.labName}
                </Typography>
                {l.labCode && (
                  <Typography variant="caption" color="text.secondary">
                    {l.labCode}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">{l.subscriptionCount}</TableCell>
              <TableCell align="right">{formatMoney(l.income)}</TableCell>
              <TableCell align="right">{formatMoney(l.outflow)}</TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, color: l.net >= 0 ? GREEN : RED }}
              >
                {formatMoney(l.net)}
              </TableCell>
              <TableCell align="right">
                {((l.income / total) * 100).toFixed(0)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function PeriodTable({ a }: { a: OwnerLedgerAnalytics }) {
  const rows = [...a.series]
    .reverse()
    .filter((p) => p.income || p.refund || p.expense || p.commissionPayout);
  if (rows.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        No activity.
      </Typography>
    );
  return (
    <TableContainer sx={{ maxHeight: 360 }}>
      <Table size="small" stickyHeader sx={scrollTable}>
        <TableHead>
          <TableRow>
            {["Period", "Income", "Outflow", "Net", "Cumulative"].map(
              (h, i) => (
                <TableCell
                  key={h}
                  align={i === 0 ? "left" : "right"}
                  sx={{ fontWeight: 700 }}
                >
                  {h}
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.bucket} hover>
              <TableCell>{bucketLabel(p.bucket, a.granularity)}</TableCell>
              <TableCell align="right">{formatMoney(p.income)}</TableCell>
              <TableCell align="right">
                {formatMoney(p.refund + p.commissionPayout + p.expense)}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, color: p.net >= 0 ? GREEN : RED }}
              >
                {formatMoney(p.net)}
              </TableCell>
              <TableCell align="right">
                {formatMoney(p.cumulativeNet)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ---------- the page body ----------
export function OwnerLedgerView({
  ownerId,
  ownerName,
  readOnly = false,
}: {
  /** undefined = the signed-in Owner's own ledger; set = SuperAdmin viewing that owner. */
  ownerId?: string;
  ownerName?: string;
  readOnly?: boolean;
}) {
  const [preset, setPreset] = useState<PresetKey>("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [tenantId, setTenantId] = useState("");

  const range = preset === "custom" ? custom : presetRange(preset);
  const filters = useMemo(
    () => ({
      dateFrom: range.from || undefined,
      dateTo: range.to || undefined,
      tenantId: tenantId || undefined,
    }),
    [range.from, range.to, tenantId],
  );
  const {
    data: a,
    isLoading,
    isError,
  } = useOwnerLedgerAnalytics(ownerId, filters);

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (isError || !a)
    return (
      <Alert severity="error">
        Could not load the ledger. Please try again.
      </Alert>
    );

  const { current: c, previous: p } = a;
  const { best, worst } = bestAndWorst(a.series);
  const labsWithIncome = a.labs.filter(
    (l) => l.tenantId && l.income > 0,
  ).length;
  const expenseMix = a.categories
    .filter(
      (x) => x.entryType === "Expense" || x.entryType === "CommissionPayout",
    )
    .map((x) => ({ label: x.category, value: x.total }))
    .sort((x, y) => y.value - x.value);

  const stats: [string, string][] = [
    ["Labs added", `${a.labsAddedInPeriod} (of ${a.totalLabs})`],
    [
      "Subscription sales",
      `${a.subscriptionCount} · ₹${formatMoney(a.subscriptionRevenue)}`,
    ],
    [
      "Avg revenue / lab",
      labsWithIncome ? `₹${formatMoney(c.income / labsWithIncome)}` : "—",
    ],
    [
      "Expense ratio",
      netRevenue(c) > 0
        ? `${((totalExpenses(c) / netRevenue(c)) * 100).toFixed(1)}%`
        : "—",
    ],
    [
      "Best period",
      best
        ? `${bucketLabel(best.bucket, a.granularity)} · ₹${formatMoney(best.net)}`
        : "—",
    ],
    [
      "Weakest period",
      worst
        ? `${bucketLabel(worst.bucket, a.granularity)} · ₹${formatMoney(worst.net)}`
        : "—",
    ],
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {readOnly && (
        <Alert severity="info" className="no-print">
          Viewing {ownerName ?? "this owner"}’s ledger — read only.
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }} className="no-print">
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            overflowX: "auto",
            pb: 1,
            scrollbarWidth: "none",
          }}
        >
          {PRESETS.map((x) => (
            <Chip
              key={x.key}
              label={x.label}
              clickable
              size="small"
              color={preset === x.key ? "primary" : "default"}
              variant={preset === x.key ? "filled" : "outlined"}
              onClick={() => setPreset(x.key)}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr) auto" },
            gap: 1.25,
            alignItems: "center",
          }}
        >
          {preset === "custom" && (
            <>
              <TextField
                size="small"
                type="date"
                label="From"
                value={custom.from}
                onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={custom.to}
                onChange={(e) => setCustom({ ...custom, to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}
          <TextField
            select
            size="small"
            label="Lab"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
          >
            <MenuItem value="">All labs</MenuItem>
            {a.labOptions.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.name} ({l.code})
              </MenuItem>
            ))}
          </TextField>
          <Box
            sx={{
              gridColumn: { xs: "1 / -1", md: "auto" },
              justifySelf: { md: "end" },
            }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Box>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          {fmtDate(a.dateFrom)} – {fmtDate(a.dateTo)} · compared with{" "}
          {fmtDate(a.previousFrom)} – {fmtDate(a.previousTo)}
        </Typography>
      </Paper>

      {/* KPIs */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" },
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        <Kpi
          title="Net revenue"
          value={netRevenue(c)}
          prev={netRevenue(p)}
          accent="#4F8BFF"
        />
        <Kpi
          title="Total expenses"
          value={totalExpenses(c)}
          prev={totalExpenses(p)}
          accent="#F59E0B"
          invert
        />
        <Kpi
          title={c.net >= 0 ? "Net profit" : "Net loss"}
          value={c.net}
          prev={p.net}
          accent={c.net >= 0 ? GREEN : RED}
        />
        <Kpi
          title="Subscription sales"
          value={a.subscriptionRevenue}
          prev={0}
          accent="#7C3AED"
          sub={`${a.subscriptionCount} sold`}
        />
      </Box>

      {/* Quick stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "repeat(3, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          gap: 1,
        }}
      >
        {stats.map(([k, v]) => (
          <Paper key={k} sx={{ p: 1.25, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {k}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700 }}
              noWrap
              title={v}
            >
              {v}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Charts */}
      <ChartCard
        title="Income vs outflow"
        subtitle={`By ${a.granularity} · tap a bar for details`}
      >
        <TrendChart series={a.series} granularity={a.granularity} />
      </ChartCard>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <ChartCard
          title="Where the money goes"
          subtitle="Expense & commission mix"
          delay={0.05}
        >
          <DonutChart data={expenseMix} centerLabel="Outflow" />
        </ChartCard>
        <ChartCard
          title="Top labs by income"
          subtitle="Net profit on the right"
          delay={0.1}
        >
          <LabBars rows={a.labs} />
        </ChartCard>
      </Box>

      {/* P&L + breakdown tables */}
      <ChartCard
        title="Profit & Loss statement"
        subtitle="Current period vs previous period"
      >
        <PnlStatement a={a} />
      </ChartCard>
      <ChartCard
        title="Lab-wise profit"
        subtitle="Income earned from each lab you onboarded"
      >
        <LabTable a={a} />
      </ChartCard>
      <Accordion
        disableGutters
        sx={{ borderRadius: 3, "&:before": { display: "none" } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Period-wise summary</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PeriodTable a={a} />
        </AccordionDetails>
      </Accordion>

      <OwnerLedgerEntries
        ownerId={ownerId}
        readOnly={readOnly}
        filters={filters}
        labOptions={a.labOptions}
      />
    </Box>
  );
}

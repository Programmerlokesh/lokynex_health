"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import {
  bucketLabel,
  compactINR,
  computeInsights,
  formatINR,
  GRANULARITY_WORD,
  pctChange,
  totalOutflow,
} from "@/lib/ledger-utils";
import type {
  Granularity,
  LedgerPeriodTotals,
  LedgerSeriesPoint,
} from "@/types/ledger";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import SouthWestRoundedIcon from "@mui/icons-material/SouthWestRounded";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { AnimatedNumber } from "./animated-number";
import { useSvgId } from "./chart-utils";

/* ---------- tiny pieces ---------- */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const id = useSvgId();
  if (values.length < 2) return null;
  const W = 120;
  const H = 38;
  const P = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    P + (i / (values.length - 1)) * (W - 2 * P),
    H - P - ((v - min) / span) * (H - 2 * P),
  ]);
  const line = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}g)`} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
}

function DeltaChip({
  value,
  goodWhenUp = true,
  suffix = "%",
  onDark = false,
}: {
  value: number | null;
  goodWhenUp?: boolean;
  suffix?: string;
  onDark?: boolean;
}) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  const good = up === goodWhenUp;
  const color = onDark
    ? good
      ? "#6EE7B7"
      : "#FCA5A5"
    : good
      ? "#16A34A"
      : "#DC2626";
  const Icon = up ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        px: 0.75,
        py: 0.25,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
        color,
        bgcolor: alpha(color, 0.15),
      }}
    >
      <Icon sx={{ fontSize: 14 }} />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </Box>
  );
}

function StatCard({
  label,
  icon,
  accent,
  value,
  format,
  delta,
  deltaSuffix,
  goodWhenUp = true,
  spark,
  footer,
  delay,
}: {
  label: string;
  icon: ReactNode;
  accent: string;
  value: number;
  format: (n: number) => string;
  delta?: number | null;
  deltaSuffix?: string;
  goodWhenUp?: boolean;
  spark?: number[];
  footer?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.4, delay }}
      style={{ minWidth: 0 }}
    >
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          height: "100%",
          borderTop: `3px solid ${accent}`,
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: alpha(accent, 0.14),
              "& svg": { fontSize: 18 },
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
        </Box>
        <Typography
          sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 }, lineHeight: 1.15 }}
        >
          <AnimatedNumber value={value} format={format} />
        </Typography>
        <Box sx={{ mt: 0.75, minHeight: 22, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <DeltaChip value={delta ?? null} goodWhenUp={goodWhenUp} suffix={deltaSuffix} />
          {footer && (
            <Typography variant="caption" color="text.secondary">
              {footer}
            </Typography>
          )}
        </Box>
        {spark && spark.length > 1 && (
          <Box sx={{ mt: 1, mx: -0.5 }}>
            <Sparkline values={spark} color={accent} />
          </Box>
        )}
      </Paper>
    </motion.div>
  );
}

/* ---------- main ---------- */
export function LedgerKpiCards({
  current,
  previous,
  series,
  granularity,
}: {
  current: LedgerPeriodTotals;
  previous: LedgerPeriodTotals;
  series: LedgerSeriesPoint[];
  granularity: Granularity;
}) {
  const hasPrev = previous.entryCount > 0;
  const outflow = totalOutflow(current);
  const prevOutflow = totalOutflow(previous);
  const margin = current.income > 0 ? (current.net / current.income) * 100 : 0;
  const prevMargin = previous.income > 0 ? (previous.net / previous.income) * 100 : null;
  const marginDelta = hasPrev && prevMargin !== null ? margin - prevMargin : null;
  const avg = series.length ? current.net / series.length : 0;
  const profit = current.net >= 0;

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 1.25, sm: 2 },
        mb: 2,
        gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", lg: "repeat(6, minmax(0,1fr))" },
      }}
    >
      {/* Hero: Net profit */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ gridColumn: "span 2", minWidth: 0 }}
      >
        <Paper
          sx={{
            p: { xs: 2, sm: 2.5 },
            height: "100%",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            border: "none",
            background: `linear-gradient(135deg, ${brand.navy} 0%, ${brand.blue} 62%, ${brand.electricBlue} 100%)`,
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.10)",
            }}
          />
          <Box sx={{ position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <AccountBalanceWalletRoundedIcon sx={{ fontSize: 20, opacity: 0.85 }} />
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>
                {profit ? "Net profit" : "Net loss"}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: 28, sm: 34 },
                lineHeight: 1.1,
                color: profit ? "#fff" : "#FECACA",
              }}
            >
              <AnimatedNumber value={current.net} format={(n) => formatINR(n)} duration={1.1} />
            </Typography>
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <DeltaChip value={hasPrev ? pctChange(current.net, previous.net) : null} onDark />
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {hasPrev ? "vs previous period" : `${current.entryCount} entries`}
              </Typography>
            </Box>
            <Box sx={{ mt: 1.5, mx: -0.5 }}>
              <Sparkline values={series.map((p) => p.cumulativeNet)} color="#FFFFFF" />
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <StatCard
        delay={0.08}
        label="Income"
        accent={brand.teal}
        icon={<SouthWestRoundedIcon />}
        value={current.income}
        format={(n) => formatINR(n)}
        delta={hasPrev ? pctChange(current.income, previous.income) : null}
        spark={series.map((p) => p.income)}
      />
      <StatCard
        delay={0.14}
        label="Total outflow"
        accent="#EF4444"
        icon={<NorthEastRoundedIcon />}
        value={outflow}
        format={(n) => formatINR(n)}
        delta={hasPrev ? pctChange(outflow, prevOutflow) : null}
        goodWhenUp={false}
        spark={series.map((p) => p.refund + p.commissionPayout + p.expense)}
      />
      <StatCard
        delay={0.2}
        label="Net margin"
        accent={brand.purple}
        icon={<PercentRoundedIcon />}
        value={margin}
        format={(n) => `${n.toFixed(1)}%`}
        delta={marginDelta}
        deltaSuffix=" pts"
        footer={current.income > 0 ? "of income" : "no income yet"}
      />
      <StatCard
        delay={0.26}
        label={`Avg net / ${GRANULARITY_WORD[granularity]}`}
        accent={brand.electricBlue}
        icon={<ShowChartRoundedIcon />}
        value={avg}
        format={(n) => compactINR(n)}
        footer={`${series.length} ${GRANULARITY_WORD[granularity]}${series.length === 1 ? "" : "s"}`}
      />
    </Box>
  );
}

/* ---------- insights strip ---------- */
function InsightTile({
  label,
  value,
  sub,
  color,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{ minWidth: 0 }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          borderLeft: `4px solid ${color}`,
          height: "100%",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color, lineHeight: 1.25 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
          {sub}
        </Typography>
      </Box>
    </motion.div>
  );
}

export function LedgerInsights({
  current,
  series,
  granularity,
}: {
  current: LedgerPeriodTotals;
  series: LedgerSeriesPoint[];
  granularity: Granularity;
}) {
  const ins = computeInsights(series, current);
  const word = GRANULARITY_WORD[granularity];
  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 1.25, sm: 2 },
        mb: 2.5,
        gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))" },
      }}
    >
      <InsightTile
        delay={0.3}
        label={`Best ${word}`}
        color="#16A34A"
        value={ins.best ? compactINR(ins.best.net) : "—"}
        sub={ins.best ? bucketLabel(ins.best.bucket, granularity, true) : "No activity"}
      />
      <InsightTile
        delay={0.34}
        label={`Weakest ${word}`}
        color="#DC2626"
        value={ins.worst ? compactINR(ins.worst.net) : "—"}
        sub={ins.worst ? bucketLabel(ins.worst.bucket, granularity, true) : "No activity"}
      />
      <InsightTile
        delay={0.38}
        label="Profitable periods"
        color={brand.blue}
        value={`${ins.profitable} / ${ins.activeCount}`}
        sub={`${word}s in profit`}
      />
      <InsightTile
        delay={0.42}
        label="Spend ratio"
        color={brand.orange}
        value={ins.outflowPer100 === null ? "—" : `₹${ins.outflowPer100.toFixed(0)}`}
        sub="spent per ₹100 earned"
      />
    </Box>
  );
}
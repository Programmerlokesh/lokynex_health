"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import { compactINR, formatINR, TYPE_META } from "@/lib/ledger-utils";
import type { LedgerBranchBreakdown, LedgerPeriodTotals } from "@/types/ledger";
import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "./animated-number";
import { ChartCard, niceScale, useContainerWidth } from "./chart-utils";

/* =====================  DONUT: where the money goes  ===================== */
export function OutflowDonut({
  totals,
  delay = 0,
}: {
  totals: LedgerPeriodTotals;
  delay?: number;
}) {
  const theme = useTheme();
  const [active, setActive] = useState<string | null>(null);

  const segs = [
    {
      key: "CommissionPayout",
      label: "Commission payouts",
      value: totals.commissionPayout,
      color: TYPE_META.CommissionPayout.color,
    },
    {
      key: "Expense",
      label: "Expenses",
      value: totals.expense,
      color: TYPE_META.Expense.color,
    },
    {
      key: "Refund",
      label: "Refunds",
      value: totals.refund,
      color: TYPE_META.Refund.color,
    },
  ].filter((s) => s.value > 0);
  const total = segs.reduce((s, x) => s + x.value, 0);

  const SIZE = 184;
  const STROKE = 24;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const GAP = segs.length > 1 ? 3 : 0;
  let acc = 0;

  return (
    <ChartCard
      title="Where the money goes"
      subtitle="Outflow breakdown"
      delay={delay}
    >
      {total === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 6, textAlign: "center" }}
        >
          No outflows in this period.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row", md: "column", xl: "row" },
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: SIZE,
              height: SIZE,
              flexShrink: 0,
            }}
          >
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label="Outflow breakdown"
            >
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={theme.palette.divider}
                strokeWidth={STROKE}
              />
              <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                {segs.map((s, i) => {
                  const len = (s.value / total) * C;
                  const dash = Math.max(len - GAP, 0);
                  const offset = acc;
                  acc += len;
                  return (
                    <motion.circle
                      key={s.key}
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={active === s.key ? STROKE + 6 : STROKE}
                      strokeDashoffset={-offset}
                      initial={{ strokeDasharray: `0 ${C}` }}
                      animate={{ strokeDasharray: `${dash} ${C - dash}` }}
                      transition={{
                        duration: 0.9,
                        delay: 0.15 + i * 0.15,
                        ease: "easeOut",
                      }}
                      style={{
                        cursor: "pointer",
                        transition: "stroke-width .2s",
                      }}
                      onMouseEnter={() => setActive(s.key)}
                      onMouseLeave={() => setActive(null)}
                      onClick={() =>
                        setActive((a) => (a === s.key ? null : s.key))
                      }
                    />
                  );
                })}
              </g>
            </svg>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Total outflow
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 22 }}>
                <AnimatedNumber value={total} format={compactINR} />
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            {segs.map((s) => (
              <Box
                key={s.key}
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  borderRadius: 2,
                  bgcolor:
                    active === s.key ? alpha(s.color, 0.12) : "transparent",
                  transition: "background-color .2s",
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: s.color,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ flex: 1, minWidth: 0 }}
                  noWrap
                >
                  {s.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatINR(s.value)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ width: 40, textAlign: "right" }}
                >
                  {((s.value / total) * 100).toFixed(0)}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </ChartCard>
  );
}

/* =====================  WATERFALL: income → net profit  ===================== */
type Bar = {
  label: string;
  from: number;
  to: number;
  color: string;
  text: string;
};

export function PnlWaterfall({
  totals,
  delay = 0,
}: {
  totals: LedgerPeriodTotals;
  delay?: number;
}) {
  const theme = useTheme();
  const [ref, width] = useContainerWidth<HTMLDivElement>();
  const compact = width > 0 && width < 420;
  const height = compact ? 250 : 280;
  const M = { top: 24, right: 8, bottom: 30, left: compact ? 44 : 54 };

  const bars = useMemo<Bar[]>(() => {
    const inc = totals.income;
    const l1 = inc - totals.refund;
    const l2 = l1 - totals.commissionPayout;
    const l3 = l2 - totals.expense;
    return [
      {
        label: "Income",
        from: 0,
        to: inc,
        color: TYPE_META.Income.color,
        text: compactINR(inc),
      },
      {
        label: "Refunds",
        from: inc,
        to: l1,
        color: TYPE_META.Refund.color,
        text: `−${compactINR(totals.refund)}`,
      },
      {
        label: compact ? "Payouts" : "Commission",
        from: l1,
        to: l2,
        color: TYPE_META.CommissionPayout.color,
        text: `−${compactINR(totals.commissionPayout)}`,
      },
      {
        label: "Expenses",
        from: l2,
        to: l3,
        color: TYPE_META.Expense.color,
        text: `−${compactINR(totals.expense)}`,
      },
      {
        label: totals.net >= 0 ? "Profit" : "Loss",
        from: 0,
        to: totals.net,
        color: totals.net >= 0 ? "#16A34A" : "#DC2626",
        text: compactINR(totals.net),
      },
    ];
  }, [totals, compact]);

  const levels = bars.flatMap((b) => [b.from, b.to]);
  const scale = niceScale(Math.min(...levels), Math.max(...levels));
  const innerW = Math.max(width - M.left - M.right, 10);
  const innerH = height - M.top - M.bottom;
  const band = innerW / bars.length;
  const bw = Math.min(band * 0.62, 58);
  const y = (v: number) =>
    M.top + innerH - ((v - scale.lo) / (scale.hi - scale.lo)) * innerH;
  const cx = (i: number) => M.left + band * (i + 0.5);

  return (
    <ChartCard
      title="Profit waterfall"
      subtitle="From income to what you keep"
      delay={delay}
    >
      <Box ref={ref} sx={{ width: "100%", height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Profit and loss waterfall"
          >
            {scale.ticks.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={width - M.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={theme.palette.divider}
                  strokeWidth={t === 0 ? 1.5 : 1}
                  strokeDasharray={t === 0 ? undefined : "3 4"}
                />
                <text
                  x={M.left - 8}
                  y={y(t) + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={theme.palette.text.secondary}
                >
                  {compactINR(t)}
                </text>
              </g>
            ))}

            {bars.map((b, i) => {
              const top = y(Math.max(b.from, b.to));
              const bottom = y(Math.min(b.from, b.to));
              const h = Math.max(bottom - top, 2);
              const rising = b.to >= b.from;
              return (
                <g key={b.label}>
                  {i < bars.length - 1 && (
                    <line
                      x1={cx(i) + bw / 2}
                      x2={cx(i + 1) - bw / 2}
                      y1={y(b.to)}
                      y2={y(b.to)}
                      stroke={theme.palette.text.secondary}
                      strokeOpacity={0.5}
                      strokeDasharray="3 3"
                    />
                  )}
                  <motion.rect
                    x={cx(i) - bw / 2}
                    width={bw}
                    rx={5}
                    fill={b.color}
                    initial={{ y: rising ? bottom : top, height: 0 }}
                    animate={{ y: top, height: h }}
                    transition={{
                      duration: 0.6,
                      delay: 0.1 + i * 0.14,
                      ease: "easeOut",
                    }}
                  />
                  <motion.text
                    x={cx(i)}
                    y={top - 7}
                    textAnchor="middle"
                    fontSize={compact ? 10.5 : 12}
                    fontWeight={700}
                    fill={theme.palette.text.primary}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.14 }}
                  >
                    {b.text}
                  </motion.text>
                  <text
                    x={cx(i)}
                    y={height - 9}
                    textAnchor="middle"
                    fontSize={compact ? 10 : 11.5}
                    fill={theme.palette.text.secondary}
                  >
                    {b.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </Box>
    </ChartCard>
  );
}

/* =====================  BRANCH PERFORMANCE  ===================== */
export function BranchPerformance({
  branches,
  delay = 0,
}: {
  branches: LedgerBranchBreakdown[];
  delay?: number;
}) {
  const max = Math.max(1, ...branches.flatMap((b) => [b.income, b.outflow]));
  return (
    <ChartCard
      title="Branch performance"
      subtitle="Income vs outflow per branch"
      delay={delay}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {branches.map((b, i) => (
          <Box key={b.branchId ?? "none"}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 1,
                mb: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, minWidth: 0 }}
                noWrap
              >
                {b.branchName}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: b.net >= 0 ? "success.main" : "error.main",
                  whiteSpace: "nowrap",
                }}
              >
                {formatINR(b.net, true)}
              </Typography>
            </Box>
            {(
              [
                ["Income", b.income, brand.teal],
                ["Outflow", b.outflow, "#EF4444"],
              ] as const
            ).map(([label, value, color], j) => (
              <Box
                key={label}
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ width: 48, flexShrink: 0 }}
                >
                  {label}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 99,
                    bgcolor: "action.hover",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / max) * 100}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.2 + i * 0.1 + j * 0.08,
                      ease: "easeOut",
                    }}
                    style={{
                      height: "100%",
                      borderRadius: 99,
                      background: color,
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ width: 62, textAlign: "right", fontWeight: 600 }}
                >
                  {compactINR(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </ChartCard>
  );
}

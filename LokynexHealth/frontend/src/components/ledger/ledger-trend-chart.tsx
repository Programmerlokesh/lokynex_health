"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import {
  bucketLabel,
  compactINR,
  formatINR,
  TYPE_META,
} from "@/lib/ledger-utils";
import type {
  Granularity,
  GranularityChoice,
  LedgerSeriesPoint,
} from "@/types/ledger";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type PointerEvent } from "react";
import {
  ChartCard,
  niceScale,
  useContainerWidth,
  useSvgId,
} from "./chart-utils";

type Mode = "cashflow" | "profit" | "cumulative";

const toggleSx = {
  "& .MuiToggleButton-root": {
    textTransform: "none",
    fontWeight: 600,
    px: 1.25,
    py: 0.4,
    fontSize: 12.5,
    lineHeight: 1.4,
  },
} as const;

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Box
        sx={{
          width: 14,
          height: dashed ? 0 : 8,
          borderRadius: 1,
          bgcolor: dashed ? "transparent" : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export function LedgerTrendChart({
  series,
  granularity,
  appliedGranularity,
  onGranularityChange,
}: {
  series: LedgerSeriesPoint[];
  granularity: GranularityChoice;
  appliedGranularity: Granularity;
  onGranularityChange: (g: GranularityChoice) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const uid = useSvgId();
  const [mode, setMode] = useState<Mode>("cashflow");
  const [hover, setHover] = useState<number | null>(null);
  const [wrapRef, width] = useContainerWidth<HTMLDivElement>();

  const compact = width > 0 && width < 480;
  const height = compact ? 240 : 300;
  const M = {
    top: 14,
    right: compact ? 8 : 14,
    bottom: 26,
    left: compact ? 44 : 54,
  };
  const n = series.length;
  const innerW = Math.max(width - M.left - M.right, 10);
  const innerH = height - M.top - M.bottom;
  const band = n > 0 ? innerW / n : innerW;

  const data = useMemo(
    () =>
      series.map((p) => ({
        ...p,
        outflow: p.refund + p.commissionPayout + p.expense,
      })),
    [series],
  );

  const scale = useMemo(() => {
    let min = 0;
    let max = 0;
    for (const d of data) {
      if (mode === "cashflow") {
        max = Math.max(max, d.income, d.outflow);
        min = Math.min(min, d.net);
      } else if (mode === "profit") {
        max = Math.max(max, d.net);
        min = Math.min(min, d.net);
      } else {
        max = Math.max(max, d.cumulativeNet);
        min = Math.min(min, d.cumulativeNet);
      }
    }
    return niceScale(min, max);
  }, [data, mode]);

  const y = (v: number) =>
    M.top + innerH - ((v - scale.lo) / (scale.hi - scale.lo)) * innerH;
  const cx = (i: number) => M.left + band * (i + 0.5);
  const y0 = y(0);

  // Changes whenever the data/mode changes -> line paths replay their draw animation.
  const sig = useMemo(
    () =>
      `${mode}-${n}-${Math.round(
        data.reduce((s, d) => s + d.income + d.net * 3 + d.outflow * 7, 0),
      )}`,
    [data, mode, n],
  );

  const linePath = (vals: number[]) =>
    vals
      .map((v, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ");

  const netLine = linePath(data.map((d) => d.net));
  const cumLine = linePath(data.map((d) => d.cumulativeNet));
  const cumArea =
    n > 0
      ? `${cumLine} L${cx(n - 1).toFixed(1)},${y0.toFixed(1)} L${cx(0).toFixed(1)},${y0.toFixed(1)} Z`
      : "";
  const avgNet = n ? data.reduce((s, d) => s + d.net, 0) / n : 0;

  const textColor = theme.palette.text.secondary;
  const lineColor = isDark ? "#E2E8F0" : brand.navy;
  const posColor = "#16A34A";
  const negColor = "#DC2626";

  const maxLabels = Math.max(2, Math.floor(innerW / (compact ? 48 : 62)));
  const step = Math.max(1, Math.ceil(n / maxLabels));

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || !n) return;
    const px = e.clientX - rect.left - M.left;
    setHover(Math.min(n - 1, Math.max(0, Math.floor(px / band))));
  };

  const tip = hover !== null ? data[hover] : null;
  const tipLeft =
    hover !== null
      ? Math.min(Math.max(cx(hover) - 95, 4), Math.max(width - 194, 4))
      : 0;

  const bw = Math.min(band * 0.78, 46);
  const half = Math.max(bw / 2 - 1, 1);

  return (
    <ChartCard
      title="Performance trend"
      subtitle={`Shown by ${appliedGranularity}${granularity === "auto" ? " (auto)" : ""}`}
      delay={0.1}
      action={
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v: Mode | null) => v && setMode(v)}
            sx={toggleSx}
            aria-label="Chart type"
          >
            <ToggleButton value="cashflow">Cashflow</ToggleButton>
            <ToggleButton value="profit">Profit</ToggleButton>
            <ToggleButton value="cumulative">Cumulative</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={granularity}
            onChange={(_, v: GranularityChoice | null) => v && onGranularityChange(v)}
            sx={toggleSx}
            aria-label="Group by"
          >
            <ToggleButton value="auto">Auto</ToggleButton>
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      }
    >
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
        {mode === "cashflow" && (
          <>
            <LegendDot color={TYPE_META.Income.color} label="Income" />
            <LegendDot color="#EF4444" label="Outflow" />
            <LegendDot color={lineColor} label="Net" />
          </>
        )}
        {mode === "profit" && (
          <>
            <LegendDot color={posColor} label="Profit" />
            <LegendDot color={negColor} label="Loss" />
            <LegendDot color={brand.orange} label={`Average ${compactINR(avgNet)}`} dashed />
          </>
        )}
        {mode === "cumulative" && (
          <LegendDot color={brand.blue} label="Cumulative net profit" />
        )}
      </Box>

      <Box ref={wrapRef} sx={{ position: "relative", width: "100%", height }}>
        {n === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 8, textAlign: "center" }}>
            No data for this range.
          </Typography>
        )}

        {width > 0 && n > 0 && (
          <svg width={width} height={height} role="img" aria-label="Ledger performance chart">
            <defs>
              <linearGradient id={`${uid}inc`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={TYPE_META.Income.color} />
                <stop offset="1" stopColor={TYPE_META.Income.color} stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id={`${uid}out`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F87171" />
                <stop offset="1" stopColor="#EF4444" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id={`${uid}pos`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={posColor} />
                <stop offset="1" stopColor={posColor} stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id={`${uid}neg`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={negColor} stopOpacity="0.55" />
                <stop offset="1" stopColor={negColor} />
              </linearGradient>
              <linearGradient id={`${uid}area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={brand.blue} stopOpacity="0.35" />
                <stop offset="1" stopColor={brand.blue} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* grid + y labels */}
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
                  fill={textColor}
                >
                  {compactINR(t)}
                </text>
              </g>
            ))}

            {/* hover band */}
            {hover !== null && (
              <rect
                x={M.left + band * hover}
                y={M.top}
                width={band}
                height={innerH}
                fill={theme.palette.action.hover}
                rx={4}
              />
            )}

            {/* x labels */}
            {data.map((d, i) =>
              i % step === 0 ? (
                <text
                  key={d.bucket}
                  x={cx(i)}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill={textColor}
                >
                  {bucketLabel(d.bucket, appliedGranularity)}
                </text>
              ) : null,
            )}

            {/* ---- series ---- */}
            <g key={sig}>
              {mode === "cashflow" &&
                data.map((d, i) => (
                  <g key={d.bucket}>
                    <motion.rect
                      x={cx(i) - half - 1}
                      width={half}
                      rx={Math.min(3, half / 2)}
                      fill={`url(#${uid}inc)`}
                      initial={{ y: y0, height: 0 }}
                      animate={{ y: y(d.income), height: Math.max(y0 - y(d.income), 0) }}
                      transition={{ duration: 0.55, delay: Math.min(i * 0.015, 0.5), ease: "easeOut" }}
                    />
                    <motion.rect
                      x={cx(i) + 1}
                      width={half}
                      rx={Math.min(3, half / 2)}
                      fill={`url(#${uid}out)`}
                      initial={{ y: y0, height: 0 }}
                      animate={{ y: y(d.outflow), height: Math.max(y0 - y(d.outflow), 0) }}
                      transition={{ duration: 0.55, delay: Math.min(i * 0.015, 0.5) + 0.05, ease: "easeOut" }}
                    />
                  </g>
                ))}
              {mode === "cashflow" && (
                <motion.path
                  d={netLine}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={2.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, delay: 0.3, ease: "easeInOut" }}
                />
              )}

              {mode === "profit" && (
                <>
                  {data.map((d, i) => {
                    const top = Math.min(y(d.net), y0);
                    const h = Math.abs(y(d.net) - y0);
                    return (
                      <motion.rect
                        key={d.bucket}
                        x={cx(i) - bw / 2}
                        width={bw}
                        rx={Math.min(3, bw / 2)}
                        fill={`url(#${uid}${d.net >= 0 ? "pos" : "neg"})`}
                        initial={{ y: y0, height: 0 }}
                        animate={{ y: top, height: h }}
                        transition={{ duration: 0.55, delay: Math.min(i * 0.015, 0.5), ease: "easeOut" }}
                      />
                    );
                  })}
                  <motion.line
                    x1={M.left}
                    x2={width - M.right}
                    y1={y(avgNet)}
                    y2={y(avgNet)}
                    stroke={brand.orange}
                    strokeWidth={1.75}
                    strokeDasharray="6 5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  />
                </>
              )}

              {mode === "cumulative" && (
                <>
                  <motion.path
                    d={cumArea}
                    fill={`url(#${uid}area)`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                  />
                  <motion.path
                    d={cumLine}
                    fill="none"
                    stroke={brand.blue}
                    strokeWidth={2.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                </>
              )}
            </g>

            {/* hover markers */}
            {hover !== null && mode === "cashflow" && (
              <circle cx={cx(hover)} cy={y(data[hover].net)} r={4.5} fill={lineColor} stroke={theme.palette.background.paper} strokeWidth={2} />
            )}
            {hover !== null && mode === "cumulative" && (
              <circle cx={cx(hover)} cy={y(data[hover].cumulativeNet)} r={5} fill={brand.blue} stroke={theme.palette.background.paper} strokeWidth={2} />
            )}

            {/* pointer capture */}
            <rect
              x={M.left}
              y={M.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              style={{ touchAction: "pan-y", cursor: "crosshair" }}
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setHover(null)}
              onPointerCancel={() => setHover(null)}
            />
          </svg>
        )}

        <AnimatePresence>
          {tip && (
            <motion.div
              key="tip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ position: "absolute", top: 4, left: tipLeft, width: 190, pointerEvents: "none", zIndex: 2 }}
            >
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                  {bucketLabel(tip.bucket, appliedGranularity, true)}
                </Typography>
                {(
                  [
                    ["Income", tip.income, TYPE_META.Income.color],
                    ["Refunds", tip.refund, TYPE_META.Refund.color],
                    ["Commission", tip.commissionPayout, TYPE_META.CommissionPayout.color],
                    ["Expenses", tip.expense, TYPE_META.Expense.color],
                  ] as const
                )
                  .filter(([label, v]) => v > 0 || label === "Income")
                  .map(([label, v, color]) => (
                    <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: 12 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                        {label}
                      </Box>
                      <b>{formatINR(v)}</b>
                    </Box>
                  ))}
                <Box
                  sx={{
                    mt: 0.5,
                    pt: 0.5,
                    borderTop: 1,
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: tip.net >= 0 ? "success.main" : "error.main",
                  }}
                >
                  <span>Net</span>
                  <span>{formatINR(tip.net)}</span>
                </Box>
                {mode === "cumulative" && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "text.secondary" }}>
                    <span>Cumulative</span>
                    <span>{formatINR(tip.cumulativeNet)}</span>
                  </Box>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </ChartCard>
  );
}
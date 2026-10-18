"use client";

import {
  niceScale,
  useContainerWidth,
  useSvgId,
} from "@/components/ledger/chart-utils";
import { formatMoney } from "@/lib/format";
import { bucketLabel } from "@/lib/owner-ledger-utils";
import { OwnerLedgerLabRow, OwnerLedgerSeriesPoint } from "@/types/owner";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

const GREEN = "#16A34A";
const RED = "#DC2626";
const BLUE = "#4F8BFF";

export const compact = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

// ---------------------------------------------------------------------------
// Income (up) / outflow (down) bars + cumulative net line. Pure SVG, drawn in
// real pixels from the measured container width, so it is crisp on phones.
// Tap / hover a bar to read its numbers in the panel under the chart.
// ---------------------------------------------------------------------------
export function TrendChart({
  series,
  granularity,
}: {
  series: OwnerLedgerSeriesPoint[];
  granularity: string;
}) {
  const [ref, width] = useContainerWidth<HTMLDivElement>();
  const gid = useSvgId();
  const [picked, setPicked] = useState<number | null>(null);

  const n = series.length;
  const sel = picked !== null && picked < n ? picked : n - 1;
  const point = series[sel];

  const H = width < 480 ? 220 : 280;
  const m = { l: width < 480 ? 40 : 52, r: 10, t: 12, b: 26 };
  const innerW = Math.max(width - m.l - m.r, 10);
  const innerH = H - m.t - m.b;

  const outflow = (p: OwnerLedgerSeriesPoint) =>
    p.refund + p.commissionPayout + p.expense;

  let lo = 0;
  let hi = 0;
  for (const p of series) {
    hi = Math.max(hi, p.income, p.cumulativeNet);
    lo = Math.min(lo, -outflow(p), p.cumulativeNet);
  }
  const { lo: yMin, hi: yMax, ticks } = niceScale(lo, hi);
  const y = (v: number) => m.t + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const step = innerW / Math.max(n, 1);
  const barW = Math.max(2, Math.min(18, step * 0.62));
  const cx = (i: number) => m.l + step * i + step / 2;
  const stride = Math.max(
    1,
    Math.ceil(n / Math.max(Math.floor(innerW / 64), 2)),
  );

  const line = series
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)},${y(p.cumulativeNet).toFixed(1)}`,
    )
    .join(" ");

  return (
    <Box>
      <Box ref={ref} sx={{ width: "100%", touchAction: "pan-y" }}>
        {width > 0 && n > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label="Income, outflow and cumulative profit trend"
          >
            <defs>
              <linearGradient id={`${gid}g`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
                <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={m.l}
                  x2={width - m.r}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="currentColor"
                  strokeOpacity={t === 0 ? 0.35 : 0.1}
                />
                <text
                  x={m.l - 6}
                  y={y(t) + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.6}
                >
                  {compact(t)}
                </text>
              </g>
            ))}
            {series.map((p, i) => (
              <g
                key={p.bucket}
                onClick={() => setPicked(i)}
                onPointerEnter={() => setPicked(i)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={m.l + step * i}
                  y={m.t}
                  width={step}
                  height={innerH}
                  fill={i === sel ? "currentColor" : "transparent"}
                  opacity={i === sel ? 0.07 : 0}
                />
                <rect
                  x={cx(i) - barW / 2}
                  y={y(p.income)}
                  width={barW}
                  height={Math.max(y(0) - y(p.income), 0)}
                  rx={2}
                  fill={GREEN}
                />
                <rect
                  x={cx(i) - barW / 2}
                  y={y(0)}
                  width={barW}
                  height={Math.max(y(-outflow(p)) - y(0), 0)}
                  rx={2}
                  fill={RED}
                  opacity={0.85}
                />
                {i % stride === 0 && (
                  <text
                    x={cx(i)}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.6}
                  >
                    {bucketLabel(p.bucket, granularity)}
                  </text>
                )}
              </g>
            ))}
            <path
              d={`${line} L${cx(n - 1)},${y(0)} L${cx(0)},${y(0)} Z`}
              fill={`url(#${gid}g)`}
              pointerEvents="none"
            />
            <path
              d={line}
              fill="none"
              stroke={BLUE}
              strokeWidth={2.25}
              strokeLinejoin="round"
              pointerEvents="none"
            />
            {n <= 40 &&
              series.map((p, i) => (
                <circle
                  key={p.bucket}
                  cx={cx(i)}
                  cy={y(p.cumulativeNet)}
                  r={i === sel ? 4.5 : 2.5}
                  fill={BLUE}
                  pointerEvents="none"
                />
              ))}
          </svg>
        )}
      </Box>

      {point && (
        <Box
          sx={{
            mt: 1,
            p: 1.25,
            borderRadius: 2,
            bgcolor: "action.hover",
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(5, 1fr)" },
            gap: 1,
          }}
        >
          {[
            { k: bucketLabel(point.bucket, granularity), v: null },
            { k: "Income", v: point.income, c: GREEN },
            { k: "Outflow", v: outflow(point), c: RED },
            { k: "Net", v: point.net, c: point.net >= 0 ? GREEN : RED },
            { k: "Cumulative", v: point.cumulativeNet, c: BLUE },
          ].map((s) => (
            <Box key={s.k}>
              <Typography variant="caption" color="text.secondary">
                {s.k}
              </Typography>
              {s.v !== null && (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: s.c }}
                >
                  {formatMoney(s.v)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
        {[
          ["Income", GREEN],
          ["Outflow", RED],
          ["Cumulative net", BLUE],
        ].map(([l, c]) => (
          <Box
            key={l}
            sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
          >
            <Box
              sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: c }}
            />
            <Typography variant="caption" color="text.secondary">
              {l}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Donut with legend (expense mix / income mix)
// ---------------------------------------------------------------------------
export const PALETTE = [
  "#4F8BFF",
  "#16A34A",
  "#F59E0B",
  "#7C3AED",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

export function DonutChart({
  data,
  centerLabel,
}: {
  data: { label: string; value: number }[];
  centerLabel: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing to show for this period.
      </Typography>
    );
  }
  const R = 54;
  const C = 2 * Math.PI * R;
  // Arc start positions = prefix sums, computed in ONE pass over the data.
  const starts: number[] = [];
  data.reduce((acc, d) => {
    starts.push(acc);
    return acc + (d.value / total) * C;
  }, 0);
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}
    >
      <svg
        width={150}
        height={150}
        viewBox="0 0 150 150"
        role="img"
        aria-label={centerLabel}
      >
        <g transform="rotate(-90 75 75)">
          <circle
            cx={75}
            cy={75}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={20}
          />
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            return (
              <circle
                key={d.label}
                cx={75}
                cy={75}
                r={R}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={20}
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`}
                strokeDashoffset={-starts[i]}
              />
            );
          })}
        </g>
        <text
          x={75}
          y={72}
          textAnchor="middle"
          fontSize={11}
          fill="currentColor"
          opacity={0.6}
        >
          {centerLabel}
        </text>
        <text
          x={75}
          y={90}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fill="currentColor"
        >
          {compact(total)}
        </text>
      </svg>
      <Box sx={{ flex: 1, minWidth: 150, display: "grid", gap: 0.75 }}>
        {data.map((d, i) => (
          <Box
            key={d.label}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "3px",
                bgcolor: PALETTE[i % PALETTE.length],
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
              {d.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {((d.value / total) * 100).toFixed(0)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bars: revenue per lab, net shown on the right
// ---------------------------------------------------------------------------
export function LabBars({ rows }: { rows: OwnerLedgerLabRow[] }) {
  const top = rows.slice(0, 6);
  const max = Math.max(...top.map((r) => r.income), 1);
  if (top.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No lab revenue in this period.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {top.map((r) => (
        <Box key={r.tenantId ?? "none"}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
          >
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {r.labName}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: r.net >= 0 ? GREEN : RED }}
            >
              {formatMoney(r.net)}
            </Typography>
          </Box>
          <Box
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "action.hover",
              overflow: "hidden",
              mt: 0.5,
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${(r.income / max) * 100}%`,
                bgcolor: BLUE,
                borderRadius: 4,
                transition: "width .5s ease",
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Income {formatMoney(r.income)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

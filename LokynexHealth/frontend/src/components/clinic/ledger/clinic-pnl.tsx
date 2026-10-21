"use client";

import { formatINR, pctChange } from "@/lib/ledger-utils";
import type { LedgerPeriodTotals } from "@/types/ledger";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";

const GREEN = "#16A34A";
const RED = "#DC2626";
const BLUE = "#0EA5E9";
const AMBER = "#F59E0B";
const VIOLET = "#7C3AED";

function Delta({
  now,
  before,
  goodWhenUp = true,
}: {
  now: number;
  before: number;
  goodWhenUp?: boolean;
}) {
  const v = pctChange(now, before);
  if (v === null) return null;
  const up = v >= 0;
  const good = up === goodWhenUp;
  return (
    <Box
      component="span"
      sx={{
        fontSize: 12,
        fontWeight: 700,
        px: 0.9,
        py: 0.15,
        borderRadius: 99,
        color: good ? GREEN : RED,
        bgcolor: alpha(good ? GREEN : RED, 0.12),
      }}
    >
      {up ? "▲" : "▼"} {Math.abs(v).toFixed(1)}%
    </Box>
  );
}

/**
 * Clinic Profit & Loss: one hero number, one bar showing where the money
 * went, then the statement as clear steps.
 */
export function ClinicPnl({
  current,
  previous,
  periodLabel,
  previousLabel,
}: {
  current: LedgerPeriodTotals;
  previous: LedgerPeriodTotals;
  periodLabel: string;
  previousLabel: string;
}) {
  const showCompare = previous.entryCount > 0;
  const netRevenue = current.income - current.refund;
  const profit = current.net;
  const profitable = profit >= 0;
  const margin = current.income > 0 ? (profit / current.income) * 100 : null;

  // Where each rupee of income went
  const parts = [
    { key: "refund", label: "Refunds", value: current.refund, color: AMBER },
    {
      key: "commission",
      label: "Commission",
      value: current.commissionPayout,
      color: VIOLET,
    },
    { key: "expense", label: "Expenses", value: current.expense, color: RED },
    {
      key: "profit",
      label: profitable ? "Profit kept" : "",
      value: Math.max(profit, 0),
      color: GREEN,
    },
  ].filter((p) => p.value > 0);
  const totalBar = parts.reduce((s, p) => s + p.value, 0) || 1;

  const lines: {
    label: string;
    hint: string;
    value: number;
    prev: number;
    sign: "+" | "-" | "=";
    color: string;
    strong?: boolean;
    hide?: boolean;
  }[] = [
    {
      label: "Money received",
      hint: "Visit fees and other income",
      value: current.income,
      prev: previous.income,
      sign: "+",
      color: BLUE,
    },
    {
      label: "Refunds",
      hint: "Returned to patients",
      value: current.refund,
      prev: previous.refund,
      sign: "-",
      color: AMBER,
      hide: current.refund === 0 && previous.refund === 0,
    },
    {
      label: "Net income",
      hint: "Received minus refunds",
      value: netRevenue,
      prev: previous.income - previous.refund,
      sign: "=",
      color: BLUE,
      strong: true,
    },
    {
      label: "Commission paid",
      hint: "Paid out to others",
      value: current.commissionPayout,
      prev: previous.commissionPayout,
      sign: "-",
      color: VIOLET,
      hide: current.commissionPayout === 0 && previous.commissionPayout === 0,
    },
    {
      label: "Running costs",
      hint: "Rent, salary, supplies and more",
      value: current.expense,
      prev: previous.expense,
      sign: "-",
      color: RED,
    },
    {
      label: profitable ? "Profit" : "Loss",
      hint: "What the clinic keeps",
      value: profit,
      prev: previous.net,
      sign: "=",
      color: profitable ? GREEN : RED,
      strong: true,
    },
  ];

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {/* hero */}
      <Box
        sx={{
          borderRadius: "24px",
          p: { xs: 2.25, sm: 3 },
          color: "#fff",
          background: profitable
            ? "linear-gradient(135deg,#0F766E 0%,#16A34A 100%)"
            : "linear-gradient(135deg,#9F1239 0%,#DC2626 100%)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ opacity: 0.85, fontSize: 13.5 }}>
            {profitable ? "Net profit" : "Net loss"} · {periodLabel}
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 34, sm: 44 },
              lineHeight: 1.1,
            }}
          >
            {formatINR(Math.abs(profit))}
          </Typography>
          {showCompare && (
            <Typography sx={{ opacity: 0.85, fontSize: 12.5, mt: 0.5 }}>
              Previous period ({previousLabel}): {formatINR(previous.net)}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
          {margin !== null && (
            <Typography sx={{ fontWeight: 800, fontSize: 22 }}>
              {margin.toFixed(1)}%
            </Typography>
          )}
          <Typography sx={{ opacity: 0.85, fontSize: 12.5 }}>
            of money received is kept
          </Typography>
        </Box>
      </Box>

      {/* where it went */}
      {current.income > 0 && (
        <Box
          sx={{
            borderRadius: "20px",
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 2,
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1.25 }}>
            Where the money went
          </Typography>
          <Box
            sx={{
              display: "flex",
              height: 16,
              borderRadius: 99,
              overflow: "hidden",
              bgcolor: "action.hover",
            }}
          >
            {parts.map((p, i) => (
              <motion.div
                key={p.key}
                initial={{ width: 0 }}
                animate={{ width: `${(p.value / totalBar) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
                style={{ background: p.color }}
                title={`${p.label}: ${formatINR(p.value)}`}
              />
            ))}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1.5, sm: 3 },
              mt: 1.25,
            }}
          >
            {parts.map((p) => (
              <Box
                key={p.key}
                sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: p.color,
                  }}
                />
                <Typography sx={{ fontSize: 13 }}>
                  {p.label} <b>{formatINR(p.value)}</b>{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    ({((p.value / totalBar) * 100).toFixed(0)}%)
                  </Typography>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* statement */}
      <Box
        sx={{
          borderRadius: "20px",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Typography sx={{ fontWeight: 800, p: 2, pb: 1 }}>
          Profit &amp; Loss statement
        </Typography>
        {lines
          .filter((l) => !l.hide)
          .map((l, i) => (
            <Box
              key={l.label}
              sx={{
                display: "grid",
                gridTemplateColumns: "28px minmax(0,1fr) auto",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: l.strong ? 1.5 : 1.1,
                bgcolor: l.strong ? alpha(l.color, 0.08) : "transparent",
                borderTop: i === 0 ? 0 : 1,
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 14,
                  color: l.color,
                  bgcolor: alpha(l.color, 0.14),
                }}
              >
                {l.sign === "-" ? "−" : l.sign}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: l.strong ? 800 : 600 }} noWrap>
                  {l.label}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: "block" }}
                >
                  {l.hint}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: l.strong ? 18 : 15,
                    color: l.strong ? l.color : "text.primary",
                  }}
                >
                  {formatINR(l.value)}
                </Typography>
                {showCompare && (
                  <Delta
                    now={l.value}
                    before={l.prev}
                    goodWhenUp={l.sign !== "-"}
                  />
                )}
              </Box>
            </Box>
          ))}
      </Box>
    </Box>
  );
}

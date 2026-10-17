"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import { formatINR, pctChange, TYPE_META } from "@/lib/ledger-utils";
import type { LedgerPeriodTotals } from "@/types/ledger";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./animated-number";
import { ChartCard } from "./chart-utils";

interface Row {
  key: string;
  label: string;
  note: string;
  value: number;
  prev: number;
  kind: "line" | "subtotal" | "total";
  deduction?: boolean;
  color: string;
}

function buildRows(cur: LedgerPeriodTotals, prv: LedgerPeriodTotals): Row[] {
  const netRev = (t: LedgerPeriodTotals) => t.income - t.refund;
  const gross = (t: LedgerPeriodTotals) =>
    t.income - t.refund - t.commissionPayout;
  return [
    {
      key: "income",
      label: "Revenue",
      note: "Order payments + manual income",
      value: cur.income,
      prev: prv.income,
      kind: "line",
      color: TYPE_META.Income.color,
    },
    {
      key: "refund",
      label: "Less: Refunds",
      note: "Money returned to patients",
      value: cur.refund,
      prev: prv.refund,
      kind: "line",
      deduction: true,
      color: TYPE_META.Refund.color,
    },
    {
      key: "netRev",
      label: "Net revenue",
      note: "Revenue after refunds",
      value: netRev(cur),
      prev: netRev(prv),
      kind: "subtotal",
      color: brand.electricBlue,
    },
    {
      key: "commission",
      label: "Less: Commission payouts",
      note: "Doctor / referral commission",
      value: cur.commissionPayout,
      prev: prv.commissionPayout,
      kind: "line",
      deduction: true,
      color: TYPE_META.CommissionPayout.color,
    },
    {
      key: "gross",
      label: "Gross profit",
      note: "Net revenue after commission",
      value: gross(cur),
      prev: gross(prv),
      kind: "subtotal",
      color: brand.blue,
    },
    {
      key: "expense",
      label: "Less: Operating expenses",
      note: "Rent, salary, supplies & more",
      value: cur.expense,
      prev: prv.expense,
      kind: "line",
      deduction: true,
      color: TYPE_META.Expense.color,
    },
    {
      key: "net",
      label: "Net profit / (loss)",
      note: "What the lab actually keeps",
      value: cur.net,
      prev: prv.net,
      kind: "total",
      color: cur.net >= 0 ? "#16A34A" : "#DC2626",
    },
  ];
}

function Change({
  value,
  goodWhenUp,
}: {
  value: number | null;
  goodWhenUp: boolean;
}) {
  if (value === null)
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  const up = value >= 0;
  const good = up === goodWhenUp;
  return (
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, color: good ? "success.main" : "error.main" }}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </Typography>
  );
}

export function PnlStatement({
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
  const rows = buildRows(current, previous);
  const cols = {
    xs: "minmax(0,1fr) auto",
    sm: showCompare ? "minmax(0,1fr) 130px 130px 84px" : "minmax(0,1fr) 160px",
  };

  return (
    <ChartCard
      title="Profit & Loss statement"
      subtitle={periodLabel}
      delay={0.05}
    >
      {/* header (hidden on phones) */}
      <Box
        sx={{
          display: { xs: "none", sm: "grid" },
          gridTemplateColumns: cols,
          gap: 1.5,
          px: 1.5,
          pb: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          PARTICULARS
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, textAlign: "right" }}
        >
          THIS PERIOD
        </Typography>
        {showCompare && (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textAlign: "right" }}
              title={previousLabel}
            >
              PREVIOUS
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textAlign: "right" }}
            >
              CHANGE
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
        {rows.map((r, i) => {
          const pctRev =
            current.income > 0 ? (r.value / current.income) * 100 : null;
          const strong = r.kind !== "line";
          const fmt = (n: number) =>
            r.deduction ? `−${formatINR(n)}` : formatINR(n);
          return (
            <motion.div
              key={r.key}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.07 }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: cols,
                  gap: 1.5,
                  alignItems: "center",
                  px: 1.5,
                  py: r.kind === "total" ? 1.5 : 1,
                  borderRadius: 2.5,
                  bgcolor:
                    r.kind === "total"
                      ? alpha(r.color, 0.12)
                      : r.kind === "subtotal"
                        ? "action.hover"
                        : "transparent",
                  borderLeft: strong
                    ? `4px solid ${r.color}`
                    : "4px solid transparent",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: strong ? 800 : 600,
                      fontSize: r.kind === "total" ? 16 : 14,
                      pl: r.kind === "line" && r.deduction ? 1.5 : 0,
                    }}
                    noWrap
                  >
                    {r.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                    noWrap
                  >
                    {pctRev === null
                      ? r.note
                      : `${r.note} · ${pctRev.toFixed(1)}% of revenue`}
                  </Typography>
                  <Box
                    sx={{
                      mt: 0.5,
                      height: 4,
                      borderRadius: 99,
                      bgcolor: "action.hover",
                      overflow: "hidden",
                      maxWidth: 260,
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(Math.max(pctRev ?? 0, 0), 100)}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.25 + i * 0.07 }}
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: r.color,
                      }}
                    />
                  </Box>
                </Box>

                <Typography
                  sx={{
                    textAlign: "right",
                    fontWeight: strong ? 800 : 700,
                    fontSize: r.kind === "total" ? 18 : 14.5,
                    color:
                      r.kind === "total"
                        ? r.color
                        : r.deduction
                          ? "error.main"
                          : "text.primary",
                  }}
                >
                  <AnimatedNumber value={r.value} format={fmt} />
                </Typography>

                {showCompare && (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        textAlign: "right",
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      {fmt(r.prev)}
                    </Typography>
                    <Box
                      sx={{
                        textAlign: "right",
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      <Change
                        value={pctChange(r.value, r.prev)}
                        goodWhenUp={!r.deduction}
                      />
                    </Box>
                  </>
                )}
              </Box>
            </motion.div>
          );
        })}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2 }}
      >
        Revenue = cash actually collected (Income entries). Refunds, commission
        payouts and expenses are deducted in order.
        {showCompare ? ` Compared with ${previousLabel}.` : ""}
      </Typography>
    </ChartCard>
  );
}

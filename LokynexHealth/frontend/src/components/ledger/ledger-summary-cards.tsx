"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import { LedgerSummaryDto } from "@/types/ledger";
import { Box, Paper, Typography } from "@mui/material";

const TYPE_COLORS: Record<string, string> = {
  Income: brand.teal,
  Expense: "#EF4444",
  CommissionPayout: brand.orange,
  Refund: "#F59E0B",
};

function formatAmount(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN")}`;
}

export function LedgerSummaryCards({
  byType,
  netProfitLoss,
}: {
  byType: LedgerSummaryDto[];
  netProfitLoss: number;
}) {
  return (
    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 3,
          minWidth: 200,
          bgcolor: brand.navy,
          color: "#fff",
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Net Profit / Loss
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: netProfitLoss >= 0 ? brand.teal : "#F87171",
          }}
        >
          {formatAmount(netProfitLoss)}
        </Typography>
      </Paper>

      {byType.map((entry) => (
        <Paper
          key={entry.entryType}
          sx={{
            p: 2.5,
            borderRadius: 3,
            minWidth: 170,
            border: "1px solid #E2E8F0",
            borderTop: `3px solid ${TYPE_COLORS[entry.entryType] ?? brand.blue}`,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {entry.entryType} · {entry.entryCount} entr
            {entry.entryCount === 1 ? "y" : "ies"}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatAmount(entry.totalAmount)}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
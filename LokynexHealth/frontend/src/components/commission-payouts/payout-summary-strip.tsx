"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import { PayoutSummaryDto } from "@/types/commission-payout";
import { Box, Paper, Typography } from "@mui/material";

export function PayoutSummaryStrip({
  summary,
  grandTotal,
}: {
  summary: PayoutSummaryDto[];
  grandTotal: number;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        mb: 2.5,
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
      }}
    >
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: brand.navy,
          color: "#fff",
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Grand Total
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ₹{grandTotal.toLocaleString("en-IN")}
        </Typography>
      </Paper>

      {summary.map((s) => (
        <Paper
          key={s.periodLabel}
          sx={{
            p: 2,
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {s.periodLabel} · {s.count} item{s.count === 1 ? "" : "s"}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ₹{s.totalAmount.toLocaleString("en-IN")}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

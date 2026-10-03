"use client";

import { formatMoney } from "@/lib/format";
import { OrderTotals } from "@/lib/order-math";
import { Box, Divider, Typography } from "@mui/material";

const STATUS_COLOR = {
  Paid: "#16A34A",
  Partial: "#F59E0B",
  Open: "#64748B",
} as const;

export function OrderSummary({ totals }: { totals: OrderTotals }) {
  return (
    <Box sx={{ bgcolor: "action.hover", p: 2.5 }}>
      <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
      <Row label="Discount" value={`- ${formatMoney(totals.discount)}`} />
      <Divider sx={{ my: 1 }} />
      <Row label="Total" value={formatMoney(totals.total)} bold />
      <Row label="Paid" value={formatMoney(totals.paid)} />
      <Row label="Due" value={formatMoney(totals.due)} />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Status
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: STATUS_COLOR[totals.status], fontWeight: 700 }}
        >
          {totals.status}
        </Typography>
      </Box>
    </Box>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
      <Typography
        variant="body2"
        color={bold ? "text.primary" : "text.secondary"}
        sx={{ fontWeight: bold ? 700 : 400 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

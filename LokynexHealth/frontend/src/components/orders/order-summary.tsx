"use client";

import { OrderItemInput } from "@/types/order";
import { Box, Divider, Typography } from "@mui/material";
import { useMemo } from "react";

export function OrderSummary({
  items,
  discountType,
  discountValue,
  isComplimentary,
  paidAmount,
}: {
  items: OrderItemInput[];
  discountType: string;
  discountValue: number;
  isComplimentary: boolean;
  paidAmount: number;
}) {
  const { grossAmount, discountAmount, finalAmount, paymentStatus } =
    useMemo(() => {
      const gross = items.reduce((sum, i) => sum + i.price, 0);

      if (isComplimentary) {
        return {
          grossAmount: gross,
          discountAmount: 0,
          finalAmount: 0,
          paymentStatus: "Paid",
        };
      }

      const discount =
        discountType === "Percentage"
          ? gross * (discountValue / 100)
          : discountValue;
      const final = Math.max(0, gross - discount);
      const status =
        paidAmount >= final ? "Paid" : paidAmount > 0 ? "Partial" : "Open";

      return {
        grossAmount: gross,
        discountAmount: discount,
        finalAmount: final,
        paymentStatus: status,
      };
    }, [items, discountType, discountValue, isComplimentary, paidAmount]);

  const statusColor =
    paymentStatus === "Paid"
      ? "#16A34A"
      : paymentStatus === "Partial"
        ? "#F59E0B"
        : "#64748B";

  return (
    <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 2.5 }}>
      <Row label="Gross Amount" value={`₹${grossAmount.toFixed(2)}`} />
      <Row label="Discount" value={`- ₹${discountAmount.toFixed(2)}`} />
      <Divider sx={{ my: 1 }} />
      <Row label="Final Amount" value={`₹${finalAmount.toFixed(2)}`} bold />
      <Row label="Paid" value={`₹${paidAmount.toFixed(2)}`} />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Status
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: statusColor, fontWeight: 700 }}
        >
          {paymentStatus}
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

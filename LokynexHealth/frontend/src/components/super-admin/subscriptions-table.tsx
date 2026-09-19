"use client";

import { SubscriptionDto } from "@/types/super-admin";
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";

const STATUS_COLOR: Record<
  string,
  "success" | "warning" | "error" | "default"
> = {
  Active: "success",
  Trial: "warning",
  Expired: "error",
  Cancelled: "default",
};

export function SubscriptionsTable({ rows }: { rows: SubscriptionDto[] }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No subscriptions created yet.
      </Typography>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(23,43,77,0.06)" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 600 }}>Lab / Tenant</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Start</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>End</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Amount Paid</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              style={{ display: "table-row" }}
            >
              <TableCell sx={{ fontWeight: 500 }}>{row.tenantName}</TableCell>
              <TableCell>{row.planName}</TableCell>
              <TableCell>
                {new Date(row.startDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(row.endDate).toLocaleDateString()}
              </TableCell>
              <TableCell>₹{row.amountPaid.toLocaleString("en-IN")}</TableCell>
              <TableCell>
                <Chip
                  label={row.status}
                  size="small"
                  color={STATUS_COLOR[row.status] ?? "default"}
                  variant="outlined"
                />
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

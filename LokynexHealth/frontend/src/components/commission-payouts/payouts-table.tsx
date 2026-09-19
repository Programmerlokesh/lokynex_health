"use client";

import { PayoutDto } from "@/types/commission-payout";
import {
  Checkbox,
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

export function PayoutsTable({
  rows,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  rows: PayoutDto[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No payouts found for these filters.
      </Typography>
    );
  }

  const unpaidRows = rows.filter((r) => r.status === "Unpaid");
  const allUnpaidSelected =
    unpaidRows.length > 0 && unpaidRows.every((r) => selectedIds.has(r.id));

  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(23,43,77,0.06)" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#F5F9FC" }}>
            <TableCell padding="checkbox">
              <Checkbox
                size="small"
                checked={allUnpaidSelected}
                indeterminate={
                  !allUnpaidSelected &&
                  unpaidRows.some((r) => selectedIds.has(r.id))
                }
                disabled={unpaidRows.length === 0}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Generated</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Paid At</TableCell>
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
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selectedIds.has(row.id)}
                  disabled={row.status === "Paid"}
                  onChange={() => onToggle(row.id)}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 500 }}>{row.entityName}</TableCell>
              <TableCell>
                <Chip label={row.entityType} size="small" variant="outlined" />
              </TableCell>
              <TableCell>₹{row.commissionAmount.toLocaleString("en-IN")}</TableCell>
              <TableCell>
                <Chip
                  label={row.status}
                  size="small"
                  color={row.status === "Paid" ? "success" : "warning"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {new Date(row.generatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "—"}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
"use client";

import { CommissionOverrideDto } from "@/types/commission";
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

export function CommissionOverridesTable({
  rows,
}: {
  rows: CommissionOverrideDto[];
}) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No overrides set yet.
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
          <TableRow sx={{ bgcolor: "#F5F9FC" }}>
            <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Commission</TableCell>
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
              <TableCell sx={{ fontWeight: 500 }}>{row.entityName}</TableCell>
              <TableCell>
                <Chip label={row.entityType} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{row.testName}</TableCell>
              <TableCell>
                {row.commissionType === "Percentage"
                  ? `${row.commissionValue}%`
                  : `₹${row.commissionValue}`}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

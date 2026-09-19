"use client";

import { PlanDto } from "@/types/super-admin";
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

export function PlansTable({ rows }: { rows: PlanDto[] }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No plans created yet.
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
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Billing Cycle</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Max Users</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Max Branches</TableCell>
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
              <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
              <TableCell>₹{row.price.toLocaleString("en-IN")}</TableCell>
              <TableCell>
                <Chip
                  label={row.billingCycle}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{row.maxUsers}</TableCell>
              <TableCell>{row.maxBranches}</TableCell>
              <TableCell>
                <Chip
                  label={row.isActive ? "Active" : "Inactive"}
                  size="small"
                  color={row.isActive ? "success" : "default"}
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

"use client";

import { LabDto } from "@/types/super-admin";
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

const STATUS_COLOR: Record<string, "success" | "warning" | "default"> = {
  Active: "success",
  Suspended: "warning",
};

export function LabsTable({ rows }: { rows: LabDto[] }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No labs provisioned yet.
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
            <TableCell sx={{ fontWeight: 600 }}>Lab Code</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Primary Branch</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Subdomain</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Admin</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>User Limit</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
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
              <TableCell sx={{ fontWeight: 500 }}>{row.labCode}</TableCell>
              <TableCell>{row.primaryBranchName}</TableCell>
              <TableCell>{row.subdomain}</TableCell>
              <TableCell>{row.adminName}</TableCell>
              <TableCell>{row.userLimit}</TableCell>
              <TableCell>
                <Chip
                  label={row.status}
                  size="small"
                  color={STATUS_COLOR[row.status] ?? "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString()}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

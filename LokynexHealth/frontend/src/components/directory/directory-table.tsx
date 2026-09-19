"use client";

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

interface BaseRow {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
}

export function DirectoryTable<T extends BaseRow>({
  rows,
  extraColumn,
}: {
  rows: T[];
  extraColumn?: { header: string; render: (row: T) => React.ReactNode };
}) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No records found.
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
            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
            {extraColumn && (
              <TableCell sx={{ fontWeight: 600 }}>
                {extraColumn.header}
              </TableCell>
            )}
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
              <TableCell sx={{ fontWeight: 500 }}>{row.fullName}</TableCell>
              <TableCell>{row.phone}</TableCell>
              <TableCell>{row.email ?? "—"}</TableCell>
              {extraColumn && <TableCell>{extraColumn.render(row)}</TableCell>}
              <TableCell>
                <Chip
                  label={row.status}
                  size="small"
                  color={row.status === "Active" ? "success" : "default"}
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

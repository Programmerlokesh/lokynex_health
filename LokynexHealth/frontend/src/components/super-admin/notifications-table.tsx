"use client";

import { NotificationDto } from "@/types/super-admin";
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

export function NotificationsTable({ rows }: { rows: NotificationDto[] }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No notifications sent yet.
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
            <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Recipient</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Sent</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Read</TableCell>
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
              <TableCell sx={{ fontWeight: 500 }}>{row.title}</TableCell>
              <TableCell sx={{ maxWidth: 280 }}>{row.message}</TableCell>
              <TableCell>
                <Chip
                  label={row.tenantId ? "Specific Tenant" : "All Tenants"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Chip
                  label={row.isRead ? "Read" : "Unread"}
                  size="small"
                  color={row.isRead ? "default" : "primary"}
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

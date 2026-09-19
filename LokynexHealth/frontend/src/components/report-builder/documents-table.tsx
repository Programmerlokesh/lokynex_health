"use client";

import { useDeleteReportDocument } from "@/hooks/use-report-builder";
import { ReportDocumentDto } from "@/types/report-builder";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  IconButton,
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

export function DocumentsTable({
  rows,
  showDeleted,
  onEdit,
}: {
  rows: ReportDocumentDto[];
  showDeleted: boolean;
  onEdit: (doc: ReportDocumentDto) => void;
}) {
  const deleteDocument = useDeleteReportDocument();

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {showDeleted ? "No deleted documents." : "No documents generated yet."}
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
            <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Generated</TableCell>
            {!showDeleted && (
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            )}
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
              <TableCell sx={{ fontWeight: 500 }}>{row.orderNumber}</TableCell>
              <TableCell>{row.testName}</TableCell>
              <TableCell>{row.patientName}</TableCell>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString()}
              </TableCell>
              {!showDeleted && (
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onEdit(row)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deleteDocument.mutate(row.id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

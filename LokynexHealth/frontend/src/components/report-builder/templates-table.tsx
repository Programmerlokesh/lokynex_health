"use client";

import { useDeleteReportTemplate } from "@/hooks/use-report-builder";
import { ReportTemplateDto } from "@/types/report-builder";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import {
  Chip,
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

export function TemplatesTable({
  rows,
  showDeleted,
}: {
  rows: ReportTemplateDto[];
  showDeleted: boolean;
}) {
  const deleteTemplate = useDeleteReportTemplate();

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {showDeleted ? "No deleted templates." : "No templates created yet."}
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
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
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
              <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
              <TableCell>
                <Chip label={row.sourceType} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString()}
              </TableCell>
              {!showDeleted && (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deleteTemplate.mutate(row.id)}
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

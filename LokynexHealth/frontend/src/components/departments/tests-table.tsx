"use client";

import { TestDto } from "@/types/department";
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

export function TestsTable({ tests }: { tests: TestDto[] }) {
  if (tests.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No tests in this department yet.
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
            <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Doctor Comm.</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Referral Comm.</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Technician Comm.</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((test, i) => (
            <motion.tr
              key={test.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: i * 0.03 }}
              style={{ display: "table-row" }}
            >
              <TableCell sx={{ fontWeight: 500 }}>{test.name}</TableCell>
              <TableCell>₹{test.price.toFixed(2)}</TableCell>
              <TableCell>
                {test.doctorCommissionValue} ({test.doctorCommissionType})
              </TableCell>
              <TableCell>
                {test.referralCommissionValue} ({test.referralCommissionType})
              </TableCell>
              <TableCell>
                {test.technicianCommissionValue} (
                {test.technicianCommissionType})
              </TableCell>
              <TableCell>
                <Chip
                  label={test.status}
                  size="small"
                  color={test.status === "Active" ? "success" : "default"}
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

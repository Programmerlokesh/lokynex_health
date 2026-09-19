"use client";

import { BranchDto } from "@/types/branch";
import EditIcon from "@mui/icons-material/EditOutlined";
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
import { useState } from "react";
import { EditBranchDialog } from "./edit-branch-dialog";

export function BranchesTable({ branches }: { branches: BranchDto[] }) {
  const [editing, setEditing] = useState<BranchDto | null>(null);

  if (branches.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No branches found.
      </Typography>
    );
  }

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(23,43,77,0.06)" }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Branch Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map((branch, i) => (
              <motion.tr
                key={branch.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                style={{ display: "table-row" }}
              >
                <TableCell sx={{ fontWeight: 500 }}>
                  {branch.branchName}
                </TableCell>
                <TableCell>
                  <Chip
                    label={branch.branchCode}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{branch.branchPhone ?? "—"}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {branch.branchAddress ?? "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={branch.status}
                    size="small"
                    color={branch.status === "Active" ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setEditing(branch)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EditBranchDialog
        key={editing?.id ?? "closed"}
        branch={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

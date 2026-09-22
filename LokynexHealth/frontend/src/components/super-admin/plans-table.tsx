"use client";

import { EditPlanDialog } from "@/components/super-admin/edit-plan-dialog";
import { useDeletePlan } from "@/hooks/use-super-admin";
import { PlanDto } from "@/types/super-admin";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";

export function PlansTable({ rows }: { rows: PlanDto[] }) {
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null);
  const deletePlan = useDeletePlan();

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No plans created yet.
      </Typography>
    );
  }

  function handleDelete(plan: PlanDto) {
    if (
      !window.confirm(
        `Delete "${plan.name}"? If any lab already has a subscription on this plan, it will be deactivated instead of removed.`,
      )
    ) {
      return;
    }
    deletePlan.mutate(plan.id);
  }

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 16px rgba(23,43,77,0.06)",
          overflowX: "auto",
        }}
      >
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Billing Cycle</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Max Users</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Max Branches</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
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
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => setEditingPlan(row)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(row)}
                      disabled={deletePlan.isPending}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EditPlanDialog plan={editingPlan} onClose={() => setEditingPlan(null)} />
    </>
  );
}

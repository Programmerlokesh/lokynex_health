"use client";

import { useDeleteOrder } from "@/hooks/use-orders";
import { OrderListItemDto } from "@/types/order-list";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import RestoreIcon from "@mui/icons-material/RestoreOutlined";
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

const statusColor: Record<string, "success" | "warning" | "default"> = {
  Paid: "success",
  Partial: "warning",
  Open: "default",
};

export function OrderListTable({ orders }: { orders: OrderListItemDto[] }) {
  const deleteOrder = useDeleteOrder();

  if (orders.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No orders found.
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
            <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Tests</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Final Amount</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order, i) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: i * 0.03 }}
              style={{ display: "table-row" }}
            >
              <TableCell sx={{ fontWeight: 500 }}>
                {order.orderNumber}
              </TableCell>
              <TableCell>
                {order.patientName}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {order.patientPhone}
                </Typography>
              </TableCell>
              <TableCell>{order.branchName}</TableCell>
              <TableCell>{order.testCount}</TableCell>
              <TableCell>৳{order.finalAmount.toFixed(2)}</TableCell>
              <TableCell>৳{order.paidAmount.toFixed(2)}</TableCell>
              <TableCell>
                <Chip
                  label={
                    order.isComplimentary
                      ? "Complimentary"
                      : order.paymentStatus
                  }
                  size="small"
                  color={statusColor[order.paymentStatus] ?? "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                {!order.isDeleted ? (
                  <Tooltip title="Delete order">
                    <IconButton
                      size="small"
                      onClick={() => deleteOrder.mutate(order.id)}
                    >
                      <DeleteOutlinedIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Deleted">
                    <RestoreIcon
                      fontSize="small"
                      sx={{ color: "text.disabled" }}
                    />
                  </Tooltip>
                )}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

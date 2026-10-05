"use client";

import { useOrderPermissions } from "@/hooks/use-order-permissions";
import { useDeleteOrder, useRestoreOrder } from "@/hooks/use-orders";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatMoney } from "@/lib/format";
import { OrderListItemDto } from "@/types/order-list";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreIcon from "@mui/icons-material/RestoreOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

const statusColor: Record<string, "success" | "warning" | "default"> = {
  Paid: "success",
  Partial: "warning",
  Open: "default",
};

/** "Rahim · 05 Oct, 3:20 pm" — who and when, or a dash. */
function WhoWhen({
  name,
  at,
}: {
  name: string | null;
  at: string | null | undefined;
}) {
  if (!name && !at) return <>—</>;
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {name ?? "Unknown"}
      </Typography>
      {at && (
        <Typography variant="caption" color="text.secondary">
          {formatDateTime(at)}
        </Typography>
      )}
    </>
  );
}

function StatusChip({ order }: { order: OrderListItemDto }) {
  return (
    <Chip
      label={order.isComplimentary ? "Complimentary" : order.paymentStatus}
      size="small"
      color={statusColor[order.paymentStatus] ?? "default"}
      variant="outlined"
    />
  );
}

export function OrderListTable({ orders }: { orders: OrderListItemDto[] }) {
  const { canEdit, canDelete } = useOrderPermissions();
  const deleteOrder = useDeleteOrder();
  const restoreOrder = useRestoreOrder();
  const [toDelete, setToDelete] = useState<OrderListItemDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No orders found.
      </Typography>
    );
  }

  const deletedView = orders[0].isDeleted;

  function confirmDelete() {
    if (!toDelete) return;
    deleteOrder.mutate(toDelete.id, {
      onSuccess: () => setToDelete(null),
      onError: (e) => {
        setToDelete(null);
        setError(getApiErrorMessage(e, "Failed to delete order."));
      },
    });
  }

  function restore(id: string) {
    restoreOrder.mutate(id, {
      onError: (e) =>
        setError(getApiErrorMessage(e, "Failed to restore order.")),
    });
  }

  function renderActions(order: OrderListItemDto) {
    return (
      <Box sx={{ display: "inline-flex", gap: 0.25 }}>
        <Tooltip title="View details / print bill">
          <IconButton
            size="small"
            component={Link}
            href={`/orders/${order.id}`}
            aria-label="View order"
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!order.isDeleted && canEdit && (
          <Tooltip title="Edit order">
            <IconButton
              size="small"
              component={Link}
              href={`/orders/${order.id}/edit`}
              aria-label="Edit order"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {!order.isDeleted && canDelete && (
          <Tooltip title="Delete order">
            <IconButton
              size="small"
              aria-label="Delete order"
              onClick={() => setToDelete(order)}
            >
              <DeleteOutlinedIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
        {order.isDeleted && canDelete && (
          <Tooltip title="Restore order">
            <span>
              <IconButton
                size="small"
                aria-label="Restore order"
                disabled={restoreOrder.isPending}
                onClick={() => restore(order.id)}
              >
                <RestoreIcon fontSize="small" color="primary" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <>
      {/* ---------- md+: table ---------- */}
      <TableContainer
        component={Paper}
        sx={{
          display: { xs: "none", md: "block" },
          borderRadius: 3,
          boxShadow: "0 4px 16px rgba(23,43,77,0.06)",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Order / Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Tests
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Total
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Paid
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Due
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created by</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {deletedView ? "Deleted by" : "Last edited by"}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell>
                  <Link
                    href={`/orders/${o.id}`}
                    style={{ color: "inherit", fontWeight: 600 }}
                  >
                    {o.orderNumber}
                  </Link>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {formatDateTime(o.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {o.patientName}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {o.patientPhone}
                  </Typography>
                </TableCell>
                <TableCell>{o.branchName}</TableCell>
                <TableCell align="center">{o.testCount}</TableCell>
                <TableCell align="right">
                  {formatMoney(o.finalAmount)}
                </TableCell>
                <TableCell align="right">{formatMoney(o.paidAmount)}</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: o.dueAmount > 0 ? "error.main" : undefined }}
                >
                  {formatMoney(o.dueAmount)}
                </TableCell>
                <TableCell>
                  <StatusChip order={o} />
                </TableCell>
                <TableCell>
                  <WhoWhen name={o.createdByName} at={o.createdAt} />
                </TableCell>
                <TableCell>
                  {deletedView ? (
                    <WhoWhen name={o.deletedByName} at={o.deletedAt} />
                  ) : (
                    <WhoWhen name={o.updatedByName} at={o.updatedAt} />
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {renderActions(o)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---------- phones: one card per order, never a sideways scroll ---------- */}
      <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1.5 }}>
        {orders.map((o) => (
          <Paper key={o.id} sx={{ p: 1.75, borderRadius: 3 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Link
                  href={`/orders/${o.id}`}
                  style={{ color: "inherit", fontWeight: 700 }}
                >
                  {o.orderNumber}
                </Link>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {formatDateTime(o.createdAt)} · {o.branchName}
                </Typography>
              </Box>
              <StatusChip order={o} />
            </Box>

            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }} noWrap>
              {o.patientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {o.patientPhone} · {o.testCount} test
              {o.testCount === 1 ? "" : "s"}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                mt: 1.25,
                textAlign: "center",
                bgcolor: "action.hover",
                borderRadius: 2,
                py: 0.75,
              }}
            >
              {[
                ["Total", o.finalAmount, false],
                ["Paid", o.paidAmount, false],
                ["Due", o.dueAmount, o.dueAmount > 0],
              ].map(([label, value, warn]) => (
                <Box key={label as string}>
                  <Typography variant="caption" color="text.secondary">
                    {label as string}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: warn ? "error.main" : undefined,
                    }}
                  >
                    {formatMoney(value as number)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              Created by {o.createdByName ?? "—"}
              {deletedView
                ? ` · Deleted by ${o.deletedByName ?? "—"}${o.deletedAt ? `, ${formatDateTime(o.deletedAt)}` : ""}`
                : o.updatedByName
                  ? ` · Edited by ${o.updatedByName}${o.updatedAt ? `, ${formatDateTime(o.updatedAt)}` : ""}`
                  : ""}
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
              {renderActions(o)}
            </Box>
          </Paper>
        ))}
      </Box>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete order {toDelete?.orderNumber}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The order moves to the Deleted List with your name and the time. You
            can restore it from there at any moment.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteOrder.isPending}
          >
            {deleteOrder.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

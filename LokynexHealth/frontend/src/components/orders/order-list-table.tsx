"use client";

import { useOrderPermissions } from "@/hooks/use-order-permissions";
import { useDeleteOrder, useRestoreOrder } from "@/hooks/use-orders";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatMoney } from "@/lib/format";
import { OrderListItemDto } from "@/types/order-list";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import RestoreIcon from "@mui/icons-material/RestoreOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
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
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { useState } from "react";

type Tone = "success" | "warning" | "error" | "info";

const statusTone: Record<string, Tone> = {
  Paid: "success",
  Partial: "warning",
  Open: "error",
};

const rupee = (n: number) => `₹${formatMoney(n)}`;

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

function StatusPill({ order }: { order: OrderListItemDto }) {
  const tone: Tone = order.isComplimentary
    ? "info"
    : (statusTone[order.paymentStatus] ?? "info");
  return (
    <Box
      component="span"
      sx={{
        px: 1.25,
        py: 0.25,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: `${tone}.main`,
        bgcolor: (t) => alpha(t.palette[tone].main, 0.14),
      }}
    >
      {order.isComplimentary ? "Complimentary" : order.paymentStatus}
    </Box>
  );
}

function auditLine(o: OrderListItemDto): string {
  const parts = [`Created by ${o.createdByName ?? "—"}`];
  if (o.isDeleted) {
    parts.push(
      `Deleted by ${o.deletedByName ?? "—"}${o.deletedAt ? `, ${formatDateTime(o.deletedAt)}` : ""}`,
    );
  } else if (o.updatedByName) {
    parts.push(
      `Edited by ${o.updatedByName}${o.updatedAt ? `, ${formatDateTime(o.updatedAt)}` : ""}`,
    );
  }
  return parts.join(" · ");
}

export function OrderListTable({
  orders,
  view = "cards",
}: {
  orders: OrderListItemDto[];
  view?: "cards" | "table";
}) {
  const { canEdit, canDelete } = useOrderPermissions();
  const deleteOrder = useDeleteOrder();
  const restoreOrder = useRestoreOrder();
  const [toDelete, setToDelete] = useState<OrderListItemDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          No orders.
        </Typography>
      </Paper>
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

  /** Icon actions — used in the table view. */
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

  /** Button row at the bottom of a card: Details | (edit) | Pay | Delete. */
  function renderCardButtons(o: OrderListItemDto) {
    const canPay =
      !o.isDeleted && canEdit && o.dueAmount > 0 && !o.isComplimentary;

    return (
      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
        <Button
          component={Link}
          href={`/orders/${o.id}`}
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 3,
            borderColor: "divider",
            fontWeight: 700,
          }}
        >
          Details
        </Button>

        {!o.isDeleted && canEdit && (
          <Tooltip title="Edit order">
            <IconButton
              component={Link}
              href={`/orders/${o.id}/edit`}
              aria-label="Edit order"
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                flex: "0 0 auto",
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {!o.isDeleted && (
          <Button
            component={Link}
            href={`/orders/${o.id}/edit`}
            variant="outlined"
            color="primary"
            size="small"
            disabled={!canPay}
            startIcon={<PaymentsOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: 3,
              fontWeight: 700,
            }}
          >
            Pay
          </Button>
        )}

        {!o.isDeleted && canDelete && (
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setToDelete(o)}
            sx={{ flex: 1, minWidth: 0, borderRadius: 3, fontWeight: 700 }}
          >
            Delete
          </Button>
        )}

        {o.isDeleted && canDelete && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            disabled={restoreOrder.isPending}
            startIcon={<RestoreIcon sx={{ fontSize: 16 }} />}
            onClick={() => restore(o.id)}
            sx={{ flex: 1, minWidth: 0, borderRadius: 3, fontWeight: 700 }}
          >
            Restore
          </Button>
        )}
      </Box>
    );
  }

  return (
    <>
      {/* ---------- Table view (md+ only) ---------- */}
      <TableContainer
        component={Paper}
        sx={{
          display: { xs: "none", md: view === "table" ? "block" : "none" },
          borderRadius: 4,
          boxShadow: "0 6px 20px rgba(23,43,77,0.06)",
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
                  <StatusPill order={o} />
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

      {/* ---------- Cards view (always on phones/tablets) ---------- */}
      <Box
        sx={{
          display: { xs: "grid", md: view === "cards" ? "grid" : "none" },
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(auto-fill, minmax(300px, 1fr))",
          },
          gap: 2,
        }}
      >
        {orders.map((o) => (
          <Paper
            key={o.id}
            sx={{
              p: 2,
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              minWidth: 0,
              boxShadow: "0 6px 20px rgba(23,43,77,0.06)",
              transition: "box-shadow .15s ease",
              "&:hover": { boxShadow: "0 10px 28px rgba(23,43,77,0.12)" },
            }}
          >
            {/* top: order no + status */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Link
                  href={`/orders/${o.id}`}
                  style={{
                    color: "inherit",
                    fontWeight: 800,
                    fontSize: 16,
                    textDecoration: "none",
                  }}
                >
                  {o.orderNumber}
                </Link>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontWeight: 600 }}
                >
                  {formatDateTime(o.createdAt)} · {o.branchName} · {o.testCount}{" "}
                  test{o.testCount === 1 ? "" : "s"}
                </Typography>
              </Box>
              <StatusPill order={o} />
            </Box>

            {/* patient */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  flex: "0 0 auto",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "primary.main",
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                }}
              >
                <PersonOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {o.patientName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {o.patientPhone}
                </Typography>
              </Box>
            </Box>

            {/* doctor / referral */}
            {(o.doctorName || o.referralName) && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                {o.doctorName ? `Dr: ${o.doctorName}` : ""}
                {o.doctorName && o.referralName ? " · " : ""}
                {o.referralName ? `Ref: ${o.referralName}` : ""}
              </Typography>
            )}

            {/* money */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1,
                bgcolor: "action.hover",
                borderRadius: 3,
                px: 1.25,
                py: 1,
              }}
            >
              {(
                [
                  ["Total", o.finalAmount, "text.primary"],
                  ["Paid", o.paidAmount, "success.main"],
                  [
                    "Due",
                    o.dueAmount,
                    o.dueAmount > 0 ? "error.main" : "text.primary",
                  ],
                ] as const
              ).map(([label, value, color]) => (
                <Box key={label} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{ fontWeight: 800, fontSize: 14.5, color }}
                  >
                    {rupee(value)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {auditLine(o)}
            </Typography>

            {renderCardButtons(o)}
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

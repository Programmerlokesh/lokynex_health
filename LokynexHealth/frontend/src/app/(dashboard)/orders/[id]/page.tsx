"use client";

import { OrderFlowIcon } from "@/components/icons/lab-icons";
import { BillDialog } from "@/components/orders/bill-dialog";
import { brand } from "@/components/providers/mui-theme-provider";
import { useOrderPermissions } from "@/hooks/use-order-permissions";
import { useDeleteOrder, useOrder, useRestoreOrder } from "@/hooks/use-orders";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatMoney } from "@/lib/format";
import { OrderInvoiceDto } from "@/types/order";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RestoreIcon from "@mui/icons-material/RestoreOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_COLOR: Record<string, "success" | "warning" | "default"> = {
  Paid: "success",
  Partial: "warning",
  Open: "default",
};

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.6 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, height: "100%" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useOrder(params.id ?? null);
  const [billOpen, setBillOpen] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError || !data) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(error, "Failed to load order.")}
      </Alert>
    );
  }

  return <Details data={data} billOpen={billOpen} setBillOpen={setBillOpen} />;
}

function Details({
  data,
  billOpen,
  setBillOpen,
}: {
  data: OrderInvoiceDto;
  billOpen: boolean;
  setBillOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const { canEdit, canDelete } = useOrderPermissions();
  const deleteOrder = useDeleteOrder();
  const restoreOrder = useRestoreOrder();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const actionError = deleteOrder.error ?? restoreOrder.error;

  const ageGender = [
    data.patientAge != null ? `${data.patientAge} yrs` : null,
    data.patientGender,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <Box>
      {data.isDeleted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This order was deleted
          {data.deletedByName ? ` by ${data.deletedByName}` : ""}
          {data.deletedAt ? ` on ${formatDateTime(data.deletedAt)}` : ""}. It
          does not count in reports, ledger or commissions until restored.
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(actionError, "Action failed.")}
        </Alert>
      )}

      {/* Header + actions (wraps on phones) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            bgcolor: "#FFEDD5",
            color: brand.orange,
            p: 1,
            borderRadius: 2,
            display: "flex",
          }}
        >
          <OrderFlowIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>
            Order {data.billNo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data.invoiceNo} · {formatDateTime(data.billDate)}
          </Typography>
        </Box>
        <Chip
          label={data.isComplimentary ? "Complimentary" : data.paymentStatus}
          color={STATUS_COLOR[data.paymentStatus] ?? "default"}
          variant="outlined"
        />
      </Box>

      <Box
        sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: { xs: 2, sm: 3 } }}
      >
        <Button
          variant="contained"
          startIcon={<ReceiptLongOutlinedIcon />}
          onClick={() => setBillOpen(true)}
          sx={{ flexGrow: { xs: 1, sm: 0 } }}
        >
          Generate Bill
        </Button>
        {!data.isDeleted && canEdit && (
          <Button
            component={Link}
            href={`/orders/${data.id}/edit`}
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
          >
            Edit
          </Button>
        )}
        {!data.isDeleted && canDelete && (
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlinedIcon />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        )}
        {data.isDeleted && canDelete && (
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            disabled={restoreOrder.isPending}
            onClick={() => restoreOrder.mutate(data.id)}
          >
            Restore
          </Button>
        )}
        <Button
          component={Link}
          href="/orders/new"
          variant="outlined"
          startIcon={<AddIcon />}
        >
          New order
        </Button>
        <Button component={Link} href="/orders" startIcon={<ArrowBackIcon />}>
          All orders
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card title="Company">
            <KV label="Company" value={data.companyName} />
            <KV label="Company type" value={data.companyType} />
            <KV label="Branch" value={data.branchName} />
            <KV label="Invoice No" value={data.invoiceNo} />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card title="Invoice">
            <KV label="Bill No" value={data.billNo} />
            <KV label="Bill Date/Time" value={formatDateTime(data.billDate)} />
            <KV label="Payment Mode" value={data.paymentMode} />
            <KV label="Profile Guardian" value={data.guardianName || "—"} />
            <KV
              label="Created by"
              value={`${data.createdByName ?? "—"} · ${formatDateTime(data.createdAt)}`}
            />
            {data.updatedAt && (
              <KV
                label="Last edited by"
                value={`${data.updatedByName ?? "—"} · ${formatDateTime(data.updatedAt)}`}
              />
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card title="Patient details">
            <Grid container columnSpacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <KV label="Name" value={data.patientName} />
                <KV label="Age / Gender" value={ageGender || "—"} />
                <KV label="Phone" value={data.patientPhone} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <KV label="Doctor" value={data.doctor?.name ?? "—"} />
                <KV label="Referral" value={data.referral?.name ?? "—"} />
                {data.relationship && (
                  <KV
                    label="Relation with guardian"
                    value={data.relationship}
                  />
                )}
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card title="Tests">
            {/* md+: real table. Phones: stacked rows, never a sideways scroll. */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 3fr 1fr 1fr 1fr",
                  gap: 1,
                  py: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <span>Invoice No</span>
                <span>Test Description</span>
                <Box sx={{ textAlign: "right" }}>Rate</Box>
                <Box sx={{ textAlign: "right" }}>Less</Box>
                <Box sx={{ textAlign: "right" }}>Amount</Box>
              </Box>
              {data.lines.map((l) => (
                <Box
                  key={l.testId}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 3fr 1fr 1fr 1fr",
                    gap: 1,
                    py: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                    fontSize: 14,
                  }}
                >
                  <span>{data.invoiceNo}</span>
                  <span>{l.description}</span>
                  <Box sx={{ textAlign: "right" }}>{formatMoney(l.rate)}</Box>
                  <Box sx={{ textAlign: "right" }}>{formatMoney(l.less)}</Box>
                  <Box sx={{ textAlign: "right", fontWeight: 600 }}>
                    {formatMoney(l.amount)}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: { xs: "block", md: "none" } }}>
              {data.lines.map((l, i) => (
                <Box key={l.testId}>
                  {i > 0 && <Divider />}
                  <Box sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {l.description}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Rate {formatMoney(l.rate)} · Less {formatMoney(l.less)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatMoney(l.amount)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card title="Amount">
            <KV label="Subtotal" value={formatMoney(data.subtotal)} />
            <KV label="Discount" value={formatMoney(data.discount)} />
            <Divider sx={{ my: 0.5 }} />
            <KV label="Total" value={formatMoney(data.total)} />
            <KV label="Paid" value={formatMoney(data.paid)} />
            <KV label="Due" value={formatMoney(data.due)} />
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
          <Card title="Payments">
            {data.payments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No payment received yet.
              </Typography>
            ) : (
              data.payments.map((p) => (
                <KV
                  key={p.method}
                  label={p.method}
                  value={formatMoney(p.amount)}
                />
              ))
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card title="History">
            {data.history.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Created by {data.createdByName ?? "—"} on{" "}
                {formatDateTime(data.createdAt)}. No edits yet.
              </Typography>
            ) : (
              data.history.map((h, i) => (
                <Box key={`${h.changedAt}-${i}`}>
                  {i > 0 && <Divider />}
                  <Box sx={{ py: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Chip
                        size="small"
                        label={h.action}
                        color={
                          h.action === "Delete"
                            ? "error"
                            : h.action === "Restore"
                              ? "success"
                              : "default"
                        }
                        variant="outlined"
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {h.changedByName ?? "Unknown"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(h.changedAt)}
                      </Typography>
                    </Box>
                    {h.summary && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, wordBreak: "break-word" }}
                      >
                        {h.summary}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete order {data.billNo}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            It moves to the Deleted List with your name and the time. You can
            restore it from there.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteOrder.isPending}
            onClick={() =>
              deleteOrder.mutate(data.id, {
                onSuccess: () => router.push("/orders"),
                onSettled: () => setConfirmDelete(false),
              })
            }
          >
            {deleteOrder.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <BillDialog
        open={billOpen}
        onClose={() => setBillOpen(false)}
        data={data}
      />
    </Box>
  );
}

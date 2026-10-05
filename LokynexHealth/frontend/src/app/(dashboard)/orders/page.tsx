"use client";

import { OrderFlowIcon } from "@/components/icons/lab-icons";
import {
  FilterState,
  initialFilters,
  OrderFilters,
} from "@/components/orders/order-filters";
import { OrderListTable } from "@/components/orders/order-list-table";
import { OrderReportDialog } from "@/components/orders/order-report-dialog";
import { brand } from "@/components/providers/mui-theme-provider";
import { useBranches } from "@/hooks/use-branches";
import { useExportOrders, useOrders } from "@/hooks/use-orders";
import { getApiErrorMessage } from "@/lib/api-error";
import { toDateInputValue } from "@/lib/format";
import { buildOrderReportHtml } from "@/lib/order-report";
import { OrderListFilters } from "@/types/order-list";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Pagination,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const PAGE_SIZE = 20;

const dmy = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function OrderListPage() {
  // `applied` is what the server is queried with. The text boxes keep their own
  // draft inside <OrderFilters>, so typing never fires a request.
  const [applied, setApplied] = useState<FilterState>(initialFilters);
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  const { data: branches } = useBranches({ pageSize: 100 });
  const exportOrders = useExportOrders();

  // Stable object => React Query only refetches when something really changed.
  const baseFilters = useMemo<OrderListFilters>(
    () => ({
      dateFrom: applied.dateFrom || undefined,
      dateTo: applied.dateTo || undefined,
      tzOffsetMinutes: -new Date().getTimezoneOffset(),
      branchId: applied.branchId || undefined,
      paymentMethod: applied.paymentMethod,
      paymentStatus: applied.paymentStatus,
      search: applied.search || undefined,
      orderNumber: applied.orderNumber || undefined,
      showDeleted,
    }),
    [applied, showDeleted],
  );

  const listFilters = useMemo(
    () => ({ ...baseFilters, pageNumber: page, pageSize: PAGE_SIZE }),
    [baseFilters, page],
  );

  const { data, isLoading, isFetching, isError } = useOrders(listFilters);

  function handleApply(next: FilterState) {
    setApplied(next);
    setPage(1); // a new filter must never leave you on an empty page 7
  }

  function handleTab(deleted: boolean) {
    setShowDeleted(deleted);
    setPage(1);
  }

  function filterLines(): string[] {
    const lines: string[] = [
      showDeleted ? "List: Deleted orders" : "List: Orders",
    ];
    if (applied.dateFrom || applied.dateTo) {
      lines.push(
        `Date: ${applied.dateFrom ? dmy(applied.dateFrom) : "Start"} – ${applied.dateTo ? dmy(applied.dateTo) : toDateLabelToday()}`,
      );
    }
    const branch = branches?.items.find((b) => b.id === applied.branchId);
    if (branch) lines.push(`Branch: ${branch.branchName}`);
    if (applied.paymentMethod !== "Any")
      lines.push(`Payment method: ${applied.paymentMethod}`);
    if (applied.paymentStatus !== "Any")
      lines.push(`Payment status: ${applied.paymentStatus}`);
    if (applied.orderNumber) lines.push(`Order ID: ${applied.orderNumber}`);
    if (applied.search) lines.push(`Patient: ${applied.search}`);
    return lines;
  }

  function handleDownload() {
    exportOrders.mutate(baseFilters, {
      onSuccess: (result) =>
        setReportHtml(
          buildOrderReportHtml(result, {
            title: showDeleted ? "Deleted Orders Report" : "Orders Report",
            filterLines: filterLines(),
          }),
        ),
    });
  }

  return (
    <Box>
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
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {showDeleted ? "Deleted Orders" : "Order List"}
        </Typography>
        <Button
          variant="outlined"
          startIcon={
            exportOrders.isPending ? (
              <CircularProgress size={16} />
            ) : (
              <PictureAsPdfOutlinedIcon />
            )
          }
          disabled={exportOrders.isPending}
          onClick={handleDownload}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Download PDF
        </Button>
      </Box>

      <Tabs
        value={showDeleted ? 1 : 0}
        onChange={(_, v) => handleTab(v === 1)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Orders" />
        <Tab label="Deleted List" />
      </Tabs>

      <OrderFilters onApply={handleApply} />

      {exportOrders.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(
            exportOrders.error,
            "Failed to build the report.",
          )}
        </Alert>
      )}

      {isFetching && !isLoading && (
        <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />
      )}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && <Alert severity="error">Failed to load orders.</Alert>}
      {data && (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            {data.totalCount} order{data.totalCount === 1 ? "" : "s"} found
          </Typography>
          <OrderListTable orders={data.items} />
          {data.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
              <Pagination
                count={data.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                siblingCount={0}
              />
            </Box>
          )}
        </>
      )}

      <OrderReportDialog
        open={reportHtml !== null}
        onClose={() => setReportHtml(null)}
        html={reportHtml ?? ""}
      />
    </Box>
  );
}

function toDateLabelToday() {
  return dmy(toDateInputValue(new Date()));
}

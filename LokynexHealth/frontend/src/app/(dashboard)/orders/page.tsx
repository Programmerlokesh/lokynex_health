"use client";

import { OrderFlowIcon } from "@/components/icons/lab-icons";
import {
  OrderActionsMenu,
  OrderView,
  QuickRange,
} from "@/components/orders/order-actions-menu";
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
import { formatMoney, toDateInputValue } from "@/lib/format";
import { buildOrderReportHtml } from "@/lib/order-report";
import { OrderListFilters } from "@/types/order-list";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import {
  Alert,
  Box,
  CircularProgress,
  LinearProgress,
  Pagination,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";

const PAGE_SIZE = 20;

const dmy = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

type PillTone = "primary" | "success" | "error" | "info";

function StatPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: PillTone;
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: tone ? `${tone}.main` : "text.primary",
        bgcolor: (t) =>
          tone ? alpha(t.palette[tone].main, 0.1) : t.palette.action.hover,
        "& svg": { fontSize: 16 },
      }}
    >
      {icon}
      <span>{label}</span>
      <span>{value}</span>
    </Box>
  );
}

export default function OrderListPage() {
  // `applied` is what the server is queried with. The text boxes keep their own
  // draft inside <OrderFilters>, so typing never fires a request.
  const [applied, setApplied] = useState<FilterState>(initialFilters);
  const [showDeleted, setShowDeleted] = useState(false);
  const [view, setView] = useState<OrderView>("cards");
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

  // Totals of the orders on screen (the list API returns rows, not sums).
  const totals = useMemo(() => {
    const items = data?.items ?? [];
    return items.reduce(
      (acc, o) => ({
        total: acc.total + o.finalAmount,
        paid: acc.paid + o.paidAmount,
        due: acc.due + o.dueAmount,
      }),
      { total: 0, paid: 0, due: 0 },
    );
  }, [data]);

  function handleApply(next: FilterState) {
    setApplied(next);
    setPage(1); // a new filter must never leave you on an empty page 7
  }

  function handleShowDeleted(deleted: boolean) {
    setShowDeleted(deleted);
    setPage(1);
  }

  function handleRange(range: QuickRange) {
    const now = new Date();
    const to = toDateInputValue(now);
    let from = to;
    if (range === "week") {
      // Monday of this week
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      from = toDateInputValue(start);
    } else if (range === "month") {
      from = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    setApplied((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
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

  const rangeLabel =
    applied.dateFrom || applied.dateTo
      ? `${applied.dateFrom ? dmy(applied.dateFrom) : "Start"} → ${applied.dateTo ? dmy(applied.dateTo) : toDateLabelToday()}`
      : "All dates";

  const multiPage = (data?.totalPages ?? 1) > 1;
  const prefix = multiPage ? "Page " : "";

  return (
    <Box>
      {/* ---------- header card ---------- */}
      <Paper
        sx={{
          p: { xs: 1.75, sm: 2.5 },
          borderRadius: 4,
          mb: 2.5,
          boxShadow: "0 6px 20px rgba(23,43,77,0.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* title */}
          <Box
            sx={{
              order: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: 0,
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            <Box
              sx={{
                bgcolor: "#FFEDD5",
                color: brand.orange,
                p: 1,
                borderRadius: 2.5,
                display: "flex",
                flex: "0 0 auto",
              }}
            >
              <OrderFlowIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, lineHeight: 1.15 }}
              >
                {showDeleted ? "Deleted Orders" : "Order List"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, display: "block" }}
              >
                {showDeleted ? "Deleted List" : "Active List"} •{" "}
                {view === "cards" ? "Cards" : "Table"} View • {rangeLabel}
              </Typography>
            </Box>
          </Box>

          {/* stat pills */}
          <Box
            sx={{
              order: { xs: 3, md: 2 },
              flex: { xs: "1 1 100%", md: "1 1 320px" },
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
            }}
          >
            <StatPill
              icon={<FormatListBulletedIcon />}
              label="Found"
              value={String(data?.totalCount ?? 0)}
            />
            <StatPill
              icon={<PaymentsOutlinedIcon />}
              label={`${prefix}Total`}
              value={`₹${formatMoney(totals.total)}`}
            />
            <StatPill
              icon={<CheckCircleOutlinedIcon />}
              label={`${prefix}Paid`}
              value={`₹${formatMoney(totals.paid)}`}
              tone="success"
            />
            <StatPill
              icon={<ErrorOutlinedIcon />}
              label={`${prefix}Due`}
              value={`₹${formatMoney(totals.due)}`}
              tone={totals.due > 0 ? "error" : undefined}
            />
          </Box>

          {/* actions */}
          <Box sx={{ order: { xs: 2, md: 3 } }}>
            <OrderActionsMenu
              showDeleted={showDeleted}
              view={view}
              downloading={exportOrders.isPending}
              onShowDeleted={handleShowDeleted}
              onView={setView}
              onRange={handleRange}
              onDownload={handleDownload}
            />
          </Box>
        </Box>
      </Paper>

      {/* ---------- filters ---------- */}
      <OrderFilters applied={applied} onApply={handleApply} />

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
          <OrderListTable orders={data.items} view={view} />
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

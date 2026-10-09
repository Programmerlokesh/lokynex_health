"use client";

import { ReportIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import {
  Pill,
  PillButton,
} from "@/components/report-builder/report-toolbar-ui";
import { OrderReportFilters } from "@/components/reports/order-report-filters";
import { cardSx } from "@/components/reports/report-shell";
import { useOrdersForReport } from "@/hooks/use-report-builder";
import { formatDateTime } from "@/lib/format";
import {
  activeOrderRange,
  countActiveOrderFilters,
  initialOrderFilters,
  OrderFilterState,
  toQueryParams,
} from "@/lib/order-report-filters";
import { QuickRange, rangeFor } from "@/lib/report-builder-filters";
import { OrderForReportDto } from "@/types/report-builder";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import Link from "next/link";
import { useMemo, useState } from "react";

const PAGE_SIZE = 18;
type ViewMode = "cards" | "table";

export default function UploadReportPage() {
  const [view, setView] = useState<ViewMode>("cards");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [applied, setApplied] = useState<OrderFilterState>(initialOrderFilters);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      ...toQueryParams(applied),
      pageNumber: page,
      pageSize: PAGE_SIZE,
    }),
    [applied, page],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useOrdersForReport(params);

  const rows = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const pending = data?.pendingCount ?? 0;
  const reported = data?.reportedCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const activeFilters = countActiveOrderFilters(applied);
  const quick = activeOrderRange(applied);

  function applyFilters(f: OrderFilterState) {
    setApplied(f);
    setPage(1);
  }

  function toggleQuick(r: QuickRange) {
    applyFilters(
      quick === r
        ? { ...applied, dateFrom: "", dateTo: "" }
        : { ...applied, ...rangeFor(r) },
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ───────── Header card: title, summary pills, mode buttons ───────── */}
      <Box
        sx={{
          ...cardSx,
          p: { xs: 2, sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                bgcolor: "#FEF3C7",
                color: brand.orange,
                p: 1.1,
                borderRadius: "16px",
                display: "flex",
              }}
            >
              <ReportIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mr: 0.5 }}>
              Upload Report
            </Typography>
            <Pill>{total} found</Pill>
            <Pill tone="warning">Pending {pending}</Pill>
            <Pill tone="success">Reported {reported}</Pill>
            <Pill>Mode: {view.toUpperCase()}</Pill>
            {activeFilters > 0 && (
              <Pill tone="info">Filters {activeFilters}</Pill>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <PillButton
              active={applied.status === "Pending"}
              onClick={() =>
                applyFilters({
                  ...applied,
                  status: applied.status === "Pending" ? "Any" : "Pending",
                })
              }
            >
              Pending only
            </PillButton>
            <PillButton
              active={view === "cards"}
              onClick={() => setView("cards")}
            >
              Cards
            </PillButton>
            <PillButton
              active={view === "table"}
              onClick={() => setView("table")}
            >
              Table
            </PillButton>
            <PillButton
              active={quick === "today"}
              onClick={() => toggleQuick("today")}
            >
              Day
            </PillButton>
            <PillButton
              active={quick === "week"}
              onClick={() => toggleQuick("week")}
            >
              Week
            </PillButton>
            <PillButton
              active={quick === "month"}
              onClick={() => toggleQuick("month")}
            >
              Month
            </PillButton>
            <PillButton
              variant="primary"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <FilterListIcon sx={{ fontSize: 14 }} />
              {filtersOpen ? "Hide Filters" : "Filters"}
            </PillButton>
            <PillButton onClick={() => void refetch()} title="Reload orders">
              <RefreshIcon sx={{ fontSize: 14 }} />
              {isFetching ? "Loading..." : "Refresh"}
            </PillButton>
          </Box>
        </Box>
      </Box>

      {/* ───────── Filter panel ───────── */}
      <OrderReportFilters
        key={JSON.stringify(applied)}
        open={filtersOpen}
        applied={applied}
        onApply={applyFilters}
      />

      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Could not load orders.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No orders found for these filters. New orders appear here as soon as
          they are created.
        </Typography>
      ) : view === "cards" ? (
        <OrderCards rows={rows} />
      ) : (
        <OrderTable rows={rows} />
      )}

      {totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            sx={{ borderRadius: "999px" }}
          >
            Previous
          </Button>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            sx={{ borderRadius: "999px" }}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}

function OrderCards({ rows }: { rows: OrderForReportDto[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)",
        },
      }}
    >
      {rows.map((o, i) => {
        const done =
          o.items.length > 0 && o.items.every((t) => t.reportCount > 0);
        return (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.03 }}
            style={{ display: "flex" }}
          >
            <Box
              sx={{
                ...cardSx,
                flex: 1,
                minWidth: 0,
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                    Order #{o.orderNumber}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    {formatDateTime(o.createdAt)}
                    {o.branchName ? ` • ${o.branchName}` : ""} •{" "}
                    {o.items.length} tests
                  </Typography>
                </Box>
                <Pill tone={done ? "success" : "warning"}>
                  {done ? "Report Ready" : "Pending"}
                </Pill>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>
                  {o.patientName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  {o.patientPhone}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {o.items.map((t) => (
                  <Pill
                    key={t.id}
                    tone={t.reportCount > 0 ? "success" : "warning"}
                  >
                    {t.testName} {t.reportCount > 0 ? "✓" : "· pending"}
                  </Pill>
                ))}
              </Box>

              <Button
                component={Link}
                href={`/reports/order/${o.id}`}
                variant="contained"
                sx={{
                  mt: "auto",
                  borderRadius: "999px",
                  py: 1,
                  fontWeight: 800,
                }}
              >
                {done ? "View Reports" : "Open Reports"}
              </Button>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
}

function OrderTable({ rows }: { rows: OrderForReportDto[] }) {
  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(23,43,77,0.06)" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tests</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((o) => {
            const done =
              o.items.length > 0 && o.items.every((t) => t.reportCount > 0);
            return (
              <TableRow key={o.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{o.orderNumber}</TableCell>
                <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                <TableCell>{o.patientName}</TableCell>
                <TableCell>{o.patientPhone}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {o.items.map((t) => (
                      <Pill
                        key={t.id}
                        tone={t.reportCount > 0 ? "success" : "warning"}
                      >
                        {t.testName} {t.reportCount > 0 ? "✓" : ""}
                      </Pill>
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Pill tone={done ? "success" : "warning"}>
                    {done ? "Report Ready" : "Pending"}
                  </Pill>
                </TableCell>
                <TableCell align="right">
                  <Button
                    component={Link}
                    href={`/reports/order/${o.id}`}
                    size="small"
                    variant="contained"
                    sx={{ borderRadius: "999px", fontWeight: 800 }}
                  >
                    {done ? "View" : "Open"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

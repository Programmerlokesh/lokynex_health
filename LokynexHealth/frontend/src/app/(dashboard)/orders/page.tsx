"use client";

import { OrderFlowIcon } from "@/components/icons/lab-icons";
import { FilterState, OrderFilters } from "@/components/orders/order-filters";
import { OrderListTable } from "@/components/orders/order-list-table";
import { brand } from "@/components/providers/mui-theme-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useOrders } from "@/hooks/use-orders";
import {
  Alert,
  Box,
  CircularProgress,
  Pagination,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const initialFilters: FilterState = {
  dateFrom: "",
  dateTo: "",
  branchId: "",
  paymentStatus: "Any",
  search: "",
  orderNumber: "",
  showDeleted: false,
};

export default function OrderListPage() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.search, 400);
  const debouncedOrderNumber = useDebounce(filters.orderNumber, 400);

  function handleFilterChange(patch: Partial<FilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1); // any filter change resets to page 1 — avoids landing on an empty page
  }

  // Stable object reference unless a dependency actually changes — prevents
  // React Query from treating every keystroke-triggered re-render as a new query.
  const queryFilters = useMemo(
    () => ({
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      branchId: filters.branchId || undefined,
      paymentStatus: filters.paymentStatus,
      patientNameContains: debouncedSearch || undefined,
      orderNumber: debouncedOrderNumber || undefined,
      showDeleted: filters.showDeleted,
      pageNumber: page,
      pageSize: 20,
    }),
    [filters, debouncedSearch, debouncedOrderNumber, page],
  );

  const { data, isLoading, isError } = useOrders(queryFilters);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {filters.showDeleted ? "Deleted Orders" : "Order List"}
        </Typography>
      </Box>

      <OrderFilters filters={filters} onChange={handleFilterChange} />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && <Alert severity="error">Failed to load orders.</Alert>}
      {data && (
        <>
          <OrderListTable orders={data.items} />
          {data.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
              <Pagination
                count={data.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

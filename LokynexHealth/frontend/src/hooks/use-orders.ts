import {
  createOrderApi,
  deleteOrderApi,
  exportOrdersApi,
  getOrderByIdApi,
  getOrderForEditApi,
  getOrdersApi,
  restoreOrderApi,
  updateOrderApi,
} from "@/lib/api/orders";
import { CreateOrderRequest } from "@/types/order";
import { OrderListFilters } from "@/types/order-list";
import {
  keepPreviousData,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * BUG FIX: the Upload Report page / Generate dialog read orders through their own
 * cache keys. They were never invalidated, so a fresh order stayed invisible
 * (staleTime = 60s). Every order mutation now clears them too.
 */
function invalidateReportLookups(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["report-orders"] });
  qc.invalidateQueries({ queryKey: ["order-items-lookup"] });
  qc.invalidateQueries({ queryKey: ["report-documents"] });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // A new family member may have been registered — refresh phone search.
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      invalidateReportLookups(queryClient);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOrderRequest }) =>
      updateOrderApi(id, data),
    onSuccess: () => {
      // Covers the list, the details page and the edit form (all keyed "orders").
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      invalidateReportLookups(queryClient);
    },
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrderByIdApi(id!),
    enabled: !!id,
  });
}

export function useOrderForEdit(id: string | null) {
  return useQuery({
    queryKey: ["orders", "edit", id],
    queryFn: () => getOrderForEditApi(id!),
    enabled: !!id,
    gcTime: 0, // always open the form with fresh data
  });
}

export function useOrders(filters: OrderListFilters) {
  return useQuery({
    queryKey: ["orders", "list", filters],
    queryFn: () => getOrdersApi(filters),
    // Keep the old rows on screen while the next page / filter loads: no flicker.
    placeholderData: keepPreviousData,
  });
}

export function useExportOrders() {
  return useMutation({ mutationFn: exportOrdersApi });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      invalidateReportLookups(queryClient);
    },
  });
}

export function useRestoreOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      invalidateReportLookups(queryClient);
    },
  });
}

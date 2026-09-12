import { createOrderApi, deleteOrderApi, getOrdersApi } from "@/lib/api/orders";
import { OrderListFilters } from "@/types/order-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrderApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useOrders(filters: OrderListFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => getOrdersApi(filters),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrderApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

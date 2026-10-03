import {
  createOrderApi,
  deleteOrderApi,
  getOrderByIdApi,
  getOrdersApi,
} from "@/lib/api/orders";
import { OrderListFilters } from "@/types/order-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // A new family member may have been registered — refresh phone search.
      queryClient.invalidateQueries({ queryKey: ["patients"] });
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

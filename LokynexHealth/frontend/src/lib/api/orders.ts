import { apiClient } from "@/lib/api-client";
import { CreateOrderRequest } from "@/types/order";
import { OrderListFilters, OrderListItemDto } from "@/types/order-list";
import { PagedResult } from "@/types/user";

export async function createOrderApi(
  data: CreateOrderRequest,
): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>("/Orders", data);
  return response.data;
}

export async function getOrdersApi(
  filters: OrderListFilters,
): Promise<PagedResult<OrderListItemDto>> {
  const response = await apiClient.get<PagedResult<OrderListItemDto>>(
    "/Orders",
    { params: filters },
  );
  return response.data;
}

export async function deleteOrderApi(id: string): Promise<void> {
  await apiClient.delete(`/Orders/${id}`);
}

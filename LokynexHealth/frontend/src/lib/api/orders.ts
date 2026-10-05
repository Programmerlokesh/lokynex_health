import { apiClient } from "@/lib/api-client";
import {
  CreateOrderRequest,
  OrderEditDto,
  OrderInvoiceDto,
} from "@/types/order";
import {
  OrderExportDto,
  OrderListFilters,
  OrderListItemDto,
} from "@/types/order-list";
import { PagedResult } from "@/types/user";

export async function createOrderApi(
  data: CreateOrderRequest,
): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>("/Orders", data);
  return response.data;
}

export async function updateOrderApi(
  id: string,
  data: CreateOrderRequest,
): Promise<void> {
  await apiClient.put(`/Orders/${id}`, data);
}

export async function getOrderByIdApi(id: string): Promise<OrderInvoiceDto> {
  const response = await apiClient.get<OrderInvoiceDto>(`/Orders/${id}`);
  return response.data;
}

export async function getOrderForEditApi(id: string): Promise<OrderEditDto> {
  const response = await apiClient.get<OrderEditDto>(`/Orders/${id}/edit`);
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

/** Same filters as the list, without paging. */
export async function exportOrdersApi(
  filters: OrderListFilters,
): Promise<OrderExportDto> {
  const { pageNumber: _p, pageSize: _s, ...rest } = filters;
  void _p;
  void _s;
  const response = await apiClient.get<OrderExportDto>("/Orders/export", {
    params: rest,
  });
  return response.data;
}

export async function deleteOrderApi(id: string): Promise<void> {
  await apiClient.delete(`/Orders/${id}`);
}

export async function restoreOrderApi(id: string): Promise<void> {
  await apiClient.post(`/Orders/${id}/restore`);
}

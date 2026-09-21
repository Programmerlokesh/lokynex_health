import { superAdminApiClient as apiClient } from "@/lib/superadmin-api-client";
import {
  AddLabBranchRequest,
  CreateLabRequest,
  CreatePlanRequest,
  CreateSubscriptionRequest,
  LabDetailDto,
  LabDto,
  NotificationDto,
  PlanDto,
  SendNotificationRequest,
  SendRenewalReminderRequest,
  SubscriptionDto,
  UpdateLabRequest,
} from "@/types/super-admin";
import { PagedResult } from "@/types/user";

// ---- Labs ----
export async function getLabsApi(params: {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<LabDto>> {
  const res = await apiClient.get<PagedResult<LabDto>>("/Labs", { params });
  return res.data;
}

export async function getLabByIdApi(id: string): Promise<LabDetailDto> {
  const res = await apiClient.get<LabDetailDto>(`/Labs/${id}`);
  return res.data;
}

export async function createLabApi(
  data: CreateLabRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Labs", data);
  return res.data;
}

export async function updateLabApi(
  id: string,
  data: UpdateLabRequest,
): Promise<void> {
  await apiClient.put(`/Labs/${id}`, data);
}

export async function addLabBranchApi(
  labId: string,
  data: AddLabBranchRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>(
    `/Labs/${labId}/branches`,
    data,
  );
  return res.data;
}

export async function deleteLabBranchApi(
  labId: string,
  branchId: string,
): Promise<void> {
  await apiClient.delete(`/Labs/${labId}/branches/${branchId}`);
}

export async function sendRenewalReminderApi(
  labId: string,
  data: SendRenewalReminderRequest = {},
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>(
    `/Labs/${labId}/renewal-reminder`,
    data,
  );
  return res.data;
}

// ---- Plans ----
export async function getPlansApi(): Promise<PlanDto[]> {
  const res = await apiClient.get<PlanDto[]>("/Plans");
  return res.data;
}

export async function createPlanApi(
  data: CreatePlanRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Plans", data);
  return res.data;
}

// ---- Subscriptions ----
export async function getSubscriptionsApi(params: {
  tenantId?: string;
}): Promise<SubscriptionDto[]> {
  const res = await apiClient.get<SubscriptionDto[]>("/Subscriptions", {
    params,
  });
  return res.data;
}

export async function createSubscriptionApi(
  data: CreateSubscriptionRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Subscriptions", data);
  return res.data;
}

// ---- Notifications ----
export async function getNotificationsApi(params: {
  tenantId?: string;
}): Promise<NotificationDto[]> {
  const res = await apiClient.get<NotificationDto[]>("/Notifications", {
    params,
  });
  return res.data;
}

export async function sendNotificationApi(
  data: SendNotificationRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Notifications", data);
  return res.data;
}

import {
  createLabApi,
  createPlanApi,
  createSubscriptionApi,
  getLabsApi,
  getNotificationsApi,
  getPlansApi,
  getSubscriptionsApi,
  sendNotificationApi,
} from "@/lib/api/super-admin";
import {
  CreateLabRequest,
  CreatePlanRequest,
  CreateSubscriptionRequest,
  SendNotificationRequest,
} from "@/types/super-admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---- Labs ----
export function useLabs(params: { search?: string }) {
  return useQuery({
    queryKey: ["labs", params],
    queryFn: () => getLabsApi({ ...params, pageSize: 50 }),
  });
}

export function useCreateLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabRequest) => createLabApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labs"] }),
  });
}

// ---- Plans ----
export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => getPlansApi(),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanRequest) => createPlanApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

// ---- Subscriptions ----
export function useSubscriptions(params: { tenantId?: string }) {
  return useQuery({
    queryKey: ["subscriptions", params],
    queryFn: () => getSubscriptionsApi(params),
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) =>
      createSubscriptionApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

// ---- Notifications ----
export function useNotifications(params: { tenantId?: string }) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotificationsApi(params),
  });
}

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendNotificationRequest) => sendNotificationApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

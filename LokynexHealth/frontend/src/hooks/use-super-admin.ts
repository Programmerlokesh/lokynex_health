import {
  createLabApi,
  createPlanApi,
  createSubscriptionApi,
  getLabByIdApi,
  getLabsApi,
  getNotificationsApi,
  getPlansApi,
  getSubscriptionsApi,
  sendNotificationApi,
  updateLabApi,
} from "@/lib/api/super-admin";
import {
  CreateLabRequest,
  CreatePlanRequest,
  CreateSubscriptionRequest,
  SendNotificationRequest,
  UpdateLabRequest,
} from "@/types/super-admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---- Labs ----
export function useLabs(params: { search?: string }) {
  return useQuery({
    queryKey: ["labs", params],
    queryFn: () => getLabsApi({ ...params, pageSize: 50 }),
  });
}

export function useLab(id: string | null) {
  return useQuery({
    queryKey: ["labs", id],
    queryFn: () => getLabByIdApi(id!),
    enabled: !!id,
  });
}

export function useCreateLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabRequest) => createLabApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labs"] }),
  });
}

export function useUpdateLab(id: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLabRequest) => updateLabApi(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labs"] });
    },
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

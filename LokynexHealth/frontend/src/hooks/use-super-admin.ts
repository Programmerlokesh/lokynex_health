import {
  addLabBranchApi,
  createLabApi,
  createPlanApi,
  createSubscriptionApi,
  deleteLabBranchApi,
  getLabByIdApi,
  getLabsApi,
  getNotificationsApi,
  getPlansApi,
  getSubscriptionsApi,
  sendNotificationApi,
  sendRenewalReminderApi,
  updateLabApi,
} from "@/lib/api/super-admin";
import {
  AddLabBranchRequest,
  CreateLabRequest,
  CreatePlanRequest,
  CreateSubscriptionRequest,
  SendNotificationRequest,
  SendRenewalReminderRequest,
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

export function useAddLabBranch(labId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddLabBranchRequest) => addLabBranchApi(labId!, data),
    // Invalidating ["labs"] alone would not refresh the open detail dialog,
    // whose key is ["labs", labId] — so refetch that explicitly.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labs"] });
      qc.invalidateQueries({ queryKey: ["labs", labId] });
    },
  });
}

export function useDeleteLabBranch(labId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => deleteLabBranchApi(labId!, branchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labs"] });
      qc.invalidateQueries({ queryKey: ["labs", labId] });
    },
  });
}

export function useSendRenewalReminder(labId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendRenewalReminderRequest = {}) =>
      sendRenewalReminderApi(labId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
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

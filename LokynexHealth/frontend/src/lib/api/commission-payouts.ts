import { apiClient } from "@/lib/api-client";
import {
  GeneratePayoutsRequest,
  GetPayoutsFilters,
  GetPayoutsResult,
  MarkPayoutsPaidRequest,
} from "@/types/commission-payout";

export async function getPayoutsApi(
  filters: GetPayoutsFilters,
): Promise<GetPayoutsResult> {
  const res = await apiClient.get<GetPayoutsResult>("/CommissionPayouts", {
    params: filters,
  });
  return res.data;
}

export async function generatePayoutsApi(
  data: GeneratePayoutsRequest,
): Promise<{ generated: number }> {
  const res = await apiClient.post<{ generated: number }>(
    "/CommissionPayouts/generate",
    data,
  );
  return res.data;
}

export async function markPayoutsPaidApi(
  data: MarkPayoutsPaidRequest,
): Promise<{ updated: number }> {
  const res = await apiClient.post<{ updated: number }>(
    "/CommissionPayouts/mark-paid",
    data,
  );
  return res.data;
}

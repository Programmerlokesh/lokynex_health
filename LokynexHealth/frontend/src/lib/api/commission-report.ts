import { apiClient } from "@/lib/api-client";
import {
  getDoctorsListApi,
  getReferralsListApi,
  getTechniciansListApi,
} from "@/lib/api/directory";
import {
  CommissionReportParams,
  CommissionReportResult,
  EntityOption,
  PayoutEntityType,
  SetPayoutStatusRequest,
} from "@/types/commission-report";

export async function getCommissionReportApi(
  params: CommissionReportParams,
): Promise<CommissionReportResult> {
  const res = await apiClient.get<CommissionReportResult>(
    "/CommissionPayouts/report",
    { params },
  );
  return res.data;
}

export async function setPayoutStatusApi(
  data: SetPayoutStatusRequest,
): Promise<{ updated: number }> {
  const res = await apiClient.post<{ updated: number }>(
    "/CommissionPayouts/set-status",
    data,
  );
  return res.data;
}

/** Doctors / referrals / technicians for the "who" dropdown (server-side search). */
export async function getEntityOptionsApi(
  type: PayoutEntityType,
  search?: string,
): Promise<EntityOption[]> {
  const page =
    type === "Doctor"
      ? await getDoctorsListApi(search)
      : type === "Referral"
        ? await getReferralsListApi(search)
        : await getTechniciansListApi(search);
  return page.items.map((x) => ({
    id: x.id,
    fullName: x.fullName,
    phone: x.phone,
  }));
}

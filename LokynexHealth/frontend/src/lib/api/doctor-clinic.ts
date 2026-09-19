import { apiClient } from "@/lib/api-client";
import {
  AvailableSlotDto,
  BookAppointmentRequest,
  CreateScheduleRequest,
  GetAvailableSlotsParams,
  ScheduleDto,
} from "@/types/doctor-clinic";

export async function getSchedulesApi(params: {
  branchId?: string;
  doctorId?: string;
}): Promise<ScheduleDto[]> {
  const res = await apiClient.get<ScheduleDto[]>("/DoctorClinic/schedules", {
    params,
  });
  return res.data;
}

export async function createScheduleApi(
  data: CreateScheduleRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>(
    "/DoctorClinic/schedules",
    data,
  );
  return res.data;
}

export async function toggleScheduleStatusApi(
  id: string,
  isActive: boolean,
): Promise<void> {
  await apiClient.patch(`/DoctorClinic/schedules/${id}/status`, { isActive });
}

export async function getAvailableSlotsApi(
  params: GetAvailableSlotsParams,
): Promise<AvailableSlotDto[]> {
  const res = await apiClient.get<AvailableSlotDto[]>(
    "/DoctorClinic/available-slots",
    { params },
  );
  return res.data;
}

export async function bookAppointmentApi(
  data: BookAppointmentRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>(
    "/DoctorClinic/bookings",
    data,
  );
  return res.data;
}

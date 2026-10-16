import {
  bookAppointmentApi,
  createScheduleApi,
  getAvailableSlotsApi,
  getBookingsApi,
  getSchedulesApi,
  toggleScheduleStatusApi,
} from "@/lib/api/doctor-clinic";
import {
  BookAppointmentRequest,
  CreateScheduleRequest,
  GetAvailableSlotsParams,
  GetBookingsParams,
} from "@/types/doctor-clinic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useSchedules(params: { branchId?: string; doctorId?: string }) {
  return useQuery({
    queryKey: ["doctor-clinic-schedules", params],
    queryFn: () => getSchedulesApi(params),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => createScheduleApi(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["doctor-clinic-schedules"] }),
  });
}

export function useToggleScheduleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleScheduleStatusApi(id, isActive),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["doctor-clinic-schedules"] }),
  });
}

export function useAvailableSlots(params: GetAvailableSlotsParams | null) {
  return useQuery({
    queryKey: ["doctor-clinic-slots", params],
    queryFn: () => getAvailableSlotsApi(params!),
    enabled: !!params,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookAppointmentRequest) => bookAppointmentApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor-clinic-slots"] });
      qc.invalidateQueries({ queryKey: ["doctor-clinic-bookings"] });
    },
  });
}

/** Patients booked with one doctor on one date. */
export function useBookings(params: GetBookingsParams | null) {
  return useQuery({
    queryKey: ["doctor-clinic-bookings", params],
    queryFn: () => getBookingsApi(params!),
    enabled: !!params,
  });
}

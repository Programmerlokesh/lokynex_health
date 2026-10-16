// Mirrors the DoctorClinic DTOs / commands in the backend
// (LokynexHealth.Application/DoctorClinic/*).
// Dates are "YYYY-MM-DD" strings, times are "HH:mm:ss" strings.

export type ClinicPaymentMethod = "Cash" | "Card" | "UPI";

export interface ScheduleDto {
  id: string;
  branchId: string;
  branchName: string;
  doctorId: string;
  doctorName: string;
  dayOfWeek: number;
  slotMinutes: number;
  timeFrom: string;
  timeTo: string;
  maxPatients: number;
  isActive: boolean;
}

export interface CreateScheduleRequest {
  branchId: string;
  doctorId: string;
  dayOfWeek: number;
  slotMinutes: number;
  timeFrom: string;
  timeTo: string;
  maxPatients: number;
}

export interface GetAvailableSlotsParams {
  doctorId: string;
  branchId: string;
  date: string;
}

export interface AvailableSlotDto {
  timeSlot: string;
  maxPatients: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
}

export interface BookAppointmentRequest {
  doctorId: string;
  branchId: string;
  bookingDate: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  /** Reason for visit. */
  note?: string;
  /** Visit fee collected now. 0 = nothing collected. */
  visitFee: number;
  /** Required when visitFee > 0. */
  paymentMethod?: ClinicPaymentMethod;
}

export interface BookAppointmentResult {
  id: string;
  serialNo: number;
}

export interface GetBookingsParams {
  doctorId: string;
  date: string;
  /** Omit = every branch where the doctor had bookings that day. */
  branchId?: string;
}

export interface BookingDto {
  id: string;
  doctorId: string;
  branchId: string;
  branchName: string;
  bookingDate: string;
  timeSlot: string;
  serialNo: number | null;
  patientName: string;
  patientPhone: string;
  reason: string | null;
  visitFee: number;
  paymentMethod: string | null;
  status: string;
}

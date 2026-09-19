export interface ScheduleDto {
  id: string;
  branchId: string;
  branchName: string;
  doctorId: string;
  doctorName: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  slotMinutes: number;
  timeFrom: string; // "HH:mm:ss"
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

export interface AvailableSlotDto {
  timeSlot: string;
  maxPatients: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
}

export interface GetAvailableSlotsParams {
  doctorId: string;
  branchId: string;
  date: string;
}

export interface BookAppointmentRequest {
  doctorId: string;
  branchId: string;
  bookingDate: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  note?: string;
}

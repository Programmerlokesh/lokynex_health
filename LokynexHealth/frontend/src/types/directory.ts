export type DirectoryKind = "doctor" | "referral" | "technician";

export interface DoctorFullDto {
  id: string;
  fullName: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  specialization: string | null;
  status: string;
}

export interface ReferralFullDto {
  id: string;
  fullName: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  status: string;
}

export interface TechnicianFullDto {
  id: string;
  branchId: string;
  branchName: string;
  fullName: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  status: string;
}

export type DirectoryRecord =
  | DoctorFullDto
  | ReferralFullDto
  | TechnicianFullDto;

export interface CreateDoctorRequest {
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  specialization?: string;
}

export interface CreateReferralRequest {
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
}

export interface CreateTechnicianRequest {
  branchId: string;
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
}

/** One payload shape for create AND update of any directory record. */
export interface DirectoryPayload {
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  specialization?: string; // doctors only
  branchId?: string; // technicians only
}

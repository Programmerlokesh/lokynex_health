export interface DoctorFullDto {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  specialization: string | null;
  status: string;
}

export interface ReferralFullDto {
  id: string;
  fullName: string;
  phone: string;
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
  email: string | null;
  address: string | null;
  status: string;
}

export interface CreateDoctorRequest {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  specialization?: string;
}

export interface CreateReferralRequest {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface CreateTechnicianRequest {
  branchId: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
}

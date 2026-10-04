export interface LookupDto {
  id: string;
  fullName: string;
  phone: string;
  address?: string | null;
  email?: string | null;
  /** Doctors only. */
  specialization?: string | null;
}

export interface TechnicianDto extends LookupDto {
  branchId: string;
  branchName?: string;
}

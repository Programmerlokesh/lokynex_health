export interface LookupDto {
  id: string;
  fullName: string;
  phone: string;
  address?: string | null;
  email?: string | null;
  /** Doctors only. */
  specialization?: string | null;
  /** Technicians only. */
  branchName?: string;
}

export interface TechnicianDto extends LookupDto {
  branchId: string;
  branchName?: string;
}

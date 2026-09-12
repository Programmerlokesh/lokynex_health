export interface LookupDto {
  id: string;
  fullName: string;
  phone: string;
}

export interface TechnicianDto extends LookupDto {
  branchId: string;
}

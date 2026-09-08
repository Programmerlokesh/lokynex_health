export interface BranchDto {
  id: string;
  branchName: string;
  branchCode: string;
  branchAddress: string | null;
  branchPincode: string | null;
  branchPhone: string | null;
  branchEmail: string | null;
  createdBySuperAdmin: boolean;
  status: string;
  createdAt: string;
}

export interface UpdateBranchRequest {
  branchName: string;
  branchAddress?: string;
  branchPincode?: string;
  branchPhone?: string;
  branchEmail?: string;
  status: string;
}

export interface OrderListItemDto {
  id: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  branchId: string;
  branchName: string;
  doctorId: string | null;
  referralId: string | null;
  grossAmount: number;
  finalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  isComplimentary: boolean;
  isDeleted: boolean;
  testCount: number;
  createdAt: string;
}

export interface OrderListFilters {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  paymentStatus?: string;
  patientNameContains?: string;
  patientPhone?: string;
  orderNumber?: string;
  doctorId?: string;
  referralId?: string;
  showDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

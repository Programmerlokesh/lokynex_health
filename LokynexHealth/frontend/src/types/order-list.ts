export interface OrderListItemDto {
  id: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  branchId: string;
  branchName: string;
  doctorId: string | null;
  doctorName: string | null;
  referralId: string | null;
  referralName: string | null;
  grossAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  isComplimentary: boolean;
  isDeleted: boolean;
  testCount: number;
  createdAt: string;
  createdByName: string | null;
  updatedAt: string | null;
  updatedByName: string | null;
  deletedAt: string | null;
  deletedByName: string | null;
}

/** Query-string of GET /Orders and GET /Orders/export. */
export interface OrderListFilters {
  /** yyyy-mm-dd, inclusive. */
  dateFrom?: string;
  dateTo?: string;
  /** Minutes east of UTC of this browser, so "a day" means the user's own day. */
  tzOffsetMinutes?: number;
  branchId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  /** Phone digits or patient name — the server decides. */
  search?: string;
  orderNumber?: string;
  doctorId?: string;
  referralId?: string;
  showDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface OrderExportTest {
  name: string;
  amount: number;
}

export interface OrderExportRow {
  orderNumber: string;
  createdAt: string;
  patientName: string;
  doctorName: string | null;
  referralName: string | null;
  tests: OrderExportTest[];
  testAmount: number;
  paid: number;
  due: number;
}

export interface OrderExportDto {
  rows: OrderExportRow[];
  totalOrders: number;
  truncated: boolean;
  totalTestAmount: number;
  totalPaid: number;
  totalDue: number;
}

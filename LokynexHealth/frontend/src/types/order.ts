export interface OrderItemInput {
  testId: string;
  testName: string;
  departmentId: string;
  departmentName: string;
  price: number;
  /** Shown in the "test details" popup when a referral is selected. */
  referralCommissionType: string;
  referralCommissionValue: number;
  technicianId?: string;
  doctorCommissionEnabled: boolean;
  referralCommissionEnabled: boolean;
}

export interface OrderPaymentInput {
  method: string;
  amount: number;
}

export interface CreateOrderRequest {
  patientPhone: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  patientAddress?: string;
  /** Order for an already-registered family member. */
  relativeId?: string;
  /** Or register a new family member (relation is to the guardian). */
  relativeName?: string;
  relativeAge?: number;
  relativeRelationship?: string;
  relativeGender?: string;
  branchId: string;
  doctorId?: string;
  referralId?: string;
  discountType: string;
  discountValue: number;
  isComplimentary: boolean;
  payments: OrderPaymentInput[];
  items: {
    testId: string;
    technicianId?: string;
    doctorCommissionEnabled: boolean;
    referralCommissionEnabled: boolean;
  }[];
}

/* ---------- Order details / invoice (GET /Orders/{id}) ---------- */

export interface OrderPartyDto {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
}

export interface OrderInvoiceLineDto {
  testId: string;
  description: string;
  departmentName: string;
  rate: number;
  less: number;
  amount: number;
}

export interface OrderInvoicePaymentDto {
  method: string;
  amount: number;
  paidAt: string;
}

export interface OrderInvoiceDto {
  id: string;
  companyName: string;
  companyType: string;
  branchName: string;
  branchAddress?: string | null;
  branchPhone?: string | null;

  invoiceNo: string;
  billNo: string;
  billDate: string;
  paymentMode: string;

  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  patientPhone: string;
  patientAddress?: string | null;
  guardianName: string;
  relationship?: string | null;

  doctor?: OrderPartyDto | null;
  referral?: OrderPartyDto | null;

  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  paymentStatus: string;
  isComplimentary: boolean;

  lines: OrderInvoiceLineDto[];
  payments: OrderInvoicePaymentDto[];
}

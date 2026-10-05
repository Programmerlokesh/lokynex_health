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

  createdByName?: string | null;
  createdAt: string;
  updatedByName?: string | null;
  updatedAt?: string | null;
  isDeleted: boolean;
  deletedByName?: string | null;
  deletedAt?: string | null;
  /** Newest first. */
  history: OrderAuditEntryDto[];
}

export interface OrderAuditEntryDto {
  action: "Edit" | "Delete" | "Restore" | string;
  changedByName?: string | null;
  changedAt: string;
  summary?: string | null;
}

/* ---------- GET /Orders/{id}/edit : the order in the shape of the form ---------- */

export interface OrderEditDto {
  id: string;
  orderNumber: string;
  isDeleted: boolean;
  patient: {
    id: string;
    patientCode: string;
    fullName: string;
    phone: string;
    age?: number | null;
    gender?: string | null;
    address?: string | null;
    email?: string | null;
    relatives: {
      id: string;
      name: string;
      age?: number | null;
      gender?: string | null;
      relationship?: string | null;
    }[];
  };
  relativeId?: string | null;
  branchId: string;
  doctor?: {
    id: string;
    fullName: string;
    phone: string;
    address?: string | null;
    email?: string | null;
    specialization?: string | null;
  } | null;
  referral?: {
    id: string;
    fullName: string;
    phone: string;
    address?: string | null;
    email?: string | null;
  } | null;
  discountType: string;
  discountValue: number;
  isComplimentary: boolean;
  items: {
    testId: string;
    testName: string;
    departmentId: string;
    departmentName: string;
    price: number;
    referralCommissionType: string;
    referralCommissionValue: number;
    technicianId?: string | null;
    doctorCommissionEnabled: boolean;
    referralCommissionEnabled: boolean;
  }[];
  payments: OrderPaymentInput[];
}

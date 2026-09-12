export interface OrderItemInput {
  testId: string;
  testName: string;
  price: number;
  technicianId?: string;
  doctorCommissionEnabled: boolean;
  referralCommissionEnabled: boolean;
}

export interface CreateOrderRequest {
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  patientAddress?: string;
  patientEmail?: string;
  patientWhatsapp?: string;
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
  paymentMethod?: string;
  paidAmount: number;
  items: {
    testId: string;
    technicianId?: string;
    doctorCommissionEnabled: boolean;
    referralCommissionEnabled: boolean;
  }[];
}

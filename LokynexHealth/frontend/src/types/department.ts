export interface DepartmentDto {
  id: string;
  name: string;
  status: string;
  testCount: number;
}

export interface TestDto {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  price: number;
  doctorCommissionType: string;
  doctorCommissionValue: number;
  referralCommissionType: string;
  referralCommissionValue: number;
  technicianCommissionType: string;
  technicianCommissionValue: number;
  status: string;
}

/** A commission for ONE specific doctor / referral / technician on ONE test. */
export interface TestCommissionInput {
  entityType: "Doctor" | "Referral" | "Technician";
  entityId: string;
  commissionType: string;
  commissionValue: number;
}

export interface TestCommissionDto extends TestCommissionInput {
  id: string;
  entityName: string;
}

export interface CreateTestRequest {
  departmentId: string;
  name: string;
  price: number;
  doctorCommissionType: string;
  doctorCommissionValue: number;
  referralCommissionType: string;
  referralCommissionValue: number;
  technicianCommissionType: string;
  technicianCommissionValue: number;
  commissions: TestCommissionInput[];
}

export interface UpdateTestRequest {
  name: string;
  price: number;
  status: string;
  doctorCommissionType: string;
  doctorCommissionValue: number;
  referralCommissionType: string;
  referralCommissionValue: number;
  technicianCommissionType: string;
  technicianCommissionValue: number;
  /** The COMPLETE list — rows left out are removed. */
  commissions: TestCommissionInput[];
}

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
}
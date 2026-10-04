export interface CommissionOverrideDto {
  id: string;
  entityType: string; // "Doctor" | "Referral" | "Technician"
  entityId: string;
  entityName: string;
  testId: string;
  testName: string;
  commissionType: string; // "Flat" | "Percentage"
  commissionValue: number;
}

export interface SetCommissionOverrideRequest {
  entityType: string;
  entityId: string;
  testId: string;
  commissionType: string;
  commissionValue: number;
}

/** One test of a department with the commission a given person gets on it. */
export interface EffectiveCommissionDto {
  testId: string;
  testName: string;
  price: number;
  testStatus: string;
  defaultCommissionType: string;
  defaultCommissionValue: number;
  hasOverride: boolean;
  commissionType: string;
  commissionValue: number;
}

export interface BulkCommissionItem {
  testId: string;
  commissionType: string;
  commissionValue: number;
  /** Delete the person-specific row so the test default applies again. */
  reset?: boolean;
}

export interface BulkSetCommissionRequest {
  entityType: string;
  entityId: string;
  departmentId: string;
  items: BulkCommissionItem[];
}

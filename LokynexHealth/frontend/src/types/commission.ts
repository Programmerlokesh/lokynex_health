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

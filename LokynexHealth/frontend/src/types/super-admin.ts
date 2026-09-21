export interface LabSubscriptionSummary {
  subscriptionId: string;
  planName: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  autoRenew: boolean;
  /** Status as stored in the DB — usually you want effectiveStatus instead. */
  storedStatus: string;
  /** Status after comparing endDate with today. This is what the UI shows. */
  effectiveStatus: string;
  /** Negative once the subscription has lapsed. */
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface LabDto {
  id: string;
  labCode: string;
  primaryBranchName: string;
  subdomain: string;
  adminName: string;
  userLimit: number;
  status: string;
  createdAt: string;
  subscription: LabSubscriptionSummary | null;
}

export interface BranchDto {
  id: string;
  branchName: string;
  branchCode: string;
  branchAddress?: string | null;
  branchPincode?: string | null;
  branchPhone?: string | null;
}

export interface LabDetailDto {
  id: string;
  labCode: string;
  schemaName: string;
  subdomain: string;

  primaryBranchName: string;
  primaryBranchAddress: string;
  primaryBranchPhone: string;
  primaryBranchEmail: string;
  primaryBranchPincode: string;

  adminName: string;
  adminPhone: string;
  adminAddress?: string | null;
  adminEmail: string;
  adminUsername: string;

  userLimit: number;
  status: string;
  createdAt: string;
  updatedAt?: string | null;

  subscription: LabSubscriptionSummary | null;
  extendBranches: BranchDto[];
}

export interface AddLabBranchRequest {
  branchName: string;
  branchCode: string;
  branchAddress?: string;
  branchPincode?: string;
  branchPhone?: string;
}

export interface SendRenewalReminderRequest {
  title?: string;
  message?: string;
}

export interface UpdateLabRequest {
  primaryBranchName: string;
  primaryBranchAddress: string;
  primaryBranchPhone: string;
  primaryBranchEmail: string;
  primaryBranchPincode: string;
  adminName: string;
  adminPhone: string;
  adminAddress?: string;
  adminEmail: string;
  userLimit: number;
  status: string;
}

export interface ExtendBranchInput {
  branchName: string;
  branchCode: string;
  branchAddress?: string;
  branchPincode?: string;
  branchPhone?: string;
}

export interface CreateLabRequest {
  primaryBranchName: string;
  primaryBranchAddress: string;
  primaryBranchPhone: string;
  primaryBranchEmail: string;
  primaryBranchPincode: string;
  adminName: string;
  adminPhone: string;
  adminAddress?: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
  userLimit: number;
  extendBranches: ExtendBranchInput[];
}

export interface PlanDto {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  maxUsers: number;
  maxBranches: number;
  isActive: boolean;
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  price: number;
  billingCycle: string;
  maxUsers: number;
  maxBranches: number;
}

export interface SubscriptionDto {
  id: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  status: string;
}

export interface CreateSubscriptionRequest {
  tenantId: string;
  planId: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
}

export interface NotificationDto {
  id: string;
  tenantId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendNotificationRequest {
  tenantId?: string;
  title: string;
  message: string;
}

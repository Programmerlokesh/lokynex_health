// Roles a SuperAdmin can give a staff member (people who work under the SuperAdmin).
// Keep in sync with OwnerRoles.cs on the backend.
export const OWNER_ROLES = [
  "CEO",
  "Manager",
  "Marketing Team",
  "Sales Executive",
  "Other",
] as const;

// ---------------- Staff panel access ----------------
// Keep the panel keys in sync with StaffPanels.cs on the backend.
export type StaffAccessLevel = "none" | "view" | "manage";

export interface StaffPermission {
  panel: string;
  level: "view" | "manage";
}

export const STAFF_PANELS = [
  {
    key: "labs",
    label: "Labs",
    hint: "View = see the labs they added. Manage = can also create new labs.",
  },
  {
    key: "plans",
    label: "Plans",
    hint: "View = see all plans. Manage = create, edit and delete plans.",
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    hint: "Only for labs they added. Manage = create and edit subscriptions.",
  },
  {
    key: "notifications",
    label: "Notifications",
    hint: "Only for labs they added. Manage = send notifications.",
  },
  {
    key: "ledger",
    label: "Ledger & P&L",
    hint: "Their own ledger. Manage = add, edit and delete entries.",
  },
] as const;

export type StaffPanelKey = (typeof STAFF_PANELS)[number]["key"];

// What a new staff member starts with (same as before this feature existed).
export const DEFAULT_STAFF_PERMISSIONS: StaffPermission[] = [
  { panel: "labs", level: "manage" },
  { panel: "ledger", level: "manage" },
];

export function accessLevelOf(
  perms: StaffPermission[] | null | undefined,
  panel: string,
): StaffAccessLevel {
  const hit = perms?.find((p) => p.panel === panel);
  return hit ? hit.level : "none";
}

export function panelLabel(panel: string): string {
  return STAFF_PANELS.find((p) => p.key === panel)?.label ?? panel;
}

// ---------------- Staff (API name: owner) ----------------
export interface OwnerDto {
  id: string;
  name: string;
  role: string;
  username: string;
  phone: string;
  whatsappNumber?: string | null;
  address?: string | null;
  pincode?: string | null;
  profilePictureUrl?: string | null;
  /** "Active" | "Inactive" */
  status: string;
  labCount: number;
  /** Panels the SuperAdmin opened for this staff member. */
  permissions: StaffPermission[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateOwnerRequest {
  name: string;
  role: string;
  username: string;
  password: string;
  phone: string;
  whatsappNumber?: string;
  address?: string;
  pincode?: string;
  profilePictureUrl?: string;
  permissions?: StaffPermission[];
}

export interface UpdateOwnerRequest {
  name: string;
  role: string;
  phone: string;
  whatsappNumber?: string;
  address?: string;
  pincode?: string;
  /** null/undefined = keep, "" = remove, data URL = replace */
  profilePictureUrl?: string | null;
  /** Leave empty to keep the current password. */
  newPassword?: string;
  /** Full list of panels; replaces the old list. */
  permissions?: StaffPermission[];
}

// ---------------- Staff ledger / P&L ----------------

export type LedgerEntryType =
  | "Income"
  | "Expense"
  | "Refund"
  | "CommissionPayout";

/** Every outflow figure is a POSITIVE magnitude; net is signed. */
export interface OwnerLedgerTotals {
  income: number;
  refund: number;
  commissionPayout: number;
  expense: number;
  net: number;
  entryCount: number;
}

export interface OwnerLedgerSeriesPoint {
  bucket: string; // yyyy-MM-dd (bucket start)
  income: number;
  refund: number;
  commissionPayout: number;
  expense: number;
  net: number;
  cumulativeNet: number;
}

export interface OwnerLedgerLabRow {
  tenantId: string | null;
  labName: string;
  labCode: string | null;
  income: number;
  outflow: number;
  net: number;
  entryCount: number;
  subscriptionCount: number;
}

export interface OwnerLedgerCategoryRow {
  entryType: LedgerEntryType;
  category: string;
  total: number;
  previousTotal: number;
  entryCount: number;
}

export interface OwnerLedgerLabOption {
  id: string;
  name: string;
  code: string;
}

export interface OwnerLedgerAnalytics {
  dateFrom: string;
  dateTo: string;
  previousFrom: string;
  previousTo: string;
  granularity: "day" | "week" | "month";
  current: OwnerLedgerTotals;
  previous: OwnerLedgerTotals;
  series: OwnerLedgerSeriesPoint[];
  labs: OwnerLedgerLabRow[];
  categories: OwnerLedgerCategoryRow[];
  labOptions: OwnerLedgerLabOption[];
  subscriptionRevenue: number;
  subscriptionCount: number;
  labsAddedInPeriod: number;
  totalLabs: number;
}

export interface OwnerLedgerEntryDto {
  id: string;
  entryDate: string; // yyyy-MM-dd
  entryType: LedgerEntryType;
  category: string | null;
  /** Always positive. */
  amount: number;
  tenantId: string | null;
  labName: string | null;
  labCode: string | null;
  paymentMethod: string | null;
  referenceNo: string | null;
  description: string | null;
  /** "Manual" (editable) or "Subscription" (auto, read-only). */
  source: "Manual" | "Subscription";
  createdAt: string;
}

export interface OwnerLedgerEntriesPage {
  items: OwnerLedgerEntryDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface OwnerLedgerFilters {
  dateFrom?: string;
  dateTo?: string;
  tenantId?: string;
}

export interface OwnerLedgerEntriesParams extends OwnerLedgerFilters {
  entryType?: LedgerEntryType;
  source?: "Manual" | "Subscription";
  search?: string;
  sortDesc?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface SaveOwnerLedgerEntryRequest {
  entryDate: string;
  entryType: LedgerEntryType;
  category?: string;
  amount: number;
  tenantId?: string | null;
  paymentMethod?: string;
  referenceNo?: string;
  description?: string;
}

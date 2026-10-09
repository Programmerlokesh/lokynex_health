import { activeRange, QuickRange } from "@/lib/report-builder-filters";
import {
  GetOrdersForReportParams,
  ReportStatusFilter,
} from "@/types/report-builder";

export interface OrderFilterState {
  dateFrom: string; // yyyy-mm-dd (local), "" = no limit
  dateTo: string;
  status: ReportStatusFilter;
  orderNumber: string;
  patientName: string;
  phone: string;
  testName: string;
}

export const initialOrderFilters: OrderFilterState = {
  dateFrom: "",
  dateTo: "",
  status: "Any",
  orderNumber: "",
  patientName: "",
  phone: "",
  testName: "",
};

export function countActiveOrderFilters(f: OrderFilterState): number {
  let n = 0;
  if (f.dateFrom || f.dateTo) n++;
  if (f.status !== "Any") n++;
  if (f.orderNumber.trim()) n++;
  if (f.patientName.trim()) n++;
  if (f.phone.trim()) n++;
  if (f.testName.trim()) n++;
  return n;
}

export function activeOrderRange(f: OrderFilterState): QuickRange | null {
  return activeRange({ ...f, search: "", source: "Any" });
}

/** Local calendar day -> exact instants, so the range follows the user's own timezone. */
export function toQueryParams(
  f: OrderFilterState,
): Pick<
  GetOrdersForReportParams,
  | "status"
  | "from"
  | "to"
  | "orderNumber"
  | "patientName"
  | "phone"
  | "testName"
> {
  let from: string | undefined;
  let to: string | undefined;

  if (f.dateFrom) from = new Date(`${f.dateFrom}T00:00:00`).toISOString();
  if (f.dateTo) {
    const end = new Date(`${f.dateTo}T00:00:00`);
    end.setDate(end.getDate() + 1); // exclusive end = start of next day
    to = end.toISOString();
  }

  return {
    status: f.status,
    from,
    to,
    orderNumber: f.orderNumber.trim() || undefined,
    patientName: f.patientName.trim() || undefined,
    phone: f.phone.trim() || undefined,
    testName: f.testName.trim() || undefined,
  };
}

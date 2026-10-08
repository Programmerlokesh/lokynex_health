import { escapeHtml } from "@/lib/report-editor/sanitize";
import {
  OrderForReportDto,
  OrderForReportItemDto,
} from "@/types/report-builder";

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

/** Keys the backend (template -> document) also understands. */
export const BACKEND_KEYS: ReadonlySet<string> = new Set([
  "patient_name",
  "patient_phone",
  "order_number",
  "test_name",
  "report_date",
]);

/** Single regex pass, O(1) Map lookup per {{placeholder}}. Unknown keys stay visible. */
export function mergeFields(
  content: string | null | undefined,
  fields: ReadonlyMap<string, string>,
): string {
  if (!content) return "";
  return content.replace(
    PLACEHOLDER,
    (match, key: string) => fields.get(key.toLowerCase()) ?? match,
  );
}

/** Reverse: turn real patient values back into {{placeholders}} (Save as Template). */
export function unmergeFields(
  html: string,
  fields: ReadonlyMap<string, string>,
): string {
  const entries = [...fields]
    .filter(([key, value]) => BACKEND_KEYS.has(key) && value.length >= 3)
    .sort((a, b) => b[1].length - a[1].length); // longest first
  let out = html;
  for (const [key, value] of entries) {
    out = out.split(value).join(`{{${key}}}`);
  }
  return out;
}

const dayFmt = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function buildFieldMap(
  order: OrderForReportDto,
  item: OrderForReportItemDto | undefined,
  reportTitle: string,
): Map<string, string> {
  const ageSex =
    [
      order.patientAge != null ? `${order.patientAge} Y` : "",
      order.patientGender ?? "",
    ]
      .filter(Boolean)
      .join(" / ") || "—";

  const m = new Map<string, string>();
  const set = (key: string, value: string | null | undefined) =>
    m.set(key, escapeHtml(value ?? ""));

  set("patient_name", order.patientName);
  set("patient_phone", order.patientPhone);
  set("patient_age", order.patientAge != null ? String(order.patientAge) : "");
  set("patient_gender", order.patientGender);
  set("patient_age_sex", ageSex);
  set("order_number", order.orderNumber);
  set("order_date", dayFmt(new Date(order.createdAt)));
  set("report_date", dayFmt(new Date()));
  set("test_name", item?.testName);
  set("referred_by", order.doctorName ?? order.referralName ?? "Self");
  set("branch_name", order.branchName);
  set("branch_address", order.branchAddress);
  set("branch_phone", order.branchPhone);
  set("report_title", reportTitle);
  return m;
}

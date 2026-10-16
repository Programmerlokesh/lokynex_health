import { ClinicPaymentMethod } from "@/types/doctor-clinic";

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const PAYMENT_METHODS: ClinicPaymentMethod[] = ["Cash", "Card", "UPI"];

/** "09:00:00" -> "9:00 AM" */
export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/** "2026-10-16" -> "Friday, 16 October 2026" (no time-zone shift). */
export function formatLongDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

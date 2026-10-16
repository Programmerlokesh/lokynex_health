import { escapeHtml, printHtmlDocument } from "@/lib/print-document";
import { BookingDto } from "@/types/doctor-clinic";
import { formatLongDate, formatTime } from "./clinic-utils";

/** Prints the day's patient list (serial, time, name, phone, reason) for one doctor. */
export function printPatientList(opts: {
  doctorName: string;
  branchLabel: string; // a branch name, or "All branches"
  date: string; // yyyy-MM-dd
  rows: BookingDto[];
  showBranch: boolean;
}) {
  const { doctorName, branchLabel, date, rows, showBranch } = opts;

  const head = `<tr>
    <th class="num">Serial</th>
    <th class="num">Time</th>
    ${showBranch ? "<th>Branch</th>" : ""}
    <th>Patient name</th>
    <th>Phone</th>
    <th>Reason</th>
  </tr>`;

  const body = rows
    .map(
      (r) => `<tr>
    <td class="num">${r.serialNo ?? "-"}</td>
    <td class="num">${escapeHtml(formatTime(r.timeSlot))}</td>
    ${showBranch ? `<td>${escapeHtml(r.branchName)}</td>` : ""}
    <td>${escapeHtml(r.patientName)}</td>
    <td>${escapeHtml(r.patientPhone)}</td>
    <td>${escapeHtml(r.reason ?? "")}</td>
  </tr>`,
    )
    .join("");

  const html = `<h1>Patient List</h1>
<p class="meta">
  <strong>Doctor:</strong> ${escapeHtml(doctorName)}<br/>
  <strong>Date:</strong> ${escapeHtml(formatLongDate(date))}<br/>
  <strong>Branch:</strong> ${escapeHtml(branchLabel)}
</p>
<table><thead>${head}</thead><tbody>${body}</tbody></table>
<p class="foot">Total patients: <strong>${rows.length}</strong></p>`;

  printHtmlDocument(`Patient list - ${doctorName} - ${date}`, html);
}

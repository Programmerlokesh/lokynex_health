import { ClinicShell } from "@/components/clinic/clinic-shell";
import type { ReactNode } from "react";

export default function ClinicLayout({ children }: { children: ReactNode }) {
  return <ClinicShell>{children}</ClinicShell>;
}
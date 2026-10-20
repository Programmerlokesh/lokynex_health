// Permission helpers. A permission string looks like "prescriptions:create".
// The backend is the real guard; this only decides what to SHOW.

export function canDo(
  permissions: string[] | undefined,
  isAdmin: boolean | undefined,
  module: string,
  action = "view",
): boolean {
  if (isAdmin) return true;
  return !!permissions?.includes(`${module}:${action}`);
}

export const CLINIC_NAV = [
  {
    key: "dashboard",
    label: "Overview",
    href: "/clinic/dashboard",
    module: null,
  },
  {
    key: "appointments",
    label: "Appointments",
    href: "/clinic/appointments",
    module: "appointments",
  },
  {
    key: "prescriptions",
    label: "Prescriptions",
    href: "/clinic/prescriptions",
    module: "prescriptions",
  },
  {
    key: "patients",
    label: "Patients",
    href: "/clinic/patients",
    module: "patients",
  },
  {
    key: "medicines",
    label: "Medicines",
    href: "/clinic/medicines",
    module: "medicines",
  },
  {
    key: "ledger",
    label: "Ledger & P&L",
    href: "/clinic/ledger",
    module: "ledger",
  },
  {
    key: "doctors",
    label: "Doctors",
    href: "/clinic/doctors",
    module: "doctors",
  },
  { key: "users", label: "Users", href: "/clinic/users", module: "users" },
  {
    key: "settings",
    label: "Clinic Settings",
    href: "/clinic/settings",
    module: null,
  },
] as const;

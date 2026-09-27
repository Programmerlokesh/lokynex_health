"use client";

import { useModules } from "@/hooks/use-modules";
import { ModulePermissionInput } from "@/types/user";
import {
  Box,
  Checkbox,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete";

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: "canView", label: "View" },
  { key: "canCreate", label: "Create" },
  { key: "canEdit", label: "Edit" },
  { key: "canDelete", label: "Delete" },
];

// A pretty label for each seeded module name (falls back to the raw name for
// anything added later that this map doesn't know about yet).
const MODULE_LABELS: Record<string, string> = {
  Users: "Users",
  Branches: "Branches",
  DepartmentsAndTests: "Departments & Tests",
  NewOrder: "New Order",
  OrderListAndReports: "Order List & Reports",
  CommissionSetup: "Commission Setup",
  Ledger: "Ledger & P&L",
  Commission: "Commission Payout",
  DoctorReferralTechnician: "Doctor / Referral / Technician",
  DoctorClinic: "Doctor Clinic",
};

/**
 * Module x (View/Create/Edit/Delete) checkbox grid — used by both
 * CreateUserDialog and EditUserDialog so the LabAdmin decides exactly which
 * modules a user can access and what they can do inside each one.
 *
 * `value` only needs to contain rows the user actually has access to; any
 * module missing from `value` renders as all-unchecked. Toggling a checkbox
 * calls `onChange` with a full, deduplicated permissions array.
 */
export function PermissionGrid({
  value,
  onChange,
}: {
  value: ModulePermissionInput[];
  onChange: (next: ModulePermissionInput[]) => void;
}) {
  const { data: modules, isLoading, isError } = useModules();

  function getRow(moduleId: number): ModulePermissionInput {
    return (
      value.find((v) => v.moduleId === moduleId) ?? {
        moduleId,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      }
    );
  }

  function toggle(moduleId: number, action: PermissionAction) {
    const current = getRow(moduleId);
    const updated: ModulePermissionInput = {
      ...current,
      [action]: !current[action],
    };
    // Turning on Create/Edit/Delete without View doesn't make sense — a user
    // needs to be able to see a module to act inside it.
    if (action !== "canView" && updated[action]) {
      updated.canView = true;
    }
    const next = value.filter((v) => v.moduleId !== moduleId);
    next.push(updated);
    onChange(next);
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (isError || !modules) {
    return (
      <Typography variant="body2" color="error">
        Could not load modules.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Module Permissions
      </Typography>
      {/* Horizontal scroll on narrow screens instead of squeezing columns —
          the grid stays readable/tappable on a phone. */}
      <TableContainer
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflowX: "auto",
        }}
      >
        <Table size="small" sx={{ minWidth: 420 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
              {ACTIONS.map((a) => (
                <TableCell key={a.key} align="center" sx={{ fontWeight: 600 }}>
                  {a.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((m) => {
              const row = getRow(m.id);
              return (
                <TableRow key={m.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {MODULE_LABELS[m.name] ?? m.name}
                  </TableCell>
                  {ACTIONS.map((a) => (
                    <TableCell key={a.key} align="center" sx={{ p: 0.5 }}>
                      <Checkbox
                        size="small"
                        checked={row[a.key]}
                        onChange={() => toggle(m.id, a.key)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

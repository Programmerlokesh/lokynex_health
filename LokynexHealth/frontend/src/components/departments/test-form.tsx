"use client";

import { TestCommissionInput } from "@/types/department";
import {
  Box,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { CommissionRow, TestCommissionEditor } from "./test-commission-editor";

export interface TestFormState {
  departmentId: string;
  name: string;
  price: string;
  status: string;
  doctorCommissionType: string;
  doctorCommissionValue: string;
  referralCommissionType: string;
  referralCommissionValue: string;
  technicianCommissionType: string;
  technicianCommissionValue: string;
  commissions: CommissionRow[];
}

export const emptyTestForm = (departmentId = ""): TestFormState => ({
  departmentId,
  name: "",
  price: "",
  status: "Active",
  doctorCommissionType: "Flat",
  doctorCommissionValue: "0",
  referralCommissionType: "Flat",
  referralCommissionValue: "0",
  technicianCommissionType: "Flat",
  technicianCommissionValue: "0",
  commissions: [],
});

/** Throws a readable message when a commission row is incomplete. */
export function toCommissionInputs(
  rows: CommissionRow[],
): TestCommissionInput[] {
  return rows.map((r) => {
    if (!r.entity) {
      throw new Error(
        `Select a ${r.entityType.toLowerCase()} for every commission row.`,
      );
    }
    return {
      entityType: r.entityType,
      entityId: r.entity.id,
      commissionType: r.commissionType,
      commissionValue: Number(r.commissionValue) || 0,
    };
  });
}

type TypeKey =
  | "doctorCommissionType"
  | "referralCommissionType"
  | "technicianCommissionType";
type ValueKey =
  | "doctorCommissionValue"
  | "referralCommissionValue"
  | "technicianCommissionValue";

export function TestForm({
  form,
  onChange,
  departments,
  departmentLocked,
  showStatus,
}: {
  form: TestFormState;
  onChange: (next: TestFormState) => void;
  departments: { id: string; name: string }[];
  departmentLocked?: boolean;
  showStatus?: boolean;
}) {
  const set = (patch: Partial<TestFormState>) =>
    onChange({ ...form, ...patch });

  const defaultRow = (label: string, typeKey: TypeKey, valueKey: ValueKey) => (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <Typography variant="body2" sx={{ width: 90, flexShrink: 0 }}>
        {label}
      </Typography>
      <TextField
        select
        size="small"
        label="Type"
        value={form[typeKey]}
        onChange={(e) =>
          set({ [typeKey]: e.target.value } as Partial<TestFormState>)
        }
        sx={{ flex: 1 }}
      >
        <MenuItem value="Flat">Flat (₹)</MenuItem>
        <MenuItem value="Percentage">Percentage (%)</MenuItem>
      </TextField>
      <TextField
        size="small"
        type="number"
        label="Value"
        value={form[valueKey]}
        onChange={(e) =>
          set({ [valueKey]: e.target.value } as Partial<TestFormState>)
        }
        slotProps={{ htmlInput: { min: 0, step: "any" } }}
        sx={{ flex: 1 }}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField
            select
            label="Department"
            size="small"
            required
            fullWidth
            disabled={departmentLocked}
            value={form.departmentId}
            onChange={(e) => set({ departmentId: e.target.value })}
            helperText={
              departmentLocked
                ? "A test cannot move to another department."
                : undefined
            }
          >
            {departments.length === 0 && (
              <MenuItem value="" disabled>
                No departments yet — create one first
              </MenuItem>
            )}
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: showStatus ? 5 : 8 }}>
          <TextField
            label="Test Name"
            size="small"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: showStatus ? 3 : 4 }}>
          <TextField
            label="Price"
            type="number"
            size="small"
            value={form.price}
            onChange={(e) => set({ price: e.target.value })}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            required
            fullWidth
          />
        </Grid>
        {showStatus && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Status"
              size="small"
              value={form.status}
              onChange={(e) => set({ status: e.target.value })}
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        )}
      </Grid>

      <Divider />
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          DEFAULT COMMISSION (applies to everyone)
        </Typography>
      </Box>
      {defaultRow("Doctor", "doctorCommissionType", "doctorCommissionValue")}
      {defaultRow(
        "Referral",
        "referralCommissionType",
        "referralCommissionValue",
      )}
      {defaultRow(
        "Technician",
        "technicianCommissionType",
        "technicianCommissionValue",
      )}

      <Divider />
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          SPECIFIC COMMISSION (a particular doctor / referral / technician)
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          Overrides the default for that person on this test. The Commission tab
          shows exactly what each of them is owed.
        </Typography>
      </Box>
      <TestCommissionEditor
        rows={form.commissions}
        onChange={(commissions) => set({ commissions })}
      />
    </Box>
  );
}

"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import { useCreateTest, useDepartments } from "@/hooks/use-departments";
import { getApiErrorMessage } from "@/lib/api-error";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import {
  emptyTestForm,
  TestForm,
  TestFormState,
  toCommissionInputs,
} from "./test-form";

export function CreateTestDialog({
  departmentId,
}: {
  /** Department currently selected on the page — pre-selected in the dialog. */
  departmentId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TestFormState>(emptyTestForm());
  const [error, setError] = useState<string | null>(null);
  const createTest = useCreateTest();

  const { data: departments } = useDepartments();
  const activeDepartments = useMemo(
    () => (departments ?? []).filter((d) => d.status === "Active"),
    [departments],
  );

  function openDialog() {
    setForm(emptyTestForm(departmentId ?? ""));
    setError(null);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.departmentId) {
      setError("Select a department.");
      return;
    }

    let commissions;
    try {
      commissions = toCommissionInputs(form.commissions);
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    createTest.mutate(
      {
        departmentId: form.departmentId,
        name: form.name.trim(),
        price: Number(form.price),
        doctorCommissionType: form.doctorCommissionType,
        doctorCommissionValue: Number(form.doctorCommissionValue) || 0,
        referralCommissionType: form.referralCommissionType,
        referralCommissionValue: Number(form.referralCommissionValue) || 0,
        technicianCommissionType: form.technicianCommissionType,
        technicianCommissionValue: Number(form.technicianCommissionValue) || 0,
        commissions,
      },
      {
        onSuccess: () => setOpen(false),
        onError: (err) =>
          setError(getApiErrorMessage(err, "Could not create the test.")),
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={openDialog}
        startIcon={
          <Box
            sx={{
              display: "flex",
              p: 0.25,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.22)",
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </Box>
        }
        sx={{
          height: 44,
          px: 2.5,
          borderRadius: "12px",
          fontWeight: 700,
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
          color: "#fff",
          background: `linear-gradient(135deg, ${brand.electricBlue} 0%, ${brand.blue} 100%)`,
          boxShadow: `0 8px 18px -6px ${alpha(brand.blue, 0.65)}`,
          transition: "transform .15s, box-shadow .15s, filter .15s",
          "&:hover": {
            background: `linear-gradient(135deg, ${brand.electricBlue} 0%, ${brand.blue} 100%)`,
            filter: "brightness(1.06)",
            transform: "translateY(-1px)",
            boxShadow: `0 12px 22px -6px ${alpha(brand.blue, 0.75)}`,
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: `0 4px 10px -4px ${alpha(brand.blue, 0.6)}`,
          },
        }}
      >
        New Test
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create Test</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            <TestForm
              form={form}
              onChange={setForm}
              departments={activeDepartments}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createTest.isPending}
            >
              {createTest.isPending ? "Creating..." : "Create Test"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}

"use client";

import {
  useDepartments,
  useTestCommissions,
  useUpdateTest,
} from "@/hooks/use-departments";
import { getApiErrorMessage } from "@/lib/api-error";
import { TestCommissionDto, TestDto } from "@/types/department";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useState } from "react";
import { CommissionRow, newCommissionRow } from "./test-commission-editor";
import { TestForm, TestFormState, toCommissionInputs } from "./test-form";

function EditTestBody({
  test,
  savedCommissions,
  onClose,
}: {
  test: TestDto;
  savedCommissions: TestCommissionDto[];
  onClose: () => void;
}) {
  const updateTest = useUpdateTest();
  const { data: departments } = useDepartments();
  const [error, setError] = useState<string | null>(null);

  // Built once, after the saved commissions have loaded.
  const [form, setForm] = useState<TestFormState>(() => ({
    departmentId: test.departmentId,
    name: test.name,
    price: String(test.price),
    status: test.status,
    doctorCommissionType: test.doctorCommissionType,
    doctorCommissionValue: String(test.doctorCommissionValue),
    referralCommissionType: test.referralCommissionType,
    referralCommissionValue: String(test.referralCommissionValue),
    technicianCommissionType: test.technicianCommissionType,
    technicianCommissionValue: String(test.technicianCommissionValue),
    commissions: savedCommissions.map(
      (c): CommissionRow =>
        newCommissionRow({
          entityType: c.entityType,
          entity: { id: c.entityId, name: c.entityName },
          commissionType: c.commissionType,
          commissionValue: String(c.commissionValue),
        }),
    ),
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let commissions;
    try {
      commissions = toCommissionInputs(form.commissions);
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    updateTest.mutate(
      {
        id: test.id,
        data: {
          name: form.name.trim(),
          price: Number(form.price),
          status: form.status,
          doctorCommissionType: form.doctorCommissionType,
          doctorCommissionValue: Number(form.doctorCommissionValue) || 0,
          referralCommissionType: form.referralCommissionType,
          referralCommissionValue: Number(form.referralCommissionValue) || 0,
          technicianCommissionType: form.technicianCommissionType,
          technicianCommissionValue:
            Number(form.technicianCommissionValue) || 0,
          commissions,
        },
      },
      {
        onSuccess: onClose,
        onError: (err) =>
          setError(getApiErrorMessage(err, "Could not update the test.")),
      },
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TestForm
          form={form}
          onChange={setForm}
          departments={(departments ?? []).map((d) => ({
            id: d.id,
            name: d.name,
          }))}
          departmentLocked
          showStatus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={updateTest.isPending}
        >
          {updateTest.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Box>
  );
}

export function EditTestDialog({
  test,
  onClose,
}: {
  test: TestDto | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useTestCommissions(test?.id ?? null);

  return (
    <Dialog open={!!test} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Test</DialogTitle>
      {test && isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {test && isError && (
        <DialogContent>
          <Alert severity="error">
            Could not load this test&apos;s commissions.
          </Alert>
        </DialogContent>
      )}
      {test && data && (
        // key => a different test always starts from fresh form state
        <EditTestBody
          key={test.id}
          test={test}
          savedCommissions={data}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

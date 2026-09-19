"use client";

import { useCreateTest } from "@/hooks/use-departments";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

const commissionTypes = ["Flat", "Percentage"];

export function CreateTestDialog({
  departmentId,
}: {
  departmentId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const createTest = useCreateTest();

  const [form, setForm] = useState({
    name: "",
    price: "",
    doctorCommissionType: "Flat",
    doctorCommissionValue: "0",
    referralCommissionType: "Flat",
    referralCommissionValue: "0",
    technicianCommissionType: "Flat",
    technicianCommissionValue: "0",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departmentId) return;

    createTest.mutate(
      {
        departmentId,
        name: form.name,
        price: Number(form.price),
        doctorCommissionType: form.doctorCommissionType,
        doctorCommissionValue: Number(form.doctorCommissionValue),
        referralCommissionType: form.referralCommissionType,
        referralCommissionValue: Number(form.referralCommissionValue),
        technicianCommissionType: form.technicianCommissionType,
        technicianCommissionValue: Number(form.technicianCommissionValue),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            name: "",
            price: "",
            doctorCommissionType: "Flat",
            doctorCommissionValue: "0",
            referralCommissionType: "Flat",
            referralCommissionValue: "0",
            technicianCommissionType: "Flat",
            technicianCommissionValue: "0",
          });
        },
      },
    );
  }

  const commissionRow = (
    label: string,
    typeKey:
      | "doctorCommissionType"
      | "referralCommissionType"
      | "technicianCommissionType",
    valueKey:
      | "doctorCommissionValue"
      | "referralCommissionValue"
      | "technicianCommissionValue",
  ) => (
    <Box sx={{ display: "flex", gap: 1.5 }}>
      <TextField
        select
        label={`${label} Type`}
        size="small"
        value={form[typeKey]}
        onChange={(e) => setForm({ ...form, [typeKey]: e.target.value })}
        sx={{ flex: 1 }}
      >
        {commissionTypes.map((t) => (
          <MenuItem key={t} value={t}>
            {t}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={`${label} Value`}
        type="number"
        size="small"
        value={form[valueKey]}
        onChange={(e) => setForm({ ...form, [valueKey]: e.target.value })}
        sx={{ flex: 1 }}
      />
    </Box>
  );

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        disabled={!departmentId}
      >
        New Test
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create Test</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Test Name"
                  size="small"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Price"
                  type="number"
                  size="small"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              DOCTOR COMMISSION
            </Typography>
            {commissionRow(
              "Doctor",
              "doctorCommissionType",
              "doctorCommissionValue",
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              REFERRAL COMMISSION
            </Typography>
            {commissionRow(
              "Referral",
              "referralCommissionType",
              "referralCommissionValue",
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              TECHNICIAN COMMISSION
            </Typography>
            {commissionRow(
              "Technician",
              "technicianCommissionType",
              "technicianCommissionValue",
            )}
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

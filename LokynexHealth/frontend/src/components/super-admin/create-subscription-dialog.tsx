"use client";

import {
  useCreateSubscription,
  useLabs,
  usePlans,
} from "@/hooks/use-super-admin";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

export function CreateSubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  const { data: labs } = useLabs({});
  const { data: plans } = usePlans();
  const createSubscription = useCreateSubscription();

  function resetForm() {
    setTenantId("");
    setPlanId("");
    setStartDate("");
    setEndDate("");
    setAmountPaid("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !planId || !startDate || !endDate) return;

    createSubscription.mutate(
      {
        tenantId,
        planId,
        startDate,
        endDate,
        amountPaid: Number(amountPaid || 0),
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Create Subscription
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create Subscription</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {createSubscription.isError && (
              <Alert severity="error">
                Could not create the subscription. Please try again.
              </Alert>
            )}

            <TextField
              select
              label="Lab / Tenant"
              size="small"
              fullWidth
              required
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              {labs?.items.map((lab) => (
                <MenuItem key={lab.id} value={lab.id}>
                  {lab.primaryBranchName} ({lab.labCode})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Plan"
              size="small"
              fullWidth
              required
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              {plans?.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name} — ₹{plan.price} / {plan.billingCycle}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                label="End Date"
                type="date"
                size="small"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Box>

            <TextField
              label="Amount Paid"
              type="number"
              size="small"
              fullWidth
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createSubscription.isPending ||
                !tenantId ||
                !planId ||
                !startDate ||
                !endDate
              }
            >
              {createSubscription.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}

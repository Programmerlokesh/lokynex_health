"use client";

import { usePlans, useUpdateSubscription } from "@/hooks/use-super-admin";
import { SubscriptionDto } from "@/types/super-admin";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["Trial", "Active", "Expired", "Cancelled"];

export function EditSubscriptionDialog({
  subscription,
  onClose,
}: {
  subscription: SubscriptionDto | null;
  onClose: () => void;
}) {
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [status, setStatus] = useState("Active");
  const [autoRenew, setAutoRenew] = useState(true);

  const { data: plans } = usePlans();
  const updateSubscription = useUpdateSubscription();

  // Pre-fill the form whenever a different subscription is opened —
  // works the same whether the subscription is currently Active, Trial,
  // Expired, or Cancelled; nothing here is locked once a status is set.
  useEffect(() => {
    if (subscription) {
      setPlanId(subscription.planId);
      setStartDate(subscription.startDate.slice(0, 10));
      setEndDate(subscription.endDate.slice(0, 10));
      setAmountPaid(String(subscription.amountPaid));
      setStatus(subscription.status);
      setAutoRenew(subscription.autoRenew);
    }
  }, [subscription]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subscription || !planId || !startDate || !endDate) return;

    updateSubscription.mutate(
      {
        id: subscription.id,
        data: {
          planId,
          startDate,
          endDate,
          amountPaid: Number(amountPaid || 0),
          status,
          autoRenew,
        },
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Dialog open={!!subscription} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit Subscription — {subscription?.tenantName}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {updateSubscription.isError && (
            <Alert severity="error">
              Could not save changes. Please try again.
            </Alert>
          )}

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

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
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

          <TextField
            select
            label="Status"
            size="small"
            fullWidth
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
              />
            }
            label="Auto-renew"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              updateSubscription.isPending || !planId || !startDate || !endDate
            }
          >
            {updateSubscription.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

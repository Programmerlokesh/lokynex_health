"use client";

import { useUpdatePlan } from "@/hooks/use-super-admin";
import { PlanDto } from "@/types/super-admin";
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

export function EditPlanDialog({
  plan,
  onClose,
}: {
  plan: PlanDto | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("Monthly");
  const [maxUsers, setMaxUsers] = useState("5");
  const [maxBranches, setMaxBranches] = useState("1");
  const [isActive, setIsActive] = useState(true);

  const updatePlan = useUpdatePlan();

  // Pre-fill the form whenever a different plan is opened for editing.
  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setPrice(String(plan.price));
      setBillingCycle(plan.billingCycle);
      setMaxUsers(String(plan.maxUsers));
      setMaxBranches(String(plan.maxBranches));
      setIsActive(plan.isActive);
    }
  }, [plan]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plan || !name || !price) return;

    updatePlan.mutate(
      {
        id: plan.id,
        data: {
          name,
          price: Number(price),
          billingCycle,
          maxUsers: Number(maxUsers),
          maxBranches: Number(maxBranches),
          isActive,
        },
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Dialog open={!!plan} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Plan</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {updatePlan.isError && (
            <Alert severity="error">
              Could not save changes. Please try again.
            </Alert>
          )}

          <TextField
            label="Plan Name"
            size="small"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Price"
            type="number"
            size="small"
            fullWidth
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <TextField
            select
            label="Billing Cycle"
            size="small"
            fullWidth
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
          >
            <MenuItem value="Monthly">Monthly</MenuItem>
            <MenuItem value="Quarterly">Quarterly</MenuItem>
            <MenuItem value="Yearly">Yearly</MenuItem>
          </TextField>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <TextField
              label="Max Users"
              type="number"
              size="small"
              fullWidth
              required
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
            />
            <TextField
              label="Max Branches"
              type="number"
              size="small"
              fullWidth
              required
              value={maxBranches}
              onChange={(e) => setMaxBranches(e.target.value)}
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label={isActive ? "Active" : "Inactive"}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updatePlan.isPending || !name || !price}
          >
            {updatePlan.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

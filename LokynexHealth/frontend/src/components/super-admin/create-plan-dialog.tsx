"use client";

import { useCreatePlan } from "@/hooks/use-super-admin";
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

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("Monthly");
  const [maxUsers, setMaxUsers] = useState("5");
  const [maxBranches, setMaxBranches] = useState("1");

  const createPlan = useCreatePlan();

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setBillingCycle("Monthly");
    setMaxUsers("5");
    setMaxBranches("1");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) return;

    createPlan.mutate(
      {
        name,
        description: description || undefined,
        price: Number(price),
        billingCycle,
        maxUsers: Number(maxUsers),
        maxBranches: Number(maxBranches),
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
        Create Plan
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create Plan</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {createPlan.isError && (
              <Alert severity="error">
                Could not create the plan. Please try again.
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
              label="Description (optional)"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
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
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createPlan.isPending || !name || !price}
            >
              {createPlan.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}

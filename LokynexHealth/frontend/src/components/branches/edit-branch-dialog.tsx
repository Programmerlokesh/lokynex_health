"use client";

import { useUpdateBranch } from "@/hooks/use-branches";
import { BranchDto } from "@/types/branch";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

export function EditBranchDialog({
  branch,
  open,
  onClose,
}: {
  branch: BranchDto | null;
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState(() => ({
    branchName: branch?.branchName ?? "",
    branchAddress: branch?.branchAddress ?? "",
    branchPincode: branch?.branchPincode ?? "",
    branchPhone: branch?.branchPhone ?? "",
    branchEmail: branch?.branchEmail ?? "",
    status: branch?.status ?? "Active",
  }));

  const updateBranch = useUpdateBranch();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branch) return;
    updateBranch.mutate(
      { id: branch.id, data: form },
      { onSuccess: () => onClose() },
    );
  }

  if (!branch) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Branch</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box>
            <TextField
              label="Branch Code"
              size="small"
              value={branch.branchCode}
              disabled
              fullWidth
            />
            {branch.createdBySuperAdmin && (
              <Chip
                label="Locked — set by SuperAdmin"
                size="small"
                sx={{ mt: 0.75, fontSize: 11 }}
              />
            )}
          </Box>

          <TextField
            label="Branch Name"
            size="small"
            value={form.branchName}
            onChange={(e) => setForm({ ...form, branchName: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Address"
            size="small"
            value={form.branchAddress}
            onChange={(e) =>
              setForm({ ...form, branchAddress: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Pincode"
            size="small"
            value={form.branchPincode}
            onChange={(e) =>
              setForm({ ...form, branchPincode: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Phone"
            size="small"
            value={form.branchPhone}
            onChange={(e) => setForm({ ...form, branchPhone: e.target.value })}
            fullWidth
          />
          <TextField
            label="Email"
            size="small"
            value={form.branchEmail}
            onChange={(e) => setForm({ ...form, branchEmail: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Status"
            size="small"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            fullWidth
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateBranch.isPending}
          >
            {updateBranch.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

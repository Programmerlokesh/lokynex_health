"use client";

import { useBranches } from "@/hooks/use-branches";
import { useCreateTechnician } from "@/hooks/use-directory";
import AddIcon from "@mui/icons-material/Add";
import {
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

export function CreateTechnicianDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    branchId: "",
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });
  const createTechnician = useCreateTechnician();
  const { data: branches } = useBranches({ pageSize: 100 });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTechnician.mutate(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({
          branchId: "",
          fullName: "",
          phone: "",
          email: "",
          address: "",
        });
      },
    });
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Add Technician
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Add Technician</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              select
              label="Branch"
              size="small"
              required
              fullWidth
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              {branches?.items.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branchName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Full Name"
              size="small"
              required
              fullWidth
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <TextField
              label="Phone"
              size="small"
              required
              fullWidth
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <TextField
              label="Email"
              size="small"
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createTechnician.isPending}
            >
              {createTechnician.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}

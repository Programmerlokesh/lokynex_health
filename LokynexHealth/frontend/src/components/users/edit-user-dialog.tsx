"use client";

import { useBranches } from "@/hooks/use-branches";
import { useUpdateUser } from "@/hooks/use-users";
import { UserDto } from "@/types/user";
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
import { useEffect, useState } from "react";

export function EditUserDialog({
  user,
  onClose,
}: {
  user: UserDto | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");

  const { data: branches } = useBranches({ pageSize: 100 });
  const updateUser = useUpdateUser();

  // Pre-fill the form whenever a different user is opened for editing.
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setBranchId(user.branchId ?? "");
    }
  }, [user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    updateUser.mutate(
      {
        id: user.id,
        data: {
          name,
          email,
          phone,
          branchId: branchId || undefined,
        },
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Dialog open={!!user} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit User — {user?.username}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {updateUser.isError && (
            <Alert severity="error">
              Could not save changes. Email may already be in use.
            </Alert>
          )}

          <TextField
            label="Full Name"
            size="small"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            size="small"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Phone"
            size="small"
            fullWidth
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            select
            label="Branch"
            size="small"
            fullWidth
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <MenuItem value="">No Branch</MenuItem>
            {branches?.items.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.branchName}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateUser.isPending || !name || !email || !phone}
          >
            {updateUser.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

"use client";

import { useResetUserPassword } from "@/hooks/use-users";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

// LabAdmin-only: sets a brand-new password for someone else's account. There
// is deliberately no "change my own password" flow anywhere in this app —
// see UpdateOwnProfileCommand on the backend — a user who wants a new
// password has to ask their LabAdmin.
export function ResetPasswordDialog({
  userId,
  username,
  onClose,
}: {
  userId: string | null;
  username?: string;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const resetPassword = useResetUserPassword();

  useEffect(() => {
    if (userId) {
      setNewPassword("");
      resetPassword.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    resetPassword.mutate(
      { id: userId, data: { newPassword } },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog
      open={!!userId}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Reset Password{username ? ` — ${username}` : ""}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <DialogContentText>
            This sets a brand-new password for this user. They will need to use
            it the next time they sign in.
          </DialogContentText>

          {resetPassword.isError && (
            <Alert severity="error">
              Could not reset the password. Please try again.
            </Alert>
          )}

          <TextField
            label="New Password"
            type="password"
            size="small"
            fullWidth
            required
            autoFocus
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 8 characters"
            slotProps={{ htmlInput: { minLength: 8 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={resetPassword.isPending || newPassword.length < 8}
          >
            {resetPassword.isPending ? "Saving..." : "Reset Password"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

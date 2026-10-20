"use client";

import { PasswordTextField } from "@/components/ui/password-field";
import {
  useChangeMySuperAdminPassword,
  useMySuperAdminProfile,
  useUpdateMySuperAdminProfile,
} from "@/hooks/use-super-admin-profile";
import { getApiErrorMessage } from "@/lib/api-error";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

// The SuperAdmin's own "My Profile": edit name / email and change password.
// (The Login ID can't be changed here.)
export function SuperAdminProfilePanel() {
  const { data: me, isLoading, error } = useMySuperAdminProfile();
  const updateProfile = useUpdateMySuperAdminProfile();
  const changePassword = useChangeMySuperAdminPassword();

  const token = useSuperAdminAuthStore((s) => s.token);
  const setAuth = useSuperAdminAuthStore((s) => s.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFormError, setPasswordFormError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (me) {
      setName(me.name);
      setEmail(me.email);
    }
  }, [me]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (error || !me) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(error, "Failed to load your profile.")}
      </Alert>
    );
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.reset();
    updateProfile.mutate(
      { name: name.trim(), email: email.trim() },
      {
        onSuccess: () => {
          // keep the "Welcome, <name>" header in sync
          if (token) setAuth(token, name.trim());
        },
      },
    );
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFormError(null);
    changePassword.reset();

    if (newPassword.length < 8) {
      setPasswordFormError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFormError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordFormError(
        "New password must be different from the current password.",
      );
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        maxWidth: 640,
        width: "100%",
      }}
    >
      {/* ---------- Profile ---------- */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}>
          <Avatar
            sx={{ width: 64, height: 64, bgcolor: "#0f172a", fontSize: 26 }}
          >
            {me.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }} noWrap>
              {me.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              @{me.username}
            </Typography>
            <Chip label="SuperAdmin" size="small" sx={{ mt: 0.5 }} />
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={handleProfileSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
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
              label="Login ID (username)"
              size="small"
              fullWidth
              disabled
              value={me.username}
              helperText="Login ID can't be changed"
            />
          </Box>

          {updateProfile.isError && (
            <Alert severity="error">
              {getApiErrorMessage(
                updateProfile.error,
                "Could not save changes.",
              )}
            </Alert>
          )}
          {updateProfile.isSuccess && (
            <Alert severity="success">Profile updated.</Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={updateProfile.isPending}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* ---------- Change password ---------- */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Change Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Enter your current password, then choose a new one (minimum 8
          characters).
        </Typography>

        <Box
          component="form"
          onSubmit={handlePasswordSubmit}
          autoComplete="off"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <PasswordTextField
            label="Current Password"
            size="small"
            fullWidth
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <PasswordTextField
              label="New Password"
              size="small"
              fullWidth
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordTextField
              label="Confirm New Password"
              size="small"
              fullWidth
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Box>

          {(passwordFormError || changePassword.isError) && (
            <Alert severity="error">
              {passwordFormError ??
                getApiErrorMessage(
                  changePassword.error,
                  "Could not change password.",
                )}
            </Alert>
          )}
          {changePassword.isSuccess && (
            <Alert severity="success">
              Password changed. Use the new password next time you log in.
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={changePassword.isPending}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {changePassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

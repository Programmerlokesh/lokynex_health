"use client";

import {
  useChangeMyPassword,
  useMyProfile,
  useUpdateMyProfile,
} from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api-error";
import { fileToAvatarDataUrl } from "@/lib/image-utils";
import { useAuthStore } from "@/store/auth-store";
import { UpdateOwnProfileRequest } from "@/types/user";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EMPTY_FORM: UpdateOwnProfileRequest = {
  name: "",
  email: "",
  phone: "",
  address: "",
  pincode: "",
  profilePictureUrl: "",
};

// Self-service profile page — any logged-in lab user can edit their own
// name/email/phone/address/pincode and upload their own photo. A LabAdmin
// additionally gets a "Change Password" card (needs the current password).
// Regular staff still have to ask their LabAdmin to reset their password.
export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const changePassword = useChangeMyPassword();
  const role = useAuthStore((s) => s.user?.role);
  const isLabAdmin = role === "LabAdmin";

  const [form, setForm] = useState<UpdateOwnProfileRequest>(EMPTY_FORM);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // password card state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address ?? "",
        pincode: profile.pincode ?? "",
        profilePictureUrl: profile.profilePictureUrl ?? "",
      });
    }
  }, [profile]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate(form);
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // reset so picking the same file again still fires onChange
    e.target.value = "";
    if (!file) return;

    setPhotoError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setForm((f) => ({ ...f, profilePictureUrl: dataUrl }));
      updateProfile.reset();
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Could not use this image.",
      );
    }
  }

  function handleRemovePhoto() {
    setPhotoError(null);
    setForm((f) => ({ ...f, profilePictureUrl: "" }));
    updateProfile.reset();
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

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        size="small"
        edge="end"
        aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
        onClick={() => setShowPasswords((v) => !v)}
      >
        {showPasswords ? (
          <VisibilityOffIcon fontSize="small" />
        ) : (
          <VisibilityIcon fontSize="small" />
        )}
      </IconButton>
    </InputAdornment>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (isError || !profile) {
    return <Alert severity="error">Failed to load your profile.</Alert>;
  }

  const hasPhoto = !!form.profilePictureUrl;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        My Profile
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: 1, maxWidth: 640, width: "100%" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
              mb: 3,
            }}
          >
            <Avatar
              src={form.profilePictureUrl || undefined}
              sx={{ width: 80, height: 80, bgcolor: "#0f172a", fontSize: 30 }}
            >
              {profile.name.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }} noWrap>
                {profile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                @{profile.username}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                {profile.roleName && (
                  <Chip label={profile.roleName} size="small" />
                )}
                {profile.branchName && (
                  <Chip
                    label={profile.branchName}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handlePhotoSelected}
              />
              <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PhotoCameraOutlinedIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {hasPhoto ? "Change photo" : "Upload photo"}
                </Button>
                {hasPhoto && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </Button>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.75 }}
              >
                JPG, PNG or WEBP. Click “Save Changes” below to apply.
              </Typography>
              {photoError && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {photoError}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box
            component="form"
            onSubmit={handleSubmit}
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                label="Email"
                type="email"
                size="small"
                fullWidth
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                label="Phone"
                size="small"
                fullWidth
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <TextField
                label="Pincode"
                size="small"
                fullWidth
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
              <TextField
                label="Address"
                size="small"
                fullWidth
                multiline
                minRows={2}
                sx={{ gridColumn: { sm: "1 / -1" } }}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Box>

            {!isLabAdmin && (
              <Alert severity="info" variant="outlined">
                Want to change your password? Ask your Lab Admin — they can
                reset it from the Users page.
              </Alert>
            )}

            <AnimatePresence>
              {updateProfile.isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error">
                    {getApiErrorMessage(
                      updateProfile.error,
                      "Could not save changes. Email may already be in use.",
                    )}
                  </Alert>
                </motion.div>
              )}
              {updateProfile.isSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="success">Profile updated.</Alert>
                </motion.div>
              )}
            </AnimatePresence>

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
        </CardContent>
      </Card>

      {isLabAdmin && (
        <Card
          sx={{ borderRadius: 3, boxShadow: 1, maxWidth: 640, width: "100%" }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Change Password
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2.5 }}
            >
              Enter your current password, then choose a new one (minimum 8
              characters).
            </Typography>

            <Box
              component="form"
              onSubmit={handlePasswordSubmit}
              autoComplete="off"
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Current Password"
                size="small"
                fullWidth
                required
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                slotProps={{ input: { endAdornment: passwordAdornment } }}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="New Password"
                  size="small"
                  fullWidth
                  required
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  label="Confirm New Password"
                  size="small"
                  fullWidth
                  required
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Box>

              <AnimatePresence>
                {(passwordFormError || changePassword.isError) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert severity="error">
                      {passwordFormError ??
                        getApiErrorMessage(
                          changePassword.error,
                          "Could not change password.",
                        )}
                    </Alert>
                  </motion.div>
                )}
                {changePassword.isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert severity="success">
                      Password changed. Use the new password next time you log
                      in.
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={changePassword.isPending}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {changePassword.isPending
                    ? "Updating..."
                    : "Update Password"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
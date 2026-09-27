"use client";

import { useMyProfile, useUpdateMyProfile } from "@/hooks/use-users";
import { UpdateOwnProfileRequest } from "@/types/user";
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
  TextField,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const EMPTY_FORM: UpdateOwnProfileRequest = {
  name: "",
  email: "",
  phone: "",
  address: "",
  pincode: "",
  profilePictureUrl: "",
};

// Self-service profile page — any logged-in lab user (LabAdmin or a regular
// staff account) can edit their own name/email/phone/address/pincode/photo
// here. There is NO password field: password changes are LabAdmin-only, via
// the Reset Password action on the Users page. See UpdateOwnProfileCommand
// on the backend for why that split exists.
export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [form, setForm] = useState<UpdateOwnProfileRequest>(EMPTY_FORM);

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        My Profile
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: 1, maxWidth: 640 }}>
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
              sx={{ width: 64, height: 64, bgcolor: "#0f172a", fontSize: 24 }}
            >
              {profile.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>{profile.name}</Typography>
              <Typography variant="body2" color="text.secondary">
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
                label="Profile Picture URL"
                size="small"
                fullWidth
                sx={{ gridColumn: { sm: "1 / -1" } }}
                value={form.profilePictureUrl}
                onChange={(e) =>
                  setForm({ ...form, profilePictureUrl: e.target.value })
                }
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

            <Alert severity="info" variant="outlined">
              Want to change your password? Ask your Lab Admin — password
              changes can only be made from the Lab Admin&apos;s account.
            </Alert>

            <AnimatePresence>
              {updateProfile.isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error">
                    Could not save changes. Email may already be in use.
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
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

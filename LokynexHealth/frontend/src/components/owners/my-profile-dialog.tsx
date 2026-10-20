"use client";

import { PasswordTextField } from "@/components/ui/password-field";
import { useUpdateMyOwnerProfile } from "@/hooks/use-owners";
import { getApiErrorMessage } from "@/lib/api-error";
import { fileToAvatarDataUrl } from "@/lib/image-utils";
import { toIndianMobile } from "@/lib/phone";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { OwnerDto } from "@/types/owner";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRef, useState } from "react";

// A staff member editing THEIR OWN details. Role, Login ID and panel access
// are not here — only the SuperAdmin can change those.
export function MyProfileDialog({
  open,
  onClose,
  me,
}: {
  open: boolean;
  onClose: () => void;
  me: OwnerDto;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const fileRef = useRef<HTMLInputElement>(null);

  const sameInitially = !me.whatsappNumber || me.whatsappNumber === me.phone;
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone);
  const [whatsapp, setWhatsapp] = useState(me.whatsappNumber ?? "");
  const [sameAsPhone, setSameAsPhone] = useState(sameInitially);
  const [address, setAddress] = useState(me.address ?? "");
  const [pincode, setPincode] = useState(me.pincode ?? "");
  // undefined = untouched, "" = removed, data URL = new picture
  const [picture, setPicture] = useState<string | undefined>(undefined);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateMyOwnerProfile();
  const session = useOwnerAuthStore((s) => s.owner);
  const token = useOwnerAuthStore((s) => s.token);
  const setAuth = useOwnerAuthStore((s) => s.setAuth);

  const shownPicture =
    picture !== undefined ? picture : (me.profilePictureUrl ?? "");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPicture(await fileToAvatarDataUrl(file, 192));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not use this image.",
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Name is required.");
    const normPhone = toIndianMobile(phone);
    if (!normPhone) return setError("Enter a valid 10-digit mobile number.");

    let wa = normPhone;
    if (!sameAsPhone && whatsapp.trim()) {
      const w = toIndianMobile(whatsapp);
      if (!w) return setError("Enter a valid 10-digit WhatsApp number.");
      wa = w;
    } else if (!sameAsPhone) {
      wa = "";
    }

    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim()))
      return setError("Pincode must be 6 digits.");
    if (newPassword && newPassword.length < 8)
      return setError("New password must be at least 8 characters.");
    if (newPassword && !currentPassword)
      return setError("Enter your current password to set a new one.");

    update.mutate(
      {
        name: name.trim(),
        phone: normPhone,
        whatsappNumber: wa || undefined,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        profilePictureUrl: picture,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      },
      {
        onSuccess: () => {
          // keep the "Welcome, <name>" header in sync
          if (token && session)
            setAuth(token, { ...session, name: name.trim() });
          onClose();
        },
        onError: (err) => setError(getApiErrorMessage(err)),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Edit My Profile</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={shownPicture || undefined}
              sx={{ width: 64, height: 64 }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleFile}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<PhotoCameraOutlinedIcon />}
                onClick={() => fileRef.current?.click()}
              >
                {shownPicture ? "Change photo" : "Add photo"}
              </Button>
              {shownPicture && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setPicture("")}
                >
                  Remove
                </Button>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
              >
                Optional · JPG, PNG or WEBP
              </Typography>
            </Box>
          </Box>

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Login ID (username)"
              size="small"
              value={me.username}
              disabled
              fullWidth
              helperText="Only the SuperAdmin can change this"
            />
            <TextField
              label="Phone Number"
              size="small"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { inputMode: "tel" } }}
            />
            <Box>
              <TextField
                label="WhatsApp Number (optional)"
                size="small"
                value={sameAsPhone ? phone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={sameAsPhone}
                fullWidth
                slotProps={{ htmlInput: { inputMode: "tel" } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">Same as phone number</Typography>
                }
              />
            </Box>
          </Box>

          <TextField
            label="Address"
            size="small"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <TextField
            label="Pincode"
            size="small"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
            sx={{ maxWidth: { sm: 200 } }}
          />

          <Box>
            <Typography sx={{ fontWeight: 700 }}>Change password</Typography>
            <Typography variant="caption" color="text.secondary">
              Leave blank to keep your current password.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <PasswordTextField
              label="Current password"
              size="small"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
            />
            <PasswordTextField
              label="New password"
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              helperText="Minimum 8 characters"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

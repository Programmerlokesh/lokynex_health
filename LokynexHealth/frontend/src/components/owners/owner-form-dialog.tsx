"use client";

import { useCreateOwner, useUpdateOwner } from "@/hooks/use-owners";
import { getApiErrorMessage } from "@/lib/api-error";
import { fileToAvatarDataUrl } from "@/lib/image-utils";
import { toIndianMobile } from "@/lib/phone";
import { OWNER_ROLES, OwnerDto } from "@/types/owner";
import AddIcon from "@mui/icons-material/Add";
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
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRef, useState } from "react";

interface FormState {
  name: string;
  role: string;
  username: string;
  password: string;
  phone: string;
  whatsapp: string;
  sameAsPhone: boolean;
  address: string;
  pincode: string;
  /** undefined = untouched, "" = removed, data URL = new picture */
  picture: string | undefined;
}

function initialState(owner?: OwnerDto): FormState {
  const same =
    !owner || !owner.whatsappNumber || owner.whatsappNumber === owner.phone;
  return {
    name: owner?.name ?? "",
    role: owner?.role ?? "Marketing Team",
    username: owner?.username ?? "",
    password: "",
    phone: owner?.phone ?? "",
    whatsapp: owner?.whatsappNumber ?? "",
    sameAsPhone: same,
    address: owner?.address ?? "",
    pincode: owner?.pincode ?? "",
    picture: undefined,
  };
}

// Create (owner === undefined) and Edit share one form.
export function OwnerFormDialog({
  open,
  onClose,
  owner,
}: {
  open: boolean;
  onClose: () => void;
  owner?: OwnerDto;
}) {
  const isEdit = !!owner;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(() => initialState(owner));
  const [error, setError] = useState<string | null>(null);

  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner(owner?.id ?? null);
  const isPending = createOwner.isPending || updateOwner.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const shownPicture =
    form.picture !== undefined
      ? form.picture
      : (owner?.profilePictureUrl ?? "");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      set("picture", await fileToAvatarDataUrl(file, 192));
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

    const phone = toIndianMobile(form.phone);
    if (!phone) return setError("Enter a valid 10-digit mobile number.");

    let whatsapp = phone;
    if (!form.sameAsPhone && form.whatsapp.trim()) {
      const w = toIndianMobile(form.whatsapp);
      if (!w) return setError("Enter a valid 10-digit WhatsApp number.");
      whatsapp = w;
    } else if (!form.sameAsPhone) {
      whatsapp = ""; // optional and left blank
    }

    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim()))
      return setError("Pincode must be 6 digits.");
    if (!isEdit && form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (isEdit && form.password && form.password.length < 8)
      return setError("New password must be at least 8 characters.");

    const common = {
      name: form.name.trim(),
      role: form.role,
      phone,
      whatsappNumber: whatsapp || undefined,
      address: form.address.trim() || undefined,
      pincode: form.pincode.trim() || undefined,
    };
    const onError = (err: unknown) => setError(getApiErrorMessage(err));

    if (isEdit) {
      updateOwner.mutate(
        {
          ...common,
          profilePictureUrl: form.picture,
          newPassword: form.password || undefined,
        },
        { onSuccess: onClose, onError },
      );
    } else {
      createOwner.mutate(
        {
          ...common,
          username: form.username.trim(),
          password: form.password,
          profilePictureUrl: form.picture || undefined,
        },
        { onSuccess: onClose, onError },
      );
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? "Edit Owner" : "Create Owner"}
      </DialogTitle>
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
              {form.name.charAt(0).toUpperCase()}
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
                  onClick={() => set("picture", "")}
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
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              fullWidth
            />
            <TextField
              select
              label="Role"
              size="small"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              required
              fullWidth
            >
              {OWNER_ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Login ID (username)"
              size="small"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              disabled={isEdit}
              required
              fullWidth
              autoComplete="off"
              helperText={isEdit ? "Login ID cannot be changed" : undefined}
            />
            <TextField
              label={isEdit ? "New password (optional)" : "Password"}
              type="password"
              size="small"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required={!isEdit}
              fullWidth
              autoComplete="new-password"
              helperText="Minimum 8 characters"
            />
            <TextField
              label="Phone Number"
              size="small"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { inputMode: "tel" } }}
            />
            <Box>
              <TextField
                label="WhatsApp Number (optional)"
                size="small"
                value={form.sameAsPhone ? form.phone : form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                disabled={form.sameAsPhone}
                fullWidth
                slotProps={{ htmlInput: { inputMode: "tel" } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={form.sameAsPhone}
                    onChange={(e) => set("sameAsPhone", e.target.checked)}
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
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <TextField
            label="Pincode"
            size="small"
            value={form.pincode}
            onChange={(e) => set("pincode", e.target.value)}
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
            sx={{ maxWidth: { sm: 200 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Create owner"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// Button + dialog. The dialog is mounted only while open, so the form
// always starts clean.
export function CreateOwnerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        New Owner
      </Button>
      {open && <OwnerFormDialog open onClose={() => setOpen(false)} />}
    </>
  );
}
owners - table.tsx;

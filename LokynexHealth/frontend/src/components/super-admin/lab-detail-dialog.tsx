"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import { useLab, useUpdateLab } from "@/hooks/use-super-admin";
import { getApiErrorMessage } from "@/lib/api-error";
import BusinessIcon from "@mui/icons-material/Business";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PersonOutlineIcon from "@mui/icons-material/Person";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PinDropOutlinedIcon from "@mui/icons-material/PinDropOutlined";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

const STATUS_COLOR: Record<
  string,
  "success" | "warning" | "error" | "default"
> = {
  Active: "success",
  Suspended: "warning",
  Inactive: "error",
};

const STATUS_OPTIONS = ["Active", "Inactive", "Suspended"];

type EditForm = {
  primaryBranchName: string;
  primaryBranchAddress: string;
  primaryBranchPhone: string;
  primaryBranchEmail: string;
  primaryBranchPincode: string;
  adminName: string;
  adminPhone: string;
  adminAddress: string;
  adminEmail: string;
  userLimit: string;
  status: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
      <Box sx={{ color: "text.secondary", mt: 0.3 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, wordBreak: "break-word" }}
        >
          {value || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

export function LabDetailDialog({
  labId,
  open,
  onClose,
}: {
  labId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: lab, isLoading } = useLab(labId);
  const updateLab = useUpdateLab(labId);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  useEffect(() => {
    if (lab) {
      setForm({
        primaryBranchName: lab.primaryBranchName,
        primaryBranchAddress: lab.primaryBranchAddress,
        primaryBranchPhone: lab.primaryBranchPhone,
        primaryBranchEmail: lab.primaryBranchEmail,
        primaryBranchPincode: lab.primaryBranchPincode,
        adminName: lab.adminName,
        adminPhone: lab.adminPhone,
        adminAddress: lab.adminAddress ?? "",
        adminEmail: lab.adminEmail,
        userLimit: String(lab.userLimit),
        status: lab.status,
      });
    }
  }, [lab]);

  useEffect(() => {
    if (!open) {
      setEditMode(false);
      updateLab.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function patch(fields: Partial<EditForm>) {
    setForm((prev) => (prev ? { ...prev, ...fields } : prev));
  }

  function handleSave() {
    if (!form) return;
    updateLab.mutate(
      {
        primaryBranchName: form.primaryBranchName,
        primaryBranchAddress: form.primaryBranchAddress,
        primaryBranchPhone: form.primaryBranchPhone,
        primaryBranchEmail: form.primaryBranchEmail,
        primaryBranchPincode: form.primaryBranchPincode,
        adminName: form.adminName,
        adminPhone: form.adminPhone,
        adminAddress: form.adminAddress || undefined,
        adminEmail: form.adminEmail,
        userLimit: Number(form.userLimit),
        status: form.status,
      },
      { onSuccess: () => setEditMode(false) },
    );
  }

  function handleClose() {
    setEditMode(false);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <Box
        sx={{
          bgcolor: brand.navy,
          color: "#fff",
          px: 3,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          sx={{ bgcolor: brand.cyan, color: brand.navy, fontWeight: 700 }}
        >
          {lab ? (
            initials(lab.primaryBranchName)
          ) : (
            <BusinessIcon fontSize="small" />
          )}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {lab?.primaryBranchName ?? (isLoading ? "Loading…" : "Lab")}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {lab?.labCode} · {lab?.subdomain}
          </Typography>
        </Box>
        {lab && !editMode && (
          <Chip
            label={lab.status}
            size="small"
            color={STATUS_COLOR[lab.status] ?? "default"}
            sx={{ fontWeight: 600 }}
          />
        )}
        <IconButton size="small" onClick={handleClose} sx={{ color: "#fff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}
      >
        {updateLab.isError && (
          <Alert severity="error">
            {getApiErrorMessage(updateLab.error, "Could not update the lab.")}
          </Alert>
        )}
        {updateLab.isSuccess && !editMode && (
          <Alert severity="success">Lab details updated.</Alert>
        )}

        {isLoading || !form || !lab ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={28} width="60%" />
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={80} />
          </Stack>
        ) : !editMode ? (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Primary Branch
              </Typography>
              <Stack spacing={1.5}>
                <InfoRow
                  icon={<PinDropOutlinedIcon fontSize="small" />}
                  label="Address"
                  value={lab.primaryBranchAddress}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <InfoRow
                    icon={<PhoneOutlinedIcon fontSize="small" />}
                    label="Phone"
                    value={lab.primaryBranchPhone}
                  />
                  <InfoRow
                    icon={<EmailOutlinedIcon fontSize="small" />}
                    label="Email"
                    value={lab.primaryBranchEmail}
                  />
                </Stack>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Admin Account
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <InfoRow
                    icon={<PersonOutlineIcon fontSize="small" />}
                    label="Name"
                    value={lab.adminName}
                  />
                  <InfoRow
                    icon={<PersonOutlineIcon fontSize="small" />}
                    label="Username"
                    value={lab.adminUsername}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <InfoRow
                    icon={<PhoneOutlinedIcon fontSize="small" />}
                    label="Phone"
                    value={lab.adminPhone}
                  />
                  <InfoRow
                    icon={<EmailOutlinedIcon fontSize="small" />}
                    label="Email"
                    value={lab.adminEmail}
                  />
                </Stack>
              </Stack>
            </Box>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <InfoRow
                icon={<BusinessIcon fontSize="small" />}
                label="User Limit"
                value={String(lab.userLimit)}
              />
              <InfoRow
                icon={<BusinessIcon fontSize="small" />}
                label="Created"
                value={new Date(lab.createdAt).toLocaleDateString()}
              />
              {lab.updatedAt && (
                <InfoRow
                  icon={<BusinessIcon fontSize="small" />}
                  label="Last Updated"
                  value={new Date(lab.updatedAt).toLocaleDateString()}
                />
              )}
            </Stack>

            {lab.extendBranches.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1.5 }}
                  >
                    Additional Branches
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {lab.extendBranches.map((b) => (
                      <Chip
                        key={b.id}
                        label={`${b.branchName} (${b.branchCode})`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Primary Branch
            </Typography>
            <TextField
              label="Branch Name"
              size="small"
              fullWidth
              value={form.primaryBranchName}
              onChange={(e) => patch({ primaryBranchName: e.target.value })}
            />
            <TextField
              label="Branch Address"
              size="small"
              fullWidth
              value={form.primaryBranchAddress}
              onChange={(e) => patch({ primaryBranchAddress: e.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Branch Phone"
                size="small"
                fullWidth
                slotProps={{ htmlInput: { maxLength: 20 } }}
                value={form.primaryBranchPhone}
                onChange={(e) => patch({ primaryBranchPhone: e.target.value })}
              />
              <TextField
                label="Branch Pincode"
                size="small"
                fullWidth
                slotProps={{ htmlInput: { maxLength: 10 } }}
                value={form.primaryBranchPincode}
                onChange={(e) =>
                  patch({ primaryBranchPincode: e.target.value })
                }
              />
            </Stack>
            <TextField
              label="Branch Email"
              type="email"
              size="small"
              fullWidth
              value={form.primaryBranchEmail}
              onChange={(e) => patch({ primaryBranchEmail: e.target.value })}
            />

            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Admin Account
            </Typography>
            <TextField
              label="Admin Name"
              size="small"
              fullWidth
              value={form.adminName}
              onChange={(e) => patch({ adminName: e.target.value })}
            />
            <TextField
              label="Admin Username"
              size="small"
              fullWidth
              disabled
              value={lab.adminUsername}
              helperText="Username can't be changed here"
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Admin Phone"
                size="small"
                fullWidth
                slotProps={{ htmlInput: { maxLength: 20 } }}
                value={form.adminPhone}
                onChange={(e) => patch({ adminPhone: e.target.value })}
              />
              <TextField
                label="Admin Email"
                type="email"
                size="small"
                fullWidth
                value={form.adminEmail}
                onChange={(e) => patch({ adminEmail: e.target.value })}
              />
            </Stack>
            <TextField
              label="Admin Address"
              size="small"
              fullWidth
              value={form.adminAddress}
              onChange={(e) => patch({ adminAddress: e.target.value })}
            />

            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Settings
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="User Limit"
                type="number"
                size="small"
                fullWidth
                value={form.userLimit}
                onChange={(e) => patch({ userLimit: e.target.value })}
              />
              <TextField
                select
                label="Status"
                size="small"
                fullWidth
                value={form.status}
                onChange={(e) => patch({ status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {!lab || isLoading ? null : !editMode ? (
          <>
            <Button onClick={handleClose} color="inherit">
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => setEditMode(true)}
            >
              Edit Details
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setEditMode(false)}
              color="inherit"
              disabled={updateLab.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={
                updateLab.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveIcon fontSize="small" />
                )
              }
              disabled={updateLab.isPending}
              onClick={handleSave}
            >
              {updateLab.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

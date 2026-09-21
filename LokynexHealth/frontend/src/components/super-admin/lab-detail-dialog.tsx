"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import {
  SubscriptionChip,
  formatDate,
} from "@/components/super-admin/subscription-status";
import {
  useAddLabBranch,
  useDeleteLabBranch,
  useLab,
  useSendRenewalReminder,
  useUpdateLab,
} from "@/hooks/use-super-admin";
import { getApiErrorMessage } from "@/lib/api-error";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PersonOutlineIcon from "@mui/icons-material/Person";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PinDropOutlinedIcon from "@mui/icons-material/PinDropOutlined";
import SaveIcon from "@mui/icons-material/Save";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
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

type BranchForm = {
  branchName: string;
  branchCode: string;
  branchAddress: string;
  branchPincode: string;
  branchPhone: string;
};

const EMPTY_BRANCH: BranchForm = {
  branchName: "",
  branchCode: "",
  branchAddress: "",
  branchPincode: "",
  branchPhone: "",
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
  const addBranch = useAddLabBranch(labId);
  const deleteBranch = useDeleteLabBranch(labId);
  const sendReminder = useSendRenewalReminder(labId);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<BranchForm>(EMPTY_BRANCH);

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
      setBranchFormOpen(false);
      setBranchForm(EMPTY_BRANCH);
      updateLab.reset();
      addBranch.reset();
      deleteBranch.reset();
      sendReminder.reset();
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

  function handleAddBranch() {
    if (!branchForm.branchName.trim() || !branchForm.branchCode.trim()) return;

    addBranch.mutate(
      {
        branchName: branchForm.branchName.trim(),
        branchCode: branchForm.branchCode.trim(),
        branchAddress: branchForm.branchAddress.trim() || undefined,
        branchPincode: branchForm.branchPincode.trim() || undefined,
        branchPhone: branchForm.branchPhone.trim() || undefined,
      },
      {
        onSuccess: () => {
          setBranchForm(EMPTY_BRANCH);
          setBranchFormOpen(false);
        },
      },
    );
  }

  function handleClose() {
    setEditMode(false);
    setBranchFormOpen(false);
    onClose();
  }

  const branchFormValid =
    branchForm.branchName.trim().length > 0 &&
    branchForm.branchCode.trim().length > 0;

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
        {addBranch.isError && (
          <Alert severity="error">
            {getApiErrorMessage(addBranch.error, "Could not add the branch.")}
          </Alert>
        )}
        {deleteBranch.isError && (
          <Alert severity="error">
            {getApiErrorMessage(
              deleteBranch.error,
              "Could not remove the branch.",
            )}
          </Alert>
        )}
        {sendReminder.isError && (
          <Alert severity="error">
            {getApiErrorMessage(
              sendReminder.error,
              "Could not send the renewal reminder.",
            )}
          </Alert>
        )}
        {sendReminder.isSuccess && (
          <Alert severity="success">
            Renewal reminder sent. It will appear in this lab&apos;s
            notification inbox.
          </Alert>
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

            <Divider />

            {/* ---------- Subscription ---------- */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Subscription
                </Typography>
                <SubscriptionChip subscription={lab.subscription} />
              </Box>

              {lab.subscription ? (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <InfoRow
                        icon={<WorkspacePremiumOutlinedIcon fontSize="small" />}
                        label="Plan"
                        value={lab.subscription.planName}
                      />
                      <InfoRow
                        icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                        label="Status"
                        value={lab.subscription.effectiveStatus}
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <InfoRow
                        icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                        label="Started"
                        value={formatDate(lab.subscription.startDate)}
                      />
                      <InfoRow
                        icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                        label={
                          lab.subscription.isExpired
                            ? "Expired on"
                            : "Expires on"
                        }
                        value={formatDate(lab.subscription.endDate)}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              ) : (
                <Alert severity="warning" sx={{ mb: 0 }}>
                  This lab has no subscription on record. Create one from the
                  Subscriptions tab.
                </Alert>
              )}

              {/* The reminder button only appears when there is something to
                  remind about — sending "you expire in 340 days" is noise. */}
              {lab.subscription &&
                (lab.subscription.isExpired ||
                  lab.subscription.isExpiringSoon) && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color={lab.subscription.isExpired ? "error" : "warning"}
                    startIcon={
                      sendReminder.isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <NotificationsActiveOutlinedIcon fontSize="small" />
                      )
                    }
                    disabled={sendReminder.isPending}
                    onClick={() => sendReminder.mutate({})}
                    sx={{ mt: 1.5 }}
                  >
                    {sendReminder.isPending
                      ? "Sending..."
                      : "Send renewal reminder to this lab"}
                  </Button>
                )}
            </Box>

            <Divider />

            {/* ---------- Branches ---------- */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Additional Branches ({lab.extendBranches.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => setBranchFormOpen((v) => !v)}
                >
                  {branchFormOpen ? "Cancel" : "Add Branch"}
                </Button>
              </Box>

              <Collapse in={branchFormOpen} unmountOnExit>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Branch Name"
                        size="small"
                        fullWidth
                        required
                        value={branchForm.branchName}
                        onChange={(e) =>
                          setBranchForm((f) => ({
                            ...f,
                            branchName: e.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Branch Code"
                        size="small"
                        fullWidth
                        required
                        slotProps={{ htmlInput: { maxLength: 20 } }}
                        helperText="Must be unique within this lab"
                        value={branchForm.branchCode}
                        onChange={(e) =>
                          setBranchForm((f) => ({
                            ...f,
                            branchCode: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </Stack>
                    <TextField
                      label="Branch Address"
                      size="small"
                      fullWidth
                      value={branchForm.branchAddress}
                      onChange={(e) =>
                        setBranchForm((f) => ({
                          ...f,
                          branchAddress: e.target.value,
                        }))
                      }
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Branch Phone"
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { maxLength: 20 } }}
                        value={branchForm.branchPhone}
                        onChange={(e) =>
                          setBranchForm((f) => ({
                            ...f,
                            branchPhone: e.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Branch Pincode"
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { maxLength: 10 } }}
                        value={branchForm.branchPincode}
                        onChange={(e) =>
                          setBranchForm((f) => ({
                            ...f,
                            branchPincode: e.target.value,
                          }))
                        }
                      />
                    </Stack>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!branchFormValid || addBranch.isPending}
                      startIcon={
                        addBranch.isPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <AddIcon fontSize="small" />
                        )
                      }
                      onClick={handleAddBranch}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {addBranch.isPending ? "Adding..." : "Save Branch"}
                    </Button>
                  </Stack>
                </Paper>
              </Collapse>

              {lab.extendBranches.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No additional branches yet.
                </Typography>
              ) : (
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  {lab.extendBranches.map((b) => (
                    <Tooltip
                      key={b.id}
                      title={
                        [b.branchAddress, b.branchPincode, b.branchPhone]
                          .filter(Boolean)
                          .join(" · ") || "No contact details"
                      }
                    >
                      <Chip
                        label={`${b.branchName} (${b.branchCode})`}
                        variant="outlined"
                        size="small"
                        deleteIcon={<DeleteOutlineIcon />}
                        disabled={deleteBranch.isPending}
                        onDelete={() => deleteBranch.mutate(b.id)}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              )}
            </Box>
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

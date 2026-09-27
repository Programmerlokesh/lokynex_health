"use client";

import { PermissionGrid } from "@/components/users/permission-grid";
import { useBranches } from "@/hooks/use-branches";
import { useRoles } from "@/hooks/use-roles";
import {
  useUpdateUser,
  useUpdateUserPermissions,
  useUserPermissions,
} from "@/hooks/use-users";
import { ModulePermissionInput, UserDto } from "@/types/user";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
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
  const [roleId, setRoleId] = useState("");
  const [permissions, setPermissions] = useState<ModulePermissionInput[]>([]);

  const { data: branches } = useBranches({ pageSize: 100 });
  const { data: roles } = useRoles();
  const { data: userPermissions, isLoading: isLoadingPermissions } =
    useUserPermissions(user?.id ?? null);

  const updateUser = useUpdateUser();
  const updatePermissions = useUpdateUserPermissions();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Pre-fill the form whenever a different user is opened for editing.
  // (Previously this effect was commented out, which left every field blank
  // on open — editing a user without retyping every value would have wiped
  // their name/email/phone with empty strings.)
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setBranchId(user.branchId ?? "");
    }
  }, [user]);

  // Pre-fill role + the permission grid once the user's current grid loads.
  useEffect(() => {
    if (userPermissions) {
      setRoleId(userPermissions.roleId ?? "");
      setPermissions(
        userPermissions.permissions.map((p) => ({
          moduleId: p.moduleId,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        })),
      );
    }
  }, [userPermissions]);

  const isSaving = updateUser.isPending || updatePermissions.isPending;
  const hasError = updateUser.isError || updatePermissions.isError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    await updateUser.mutateAsync({
      id: user.id,
      data: {
        name,
        email,
        phone,
        branchId: branchId || undefined,
      },
    });

    await updatePermissions.mutateAsync({
      id: user.id,
      data: {
        roleId: roleId || undefined,
        permissions: permissions.filter(
          (p) => p.canView || p.canCreate || p.canEdit || p.canDelete,
        ),
      },
    });

    onClose();
  }

  return (
    <Dialog
      open={!!user}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit User — {user?.username}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {hasError && (
            <Alert severity="error">
              Could not save changes. Email may already be in use.
            </Alert>
          )}

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
            <TextField
              select
              label="Role"
              size="small"
              fullWidth
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <MenuItem value="">No Role</MenuItem>
              {roles?.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Divider />

          {isLoadingPermissions ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : (
            <PermissionGrid value={permissions} onChange={setPermissions} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !name || !email || !phone}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

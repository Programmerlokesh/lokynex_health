"use client";

import { PermissionGrid } from "@/components/users/permission-grid";
import { useBranches } from "@/hooks/use-branches";
import { useRoles } from "@/hooks/use-roles";
import { useCreateUser } from "@/hooks/use-users";
import { ModulePermissionInput } from "@/types/user";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
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
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
  branchId: "",
};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permissions, setPermissions] = useState<ModulePermissionInput[]>([]);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: roles, isError: isRolesError } = useRoles();
  const { data: branches, isError: isBranchesError } = useBranches({
    pageSize: 100,
  });
  const createUser = useCreateUser();

  function resetAndClose() {
    setOpen(false);
    setForm(EMPTY_FORM);
    setPermissions([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createUser.mutate(
      {
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        roleId: form.roleId || undefined,
        branchId: form.branchId || undefined,
        // Only send modules the LabAdmin actually granted at least View on —
        // an all-false row is the same as no access, so it's dropped here.
        permissions: permissions.filter(
          (p) => p.canView || p.canCreate || p.canEdit || p.canDelete,
        ),
      },
      { onSuccess: resetAndClose },
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{ display: "inline-block" }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          New User
        </Button>
      </motion.div>

      <Dialog
        open={open}
        onClose={resetAndClose}
        fullWidth
        maxWidth="sm"
        fullScreen={fullScreen}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create User</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Username"
                size="small"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                size="small"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Phone"
                size="small"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                size="small"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                fullWidth
                helperText="Minimum 8 characters"
                slotProps={{ htmlInput: { minLength: 8 } }}
              />
              <TextField
                select
                label="Role"
                size="small"
                fullWidth
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                helperText="Decides what this user is for — access is set below"
              >
                <MenuItem value="">No Role</MenuItem>
                {roles?.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Branch"
                size="small"
                fullWidth
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                <MenuItem value="">No Branch</MenuItem>
                {branches?.items.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.branchName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {isRolesError && (
              <Alert severity="warning">
                Could not load the list of roles.
              </Alert>
            )}
            {isBranchesError && (
              <Alert severity="warning">
                Could not load the list of branches.
              </Alert>
            )}

            <Divider />

            <PermissionGrid value={permissions} onChange={setPermissions} />

            <AnimatePresence>
              {createUser.isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error">
                    Failed to create user. Username or email may already exist.
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={resetAndClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createUser.isPending}
            >
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}

"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import {
  ConfirmDialog,
  EmptyState,
  StatusChip,
  useDialogFullScreen,
  useToast,
} from "@/components/clinic/clinic-ui";
import {
  useClinicMe,
  useClinicRolesMeta,
  useClinicUserMutations,
  useClinicUsers,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import type { ClinicRolesMeta, ClinicUser } from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockResetIcon from "@mui/icons-material/LockReset";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

/** One row per module, one checkbox per action. Ticking create/edit/delete also ticks view. */
function PermissionMatrix({
  meta,
  value,
  onChange,
}: {
  meta: ClinicRolesMeta;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const set = new Set(value);
  const toggle = (m: string, a: string) => {
    const next = new Set(value);
    const key = `${m}:${a}`;
    if (next.has(key)) {
      next.delete(key);
      if (a === "view") meta.actions.forEach((x) => next.delete(`${m}:${x}`));
    } else {
      next.add(key);
      if (a !== "view") next.add(`${m}:view`);
    }
    onChange([...next]);
  };
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflowX: "auto",
      }}
    >
      <Box sx={{ minWidth: 360 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `1.6fr repeat(${meta.actions.length}, 1fr)`,
            px: 1.5,
            py: 0.75,
            fontSize: 12,
            fontWeight: 800,
            color: "text.secondary",
          }}
        >
          <span>MODULE</span>
          {meta.actions.map((a) => (
            <span
              key={a}
              style={{ textAlign: "center", textTransform: "uppercase" }}
            >
              {a}
            </span>
          ))}
        </Box>
        {meta.modules.map((m) => (
          <Box
            key={m}
            sx={{
              display: "grid",
              gridTemplateColumns: `1.6fr repeat(${meta.actions.length}, 1fr)`,
              px: 1.5,
              alignItems: "center",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" fontWeight={700}>
              {meta.moduleLabels[m] ?? m}
            </Typography>
            {meta.actions.map((a) => (
              <Box key={a} sx={{ textAlign: "center" }}>
                <Checkbox
                  size="small"
                  checked={set.has(`${m}:${a}`)}
                  onChange={() => toggle(m, a)}
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function UserDialog({
  user,
  onClose,
}: {
  user: ClinicUser | null;
  onClose: () => void;
}) {
  const fullScreen = useDialogFullScreen();
  const { toast, toastNode } = useToast();
  const { data: meta } = useClinicRolesMeta();
  const { create, update } = useClinicUserMutations();
  const [f, setF] = useState({
    name: user?.name ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "Receptionist",
    password: "",
  });
  const [perms, setPerms] = useState<string[]>(
    user?.permissions ?? meta?.rolePresets["Receptionist"] ?? [],
  );
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const pickRole = (role: string) => {
    set("role", role);
    setPerms(meta?.rolePresets[role] ?? []);
  };

  const submit = () => {
    if (!f.name.trim() || !f.phone.trim()) {
      toast("Name and phone are required", "error");
      return;
    }
    const onError = (e: unknown) => toast(getApiErrorMessage(e), "error");
    if (user) {
      update.mutate(
        {
          id: user.id,
          data: {
            name: f.name,
            email: f.email,
            phone: f.phone,
            role: f.role,
            permissions: perms,
          },
        },
        { onSuccess: onClose, onError },
      );
    } else {
      if (f.username.trim().length < 3) {
        toast("Username needs at least 3 characters", "error");
        return;
      }
      if (f.password.length < 8) {
        toast("Password needs at least 8 characters", "error");
        return;
      }
      create.mutate(
        {
          name: f.name,
          username: f.username,
          email: f.email,
          phone: f.phone,
          role: f.role,
          permissions: perms,
          password: f.password,
        },
        { onSuccess: onClose, onError },
      );
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {user ? "Edit user" : "Add user"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Full name *"
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <TextField
            size="small"
            label="Phone *"
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <TextField
            size="small"
            label="Email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <TextField
            select
            size="small"
            label="Role"
            value={f.role}
            onChange={(e) => pickRole(e.target.value)}
          >
            {Object.keys(meta?.rolePresets ?? {}).map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          {!user && (
            <TextField
              size="small"
              label="Username *"
              value={f.username}
              onChange={(e) => set("username", e.target.value)}
              autoComplete="off"
            />
          )}
          {!user && (
            <TextField
              size="small"
              label="Password * (min 8)"
              type="password"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Choosing a role fills the permissions below — you can still tick or
          untick anything.
        </Typography>
        {meta && (
          <PermissionMatrix meta={meta} value={perms} onChange={setPerms} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={create.isPending || update.isPending}
        >
          Save
        </Button>
      </DialogActions>
      {toastNode}
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: ClinicUser;
  onClose: () => void;
}) {
  const { toast, toastNode } = useToast();
  const { resetPassword } = useClinicUserMutations();
  const [pw, setPw] = useState("");
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>
        Reset password — {user.name}
      </DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <TextField
          fullWidth
          size="small"
          type="password"
          label="New password (min 8)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={pw.length < 8 || resetPassword.isPending}
          onClick={() =>
            resetPassword.mutate(
              { id: user.id, pw },
              {
                onSuccess: onClose,
                onError: (e) => toast(getApiErrorMessage(e), "error"),
              },
            )
          }
        >
          Reset
        </Button>
      </DialogActions>
      {toastNode}
    </Dialog>
  );
}

export default function UsersPage() {
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const [search, setSearch] = useState("");
  const q = useDebounce(search.trim(), 300);
  useClinicRolesMeta(); // warm the role presets before the dialog opens
  const { data } = useClinicUsers({ search: q || undefined });
  const { setStatus, remove } = useClinicUserMutations();
  const [edit, setEdit] = useState<ClinicUser | "new" | null>(null);
  const [reset, setReset] = useState<ClinicUser | null>(null);
  const [del, setDel] = useState<ClinicUser | null>(null);
  const canCreate = canDo(me?.permissions, me?.isAdmin, "users", "create");
  const canEdit = canDo(me?.permissions, me?.isAdmin, "users", "edit");
  const canDelete = canDo(me?.permissions, me?.isAdmin, "users", "delete");

  return (
    <>
      <PageTitle
        title="Users"
        subtitle={
          me
            ? `${me.userCount} of ${me.userLimit} users used · decide who gets which role`
            : undefined
        }
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setEdit("new")}
            >
              Add user
            </Button>
          )
        }
      />
      <TextField
        size="small"
        placeholder="Search users"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 420 }}
        fullWidth
      />
      {!data?.items.length ? (
        <EmptyState text="No users yet." />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {data.items.map((u) => (
            <Paper
              key={u.id}
              variant="outlined"
              sx={{
                p: 1.75,
                borderRadius: 4,
                opacity: u.status === "Active" ? 1 : 0.6,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={800} noWrap>
                    {u.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    @{u.username} · {u.phone}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.75,
                      mt: 0.75,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={u.role}
                    />
                    <StatusChip status={u.status} />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${u.permissions.length} permissions`}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  {canEdit && (
                    <Switch
                      size="small"
                      checked={u.status === "Active"}
                      onChange={(_, v) =>
                        setStatus.mutate(
                          { id: u.id, isActive: v },
                          {
                            onError: (e) =>
                              toast(getApiErrorMessage(e), "error"),
                          },
                        )
                      }
                    />
                  )}
                </Box>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}
              >
                {canEdit && (
                  <Tooltip title="Edit role & permissions">
                    <IconButton size="small" onClick={() => setEdit(u)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canEdit && (
                  <Tooltip title="Reset password">
                    <IconButton size="small" onClick={() => setReset(u)}>
                      <LockResetIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDel(u)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      {edit && (
        <UserDialog
          key={edit === "new" ? "new" : edit.id}
          user={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
        />
      )}
      {reset && (
        <ResetPasswordDialog user={reset} onClose={() => setReset(null)} />
      )}
      <ConfirmDialog
        open={!!del}
        title="Delete user?"
        danger
        confirmLabel="Delete"
        busy={remove.isPending}
        text={
          del
            ? `${del.name} (@${del.username}) will lose access immediately.`
            : ""
        }
        onClose={() => setDel(null)}
        onConfirm={() =>
          del &&
          remove.mutate(del.id, {
            onSuccess: () => {
              setDel(null);
              toast("User deleted");
            },
            onError: (e) => {
              setDel(null);
              toast(getApiErrorMessage(e), "error");
            },
          })
        }
      />
      {toastNode}
    </>
  );
}

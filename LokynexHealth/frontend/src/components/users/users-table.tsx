"use client";

import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { useDeleteUser, useToggleUserStatus } from "@/hooks/use-users";
import { useAuthStore } from "@/store/auth-store";
import { UserDto } from "@/types/user";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";

export function UsersTable({ users }: { users: UserDto[] }) {
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [resettingUser, setResettingUser] = useState<UserDto | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserDto | null>(null);

  const currentUserId = useAuthStore((s) => s.user?.userId);
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();

  if (users.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No users found.
      </Typography>
    );
  }

  function handleConfirmDelete() {
    if (!deletingUser) return;
    deleteUser.mutate(deletingUser.id, {
      onSuccess: () => setDeletingUser(null),
    });
  }

  return (
    <>
      {/* overflowX: auto keeps this readable on a phone by scrolling the
          table sideways instead of squeezing every column unreadably small. */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: 1, overflowX: "auto" }}
      >
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, i) => {
              const isSelf = user.id === currentUserId;
              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  style={{ display: "table-row" }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.roleName ?? "—"}</TableCell>
                  <TableCell>{user.branchName ?? "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      color={user.status === "Active" ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => setEditingUser(user)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Password">
                      <IconButton
                        size="small"
                        onClick={() => setResettingUser(user)}
                      >
                        <VpnKeyOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        isSelf ? "You can't delete your own account" : "Delete"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isSelf}
                          onClick={() => setDeletingUser(user)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        isSelf
                          ? "You can't deactivate your own account"
                          : user.status === "Active"
                            ? "Deactivate"
                            : "Activate"
                      }
                    >
                      <span>
                        <Switch
                          size="small"
                          checked={user.status === "Active"}
                          disabled={isSelf || toggleStatus.isPending}
                          onChange={(e) =>
                            toggleStatus.mutate({
                              id: user.id,
                              data: { isActive: e.target.checked },
                            })
                          }
                        />
                      </span>
                    </Tooltip>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <EditUserDialog
        key={editingUser?.id ?? "closed"}
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />

      <ResetPasswordDialog
        key={resettingUser?.id ?? "reset-closed"}
        userId={resettingUser?.id ?? null}
        username={resettingUser?.username}
        onClose={() => setResettingUser(null)}
      />

      <Dialog
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently delete <strong>{deletingUser?.name}</strong> (
            {deletingUser?.username})? This removes their login and cannot be
            undone. To keep their order/audit history but block access instead,
            use the status toggle to deactivate them.
          </DialogContentText>
          {deleteUser.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Could not delete this user. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeletingUser(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

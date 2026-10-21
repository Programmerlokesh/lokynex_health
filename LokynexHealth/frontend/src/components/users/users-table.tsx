"use client";

import { Avatar, EmptyState, kitCardSx, StatusPill } from "@/components/common/page-kit";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { useDeleteUser, useToggleUserStatus } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/store/auth-store";
import { UserDto } from "@/types/user";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
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
  const [statusError, setStatusError] = useState<string | null>(null);

  const currentUserId = useAuthStore((s) => s.user?.userId);
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();

  if (users.length === 0) {
    return <EmptyState text="No users found." />;
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
        sx={{ ...kitCardSx, boxShadow: "0 6px 20px rgba(23,43,77,0.05)", overflowX: "auto" }}
      >
        <Table sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover", "& th": { fontSize: 12.5, color: "text.secondary", borderBottom: 1, borderColor: "divider" } }}>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
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
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Avatar name={user.name} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                          {user.name}
                          {isSelf && (
                            <Chip label="You" size="small" color="primary" sx={{ ml: 0.75, height: 18, fontSize: 11 }} />
                          )}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          @{user.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{user.email}</Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{user.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={user.roleName ?? "No role"} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{user.branchName ?? "—"}</TableCell>
                  <TableCell>
                    <StatusPill active={user.status === "Active"} label={user.status} />
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
                            toggleStatus.mutate(
                              {
                                id: user.id,
                                data: { isActive: e.target.checked },
                              },
                              {
                                onError: (err) =>
                                  setStatusError(
                                    getApiErrorMessage(
                                      err,
                                      "Could not update this user's status.",
                                    ),
                                  ),
                              },
                            )
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

      <Snackbar
        open={!!statusError}
        autoHideDuration={6000}
        onClose={() => setStatusError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setStatusError(null)}
          sx={{ width: "100%" }}
        >
          {statusError}
        </Alert>
      </Snackbar>

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
              {getApiErrorMessage(
                deleteUser.error,
                "Could not delete this user. Please try again.",
              )}
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
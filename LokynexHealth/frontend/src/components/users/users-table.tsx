"use client";

import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { useToggleUserStatus } from "@/hooks/use-users";
import { useAuthStore } from "@/store/auth-store";
import { UserDto } from "@/types/user";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Chip,
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
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const toggleStatus = useToggleUserStatus();

  if (users.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No users found.
      </Typography>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
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
                  <TableCell>{user.branchName ?? "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      color={user.status === "Active" ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => setEditingUser(user)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
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
    </>
  );
}
